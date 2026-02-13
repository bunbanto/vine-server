const express = require('express');
const ctrl = require('../../controllers/cards');
const authenticate = require('../../middlewares/auth');
const { upload, uploadToCloudinary } = require('../../middlewares/upload');
const {
  validateBody,
  validateQuery,
  validateParams,
} = require('../../middlewares/validate');
const {
  createCardBodySchema,
  updateCardBodySchema,
  cardIdParamsSchema,
  cardCommentParamsSchema,
  cardsQuerySchema,
  commentsQuerySchema,
  cardRatingBodySchema,
  cardCommentBodySchema,
} = require('../../validation/cards');

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

router.get('/', validateQuery(cardsQuerySchema), ctrlWrapper(ctrl.getAll));
router.get('/:id', validateParams(cardIdParamsSchema), ctrlWrapper(ctrl.getById));

// Захищені роути (потрібен токен)
router.post(
  '/',
  authenticate,
  upload.single('img'),
  uploadToCloudinary,
  validateBody(createCardBodySchema),
  ctrlWrapper(ctrl.add),
);
router.delete(
  '/:id',
  authenticate,
  validateParams(cardIdParamsSchema),
  ctrlWrapper(ctrl.remove),
);
router.put(
  '/:id',
  authenticate,
  upload.single('img'),
  uploadToCloudinary,
  validateParams(cardIdParamsSchema),
  validateBody(updateCardBodySchema),
  ctrlWrapper(ctrl.update),
);

// Роут для рейтингу
router.patch(
  '/:id/rate',
  authenticate,
  validateParams(cardIdParamsSchema),
  validateBody(cardRatingBodySchema),
  ctrlWrapper(ctrl.rateCard),
);

// Роути для коментарів
router.get(
  '/:id/comments',
  validateParams(cardIdParamsSchema),
  validateQuery(commentsQuerySchema),
  ctrlWrapper(ctrl.getComments),
);
router.post(
  '/:id/comments',
  authenticate,
  validateParams(cardIdParamsSchema),
  validateBody(cardCommentBodySchema),
  ctrlWrapper(ctrl.addComment),
);
router.delete(
  '/:id/comments/:commentId',
  authenticate,
  validateParams(cardCommentParamsSchema),
  ctrlWrapper(ctrl.deleteComment),
);

module.exports = router;
