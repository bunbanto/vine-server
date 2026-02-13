const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Card = require('../models/card');

// Допоміжна функція для отримання статистики користувача
const getUserStats = async (userId) => {
  const [cardCount, favoritesCount] = await Promise.all([
    Card.countDocuments({ owner: userId }),
    Card.countDocuments({ favorites: userId }),
  ]);
  return { cardCount, favoritesCount };
};

const { JWT_SECRET, JWT_EXPIRES_IN = '24h' } = process.env;

if (!JWT_SECRET) {
  console.error('JWT_SECRET is not defined in environment variables');
  process.exit(1);
}

const register = async (req, res) => {
  const { name, email, password } = req.body;
  const user = await User.findOne({ email });

  if (user) {
    return res.status(409).json({ message: 'Email in use' });
  }

  const hashPassword = await bcrypt.hash(password, 10);
  const newUser = await User.create({ name, email, password: hashPassword });

  res.status(201).json({
    user: {
      name: newUser.name,
      email: newUser.email,
      createdAt: newUser.createdAt,
      cardCount: 0,
      favoritesCount: 0,
    },
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(401).json({ message: 'Email or password is wrong' });
  }

  const passwordCompare = await bcrypt.compare(password, user.password);
  if (!passwordCompare) {
    return res.status(401).json({ message: 'Email or password is wrong' });
  }

  const token = jwt.sign({ id: user._id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
  const stats = await getUserStats(user._id);

  res.json({
    token,
    user: {
      _id: user._id,
      id: user._id.toString(),
      name: user.name || '',
      username: user.name || '',
      email: user.email,
      createdAt: user.createdAt,
      cardCount: stats.cardCount,
      favoritesCount: stats.favoritesCount,
    },
  });
};

const getProfile = async (req, res) => {
  const { _id, name, email, createdAt } = req.user;
  const stats = await getUserStats(_id);

  res.json({
    user: {
      _id,
      name,
      email,
      createdAt,
      cardCount: stats.cardCount,
      favoritesCount: stats.favoritesCount,
    },
  });
};

module.exports = { register, login, getProfile };
