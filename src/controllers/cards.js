const Card = require('../models/card');

// Joi схема для валідації картки
const cardSchema = {
  name: { type: 'string', min: 2, required: true },
  color: {
    type: 'string',
    required: true,
    pattern: /^(bianco|rosso|rosato)$/,
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
  description: { type: 'string', max: 2000 },
};

// Отримати всі картки з пагінацією, фільтрацією та сортуванням
const getAll = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    color,
    type,
    country,
    minPrice,
    maxPrice,
    minRating,
    winery,
    region,
    frizzante,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    search,
  } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  // Будуємо об'єкт фільтрації
  const filter = {};

  if (color) {
    filter.color = color;
  }

  if (type) {
    filter.type = type;
  }

  if (country) {
    filter.country = country;
  }

  if (winery) {
    filter.winery = { $regex: winery, $options: 'i' };
  }

  if (region) {
    filter.region = { $regex: region, $options: 'i' };
  }

  if (frizzante !== undefined) {
    filter.frizzante = frizzante === 'true';
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) {
      filter.price.$gte = Number(minPrice);
    }
    if (maxPrice !== undefined) {
      filter.price.$lte = Number(maxPrice);
    }
  }

  if (minRating !== undefined) {
    filter.rating = { $gte: Number(minRating) };
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { winery: { $regex: search, $options: 'i' } },
    ];
  }

  // Сортування
  const sortOptions = {};
  const validSortFields = ['price', 'rating', 'anno', 'name', 'createdAt'];
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
  sortOptions[sortField] = sortOrder === 'asc' ? 1 : -1;

  // Виконуємо запит
  const [result, total] = await Promise.all([
    Card.find(filter, '-createdAt -updatedAt')
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit))
      .populate('owner', 'name email'),
    Card.countDocuments(filter),
  ]);

  // Отримуємо ID поточного користувача з токена (якщо є)
  let currentUserId = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
      const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
      currentUserId = decoded._id || decoded.id;
    } catch (e) {
      // Токен невалідний, продовжуємо без isFavorite
    }
  }

  // Додаємо поле isFavorite до кожної картки
  const resultsWithFavorite = result.map((card) => {
    const cardObj = card.toObject();
    if (currentUserId) {
      cardObj.isFavorite = card.favorites.some(
        (fav) => fav.toString() === currentUserId.toString(),
      );
    } else {
      cardObj.isFavorite = false;
    }
    return cardObj;
  });

  const totalPages = Math.ceil(total / Number(limit));

  res.json({
    results: resultsWithFavorite,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages,
    hasNextPage: Number(page) < totalPages,
    hasPrevPage: Number(page) > 1,
  });
};

// Отримати одну картку
const getById = async (req, res) => {
  const { id } = req.params;
  const result = await Card.findById(id)
    .populate('owner', 'name email')
    .populate('ratings.userId', 'name');

  if (!result) {
    return res.status(404).json({ message: 'Not found' });
  }

  // Отримуємо ID поточного користувача з токена (якщо є)
  let currentUserId = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
      const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
      currentUserId = decoded._id || decoded.id;
    } catch (e) {
      // Токен невалідний
    }
  }

  // Додаємо поле isFavorite
  const cardObj = result.toObject();
  if (currentUserId) {
    cardObj.isFavorite = result.favorites.some(
      (fav) => fav.toString() === currentUserId.toString(),
    );
  } else {
    cardObj.isFavorite = false;
  }

  res.json(cardObj);
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
  const { removeImage } = req.body;

  const updateData = { ...req.body };

  // Якщо є новий файл - використовуємо його
  if (req.file) {
    updateData.img = req.file.path;
  }
  // Якщо removeImage = true і немає нового файлу - видаляємо зображення
  else if (removeImage === true || removeImage === 'true') {
    updateData.img =
      'https://res.cloudinary.com/demo/image/upload/wines/default.jpg';
  }

  // Видаляємо непотрібні поля з updateData
  delete updateData.removeImage;

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
  const { rating, username } = req.body;
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
    // Оновлюємо username, якщо змінився
    if (username) {
      card.ratings[existingRatingIndex].username = username;
    }
  } else {
    // Додаємо новий
    card.ratings.push({ userId, value: ratingValue, username });
  }

  // Перерахунок середнього рейтингу
  const totalRating = card.ratings.reduce((acc, curr) => acc + curr.value, 0);
  card.rating = parseFloat((totalRating / card.ratings.length).toFixed(1));

  await card.save();

  // Повертаємо картку з populated даними
  const result = await Card.findById(id)
    .populate('owner', 'name email')
    .populate('ratings.userId', 'name');

  res.json(result);
};

// Отримати коментарі картки з пагінацією
const getComments = async (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const card = await Card.findById(id);
  if (!card) {
    return res.status(404).json({ message: 'Not found' });
  }

  // Сортуємо за датою створення (нові спочатку)
  const sortedComments = [...card.comments].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );

  // Пагінація
  const total = sortedComments.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedComments = sortedComments.slice(startIndex, endIndex);

  const totalPages = Math.ceil(total / limit);

  res.json({
    comments: paginatedComments,
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  });
};

// Додати коментар
const addComment = async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  const userId = req.user._id;
  const username = req.user.name || req.user.username || '';

  // Валідація
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ message: 'Comment text is required' });
  }

  if (text.length > 1000) {
    return res
      .status(400)
      .json({ message: 'Comment cannot exceed 1000 characters' });
  }

  const card = await Card.findById(id);
  if (!card) {
    return res.status(404).json({ message: 'Card not found' });
  }

  card.comments.push({
    userId,
    username,
    text: text.trim(),
    createdAt: new Date(),
  });

  await card.save();

  // Повертаємо оновлену картку з коментарями
  const result = await Card.findById(id)
    .populate('owner', 'name email')
    .populate('ratings.userId', 'name');

  res.status(201).json(result);
};

// Видалити коментар
const deleteComment = async (req, res) => {
  const { id, commentId } = req.params;
  const userId = req.user._id;

  const card = await Card.findById(id);
  if (!card) {
    return res.status(404).json({ message: 'Card not found' });
  }

  // Знаходимо коментар
  const commentIndex = card.comments.findIndex(
    (c) => c._id.toString() === commentId,
  );

  if (commentIndex === -1) {
    return res.status(404).json({ message: 'Comment not found' });
  }

  // Перевіряємо, чи користувач є автором коментаря
  const comment = card.comments[commentIndex];
  if (comment.userId.toString() !== userId.toString()) {
    return res
      .status(403)
      .json({ message: 'You can only delete your own comments' });
  }

  // Видаляємо коментар
  card.comments.splice(commentIndex, 1);
  await card.save();

  res.json({ message: 'Comment deleted', cardId: id });
};

module.exports = {
  getAll,
  getById,
  add,
  remove,
  update,
  rateCard,
  getComments,
  addComment,
  deleteComment,
  cardSchema,
};
