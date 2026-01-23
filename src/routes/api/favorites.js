const express = require('express');
const ctrl = require('../../controllers/favorites');
const authenticate = require('../../middlewares/auth');

const router = express.Router();

const ctrlWrapper = (ctrl) => {
  return async (req, res, next) => {
    try {
      await ctrl(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

// Всі роути потребують автентифікації
router.get('/', authenticate, ctrlWrapper(ctrl.getFavorites));
router.post('/:id', authenticate, ctrlWrapper(ctrl.toggleFavorite));
router.get('/:id', authenticate, ctrlWrapper(ctrl.checkFavorite));

module.exports = router;
