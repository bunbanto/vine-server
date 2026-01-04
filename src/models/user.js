const { Schema, model } = require('mongoose');

const userSchema = new Schema(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
  },
  { versionKey: false, timestamps: true },
);

const User = model('user', userSchema);

module.exports = User;
