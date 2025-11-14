"use client";

import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Users, DollarSign, Clock, CheckCircle, XCircle, Download, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { analyticsApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

const COLORS = ['#84CC16', '#3B82F6', '#EF4444', '#F59E0B', '#8B5CF6'];

export default function Analytics() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("30");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    conversionRate: 0,
    avgCallDuration: 0,
  });
  const [bookingsOverTime, setBookingsOverTime] = useState<any[]>([]);
  const [servicePopularity, setServicePopularity] = useState<any[]>([]);
  const [peakHours, setPeakHours] = useState<any[]>([]);

  useEffect(() => {
    if (user?.id) {
      loadAnalytics();
    } else {
      loadAnalytics('00000000-0000-0000-0000-000000000000');
    }
  }, [user, timeRange]);

  const loadAnalytics = async (userId?: string) => {
    try {
      setLoading(true);
      const id = userId || user?.id;
      if (!id) return;

      const [revenueStats, bookingStats, callStats, bookingsTime, services, hours] = await Promise.all([
        analyticsApi.getRevenueStats(id),
        analyticsApi.getBookingStats(id),
        analyticsApi.getCallStats(id),
        analyticsApi.getBookingsOverTime(id, parseInt(timeRange)),
        analyticsApi.getServicePopularity(id),
        analyticsApi.getPeakHours(id)
      ]);

      setStats({
        totalRevenue: revenueStats.total,
        totalBookings: bookingStats.total,
        conversionRate: Math.round(callStats.successRate),
        avgCallDuration: callStats.averageDuration,
      });

      setBookingsOverTime(bookingsTime);
      setServicePopularity(services);
      setPeakHours(hours);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex justify-center items-center py-24">
          <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400 mt-2">Track your business performance and insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-gray-700">
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
              <SelectItem value="180">Last 6 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-[#84CC16]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-gray-500">From confirmed bookings</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-[#84CC16]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalBookings}</div>
            <p className="text-xs text-gray-500">All time bookings</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Avg Call Duration</CardTitle>
            <Clock className="h-4 w-4 text-[#84CC16]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatDuration(Math.round(stats.avgCallDuration))}</div>
            <p className="text-xs text-gray-500">Per call</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-[#84CC16]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.conversionRate}%</div>
            <p className="text-xs text-gray-500">Calls to bookings</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings Over Time */}
        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Bookings Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {bookingsOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={bookingsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
                  <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #374151' }}
                    labelStyle={{ color: '#9CA3AF' }}
                  />
                  <Line type="monotone" dataKey="bookings" stroke="#84CC16" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                No booking data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service Popularity */}
        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Service Popularity</CardTitle>
          </CardHeader>
          <CardContent>
            {servicePopularity.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={servicePopularity}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {servicePopularity.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #374151' }}
                    labelStyle={{ color: '#9CA3AF' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                No service data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Peak Hours */}
        <Card className="bg-[#1A1A1A] border-gray-800 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Peak Booking Hours</CardTitle>
          </CardHeader>
          <CardContent>
            {peakHours.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={peakHours}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="hour" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
                  <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #374151' }}
                    labelStyle={{ color: '#9CA3AF' }}
                  />
                  <Bar dataKey="bookings" fill="#84CC16" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                No peak hours data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
