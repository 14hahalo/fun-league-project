# Authentication Setup Guide

This guide explains how to set up authentication for your Fun League application.

## Overview

The application uses JWT-based authentication with the following features:
- **Nickname + Password** login (no email required)
- **Role-based access control** (ADMIN vs PLAYER)
- **Default password** for new players: `player123`
- **Mandatory password change** on first login with default password
- **Session-based tokens** stored in sessionStorage (cleared on browser close)

## Quick Start

### Option 1: Create Initial Admin User (Recommended)

Run this script to create your first admin account:

```bash
cd domain
npx ts-node src/scripts/seedAdminUser.ts
```

**Default Admin Credentials:**
- Nickname: `admin`
- Password: `admin123`
- Role: `ADMIN`

You can customize these credentials by editing `domain/src/scripts/seedAdminUser.ts` before running.

### Option 2: Migrate Existing Players

If you already have players in the database without authentication fields, run:

```bash
cd domain
npx ts-node src/scripts/migrateExistingPlayers.ts
```

This will:
- Add password field (hashed `player123`)
- Set role to `PLAYER`
- Set `needsPasswordChange` to `true`
- Allow all existing players to login with password `player123`

## Utility Scripts

### 1. Generate Hashed Password

Generate a hashed password for manual Firebase Console entry:

```bash
cd domain
npx ts-node src/scripts/generatePassword.ts [your-password]
```

**Example:**
```bash
npx ts-node src/scripts/generatePassword.ts mySecurePass123
```

Output:
```
🔐 Generating hashed password...

✅ Password hashed successfully!

Original Password: mySecurePass123
Hashed Password: $2b$10$...
```

### 2. Seed Admin User

Create an initial admin account:

```bash
cd domain
npx ts-node src/scripts/seedAdminUser.ts
```

**Customize Admin Details:**
Edit `domain/src/scripts/seedAdminUser.ts` and modify the `ADMIN_DATA` object:

```typescript
const ADMIN_DATA = {
  nickname: 'youradmin',
  email: 'admin@yourdomain.com',
  password: 'yourSecurePassword',
  firstName: 'Your',
  lastName: 'Name',
  role: PlayerRole.ADMIN,
  needsPasswordChange: false,
  isActive: true,
};
```

### 3. Migrate Existing Players

Add authentication fields to players without them:

```bash
cd domain
npx ts-node src/scripts/migrateExistingPlayers.ts
```

## Authentication Flow

### 1. Admin Adds New Player

When admin creates a player via Admin Panel:
- Password is automatically set to `player123` (hashed)
- Role is set to `PLAYER`
- `needsPasswordChange` flag is set to `true`

### 2. Player First Login

When a player logs in with the default password:
1. Login succeeds and returns `needsPasswordChange: true`
2. User is automatically redirected to `/change-password` page
3. User must enter current password (`player123`) and new password
4. After successful password change, `needsPasswordChange` is set to `false`

### 3. Subsequent Logins

Players login with their nickname and chosen password. No password change required.

## API Endpoints

### Public Endpoints

- `POST /api/auth/login` - Login with nickname and password
- `POST /api/auth/refresh` - Refresh access token

### Protected Endpoints

- `POST /api/auth/logout` - Logout (requires authentication)
- `POST /api/auth/change-password` - Change password (requires authentication)
- `GET /api/auth/me` - Get current user (requires authentication)

## Environment Variables

Ensure these are set in `domain/.env`:

```env
JWT_ACCESS_SECRET=your-access-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
```

## Manual Database Entry (Firebase Console)

If you prefer to manually create a user in Firebase Console:

1. Generate a hashed password using the script:
   ```bash
   npx ts-node src/scripts/generatePassword.ts yourPassword
   ```

2. In Firebase Console, add a new document to `players` collection:
   ```json
   {
     "nickname": "username",
     "email": "user@example.com",
     "password": "<paste-hashed-password>",
     "role": "ADMIN",
     "needsPasswordChange": false,
     "isActive": true,
     "firstName": "First",
     "lastName": "Last",
     "photoUrl": null,
     "jerseyNumber": null,
     "position": null,
     "refreshToken": null,
     "createdAt": "2024-01-01T00:00:00.000Z",
     "updatedAt": "2024-01-01T00:00:00.000Z"
   }
   ```

## Troubleshooting

### Cannot Login

1. **Check if player exists with auth fields:**
   - Open Firebase Console
   - Check `players` collection
   - Verify player has `password` and `role` fields

2. **Run migration script** if players exist without auth fields:
   ```bash
   npx ts-node src/scripts/migrateExistingPlayers.ts
   ```

3. **Create admin user** if no users exist:
   ```bash
   npx ts-node src/scripts/seedAdminUser.ts
   ```

### CORS Errors

Make sure your frontend port matches the CORS configuration in `domain/src/app.ts`:
```typescript
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
}));
```

### JWT Errors

Verify environment variables are loaded:
- Check `domain/.env` file exists
- Ensure `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are set
- Restart the server after changing `.env`

## Default Credentials Summary

**Default Player Password:** `player123`
**Default Admin (from seed script):**
- Nickname: `admin`
- Password: `admin123`

Remember to change the default admin password after first login for security!
