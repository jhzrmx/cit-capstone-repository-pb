# Registration OTP (email via SMTP)

Registration uses PocketBase’s **One-time password (OTP)** so the student must receive an email before the account is usable. That email is sent through **SMTP** configured in PocketBase (not in the Vite app).

## 1. Configure SMTP in PocketBase

1. Open **PocketBase Admin** → **Settings** → **Mail settings**.
2. Choose your provider (Gmail app password, SendGrid, Mailgun, SES, etc.) and fill **SMTP host**, **port**, **username**, **password**, **sender address**.
3. Use **Send test email** to confirm delivery.

Without working SMTP, `requestOTP` cannot send mail and registration will fail after the account is created.

## 2. Enable OTP on the `users` collection

1. **Collections** → **users** → open **Auth options** (gear).
2. Enable **One-time password (OTP)**.
3. Set **Duration** (e.g. 600 seconds = 10 minutes) and **length** (e.g. 6 digits).
4. Edit the **OTP email template** if you want; placeholders include `{OTP}`, `{OTP_ID}`, `{EMAIL}` (see [PocketBase docs](https://pocketbase.io/docs/authentication/#otp-mfa)).
5. Save.

The repo’s `pocketbase_collections_schema.json` ships with OTP enabled and a simple template; if you import schema, re-check OAuth2 and mail after import.

## 3. How the app behaves

1. Student submits name, **@cbsua.edu.ph** email, password, department.
2. PocketBase **creates** the user (`verified: false`; no session until OTP).
3. App calls **`requestOTP(email)`** → PocketBase sends the code by SMTP.
4. Student enters the code → **`authWithOTP(otpId, code)`** → session starts and PocketBase sets **verified: true**.

**Password login** is allowed only when **`verified === true`**. Unverified accounts are redirected to **`/verify-email`** (prefilled email) to send the code and finish verification. Same page is linked from Log in as **Verify account with email code**.

**Google sign-in** proves inbox access; after OAuth the app sets **`verified: true`** so those users can use password later if needed.

**Admin-created users** are created with **`verified: true`** so faculty/admin can sign in immediately.

If the user closes the page after step 2 but before step 4, the account still exists: they must use **Send a code** on the login page or finish Register — not password login alone.

## 4. Troubleshooting

| Issue | What to check |
|-------|----------------|
| No email | SMTP settings, spam folder, provider limits. |
| “Failed to send email” | Admin → Mail settings; test email. |
| OTP disabled | users → OTP enabled. |
| Invalid code | Expired (duration); request **Resend code**. |
