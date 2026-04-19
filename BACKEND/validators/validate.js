const { body, param, query, validationResult } = require('express-validator');
const { ValidationError } = require('../errors/AppError');

const validate = (validations) => {
  return async (req, res, next) => {
    for (const validation of validations) {
      const result = await validation.run(req);
      if (!result.isEmpty()) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const errorDetails = errors.array().map(err => ({
      field: err.path,
      message: err.msg,
    }));

    throw new ValidationError('Validation failed', errorDetails);
  };
};

module.exports = validate;
