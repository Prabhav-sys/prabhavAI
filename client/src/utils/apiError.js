
export const getApiErrorMessage = (error) => {
    if (error.response) {
        return (
            error.response.data?.message ||
            `Request failed with status ${error.response.status}`
        );
    }

    if (error.request) {
        return "Unable to connect to the server. Please try again.";
    }

    return error.message || "Something went wrong.";
};
