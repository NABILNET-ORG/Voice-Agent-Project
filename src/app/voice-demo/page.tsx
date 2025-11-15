"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import { toast } from "sonner";

export default function VoiceDemoPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("Disconnected");
  const [error, setError] = useState<string | null>(null);

  const websocketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, []);

  const connect = async () => {
    try {
      setError(null);
      setStatus("Connecting...");

      // Get ephemeral token from backend
      const tokenResponse = await fetch("/api/voice-agent/token", {
        method: "POST",
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        throw new Error(errorData.error || "Failed to get session token");
      }

      const { client_secret } = await tokenResponse.json();

      // Connect to OpenAI Realtime API via WebSocket
      const ws = new WebSocket(
        `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`,
        {
          headers: {
            Authorization: `Bearer ${client_secret}`,
            "OpenAI-Beta": "realtime=v1",
          },
        } as any
      );

      ws.onopen = () => {
        setIsConnected(true);
        setStatus("Connected");
        toast.success("Connected to voice agent");

        // Start audio capture
        startAudioCapture();
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleRealtimeMessage(message);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setError("Connection error occurred");
        setStatus("Error");
        toast.error("Connection error");
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsRecording(false);
        setStatus("Disconnected");
        stopAudioCapture();
      };

      websocketRef.current = ws;
    } catch (err: any) {
      console.error("Connection error:", err);
      setError(err.message);
      setStatus("Error");
      toast.error(err.message);
    }
  };

  const disconnect = () => {
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
    stopAudioCapture();
    setIsConnected(false);
    setIsRecording(false);
    setStatus("Disconnected");
  };

  const startAudioCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioContext = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        if (websocketRef.current?.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcm16 = convertFloat32ToPCM16(inputData);

          // Send audio data to OpenAI Realtime API
          websocketRef.current.send(
            JSON.stringify({
              type: "input_audio_buffer.append",
              audio: arrayBufferToBase64(pcm16),
            })
          );
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      setIsRecording(true);
      toast.success("Microphone active");
    } catch (err: any) {
      console.error("Error accessing microphone:", err);
      setError("Failed to access microphone");
      toast.error("Failed to access microphone");
    }
  };

  const stopAudioCapture = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsRecording(false);
  };

  const handleRealtimeMessage = (message: any) => {
    switch (message.type) {
      case "conversation.item.created":
        if (message.item.type === "message") {
          const content = message.item.content?.[0];
          if (content?.transcript) {
            setTranscript((prev) => [
              ...prev,
              `User: ${content.transcript}`,
            ]);
          }
        }
        break;

      case "response.audio_transcript.delta":
        // Real-time transcript from assistant
        console.log("Assistant:", message.delta);
        break;

      case "response.audio_transcript.done":
        // Complete transcript from assistant
        setTranscript((prev) => [
          ...prev,
          `Assistant: ${message.transcript}`,
        ]);
        break;

      case "response.function_call_arguments.done":
        // Function call completed
        console.log("Function called:", message.name, message.arguments);
        break;

      case "error":
        console.error("Realtime API error:", message.error);
        setError(message.error.message);
        toast.error(message.error.message);
        break;
    }
  };

  // Helper functions
  const convertFloat32ToPCM16 = (float32Array: Float32Array): ArrayBuffer => {
    const pcm16 = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return pcm16.buffer;
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-6 w-6" />
            Voice Agent Demo
          </CardTitle>
          <CardDescription>
            Test the AI voice booking agent. Click "Start Call" to begin a voice conversation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              <Badge
                variant={
                  isConnected
                    ? "default"
                    : status === "Error"
                    ? "destructive"
                    : "secondary"
                }
              >
                {status}
              </Badge>
              {isRecording && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  Recording
                </Badge>
              )}
            </div>

            {/* Controls */}
            <div className="flex gap-2">
              {!isConnected ? (
                <Button onClick={connect} className="gap-2">
                  <Phone className="h-4 w-4" />
                  Start Call
                </Button>
              ) : (
                <Button onClick={disconnect} variant="destructive" className="gap-2">
                  <PhoneOff className="h-4 w-4" />
                  End Call
                </Button>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Transcript */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Conversation Transcript</h3>
            <div className="h-96 overflow-y-auto rounded-md border bg-slate-50 p-4">
              {transcript.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Conversation transcript will appear here...
                </p>
              ) : (
                <div className="space-y-2">
                  {transcript.map((line, index) => (
                    <div
                      key={index}
                      className={`text-sm ${
                        line.startsWith("User:")
                          ? "text-blue-700 font-medium"
                          : "text-slate-700"
                      }`}
                    >
                      {line}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="rounded-md bg-blue-50 border border-blue-200 p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              How to use:
            </h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Click "Start Call" to begin</li>
              <li>Allow microphone access when prompted</li>
              <li>Speak naturally with the AI agent</li>
              <li>Try asking about services, prices, or booking an appointment</li>
              <li>The AI can check availability and create bookings for you</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
