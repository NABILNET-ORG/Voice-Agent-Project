import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { formatDate } from '../lib/utils';

interface TranscriptMessage {
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp?: string;
}

interface Call {
  id: string;
  customer_phone: string;
  customer_name: string;
  started_at: string;
  duration_seconds: number;
  outcome: string;
  booking_type: string;
  transcript?: TranscriptMessage[];
}

interface TranscriptViewerModalProps {
  call: Call | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TranscriptViewerModal({
  call,
  open,
  onOpenChange,
}: TranscriptViewerModalProps) {
  if (!call) return null;

  const transcript = call.transcript || [];

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Call Transcript</DialogTitle>
          <DialogDescription>
            Call with {call.customer_name || call.customer_phone} on{' '}
            {formatDate(call.started_at)} • Duration: {formatDuration(call.duration_seconds)}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[500px] w-full pr-4">
          {transcript.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transcript available for this call
            </div>
          ) : (
            <div className="space-y-4">
              {transcript.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : msg.role === 'assistant'
                        ? 'bg-muted'
                        : 'bg-accent/20 text-accent-foreground'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold opacity-70">
                        {msg.role === 'user'
                          ? call.customer_name || 'Customer'
                          : msg.role === 'assistant'
                          ? 'AI Assistant'
                          : 'System'}
                      </span>
                      {msg.timestamp && (
                        <span className="text-xs opacity-50 ml-2">{msg.timestamp}</span>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex items-center justify-between pt-4 border-t border-muted text-sm text-muted-foreground">
          <div>
            <span className="font-medium">Outcome:</span>{' '}
            <span className="capitalize">{call.outcome}</span>
          </div>
          {call.booking_type && (
            <div>
              <span className="font-medium">Type:</span>{' '}
              <span className="capitalize">{call.booking_type}</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
