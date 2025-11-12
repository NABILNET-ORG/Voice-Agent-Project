import { useEffect, useState } from 'react';
import { Phone, Clock, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { TranscriptViewerModal } from '../components/TranscriptViewerModal';
import { supabase } from '../lib/supabase';
import { formatDate } from '../lib/utils';

interface TranscriptMessage {
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp?: string;
}

interface CallLog {
  id: string;
  customer_phone: string;
  customer_name: string;
  started_at: string;
  duration_seconds: number;
  outcome: string;
  booking_type: string;
  transcript?: TranscriptMessage[];
}

export function CallHistory() {
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);

  useEffect(() => {
    fetchCalls();
  }, []);

  const fetchCalls = async () => {
    try {
      const { data, error } = await supabase
        .from('call_logs')
        .select('*')
        .order('started_at', { ascending: false });

      if (error) throw error;
      setCalls(data || []);
    } catch (error) {
      console.error('Error fetching calls:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOutcomeVariant = (outcome: string) => {
    switch (outcome.toLowerCase()) {
      case 'booked':
      case 'ordered':
        return 'success';
      case 'no-booking':
        return 'warning';
      case 'missed':
        return 'danger';
      default:
        return 'default';
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCallClick = (call: CallLog) => {
    setSelectedCall(call);
    setShowTranscriptModal(true);
  };

  const exportToCSV = () => {
    const headers = ['Customer Name', 'Phone', 'Date/Time', 'Duration (sec)', 'Outcome', 'Type'];
    const csvData = calls.map(c => [
      c.customer_name || 'Unknown',
      c.customer_phone || '-',
      c.started_at,
      c.duration_seconds?.toString() || '0',
      c.outcome,
      c.booking_type || '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `call_history_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Call History</h1>
          <p className="text-muted-foreground mt-2">
            View all incoming calls and conversations
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportToCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calls.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Successful Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {calls.filter((c) => c.outcome === 'booked' || c.outcome === 'ordered').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {calls.length > 0
                ? formatDuration(
                    Math.floor(
                      calls.reduce((sum, c) => sum + (c.duration_seconds || 0), 0) /
                        calls.length
                    )
                  )
                : '-'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {calls.length > 0
                ? Math.round(
                    (calls.filter((c) => c.outcome === 'booked' || c.outcome === 'ordered')
                      .length /
                      calls.length) *
                      100
                  )
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Call Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Calls</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : calls.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No calls yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-muted text-left">
                    <th className="pb-3 font-medium">Customer</th>
                    <th className="pb-3 font-medium">Phone</th>
                    <th className="pb-3 font-medium">Date/Time</th>
                    <th className="pb-3 font-medium">Duration</th>
                    <th className="pb-3 font-medium">Outcome</th>
                    <th className="pb-3 font-medium">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {calls.map((call) => (
                    <tr
                      key={call.id}
                      className="border-b border-muted hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleCallClick(call)}
                    >
                      <td className="py-3">{call.customer_name || 'Unknown'}</td>
                      <td className="py-3">{call.customer_phone || '-'}</td>
                      <td className="py-3">{formatDate(call.started_at)}</td>
                      <td className="py-3">{formatDuration(call.duration_seconds)}</td>
                      <td className="py-3">
                        <Badge variant={getOutcomeVariant(call.outcome)}>
                          {call.outcome}
                        </Badge>
                      </td>
                      <td className="py-3 capitalize">{call.booking_type || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transcript Viewer Modal */}
      <TranscriptViewerModal
        call={selectedCall}
        open={showTranscriptModal}
        onOpenChange={setShowTranscriptModal}
      />
    </div>
  );
}
