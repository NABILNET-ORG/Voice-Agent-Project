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
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
          AI Voice Assistant Demo
        </h1>
        <p className="text-muted-foreground mt-3 text-lg">
          Experience real-time AI conversations with voice booking capabilities
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="max-w-3xl mx-auto border-red-500/50 bg-red-500/5 backdrop-blur-sm animate-shake">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="h-6 w-6 flex-shrink-0" />
              <p className="font-medium">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Demo Card */}
      <Card className="max-w-3xl mx-auto bg-[#1A1A1A]/80 backdrop-blur-xl border-[#2A2A2A] shadow-2xl">
        <CardHeader className="text-center pb-8">
          <CardTitle className="text-2xl">Live Voice Demo</CardTitle>
          <CardDescription className="text-base mt-2">
            Click the microphone to start a natural conversation with your AI assistant
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-8 pb-12">
          {/* Hidden audio element for remote audio */}
          <audio id="remote-audio" autoPlay style={{ display: 'none' }} />

          {/* Status Badge */}
          <Badge
            variant={getStatusVariant()}
            className={`text-sm px-6 py-2 font-semibold tracking-wide transition-all ${
              status === 'listening' ? 'bg-[#84CC16] text-black' :
              status === 'connecting' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' :
              status === 'processing' ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' :
              status === 'error' ? 'bg-red-500/20 text-red-400 border-red-500/50' :
              'bg-gray-500/20 text-gray-400 border-gray-500/50'
            }`}
          >
            {getStatusText()}
          </Badge>

          {/* Microphone Button with Glow Effect */}
          <div className="relative">
            {/* Glow rings */}
            {isConnected && (
              <>
                <div className="absolute inset-0 rounded-full bg-[#84CC16]/20 blur-2xl animate-pulse" />
                <div className="absolute inset-[-30px] rounded-full bg-[#84CC16]/10 blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
              </>
            )}

            <button
              onClick={isConnected ? handleEndCall : handleStartCall}
              className={`relative h-48 w-48 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                isConnected
                  ? 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-2xl shadow-red-500/50 animate-pulse-slow'
                  : 'bg-gradient-to-br from-[#84CC16] to-[#65A30D] hover:from-[#65A30D] hover:to-[#84CC16] shadow-2xl shadow-[#84CC16]/40'
              }`}
              disabled={status === 'connecting'}
            >
              {/* Inner glow */}
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/10 to-transparent" />

              {status === 'connecting' ? (
                <Loader2 className="h-20 w-20 text-white animate-spin" />
              ) : isConnected ? (
                <MicOff className="h-20 w-20 text-white drop-shadow-lg" />
              ) : (
                <Mic className="h-20 w-20 text-white drop-shadow-lg" />
              )}
            </button>
          </div>

          {/* Enhanced Audio Visualizer */}
          {isConnected && (
            <div className="flex items-center justify-center gap-2 h-20 px-8 py-4 rounded-full bg-[#0A0A0A]/50 border border-[#2A2A2A]">
              {[...Array(9)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2 bg-gradient-to-t from-[#84CC16] to-[#65A30D] rounded-full transition-all duration-200 ${
                    status === 'listening' ? 'animate-sound-wave' : ''
                  }`}
                  style={{
                    height: status === 'listening' ? `${30 + (i % 3) * 10}%` : '15%',
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Enhanced Transcript */}
          {transcript.length > 0 && (
            <div className="w-full mt-8 space-y-4 max-h-[28rem] overflow-y-auto p-6 bg-[#0A0A0A]/60 rounded-xl border border-[#2A2A2A] backdrop-blur-sm">
              <h3 className="font-bold text-base mb-4 sticky top-0 bg-[#0A0A0A] backdrop-blur-sm py-3 border-b border-[#2A2A2A] z-10">
                Live Conversation
              </h3>
              <div className="space-y-4">
                {transcript.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <div
                      className={`max-w-[85%] p-4 rounded-2xl text-sm shadow-lg ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-br from-[#84CC16] to-[#65A30D] text-black rounded-br-sm'
                          : msg.role === 'assistant'
                          ? 'bg-[#1A1A1A] border border-[#2A2A2A] text-gray-200 rounded-bl-sm'
                          : 'bg-blue-500/10 border border-blue-500/30 text-blue-300 rounded-lg'
                      }`}
                    >
                      <div className={`font-bold text-xs mb-2 ${
                        msg.role === 'user' ? 'text-black/70' : 'text-[#84CC16]'
                      }`}>
                        {msg.role === 'user' ? '👤 You' : msg.role === 'assistant' ? '🤖 AI Assistant' : '⚙️ System'}
                      </div>
                      <div className="leading-relaxed">{msg.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Instructions */}
      <Card className="max-w-3xl mx-auto bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] border-[#2A2A2A]">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <span className="text-2xl">💡</span> How to Use
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-[#1A1A1A]/50 border border-[#2A2A2A]">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#84CC16] text-black flex items-center justify-center font-bold text-xs">1</span>
            <p className="text-gray-300">Click the microphone button to start the session</p>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-[#1A1A1A]/50 border border-[#2A2A2A]">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#84CC16] text-black flex items-center justify-center font-bold text-xs">2</span>
            <p className="text-gray-300">Allow microphone access when prompted by your browser</p>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-[#1A1A1A]/50 border border-[#2A2A2A]">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#84CC16] text-black flex items-center justify-center font-bold text-xs">3</span>
            <p className="text-gray-300">Speak naturally to book appointments or place orders</p>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-[#1A1A1A]/50 border border-[#2A2A2A]">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#84CC16] text-black flex items-center justify-center font-bold text-xs">4</span>
            <p className="text-gray-300">AI checks availability and confirms your booking</p>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-[#1A1A1A]/50 border border-[#2A2A2A] md:col-span-2">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#84CC16] text-black flex items-center justify-center font-bold text-xs">5</span>
            <p className="text-gray-300">Click the button again to end the conversation session</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
