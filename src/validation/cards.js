const { Joi, objectId } = require('./common');
const {
  WINE_TYPES,
  WINE_COLORS,
  isWineType,
} = require('../constants/wine');
const sortableFields = ['price', 'rating', 'anno', 'name', 'createdAt'];

const cardBaseSchema = {
  name: Joi.string().trim().min(2).max(120),
  color: Joi.string().valid(...WINE_COLORS),
  type: Joi.string().valid(...WINE_TYPES),
  alcohol: Joi.number().min(0).max(100),
  winery: Joi.string().trim().min(2).max(120),
  region: Joi.string().trim().min(2).max(120),
  country: Joi.string().trim().min(2).max(120),
  anno: Joi.number().integer().min(1900).max(2030),
  price: Joi.number().min(0),
  frizzante: Joi.boolean(),
  description: Joi.string().max(2000).allow(''),
};

const createCardBodySchema = Joi.object({
  ...cardBaseSchema,
  name: cardBaseSchema.name.required(),
  color: cardBaseSchema.color.required(),
  type: cardBaseSchema.type.required(),
  alcohol: cardBaseSchema.alcohol.required(),
  winery: cardBaseSchema.winery.required(),
  country: cardBaseSchema.country.required(),
  price: cardBaseSchema.price.required(),
}).custom((value, helper) => {
  if (isWineType(value.type) && !value.region) {
    return helper.message('region is required for wine types');
  }

  return value;
});

const updateCardBodySchema = Joi.object({
  ...cardBaseSchema,
  removeImage: Joi.boolean(),
});

const cardIdParamsSchema = Joi.object({
  id: objectId.required(),
});

const cardCommentParamsSchema = Joi.object({
  id: objectId.required(),
  commentId: objectId.required(),
});

const cardsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  color: Joi.string().valid(...WINE_COLORS),
  type: Joi.string().valid(...WINE_TYPES),
  country: Joi.string().trim().min(2).max(120),
  minPrice: Joi.number().min(0),
  maxPrice: Joi.number().min(0),
  minRating: Joi.number().min(0).max(10),
  winery: Joi.string().trim().max(120),
  region: Joi.string().trim().max(120),
  frizzante: Joi.boolean(),
  sortBy: Joi.string().valid(...sortableFields),
  sortOrder: Joi.string().valid('asc', 'desc'),
  sortField: Joi.string().valid(...sortableFields),
  sortDirection: Joi.string().valid('asc', 'desc'),
  search: Joi.string().trim().max(120),
}).custom((value, helper) => {
  if (
    value.minPrice !== undefined &&
    value.maxPrice !== undefined &&
    value.maxPrice < value.minPrice
  ) {
    return helper.message('maxPrice must be greater than or equal to minPrice');
  }

  return value;
});

const commentsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

const cardRatingBodySchema = Joi.object({
  rating: Joi.number().min(0).max(10).required(),
  username: Joi.string().trim().max(100).allow(''),
});

const cardCommentBodySchema = Joi.object({
  text: Joi.string().trim().min(1).max(1000).required(),
});

module.exports = {
  createCardBodySchema,
  updateCardBodySchema,
  cardIdParamsSchema,
  cardCommentParamsSchema,
  cardsQuerySchema,
  commentsQuerySchema,
  cardRatingBodySchema,
  cardCommentBodySchema,
};
