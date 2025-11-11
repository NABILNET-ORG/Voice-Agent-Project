import { Mic, MicOff, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useRealtimeAPI } from '../hooks/useRealtimeAPI';

export function LiveDemo() {
  const { status, transcript, error, connect, disconnect, isConnected } = useRealtimeAPI();

  const handleStartCall = async () => {
    await connect();
  };

  const handleEndCall = () => {
    disconnect();
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

      {/* Error Alert */}
      {error && (
        <Card className="max-w-2xl mx-auto border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Demo Card */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Voice Demo</CardTitle>
          <CardDescription>
            Click the microphone to start a conversation with your AI assistant
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6">
          {/* Hidden audio element for remote audio */}
          <audio id="remote-audio" autoPlay style={{ display: 'none' }} />
          {/* Status Badge */}
          <Badge variant={getStatusVariant()} className="text-sm px-4 py-1">
            {getStatusText()}
          </Badge>

          {/* Microphone Button */}
          <button
            onClick={isConnected ? handleEndCall : handleStartCall}
            className={`h-32 w-32 rounded-full flex items-center justify-center transition-all ${
              isConnected
                ? 'bg-destructive hover:bg-destructive/90 animate-pulse'
                : 'bg-primary hover:bg-primary/90'
            }`}
            disabled={status === 'connecting'}
          >
            {status === 'connecting' ? (
              <Loader2 className="h-12 w-12 text-primary-foreground animate-spin" />
            ) : isConnected ? (
              <MicOff className="h-12 w-12 text-white" />
            ) : (
              <Mic className="h-12 w-12 text-primary-foreground" />
            )}
          </button>

          {/* Audio Visualizer */}
          {isConnected && (
            <div className="flex items-center justify-center gap-1 h-16">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 bg-primary rounded-full transition-all ${
                    status === 'listening' ? 'animate-sound-wave' : ''
                  }`}
                  style={{
                    height: status === 'listening' ? '40%' : '10%',
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Transcript */}
          {transcript.length > 0 && (
            <div className="w-full mt-6 space-y-3 max-h-96 overflow-y-auto p-4 bg-muted/30 rounded-lg">
              <h3 className="font-semibold text-sm mb-2 sticky top-0 bg-background/95 backdrop-blur py-2">Conversation:</h3>
              <div className="space-y-2">
                {transcript.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg text-sm ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : msg.role === 'assistant'
                          ? 'bg-muted'
                          : 'bg-accent text-accent-foreground'
                      }`}
                    >
                      <div className="font-medium text-xs mb-1 opacity-70">
                        {msg.role === 'user' ? 'You' : msg.role === 'assistant' ? 'AI Assistant' : 'System'}
                      </div>
                      <div>{msg.text}</div>
                    </div>
                  </div>
                ))}
              </div>
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
