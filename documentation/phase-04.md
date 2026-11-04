# prabhavAI
## Frontend Dashboard, Navigation & Profile — Development Documentation

**Project:** prabhavAI  
**Module:** Frontend Development  
**Technology:** React.js, Redux Toolkit, React Router, CSS  
**Milestone:** Dashboard & User Profile Integration  
**Status:** Core implementation completed; final UI verification pending

---

# 1. Overview

This development milestone focuses on building and integrating the main authenticated user interface of prabhavAI.

The objective was to replace temporary testing pages with functional dashboard sections, implement protected navigation, introduce role-based sidebar visibility, and create a user profile page connected to Redux authentication state.

The milestone also establishes reusable UI components and a consistent styling approach.

## 1.1 Key objectives

1. Assemble the main user dashboard.
2. Integrate reusable dashboard components.
3. Register application pages using React Router.
4. Protect authenticated routes.
5. Implement profile and interview-history navigation.
6. Display admin navigation conditionally.
7. Create a reusable error-state component.
8. Display authenticated user information through Redux.
9. Establish consistent styling using global CSS variables.
10. Resolve frontend import and runtime errors.

---

# 2. Global Design System

**File:** `client/src/index.css`

A centralized design-token system was established to maintain consistency across the application.

## 2.1 Design tokens

The following CSS variables were introduced:

| Category | Variables | Purpose |
|---|---|---|
| Brand | `--color-primary`, `--color-primary-hover` | Primary brand colors |
| Background | `--color-background`, `--color-surface` | Page and component backgrounds |
| Sidebar | `--color-sidebar` | Dashboard sidebar |
| Typography | `--color-heading`, `--color-text`, `--color-muted` | Text hierarchy |
| Status | `--color-success`, `--color-danger`, `--color-warning` | Status indicators |
| Borders | `--color-border` | Consistent borders |
| Font | `--font-primary` | Global typography |
| Radius | `--radius-sm`, `--radius-md`, `--radius-lg` | Component corner radius |
| Shadows | `--shadow-card` | Card elevation |
| Spacing | `--space-1` through `--space-8` | Consistent spacing |

## 2.2 Global styling

The global stylesheet also provides:

- Universal `box-sizing: border-box`.
- Default body typography.
- Consistent heading colors.
- Standardized form-element typography.
- Global anchor styling.
- Responsive layout adjustments.

## 2.3 Existing layout styling

The stylesheet supports the following layouts:

- Public layout.
- Authentication layout.
- Dashboard layout.
- Sidebar navigation.
- Dashboard navbar.
- Dashboard content.

The purpose is to avoid repeating styling definitions across individual pages.

---

# 3. Dashboard Assembly

**File:** `client/src/pages/Dashboard.jsx`

The temporary Redux and design-system testing page was replaced with the actual dashboard implementation.

## 3.1 Dashboard components

The dashboard is assembled using five main components.

| Component | Responsibility |
|---|---|
| PageHeader | Displays page title and description |
| WelcomeSection | Greets the authenticated user |
| StatsCards | Displays dashboard statistics and credits |
| QuickActions | Provides shortcuts to application functionality |
| RecentActivity | Displays recent user activity |

## 3.2 Redux integration

The dashboard retrieves authenticated user information from the Redux store.

```jsx
const user = useSelector((state) => state.auth.user);
```

This allows dashboard components to receive user-specific information.

The first name is extracted using:

```jsx
user?.name?.split(" ")[0]
```

Credits are passed through:

```jsx
<StatsCards credits={user?.credits} />
```

Optional chaining prevents errors when user information is temporarily unavailable.

## 3.3 Dashboard rendering structure

```text
Dashboard
│
├── PageHeader
│
├── WelcomeSection
│
├── StatsCards
│
├── QuickActions
│
└── RecentActivity
```

This modular structure separates dashboard responsibilities and makes individual sections easier to maintain.

---

# 4. Dashboard Component Organization

During implementation, the existing folder structure was retained.

The dashboard-related components are located directly inside `src/components/`.

```text
client/src/
│
├── components/
│   │
│   ├── common/
│   │   ├── PageHeader.jsx
│   │   └── ErrorState.jsx
│   │
│   ├── shared/
│   │   ├── Sidebar.jsx
│   │   └── Navbar.jsx
│   │
│   ├── ui/
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   └── Input.jsx
│   │
│   ├── WelcomeSection.jsx
│   ├── StatsCards.jsx
│   ├── QuickActions.jsx
│   └── RecentActivity.jsx
│
├── pages/
│   ├── Dashboard.jsx
│   ├── ResumeAnalysis.jsx
│   ├── MockInterview.jsx
│   ├── InterviewHistory.jsx
│   ├── Profile.jsx
│   ├── Login.jsx
│   └── AdminDashboard.jsx
│
├── layouts/
│   ├── MainLayout.jsx
│   ├── AuthLayout.jsx
│   └── DashboardLayout.jsx
│
├── routes/
│   ├── ProtectedRoute.jsx
│   └── AdminRoute.jsx
│
└── index.css
```

