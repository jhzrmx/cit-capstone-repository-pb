# OAuth login (Google) – CBSUA only

The app enforces **@cbsua.edu.ph** after Google sign-in. Non‑CBSUA Google accounts are signed out immediately; new OAuth sign-ups with the wrong domain are deleted so they don’t clutter the users collection.

### After schema migration / import

Importing or migrating the **users** collection (e.g. new API rules) often sets **OAuth2 → enabled: false** or drops the Google provider. If login then shows **Missing or invalid provider "google"**, open **Admin → Collections → users → OAuth2**, turn OAuth2 **on** again, re-add **Google** (Client ID + Secret + redirect URI in Google Cloud), and save.

## If you only see “Something went wrong.”

That text is the PocketBase JS SDK’s **generic** error. The real cause is almost always one of the following:

### 1. Realtime / EventSource can’t reach PocketBase (very common)

Google sign-in uses a **popup** and a **live connection** (SSE) from the browser to PocketBase so the app receives the OAuth code when the popup returns.

- Keep **PocketBase running** the whole time (don’t close the terminal).
- **Same machine:** open the app and PB on URLs the browser can reach (e.g. `http://127.0.0.1:5173` + `http://127.0.0.1:8090`).
- **Ad blockers / privacy extensions** sometimes block EventSource to `127.0.0.1` — try disabling for localhost or another browser.
- **Corporate VPN / firewall** may block SSE — try off VPN or allow local 8090.
- After our update, the login page should show a **more specific** message (e.g. “realtime connection interrupted”). If you see that, fix connectivity to PB first.

### 2. `VITE_POCKETBASE_URL` must match how you open PocketBase

Use the **exact** origin PocketBase listens on:

| You start PB as | Set in `.env` |
|-----------------|---------------|
| `http://127.0.0.1:8090` | `VITE_OAUTH_PROVIDER=google` and `VITE_POCKETBASE_URL=http://127.0.0.1:8090` |
| `http://localhost:8090` | `VITE_POCKETBASE_URL=http://localhost:8090` |

Restart Vite after changing env. Mismatch can break OAuth or realtime.

### 3. Google Cloud redirect URI (must match PocketBase host)

**Authorized redirect URIs** must include **exactly**:

`{your PocketBase origin}/api/oauth2-redirect`

Examples:

- `http://127.0.0.1:8090/api/oauth2-redirect`
- `http://localhost:8090/api/oauth2-redirect`

Add **both** if you switch between 127.0.0.1 and localhost.

### 4. Provider name in PocketBase = `VITE_OAUTH_PROVIDER`

In **Admin → Collections → users → OAuth2**, the provider row has a **name** (often `google`). That must equal:

```env
VITE_OAUTH_PROVIDER=google
```

If you renamed it, set the env to that name.

### 5. OAuth2 enabled and Client ID / Secret filled

In the same OAuth2 screen: enable the provider, paste **Client ID** and **Client secret** from Google Cloud, save.

---

## PocketBase checklist

1. Open **Admin** → **Collections** → **users** → **OAuth2**.
2. Enable OAuth2 and add provider **Google** (Client ID + Secret from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)).
3. **Authorized redirect URIs** in Google Cloud (**Credentials → your OAuth client → Authorized redirect URIs**) must match **exactly** what PocketBase sends. That URL is always:

   **`{your PocketBase origin}/api/oauth2-redirect`**

   | If PocketBase URL is | Add this redirect URI in Google |
   |----------------------|----------------------------------|
   | `http://127.0.0.1:8090` | `http://127.0.0.1:8090/api/oauth2-redirect` |
   | `http://localhost:8090` | `http://localhost:8090/api/oauth2-redirect` |

   **`localhost` and `127.0.0.1` are not the same** to Google. If you see **Error 400: redirect_uri_mismatch** and the error shows `redirect_uri=http://127.0.0.1:8090/...`, you must add that exact URI in Google (or change `VITE_POCKETBASE_URL` to `http://localhost:8090` and use only the localhost redirect URI).

   **Easiest fix:** add **both** redirect URIs in Google Cloud so either hostname works:

   - `http://127.0.0.1:8090/api/oauth2-redirect`
   - `http://localhost:8090/api/oauth2-redirect`

   Production: `https://your-domain.com/api/oauth2-redirect` (HTTPS, same host as PocketBase).

4. **Authorized JavaScript origins** (optional for this flow): e.g. `http://localhost:5173` for the Vite app only; the redirect URI is what must match the error message.
5. **Mapped fields**: keep defaults so `name` and `avatar` sync; email comes from the provider.
6. Save.

## App env

```env
VITE_OAUTH_PROVIDER=google
VITE_POCKETBASE_URL=http://127.0.0.1:8090
```

If you name the provider differently in PocketBase, set `VITE_OAUTH_PROVIDER` to that id.

## Optional: restrict Google to your domain

In Google Workspace you can limit which accounts can use the OAuth client (e.g. internal only). That is configured in Google Cloud, not in this repo.
