# ADR 0003: Session shape per runtime

The same fixture user exists on every template. The storage differs because the platforms differ.

- SPA: access token in `sessionStorage`, read synchronously so the router guard does not race a hydration effect. A production backend should move this to an httpOnly cookie via a BFF. The SSR template is that pattern.
- SSR: `jose` signs an HS256 JWT stored in the `rl_session` httpOnly cookie. `proxy.ts` redirects anonymous users away from `/tasks`. `REACTLOOM_STRICT_SECRETS=true` refuses the documented development secret.
- Mobile: `expo-secure-store` on native, `localStorage` on web export. Fixture mode is the default so the app runs without a backend; turning `EXPO_PUBLIC_USE_FIXTURES` off sends the same login request through the API client.
