# Software-Design-Group-18

## Development Staff Logins

When the backend runs locally (any `NODE_ENV` other than `production`), it creates these demo staff accounts on startup if they do not already exist. Log in at `http://localhost:5173/staff-login`.

Admin:
- Email: admin@queuesmart.test
- Password: AdminTest123!

Employee:
- Email: employee@queuesmart.test
- Password: EmployeeTest123!

These are development/demo credentials only. They are never created when `NODE_ENV=production`.

Passwords are stored as bcrypt hashes. Starting the backend again reuses the existing accounts and does not reset their passwords. To use different logins, set `DEV_ADMIN_EMAIL`, `DEV_ADMIN_PASSWORD`, `DEV_EMPLOYEE_EMAIL`, `DEV_EMPLOYEE_PASSWORD` and `DEV_EMPLOYEE_ID` (default `1`) before starting the backend.
