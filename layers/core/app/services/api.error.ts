export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public data?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
    Object.setPrototypeOf(this, ApiError.prototype)
  }
}
