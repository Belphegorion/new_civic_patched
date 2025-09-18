// backend/services/aiService.js
/**
 * AI image analysis service
 *
 * - classify image using MobileNet (tfjs)
 * - compute a damage-area heuristic using Sobel edge detection on a resized greyscale image (sharp)
 * - compute a severity score from (topProbability * (0.6 + 0.4 * damageAreaPercent))
 *
 * Returns:
 * {
 *   tags: [{ className, probability }],
 *   determinedCategory: 'Pothole'|'Streetlight Out'|...|'Other',
 *   severityScore: 0..100,          // integer
 *   damageAreaPercent: 0..1        // fraction of pixels that are "edges"
 * }
 *
 * Notes:
 * - This is intended as a lightweight on-prem inference layer for prototyping.
 * - For production / large scale, consider a separate inference service (GPU instances) or an external model API.
 */

const tf = require('@tensorflow/tfjs-node');
const mobilenet = require('@tensorflow-models/mobilenet');
const sharp = require('sharp');
const fetch = require('node-fetch'); // or global fetch on Node >=18

let modelPromise = null;
const loadModel = async () => {
  if (!modelPromise) {
    // Mobilenet v2 (alpha 1.0) is a good tradeoff between accuracy and size
    modelPromise = mobilenet.load({ version: 2, alpha: 1.0 });
  }
  return modelPromise;
};

/**
 * Map mobilenet label text to project categories. This is fuzzy: we use substr matching.
 */
const mapLabelToCategory = (label) => {
  const text = (label || '').toLowerCase();
  if (text.includes('pothole') || text.includes('asphalt') || text.includes('road')) return 'Pothole';
  if (text.includes('streetlight') || text.includes('lamp') || text.includes('light')) return 'Streetlight Out';
  if (text.includes('trash') || text.includes('garbage') || text.includes('bin')) return 'Trash Overflow';
  if (text.includes('graffiti') || text.includes('spray')) return 'Graffiti';
  if (text.includes('water') || text.includes('leak') || text.includes('pipe')) return 'Water Leak';
  if (text.includes('traffic') || text.includes('signal') || text.includes('stoplight')) return 'Traffic Signal';
  if (text.includes('park') || text.includes('bench') || text.includes('playground')) return 'Park Maintenance';
  return 'Other';
};

/**
 * Fetch URL and return Buffer
 */
const fetchImageBuffer = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status} ${res.statusText}`);
  return Buffer.from(await res.arrayBuffer());
};

/**
 * Compute a simple edge-area percent using a Sobel operator on a small grayscale image.
 * Returns fraction [0..1] of pixels above edge threshold.
 *
 * Input:
 *   buffer - image buffer
 *   options: { width } - resize width (keeps aspect)
 */
const computeEdgeAreaPercent = async (buffer, options = {}) => {
  // Resize to a small, fixed size to keep compute bounded.
  const targetWidth = options.width || 160; // small for speed
  // Convert to greyscale and extract raw pixels
  const img = sharp(buffer).greyscale().resize(targetWidth, null, { fit: 'inside' });
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const width = info.width;
  const height = info.height;
  const pixels = data; // Uint8Array of length width*height, greyscale

  // Sobel kernels
  const gx = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const gy = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  let edgeCount = 0;
  const threshold = 60; // tuneable: magnitude above which pixel considered 'edge'
  // iterate skipping border
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sx = 0;
      let sy = 0;
      let k = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++, k++) {
          const px = pixels[(y + ky) * width + (x + kx)];
          sx += gx[k] * px;
          sy += gy[k] * px;
        }
      }
      const mag = Math.sqrt(sx * sx + sy * sy);
      if (mag > threshold) edgeCount++;
    }
  }

  const total = (width - 2) * (height - 2);
  const frac = total <= 0 ? 0 : edgeCount / total;
  return frac;
};

/**
 * analyzeImage:
 * - image parameter may be Buffer or a URL string
 * - returns tags, determinedCategory, severityScore (0-100), damageAreaPercent (0..1)
 */
const analyzeImage = async (image) => {
  try {
    let buffer;
    if (Buffer.isBuffer(image)) {
      buffer = image;
    } else if (typeof image === 'string') {
      buffer = await fetchImageBuffer(image);
    } else {
      throw new Error('analyzeImage expects a Buffer or URL string');
    }

    // load model
    const model = await loadModel();

    // create tensor using tf.node.decodeImage -> shape [h,w,3]
    const tensor = tf.node.decodeImage(buffer, 3);
    // mobilenet.classify accepts either an image Element or a tensor
    const predictions = await model.classify(tensor, 5); // top 5
    tensor.dispose();

    // normalize predictions: ensure array with {className, probability}
    const tags = (predictions || []).map(p => ({
      className: p.className,
      probability: typeof p.probability === 'number' ? p.probability : (p.score || 0)
    }));

    // pick top prediction
    const top = tags[0] || { className: 'unknown', probability: 0 };

    // map to project category
    const determinedCategory = mapLabelToCategory(top.className);

    // compute damageAreaPercent (edge coverage)
    let damageAreaPercent = 0;
    try {
      damageAreaPercent = await computeEdgeAreaPercent(buffer, { width: 160 });
      // clamp
      if (!isFinite(damageAreaPercent) || damageAreaPercent < 0) damageAreaPercent = 0;
      if (damageAreaPercent > 1) damageAreaPercent = 1;
    } catch (err) {
      // non-fatal; keep damageAreaPercent = 0
      console.warn('computeEdgeAreaPercent failed:', err.message || err);
      damageAreaPercent = 0;
    }

    // severity heuristic:
    // base = top.probability (0..1)
    // severity = base * (0.6 + 0.4 * damageAreaPercent)
    // scale to 0..100
    const base = Math.max(0, Math.min(1, top.probability || 0));
    const severityFloat = base * (0.6 + 0.4 * damageAreaPercent);
    const severityScore = Math.round(Math.min(1, severityFloat) * 100);

    return {
      tags,
      determinedCategory,
      severityScore,
      damageAreaPercent
    };
  } catch (err) {
    console.error('analyzeImage error:', err.message || err);
    // return safe defaults (so callers don't crash)
    return {
      tags: [],
      determinedCategory: 'Other',
      severityScore: 0,
      damageAreaPercent: 0
    };
  }
};

module.exports = {
  analyzeImage,
  // expose internals for tests if needed:
  _internal: { loadModel, computeEdgeAreaPercent, mapLabelToCategory }
};
