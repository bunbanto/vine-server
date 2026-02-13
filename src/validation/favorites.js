const { Joi, objectId } = require('./common');

const sortableFields = ['price', 'rating', 'anno', 'name', 'createdAt'];

const favoriteCardIdParamsSchema = Joi.object({
  id: objectId.required(),
});

const favoritesQuerySchema = Joi.object({
  sortBy: Joi.string().valid(...sortableFields),
  sortOrder: Joi.string().valid('asc', 'desc'),
  sortField: Joi.string().valid(...sortableFields),
  sortDirection: Joi.string().valid('asc', 'desc'),
});

module.exports = {
  favoriteCardIdParamsSchema,
  favoritesQuerySchema,
};
