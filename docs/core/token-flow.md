# Token Flow (Browser → API)

This covers how browser-initiated requests reach FastAPI. All patterns assume Keycloak issues JWTs.

## Pattern A: BFF (Backend-for-Frontend)

```mermaid
sequenceDiagram
    participant B as Browser
    participant N as Next.js_Server
    participant A as Keycloak
    participant F as FastAPI

    B->>N: Login request
    N->>A: OIDC auth (server-to-server)
    A->>N: Access + Refresh tokens
    N->>N: Store tokens in server session
    B->>N: API request (session cookie only)
    N->>F: Proxy request + JWT in Authorization header
    F->>N: Response
    N->>B: Response
```

- Browser never sees JWT
- Tokens stored server-side (Redis/memory)
- Next.js API routes proxy to FastAPI
- Pros: Most secure, no token exposure
- Cons: Added latency, Next.js becomes bottleneck

## Pattern B: httpOnly Cookie

```mermaid
sequenceDiagram
    participant B as Browser
    participant N as Next.js
    participant A as Keycloak
    participant F as FastAPI

    B->>N: Login
    N->>A: OIDC auth
    A->>N: Tokens
    N->>B: Set httpOnly cookie with JWT
    B->>F: Direct API call (cookie auto-sent)
    F->>F: Extract JWT from cookie
    F->>B: Response
```

- Browser calls FastAPI directly
- JWT in httpOnly cookie (not accessible to JS)
- Requires CORS + CSRF protection
- Pros: Lower latency, direct calls
- Cons: Cookie size limits, CSRF handling needed

### Final config (recommended)

**Cookie**

```
Set-Cookie: jwt=<token>; Domain=.example.com; Path=/; HttpOnly; Secure; SameSite=None
```

**FastAPI CORS**

```
Allow-Origin: https://app.example.com
Allow-Credentials: true
```

**Browser fetch**

```js
fetch("https://api.example.com/...", { credentials: "include" })
```

**Notes**

- Works across `app.example.com` and `api.example.com` (same site).
- Does not work for `extern.test.com` (different registrable domain).

## Pattern C: Authorization Header (Direct)

```mermaid
sequenceDiagram
    participant B as Browser
    participant N as Next.js
    participant A as Keycloak
    participant F as FastAPI

    B->>N: Login
    N->>A: OIDC auth
    A->>N: Tokens
    N->>B: Return JWT to client (memory/localStorage)
    B->>F: API call with Authorization: Bearer <token>
    F->>F: Validate JWT
    F->>B: Response
```

- Browser stores JWT in memory/localStorage
- Sends via Authorization header
- Pros: Standard OAuth flow, stateless
- Cons: XSS risk if localStorage

## Comparison

| Pattern | Security | Latency | Complexity | Best For |
|---------|----------|---------|------------|----------|
| BFF | Highest | Higher | Medium | Sensitive data, compliance |
| httpOnly Cookie | High | Low | Medium | Standard web apps |
| Direct Header | Medium | Lowest | Low | SPAs, mobile-first |
