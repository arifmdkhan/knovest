

// Standard API Response for Server Actions
export type ApiResponse<T = void> =
  | { status: 'success'; message: string; data?: T }
  | { status: 'error'; message: string };



