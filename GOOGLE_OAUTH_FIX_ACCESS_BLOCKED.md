# Fix "Access Blocked" Google OAuth Error

## The Problem

When clicking "Connect" on Google Calendar, you see:
```
Access blocked: Voice-Agent-Project has not completed the Google verification process.
The app is currently being tested, and can only be accessed by developer-approved testers.
```

## The Solution

You need to add your email as a **Test User** in Google Cloud Console.

---

## Step-by-Step Fix:

### 1. Go to Google Cloud Console OAuth Consent Screen

https://console.cloud.google.com/apis/credentials/consent

### 2. Find "Test users" Section

Scroll down to the **"Test users"** section

### 3. Click "ADD USERS"

Click the **"+ ADD USERS"** button

### 4. Add Your Email

Enter your Google account email address (the one shown in the error):
```
nabilgpt.en@gmail.com
```

(Or any other Gmail account you want to test with)

### 5. Click "SAVE"

Click the **"SAVE"** button at the bottom

---

## Alternative: Publish the App (Skip Verification)

If you want anyone to be able to use it without being a test user:

### Option 1: Publish to "Testing" (Recommended for now)

1. Go to OAuth Consent Screen
2. Keep "Publishing status" as **"Testing"**
3. Add all test users you need
4. Up to 100 test users allowed

### Option 2: Publish to "Production"

1. Go to OAuth Consent Screen
2. Click **"PUBLISH APP"**
3. Click **"Confirm"**
4. ⚠️ Note: Your app will work immediately, but Google may review it later

For your use case (personal/business tool), **staying in Testing mode** and adding test users is the easiest solution.

---

## After Adding Test User

1. **Go back to your app**: http://localhost:3000/settings/integrations
2. **Click "Connect"** on Google Calendar again
3. **Sign in with the email you just added as a test user**
4. **Authorize access** ✅
5. **Success!** You'll be redirected back with tokens stored

---

## Verification

After connecting successfully, check your database:

```sql
SELECT
  google_calendar_access_token,
  google_calendar_sync_enabled
FROM profiles
WHERE id = 'your-user-id';
```

You should see:
- `google_calendar_access_token`: `ya29.a0...` (Google access token)
- `google_calendar_sync_enabled`: `true`

---

## Quick Link

Add test user here:
👉 https://console.cloud.google.com/apis/credentials/consent

Then try connecting again! It will work. ✅
