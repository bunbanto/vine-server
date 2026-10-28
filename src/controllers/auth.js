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
const ADMIN_EMAIL = 'bunbanto@gmail.com';
const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

const getUserRole = (user) =>
  user?.email?.trim().toLowerCase() === ADMIN_EMAIL || user?.role === 'admin'
    ? 'admin'
    : 'user';

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
      role: getUserRole(newUser),
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

  const passwordCompare = user.password
    ? await bcrypt.compare(password, user.password)
    : false;
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
      role: getUserRole(user),
      createdAt: user.createdAt,
      cardCount: stats.cardCount,
      favoritesCount: stats.favoritesCount,
    },
  });
};

const googleAuth = async (req, res) => {
  if (!FIREBASE_API_KEY) {
    return res.status(503).json({ message: 'Google authentication is not configured' });
  }

  const lookupResponse = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(FIREBASE_API_KEY)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: req.body.idToken }),
    },
  );
  const lookup = await lookupResponse.json();
  const firebaseUser = lookup.users?.[0];

  const signedInWithGoogle = firebaseUser?.providerUserInfo?.some(
    ({ providerId }) => providerId === 'google.com',
  );
  if (
    !lookupResponse.ok ||
    !firebaseUser ||
    firebaseUser.emailVerified !== true ||
    !signedInWithGoogle
  ) {
    return res.status(401).json({ message: 'Invalid or unverified Firebase account' });
  }
  const email = firebaseUser.email?.trim().toLowerCase();
  if (!email || firebaseUser.localId == null) {
    return res.status(401).json({ message: 'Invalid Firebase account' });
  }

  let user = await User.findOne({ $or: [{ firebaseUid: firebaseUser.localId }, { email }] });
  if (!user) {
    user = await User.create({
      name: firebaseUser.displayName?.trim() || email.split('@')[0] || 'Google User',
      email,
      firebaseUid: firebaseUser.localId,
    });
  } else if (!user.firebaseUid) {
    user.firebaseUid = firebaseUser.localId;
    await user.save();
  } else if (user.firebaseUid !== firebaseUser.localId) {
    return res.status(409).json({ message: 'Email is linked to another Firebase account' });
  }

  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const stats = await getUserStats(user._id);
  res.json({
    token,
    user: {
      _id: user._id,
      id: user._id.toString(),
      name: user.name || '',
      username: user.name || '',
      email: user.email,
      role: getUserRole(user),
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
      role: getUserRole(req.user),
      createdAt,
      cardCount: stats.cardCount,
      favoritesCount: stats.favoritesCount,
    },
  });
};

module.exports = { register, login, googleAuth, getProfile };
