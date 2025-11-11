import { useState } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

type ConnectionStatus = 'ready' | 'connecting' | 'listening' | 'processing' | 'error';

export function LiveDemo() {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>('ready');
  const [transcript, setTranscript] = useState<Array<{ role: string; text: string }>>([]);

  const handleStartCall = () => {
    setIsActive(true);
    setStatus('connecting');
    // TODO: Implement WebRTC connection to OpenAI Realtime API
    setTimeout(() => setStatus('listening'), 1000);
  };

  const handleEndCall = () => {
    setIsActive(false);
    setStatus('ready');
  };

  const getStatusText = () => {
    switch (status) {
      case 'ready':
        return 'Ready';
      case 'connecting':
        return 'Connecting...';
      case 'listening':
        return 'Listening';
      case 'processing':
        return 'Processing...';
      case 'error':
        return 'Error';
      default:
        return 'Ready';
    }
  };

  const getStatusVariant = () => {
    switch (status) {
      case 'ready':
        return 'default';
      case 'connecting':
        return 'warning';
      case 'listening':
        return 'success';
      case 'processing':
        return 'info';
      case 'error':
        return 'danger';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Business Assistant Demo</h1>
        <p className="text-muted-foreground mt-2">
          Test your AI voice assistant directly from your browser
        </p>
      </div>

      {/* Main Demo Card */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Voice Demo</CardTitle>
          <CardDescription>
            Click the microphone to start a conversation with your AI assistant
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6">
          {/* Status Badge */}
          <Badge variant={getStatusVariant()} className="text-sm px-4 py-1">
            {getStatusText()}
          </Badge>

          {/* Microphone Button */}
          <button
            onClick={isActive ? handleEndCall : handleStartCall}
            className={`h-32 w-32 rounded-full flex items-center justify-center transition-all ${
              isActive
                ? 'bg-destructive hover:bg-destructive/90 animate-pulse-glow'
                : 'bg-primary hover:bg-primary/90'
            }`}
            disabled={status === 'connecting'}
          >
            {status === 'connecting' ? (
              <Loader2 className="h-12 w-12 text-primary-foreground animate-spin" />
            ) : isActive ? (
              <MicOff className="h-12 w-12 text-white" />
            ) : (
              <Mic className="h-12 w-12 text-primary-foreground" />
            )}
          </button>

          {/* Audio Visualizer */}
          {isActive && status === 'listening' && (
            <div className="flex items-center gap-1 h-12">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 bg-primary rounded-full audio-bar"
                  style={{ height: '20%' }}
                />
              ))}
            </div>
          )}

          {/* Transcript */}
          {transcript.length > 0 && (
            <div className="w-full mt-6 space-y-2 max-h-64 overflow-y-auto">
              <h3 className="font-semibold text-sm">Conversation:</h3>
              {transcript.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary/20 ml-8'
                      : 'bg-muted mr-8'
                  }`}
                >
                  <span className="font-medium">
                    {msg.role === 'user' ? 'You' : 'AI'}:
                  </span>{' '}
                  {msg.text}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-lg">How to Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>1. Click the microphone button to start</p>
          <p>2. Allow microphone access when prompted</p>
          <p>3. Speak naturally to book an appointment or place an order</p>
          <p>4. The AI will check availability and confirm your booking</p>
          <p>5. Click the button again to end the session</p>
        </CardContent>
      </Card>
    </div>
  );
}
