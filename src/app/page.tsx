"use client";

import { useEffect, useRef } from "react";
import { Mic, MicOff, Phone, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useRealtimeAPI } from "@/hooks/useRealtimeAPI";

export default function LiveDemo() {
  const { status, transcript, error, connect, disconnect, isConnected } = useRealtimeAPI();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [transcript]);

  const getStatusText = () => {
    switch (status) {
      case 'ready':
        return 'Ready to Connect';
      case 'connecting':
        return 'Connecting...';
      case 'listening':
        return 'Listening...';
      case 'processing':
        return 'Processing...';
      case 'error':
        return 'Connection Error';
      default:
        return 'Ready';
    }
  };

  const getStatusColor = () => {
    if (status === 'error') return 'bg-red-600 text-white';
    if (isConnected) return 'bg-[#84CC16] text-black';
    return 'bg-gray-600 text-white';
  };

  return (
    <>
      {/* Hidden audio element for OpenAI audio playback */}
      <audio id="remote-audio" autoPlay style={{ display: 'none' }} />

      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">AI Business Assistant Demo</h1>
            <p className="text-gray-400 mt-2">Experience the power of AI-powered booking and customer service</p>
          </div>
          <Badge className={getStatusColor()}>
            {getStatusText()}
          </Badge>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="bg-red-500/10 border-red-500">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-500">Connection Error</p>
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Voice Interface */}
          <Card className="lg:col-span-2 bg-[#1A1A1A] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Voice Interface</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Microphone Button */}
              <div className="flex justify-center">
                <Button
                  size="lg"
                  onClick={isConnected ? disconnect : connect}
                  disabled={status === 'connecting'}
                  className={`h-24 w-24 rounded-full transition-all duration-300 ${
                    isConnected
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-[#84CC16] hover:bg-[#65A30D] text-black"
                  }`}
                >
                  {isConnected ? (
                    <MicOff className="h-10 w-10" />
                  ) : (
                    <Phone className="h-10 w-10" />
                  )}
                </Button>
              </div>

              {/* Audio Visualizer */}
              {status === 'processing' && (
                <div className="flex justify-center items-center gap-1 h-16">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div
                      key={i}
                      className="w-2 bg-[#84CC16] rounded-full animate-pulse"
                      style={{
                        height: `${30 + (i % 3) * 20}%`,
                        animationDelay: `${i * 0.1}s`,
                        animationDuration: '0.8s'
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Status Messages */}
              <div className="text-center">
                <p className="text-gray-400">{getStatusText()}</p>
                {isConnected && (
                  <p className="text-sm text-gray-500 mt-2">
                    Speak clearly and naturally. The AI will respond to help you.
                  </p>
                )}
                {!isConnected && (
                  <p className="text-sm text-gray-500 mt-2">
                    Click the phone button to connect. Make sure your microphone is enabled.
                  </p>
                )}
              </div>

              <Separator className="bg-gray-800" />

              {/* Transcript Display */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Conversation</h3>
                <ScrollArea className="h-64 w-full rounded-lg border border-gray-800 p-4">
                  {transcript.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      Start a conversation to see the transcript here
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {transcript.map((message, index) => (
                        <div
                          key={index}
                          ref={index === transcript.length - 1 ? scrollRef : null}
                          className={`flex ${
                            message.role === "user" ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              message.role === "user"
                                ? "bg-[#84CC16] text-black"
                                : message.role === "system"
                                ? "bg-gray-700 text-gray-300"
                                : "bg-gray-800 text-white"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </CardContent>
          </Card>

          {/* Info Panel */}
          <Card className="bg-[#1A1A1A] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">How to Use</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-400">
                  <li>Click the phone button to connect</li>
                  <li>Allow microphone access when prompted</li>
                  <li>Start speaking naturally</li>
                  <li>The AI will respond with voice</li>
                  <li>Click the red button to disconnect</li>
                </ol>

                <Separator className="bg-gray-800" />

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-white">What You Can Do</h4>
                  <ul className="space-y-1 text-sm text-gray-400">
                    <li>• Ask about available services</li>
                    <li>• Check booking times</li>
                    <li>• Make an appointment</li>
                    <li>• Get business information</li>
                  </ul>
                </div>

                <Separator className="bg-gray-800" />

                <div className="p-3 bg-blue-500/10 border border-blue-500 rounded-lg">
                  <p className="text-xs text-blue-400">
                    <strong>Note:</strong> This uses OpenAI's Realtime API. Make sure OPENAI_API_KEY is configured in Supabase Edge Functions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
