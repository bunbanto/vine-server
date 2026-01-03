const { Schema, model } = require("mongoose");

const cardSchema = new Schema(
  {
    name: { type: String, required: true },
    color: { type: String, required: true },
    type: { type: String, required: true },
    alcohol: { type: Number, required: true },
    winery: { type: String, required: true },
    img: { type: String, required: true }, // URL з Cloudinary
    price: { type: Number, required: true },

    // Система рейтингу
    ratings: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "user" },
        value: { type: Number, min: 1, max: 10 },
      },
    ],
    rating: { type: Number, default: 0 }, // Середній рейтинг

    owner: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  { versionKey: false, timestamps: true }
);

const Card = model("wines", cardSchema);

module.exports = Card;
