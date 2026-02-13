const createHttpError = require('../utils/httpError');

const formatJoiError = (error) =>
  error.details.map((detail) => ({
    field: detail.path.join('.'),
    message: detail.message,
  }));

const validate = (schema, dataKey) => (req, res, next) => {
  const { value, error } = schema.validate(req[dataKey], {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return next(
      createHttpError(400, 'Validation error', {
        source: dataKey,
        fields: formatJoiError(error),
      }),
    );
  }

  req[dataKey] = value;
  next();
};

const validateBody = (schema) => validate(schema, 'body');
const validateQuery = (schema) => validate(schema, 'query');
const validateParams = (schema) => validate(schema, 'params');

module.exports = {
  validateBody,
  validateQuery,
  validateParams,
};
