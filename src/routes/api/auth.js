const express = require('express');
const ctrl = require('../../controllers/auth');
const authenticate = require('../../middlewares/auth');
const { validateBody } = require('../../middlewares/validate');
const { registerSchema, loginSchema, googleAuthSchema } = require('../../validation/auth');
const router = express.Router();

// Обгортка для відлову помилок (try/catch)
const ctrlWrapper = (ctrl) => {
  return async (req, res, next) => {
    try {
      await ctrl(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

router.post('/register', validateBody(registerSchema), ctrlWrapper(ctrl.register));
router.post('/login', validateBody(loginSchema), ctrlWrapper(ctrl.login));
router.post('/google', validateBody(googleAuthSchema), ctrlWrapper(ctrl.googleAuth));
router.get('/profile', authenticate, ctrlWrapper(ctrl.getProfile));

module.exports = router;
