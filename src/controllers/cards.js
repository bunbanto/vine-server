const Card = require('../models/card');

// Joi схема для валідації картки
const cardSchema = {
  name: { type: 'string', min: 2, required: true },
  color: {
    type: 'string',
    required: true,
    pattern: /^(bianco|rosso|rosato|sparkling)$/,
  },
  type: {
    type: 'string',
    required: true,
    pattern: /^(secco|abboccato|amabile|dolce)$/,
  },
  alcohol: { type: 'number', min: 0, max: 100, required: true },
  winery: { type: 'string', min: 2, required: true },
  region: { type: 'string', min: 2, required: true },
  country: { type: 'string', min: 2, required: true },
  anno: { type: 'number', min: 1900, max: 2030, required: true },
  price: { type: 'number', min: 0, required: true },
  frizzante: { type: 'boolean' },
};

// Отримати всі картки
const getAll = async (req, res) => {
  const result = await Card.find({}, '-createdAt -updatedAt')
    .populate('owner', 'name email')
    .populate('ratings.userId', 'name'); // Додано populate для імені користувача в рейтингах

  res.json({
    result,
    total: result.length,
  });
};

// Отримати одну картку
const getById = async (req, res) => {
  const { id } = req.params;
  const result = await Card.findById(id)
    .populate('owner', 'name email')
    .populate('ratings.userId', 'name'); // Додано populate для імені користувача в рейтингах
  if (!result) {
    return res.status(404).json({ message: 'Not found' });
  }
  res.json(result);
};

// Додати картку
const add = async (req, res) => {
  const img = req.file
    ? req.file.path
    : 'https://res.cloudinary.com/demo/image/upload/wines/default.jpg';

  const result = await Card.create({ ...req.body, img, owner: req.user._id });
  res.status(201).json(result);
};

// Видалити картку
const remove = async (req, res) => {
  const { id } = req.params;
  const { _id: owner } = req.user;
  const result = await Card.findOneAndDelete({ _id: id, owner });
  if (!result) {
    return res.status(404).json({ message: 'Not found' });
  }
  res.json({ message: 'Card deleted' });
};

// Редагувати картку (всі поля)
const update = async (req, res) => {
  const { id } = req.params;
  const { _id: owner } = req.user;

  const updateData = { ...req.body };
  if (req.file) {
    updateData.img = req.file.path;
  }

  const result = await Card.findOneAndUpdate({ _id: id, owner }, updateData, {
    new: true,
  });
  if (!result) {
    return res.status(404).json({ message: 'Not found' });
  }
  res.json(result);
};

// Проставити рейтинг
const rateCard = async (req, res) => {
  const { id } = req.params;
  const { rating } = req.body;
  const userId = req.user._id;

  // Валідація рейтингу
  const ratingValue = Number(rating);
  if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 10) {
    return res
      .status(400)
      .json({ message: 'Rating must be a number between 1 and 10' });
  }

  const card = await Card.findById(id);
  if (!card) {
    return res.status(404).json({ message: 'Not found' });
  }

  // Перевіряємо, чи користувач вже голосував
  const existingRatingIndex = card.ratings.findIndex(
    (r) => r.userId.toString() === userId.toString(),
  );

  if (existingRatingIndex !== -1) {
    // Оновлюємо існуючий рейтинг
    card.ratings[existingRatingIndex].value = ratingValue;
  } else {
    // Додаємо новий
    card.ratings.push({ userId, value: ratingValue });
  }

  // Перерахунок середнього рейтингу
  const totalRating = card.ratings.reduce((acc, curr) => acc + curr.value, 0);
  card.rating = parseFloat((totalRating / card.ratings.length).toFixed(1));

  await card.save();
  res.json(card);
};

module.exports = {
  getAll,
  getById,
  add,
  remove,
  update,
  rateCard,
  cardSchema,
};
