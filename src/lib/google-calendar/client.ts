import { google } from 'googleapis';

/**
 * Google Calendar API client helper
 * Handles OAuth token management and calendar operations
 */

export interface CalendarEvent {
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
}

/**
 * Create Google Calendar client with OAuth tokens
 */
export function createCalendarClient(accessToken: string, refreshToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

/**
 * Create a calendar event
 */
export async function createCalendarEvent(
  accessToken: string,
  refreshToken: string,
  calendarId: string,
  event: CalendarEvent
) {
  const calendar = createCalendarClient(accessToken, refreshToken);

  const response = await calendar.events.insert({
    calendarId: calendarId || 'primary',
    requestBody: event,
  });

  return response.data;
}

/**
 * Update a calendar event
 */
export async function updateCalendarEvent(
  accessToken: string,
  refreshToken: string,
  calendarId: string,
  eventId: string,
  event: Partial<CalendarEvent>
) {
  const calendar = createCalendarClient(accessToken, refreshToken);

  const response = await calendar.events.patch({
    calendarId: calendarId || 'primary',
    eventId,
    requestBody: event,
  });

  return response.data;
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(
  accessToken: string,
  refreshToken: string,
  calendarId: string,
  eventId: string
) {
  const calendar = createCalendarClient(accessToken, refreshToken);

  await calendar.events.delete({
    calendarId: calendarId || 'primary',
    eventId,
  });

  return { success: true };
}

/**
 * List calendar events
 */
export async function listCalendarEvents(
  accessToken: string,
  refreshToken: string,
  calendarId: string,
  options?: {
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
  }
) {
  const calendar = createCalendarClient(accessToken, refreshToken);

  const response = await calendar.events.list({
    calendarId: calendarId || 'primary',
    timeMin: options?.timeMin,
    timeMax: options?.timeMax,
    maxResults: options?.maxResults || 250,
    singleEvents: true,
    orderBy: 'startTime',
  });

  return response.data.items || [];
}

/**
 * Check for event conflicts
 */
export async function checkEventConflicts(
  accessToken: string,
  refreshToken: string,
  calendarId: string,
  startTime: string,
  endTime: string
) {
  const events = await listCalendarEvents(accessToken, refreshToken, calendarId, {
    timeMin: startTime,
    timeMax: endTime,
  });

  return events.length > 0;
}

/**
 * Refresh access token if expired
 */
export async function refreshAccessToken(refreshToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  const { credentials } = await oauth2Client.refreshAccessToken();

  return {
    access_token: credentials.access_token,
    expiry_date: credentials.expiry_date,
  };
}
