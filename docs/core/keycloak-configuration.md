# Keycloak Session & Token Configuration

This document provides recommended settings and best practices for configuring Keycloak sessions and tokens for the Analytics Platform.

## Overview

Keycloak manages authentication through three main mechanisms:

| Mechanism | Purpose | Typical Lifespan |
|-----------|---------|------------------|
| **Access Token** | Short-lived credential for API authorization | 5-15 minutes |
| **Refresh Token** | Used to obtain new access tokens | Tied to SSO session |
| **SSO Session** | Server-side session tracking user authentication state | 30 min idle / 10 hours max |

**Key Principle**: Access tokens should never outlast their corresponding refresh tokens, and refresh tokens are tied to the SSO session lifespan.

---

## Session Settings

Navigate to: **Realm Settings > Sessions**

### SSO Session Settings

| Setting | Recommended | Description |
|---------|-------------|-------------|
| **SSO Session Idle** | 30 minutes | Time before an inactive session expires. Balances security with user convenience. |
| **SSO Session Max** | 10-24 hours | Maximum session duration regardless of activity. Caps how long a user stays authenticated. |
| **SSO Session Idle Remember Me** | (default) | Extended idle timeout when "Remember Me" is checked at login. |
| **SSO Session Max Remember Me** | (default) | Extended max timeout when "Remember Me" is checked. |

### Client Session Settings

| Setting | Recommended | Description |
|---------|-------------|-------------|
| **Client Session Idle** | (inherit from SSO) | Leave unset to use SSO values. Override only for specific client needs. |
| **Client Session Max** | (inherit from SSO) | Leave unset to use SSO values. |

### Offline Session Settings

| Setting | Recommended | Description |
|---------|-------------|-------------|
| **Offline Session Idle** | 7-30 days | For offline access tokens (e.g., mobile apps). |
| **Offline Session Max Limited** | Disabled | When enabled, caps offline session duration. |

### Login Settings

| Setting | Recommended | Description |
|---------|-------------|-------------|
| **Login Timeout** | 30 minutes | Time allowed to complete the login flow. |
| **Login Action Timeout** | 5 minutes | Time for specific login actions (password reset, etc.). |

---

## Token Settings

Navigate to: **Realm Settings > Tokens**

### Access Tokens

| Setting | Recommended | Description |
|---------|-------------|-------------|
| **Access Token Lifespan** | 5 minutes | Short lifespan reduces risk if token is compromised. Must be ≤ SSO Session Idle. |
| **Access Token Lifespan (Implicit Flow)** | 15 minutes | For implicit flow clients (not recommended for new apps). |
| **Default Signature Algorithm** | RS256 | Industry standard asymmetric signing algorithm. |

### Refresh Tokens

| Setting | Recommended | Description |
|---------|-------------|-------------|
| **Revoke Refresh Token** | Disabled (or Enabled with Reuse=0) | When enabled, each refresh token can only be used once. |
| **Refresh Token Max Reuse** | 0 | Prevents replay attacks by disallowing token reuse. |

---

## Client Configuration

Navigate to: **Clients > [Your Client] > Settings**

### Capability Config

| Setting | Web Apps | Service Accounts |
|---------|----------|------------------|
| **Client Authentication** | On (confidential) | On |
| **Standard Flow** | Enabled | Disabled |
| **Direct Access Grants** | Enabled (for credentials flow) | Disabled |
| **Service Account Roles** | Disabled | Enabled |

### OpenID Connect Compatibility (Advanced Tab)

| Setting | Recommended | Description |
|---------|-------------|-------------|
| **Use Refresh Tokens** | On | Must be enabled for token refresh to work. |
| **Use Refresh Tokens for Client Credentials** | Off | Not needed for service accounts. |

### Client Session Overrides (Advanced Tab)

| Setting | Recommended | Description |
|---------|-------------|-------------|
| **Access Token Lifespan** | Inherit from realm | Override only if client needs different lifespan. |
| **Client Session Idle** | Inherit from realm | Override only for specific requirements. |
| **Client Session Max** | Inherit from realm | Override only for specific requirements. |

---

## Best Practices

### 1. Token Lifespan Hierarchy

```
Access Token < Refresh Token ≤ SSO Session Idle < SSO Session Max
    (5 min)      (30 min)         (30 min)         (10 hours)
```

### 2. Security Recommendations

- **Short access tokens**: 5-15 minutes max. Reduces exposure window if compromised.
- **Refresh token rotation**: Enable "Revoke Refresh Token" with Max Reuse = 0.
- **HTTPS only**: Never transmit tokens over unencrypted connections.
- **Secure storage**: Store tokens in httpOnly cookies, not localStorage.

### 3. User Experience Considerations

- **SSO Session Idle**: 30 minutes is standard. Shorter = more secure, but more re-logins.
- **SSO Session Max**: 8-24 hours for workday apps. Longer for "Remember Me" scenarios.
- **Silent refresh**: Implement token refresh before expiry (60s buffer recommended).

### 4. ROPC (Resource Owner Password Credentials) Flow

When using Direct Access Grants (email/password login):

- Ensure **"Use Refresh Tokens"** is enabled in client settings
- The refresh token lifespan is tied to SSO Session Idle
- Implement proper refresh logic in your application

---

## Current Settings (analytics-platform realm)

### Sessions

| Setting | Value |
|---------|-------|
| SSO Session Idle | 30 Minutes |
| SSO Session Max | 10 Hours |
| Offline Session Idle | 7 Days |
| Login Timeout | 30 Minutes |
| Login Action Timeout | 5 Minutes |

### Tokens

| Setting | Value |
|---------|-------|
| Access Token Lifespan | 5 Minutes |
| Access Token Lifespan (Implicit) | 15 Minutes |
| Revoke Refresh Token | Disabled |
| Default Signature Algorithm | RS256 |

### Analytics-app Client

| Setting | Value |
|---------|-------|
| Client Authentication | On (confidential) |
| Direct Access Grants | Enabled |
| Use Refresh Tokens | On |
| Session Settings | Inherits from realm |

---

## Troubleshooting

### Session vs Token Expiration

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| `/api/auth/session` returns 200, but API returns 401 | Access token expired, refresh failed | Check refresh token logic, verify "Use Refresh Tokens" is enabled |
| Immediate 401 after login | Access token not being stored | Check JWT callback in auth config |
| 401 after ~5 minutes | Access token expired, no refresh | Verify refresh token exists and refresh logic triggers |
| 401 after ~30 minutes | SSO session expired | User needs to re-login, or increase SSO Session Idle |

### Debugging Token Refresh

Add logging to your auth configuration:

```typescript
// In JWT callback
console.log('[Auth] Token check:', {
  expiresAt: token.expiresAt,
  isExpired: Date.now() >= (token.expiresAt as number) * 1000,
  hasRefreshToken: !!token.refreshToken,
});
```

### Common Issues

1. **Refresh token not returned**: Ensure "Use Refresh Tokens" is enabled in client Advanced settings.
2. **Refresh fails silently**: Add error logging to the refresh endpoint call.
3. **Token not persisted**: Verify the JWT callback returns the updated token correctly.

---

## References

- [Keycloak Server Administration Guide](https://www.keycloak.org/docs/latest/server_admin/)
- [Session Management in Keycloak](https://skycloak.io/blog/session-management-in-keycloak-from-refresh-to-idle-timeouts/)
- [Keycloak Session/Token Timeouts Discussion](https://github.com/keycloak/keycloak/discussions/14128)
