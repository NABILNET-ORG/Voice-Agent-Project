"use client";

import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Clock, DollarSign, Users, Filter, Search, Download, Plus, Eye, Edit, Trash2, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { bookingsApi, analyticsApi, type Booking } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export default function Bookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [viewMode, setViewMode] = useState<"calendar" | "list">("list");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    today: 0,
    week: 0,
    month: 0,
    revenue: 0
  });

  useEffect(() => {
    if (user?.id) {
      loadBookings();
      loadStats();
    }
  }, [user]);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchTerm, statusFilter, dateFilter]);

  const loadBookings = async (userId?: string) => {
    try {
      setLoading(true);
      const id = userId || user?.id;
      if (!id) return;

      const data = await bookingsApi.getAll(id);
      setBookings(data);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (userId?: string) => {
    try {
      const id = userId || user?.id;
      if (!id) return;

      const [bookingStats, revenueStats] = await Promise.all([
        analyticsApi.getBookingStats(id),
        analyticsApi.getRevenueStats(id)
      ]);

      setStats({
        today: bookingStats.today,
        week: bookingStats.thisWeek,
        month: bookingStats.thisMonth,
        revenue: revenueStats.total
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const filterBookings = () => {
    let filtered = bookings;

    if (searchTerm) {
      filtered = filtered.filter(
        booking =>
          booking.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.customer_phone.includes(searchTerm) ||
          booking.service_or_item.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    if (dateFilter === "today") {
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter(booking => booking.date === today);
    } else if (dateFilter === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(booking => new Date(booking.created_at) >= weekAgo);
    } else if (dateFilter === "month") {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      filtered = filtered.filter(booking => new Date(booking.created_at) >= monthAgo);
    }

    setFilteredBookings(filtered);
  };

  const handleCancel = async (id: string) => {
    try {
      await bookingsApi.cancel(id);
      await loadBookings();
      await loadStats();
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await bookingsApi.complete(id);
      await loadBookings();
      await loadStats();
    } catch (error) {
      console.error('Error completing booking:', error);
    }
  };

  const handleExportCSV = () => {
    const csvContent = [
      ['Customer Name', 'Phone', 'Service', 'Date', 'Time', 'Status', 'Amount'],
      ...filteredBookings.map(booking => [
        booking.customer_name,
        booking.customer_phone,
        booking.service_or_item,
        booking.date || 'N/A',
        booking.time || 'N/A',
        booking.status,
        `$${booking.total_amount?.toFixed(2) || '0.00'}`
      ])
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      confirmed: "bg-green-600 text-white",
      pending: "bg-yellow-600 text-white",
      cancelled: "bg-red-600 text-white",
      completed: "bg-blue-600 text-white",
      "in-progress": "bg-purple-600 text-white"
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || "bg-gray-600 text-white"}>
        {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
      </Badge>
    );
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Bookings</h1>
          <p className="text-gray-400 mt-2">Manage your appointments and reservations</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="bg-[#84CC16] text-black hover:bg-[#65A30D]"
            onClick={() => window.location.href = '/bookings/new'}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            onClick={() => setViewMode("list")}
            className={viewMode === "list" ? "bg-[#84CC16] text-black" : "border-gray-700 text-gray-300"}
          >
            List View
          </Button>
          <Button
            variant={viewMode === "calendar" ? "default" : "outline"}
            onClick={() => setViewMode("calendar")}
            className={viewMode === "calendar" ? "bg-[#84CC16] text-black" : "border-gray-700 text-gray-300"}
          >
            Calendar View
          </Button>
          <Button className="bg-[#84CC16] text-black hover:bg-[#65A30D]" onClick={handleExportCSV} disabled={filteredBookings.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Today's Bookings</CardTitle>
            <CalendarIcon className="h-4 w-4 text-[#84CC16]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.today}</div>
            <p className="text-xs text-gray-500">Active appointments</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">This Week</CardTitle>
            <Clock className="h-4 w-4 text-[#84CC16]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.week}</div>
            <p className="text-xs text-gray-500">Weekly bookings</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">This Month</CardTitle>
            <Users className="h-4 w-4 text-[#84CC16]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.month}</div>
            <p className="text-xs text-gray-500">Monthly bookings</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-[#84CC16]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${stats.revenue.toFixed(2)}</div>
            <p className="text-xs text-gray-500">Completed bookings</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-[#1A1A1A] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, phone, or service..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1A] border-gray-700">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1A] border-gray-700">
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bookings List/Calendar */}
      <Card className="bg-[#1A1A1A] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">
            {viewMode === "list" ? "All Bookings" : "Calendar View"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
            </div>
          ) : viewMode === "list" ? (
            filteredBookings.length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon className="h-12 w-12 mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400">No bookings found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-300">Customer Name</TableHead>
                      <TableHead className="text-gray-300">Phone</TableHead>
                      <TableHead className="text-gray-300">Service</TableHead>
                      <TableHead className="text-gray-300">Date</TableHead>
                      <TableHead className="text-gray-300">Time</TableHead>
                      <TableHead className="text-gray-300">Amount</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((booking) => (
                      <TableRow key={booking.id} className="border-gray-700">
                        <TableCell className="text-white font-medium">{booking.customer_name}</TableCell>
                        <TableCell className="text-gray-300">{booking.customer_phone}</TableCell>
                        <TableCell className="text-gray-300">{booking.service_or_item}</TableCell>
                        <TableCell className="text-gray-300">{booking.date || 'N/A'}</TableCell>
                        <TableCell className="text-gray-300">{booking.time || 'N/A'}</TableCell>
                        <TableCell className="text-gray-300">${booking.total_amount?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell>{getStatusBadge(booking.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {booking.status === 'confirmed' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-400 hover:text-white"
                                  onClick={() => handleComplete(booking.id)}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-400 hover:text-red-500"
                                  onClick={() => handleCancel(booking.id)}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
          ) : (
            <div className="flex justify-center py-8">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border border-gray-700 bg-gray-800"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
