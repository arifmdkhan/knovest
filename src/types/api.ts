
export type ApiResponse<T = void> =
    | { status: 'success'; message: string; data?: T }
    | { status: 'error'; message: string };
