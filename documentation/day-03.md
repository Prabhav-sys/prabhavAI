# InterviewAI
## Phase 3 — Authentication & Authorization

**Project:** InterviewAI  
**Phase:** 3  
**Status:** In Progress  
**Technology Stack:** React, Firebase Authentication, Firebase Admin SDK, Node.js, Express.js, MongoDB

---

## 1. Phase Overview

Phase 3 focuses on implementing a secure authentication and authorization system for InterviewAI.

The objective is to establish a reliable mechanism through which users can sign in using Google, authenticate API requests, and access application resources according to their assigned roles and permissions.

### Architecture Decisions

The project uses:

- **Firebase Authentication:** User identity management and Google Sign-in.
- **Firebase Admin SDK:** Server-side Firebase ID token verification.
- **MongoDB:** Application user profiles, roles, credits, and account information.
- **Express Middleware:** Authentication and authorization checks.
- **React:** Frontend authentication interface and token handling.

The system will use Firebase-issued ID tokens rather than implementing a separate application JWT authentication system.

---

## 2. Step 3.1 — Authentication Fundamentals

### 2.1 Authentication vs Authorization

Authentication and authorization are two different security concepts.

| Authentication | Authorization |
|---|---|
| Verifies user identity | Determines user permissions |
| Answers: Who are you? | Answers: What can you access? |
| Google Sign-in | Admin-only dashboard |
| Firebase ID token verification | Role and ownership checks |

**Example:**

A user successfully signs in using Google. Authentication succeeds.

However, if the user attempts to access:

`GET /api/v1/admin/users`

The backend must verify whether the application user has the `ADMIN` role.

A successful login does not automatically grant access to every application endpoint.

### 2.2 Firebase Authentication Flow

The authentication process follows these steps:

1. User clicks the Google Sign-in button.
2. React initiates authentication through Firebase.
3. Google verifies the user's identity.
4. Firebase issues a signed ID token.
5. React receives the Firebase ID token.
6. Frontend sends the token to the Express backend.
7. Firebase Admin SDK verifies the token.
8. Backend obtains the trusted Firebase UID.
9. MongoDB is queried to identify the application user.
10. Backend checks account status, role, permissions, and resource ownership.
11. The requested protected resource is returned if authorization succeeds.

### 2.3 Firebase ID Token

A Firebase ID token is a signed token issued after successful authentication.

Example of a simplified token payload:

```json
{
  "uid": "firebase-user-123",
  "email": "user@gmail.com",
  "email_verified": true,
  "name": "Prabhat Kumar",
  "iat": 1793700000,
  "exp": 1793703600,
  "aud": "your-firebase-project"
}
```

This is an illustrative representation, not an actual token.

| Property | Description |
|---|---|
| uid | Unique Firebase user identifier |
| email | User's email address |
| email_verified | Email verification status |
| iat | Token issue timestamp |
| exp | Token expiration timestamp |
| aud | Intended Firebase project |

Firebase ID tokens generally expire after approximately one hour.

The Firebase client SDK automatically refreshes tokens when necessary.

### 2.4 Frontend-to-Backend Communication

The frontend obtains the Firebase ID token using:

```javascript
const idToken = await user.getIdToken();
```

The token is included in protected API requests:

```http
GET /api/v1/users/me
Authorization: Bearer FIREBASE_ID_TOKEN
```

The backend verifies the token:

```javascript
const decodedToken = await admin
    .auth()
    .verifyIdToken(idToken);
```

After successful verification, the backend can use the trusted Firebase UID to identify the application user.

**Security principle:** Never trust a Firebase UID, email, role, or user ID simply because it is provided by the frontend. Identity must come from the verified token.

### 2.5 MongoDB User Management

MongoDB stores application-specific user information.

The existing User model contains:

| Field | Responsibility |
|---|---|
| firebaseUid | Firebase identity reference |
| name | Application profile name |
| email | User email, synchronized with Firebase |
| avatarUrl | User profile image |
| role | Backend-controlled application role |
| credits | Backend-managed credit balance |

Example MongoDB document:

