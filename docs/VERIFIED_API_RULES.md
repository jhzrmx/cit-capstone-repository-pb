# Verified-only API rules (student-facing)

Student-facing collections require **`@request.auth.verified = true`** so unverified accounts (registered, OTP not done) cannot read/write repository data via the API.

## Left open on purpose

| Collection | Why |
|------------|-----|
| **departments** | `list` / `view` stay **public** — Register needs departments while logged out. |
| **users** | `create` stays open — sign-up. OTP / OAuth set `verified`. |

## Rules summary

| Collection | Rule |
|------------|------|
| **tags** | List/view: `verified` **or** faculty **or** admin. |
| **authors** | List/view/create: verified **or** faculty/admin (create still needs verified for students: `id != '' && verified`). |
| **capstones** | Faculty/admin: full list/view. Students: **verified** and only **approved** or **own** rows. Create/update own: **verified**. |
| **search_logs** | Create: **verified** only. List/view: faculty/admin. |

## Apply in PocketBase Admin

**Collections → [name] → API rules** — paste from below if your DB predates the schema file.

### tags — list & view
```txt
@request.auth.verified = true || @request.auth.role = 'faculty' || @request.auth.role = 'admin'
```

### authors — list & view
```txt
@request.auth.verified = true || @request.auth.role = 'faculty' || @request.auth.role = 'admin'
```

### authors — create
```txt
@request.auth.id != '' && @request.auth.verified = true
```

### capstones — list & view
```txt
@request.auth.id != '' && ((@request.auth.role = 'faculty' || @request.auth.role = 'admin') || (@request.auth.verified = true && (status = 'approved' || created_by = @request.auth.id)))
```

### capstones — create
```txt
@request.auth.id != '' && @request.auth.verified = true
```

### capstones — update
```txt
(@request.auth.verified = true && created_by = @request.auth.id) || @request.auth.role = 'faculty' || @request.auth.role = 'admin'
```

### search_logs — create
```txt
@request.auth.id != '' && @request.auth.verified = true
```
