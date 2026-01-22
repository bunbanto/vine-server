const express = require('express');
const ctrl = require('../../controllers/cards');
const authenticate = require('../../middlewares/auth');
const upload = require('../../middlewares/upload');

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

router.get('/', ctrlWrapper(ctrl.getAll));
router.get('/:id', ctrlWrapper(ctrl.getById));

// Захищені роути (потрібен токен)
router.post('/', authenticate, upload.single('img'), ctrlWrapper(ctrl.add));
router.delete('/:id', authenticate, ctrlWrapper(ctrl.remove));
router.put(
  '/:id',
  authenticate,
  upload.single('img'),
  ctrlWrapper(ctrl.update),
);

// Роут для рейтингу
router.patch('/:id/rate', authenticate, ctrlWrapper(ctrl.rateCard));

// Роути для коментарів
router.get('/:id/comments', ctrlWrapper(ctrl.getComments));
router.post('/:id/comments', authenticate, ctrlWrapper(ctrl.addComment));
router.delete(
  '/:id/comments/:commentId',
  authenticate,
  ctrlWrapper(ctrl.deleteComment),
);

module.exports = router;
