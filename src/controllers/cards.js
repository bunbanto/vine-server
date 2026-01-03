const Card = require("../models/card");

// Отримати всі картки з пагінацією (по 5 штук)
const getAll = async (req, res) => {
  const { page = 1, limit = 5 } = req.query;
  const skip = (page - 1) * limit;

  const result = await Card.find({}, "-createdAt -updatedAt")
    .skip(skip)
    .limit(Number(limit));

  const total = await Card.countDocuments();

  res.json({
    result,
    total,
    page: Number(page),
    limit: Number(limit),
  });
};

// Отримати одну картку
const getById = async (req, res) => {
  const { id } = req.params;
  const result = await Card.findById(id);
  if (!result) {
    return res.status(404).json({ message: "Not found" });
  }
  res.json(result);
};

// Додати картку
const add = async (req, res) => {
  // Якщо файл завантажено, беремо його шлях, інакше дефолт або помилка
  const img = req.file ? req.file.path : "";

  const result = await Card.create({ ...req.body, img, owner: req.user._id });
  res.status(201).json(result);
};

// Видалити картку
const remove = async (req, res) => {
  const { id } = req.params;
  const result = await Card.findByIdAndDelete(id);
  if (!result) {
    return res.status(404).json({ message: "Not found" });
  }
  res.json({ message: "Card deleted" });
};

// Редагувати картку (всі поля)
const update = async (req, res) => {
  const { id } = req.params;

  const updateData = { ...req.body };
  if (req.file) {
    updateData.img = req.file.path;
  }

  const result = await Card.findByIdAndUpdate(id, updateData, { new: true });
  if (!result) {
    return res.status(404).json({ message: "Not found" });
  }
  res.json(result);
};

// Проставити рейтинг
const rateCard = async (req, res) => {
  const { id } = req.params;
  const { rating } = req.body; // Очікуємо число від 1 до 10
  const userId = req.user._id;

  const card = await Card.findById(id);
  if (!card) {
    return res.status(404).json({ message: "Not found" });
  }

  // Перевіряємо, чи користувач вже голосував
  const existingRatingIndex = card.ratings.findIndex(
    (r) => r.userId.toString() === userId.toString()
  );

  if (existingRatingIndex !== -1) {
    // Оновлюємо існуючий рейтинг
    card.ratings[existingRatingIndex].value = Number(rating);
  } else {
    // Додаємо новий
    card.ratings.push({ userId, value: Number(rating) });
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
};
