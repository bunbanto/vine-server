const express = require('express');
const ctrl = require('../../controllers/auth');
const authenticate = require('../../middlewares/auth');
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

router.post('/register', ctrlWrapper(ctrl.register));
router.post('/login', ctrlWrapper(ctrl.login));
router.get('/profile', authenticate, ctrlWrapper(ctrl.getProfile));

module.exports = router;
