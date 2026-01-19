const { Schema, model } = require('mongoose');

const colorEnum = ['red', 'white', 'rose', 'sparkling', 'dessert'];
const typeEnum = ['still', 'sparkling', 'fortified', 'dessert'];

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
        values: colorEnum,
        message: 'Color must be one of: red, white, rose, sparkling, dessert',
      },
    },
    type: {
      type: String,
      required: [true, 'Type is required'],
      enum: {
        values: typeEnum,
        message: 'Type must be one of: still, sparkling, fortified, dessert',
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
    img: {
      type: String,
      default: 'https://res.cloudinary.com/demo/image/upload/wines/default.jpg',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
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
