import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { BarChart3, TrendingUp, DollarSign, Users } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/utils';

interface Booking {
  id: string;
  date: string;
  time: string;
  total_amount: number;
  service_or_item: string;
  status: string;
}

export function Analytics() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare data for Revenue Over Time chart
  const getRevenueData = () => {
    const revenueByDate: { [key: string]: number } = {};
    bookings.forEach((booking) => {
      const date = booking.date;
      revenueByDate[date] = (revenueByDate[date] || 0) + (booking.total_amount || 0);
    });

    return Object.entries(revenueByDate)
      .map(([date, revenue]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue,
      }))
      .slice(-30); // Last 30 days
  };

  // Prepare data for Bookings by Day chart
  const getBookingsByDayData = () => {
    const bookingsByDay: { [key: string]: number } = {};
    bookings.forEach((booking) => {
      const day = new Date(booking.date).toLocaleDateString('en-US', { weekday: 'short' });
      bookingsByDay[day] = (bookingsByDay[day] || 0) + 1;
    });

    const daysOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return daysOrder.map((day) => ({
      day,
      bookings: bookingsByDay[day] || 0,
    }));
  };

  // Prepare data for Service Popularity pie chart
  const getServiceData = () => {
    const serviceCount: { [key: string]: number } = {};
    bookings.forEach((booking) => {
      const service = booking.service_or_item || 'Unknown';
      serviceCount[service] = (serviceCount[service] || 0) + 1;
    });

    return Object.entries(serviceCount).map(([name, value]) => ({
      name,
      value,
    }));
  };

  // Prepare data for booking time heatmap
  const getHeatmapData = () => {
    const heatmap: { [key: string]: { [hour: number]: number } } = {};
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Initialize heatmap
    days.forEach((day) => {
      heatmap[day] = {};
      for (let hour = 0; hour < 24; hour++) {
        heatmap[day][hour] = 0;
      }
    });

    // Fill heatmap with booking data
    bookings.forEach((booking) => {
      const date = new Date(booking.date);
      const day = days[date.getDay()];
      const hour = parseInt(booking.time.split(':')[0]);
      if (heatmap[day] && hour >= 0 && hour < 24) {
        heatmap[day][hour]++;
      }
    });

    // Convert to array format for chart
    const hours = Array.from({ length: 24 }, (_, i) => i);
    return hours.map((hour) => {
      const hourData: { hour: string; [key: string]: string | number } = {
        hour: hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`,
      };
      days.forEach((day) => {
        hourData[day] = heatmap[day][hour] || 0;
      });
      return hourData;
    });
  };

  const COLORS = ['#84CC16', '#22C55E', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const totalRevenue = bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
  const totalBookings = bookings.length;
  const uniqueCustomers = new Set(bookings.map((b) => b.id)).size;

  if (loading) {
    return <div className="p-6">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Track your business performance and insights
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBookings}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Booking Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalBookings > 0 ? formatCurrency(totalRevenue / totalBookings) : '$0'}
            </div>
            <p className="text-xs text-muted-foreground">Per booking</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unique Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueCustomers}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Line and Bar Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getRevenueData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                <XAxis dataKey="date" stroke="#A1A1AA" style={{ fontSize: 12 }} />
                <YAxis stroke="#A1A1AA" style={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1A1A',
                    border: '1px solid #27272A',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#84CC16"
                  strokeWidth={2}
                  dot={{ fill: '#84CC16', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bookings by Day of Week</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getBookingsByDayData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                <XAxis dataKey="day" stroke="#A1A1AA" style={{ fontSize: 12 }} />
                <YAxis stroke="#A1A1AA" style={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1A1A',
                    border: '1px solid #27272A',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="bookings" fill="#84CC16" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Pie Chart and Heatmap */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Service Popularity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getServiceData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getServiceData().map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1A1A',
                    border: '1px solid #27272A',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Peak Booking Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getHeatmapData().filter((_, i) => i >= 8 && i <= 20)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                <XAxis dataKey="hour" stroke="#A1A1AA" style={{ fontSize: 10 }} />
                <YAxis stroke="#A1A1AA" style={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1A1A',
                    border: '1px solid #27272A',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="Mon" stackId="a" fill="#84CC16" />
                <Bar dataKey="Tue" stackId="a" fill="#22C55E" />
                <Bar dataKey="Wed" stackId="a" fill="#3B82F6" />
                <Bar dataKey="Thu" stackId="a" fill="#F59E0B" />
                <Bar dataKey="Fri" stackId="a" fill="#EF4444" />
                <Bar dataKey="Sat" stackId="a" fill="#8B5CF6" />
                <Bar dataKey="Sun" stackId="a" fill="#EC4899" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
