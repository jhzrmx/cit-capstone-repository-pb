# PocketBase Schema – CIT Capstone Repository

Create these collections in the PocketBase Admin UI (`/admin`). Auth uses the built-in **users** collection; add the custom fields below.

**Import collections (schema):** Use **`pocketbase_collections_schema.json`** in the PocketBase Dashboard: **Settings → Import collections**. This creates **departments**, **tags**, **capstones**, **search_logs**, and adds **role** (select: student | faculty | admin) and **department** (relation → departments) to the **users** collection. Import merges with existing collections, so existing user records and auth fields (email, password, etc.) are kept. If you already imported once without the users block, re-import the updated schema file to add the role and department columns.

**Seed data (records):** See **`pocketbase_seed_data.json`** for example records. The dashboard cannot import record data from JSON; use that file as reference for manual entry or run a seed script against the API.

---

## 1. Users (extend default auth collection)

PocketBase provides a default `users` collection. Add these **custom fields**:

| Field         | Type     | Required | Notes                    |
|---------------|----------|----------|--------------------------|
| name          | text     | yes      | Display name             |
| role          | select   | yes      | Options: student, faculty, admin |
| department    | relation | no       | Single, collection: **departments** (students pick on signup; admin sets for faculty) |

Keep default: `email`, `password`, `emailVisibility`, etc.

**Registration:** Only students can self-register (via the app). Faculty and admin users are created and managed by admins in the dashboard.

**API rules (list/view/update):**  
- **List/View:** Students see only their own record. Faculty and admin can list/view all users (needed for author search and user management).  
- **Manage:** `manageRule = @request.auth.role = 'admin'` so app admins get full manage access: they see **email** (and other auth fields) for all users and can update/delete any user. Without this, email is hidden for other users due to PocketBase’s `emailVisibility` unless the requester satisfies the manage rule.  
- **Update/Delete:** Users can update/delete only their own record; admins (via manage rule) can update/delete any user.  
- **Create:** Admins create new users; students self-register (app logic).

---

## 2. Departments

Admin-managed list of departments. Students choose one when registering.

| Field   | Type   | Required | Notes        |
|---------|--------|----------|--------------|
| name    | text   | yes      | e.g. "Information Technology" |
| code    | text   | yes      | Unique, e.g. "IT" or "CS" |

**API rules:**  
- List/view: anyone (so the registration page can load the dropdown).  
- Create/update/delete: admin only.

---

## 3. Tags

| Field   | Type   | Required | Notes        |
|---------|--------|----------|--------------|
| name    | text   | yes      | e.g. "web app" |

**API rules:**  
- List/view: anyone (public read).  
- Create/update/delete: admin only.

**Example records:**  
- name: "web app"  
- name: "mobile app"  
- name: "iot"  
- name: "ai"  
- name: "machine learning"  
- name: "networking"

---

## 4. Authors

Join table between capstones and people (system users or free-text names). A capstone can have multiple authors; each author is either linked to a **user** (if they are in the system) or stored as a **name** only.

| Field   | Type     | Required | Notes                                  |
|---------|----------|----------|----------------------------------------|
| name    | text     | yes      | Display name (use user's name or type) |
| user    | relation | no       | Single, collection: users (optional)   |
| created | date     | auto     |                                        |
| updated | date     | auto     |                                        |

**API rules:**  
- **Create:** any authenticated user (when creating/editing a capstone).  
- **Update/delete:** admin only.

---

## 5. Capstones

| Field           | Type      | Required | Notes                                  |
|-----------------|-----------|----------|----------------------------------------|
| title           | text      | yes      |                                        |
| abstract        | text      | yes      |                                        |
| authors         | relation  | yes      | Multiple, collection: **authors**      |
| tags            | relation  | no       | Multiple, collection: tags              |
| pdf_file        | file      | no       | Single file, PDF only                   |
| repository_link | url       | no       |                                        |
| year            | number    | yes      |                                        |
| status          | select    | yes      | pending, approved, rejected            |
| approved_by     | relation  | no       | Single, collection: users               |
| created_by      | relation  | no       | Single, collection: users (optional)    |
| created         | date      | auto     |                                        |
| updated         | date      | auto     |                                        |

**Relationship:** Capstones link to **authors** (not directly to users). Each author record has a **name** and an optional **user** relation, so legacy or imported capstones can list authors who are not system users.

**Note:** Search (list with filters) is only available to authenticated users in the app; the API rules below still apply per role.

**API rules:**  
- **List:**  
  - Students: filter `status = 'approved'` only (or own submissions).  
  - Faculty/Admin: no filter (all records).  
- **View:**
  - Students: approved capstones or own.  
  - Faculty/Admin: all.  
- **Create:**  
  - Students: allowed; set `status = 'pending'`, `created_by = auth.id`.  
  - Faculty/Admin: allowed.  
- **Update:**  
  - Students: own records only (e.g. while pending).  
  - Faculty: all (approve/reject, edit metadata).  
  - Admin: all.  
- **Delete:**  
  - Faculty/Admin only.

---

## 6. SearchLogs

| Field        | Type     | Required | Notes                    |
|--------------|----------|----------|--------------------------|
| query        | text     | yes      | Search keyword           |
| user         | relation | no       | Single, collection: users |
| tags_clicked | text     | no       | e.g. comma-separated ids  |
| created      | date     | auto     |                          |

**API rules:**  
- **Create:** authenticated users (student/faculty/admin).  
- **List/view:** faculty and admin only (for dashboard).  
- **Update/delete:** admin only (or disable).

---

## Permission summary

| Action              | Student     | Faculty   | Admin |
|---------------------|------------|-----------|-------|
| Read approved capstones | ✓       | ✓         | ✓     |
| Read all capstones  | own only   | ✓         | ✓     |
| Submit capstone     | ✓ (pending)| ✓         | ✓     |
| Approve/reject      | ✗          | ✓         | ✓     |
| Edit capstone       | own (pending) | ✓      | ✓     |
| Delete capstone     | ✗          | ✓         | ✓     |
| Manage users        | ✗          | ✗         | ✓     |
| Manage departments  | ✗          | ✗         | ✓     |
| Log search          | ✓          | ✓         | ✓     |
| View SearchLogs     | ✗          | ✓         | ✓     |

Configure these in PocketBase Admin: **Settings → Collection → [collection] → API Rules**.
