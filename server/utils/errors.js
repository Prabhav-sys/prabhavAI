import AppError from "./AppError.js";

export class NotFoundError extends AppError {
    constructor(message = "Resource not found") {
        super(message, 404);
    }
}

export class BadRequestError extends AppError {
    constructor(message = "Bad request") {
        super(message, 400);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = "Authentication required") {
        super(message, 401);
    }
}

export class ForbiddenError extends AppError {
    constructor(message = "Access forbidden") {
        super(message, 403);
    }
}

export class ConflictError extends AppError {
    constructor(message = "Resource conflict") {
        super(message, 409);
    }
}

export class ValidationError extends AppError {
    constructor(message = "Validation failed", errors = []) {
        super(message, 422, errors);
    }
}

export class InsufficientCreditsError extends AppError {
    constructor(requiredCredits, availableCredits) {
        super("You do not have enough credits to start this AI feature.", 402);
        this.code = "INSUFFICIENT_CREDITS";
        this.requiredCredits = requiredCredits;
        this.availableCredits = availableCredits;
    }
}