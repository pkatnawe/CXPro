# AI-Native Commissioning — Features

A CX Alloy-style commissioning platform with full CRUD across all modules.

---

## Modules

### Projects
- Create / edit / archive projects
- Project status (Planning, In Progress, Complete)
- Assign project manager and team members
- Project start and end dates

### Equipment & Assets
- Add / edit / delete equipment
- Fields: name, type, tag/serial, location, status
- Status: Active, Pending, Decommissioned
- Link equipment to a project

### Checklists
- Create checklist templates per project
- Add / edit / delete checklist items
- Mark items complete / incomplete
- Assign items to users
- Quick-add via Enter key
- Progress counter (done / total)

### Issues & Deficiencies
- Log issues against equipment or checklist items
- Fields: title, description, severity, status, assignee
- Severity: Low, Medium, High, Critical
- Status: Open, In Progress, Resolved, Closed
- Comment thread per issue

### Users & Team
- Invite / edit / deactivate users
- Roles: Admin, Engineer, Technician, Viewer
- Assign users to projects

### Dashboard
- Summary stats: open issues, checklist progress, equipment counts
- Recent activity feed
- Issues by severity chart



---

## Additional Features (Nice to Have)
- Offline support / local storage persistence
- Export checklist or issue log to CSV/PDF
- Photo / file attachments on issues
- Email notifications on issue assignment
- Audit log (who changed what and when)
