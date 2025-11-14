# Google OAuth Setup for Calendar Integration

## Overview

The application now supports **real Google OAuth authentication** for Google Calendar integration. When users click "Connect" on Google Calendar in the integrations page, they will be redirected to Google's sign-in page to authorize access.

---

## Setup Instructions

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: "AI Booking Agent" (or your choice)
4. Click "Create"

### 2. Enable Google Calendar API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google Calendar API"
3. Click "Enable"

### 3. Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" (unless you have a Google Workspace)
3. Click "Create"
4. Fill in required fields:
   - **App name**: AI Booking Agent
   - **User support email**: Your email
   - **Developer contact**: Your email
5. Click "Save and Continue"
6. **Scopes**: Click "Add or Remove Scopes"
   - Add: `https://www.googleapis.com/auth/calendar.events`
   - Add: `https://www.googleapis.com/auth/calendar.readonly`
   - Add: `https://www.googleapis.com/auth/userinfo.email`
7. Click "Save and Continue"
8. **Test users**: Add your email address
9. Click "Save and Continue"

### 4. Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Select "Web application"
4. Enter name: "AI Booking Web App"
5. **Authorized redirect URIs**:
   - For local development: `http://localhost:3000/api/auth/google/callback`
   - For production: `https://your-domain.com/api/auth/google/callback`
6. Click "Create"
7. **SAVE YOUR CREDENTIALS**:
   - Client ID: `123456789-abc...apps.googleusercontent.com`
   - Client Secret: `GOCSPX-...`

### 5. Add Environment Variables

Add these to your `.env` file:

```env
# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret-here
```

**For production on Vercel**:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - `NEXT_PUBLIC_APP_URL` = `https://your-app.vercel.app`
   - `GOOGLE_CLIENT_ID` = Your client ID
   - `GOOGLE_CLIENT_SECRET` = Your client secret
3. Redeploy

---

## How It Works

### User Flow:

1. **User clicks "Connect" on Google Calendar**
   ```
   /settings/integrations
   ```

2. **Redirected to Google OAuth**
   ```
   GET /api/auth/google?user_id=<user_id>
   ↓
   Redirects to: https://accounts.google.com/o/oauth2/v2/auth
   ```

3. **User signs in to Google and authorizes**
   - Grants permission to access Calendar
   - Google redirects back to callback

4. **OAuth callback receives authorization code**
   ```
   GET /api/auth/google/callback?code=...&state=<user_id>
   ```

5. **Exchange code for tokens**
   ```
   POST https://oauth2.googleapis.com/token
   Returns: access_token, refresh_token, expires_in
   ```

6. **Store tokens in database**
   ```
   UPDATE profiles SET
     google_calendar_access_token = ...
     google_calendar_refresh_token = ...
     google_calendar_token_expiry = ...
   WHERE id = user_id
   ```

7. **Enable Calendar sync**
   ```
   UPDATE business_config SET
     google_calendar_sync_enabled = true
   WHERE user_id = user_id
   ```

8. **Redirect back to integrations**
   ```
   /settings/integrations?success=google_calendar_connected
   Shows success message
   ```

---

## Database Schema

### Tokens stored in `profiles` table:
```sql
google_calendar_access_token TEXT
google_calendar_refresh_token TEXT
google_calendar_token_expiry TIMESTAMPTZ
```

### Settings stored in `business_config` table:
```sql
google_calendar_sync_enabled BOOLEAN
google_calendar_id TEXT
calendar_sync_frequency TEXT
set_event_reminder BOOLEAN
calendar_event_title_template TEXT
add_customer_phone_to_event BOOLEAN
event_reminder_minutes INTEGER
```

---

## API Routes Created

### `/api/auth/google`
- **Method**: GET
- **Params**: `user_id` (query parameter)
- **Purpose**: Initiates Google OAuth flow
- **Returns**: Redirect to Google sign-in

### `/api/auth/google/callback`
- **Method**: GET
- **Params**: `code`, `state` (from Google)
- **Purpose**: Handles OAuth callback
- **Returns**: Redirect to integrations page with success/error

---

## Security

- ✅ User ID passed via OAuth `state` parameter (secure)
- ✅ Tokens stored in database (not exposed to client)
- ✅ Refresh tokens for long-term access
- ✅ Token expiry tracked
- ✅ HTTPS required in production
- ✅ Row Level Security on database

---

## Testing Locally

1. **Add credentials to `.env`**:
   ```env
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-your-secret
   ```

2. **Restart dev server**:
   ```bash
   npm run dev
   ```

3. **Test the flow**:
   - Sign in to your app
   - Go to Settings → Integrations
   - Click "Connect" on Google Calendar
   - Sign in to Google
   - Authorize access
   - Redirected back with success message
   - Google Calendar status = "Connected"

4. **Verify in database**:
   ```sql
   SELECT
     google_calendar_access_token,
     google_calendar_sync_enabled
   FROM profiles
   WHERE id = 'your-user-id';
   ```

---

## Error Handling

The app handles these errors:

- ❌ Missing credentials → Shows error message
- ❌ User denies permission → Redirects with error
- ❌ OAuth exchange fails → Shows error message
- ❌ Database update fails → Shows error message

All errors show user-friendly messages on the integrations page.

---

## Next Steps (Optional)

### Add More OAuth Integrations:

**Stripe Connect**:
- Similar OAuth flow
- Store Stripe account ID
- Enable payment processing

**Twilio**:
- API key authentication
- Store in environment variables or database

**Slack**:
- OAuth flow similar to Google
- Post notifications to Slack channels

---

## Files Created/Modified

- `src/app/api/auth/google/route.ts` - OAuth initiation
- `src/app/api/auth/google/callback/route.ts` - OAuth callback
- `src/app/settings/integrations/page.tsx` - Updated with OAuth flow
- `.env.example` - Added Google OAuth variables

---

## Production Deployment

When deploying to Vercel:

1. Add authorized redirect URI in Google Cloud Console:
   ```
   https://your-app.vercel.app/api/auth/google/callback
   ```

2. Set environment variables in Vercel

3. Redeploy

Google Calendar integration will work seamlessly in production!
