// backend/services/aiService.js
'use strict';

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');

const MODEL_SERVICE_URL = process.env.MODEL_SERVICE_URL || ''; // internal modelservice (fastapi) e.g. http://modelservice:8000
const HF_API_BASE = (process.env.HUGGINGFACE_API_URL || 'https://api-inference.huggingface.co/models').replace(/\/$/, '');
const HF_MODEL = process.env.HUGGINGFACE_MODEL || 'google/vit-base-patch16-224';
const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN || '';
const HF_TIMEOUT = Number(process.env.HUGGINGFACE_TIMEOUT_MS || 60000);

const REDIS_URL = process.env.REDIS_URL || null;

// Optional redis caching - only used if you initialize a redis client below
let redisClient = null;
if (REDIS_URL && !global.__redis_initialized) {
  try {
    // lazy require ioredis to avoid adding it if you don't want
    const IORedis = require('ioredis');
    redisClient = new IORedis(REDIS_URL);
    global.__redis_initialized = true;
    console.log('Redis cache for AI service enabled.');
  } catch (err) {
    console.warn('ioredis not available or failed to connect. Continuing without cache.');
    redisClient = null;
  }
}

// Lazy local tfjs support
let tf = null;
let localModel = null;
let localAttempted = false;

/** try to load tfjs-node and a local model (if MODEL_LOCAL_PATH set) */
async function tryLoadLocalModel() {
  if (localAttempted) return;
  localAttempted = true;
  try {
    tf = require('@tensorflow/tfjs-node'); // may throw if not installed
    const MODEL_LOCAL_PATH = process.env.MODEL_LOCAL_PATH || '';
    if (!MODEL_LOCAL_PATH) {
      console.warn('tfjs-node found but MODEL_LOCAL_PATH not set — skipping local model load.');
      return;
    }
    // attempt to load either tfjs layers model (model.json) or SavedModel
    const modelJson = path.join(MODEL_LOCAL_PATH, 'model.json');
    if (fs.existsSync(modelJson)) {
      localModel = await tf.loadLayersModel(`file://${modelJson}`);
      console.log('Loaded local TFJS layers model from', modelJson);
    } else {
      // fallback attempt to load saved model (tf.node)
      try {
        localModel = await tf.node.loadSavedModel(MODEL_LOCAL_PATH);
        console.log('Loaded local TF SavedModel from', MODEL_LOCAL_PATH);
      } catch (inner) {
        console.warn('No loadable TF model at MODEL_LOCAL_PATH:', MODEL_LOCAL_PATH);
      }
    }
  } catch (err) {
    tf = null;
    localModel = null;
    console.warn('Local tfjs not available / failed to load:', err.message);
  }
}

