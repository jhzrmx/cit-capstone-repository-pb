# Capstone access (logged-in + verified students)

- **App:** `/capstone/:id` and `/search` require login.
- **API:** Guests get **403**. **Students** must be **`verified`** and may only list/view **approved** capstones or **their own** submissions. **Faculty/admin** keep full access.

See **`docs/VERIFIED_API_RULES.md`** for full list/view/create/update text and other collections (tags, authors, search_logs).

### capstones — list & view (current)

```txt
@request.auth.id != '' && ((@request.auth.role = 'faculty' || @request.auth.role = 'admin') || (@request.auth.verified = true && (status = 'approved' || created_by = @request.auth.id)))
```
