# Google OAuth Quick Start - IMPORTANT

## Your Credentials

✅ Google OAuth credentials have been added to your `.env` file
✅ App URL configured: `http://localhost:3000`
✅ Ready to test!

---

## ⚠️ REQUIRED: Add Redirect URI in Google Cloud Console

**You MUST add this redirect URI to your Google OAuth configuration:**

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID
3. Click Edit
4. Under **Authorized redirect URIs**, add:
   ```
   http://localhost:3000/api/auth/google/callback
   ```
5. Click **Save**

**For production (when deploying to Vercel), also add:**
```
https://your-app.vercel.app/api/auth/google/callback
```

---

## Test Now

1. **Restart your dev server** (to load new env variables):
   ```bash
   npm run dev
   ```

2. **Navigate to integrations**:
   ```
   http://localhost:3000/settings/integrations
   ```

3. **Click "Connect" on Google Calendar**

4. **You'll see Google's sign-in page!** 🎉

5. **Sign in and authorize access**

6. **Redirected back with success message**

7. **Google Calendar status = Connected**

---

## Required Google Cloud Setup

### APIs to Enable:
- ✅ Google Calendar API

### OAuth Consent Screen:
- App name: AI Booking Agent (or your choice)
- User support email: Your email
- Scopes needed:
  - `https://www.googleapis.com/auth/calendar.events`
  - `https://www.googleapis.com/auth/calendar.readonly`
  - `https://www.googleapis.com/auth/userinfo.email`

### Test Users:
Add your email address to test users list (if app is in Testing mode)

---

## Troubleshooting

**Error: "redirect_uri_mismatch"**
- Solution: Add `http://localhost:3000/api/auth/google/callback` to authorized redirect URIs in Google Console

**Error: "access_denied"**
- Solution: User clicked "Cancel" - just try again

**Error: "oauth_not_configured"**
- Solution: Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are in .env

**Credentials not loading?**
- Solution: Restart dev server after adding to .env

---

## What Happens After Connecting?

1. **Tokens stored in database** (`profiles` table)
2. **Calendar sync enabled** (`business_config.google_calendar_sync_enabled = true`)
3. **Future bookings auto-sync** to Google Calendar
4. **Status shows "Connected"** in integrations page

---

## Ready to Test!

Just add the redirect URI to Google Console and restart your server!
