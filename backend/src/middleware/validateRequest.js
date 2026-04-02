import { fail } from '../utils/apiResponse.js';

export function validateRequest(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return fail(res, 400, 'validation_error', 'Invalid request payload', result.error.flatten());
    }
    req[source] = result.data;
    return next();
  };
}
