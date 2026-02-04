const { Schema, model } = require('mongoose');

const wineTypes = ['secco', 'abboccato', 'amabile', 'dolce'];
const wineColors = ['bianco', 'rosso', 'rosato'];

const cardSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      minlength: [2, 'Name must be at least 2 characters'],
    },
    color: {
      type: String,
      required: [true, 'Color is required'],
      enum: {
        values: wineColors,
        message: 'Color must be one of: bianco, rosso, rosato',
      },
    },
    type: {
      type: String,
      required: [true, 'Type is required'],
      enum: {
        values: wineTypes,
        message: 'Type must be one of: secco, abboccato, amabile, dolce',
      },
    },
    alcohol: {
      type: Number,
      required: [true, 'Alcohol percentage is required'],
      min: [0, 'Alcohol cannot be less than 0'],
      max: [100, 'Alcohol cannot be more than 100'],
    },
    winery: {
      type: String,
      required: [true, 'Winery is required'],
      minlength: [2, 'Winery name must be at least 2 characters'],
    },
    region: {
      type: String,
      required: [true, 'Region is required'],
      minlength: [2, 'Region name must be at least 2 characters'],
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      minlength: [2, 'Country name must be at least 2 characters'],
    },
    anno: {
      type: Number,
      required: [true, 'Vintage year is required'],
      min: [1900, 'Vintage year must be at least 1900'],
      max: [2030, 'Vintage year cannot exceed 2030'],
    },
    img: {
      type: String,
      default: 'https://res.cloudinary.com/demo/image/upload/wines/default.jpg',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    frizzante: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      default: '',
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    ratings: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'user' },
        username: { type: String },
        value: {
          type: Number,
          min: [1, 'Rating must be at least 1'],
          max: [10, 'Rating cannot exceed 10'],
        },
      },
    ],
    comments: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'user' },
        username: { type: String },
        text: {
          type: String,
          required: [true, 'Comment text is required'],
          minlength: [1, 'Comment cannot be empty'],
          maxlength: [1000, 'Comment cannot exceed 1000 characters'],
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [10, 'Rating cannot exceed 10'],
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: [true, 'Owner is required'],
    },
    // Users who marked this wine as favorite
    favorites: [
      {
        type: Schema.Types.ObjectId,
        ref: 'user',
        default: [],
      },
    ],
  },
  { versionKey: false, timestamps: true },
);

// Індекс для швидкого пошуку карток за списком улюблених
cardSchema.index({ favorites: 1 });

const Card = model('wines', cardSchema);

module.exports = Card;
