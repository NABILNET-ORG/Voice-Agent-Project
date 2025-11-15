# TestSprite Automated Testing Setup

## Overview

TestSprite is now integrated into your Voice Agent project for automated end-to-end testing.

---

## Installation

✅ **Already Installed**:
```bash
npm install -D @testsprite/testsprite-mcp
```

---

## Configuration

### API Key
Added to `.env`:
```env
TESTSPRITE_API_KEY=your-api-key-here
```

### Config File
Created `testsprite.config.js` with test suites for:
- Authentication (sign in, protected routes)
- Bookings Management (view, export CSV)
- Call History
- Settings (tabs, Knowledge Base)
- Integrations (Google Calendar, Stripe, Twilio)
- Live Demo Voice Agent

---

## Running Tests

### Run All Tests
```bash
npm test
```

### Run with UI (Visual Test Runner)
```bash
npm run test:ui
```

### Watch Mode (Auto-rerun on changes)
```bash
npm run test:watch
```

### Run Specific Suite
```bash
npm test -- --suite="Authentication"
```

---

## Test Suites Included

### 1. Authentication Tests
- ✅ User can sign in
- ✅ Protected routes redirect to login
- ✅ Invalid credentials show error

### 2. Bookings Management
- ✅ Can view bookings page
- ✅ Can export bookings to CSV
- ✅ Can filter bookings
- ✅ Can cancel booking

### 3. Call History
- ✅ Can view call logs
- ✅ Can view transcripts
- ✅ Can export call history

### 4. Settings Tests
- ✅ Can access settings
- ✅ Can navigate between tabs
- ✅ Knowledge Base section exists
- ✅ Can add website source

### 5. Integrations
- ✅ Can view integrations page
- ✅ All 8 integrations displayed
- ✅ Can connect/disconnect

### 6. Live Demo
- ✅ Page loads correctly
- ✅ Connect button exists
- ✅ Transcript area visible

---

## Test Configuration

### Environments
- **Development**: `http://localhost:3000`
- **Staging**: `https://voice-agent-project-staging.vercel.app`
- **Production**: `https://voice-agent-project.vercel.app`

### Settings
- Timeout: 30 seconds per test
- Retries: 2 attempts on failure
- Screenshots: Enabled
- Screenshot on failure: Enabled

---

## Writing Custom Tests

Edit `testsprite.config.js` to add more tests:

```javascript
{
  name: "My Test",
  url: "/my-page",
  requiresAuth: true,
  actions: [
    { type: "click", selector: "button" },
    { type: "fill", selector: "input", value: "test" },
    { type: "wait", duration: 1000 }
  ],
  assertions: [
    { type: "exists", selector: "h1" },
    { type: "text", selector: ".result", value: "Success" }
  ]
}
```

---

## Test Results

Tests will generate:
- **Console output** with pass/fail for each test
- **Screenshots** (saved to `test-results/screenshots/`)
- **Test report** (HTML format)
- **Failure logs** with detailed error info

---

## CI/CD Integration

### GitHub Actions
Add to `.github/workflows/test.yml`:
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build
      - run: npm test
        env:
          TESTSPRITE_API_KEY: ${{ secrets.TESTSPRITE_API_KEY }}
```

### Vercel Deploy Hooks
Run tests before deployment:
```json
{
  "buildCommand": "npm run build && npm test"
}
```

---

## Example Output

```
Running TestSprite Tests...

✓ Authentication
  ✓ User can sign in (2.3s)
  ✓ Protected routes redirect to login (1.1s)

✓ Bookings Management
  ✓ Can view bookings page (1.5s)
  ✓ Can export bookings to CSV (0.8s)

✓ Settings
  ✓ Can access settings page (1.2s)
  ✓ Knowledge Base section exists (0.9s)

6 tests passed, 0 failed
Total time: 7.8s
```

---

## Troubleshooting

### API Key Not Found
- Check `.env` file has `TESTSPRITE_API_KEY`
- Restart terminal to reload environment variables

### Tests Timing Out
- Increase timeout in `testsprite.config.js`
- Check if app is running (`npm run dev`)

### Screenshots Not Saving
- Create `test-results/screenshots/` directory
- Check write permissions

---

## Next Steps

1. **Run your first test**:
   ```bash
   npm test
   ```

2. **View results in UI**:
   ```bash
   npm run test:ui
   ```

3. **Add more custom tests** to `testsprite.config.js`

4. **Set up CI/CD** to run tests automatically

---

Happy Testing! 🧪
