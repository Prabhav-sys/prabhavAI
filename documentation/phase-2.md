# InterviewAI — Phase 2: Backend Architecture & Engineering

**Project:** InterviewAI  
**Documentation:** Phase 2 Technical Documentation  
**Scope:** Steps 2.1–2.8  
**Backend Stack:** Node.js, Express.js, MongoDB, Mongoose, Zod  
**Status:** Phase 2 implementation documentation

---

## 1. Introduction

### 1.1 Purpose

Phase 2 focuses on improving the backend engineering practices of InterviewAI. Phase 1 established the working backend and its core CRUD APIs. Phase 2 builds on that foundation by improving maintainability, scalability, security, reliability, and code organization.

The primary objective is to move from a backend where APIs simply work to a backend with a well-defined architecture and reusable engineering patterns.

### 1.2 Phase 2 Objectives

- Implement a layered backend architecture.
- Centralize API route registration.
- Manage environment variables through a centralized configuration module.
- Improve MongoDB connection management and schema design.
- Separate business logic from HTTP controllers.
- Implement consistent error handling.
- Introduce security middleware.
- Implement structured application logging.
- Improve API functionality through pagination, filtering, sorting, and search.

### 1.3 Technology Stack

| Technology | Responsibility |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | Backend framework |
| MongoDB Atlas | Database |
| Mongoose | ODM and database operations |
| Zod | Request and environment validation |
| Helmet | HTTP security headers |
| CORS | Cross-origin access control |
| express-rate-limit | Request rate limiting |
| express-mongo-sanitize | MongoDB query sanitization |
| Pino | Structured application logging |
| Pino HTTP | HTTP request logging |
| Swagger | API documentation |

---

## 2. Step 2.1 — Backend Architecture

### 2.1.1 Architectural Approach

InterviewAI follows a layered architecture based on separation of concerns.

The backend is divided into independent layers, each responsible for a specific part of request processing.

**Architecture flow:**

Client → Routes → Middleware → Controllers → Services → Models → MongoDB

The response travels back through the application to the client.

### 2.1.2 Responsibilities of Each Layer

| Layer | Responsibility |
|---|---|
| Routes | Define API endpoints and HTTP methods |
| Middleware | Validate requests and apply cross-cutting logic |
| Controllers | Handle HTTP requests and responses |
| Services | Implement business logic and application rules |
| Models | Define MongoDB document structure and database operations |
| Database | Persist application data |

**Design principle:** Each layer should have one clear responsibility.

Controllers should not contain complex business logic, and services should not directly manage HTTP responses.

### 2.1.3 Centralized Route Registration

Instead of registering every feature's routes directly inside `app.js`, API routes are managed through a central router.

File: `server/routes/index.js`

```javascript
import express from "express";
import userRoutes from "./user.routes.js";

const router = express.Router();

router.use("/users", userRoutes);

export default router;
```

The main application mounts this router using:

```javascript
app.use("/api/v1", apiV1Routes);
```

