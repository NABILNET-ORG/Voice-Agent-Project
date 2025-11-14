import { supabase, Booking, CallLog, BusinessConfig, Profile } from './supabase'

// Bookings API
export const bookingsApi = {
  // Get all bookings for the current user
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Booking[]
  },

  // Get bookings by status
  async getByStatus(userId: string, status: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Booking[]
  },

  // Get upcoming bookings
  async getUpcoming(userId: string) {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .gte('date', today)
      .in('status', ['confirmed', 'pending'])
      .order('date', { ascending: true })
      .order('time', { ascending: true })

    if (error) throw error
    return data as Booking[]
  },

  // Get today's bookings
  async getToday(userId: string) {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .in('status', ['confirmed', 'pending'])
      .order('time', { ascending: true })

    if (error) throw error
    return data as Booking[]
  },

  // Get bookings for date range
  async getByDateRange(userId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (error) throw error
    return data as Booking[]
  },

  // Create a new booking
  async create(booking: Partial<Booking>) {
    const { data, error } = await supabase
      .from('bookings')
      .insert(booking)
      .select()
      .single()

    if (error) throw error
    return data as Booking
  },

  // Update a booking
  async update(id: string, updates: Partial<Booking>) {
    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Booking
  },

  // Cancel a booking
  async cancel(id: string, reason?: string) {
    const { data, error } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Booking
  },

  // Mark booking as completed
  async complete(id: string) {
    const { data, error } = await supabase
      .from('bookings')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Booking
  },

  // Delete a booking
  async delete(id: string) {
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}

// Call Logs API
export const callLogsApi = {
  // Get all call logs
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('call_logs')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })

    if (error) throw error
    return data as CallLog[]
  },

  // Get call logs by outcome
  async getByOutcome(userId: string, outcome: string) {
    const { data, error } = await supabase
      .from('call_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('outcome', outcome)
      .order('started_at', { ascending: false })

    if (error) throw error
    return data as CallLog[]
  },

  // Get recent calls (last N days)
  async getRecent(userId: string, days: number = 7) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('call_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('started_at', startDate.toISOString())
      .order('started_at', { ascending: false })

    if (error) throw error
    return data as CallLog[]
  },

  // Get call log by ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('call_logs')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as CallLog
  },

  // Create a call log
  async create(callLog: Partial<CallLog>) {
    const { data, error } = await supabase
      .from('call_logs')
      .insert(callLog)
      .select()
      .single()

    if (error) throw error
    return data as CallLog
  },

  // Update a call log
  async update(id: string, updates: Partial<CallLog>) {
    const { data, error } = await supabase
      .from('call_logs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as CallLog
  },
}

// Business Config API
export const businessConfigApi = {
  // Get business config for user
  async get(userId: string) {
    const { data, error } = await supabase
      .from('business_config')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return data as BusinessConfig
  },

  // Update business config
  async update(userId: string, updates: Partial<BusinessConfig>) {
    const { data, error } = await supabase
      .from('business_config')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data as BusinessConfig
  },

  // Create business config (usually done automatically on signup)
  async create(config: Partial<BusinessConfig>) {
    const { data, error } = await supabase
      .from('business_config')
      .insert(config)
      .select()
      .single()

    if (error) throw error
    return data as BusinessConfig
  },
}

// Profile API
export const profileApi = {
  // Get user profile
  async get(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data as Profile
  },

  // Update user profile
  async update(userId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data as Profile
  },
}

// Analytics API (computed from existing data)
export const analyticsApi = {
  // Get booking statistics
  async getBookingStats(userId: string) {
    const today = new Date().toISOString().split('T')[0]
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)

    // Today's bookings
    const { data: todayData } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('date', today)

    // This week's bookings
    const { data: weekData } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', weekAgo.toISOString())

    // This month's bookings
    const { data: monthData } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', monthAgo.toISOString())

    // Total bookings
    const { data: totalData } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)

    return {
      today: todayData || 0,
      thisWeek: weekData || 0,
      thisMonth: monthData || 0,
      total: totalData || 0,
    }
  },

  // Get revenue statistics
  async getRevenueStats(userId: string) {
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)

    const { data, error } = await supabase
      .from('bookings')
      .select('total_amount, created_at')
      .eq('user_id', userId)
      .in('status', ['confirmed', 'completed'])
      .gte('created_at', monthAgo.toISOString())

    if (error) throw error

    const total = data?.reduce((sum, booking) => sum + (booking.total_amount || 0), 0) || 0
    return {
      total,
      count: data?.length || 0,
      average: data?.length ? total / data.length : 0,
    }
  },

  // Get call statistics
  async getCallStats(userId: string) {
    const { data, error } = await supabase
      .from('call_logs')
      .select('outcome, duration_seconds')
      .eq('user_id', userId)

    if (error) throw error

    const stats = {
      total: data?.length || 0,
      successful: data?.filter(call => call.outcome === 'booking-confirmed').length || 0,
      failed: data?.filter(call => call.outcome === 'no-booking').length || 0,
      averageDuration: data?.length
        ? data.reduce((sum, call) => sum + (call.duration_seconds || 0), 0) / data.length
        : 0,
    }

    return {
      ...stats,
      successRate: stats.total ? (stats.successful / stats.total) * 100 : 0,
    }
  },

  // Get bookings over time (daily)
  async getBookingsOverTime(userId: string, days: number = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('bookings')
      .select('date, created_at')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (error) throw error

    // Group by date
    const grouped = data?.reduce((acc: any, booking) => {
      const date = booking.date || booking.created_at.split('T')[0]
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {})

    return Object.entries(grouped || {}).map(([date, count]) => ({
      date,
      bookings: count,
    }))
  },

  // Get service popularity
  async getServicePopularity(userId: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select('service_or_item')
      .eq('user_id', userId)

    if (error) throw error

    // Count occurrences
    const counts = data?.reduce((acc: any, booking) => {
      const service = booking.service_or_item || 'Unknown'
      acc[service] = (acc[service] || 0) + 1
      return acc
    }, {})

    const colors = ['#84CC16', '#22c55e', '#15803d', '#10b981', '#14b8a6']

    return Object.entries(counts || {}).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length],
    }))
  },

  // Get peak booking hours
  async getPeakHours(userId: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select('time')
      .eq('user_id', userId)
      .not('time', 'is', null)

    if (error) throw error

    // Group by hour
    const hourCounts = data?.reduce((acc: any, booking) => {
      if (!booking.time) return acc
      const hour = parseInt(booking.time.split(':')[0])
      const hourLabel = hour === 0 ? '12 AM' :
                       hour < 12 ? `${hour} AM` :
                       hour === 12 ? '12 PM' :
                       `${hour - 12} PM`
      acc[hourLabel] = (acc[hourLabel] || 0) + 1
      return acc
    }, {})

    return Object.entries(hourCounts || {}).map(([hour, bookings]) => ({
      hour,
      bookings,
    }))
  },
}
