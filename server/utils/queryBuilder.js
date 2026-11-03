export const escapeRegex = (value = "") => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

export const buildPagination = (page = 1, limit = 10) => {
    const skip = (page - 1) * limit;

    return {
        page,
        limit,
        skip
    };
};

export const buildSort = (sortBy = "createdAt", order = "desc") => {
    return {
        [sortBy]: order === "asc" ? 1 : -1
    };
};