This produces the following endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/users` | Create a user |
| GET | `/api/v1/users` | Retrieve users |
| GET | `/api/v1/users/:id` | Retrieve a user |
| PATCH | `/api/v1/users/:id` | Update a user |
| DELETE | `/api/v1/users/:id` | Delete a user |

This approach makes it easier to introduce future modules such as resumes, interviews, credits, payments, and administration.

### 2.1.4 Important Architecture Principles

**Separation of concerns:** Every module has a clearly defined responsibility.

**Loose coupling:** Changes in one layer should have minimal impact on other layers.

**High cohesion:** Related functionality should remain together.

**Repository layer decision:** The current service layer communicates directly with Mongoose. A separate repository layer is not required unless application complexity justifies introducing it.

---

## 3. Step 2.2 — Environment Configuration Engineering

### 3.1 Problem

Accessing environment variables directly throughout the application can create scattered configuration and inconsistent validation.

Examples of direct access include:

```javascript
process.env.PORT
process.env.MONGODB_URI
process.env.CLIENT_URL
```

Phase 2 introduces a centralized configuration module.

### 3.2 Centralized Configuration

File: `server/config/env.js`

The configuration module is responsible for:

1. Loading environment variables.
2. Validating required variables.
3. Converting values into appropriate data types.
4. Providing a single configuration interface.
5. Preventing startup when required configuration is invalid.

The implementation uses:

- `dotenv/config` to load the `.env` file.
- Zod to validate environment variables.
- `safeParse()` to inspect configuration errors.
- `process.exit(1)` to stop startup when validation fails.

### 3.3 Environment Variables

| Variable | Purpose |
|---|---|
| `NODE_ENV` | Application environment |
| `PORT` | Backend server port |
| `MONGODB_URI` | MongoDB connection string |
| `CLIENT_URL` | Frontend origin |
| `GEMINI_API_KEY` | Future AI provider credential |
| `RAZORPAY_KEY_SECRET` | Future payment integration secret |

The last two variables are intended for later integrations and are not part of the Phase 2 environment schema described in the roadmap.

### 3.4 Zod Validation

The environment schema validates:

- `NODE_ENV` against development, test, and production.
- `PORT` as an integer between 1 and 65535.
- `MONGODB_URI` as a required non-empty string.
- `CLIENT_URL` as a valid URL.

The port is converted from its environment-variable string representation into a number using `z.coerce.number()`.

### 3.5 Configuration Usage

Other backend modules import the centralized configuration:

```javascript
import env from "./config/env.js";
```

The application accesses:

```javascript
env.port;
env.mongodbUri;
env.clientUrl;
env.nodeEnv;
```

This avoids repeatedly reading and interpreting environment variables across different modules.

### 3.6 Environment File Management

The `.env` file stores actual local configuration and secrets.

The `.env.example` file provides illustrative variable names and placeholder values.

**Security requirements:**

- Never commit the real `.env` file.
- Never expose database credentials in source code.
- Use separate credentials and databases for development and production.
- Keep `.env.example` free of real secrets.

### 3.7 Development and Production

| Configuration | Development | Production |
|---|---|---|
| `NODE_ENV` | development | production |
| `PORT` | 5000 | Hosting platform port |
| `CLIENT_URL` | Local frontend URL | Deployed frontend URL |
| `MONGODB_URI` | Development database | Production database |

---

## 4. Step 2.3 — Database Engineering

### 4.1 MongoDB Connection Management

MongoDB connectivity is handled through a dedicated database configuration module:

`server/config/db.js`

The connection module:

- Uses Mongoose to establish the database connection.
- Reads the connection URI from centralized environment configuration.
- Logs successful connections.
- Logs connection failures.
- Propagates connection errors to the application startup process.

The connection is established before the HTTP server starts accepting requests.

### 4.2 Database Connection Lifecycle

The intended startup sequence is:

1. Load application configuration.
2. Validate environment variables.
3. Connect to MongoDB.
4. Start the Express server.
5. Monitor database connection events.
6. Close the HTTP server and database connection during shutdown.

This prevents the application from accepting normal API traffic before its database connection is established.

### 4.3 Graceful Shutdown

The server handles termination signals such as:

- `SIGINT`
- `SIGTERM`

During shutdown, it stops accepting new HTTP connections, waits for the HTTP server to close, and disconnects Mongoose.

Graceful shutdown helps avoid abrupt termination during active requests or database operations.

### 4.4 Mongoose Schema Design

The User model contains the following fields:

| Field | Type | Purpose |
|---|---|---|
| `firebaseUid` | String | Firebase user identifier |
| `name` | String | User's name |
| `email` | String | User email address |
| `avatarUrl` | String | Profile image URL |
| `role` | String | USER or ADMIN |
| `credits` | Number | Available user credits |
| `createdAt` | Date | Creation timestamp |
| `updatedAt` | Date | Last update timestamp |

Schema-level constraints include:

- Required fields.
- Unique identifiers and email addresses.
- Email normalization.
- Role enumeration.
- Default values.
- Minimum credit balance.
- Automatic timestamps.

### 4.5 Indexing

An index is defined on the creation timestamp:

```javascript
userSchema.index({ createdAt: -1 });
```

This supports queries that retrieve users ordered by their creation date.

Unique fields such as `firebaseUid` and `email` also have uniqueness constraints.

**Why indexes matter:**

- Improve query performance for supported access patterns.
- Reduce the amount of data MongoDB must scan.
- Enforce uniqueness where configured.

Indexes also consume storage and add write overhead, so they should be selected according to actual query patterns.

---

## 5. Step 2.4 — Service Layer

### 5.1 Purpose

The service layer contains application-level business logic and database operations used by controllers.

It prevents controllers from becoming overloaded with database queries and business rules.

File: `server/services/user.service.js`

### 5.2 User Service Responsibilities

The User service provides the following operations:

| Function | Responsibility |
|---|---|
| `createUser()` | Create a user |
| `getAllUsers()` | Retrieve users with query options |
| `getUserById()` | Retrieve a user by ID |
| `updateUser()` | Update a user |
| `deleteUser()` | Delete a user |

### 5.3 Pagination and Query Processing

The service uses reusable query utilities:

- `buildPagination()` calculates the database offset.
- `buildSort()` constructs the sorting configuration.
- `escapeRegex()` escapes user-provided search text before building a regular expression.

The list operation supports:

- Page number.
- Page size.
- Role filtering.
- Search by name or email.
- Sorting by allowed fields.
- Ascending or descending order.

### 5.4 Database Query Optimization

The user listing operation uses:

- `Promise.all()` to execute the user query and total count concurrently.
- `.select()` to return only the required fields.
- `.lean()` to retrieve plain JavaScript objects instead of full Mongoose documents.
- `.skip()` and `.limit()` for pagination.

This reduces unnecessary document processing and limits the amount of data returned.

### 5.5 Service and Controller Separation

The controller is responsible for receiving validated request data and sending standardized HTTP responses.

The service is responsible for executing the corresponding application operation.

For example:

```text
GET /api/v1/users
       |
       v
