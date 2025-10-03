# 🚀 EXECUTE CLEANUP NOW

## Quick Steps (3 minutes):

### 1️⃣ Open SQL Editor
👉 https://supabase.com/dashboard/project/wgdmgvonqysflwdiiols/sql/new

### 2️⃣ Paste & Run This SQL:
```sql
DROP TABLE IF EXISTS an_leave_requests CASCADE;
DROP TABLE IF EXISTS an_pilot_checks CASCADE;
DROP TABLE IF EXISTS an_pilots CASCADE;
DROP TABLE IF EXISTS an_check_types CASCADE;
```

### 3️⃣ Verify Success:
```bash
node verify-cleanup.js
```

---

## ✅ What This Does:
- Deletes 4 unused legacy tables (33 total rows of old dev data)
- Keeps all production data (27 pilots, 571 certifications)
- Keeps `an_users` (active authentication)

## 🔒 Safety:
- Zero code uses these tables
- Data already backed up
- Can rollback via Supabase backups if needed

---

**Ready? Go to the SQL Editor link above and paste the SQL!**