Note: This represents the relevant frontend organization for this milestone, not necessarily every file in the repository.

---

# 5. React Router Integration

**File:** `client/src/App.jsx`

The application routing configuration was updated to register the remaining user-facing pages.

React Router is responsible for navigation between application pages without requiring full browser reloads.

## 5.1 Public routes

The public layout contains the root route.

The root URL redirects users to:

`/dashboard`

## 5.2 Authentication routes

The authentication layout contains:

`/login`

This route renders the Login component.

## 5.3 Protected dashboard routes

All authenticated user pages are registered as children of the existing DashboardLayout.

| Route | Component |
|---|---|
| `/dashboard` | Dashboard |
| `/resume-analysis` | ResumeAnalysis |
| `/mock-interview` | MockInterview |
| `/interview-history` | InterviewHistory |
| `/profile` | Profile |

The route hierarchy is:

```text
ProtectedRoute
│
└── DashboardLayout
    │
    ├── Dashboard
    ├── ResumeAnalysis
    ├── MockInterview
    ├── InterviewHistory
    └── Profile
```

This ensures that authenticated pages share the dashboard layout.

## 5.4 Admin routes

The admin section remains separate from the normal user routes.

```text
AdminRoute
│
└── DashboardLayout
    │
    └── AdminDashboard
```

The admin route is:

`/admin`

This separation allows admin access checks to remain independent of ordinary user navigation.

## 5.5 Layout rendering

The DashboardLayout must contain React Router's `Outlet` component.

```jsx
import { Outlet } from "react-router-dom";
```

The `Outlet` renders the currently matched child route inside the shared layout.

---

# 6. Sidebar Navigation & Role-Based Visibility

**File:** `client/src/components/shared/Sidebar.jsx`

The existing sidebar navigation was retained and extended.

## 6.1 Branding

The sidebar branding was standardized as:

`prabhavAI`

## 6.2 Navigation items

The sidebar contains:

1. Overview
2. Resume Analysis
3. Mock Interview
4. Interview History
5. Profile

React Router's `NavLink` is used to navigate between pages.

The active route receives the `active` CSS class.

## 6.3 Redux user integration

The sidebar retrieves the authenticated user:

```jsx
const user = useSelector((state) => state.auth.user);
```

## 6.4 Conditional Admin navigation

The Admin Dashboard link is displayed only when:

```jsx
user?.role === "ADMIN"
```

Implementation:

```jsx
{user?.role === "ADMIN" && (
    <NavLink
        to="/admin"
        className="nav-link"
    >
        Admin Dashboard
    </NavLink>
)}
```

### Expected behaviour

| User role | Admin link |
|---|---|
| USER | Hidden |
| ADMIN | Visible |

**Security consideration:** Sidebar visibility is only a frontend presentation rule. It does not provide security by itself. AdminRoute and backend authorization must independently enforce administrative access.

---

# 7. ErrorState Component

**File:** `client/src/components/common/ErrorState.jsx`

A reusable error-state component was introduced to provide a consistent error presentation throughout the application.

## 7.1 Component responsibilities

The component accepts three props:

| Prop | Description |
|---|---|
| `title` | Error heading |
| `message` | Error description |
| `onRetry` | Optional retry callback |

Default values:

- Title: Something went wrong.
- Message: We couldn't complete your request.

## 7.2 Retry functionality

The component uses the reusable Button component.

```jsx
{onRetry && (
    <Button
        variant="secondary"
        onClick={onRetry}
    >
        Try Again
    </Button>
)}
```

The retry button is rendered only when an `onRetry` callback is provided.

## 7.3 Styling

Error-state styling includes:

- Circular error indicator.
- Red error background.
- Consistent typography.
- Muted error description.
- Reusable secondary button.

The corresponding CSS was added to:

`client/src/index.css`

This keeps the error-state styling within the existing global stylesheet.

---

# 8. Profile Page Implementation

**File:** `client/src/pages/Profile.jsx`

A dedicated profile page was implemented to display authenticated user information.

## 8.1 Data integration

The Profile component retrieves user information from Redux:

```jsx
const user = useSelector((state) => state.auth.user);
```

No separate user information is hardcoded into the component.

## 8.2 Profile information

The profile page displays:

| Field | Source |
|---|---|
| Profile initial | User name |
| Full name | `user.name` |
| Email address | `user.email` |
| Account role | `user.role` |
| Available credits | `user.credits` |

Fallback values are provided for unavailable user information.

## 8.3 Avatar generation

The profile avatar uses the first character of the user's name.

```jsx
{user?.name?.charAt(0)?.toUpperCase() || "U"}
```

This provides a basic initial-based avatar without requiring profile image upload functionality.

## 8.4 Profile page structure

```text
Profile
│
├── PageHeader
│   ├── Title: My Profile
│   └── Description
│
└── Card
    │
    ├── Profile Avatar
    │
    ├── Profile Information
    │   ├── Full Name
    │   └── Email
    │
    └── Profile Details
        ├── Full Name
        ├── Email Address
        ├── Account Role
        └── Available Credits
```

## 8.5 Profile styling

