const app = require("./index");
const connectDB = require("./db/connection");

const { BACKEND_DOMAIN } = process.env;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(BACKEND_DOMAIN, () => {
      console.log(`Server running. Use our API on port: ${BACKEND_DOMAIN}`);
    });
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

startServer();
// Server entry point
