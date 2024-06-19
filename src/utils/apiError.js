class apiError extends Error {
  constructor(
    statusCode,
    message = "Something went Wrong",
    errors = [],
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null; // learn from chat gpt
    this.message = message;
    this.success = false;
    this.errors = errors;
  }
}

export { apiError };