/** helper: hash buffer to produce cache key */
function bufferHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/** optional: store/retrieve cache in redis */
async function cacheGet(key) {
  if (!redisClient) return null;
  try {
    const v = await redisClient.get(key);
    return v ? JSON.parse(v) : null;
  } catch (err) {
    console.warn('Redis get error:', err.message);
    return null;
  }
}
async function cacheSet(key, value, ttlSeconds = 3600) {
  if (!redisClient) return;
  try {
    await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (err) {
    console.warn('Redis set error:', err.message);
  }
}

/** Preprocess image buffer -> tensor for common vision models (example: resize 224x224) */
function preprocessImageBufferToTensor(buffer, targetSize = 224) {
  if (!tf) throw new Error('tf not available for preprocessing');
  const decoded = tf.node.decodeImage(buffer, 3); // [h,w,3]
  const resized = tf.image.resizeBilinear(decoded, [targetSize, targetSize]);
  const normalized = resized.toFloat().div(tf.scalar(255.0)).expandDims(0); // [1,h,w,3]
  return normalized;
}

/** Local predict wrapper (depends on your model outputs) */
async function localPredictFromBuffer(buffer) {
  if (!tf) throw new Error('tf not loaded');
  if (!localModel) throw new Error('localModel not loaded');
  const inputTensor = preprocessImageBufferToTensor(buffer, Number(process.env.MODEL_INPUT_SIZE || 224));
  const out = localModel.predict(inputTensor);
  let raw = null;
  if (Array.isArray(out)) {
    raw = await Promise.all(out.map(o => (o.array ? o.array() : o.data())));
  } else if (out.array) {
    raw = await out.array();
  } else if (out.data) {
    raw = await out.data();
  } else {
    raw = out;
  }
  // Minimal normalization: wrap into expected shape
  const result = { raw, source: 'local' };
  // Cleanup if tensors
  try { if (inputTensor.dispose) inputTensor.dispose(); } catch (e) {}
  return result;
}

/** Call your internal model service (fastapi) */
async function remoteModelServicePredict(buffer, filename = 'image.jpg') {
  if (!MODEL_SERVICE_URL) throw new Error('MODEL_SERVICE_URL not configured');
  const url = MODEL_SERVICE_URL.replace(/\/$/, '') + '/analyze';
  // Use axios with multipart/form-data
  const FormData = require('form-data');
  const form = new FormData();
  form.append('file', buffer, { filename, contentType: 'application/octet-stream' });
  const headers = form.getHeaders();
  const resp = await axios.post(url, form, {
    headers,
    timeout: Number(process.env.MODEL_SERVICE_TIMEOUT_MS || 120000)
  });
  return resp.data;
}

/** Call Hugging Face Inference API (binary body) */
async function huggingFacePredict(buffer, model = HF_MODEL, timeout = HF_TIMEOUT) {
  if (!HF_TOKEN) throw new Error('HUGGINGFACE_API_TOKEN not set in env');
  const url = `${HF_API_BASE}/${model}`;
  const headers = {
    Authorization: `Bearer ${HF_TOKEN}`,
    'Content-Type': 'application/octet-stream',
    Accept: 'application/json'
  };

  const resp = await axios.post(url, buffer, { headers, responseType: 'json', timeout });
  return resp.data;
}

/** Normalize different model responses to { label, severity, confidence } */
function normalizeModelOutput(raw) {
  // raw can be many shapes depending on model:
  // - HF classification model: [{label: 'LABEL', score: 0.9}, ...]
  // - detection: dict
  // - custom: { label, severity, confidence }
  try {
    if (!raw) return null;

    // Case A: HF classification array
    if (Array.isArray(raw) && raw.length && raw[0].label && typeof raw[0].score === 'number') {
      const top = raw[0];
      // simple severity mapping: confidence * heuristic
      const confidence = top.score;
      const label = top.label;
      let severity = 0.5;
      // try to parse label for severity keywords
      const l = label.toLowerCase();
      if (l.includes('severe') || l.includes('high') || l.includes('critical')) severity = Math.min(1, 0.8 + confidence * 0.2);
      else if (l.includes('moderate') || l.includes('medium')) severity = 0.5 + confidence * 0.3;
      else if (l.includes('minor') || l.includes('low')) severity = 0.2 + confidence * 0.3;
      else severity = Math.min(1, 0.3 + confidence * 0.7);

      return { label, severity: Number(severity.toFixed(3)), confidence: Number(confidence.toFixed(3)), raw };
    }

    // Case B: already normalized object
    if (raw.label && typeof raw.severity !== 'undefined' && typeof raw.confidence !== 'undefined') {
      return { label: raw.label, severity: Number(raw.severity), confidence: Number(raw.confidence), raw };
    }

    // Case C: HF responses that are objects with scores field (some models)
    if (raw && typeof raw === 'object') {
      // find best label in object -> score map
      const pairs = [];
      for (const k of Object.keys(raw)) {
        const v = raw[k];
        if (Array.isArray(v) && v.length && v[0].label && typeof v[0].score === 'number') {
          pairs.push(...v.map(x => ({ label: x.label, score: x.score })));
        }
      }
      if (pairs.length) {
        pairs.sort((a, b) => b.score - a.score);
        const top = pairs[0];
        const confidence = top.score;
        const label = top.label;
        const severity = Math.min(1, 0.4 + confidence * 0.6);
        return { label, severity: Number(severity.toFixed(3)), confidence: Number(confidence.toFixed(3)), raw };
      }
    }

    // Fallback: stringify and return neutral
    return { label: 'unknown', severity: 0.5, confidence: 0.5, raw };
  } catch (err) {
    console.warn('normalizeModelOutput error:', err.message);
    return { label: 'unknown', severity: 0.5, confidence: 0.5, raw };
  }
}

/**
 * Public: analyzeImageBuffer(buffer)
 * returns { label, severity, confidence, raw, source }
 */
async function analyzeImageBuffer(buffer, opts = {}) {
  if (!buffer || !Buffer.isBuffer(buffer)) throw new Error('Buffer required');

  const cacheKey = `ai:img:${bufferHash(buffer)}`;
  // 1) try cache
  try {
    const cached = await cacheGet(cacheKey);
    if (cached) {
      cached._cached = true;
      return cached;
    }
  } catch (e) {
    // ignore cache errors
  }

  // 2) try local TF model
  await tryLoadLocalModel();
  if (localModel) {
    try {
      const localRaw = await localPredictFromBuffer(buffer);
      const normalized = normalizeModelOutput(localRaw.raw || localRaw);
      normalized.source = 'local';
      await cacheSet(cacheKey, normalized, Number(process.env.AI_CACHE_TTL || 3600));
      return normalized;
    } catch (err) {
      console.warn('local model inference failed:', err.message);
    }
  }

  // 3) try internal model service
  if (MODEL_SERVICE_URL) {
    try {
      const resp = await remoteModelServicePredict(buffer, opts.filename || 'image.jpg');
      const normalized = normalizeModelOutput(resp);
      normalized.source = 'modelservice';
      await cacheSet(cacheKey, normalized, Number(process.env.AI_CACHE_TTL || 3600));
      return normalized;
    } catch (err) {
      console.warn('modelservice inference failed:', err.message);
    }
  }

  // 4) try Hugging Face Inference API
  if (HF_TOKEN) {
    try {
      const hfRaw = await huggingFacePredict(buffer, HF_MODEL, HF_TIMEOUT);
      const normalized = normalizeModelOutput(hfRaw);
      normalized.source = 'huggingface';
      await cacheSet(cacheKey, normalized, Number(process.env.AI_CACHE_TTL || 3600));
      return normalized;
    } catch (err) {
      console.warn('Hugging Face inference failed:', err.message);
    }
  }

  // 5) fallback mock
  console.warn('AI fallback: returning mock result');
  const fallback = { label: 'unknown', severity: 0.5, confidence: 0.5, source: 'mock' };
  await cacheSet(cacheKey, fallback, 60);
  return fallback;
}

module.exports = { analyzeImageBuffer, tryLoadLocalModel };
