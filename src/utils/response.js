const success = (
  res,
  statusCode = 200,
  message = "Success",
  data = null,
  meta = {},
) => {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  if (Object.keys(meta).length) body.meta = meta;
  return res.status(statusCode).json(body);
};

const error = (
  res,
  statusCode = 500,
  message = "Internal Server Error",
  errors = null,
) => {
  const body = { success: false, message };
  if (errors !== null) body.errors = errors;
  return res.status(statusCode).json(body);
};

export { success, error };
