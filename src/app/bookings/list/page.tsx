"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, DollarSign, Users, Filter, Search, Download, Plus, Eye, Edit, Trash2, CheckCircle, XCircle, ClockIcon, CalendarDays, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

interface Booking {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  service: string;
  category: string;
  date: Date;
  time: string;
  duration: number;
  status: "confirmed" | "pending" | "cancelled" | "completed" | "in-progress";
  amount: number;
  notes?: string;
  assignedTo?: string;
  createdAt: Date;
}

export default function BookingsList() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    // Generate more comprehensive mock data for list view
    const mockBookings: Booking[] = [
      {
        id: "1",
        customerName: "John Smith",
        customerPhone: "+1 234-567-8900",
        customerEmail: "john.smith@email.com",
        service: "Haircut & Style",
        category: "Hair Services",
        date: new Date(),
        time: "10:00 AM",
        duration: 60,
        status: "confirmed",
        amount: 50,
        notes: "Regular customer, prefers scissor cut",
        assignedTo: "Sarah Johnson",
        createdAt: new Date(Date.now() - 86400000)
      },
      {
        id: "2",
        customerName: "Sarah Johnson",
        customerPhone: "+1 234-567-8901",
        customerEmail: "sarah.j@email.com",
        service: "Hair Coloring",
        category: "Hair Services",
        date: new Date(),
        time: "2:00 PM",
        duration: 120,
        status: "in-progress",
        amount: 120,
        notes: "Full color treatment, previously bleached",
        assignedTo: "Mike Davis",
        createdAt: new Date(Date.now() - 172800000)
      },
      {
        id: "3",
        customerName: "Mike Davis",
        customerPhone: "+1 234-567-8902",
        customerEmail: "mike.d@email.com",
        service: "Beard Trim",
        category: "Men's Services",
        date: new Date(Date.now() + 86400000),
        time: "11:30 AM",
        duration: 30,
        status: "confirmed",
        amount: 25,
        notes: "First time customer",
        assignedTo: "Emily Wilson",
        createdAt: new Date(Date.now() - 259200000)
      },
      {
        id: "4",
        customerName: "Emily Wilson",
        customerPhone: "+1 234-567-8903",
        customerEmail: "emily.w@email.com",
        service: "Deep Conditioning",
        category: "Hair Treatments",
        date: new Date(Date.now() - 86400000),
        time: "3:00 PM",
        duration: 45,
        status: "completed",
        amount: 40,
        notes: "Customer satisfied, booked next appointment",
        assignedTo: "Sarah Johnson",
        createdAt: new Date(Date.now() - 345600000)
      },
      {
        id: "5",
        customerName: "Robert Brown",
        customerPhone: "+1 234-567-8904",
        customerEmail: "robert.b@email.com",
        service: "Haircut",
        category: "Hair Services",
        date: new Date(Date.now() - 172800000),
        time: "9:00 AM",
        duration: 45,
        status: "cancelled",
        amount: 35,
        notes: "Cancelled due to emergency, rescheduled for next week",
        assignedTo: "Mike Davis",
        createdAt: new Date(Date.now() - 432000000)
      },
      {
        id: "6",
        customerName: "Lisa Anderson",
        customerPhone: "+1 234-567-8905",
        customerEmail: "lisa.a@email.com",
        service: "Highlights",
        category: "Hair Services",
        date: new Date(Date.now() + 172800000),
        time: "1:00 PM",
        duration: 180,
        status: "confirmed",
        amount: 150,
        notes: "Partial highlights, maintain current color",
        assignedTo: "Emily Wilson",
        createdAt: new Date(Date.now() - 518400000)
      },
      {
        id: "7",
        customerName: "David Martinez",
        customerPhone: "+1 234-567-8906",
        customerEmail: "david.m@email.com",
        service: "Men's Cut",
        category: "Men's Services",
        date: new Date(Date.now() + 86400000),
        time: "4:30 PM",
        duration: 30,
        status: "pending",
        amount: 30,
        notes: "Waiting for confirmation",
        assignedTo: "Sarah Johnson",
        createdAt: new Date(Date.now() - 604800000)
      }
    ];
    
    setBookings(mockBookings);
    setFilteredBookings(mockBookings);
  }, []);

  useEffect(() => {
    let filtered = bookings;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        booking =>
          booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.customerPhone.includes(searchTerm) ||
          booking.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    // Apply service filter
    if (serviceFilter !== "all") {
      filtered = filtered.filter(booking => booking.category === serviceFilter);
    }

    // Apply date filter
    if (dateFilter === "today") {
      const today = new Date();
      filtered = filtered.filter(booking => 
        booking.date.toDateString() === today.toDateString()
      );
    } else if (dateFilter === "week") {
      const weekAgo = new Date(Date.now() - 7 * 86400000);
      filtered = filtered.filter(booking => booking.date >= weekAgo);
    } else if (dateFilter === "month") {
      const monthAgo = new Date(Date.now() - 30 * 86400000);
      filtered = filtered.filter(booking => booking.date >= monthAgo);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Booking];
      let bValue: any = b[sortBy as keyof Booking];
      
      if (aValue instanceof Date) aValue = aValue.getTime();
      if (bValue instanceof Date) bValue = bValue.getTime();
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredBookings(filtered);
  }, [bookings, searchTerm, statusFilter, serviceFilter, dateFilter, sortBy, sortOrder]);

  const getStatusBadge = (status: string) => {
    const variants = {
      confirmed: "bg-green-600 text-white",
      pending: "bg-yellow-600 text-white",
      cancelled: "bg-red-600 text-white",
      completed: "bg-blue-600 text-white",
      "in-progress": "bg-purple-600 text-white"
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const categories = Array.from(new Set(bookings.map(b => b.category)));

  const stats = {
    total: bookings.length,
    today: bookings.filter(b => b.date.toDateString() === new Date().toDateString()).length,
    week: bookings.filter(b => b.date >= new Date(Date.now() - 7 * 86400000)).length,
    month: bookings.filter(b => b.date >= new Date(Date.now() - 30 * 86400000)).length,
    revenue: bookings.filter(b => b.status === "completed").reduce((sum, b) => sum + b.amount, 0)
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Bookings List</h1>
          <p className="text-gray-400 mt-2">Comprehensive list of all bookings with detailed information</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-gray-700 text-gray-300 hover:text-white">
            <CalendarDays className="h-4 w-4 mr-2" />
            Calendar View
          </Button>
          <Button className="bg-[#84CC16] text-black hover:bg-[#65A30D]">
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Bookings</CardTitle>
            <List className="h-4 w-4 text-[#84CC16]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <p className="text-xs text-gray-500">All time</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Today</CardTitle>
            <Calendar className="h-4 w-4 text-[#84CC16]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.today}</div>
            <p className="text-xs text-gray-500">Bookings today</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">This Week</CardTitle>
            <Clock className="h-4 w-4 text-[#84CC16]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.week}</div>
            <p className="text-xs text-gray-500">Last 7 days</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">This Month</CardTitle>
            <Users className="h-4 w-4 text-[#84CC16]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.month}</div>
            <p className="text-xs text-gray-500">Last 30 days</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-[#84CC16]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${stats.revenue}</div>
            <p className="text-xs text-gray-500">Completed bookings</p>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Filters */}
      <Card className="bg-[#1A1A1A] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Advanced Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1A] border-gray-700">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Filter by service" />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1A] border-gray-700">
                <SelectItem value="all">All Services</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1A] border-gray-700">
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1A] border-gray-700">
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="customerName">Customer Name</SelectItem>
                <SelectItem value="service">Service</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="createdAt">Created At</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1A] border-gray-700">
                <SelectItem value="desc">Descending</SelectItem>
                <SelectItem value="asc">Ascending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2 mt-4">
            <Button variant="outline" className="border-gray-700 text-gray-300 hover:text-white">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" className="border-gray-700 text-gray-300 hover:text-white">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card className="bg-[#1A1A1A] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">All Bookings ({filteredBookings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Customer</TableHead>
                  <TableHead className="text-gray-300">Contact</TableHead>
                  <TableHead className="text-gray-300">Service</TableHead>
                  <TableHead className="text-gray-300">Date/Time</TableHead>
                  <TableHead className="text-gray-300">Duration</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Amount</TableHead>
                  <TableHead className="text-gray-300">Assigned To</TableHead>
                  <TableHead className="text-gray-300">Notes</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id} className="border-gray-700 hover:bg-gray-800/50">
                    <TableCell className="text-white">
                      <div>
                        <p className="font-medium">{booking.customerName}</p>
                        <p className="text-xs text-gray-400">Created {format(booking.createdAt, "MMM d")}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      <div>
                        <p className="text-sm">{booking.customerPhone}</p>
                        {booking.customerEmail && (
                          <p className="text-xs text-gray-400">{booking.customerEmail}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      <div>
                        <p className="font-medium">{booking.service}</p>
                        <p className="text-xs text-gray-400">{booking.category}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      <div>
                        <p className="font-medium">{format(booking.date, "MMM d, yyyy")}</p>
                        <p className="text-sm">{booking.time}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">{booking.duration} min</TableCell>
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
                    <TableCell className="text-gray-300">${booking.amount}</TableCell>
                    <TableCell className="text-gray-300">{booking.assignedTo || "Unassigned"}</TableCell>
                    <TableCell className="text-gray-300 max-w-xs truncate">
                      {booking.notes || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-1">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-1">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-500 p-1">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredBookings.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-400">No bookings found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}