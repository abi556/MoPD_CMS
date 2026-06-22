export interface FieldError {
    field: string;
    message: string;
    code: string;
}
export interface PaginationMeta {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
}
export interface PaginationLinks {
    self: string;
    next?: string;
    prev?: string;
    first?: string;
    last?: string;
}
export interface ApiSuccessResponse<T> {
    data: T;
    meta?: PaginationMeta;
    links?: PaginationLinks;
}
export interface ApiErrorResponse {
    error: {
        code: string;
        message: string;
        details?: FieldError[];
        correlationId?: string;
    };
}
