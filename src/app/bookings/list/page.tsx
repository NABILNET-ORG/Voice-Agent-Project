"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, DollarSign, Users, Search, Download, CheckCircle, XCircle, Loader2, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { bookingsApi, analyticsApi, type Booking } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export default function BookingsList() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadBookings();
    }
  }, [user]);

  useEffect(() => {
    filterAndSortBookings();
  }, [bookings, searchTerm, statusFilter, serviceFilter, dateFilter, sortBy, sortOrder]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await bookingsApi.getAll(user!.id);
      setBookings(data);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortBookings = () => {
    let filtered = [...bookings];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        booking =>
          booking.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.customer_phone.includes(searchTerm) ||
          booking.service_or_item.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    // Service filter
    if (serviceFilter !== "all") {
      filtered = filtered.filter(booking => booking.service_or_item === serviceFilter);
    }

    // Date filter
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

    // Sort
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortBy) {
        case "date":
          aVal = a.date || a.created_at;
          bVal = b.date || b.created_at;
          break;
        case "customer":
          aVal = a.customer_name;
          bVal = b.customer_name;
          break;
        case "amount":
          aVal = a.total_amount || 0;
          bVal = b.total_amount || 0;
          break;
        case "status":
          aVal = a.status;
          bVal = b.status;
          break;
        default:
          aVal = a.created_at;
          bVal = b.created_at;
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredBookings(filtered);
  };

  const handleCancel = async (id: string) => {
    try {
      await bookingsApi.cancel(id);
      await loadBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await bookingsApi.complete(id);
      await loadBookings();
    } catch (error) {
      console.error('Error completing booking:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      confirmed: "bg-green-600 text-white",
      pending: "bg-yellow-600 text-white",
      cancelled: "bg-red-600 text-white",
      completed: "bg-blue-600 text-white",
      "in-progress": "bg-purple-600 text-white"
    };

    return (
      <Badge className={variants[status] || "bg-gray-600 text-white"}>
        {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
      </Badge>
    );
  };

  const uniqueServices = Array.from(new Set(bookings.map(b => b.service_or_item)));

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Bookings List</h1>
          <p className="text-gray-400 mt-2">Detailed view of all bookings</p>
        </div>
        <Button className="bg-[#84CC16] text-black hover:bg-[#65A30D]">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-[#1A1A1A] border-gray-800">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1A] border-gray-700">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Service" />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1A] border-gray-700">
                <SelectItem value="all">All Services</SelectItem>
                {uniqueServices.map(service => (
                  <SelectItem key={service} value={service}>{service}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1A] border-gray-700">
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as "asc" | "desc")}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1A] border-gray-700">
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card className="bg-[#1A1A1A] border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">All Bookings ({filteredBookings.length})</CardTitle>
            <Badge className="bg-gray-700 text-white">
              <List className="h-3 w-3 mr-1" />
              List View
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400">No bookings found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-300">Customer</TableHead>
                    <TableHead className="text-gray-300">Contact</TableHead>
                    <TableHead className="text-gray-300">Service</TableHead>
                    <TableHead className="text-gray-300">Date & Time</TableHead>
                    <TableHead className="text-gray-300">Duration</TableHead>
                    <TableHead className="text-gray-300">Amount</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => (
                    <TableRow key={booking.id} className="border-gray-700">
                      <TableCell className="text-white font-medium">
                        {booking.customer_name}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        <div className="text-sm">{booking.customer_phone}</div>
                        {booking.customer_email && (
                          <div className="text-xs text-gray-500">{booking.customer_email}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-300">{booking.service_or_item}</TableCell>
                      <TableCell className="text-gray-300">
                        <div>{booking.date || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{booking.time || 'N/A'}</div>
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {booking.duration_minutes ? `${booking.duration_minutes} min` : 'N/A'}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        ${booking.total_amount?.toFixed(2) || '0.00'}
                      </TableCell>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
