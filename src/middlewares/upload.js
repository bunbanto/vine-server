const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const createHttpError = require('../utils/httpError');

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      cb(createHttpError(400, 'Only JPG, PNG, and WEBP images are allowed'));
      return;
    }

    cb(null, true);
  },
});

const uploadToCloudinary = async (req, res, next) => {
  if (!req.file) {
    next();
    return;
  }

  try {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'wines',
          resource_type: 'image',
        },
        (error, response) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(response);
        },
      );

      stream.end(req.file.buffer);
    });

    req.file.path = result.secure_url;
    req.file.filename = result.public_id;
    next();
  } catch (error) {
    next(createHttpError(502, 'Failed to upload image'));
  }
};

module.exports = {
  upload,
  uploadToCloudinary,
};
