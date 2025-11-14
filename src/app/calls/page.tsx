"use client";

import { useState, useEffect } from "react";
import { Phone, Clock, CheckCircle, XCircle, PhoneOff, Search, Filter, Download, Play, Pause, Volume2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { callLogsApi, analyticsApi, type CallLog } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export default function CallHistory() {
  const { user } = useAuth();
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [filteredCalls, setFilteredCalls] = useState<CallLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    successful: 0,
    avgDuration: 0,
    conversionRate: 0
  });

  useEffect(() => {
    if (user?.id) {
      loadCalls();
      loadStats();
    }
  }, [user]);

  useEffect(() => {
    filterCalls();
  }, [calls, searchTerm, outcomeFilter, dateFilter]);

  const loadCalls = async (userId?: string) => {
    try {
      setLoading(true);
      const id = userId || user?.id;
      if (!id) return;

      const data = await callLogsApi.getAll(id);
      setCalls(data);
    } catch (error) {
      console.error('Error loading calls:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (userId?: string) => {
    try {
      const id = userId || user?.id;
      if (!id) return;

      const callStats = await analyticsApi.getCallStats(id);
      setStats({
        total: callStats.total,
        successful: callStats.successful,
        avgDuration: callStats.averageDuration,
        conversionRate: callStats.successRate
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const filterCalls = () => {
    let filtered = calls;

    if (searchTerm) {
      filtered = filtered.filter(
        call =>
          call.customer_phone?.includes(searchTerm) ||
          (call.customer_name && call.customer_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (outcomeFilter !== "all") {
      filtered = filtered.filter(call => call.outcome === outcomeFilter);
    }

    if (dateFilter === "today") {
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter(call =>
        call.started_at.split('T')[0] === today
      );
    } else if (dateFilter === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(call => new Date(call.started_at) >= weekAgo);
    } else if (dateFilter === "month") {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      filtered = filtered.filter(call => new Date(call.started_at) >= monthAgo);
    }

    setFilteredCalls(filtered);
  };

  const handleExportCSV = () => {
    const csvContent = [
      ['Customer Phone', 'Name', 'Date/Time', 'Duration', 'Outcome'],
      ...filteredCalls.map(call => [
        call.customer_phone || 'N/A',
        call.customer_name || 'Unknown',
        format(new Date(call.started_at), "MMM d, yyyy HH:mm"),
        call.duration_seconds ? formatDuration(call.duration_seconds) : 'N/A',
        call.outcome
      ])
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `call-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getOutcomeBadge = (outcome: string) => {
    const variants = {
      "booking-confirmed": "bg-green-600 text-white",
      "no-booking": "bg-yellow-600 text-white",
      "missed": "bg-red-600 text-white",
      "in-progress": "bg-purple-600 text-white"
    };

    return (
      <Badge className={variants[outcome as keyof typeof variants] || "bg-gray-600 text-white"}>
        {outcome.charAt(0).toUpperCase() + outcome.slice(1).replace("-", " ")}
      </Badge>
    );
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Call History</h1>
          <p className="text-gray-400 mt-2">View and analyze all customer calls</p>
        </div>
        <Button
          variant="outline"
          className="border-gray-700 text-gray-300 hover:text-white"
          onClick={handleExportCSV}
          disabled={filteredCalls.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-[#84CC16]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <p className="text-xs text-gray-500">All time</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Successful Bookings</CardTitle>
            <CheckCircle className="h-4 w-4 text-[#84CC16]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.successful}</div>
            <p className="text-xs text-gray-500">Converted calls</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Avg Call Duration</CardTitle>
            <Clock className="h-4 w-4 text-[#84CC16]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatDuration(Math.round(stats.avgDuration))}</div>
            <p className="text-xs text-gray-500">Per call</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Conversion Rate</CardTitle>
            <PhoneOff className="h-4 w-4 text-[#84CC16]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{Math.round(stats.conversionRate)}%</div>
            <p className="text-xs text-gray-500">Success rate</p>
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
                  placeholder="Search by phone or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                />
              </div>
            </div>

            <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
              <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Filter by outcome" />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1A] border-gray-700">
                <SelectItem value="all">All Outcomes</SelectItem>
                <SelectItem value="booking-confirmed">Booked</SelectItem>
                <SelectItem value="no-booking">No Booking</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="missed">Missed</SelectItem>
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

      {/* Call Logs Table */}
      <Card className="bg-[#1A1A1A] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Call Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
            </div>
          ) : filteredCalls.length === 0 ? (
            <div className="text-center py-12">
              <Phone className="h-12 w-12 mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400">No call logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-300">Customer Phone</TableHead>
                    <TableHead className="text-gray-300">Name</TableHead>
                    <TableHead className="text-gray-300">Date/Time</TableHead>
                    <TableHead className="text-gray-300">Duration</TableHead>
                    <TableHead className="text-gray-300">Outcome</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCalls.map((call) => (
                    <TableRow key={call.id} className="border-gray-700">
                      <TableCell className="text-white">{call.customer_phone || 'N/A'}</TableCell>
                      <TableCell className="text-gray-300">{call.customer_name || "Unknown"}</TableCell>
                      <TableCell className="text-gray-300">
                        {format(new Date(call.started_at), "MMM d, yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {call.duration_seconds ? formatDuration(call.duration_seconds) : "N/A"}
                      </TableCell>
                      <TableCell>{getOutcomeBadge(call.outcome)}</TableCell>
                      <TableCell>
                        {call.transcript && Array.isArray(call.transcript) && call.transcript.length > 0 ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-white"
                                onClick={() => setSelectedCall(call)}
                              >
                                <Phone className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-[#1A1A1A] border-gray-800 text-white max-w-2xl max-h-[80vh]">
                              <DialogHeader>
                                <DialogTitle>Call Details</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-gray-400">Phone</p>
                                    <p className="text-white">{call.customer_phone}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-400">Name</p>
                                    <p className="text-white">{call.customer_name || "Unknown"}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-400">Date/Time</p>
                                    <p className="text-white">{format(new Date(call.started_at), "MMM d, yyyy HH:mm")}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-400">Duration</p>
                                    <p className="text-white">{call.duration_seconds ? formatDuration(call.duration_seconds) : "N/A"}</p>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-sm text-gray-400 mb-2">Transcript</p>
                                  <ScrollArea className="h-64 w-full rounded-lg border border-gray-800 p-4">
                                    <div className="space-y-4">
                                      {call.transcript.map((message: any, index: number) => (
                                        <div
                                          key={index}
                                          className={`flex ${
                                            message.role === "user" ? "justify-end" : "justify-start"
                                          }`}
                                        >
                                          <div
                                            className={`max-w-[80%] rounded-lg p-3 ${
                                              message.role === "user"
                                                ? "bg-[#84CC16] text-black"
                                                : "bg-gray-800 text-white"
                                            }`}
                                          >
                                            <p className="text-sm">{message.content || message.text}</p>
                                            {message.timestamp && (
                                              <p className="text-xs opacity-70 mt-1">
                                                {format(new Date(message.timestamp), "HH:mm:ss")}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </ScrollArea>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <span className="text-gray-500 text-sm">No transcript</span>
                        )}
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