User Route
       |
       v
Validation Middleware
       |
       v
User Controller
       |
       v
User Service
       |
       v
Mongoose Model
       |
       v
MongoDB
```

---

## 6. Step 2.5 — Error Architecture

### 6.1 Objective

The error-handling architecture provides a consistent way to handle failures across the backend.

Instead of implementing separate error responses in every controller, errors are passed to centralized error middleware.

### 6.2 Async Error Handling

The `asyncHandler` utility wraps asynchronous route handlers and forwards rejected promises to Express error handling.

This reduces repetitive `try/catch` blocks in controllers.

### 6.3 Centralized Error Middleware

File: `server/middleware/error.middleware.js`

The error middleware handles common error categories:

| Error | HTTP Status |
|---|---:|
| Duplicate MongoDB key | 409 Conflict |
| Mongoose validation error | 400 Bad Request |
| Invalid MongoDB ObjectId / CastError | 400 Bad Request |
| Application-specific error | Depends on error class |
| Request body too large | 413 Payload Too Large |
| Unexpected server error | 500 Internal Server Error |

### 6.4 Standardized Error Responses

The `sendError()` utility is used to maintain a consistent response format.

A standardized error response should communicate:

- Whether the request succeeded.
- A readable error message.
- The relevant HTTP status.
- Optional validation details.

Internal stack traces and sensitive implementation details should not be exposed to clients in production.

### 6.5 Custom Application Errors

Custom error classes allow services to communicate expected application failures.

For example, requesting a user that does not exist should produce a `NotFoundError`.

The error middleware must recognize the base application error class used by these custom errors. The inheritance relationship between `NotFoundError` and `AppError` should remain consistent.

---

## 7. Step 2.6 — Security Foundations

### 7.1 Objective

Security middleware provides baseline protection for the Express application.

The security layer is configured centrally in `app.js`.

### 7.2 Helmet

Helmet sets security-related HTTP headers.

It helps reduce exposure to common browser-based vulnerabilities by applying recommended HTTP security headers.

### 7.3 CORS

Cross-Origin Resource Sharing controls which frontend origins can access the backend.

The application uses the configured frontend URL as the allowed origin.

The CORS configuration also specifies permitted HTTP methods and request headers.

Credentials are enabled where required by the application's authentication or session strategy.

### 7.4 Rate Limiting

The `express-rate-limit` middleware limits the number of requests a client can make within a defined time window.

The API rate limiter is applied to the versioned API routes.

Rate limiting helps reduce:

- Excessive request traffic.
- Automated abuse.
- Repeated endpoint requests.
- Certain denial-of-service patterns.

The actual window and request limit should be configured according to application requirements.

### 7.5 MongoDB Sanitization

The `express-mongo-sanitize` middleware is included to help prevent malicious MongoDB query operators from being passed through request input.

This is an additional defensive measure; it does not replace input validation.

### 7.6 JSON Payload Limit

The JSON parser uses a request body size limit:

```javascript
express.json({ limit: "10kb" })
```

This prevents unnecessarily large JSON request bodies from being processed.

### 7.7 Security Considerations

- Validate all incoming request data.
- Never trust client-provided roles or permissions.
- Keep API credentials outside source code.
- Avoid exposing internal error details.
- Apply authentication and authorization before protected operations.
- Use HTTPS in production.

Authentication and authorization are future application capabilities; the Phase 2 security middleware does not by itself implement user authentication.

---

## 8. Step 2.7 — Logging

### 8.1 Objective

Logging provides visibility into application behavior, database connectivity, HTTP requests, errors, and server lifecycle events.

Phase 2 introduces structured logging using Pino.

### 8.2 Pino Logger

Pino is used as the application logger.

The intended logger configuration supports:

- Configurable log levels.
- Structured JSON logs.
- Human-readable development output through `pino-pretty`.
- Production-friendly structured output.

### 8.3 Pino HTTP

`pino-http` provides HTTP request logging integration.

It can capture request and response information such as:

- HTTP method.
- Request URL.
- Response status.
- Request duration.
- Request-related metadata.

### 8.4 Database Logging

Database connection events are logged through the application logger.

Examples include:

- MongoDB connected.
- MongoDB disconnected.
- MongoDB connection error.
- MongoDB connection failure.

### 8.5 Server Lifecycle Logging

The server logs:

- Successful startup.
- Port and environment information.
- Shutdown signals.
- HTTP shutdown failures.
- Database disconnection.
- Startup failures.

### 8.6 Log Levels

| Level | Purpose |
|---|---|
| `fatal` | Critical failure requiring application termination |
| `error` | Application or operation failure |
| `warn` | Unexpected but recoverable condition |
| `info` | Important application events |
| `debug` | Detailed debugging information |

Sensitive values such as passwords, tokens, API keys, and database credentials must not be written to logs.

---

## 9. Step 2.8 — API Quality

### 9.1 Objective

API quality improvements make endpoints more practical and efficient when the amount of stored data increases.

Phase 2 improves the user listing endpoint through pagination, filtering, sorting, and search.

### 9.2 Pagination

Pagination divides a large collection into smaller result sets.

Example:

```http
GET /api/v1/users?page=1&limit=10
```

Where:

- `page` identifies the requested page.
- `limit` defines the maximum number of records returned.

The service calculates the database offset using:

```text
skip = (page - 1) × limit
```

### 9.3 Filtering

Filtering retrieves records that match a specified condition.

Example:

```http
GET /api/v1/users?role=ADMIN
```

The role filter restricts the returned users to the selected role.

### 9.4 Sorting

Sorting controls the order in which records are returned.

Example:

```http
GET /api/v1/users?sortBy=createdAt&order=desc
```

Supported sorting fields are restricted to the fields defined by the query validation schema.

### 9.5 Search

Search supports matching users by name or email.

Example:

```http
GET /api/v1/users?search=prabhat
```

The search value is escaped before being used in a regular expression.

This prevents user-provided search characters from unintentionally changing the intended regular-expression pattern.

### 9.6 Query Validation

Zod validates the query parameters before they reach the controller.

The validation rules include:

- Page must be an integer greater than or equal to 1.
- Limit must be an integer between 1 and 100.
- Role must be an allowed role.
- Sort field must be allowed.
- Sort order must be `asc` or `desc`.
- Search text must remain within the configured length limit.

### 9.7 API Response Metadata

The paginated response includes information such as:

- Total matching records.
- Current page.
- Page size.
- Total pages.

This allows frontend applications to implement pagination controls without independently calculating database totals.

---

## 10. API Reference

### 10.1 Base URL

Development:

```text
http://localhost:5000
```

API version prefix:

```text
/api/v1
```

### 10.2 User Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/users` | Create a user |
| GET | `/api/v1/users` | List users |
| GET | `/api/v1/users/:id` | Get user details |
| PATCH | `/api/v1/users/:id` | Update user details |
| DELETE | `/api/v1/users/:id` | Delete a user |

