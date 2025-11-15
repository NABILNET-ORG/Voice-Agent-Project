"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Phone, AlertCircle, Volume2, Calendar, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { useRealtimeAPI } from "@/hooks/useRealtimeAPI";

export default function LiveDemo() {
  const { status, transcript, error, connect, disconnect, isConnected } = useRealtimeAPI();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [volume, setVolume] = useState([80]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [transcript]);

  // Update audio volume when slider changes
  useEffect(() => {
    const audioElement = document.getElementById('remote-audio') as HTMLAudioElement;
    if (audioElement) {
      audioElement.volume = volume[0] / 100;
    }
  }, [volume]);

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

          {/* Available Time Slots & Quick Actions */}
          <Card className="bg-[#1A1A1A] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>Available Time Slots</span>
                <Badge className="bg-[#84CC16] text-black">
                  {isConnected ? 'Ready' : 'Offline'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Volume Control */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-400 flex items-center gap-2">
                      <Volume2 className="h-4 w-4" />
                      Sound Control
                    </label>
                    <span className="text-xs text-gray-500">{volume[0]}%</span>
                  </div>
                  <Slider
                    value={volume}
                    onValueChange={setVolume}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>

                <Separator className="bg-gray-800" />

                {/* Available Time Slots */}
                <div className="space-y-2">
                  {[
                    { time: '2:00 PM', available: true },
                    { time: '3:30 PM', available: true },
                    { time: '5:00 PM', available: false },
                    { time: '6:30 PM', available: true }
                  ].map((slot, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700"
                    >
                      <span className="text-white font-medium">{slot.time}</span>
                      <Badge className={slot.available ? 'bg-[#84CC16] text-black' : 'bg-red-600 text-white'}>
                        {slot.available ? 'Available' : 'Booked'}
                      </Badge>
                    </div>
                  ))}
                </div>

                <Separator className="bg-gray-800" />

                {/* Quick Actions */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-white mb-3">Quick Actions</h4>

                  <Button
                    variant="outline"
                    className="w-full justify-start bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                    onClick={() => window.location.href = '/bookings'}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    View Calendar
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                    onClick={() => window.location.href = '/bookings'}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Check Availability
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                    disabled={transcript.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Transcript
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
