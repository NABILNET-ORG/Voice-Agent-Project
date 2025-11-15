import { createBrowserClient, createServerClient } from '@supabase/ssr'
import type { cookies as CookiesType } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client for API routes
export function createClient(cookieStore: Awaited<ReturnType<typeof CookiesType>>) {
  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle cookie set errors in server components
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle cookie remove errors in server components
          }
        },
      },
    }
  )
}

// Database types
export interface Profile {
  id: string
  full_name: string | null
  phone_number: string | null
  avatar_url: string | null
  language_preference: string
  timezone: string
  google_calendar_access_token: string | null
  google_calendar_refresh_token: string | null
  google_calendar_token_expiry: string | null
  created_at: string
  updated_at: string
}

export interface BusinessConfig {
  id: string
  user_id: string
  business_name: string
  business_type: string
  business_category: string
  business_description: string | null
  phone_number: string | null
  address: string | null
  website: string | null
  primary_language: string
  currency: string
  timezone: string
  services: any[] // JSONB array
  business_hours: Record<string, any> // JSONB object
  is_24_7: boolean
  booking_buffer_minutes: number
  max_advance_booking_days: number
  min_advance_booking_hours: number
  allow_same_day: boolean
  max_appointments_per_day: number | null
  break_times: any[] // JSONB array
  google_calendar_id: string
  google_calendar_sync_enabled: boolean
  calendar_sync_frequency: string
  calendar_event_title_template: string
  add_customer_phone_to_event: boolean
  set_event_reminder: boolean
  event_reminder_minutes: number
  ai_voice: string
  ai_voice_personality: string
  ai_system_instructions: string
  greeting_template: string
  confirmation_template: string
  enable_small_talk: boolean
  ask_for_email: boolean
  confirm_before_booking: boolean
  send_instant_confirmation: boolean
  max_call_duration_minutes: number
  voice_detection_sensitivity: string
  speech_speed: string
  enable_call_recording: boolean
  background_noise_handling: string
  customer_notification_email: boolean
  customer_notification_sms: boolean
  send_reminder_notifications: boolean
  reminder_hours_before: number
  notification_language: string | null
  owner_notification_email: string | null
  send_owner_email: boolean
  owner_notification_phone: string | null
  send_owner_sms: boolean
  notification_triggers: string[] // JSONB array
  accepted_payment_methods: string[] // JSONB array
  require_payment_upfront: boolean
  deposit_amount: number | null
  deposit_type: string
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  user_id: string
  call_log_id: string | null
  customer_name: string
  customer_phone: string
  customer_email: string | null
  customer_address: string | null
  delivery_instructions: string | null
  booking_type: string
  service_or_item: string
  category: string | null
  quantity: number
  items: any | null // JSONB
  date: string | null
  time: string | null
  duration_minutes: number | null
  estimated_completion: string | null
  delivery_time_estimate: string | null
  base_price: number | null
  delivery_fee: number | null
  service_fee: number | null
  tax_amount: number | null
  discount_amount: number | null
  total_amount: number | null
  status: string
  priority: string
  google_calendar_event_id: string | null
  confirmation_sent: boolean
  reminder_sent: boolean
  notes: string | null
  special_instructions: string | null
  assigned_to: string | null
  cancellation_reason: string | null
  cancelled_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface CallLog {
  id: string
  user_id: string
  call_sid: string | null
  customer_phone: string | null
  customer_name: string | null
  started_at: string
  ended_at: string | null
  duration_seconds: number | null
  outcome: string
  booking_type: string | null
  transcript: any[] // JSONB array
  sentiment: string | null
  booking_id: string | null
  recording_url: string | null
  recording_duration: number | null
  created_at: string
}
