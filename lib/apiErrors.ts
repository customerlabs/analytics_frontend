/**
 * Custom error class for server-side API errors with detailed context
 */
export class APIError extends Error {
    constructor(
      message: string,
      public status: number,
      public endpoint: string,
      public statusText: string
    ) {
      super(message);
      this.name = 'APIError';
    }
  }
  
  /**
   * Custom error class for client-side API errors with detailed context
   */
  export class APIClientError extends Error {
    constructor(
      message: string,
      public status: number,
      public endpoint: string
    ) {
      super(message);
      this.name = 'APIClientError';
    }
  }