```json
{
  "firebaseUid": "abc123",
  "name": "Prabhat Kumar",
  "email": "user@gmail.com",
  "role": "USER",
  "credits": 10
}
```

The Firebase UID connects the Firebase identity with the MongoDB application profile.

### 2.6 Why We Are Not Implementing Our Own JWT

For the initial architecture, a separate application JWT is unnecessary.

Firebase already provides signed ID tokens, and Firebase Admin SDK can verify them.

The selected architecture is:

- Firebase ID token for authentication.
- Firebase Admin SDK for backend verification.
- MongoDB for application user data and roles.
- Express middleware for authentication and authorization.

We will not introduce another JWT system or implement a separate refresh-token mechanism at this stage.

### 2.7 Security Decisions

The following security rules are mandatory:

1. Never expose Firebase Admin service-account credentials in React.
2. Never store passwords in MongoDB for Google-only authentication.
3. Never allow users to assign themselves the ADMIN role.
4. Never trust frontend-provided credits.
5. Verify Firebase ID tokens on every protected API request.
6. Check whether the application account is active and not blocked.
7. Use HTTPS in production.

### 2.8 Step 3.1 Checkpoint

The following concepts must be understood before implementation:

- Firebase ID token verification establishes the authenticity of the Firebase identity.
- Application roles must be controlled through backend-managed MongoDB data.
- Frontend requests must send Firebase ID tokens through the Authorization Bearer header.

---

## 3. Step 3.2 — Firebase Project Setup

### 3.1 Objective

Configure two separate environments:

**React Frontend**
- Firebase Client SDK.
- Google Sign-in configuration.
- Firebase environment variables.

**Express Backend**
- Firebase Admin SDK.
- Service-account credentials.
- Secure token verification configuration.

### 3.2 Create Firebase Project

1. Open Firebase Console.
2. Sign in using a Google account.
3. Select Create a project.
4. Enter the project name:

`interview-ai`

5. Complete the project setup.
6. Google Analytics can optionally be disabled.
7. Wait for Firebase to finish creating the project.

### 3.3 Enable Google Authentication

Navigate to:

`Firebase Console → Build → Authentication`

Then:

1. Click Get Started if prompted.
2. Open Sign-in Method or Sign-in Providers.
3. Select Google.
4. Enable the Google provider.
5. Select a support email.
6. Save the configuration.

Google Authentication is now enabled for the Firebase project.

### 3.4 Register React Application

A Firebase project and a Firebase web application are separate entities.

Register the React application:

1. Open Firebase Console → Project Overview.
2. Select the Web icon.
3. Enter the application nickname:

`interview-ai-client`

4. Do not enable Firebase Hosting at this stage.
5. Click Register App.
6. Copy the generated Firebase configuration.

Example:

```javascript
const firebaseConfig = {
    apiKey: "AIza...",
    authDomain: "interview-ai.firebaseapp.com",
    projectId: "interview-ai",
    storageBucket: "interview-ai.firebasestorage.app",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};
```

The values above are illustrative. Use the actual configuration generated by Firebase.

**Important:** Firebase web configuration is intended for frontend use. It does not replace backend authentication or security rules. Never expose service-account private keys in frontend code.

### 3.5 Configure Firebase Environment Variables

Install Firebase in the client directory:

```bash
npm install firebase
```

Create:

`client/.env.local`

Add the Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Replace all placeholders with actual Firebase configuration values.

**Why use VITE_?**

Vite exposes environment variables prefixed with `VITE_` to frontend code.

These variables become part of the browser application bundle. Therefore, they must never contain private credentials.

Firebase initialization is intentionally deferred to Step 3.3.

### 3.6 Configure Authorized Domains

Navigate to:

`Firebase Console → Authentication → Settings → Authorized Domains`

Verify that:

`localhost`

is present in the authorized domains list.

If missing, add it.

When InterviewAI is deployed, the production frontend domain must also be added.

### 3.7 Generate Firebase Admin SDK Credentials

The Express backend requires Firebase Admin SDK credentials to verify Firebase ID tokens.

Follow these steps:

1. Open Firebase Console.
2. Navigate to Project Settings.
3. Open the Service Accounts tab.
4. Select Generate New Private Key.
5. Confirm and download the JSON file.

