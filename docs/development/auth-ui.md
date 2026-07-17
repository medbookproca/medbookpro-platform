# Authentication UI Foundation

## Overview

This document describes the authentication UI and Phase 1 Supabase Auth integration for MedBookPro. The existing form contracts and accessibility behavior are preserved while email/password sign-in and sign-up now use the typed Supabase adapter.

**Important**: Sign-in and sign-up use Supabase Auth with cookie sessions. Password reset, invitation acceptance, and the verification-state demonstration remain mock-only and are explicitly out of scope for this phase.

## Routes

All authentication routes are grouped under the `(auth)` route group in Next.js:

- **`/sign-in`** - Sign in to an existing account
- **`/sign-up`** - Create a new account
- **`/forgot-password`** - Request a password reset
- **`/reset-password`** - Set a new password (mocked)
- **`/verify-email`** - Email verification states (mocked)
- **`/invitations/accept`** - Accept an organization invitation (mocked)

## Reusable Components

All components are located in `packages/ui` and are designed to be reusable across the application:

### Form Components

#### `FormField`

Generic text/email input field with error handling.

```tsx
<FormField
  label="Work Email"
  registration={register('email')}
  error={errors.email?.message}
  type="email"
  placeholder="you@clinic.ca"
  required
/>
```

**Features:**
- Accessible labels with `htmlFor` association
- Error message display via `aria-describedby`
- Proper ARIA attributes (`aria-invalid`, `aria-describedby`)
- Consistent styling
- Support for help text

#### `PasswordField`

Specialized password input with show/hide toggle.

```tsx
<PasswordField
  label="Password"
  registration={register('password')}
  error={errors.password?.message}
  required
/>
```

**Features:**
- Toggle password visibility with accessible button
- Meets accessibility guidelines for screen readers
- Consistent styling with FormField
- Error display

#### `PasswordRequirements`

Visual indicator of password strength requirements.

```tsx
<PasswordRequirements password={passwordValue} />
```

**Requirements tracked:**
- Minimum 12 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one symbol

### Action Components

#### `SubmitButton`

Primary form submission button with loading state.

```tsx
<SubmitButton isLoading={isLoading} loadingText="Signing in...">
  Sign In
</SubmitButton>
```

**Features:**
- Loading state with disabled button
- Accessible loading text
- Focus ring for keyboard navigation

#### `FormAlert`

Status messages (success, error, info, warning).

```tsx
<FormAlert
  type="success"
  title="Account created"
  message="Your account has been created successfully."
/>
```

### Layout Components

#### `BrandWordmark`

MedBookPro brand identifier with optional link.

```tsx
<BrandWordmark href="/" size="lg" />
```

### Dividers & Navigation

#### `AuthDivider`

Horizontal divider with optional text (e.g., "or").

```tsx
<AuthDivider text="or" />
```

#### `InlineLink`

Contextual links with variants for different semantics.

```tsx
<InlineLink href="/sign-up" variant="default">
  Create one
</InlineLink>
```

### Indicators

#### `LoadingIndicator`

Animated loading spinner with optional text.

```tsx
<LoadingIndicator text="Loading..." size="md" />
```

## Validation Schemas

Validation schemas are centralized in `packages/shared` using Zod:

### `signInSchema`

```typescript
{
  email: string (valid email, converted to lowercase)
  password: string (required, non-empty)
  rememberMe: boolean (optional, defaults to false)
}
```

### `signUpSchema`

```typescript
{
  firstName: string (required, 1-100 chars)
  lastName: string (required, 1-100 chars)
  email: string (valid email, converted to lowercase)
  password: passwordSchema
  confirmPassword: string (must match password)
  agreeToTerms: boolean (must be true)
}
```

### `passwordSchema`

Enforced on all password fields:

