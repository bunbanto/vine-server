require('dotenv').config();
const cloudinary = require('cloudinary').v2;

const requiredEnv = ['CLOUD_NAME', 'API_KEY', 'API_SECRET'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  console.error(`Missing Cloudinary env variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const testImage =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=';

const run = async () => {
  const ping = await cloudinary.api.ping();
  console.log(`Cloudinary ping: ${ping.status || 'ok'}`);

  const uploaded = await cloudinary.uploader.upload(testImage, {
    folder: 'wines/diagnostics',
    public_id: `check-${Date.now()}`,
    overwrite: false,
    resource_type: 'image',
  });

  console.log('Upload: ok');
  console.log(`URL: ${uploaded.secure_url}`);

  const destroyed = await cloudinary.uploader.destroy(uploaded.public_id, {
    resource_type: 'image',
  });

  console.log(`Cleanup: ${destroyed.result}`);
};

run().catch((error) => {
  console.error(
    `Cloudinary check failed: ${error.http_code || ''} ${error.message}`,
  );
  process.exit(1);
});
