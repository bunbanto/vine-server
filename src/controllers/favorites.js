const Card = require('../models/card');

// Перевірка валідації ObjectId
const isValidObjectId = (id) => {
  return id.match(/^[0-9a-fA-F]{24}$/);
};

// Отримати всі улюблені картки користувача
const getFavorites = async (req, res) => {
  const userId = req.user._id;

  // Параметри сортування
  const {
    sortBy = 'createdAt',
    sortOrder = 'desc',
    sortField,
    sortDirection,
  } = req.query;

  // Визначаємо поле сортування
  const effectiveSortBy = sortField || sortBy;
  const effectiveSortOrder = sortDirection || sortOrder;

  // Валідні поля сортування
  const validSortFields = ['price', 'rating', 'anno', 'name', 'createdAt'];
  const sortFieldValid = validSortFields.includes(effectiveSortBy)
    ? effectiveSortBy
    : 'createdAt';
  const sortDirectionValue = effectiveSortOrder === 'asc' ? 1 : -1;

  try {
    const cards = await Card.find({ favorites: userId })
      .populate('owner', 'name email')
      .sort({ [sortFieldValid]: sortDirectionValue });

    res.json({
      results: cards,
      total: cards.length,
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ message: 'Server error fetching favorites' });
  }
};

// Додати/видалити з улюблених
const toggleFavorite = async (req, res) => {
  const { id: cardId } = req.params;
  const userId = req.user._id;

  // Валідація cardId
  if (!isValidObjectId(cardId)) {
    return res.status(400).json({ message: 'Invalid card ID' });
  }

  try {
    const card = await Card.findById(cardId);

    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    // Перевіряємо, чи вже в улюблених
    const isFavorite = card.favorites.some(
      (favId) => favId.toString() === userId.toString(),
    );

    if (isFavorite) {
      // Видаляємо з улюблених
      card.favorites = card.favorites.filter(
        (favId) => favId.toString() !== userId.toString(),
      );
    } else {
      // Додаємо в улюблені
      card.favorites.push(userId);
    }

    await card.save();

    res.json({
      cardId,
      isFavorite: !isFavorite,
      message: isFavorite ? 'Removed from favorites' : 'Added to favorites',
    });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ message: 'Server error toggling favorite' });
  }
};

// Перевірити, чи картка в улюблених
const checkFavorite = async (req, res) => {
  const { id: cardId } = req.params;
  const userId = req.user?._id;

  // Якщо користувач не авторизований
  if (!userId) {
    return res.json({ isFavorite: false });
  }

  // Валідація cardId
  if (!isValidObjectId(cardId)) {
    return res.status(400).json({ message: 'Invalid card ID' });
  }

  try {
    const card = await Card.findById(cardId);

    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    const isFavorite = card.favorites.some(
      (favId) => favId.toString() === userId.toString(),
    );

    res.json({ isFavorite });
  } catch (error) {
    console.error('Error checking favorite:', error);
    res.status(500).json({ message: 'Server error checking favorite' });
  }
};

module.exports = {
  getFavorites,
  toggleFavorite,
  checkFavorite,
};
