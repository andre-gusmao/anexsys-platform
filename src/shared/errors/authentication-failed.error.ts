export class AuthenticationFailedError extends Error {
  constructor(message = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationFailedError';
  }
}
