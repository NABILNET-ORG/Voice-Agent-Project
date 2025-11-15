module.exports = {
  apiKey: process.env.TESTSPRITE_API_KEY,
  projectName: "Voice Agent Project",
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  // Test suites
  suites: [
    {
      name: "Authentication",
      tests: [
        {
          name: "User can sign in",
          url: "/login",
          actions: [
            { type: "fill", selector: 'input[type="email"]', value: "test@example.com" },
            { type: "fill", selector: 'input[type="password"]', value: "password123" },
            { type: "click", selector: 'button[type="submit"]' },
            { type: "waitForNavigation" }
          ],
          assertions: [
            { type: "url", value: "/bookings" }
          ]
        },
        {
          name: "Protected routes redirect to login",
          url: "/bookings",
          assertions: [
            { type: "url", contains: "/login" }
          ]
        }
      ]
    },
    {
      name: "Bookings Management",
      tests: [
        {
          name: "Can view bookings page",
          url: "/bookings",
          requiresAuth: true,
          assertions: [
            { type: "exists", selector: "h1", text: "Bookings" },
            { type: "exists", selector: '[role="table"]' }
          ]
        },
        {
          name: "Can export bookings to CSV",
          url: "/bookings",
          requiresAuth: true,
          actions: [
            { type: "click", selector: 'button:has-text("Export CSV")' }
          ],
          assertions: [
            { type: "download", filename: /bookings.*\.csv$/ }
          ]
        }
      ]
    },
    {
      name: "Call History",
      tests: [
        {
          name: "Can view call history",
          url: "/calls",
          requiresAuth: true,
          assertions: [
            { type: "exists", selector: "h1", text: "Call History" },
            { type: "exists", selector: '[role="table"]' }
          ]
        }
      ]
    },
    {
      name: "Settings",
      tests: [
        {
          name: "Can access settings page",
          url: "/settings",
          requiresAuth: true,
          assertions: [
            { type: "exists", selector: "h1", text: "Business Settings" }
          ]
        },
        {
          name: "Can navigate between settings tabs",
          url: "/settings",
          requiresAuth: true,
          actions: [
            { type: "click", selector: '[data-value="ai-config"]' },
            { type: "wait", duration: 500 }
          ],
          assertions: [
            { type: "exists", text: "AI Model Provider" }
          ]
        },
        {
          name: "Knowledge Base section exists",
          url: "/settings",
          requiresAuth: true,
          actions: [
            { type: "click", selector: '[data-value="ai-config"]' },
            { type: "scroll", selector: "h3:has-text('Knowledge Base')" }
          ],
          assertions: [
            { type: "exists", text: "Knowledge Base" },
            { type: "exists", text: "Add Website" }
          ]
        }
      ]
    },
    {
      name: "Integrations",
      tests: [
        {
          name: "Can view integrations page",
          url: "/settings/integrations",
          requiresAuth: true,
          assertions: [
            { type: "exists", selector: "h1", text: "Integrations" },
            { type: "exists", text: "Google Calendar" },
            { type: "exists", text: "Stripe" },
            { type: "exists", text: "Twilio" }
          ]
        }
      ]
    },
    {
      name: "Live Demo Voice Agent",
      tests: [
        {
          name: "Live Demo page loads",
          url: "/",
          assertions: [
            { type: "exists", selector: "h1", text: "AI Business Assistant Demo" },
            { type: "exists", selector: 'button:has-text("Phone")' }
          ]
        }
      ]
    }
  ],

  // Global settings
  timeout: 30000,
  retries: 2,
  screenshots: true,
  screenshotOnFailure: true,

  // Environment-specific settings
  environments: {
    development: {
      baseUrl: "http://localhost:3000"
    },
    staging: {
      baseUrl: "https://voice-agent-project-staging.vercel.app"
    },
    production: {
      baseUrl: "https://voice-agent-project.vercel.app"
    }
  }
};
