export const validate = (schema, target = "body") => {
    return (req, res, next) => {
        const result = schema.safeParse(req[target]);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: result.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message
                }))
            });
        }

        // Store validated data separately.
        // This also works safely with Express 5 query getters.
        res.locals.validated = res.locals.validated || {};
        res.locals.validated[target] = result.data;

        next();
    };
};