The downloaded service-account JSON contains highly sensitive credentials.

**Credential security requirements:**

- Never upload the file to GitHub.
- Never place it inside the client directory.
- Never share it through screenshots or messages.
- Never expose its contents in frontend code.

Recommended storage location:

```text
C:\Users\YourWindowsUser\firebase-credentials\
    interview-ai-service-account.json
```

Store the credentials outside the InterviewAI project directory.

### 3.8 Prepare Backend Dependencies

Check the installed Node.js version:

```bash
node -v
```

The Firebase Admin Node.js SDK documentation referenced in this setup specifies Node.js 22+ as a prerequisite.

After confirming compatibility, navigate to the server directory and install:

```bash
npm install firebase-admin
```

Firebase Admin SDK initialization will be implemented in Step 3.4.

### 3.9 Protect Credentials Using Git

Open the root `.gitignore` file.

Add the following safeguards if they are not already covered:

```gitignore
# Firebase credentials
*service-account*.json
*serviceAccount*.json
*-firebase-adminsdk-*.json

# Frontend environment files
.env.local
.env.*.local
```

Verify that the frontend environment file is ignored:

```bash
git check-ignore client/.env.local
```

Expected output:

```text
client/.env.local
```

Because the service-account JSON is stored outside the project directory, it cannot accidentally be staged from the project directory.

### 3.10 Step 3.2 Checkpoint

Firebase setup checklist:

- [ ] Created Firebase project `interview-ai`.
- [ ] Enabled Google Authentication provider.
- [ ] Registered `interview-ai-client` web application.
- [ ] Created `client/.env.local` with Firebase configuration.
- [ ] Verified `localhost` as an authorized domain.
- [ ] Downloaded and securely stored Admin SDK credentials outside the project.
- [ ] Installed `firebase-admin` using a compatible Node.js version.
- [ ] Updated and verified `.gitignore`.

---

## 4. Phase 3 Architecture Summary

The planned authentication architecture is:

```text
                 USER
                   |
                   v
            React Frontend
                   |
                   v
         Firebase Authentication
                   |
              Google Sign-in
                   |
                   v
           Firebase ID Token
                   |
                   v
           Express Backend
                   |
                   v
          Authentication Middleware
                   |
                   v
       Firebase Admin SDK Verification
                   |
                   v
             Firebase UID
                   |
                   v
              MongoDB
                   |
          User Profile + Role
                   |
                   v
        Authorization Middleware
                   |
                   v
          Protected API Routes
```

---

## 5. Phase 3 — Implementation Roadmap

| Step | Description | Status |
|---|---|---|
| 3.1 | Authentication Fundamentals | Documented |
| 3.2 | Firebase Project Setup | Documented |
| 3.3 | React Google Authentication Integration | Pending |
| 3.4 | Firebase Admin SDK Backend Integration | Pending |
| 3.5 | Authentication Middleware | Pending |
| 3.6 | Authorization and Role-Based Access Control | Pending |
| 3.7 | MongoDB User Synchronization | Pending |
| 3.8 | Protected API Testing and Validation | Pending |

The steps from 3.3 onward are a proposed documentation roadmap, not implementation details established by the supplied material.

---

## 6. Expected Outcome

After completing Phase 3, InterviewAI should have:

1. Google-based user authentication.
2. Firebase ID token generation and verification.
3. Secure communication between React and Express.
4. MongoDB-based application user profiles.
5. Backend-controlled USER and ADMIN roles.
6. Authentication middleware for protected endpoints.
7. Authorization middleware for role-based access.
8. A foundation for secure application-level resource access.

---

## 7. Conclusion

Phase 3 establishes the security foundation of InterviewAI.

Firebase Authentication will handle user identity, Firebase Admin SDK will validate identity tokens, and MongoDB will maintain application-specific user information and permissions.

This separation ensures that authentication, user management, and authorization remain independent responsibilities while working together within a single application architecture.

**Current documented progress:** Steps 3.1 and 3.2.

**Next step:** Step 3.3 — React Google Authentication Integration.
