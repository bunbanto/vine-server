const express = require("express");
const ctrl = require("../../controllers/auth");
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

router.post("/register", ctrlWrapper(ctrl.register));
router.post("/login", ctrlWrapper(ctrl.login));

module.exports = router;
