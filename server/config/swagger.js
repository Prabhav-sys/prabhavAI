import swaggerJsdoc from "swagger-jsdoc";

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "InterviewAI API",
            version: "1.0.0",
            description: "Backend API documentation for InterviewAI"
        },
        servers: [
            {
                url: "http://localhost:5000",
                description: "Local development server"
            }
        ]
    },
    apis: ["./routes/*.js"]
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;