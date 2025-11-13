import { useState } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

type ConnectionStatus = 'ready' | 'connecting' | 'listening' | 'processing' | 'error';

export function LiveDemo() {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>('ready');
  const [transcript] = useState<Array<{ role: string; text: string }>>([]);

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

  return (
    <div className="flex flex-col items-center justify-start min-h-screen py-12 px-4">
      {/* Header */}
      <div className="text-center mb-12 max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          AI Appointment Booking Demo
        </h1>
        <p className="text-muted-foreground text-lg">
          Test the voice assistant by clicking the microphone button below
        </p>
      </div>

      {/* Main Demo Area */}
      <div className="flex flex-col items-center space-y-8 max-w-4xl w-full">
        {/* Microphone Button & Status */}
        <div className="flex flex-col items-center space-y-4">
          <button
            onClick={isActive ? handleEndCall : handleStartCall}
            className={`h-40 w-40 rounded-full flex items-center justify-center transition-all shadow-2xl ${
              isActive
                ? 'bg-destructive hover:bg-destructive/90 animate-pulse-glow'
                : 'bg-primary hover:bg-primary/90'
            }`}
            disabled={status === 'connecting'}
          >
            {status === 'connecting' ? (
              <Loader2 className="h-16 w-16 text-primary-foreground animate-spin" />
            ) : isActive ? (
              <MicOff className="h-16 w-16 text-white" />
            ) : (
              <Mic className="h-16 w-16 text-primary-foreground" />
            )}
          </button>

          {/* Status */}
          <div className="text-center">
            <p className="text-muted-foreground text-sm mb-1">Status:</p>
            <p className="text-primary text-lg font-semibold">{getStatusText()}</p>
          </div>

          {/* Audio Visualizer */}
          {isActive && status === 'listening' && (
            <div className="flex items-center gap-1.5 h-16">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-3 bg-primary rounded-full audio-bar"
                  style={{ height: '20%' }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Live Transcript */}
        {transcript.length > 0 && (
          <div className="w-full mt-8">
            <h3 className="text-xl font-semibold mb-4">Live Transcript</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {transcript.map((msg, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-lg ${
                    msg.role === 'assistant'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  {msg.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        {!isActive && transcript.length === 0 && (
          <Card className="w-full max-w-2xl bg-sidebar border-muted mt-12">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-2xl">💡</span> How to Use
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-foreground">
              <div className="flex items-start gap-3">
                <span className="text-primary font-bold text-lg">1</span>
                <p>Click the microphone button to start the session</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-primary font-bold text-lg">2</span>
                <p>Allow microphone access when prompted by your browser</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-primary font-bold text-lg">3</span>
                <p>Speak naturally to book appointments or place orders</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-primary font-bold text-lg">4</span>
                <p>AI checks availability and confirms your booking</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-primary font-bold text-lg">5</span>
                <p>Click the button again to end the conversation session</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