### 10.3 Health Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check whether the backend is running |
| GET | `/api/db-check` | Check MongoDB connectivity |

### 10.4 API Documentation

Swagger UI is exposed at:

```text
http://localhost:5000/api/docs
```

It provides an interactive interface for exploring documented API endpoints and their request/response specifications.

---

## 11. Backend Request Lifecycle

Consider the following request:

```http
GET /api/v1/users?page=1&limit=10&sortBy=createdAt&order=desc
```

The request passes through the following stages:

1. **Express application:** Receives the HTTP request.
2. **Security middleware:** Applies HTTP security headers and CORS policy.
3. **Request parsing:** Parses the incoming JSON body where applicable.
4. **Sanitization:** Applies MongoDB query sanitization.
5. **API router:** Matches the `/api/v1/users` route.
6. **Rate limiter:** Applies API request limits.
7. **Validation middleware:** Validates query parameters.
8. **Controller:** Extracts validated input and invokes the service.
9. **Service:** Applies pagination, filtering, sorting, and search logic.
10. **Mongoose:** Executes the database operations.
11. **MongoDB:** Returns the matching records.
12. **Controller:** Sends the standardized response.
13. **Client:** Receives the response.

If an error occurs, it is passed to centralized error middleware.

---

## 12. Testing and Verification

