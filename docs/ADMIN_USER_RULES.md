# User collection API rules (admin User Management)

If **editing or deleting users** in the admin UI returns **404** (or fails silently), PocketBase is blocking the request.

## Cause

Default-style rules often allow only **self** update/delete:

- `updateRule`: `id = @request.auth.id`
- `deleteRule`: `id = @request.auth.id`

Then `PATCH /api/collections/users/records/<other-user-id>` does **not** satisfy the rule, and the API responds as if the resource were missing (**404**).

## Fix (PocketBase Admin)

1. Open **Collections** → **users** → **API rules**.
2. Set:
   - **Update rule:**  
     `id = @request.auth.id || @request.auth.role = 'admin'`
   - **Delete rule:**  
     `id = @request.auth.id || @request.auth.role = 'admin'`
3. Save.

Admins can then update/delete any user; everyone else can still only change/delete their own account.

`pocketbase_collections_schema.json` in this repo matches these rules for reference when re-importing or documenting the project.
