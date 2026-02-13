const express = require('express');
const ctrl = require('../../controllers/favorites');
const authenticate = require('../../middlewares/auth');
const { validateQuery, validateParams } = require('../../middlewares/validate');
const {
  favoriteCardIdParamsSchema,
  favoritesQuerySchema,
} = require('../../validation/favorites');

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
router.get(
  '/',
  authenticate,
  validateQuery(favoritesQuerySchema),
  ctrlWrapper(ctrl.getFavorites),
);
router.post(
  '/:id',
  authenticate,
  validateParams(favoriteCardIdParamsSchema),
  ctrlWrapper(ctrl.toggleFavorite),
);
router.get(
  '/:id',
  authenticate,
  validateParams(favoriteCardIdParamsSchema),
  ctrlWrapper(ctrl.checkFavorite),
);

module.exports = router;
