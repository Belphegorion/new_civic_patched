const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config({
  cloud_name: process.env.BACKEND_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.BACKEND_CLOUDINARY_API_KEY,
  api_secret: process.env.BACKEND_CLOUDINARY_API_SECRET,
});

const uploadFromBuffer = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({
      folder: options.folder || 'civic_reports',
      resource_type: options.resource_type || 'auto',
      public_id: options.public_id,
    }, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

const deleteFromCloudinary = (publicId, resourceType = 'image') => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, { resource_type: resourceType }, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
  });
};

module.exports = { uploadFromBuffer, deleteFromCloudinary };
