import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn, formatTime } from '../lib/utils';

interface Booking {
  id: string;
  customer_name: string;
  customer_phone: string;
  service_or_item: string;
  date: string;
  time: string;
  status: string;
  total_amount: number;
  booking_type: string;
}

interface BookingCalendarProps {
  bookings: Booking[];
  view: 'month' | 'week' | 'day';
  onBookingClick: (booking: Booking) => void;
}

export function BookingCalendar({ bookings, view, onBookingClick }: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-500/20 border-green-500/50 text-green-400';
      case 'pending':
        return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400';
      case 'cancelled':
        return 'bg-red-500/20 border-red-500/50 text-red-400';
      case 'completed':
        return 'bg-blue-500/20 border-blue-500/50 text-blue-400';
      default:
        return 'bg-muted border-muted text-foreground';
    }
  };

  // Get bookings for a specific date
  const getBookingsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return bookings.filter((b) => b.date === dateStr);
  };

  // Navigation functions
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get days for month view
  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: Date[] = [];
    const current = new Date(startDate);

    // Generate 6 weeks (42 days)
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  // Get days for week view
  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // Month View
  if (view === 'month') {
    const days = getMonthDays();
    const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{monthName}</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={goToPrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={goToNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {days.map((day, index) => {
            const dayBookings = getBookingsForDate(day);
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = day.toDateString() === new Date().toDateString();

            return (
              <div
                key={index}
                className={cn(
                  'min-h-24 p-2 border border-muted rounded-lg',
                  !isCurrentMonth && 'bg-muted/20 opacity-50',
                  isToday && 'border-primary bg-primary/10'
                )}
              >
                <div className="text-sm font-medium mb-1">{day.getDate()}</div>
                <div className="space-y-1">
                  {dayBookings.slice(0, 3).map((booking) => (
                    <div
                      key={booking.id}
                      onClick={() => onBookingClick(booking)}
                      className={cn(
                        'text-xs p-1 rounded border cursor-pointer hover:opacity-80 truncate',
                        getStatusColor(booking.status)
                      )}
                    >
                      {formatTime(booking.time)} {booking.customer_name}
                    </div>
                  ))}
                  {dayBookings.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{dayBookings.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Week View
  if (view === 'week') {
    const days = getWeekDays();
    const weekRange = `${days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{weekRange}</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={goToPrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={goToNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Week Grid */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const dayBookings = getBookingsForDate(day);
            const isToday = day.toDateString() === new Date().toDateString();
            const dayName = day.toLocaleDateString('en-US', { weekday: 'short' });

            return (
              <div key={day.toISOString()} className="space-y-2">
                <div
                  className={cn(
                    'text-center py-2 rounded-lg',
                    isToday && 'bg-primary text-primary-foreground font-bold'
                  )}
                >
                  <div className="text-xs">{dayName}</div>
                  <div className="text-lg">{day.getDate()}</div>
                </div>
                <div className="space-y-2 min-h-96">
                  {dayBookings.map((booking) => (
                    <div
                      key={booking.id}
                      onClick={() => onBookingClick(booking)}
                      className={cn(
                        'p-2 rounded-lg border cursor-pointer hover:opacity-80',
                        getStatusColor(booking.status)
                      )}
                    >
                      <div className="font-medium text-sm">{formatTime(booking.time)}</div>
                      <div className="text-xs truncate mt-1">{booking.customer_name}</div>
                      <div className="text-xs truncate">{booking.service_or_item}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Day View
  const dayBookings = getBookingsForDate(currentDate);
  const dayName = currentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Generate hourly time slots
  const timeSlots = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{dayName}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={goToPrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Day Schedule */}
      <div className="border border-muted rounded-lg overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto">
          {timeSlots.map((hour) => {
            const hourBookings = dayBookings.filter((b) => b.time.startsWith(hour.toString().padStart(2, '0')));

            return (
              <div key={hour} className="flex border-b border-muted">
                <div className="w-20 p-2 text-sm text-muted-foreground text-right">
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </div>
                <div className="flex-1 p-2 space-y-2">
                  {hourBookings.map((booking) => (
                    <div
                      key={booking.id}
                      onClick={() => onBookingClick(booking)}
                      className={cn(
                        'p-3 rounded-lg border cursor-pointer hover:opacity-80',
                        getStatusColor(booking.status)
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{booking.customer_name}</div>
                        <Badge variant={booking.status === 'confirmed' ? 'success' : 'warning'} className="text-xs">
                          {booking.status}
                        </Badge>
                      </div>
                      <div className="text-sm mt-1">{booking.service_or_item}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatTime(booking.time)} • {booking.customer_phone}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
