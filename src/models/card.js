const { Schema, model } = require('mongoose');

const wineTypes = ['secco', 'abboccato', 'amabile', 'dolce'];
const wineColors = ['bianco', 'rosso', 'rosato', 'sparkling'];

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
        message: 'Color must be one of: bianco, rosso, rosato, sparkling',
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
    ratings: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'user' },
        value: {
          type: Number,
          min: [1, 'Rating must be at least 1'],
          max: [10, 'Rating cannot exceed 10'],
        },
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
  },
  { versionKey: false, timestamps: true },
);

const Card = model('wines', cardSchema);

module.exports = Card;