- **Minimum length**: 12 characters
- **Uppercase**: At least one (A-Z)
- **Lowercase**: At least one (a-z)
- **Number**: At least one (0-9)
- **Symbol**: At least one (!@#$%^&*()_+-=[]{}';:"\\|,.<>\/?)

### `forgotPasswordSchema`

```typescript
{
  email: string (valid email, converted to lowercase)
}
```

### `resetPasswordSchema`

```typescript
{
  password: passwordSchema
  confirmPassword: string (must match password)
}
```

### `acceptInvitationSchema`

```typescript
{
  firstName: string (required, 1-100 chars)
  lastName: string (required, 1-100 chars)
  password: passwordSchema
  confirmPassword: string (must match password)
}
```

## Authentication service boundary

Located at `apps/web/src/lib/auth/mock-auth-service.ts`

`apps/web/src/lib/auth/auth-service.ts` defines the production service contract and Supabase adapter behavior. `apps/web/src/lib/auth/supabase-auth-service.ts` lazily supplies the browser client to that adapter. The existing mock service remains available for the intentionally unimplemented password-reset and invitation UI tests; production sign-in and sign-up no longer import it.

The mock service implements the remaining UI-only contract:

```typescript
class MockAuthService {
  async signIn(request: SignInRequest): Promise<SignInResponse>
  async signUp(request: SignUpRequest): Promise<SignUpResponse>
  async requestPasswordReset(request: PasswordResetRequest): Promise<PasswordResetResponse>
  async resetPassword(request: PasswordResetNewRequest): Promise<PasswordResetNewResponse>
  async acceptInvitation(code: string, request: AcceptInvitationRequest): Promise<AcceptInvitationResponse>
}
```

### Mock characteristics

- **No real authentication**: Methods simulate network delay but don't create sessions
- **No tokens**: No JWT, no access tokens, no refresh tokens generated
- **No storage**: No localStorage, sessionStorage, or cookies used
- **No data persistence**: Passwords and personal data are never stored
- **Neutral responses**: Password reset always returns neutral message to prevent account enumeration

### Example Mock Behavior

```typescript
// This returns success but does NOT create an authenticated session
const response = await mockAuthService.signIn({
  email: 'user@clinic.ca',
  password: 'Password123!'
});
// { success: true, message: "Sign in mock successful for user@clinic.ca..." }
```

## Authentication Layout

The `AuthLayout` component (`apps/web/src/components/auth-layout.tsx`) provides:

- **Header**: MedBookPro wordmark, page heading, description
- **Form area**: Centered card with form content
- **Footer**: Optional contextual links
- **Security notice**: Privacy/terms information
- **Back link**: Return to home page

### Responsive Design

The layout is tested at:

- **320px** (small mobile)
- **375px** (standard mobile)
- **768px** (tablet)
- **1024px** (small desktop)
- **1440px** (large desktop)

Features:
- Gradient background (slate-50 to white)
- Proper spacing and padding
- No horizontal scrolling
- Mobile-first approach
- Touch-friendly input sizes

## Accessibility

All authentication pages meet WCAG baseline requirements:

### Semantic HTML

- `<form>` elements with proper structure
- `<input>` with type attributes (email, password, checkbox)
- `<label>` elements with `htmlFor` association
- `<h1>` for page heading

### ARIA Attributes

- `aria-invalid` on invalid inputs
- `aria-describedby` linking inputs to errors/help text
- `aria-label` on icon buttons (password visibility toggle)
- `role="alert"` on alert components

### Keyboard Navigation

- Logical tab order
- All interactive elements keyboard accessible
- Visible focus rings (`:focus-ring-2` in Tailwind)
- Button feedback on Enter key

### Visual Accessibility

- Sufficient color contrast (tested with WCAG AA)
- No information communicated only through color
- Clear focus indicators
- Error messages not hidden behind required field styling

### Screen Readers

- Form labels announced with inputs
- Error messages associated with fields
- Alert types announced (success, error, warning)
- Placeholder text not used as labels

## Styling & Design System

Uses **Tailwind CSS** with MedBookPro design tokens:

### Color Palette

- **Primary**: `blue-600` (for actions, focus states)
- **Neutral**: `slate-*` (background, borders, text)
- **Success**: `green-*` (positive feedback)
- **Error**: `red-*` (validation errors, failures)
- **Warning**: `yellow-*` (caution messages)
- **Info**: `blue-50` (informational notes)

### Spacing

- Consistent use of `gap-`, `p-`, `m-` utilities
- Responsive padding: `px-4 sm:px-6 lg:px-8`
- Consistent vertical rhythm with `space-y-*`

### Typography

- `text-sm` (12px): small labels, help text
- `text-base` (16px): body text
- `text-lg` (18px): subheadings
- `text-2xl` / `text-3xl`: page headings
- Font families: `font-medium`, `font-semibold` for hierarchy

### Animations

- Loading spinner: `animate-spin`
- Transitions: `transition-colors` for hover effects
- Reduced motion: Respected via media query

## Testing

### Unit Tests

**Location**: `packages/shared/src/auth-schemas.test.ts`

Tests validation schemas:
- Password complexity requirements
- Email format validation
- Password confirmation matching
- Required field validation
- Case normalization

**Location**: `apps/web/src/lib/auth/mock-auth-service.test.ts`

Tests mock service:
- Success responses
- Error handling
- Neutral password reset responses
- Input validation

### E2E Tests

**Location**: `tests/e2e/auth.spec.ts`

Smoke tests verify:
- All routes load without errors
- Form fields are present and visible
- Validation messages appear
- Links between pages work
- Responsive behavior at mobile width
- Accessibility features present

**Run tests:**
```bash
pnpm test                    # Unit tests
pnpm exec playwright test    # E2E tests
```

## What Is NOT Implemented

These features are intentionally excluded from this foundation:

- ❌ Real Supabase connection
- ❌ Database migrations
- ❌ Real authentication backend
- ❌ Session storage (localStorage, cookies)
- ❌ JWT or token generation
- ❌ Password hashing or storage
- ❌ Email sending
- ❌ Email verification workflow
- ❌ Organization/tenant management
- ❌ Permission/role assignment
- ❌ Multi-factor authentication
- ❌ Social authentication (Google, etc.)
- ❌ Password reset with token validation
- ❌ Invitation workflow backend

## Future Backend Integration

When integrating with Supabase:

1. **Replace `MockAuthService`** with `SupabaseAuthService` maintaining the same interface
2. **Keep validation schemas** in packages/shared - reuse on backend
3. **Keep UI components** - they're backend-agnostic
4. **Add session state management** - localStorage, cookies, context, etc.
5. **Implement email verification** - Supabase Auth handles this
6. **Implement password reset** - Use Supabase reset flow
7. **Add organization/invitation system** - Custom backend logic
8. **Update error handling** - Display real backend errors

### Integration Points

| Feature | Mock | Supabase |
|---------|------|----------|
| Validation | Zod schemas | Same + backend |
| Credentials | Ignored | Authenticated |
| Session | None | JWT tokens |
| Email | Not sent | Sent by Supabase |
| Database | None | PostgreSQL |
| Org/Invitations | None | Custom backend |

## Security Notes

**This is a UI-only implementation**, not a security layer. Real security will be implemented in backend integration:

- ✓ Frontend validation (quick feedback, UX)
- ✗ No authentication enforcement in frontend
- ✓ Password requirements enforced in UI
- ✗ No credential storage
- ✓ No sensitive data hardcoded
- ✗ HTTPS not required (this is local dev)
- ✓ Accessible forms don't expose security
- ✗ No real security without backend

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android)

## Development

### Adding a New Auth Page

1. Create route directory: `src/app/(auth)/new-page/`
2. Create `page.tsx` using `AuthLayout`
3. Add validation schema to `packages/shared/src/auth-schemas.ts`
4. Add tests in `auth-schemas.test.ts`
5. Add E2E test in `tests/e2e/auth.spec.ts`
6. Update this documentation

### Styling Changes

All styles use Tailwind CSS. Update `tailwind.config.ts` for design token changes.

### Component Updates

Components are in `packages/ui`. Update `packages/ui/src/index.ts` exports when adding components.

## References

- [Next.js App Router](https://nextjs.org/docs/app)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Validation](https://zod.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Web Accessibility](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Practices](https://www.w3.org/WAI/ARIA/apg/)
