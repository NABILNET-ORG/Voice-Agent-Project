import { useEffect, useState } from 'react';
import { Calendar, Plus, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { BookingFormModal } from '../components/BookingFormModal';
import { supabase } from '../lib/supabase';
import { formatDate, formatTime, formatCurrency } from '../lib/utils';

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

export function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewBookingModal, setShowNewBookingModal] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('date', { ascending: false })
        .order('time', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'danger';
      case 'completed':
        return 'info';
      default:
        return 'default';
    }
  };

  const filteredBookings = bookings.filter(
    (booking) =>
      booking.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customer_phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your appointments and orders
          </p>
        </div>
        <Button onClick={() => setShowNewBookingModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Booking
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bookings.filter((b) => b.date === new Date().toISOString().split('T')[0]).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0)
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bookings.filter((b) => b.status === 'confirmed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No bookings found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-muted text-left">
                    <th className="pb-3 font-medium">Customer</th>
                    <th className="pb-3 font-medium">Phone</th>
                    <th className="pb-3 font-medium">Service/Item</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Time</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className="border-b border-muted hover:bg-muted/50 cursor-pointer"
                    >
                      <td className="py-3">{booking.customer_name}</td>
                      <td className="py-3">{booking.customer_phone}</td>
                      <td className="py-3">{booking.service_or_item}</td>
                      <td className="py-3">{formatDate(booking.date)}</td>
                      <td className="py-3">{formatTime(booking.time)}</td>
                      <td className="py-3 capitalize">{booking.booking_type}</td>
                      <td className="py-3">
                        <Badge variant={getStatusVariant(booking.status)}>
                          {booking.status}
                        </Badge>
                      </td>
                      <td className="py-3">
                        {booking.total_amount
                          ? formatCurrency(booking.total_amount)
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Booking Modal */}
      <BookingFormModal
        open={showNewBookingModal}
        onOpenChange={setShowNewBookingModal}
        onSuccess={fetchBookings}
      />
    </div>
  );
}
