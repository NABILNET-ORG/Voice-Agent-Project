import { Mic, MicOff, Loader2, AlertCircle } from 'lucide-react';
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

  return (
    <div className="flex flex-col items-center justify-start min-h-screen py-12 px-4 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold tracking-tight text-white mb-4">
          AI Appointment Booking Demo
        </h1>
        <p className="text-gray-400 text-lg">
          Test the voice assistant by clicking the microphone button below
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="w-full max-w-4xl mb-8 p-4 rounded-lg bg-red-500/10 border border-red-500/50 animate-shake">
          <div className="flex items-center gap-3 text-red-400">
            <AlertCircle className="h-6 w-6 flex-shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Hidden audio element for remote audio */}
      <audio id="remote-audio" autoPlay style={{ display: 'none' }} />

      {/* HUGE Microphone Button with Glow Effect */}
      <div className="relative mb-8">
        {/* Glow rings */}
        {isConnected && (
          <>
            <div className="absolute inset-0 rounded-full bg-[#84CC16]/30 blur-3xl animate-pulse" />
            <div className="absolute inset-[-40px] rounded-full bg-[#84CC16]/20 blur-[80px] animate-pulse" style={{ animationDelay: '0.5s' }} />
          </>
        )}

        <button
          onClick={isConnected ? handleEndCall : handleStartCall}
          className={`relative h-64 w-64 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 ${
            isConnected
              ? 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-2xl shadow-red-500/50 animate-pulse-slow'
              : 'bg-gradient-to-br from-[#84CC16] to-[#65A30D] hover:from-[#65A30D] hover:to-[#84CC16] shadow-2xl shadow-[#84CC16]/50'
          }`}
          disabled={status === 'connecting'}
        >
          {/* Inner glow */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/20 to-transparent" />

          {status === 'connecting' ? (
            <Loader2 className="h-28 w-28 text-white animate-spin" />
          ) : isConnected ? (
            <MicOff className="h-28 w-28 text-white drop-shadow-2xl" />
          ) : (
            <Mic className="h-28 w-28 text-white drop-shadow-2xl" />
          )}
        </button>
      </div>

      {/* Status Text */}
      <div className="mb-12 text-center">
        <p className="text-gray-400 text-lg">
          Status: <span className={`font-semibold ${
            status === 'listening' ? 'text-[#84CC16]' :
            status === 'connecting' ? 'text-yellow-400' :
            status === 'processing' ? 'text-blue-400' :
            status === 'error' ? 'text-red-400' :
            'text-gray-300'
          }`}>
            {getStatusText()}
          </span>
        </p>
      </div>

      {/* Audio Visualizer */}
      {isConnected && status === 'listening' && (
        <div className="flex items-center justify-center gap-2 h-16 px-8 mb-8 rounded-full bg-[#0A0A0A]/50 border border-[#2A2A2A]">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className="w-2 bg-gradient-to-t from-[#84CC16] to-[#65A30D] rounded-full animate-sound-wave"
              style={{
                height: `${30 + (i % 3) * 10}%`,
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Live Transcript Section - Always visible */}
      <div className="w-full max-w-4xl">
        <div className="bg-[#1A1A1A] rounded-2xl border border-[#262626] p-8 min-h-[400px]">
          <h2 className="text-2xl font-bold text-white mb-6">Live Transcript</h2>

          {transcript.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <p className="text-lg">Click the microphone to start a conversation...</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {transcript.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div
                    className={`max-w-[80%] p-5 rounded-2xl text-base shadow-xl ${
                      msg.role === 'user'
                        ? 'bg-[#84CC16] text-black rounded-br-sm'
                        : msg.role === 'assistant'
                        ? 'bg-[#2A2A2A] border border-[#3A3A3A] text-white rounded-bl-sm'
                        : 'bg-blue-500/10 border border-blue-500/30 text-blue-300 rounded-lg'
                    }`}
                  >
                    <div className="leading-relaxed">{msg.text}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