Phase 2 changes should be verified through both positive and negative tests.

### 12.1 Configuration Tests

- Backend starts with valid environment variables.
- Backend exits when required configuration is missing.
- Invalid port values are rejected.
- Invalid frontend URLs are rejected.
- `.env.example` contains placeholders rather than real credentials.

### 12.2 Database Tests

- MongoDB connection succeeds.
- Database health endpoint returns the expected result.
- Database disconnection is logged.
- Database shutdown occurs during graceful termination.

### 12.3 API Tests

- User creation works.
- User listing works.
- User retrieval works.
- User updates work.
- User deletion works.
- Invalid request data is rejected.
- Missing users return an appropriate error.
- Pagination returns the expected number of records.
- Filtering returns matching records.
- Sorting returns records in the expected order.
- Search matches the intended fields.

### 12.4 Security Tests

- Security headers are present.
- CORS rejects unapproved origins.
- Rate limiting is applied.
- Oversized JSON payloads are rejected.
- Invalid request data does not reach business logic.

### 12.5 Logging Tests

- Server startup is logged.
- Database connection events are logged.
- HTTP requests are logged.
- Errors are logged with useful context.
- Sensitive credentials are not exposed.

---

## 13. Known Implementation Considerations

The following items require attention when reviewing the actual project files:

1. **Express 5 and MongoDB sanitization compatibility:** `express-mongo-sanitize` version 2.2.0 can encounter a read-only `req.query` property in Express 5. A compatibility workaround was discussed. Its behavior must be verified against the current application before considering this issue resolved.

2. **Custom error inheritance:** Ensure `NotFoundError` extends the same `AppError` base class recognized by the global error middleware.

3. **Controller import consistency:** Ensure the controller filename and the import path in `user.routes.js` match exactly.

4. **Route parameter validation:** User ID parameters should be validated before database operations. The documented user routes currently show explicit validation for request bodies and list queries, but not for every `:id` parameter.

5. **Authentication and authorization:** Phase 2 establishes the backend foundation. Authentication and authorization are not replaced by CORS, rate limiting, or other security middleware.

6. **Dependency audit:** Review reported dependency vulnerabilities and verify compatible package updates before deploying to production. Do not apply breaking upgrades automatically.

These considerations should be closed through code review and testing rather than assumed to be resolved.

---

## 14. Final Outcome

Phase 2 establishes the engineering foundation for the next stage of InterviewAI development.

The backend is organized around a layered architecture, centralized routing, centralized configuration, reusable services, database lifecycle management, centralized error handling, security middleware, structured logging, and improved API query capabilities.

### Phase 2 Completion Summary

| Step | Area | Intended Outcome |
|---|---|---|
| 2.1 | Backend architecture | Layered structure and centralized routing |
| 2.2 | Environment configuration | Centralized, validated configuration |
| 2.3 | Database engineering | Reliable connection and schema management |
| 2.4 | Service layer | Separation of business logic |
| 2.5 | Error architecture | Consistent error handling |
| 2.6 | Security foundations | Baseline backend security middleware |
| 2.7 | Logging | Structured application and request logs |
| 2.8 | API quality | Pagination, filtering, sorting, and search |

**Conclusion:** Phase 2 prepares the InterviewAI backend for more advanced application capabilities, including authentication, resume processing, AI-powered interview workflows, and credit or payment management.

---

*Documentation scope note: This document follows the Phase 2 roadmap and the implementation details discussed during development. Items identified as requiring verification are deliberately not represented as confirmed fixes or production-readiness guarantees.*