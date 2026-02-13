const app = require('./index');
const connectDB = require('./db/connection');

const { PORT = 4000 } = process.env;
const HOST = process.env.HOST || 'localhost';
const EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, HOST, () => {
      const serverUrl = EXTERNAL_URL || `http://${HOST}:${PORT}`;
      console.log(`Server running at: ${serverUrl}`);
    });
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

startServer();
// Server entry point