**File:** `client/src/features/dashboard/profile.css`

The profile stylesheet defines:

- Profile page width.
- Profile card dimensions.
- Circular avatar.
- User information spacing.
- Profile details grid.
- Responsive layout.

The profile details use a two-column grid on larger screens and a single-column layout on screens below 600px.

The stylesheet must be imported inside Profile.jsx:

```jsx
import "../features/dashboard/profile.css";
```

Without this import, the profile CSS rules will not be applied.

## 8.6 Profile verification

The profile page was opened successfully at:

`http://localhost:5173/profile`

The displayed information included:

- Name: Prabhat Kumar
- Account role: USER
- Available credits: 250
- User email retrieved from the authenticated user state.

The screenshot confirmed that Redux data retrieval and page routing were working.

The profile-specific styling import was subsequently identified as necessary to apply the avatar and profile grid styling.

---

# 9. Debugging & Issues Resolved

Several frontend issues were encountered during integration.

## 9.1 Incorrect import paths

**Problem:** Vite reported:

`Failed to resolve import`

The dashboard code initially assumed that components existed inside:

```text
features/dashboard/components/
```

However, the actual files were located directly inside:

```text
src/components/
```

**Resolution:** Import paths were corrected to match the existing folder structure.

For example:

Incorrect:

```jsx
import Card from "./components/ui/Card";
```

Correct:

```jsx
import Card from "./ui/Card";
```

This correction was applied to the affected dashboard components.

## 9.2 Undefined Button component

**Problem:**

```text
Uncaught ReferenceError: Button is not defined
```

The WelcomeSection component attempted to render Button without importing it.

**Resolution:**

```jsx
import Button from "./ui/Button";
```

## 9.3 Duplicate InterviewHistory import

**Problem:** InterviewHistory was accidentally imported twice in App.jsx while adding the Profile page.

**Resolution:** Duplicate imports were removed, leaving one import per component.

## 9.4 Profile stylesheet not applied

**Problem:** The Profile page rendered correctly, but its custom styling was not applied.

**Cause:** The profile stylesheet needed to be imported into Profile.jsx.

**Resolution:**

```jsx
import "../features/dashboard/profile.css";
```

## 9.5 Browser console warnings

Some browser console warnings related to EventEmitter listeners and ObjectMultiplex were observed.

These originated from a browser extension content script and were not identified as the primary cause of the application rendering issues.

---

# 10. Testing & Verification

The following functionality was checked during this milestone.

| Test | Expected result | Observation |
|---|---|---|
| Dashboard route | Dashboard renders | Integrated |
| Redux user retrieval | User data available | Working |
| Dashboard component imports | Components resolve | Corrected |
| Resume Analysis route | Protected page loads | Registered |
| Mock Interview route | Protected page loads | Registered |
| Interview History route | Protected page loads | Registered |
| Profile route | Profile page renders | Verified |
| Profile name | Redux name displayed | Working |
| Profile email | Redux email displayed | Working |
| Profile role | USER role displayed | Working |
| Profile credits | Credit balance displayed | Working |
| Sidebar navigation | Navigation links displayed | Implemented |
| Admin sidebar link | Visible only for ADMIN | Implemented |
| ErrorState | Reusable error presentation | Created |

---

# 11. Final Architecture

The frontend structure now follows a modular component-based approach.

```text
                prabhavAI
                    |
                    v
              React Frontend
                    |
          ---------------------
          |         |         |
          v         v         v
       Redux     Router    CSS System
          |         |         |
          v         v         v
       User      Protected   Design
       State      Routes     Tokens
                    |
                    v
              DashboardLayout
                    |
          ---------------------
          |         |         |
          v         v         v
       Sidebar   Navbar    Page Content
                              |
                  ------------------------
                  |      |       |       |
                  v      v       v       v
               Dashboard Resume  Mock  Profile
                         Analysis Interview
```

---

# 12. Current Development Status

### Completed implementation work

- Global design tokens.
- Dashboard assembly.
- Redux user-data integration.
- Reusable dashboard components.
- Protected user route registration.
- Admin route separation.
- Sidebar navigation.
- Conditional admin navigation.
- ErrorState component.
- Profile page.
- Profile-specific stylesheet.
- Import-path and runtime debugging.

### Remaining verification

- Verify profile CSS after importing it.
- Test all protected routes individually.
- Test sidebar visibility using both USER and ADMIN accounts.
- Verify unauthorized users cannot access admin APIs.
- Verify responsive behaviour across dashboard pages.
- Confirm the final frontend build completes without errors.

---

# 13. Conclusion

This milestone establishes the primary authenticated user interface of prabhavAI.

The dashboard now uses reusable React components and Redux-managed user information. React Router provides structured navigation through protected routes, while the sidebar provides role-dependent navigation visibility.

The Profile page demonstrates successful integration between the frontend, Redux authentication state, and user-specific application data.

The implementation also introduces a reusable ErrorState component and establishes a consistent global styling foundation.

**Next development direction:** Complete frontend verification and proceed with the next application feature, keeping the existing component architecture and authentication flow intact.