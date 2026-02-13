const express = require('express');
const logger = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRouter = require('./routes/api/auth');
const cardsRouter = require('./routes/api/cards');
const favoritesRouter = require('./routes/api/favorites');

const app = express();

const formatsLogger = app.get('env') === 'development' ? 'dev' : 'short';

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
});
app.use(limiter);

// CORS configuration
// Get allowed origins from environment variable or use defaults
const getAllowedOrigins = () => {
  const envOrigins = process.env.CORS_ORIGINS?.split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  // Default origins for local development + production deploy
  const defaultOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://wine-server-b5gr.onrender.com',
  ];

  // If CORS_ORIGINS is set, use it; otherwise use defaults
  return envOrigins && envOrigins.length > 0 ? envOrigins : defaultOrigins;
};

const allowedOrigins = getAllowedOrigins();

app.use(
  cors({
    origin: function (origin, callback) {
      // Дозволити запити без origin (наприклад, мобільні додатки, Postman, curl)
      if (!origin) return callback(null, true);

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // Allow all Vercel preview and production domains
        if (
          origin.match(/^https:\/\/.*\.vercel\.app$/) ||
          origin.match(/^https:\/\/vercel\.app$/)
        ) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
    exposedHeaders: ['Content-Length', 'X-Requested-With'],
    optionsSuccessStatus: 200, // Деякі старі браузери потребують цього
  }),
);

app.use(logger(formatsLogger));
app.use(express.json());

app.use('/auth', authRouter);
app.use('/cards', cardsRouter);
app.use('/favorites', favoritesRouter);

app.use((req, res) => {
  res.status(404).json({ message: 'Page Not found' });
});

app.use((err, req, res, next) => {
  let { status = 500, message = 'Server error', details } = err;

  if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid identifier format';
  }

  if (err.name === 'ValidationError') {
    status = 400;
    message = err.message;
  }

  if (err.code === 11000) {
    status = 409;
    const duplicatedField = Object.keys(err.keyPattern || {})[0] || 'field';
    message = `${duplicatedField} already exists`;
  }

  if (err.name === 'MulterError') {
    status = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'Image size cannot exceed 5MB';
    } else {
      message = err.message;
    }
  }

  const response = { message };
  if (details) {
    response.details = details;
  }

  res.status(status).json(response);
});

module.exports = app;
// Express app setup
