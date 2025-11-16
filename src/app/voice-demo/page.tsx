"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Phone, PhoneOff, Sparkles } from "lucide-react";
import { toast } from "sonner";

type Provider = 'openai' | 'gemini';

export default function VoiceDemoPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("Disconnected");
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<Provider | null>(null);

  const websocketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const setupMessageRef = useRef<any>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, []);

  const connect = async () => {
    try {
      console.log("[Connect] Starting connection...");
      setError(null);
      setStatus("Connecting...");

      // Get session credentials from backend
      console.log("[Connect] Fetching session token...");
      const tokenResponse = await fetch("/api/voice-agent/token", {
        method: "POST",
      });

      console.log("[Connect] Token response status:", tokenResponse.status);

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        console.error("[Connect] Token request failed:", errorData);
        throw new Error(errorData.error || "Failed to get session token");
      }

      const sessionData = await tokenResponse.json();
      console.log("[Connect] Session data received:", {
        provider: sessionData.provider,
        hasWsUrl: !!sessionData.ws_url,
        hasClientSecret: !!sessionData.client_secret,
        model: sessionData.model
      });

      const detectedProvider: Provider = sessionData.provider;
      setProvider(detectedProvider);

      if (detectedProvider === 'openai') {
        console.log("[Connect] Using OpenAI provider");
        await connectOpenAI(sessionData);
      } else if (detectedProvider === 'gemini') {
        console.log("[Connect] Using Gemini provider");
        await connectGemini(sessionData);
      } else {
        throw new Error(`Unsupported provider: ${detectedProvider}`);
      }

    } catch (err: any) {
      console.error("[Connect] ❌ Connection error:", err);
      console.error("[Connect] Error stack:", err.stack);
      setError(err.message);
      setStatus("Error");
      toast.error(err.message);
    }
  };

  const connectOpenAI = async (sessionData: any) => {
    const { client_secret, ws_url } = sessionData;

    // Connect to OpenAI Realtime API via WebSocket
    const ws = new WebSocket(ws_url, {
      headers: {
        Authorization: `Bearer ${client_secret}`,
        "OpenAI-Beta": "realtime=v1",
      },
    } as any);

    ws.onopen = () => {
      setIsConnected(true);
      setStatus("Connected (OpenAI)");
      toast.success("Connected to OpenAI voice agent");

      // Start audio capture (24kHz for OpenAI)
      startAudioCapture(24000, 'openai');
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleOpenAIMessage(message);
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
  };

  const connectGemini = async (sessionData: any) => {
    const { ws_url, setup_message } = sessionData;

    console.log("[Gemini] Session data received:", {
      hasWsUrl: !!ws_url,
      hasSetupMessage: !!setup_message,
      wsUrl: ws_url?.substring(0, 80) + "..."
    });

    // Store setup message for later
    setupMessageRef.current = setup_message;

    // Connect to Gemini Live API via WebSocket
    console.log("[Gemini] Creating WebSocket connection...");
    const ws = new WebSocket(ws_url);

    ws.onopen = () => {
      console.log("[Gemini] ✅ WebSocket OPENED successfully");
      console.log("[Gemini] Sending setup message:", setup_message);

      // Send setup message
      try {
        const setupString = JSON.stringify(setup_message);
        console.log("[Gemini] Setup message size:", setupString.length, "bytes");
        ws.send(setupString);
        console.log("[Gemini] ✅ Setup message SENT");
      } catch (err) {
        console.error("[Gemini] ❌ Failed to send setup message:", err);
      }
    };

    ws.onmessage = async (event) => {
      console.log("[Gemini] ⬇️ Message RECEIVED, type:", typeof event.data, event.data instanceof Blob ? `Blob(${event.data.size} bytes)` : 'String');

      try {
        let messageText = event.data;

        // If it's a Blob, convert to text first
        if (event.data instanceof Blob) {
          console.log("[Gemini] Converting Blob to text...");
          messageText = await event.data.text();
          console.log("[Gemini] Blob converted, text:", messageText);
        }

        const message = JSON.parse(messageText);
        console.log("[Gemini] Parsed message:", message);
        handleGeminiMessage(message, ws);
      } catch (err) {
        console.error("[Gemini] ❌ Failed to parse message:", err);
        console.error("[Gemini] Raw data:", event.data);
      }
    };

    ws.onerror = (error) => {
      console.error("[Gemini] ❌ WebSocket ERROR:", error);
      console.error("[Gemini] Error details:", {
        type: error.type,
        target: error.target,
        currentTarget: error.currentTarget
      });
      setError("Connection error occurred");
      setStatus("Error");
      toast.error("Connection error");
    };

    ws.onclose = (event) => {
      console.log("[Gemini] ❌ WebSocket CLOSED:", {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean
      });
      setIsConnected(false);
      setIsRecording(false);
      setStatus("Disconnected");
      stopAudioCapture();

      // Show reason to user if available
      if (event.reason) {
        toast.error(`Disconnected: ${event.reason}`);
      }
    };

    websocketRef.current = ws;
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
    setProvider(null);
  };

  const startAudioCapture = async (sampleRate: number, detectedProvider: Provider) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // OpenAI uses 24kHz, Gemini uses 16kHz
      const audioContext = new AudioContext({ sampleRate });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        if (websocketRef.current?.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcm16 = convertFloat32ToPCM16(inputData);

          if (detectedProvider === 'openai') {
            // Send audio data to OpenAI Realtime API
            websocketRef.current.send(
              JSON.stringify({
                type: "input_audio_buffer.append",
                audio: arrayBufferToBase64(pcm16),
              })
            );
          } else if (detectedProvider === 'gemini') {
            // Send audio data to Gemini Live API
            websocketRef.current.send(
              JSON.stringify({
                realtime_input: {
                  media_chunks: [
                    {
                      mime_type: 'audio/pcm',
                      data: arrayBufferToBase64(pcm16)
                    }
                  ]
                }
              })
            );
          }
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

  const handleOpenAIMessage = (message: any) => {
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
        setTranscript((prev) => [
          ...prev,
          `[Function: ${message.name}]`,
        ]);
        break;

      case "error":
        console.error("Realtime API error:", message.error);
        setError(message.error.message);
        toast.error(message.error.message);
        break;
    }
  };

  const handleGeminiMessage = (message: any, ws: WebSocket) => {
    console.log("[Gemini Handler] ⬇️ Received message type:", Object.keys(message));
    console.log("[Gemini Handler] Full message:", message);

    // Setup complete
    if (message.setupComplete) {
      console.log("[Gemini Handler] ✅ SETUP COMPLETE!");
      setIsConnected(true);
      setStatus("Connected (Gemini)");
      toast.success("Connected to Gemini voice agent (19x cheaper!)");

      // Start audio capture (16kHz for Gemini)
      startAudioCapture(16000, 'gemini');
      return;
    }

    // Check for errors in setup
    if (message.error) {
      console.error("[Gemini Handler] ❌ ERROR in message:", message.error);
      setError(message.error.message || JSON.stringify(message.error));
      toast.error(message.error.message || "Gemini API error");
      return;
    }

    // Server content (audio, transcript, function calls)
    if (message.serverContent) {
      const content = message.serverContent;

      // Model turn (contains audio and/or text)
      if (content.modelTurn) {
        const parts = content.modelTurn.parts || [];

        // Extract text (transcript/response)
        const textPart = parts.find((p: any) => p.text);
        if (textPart) {
          setTranscript((prev) => [
            ...prev,
            `Assistant: ${textPart.text}`,
          ]);
        }

        // Extract audio (play it back)
        const audioPart = parts.find((p: any) => p.inlineData?.mimeType === 'audio/pcm');
        if (audioPart) {
          // TODO: Play audio back to user
          console.log("Received audio from Gemini");
        }
      }

      // Function calls
      if (content.functionCalls) {
        content.functionCalls.forEach((call: any) => {
          console.log("Gemini function call:", call.name, call.args);
          setTranscript((prev) => [
            ...prev,
            `[Function: ${call.name}]`,
          ]);

          // Execute function and send response
          executeFunctionCall(call, ws);
        });
      }

      // Turn complete
      if (content.turnComplete !== undefined) {
        console.log("Turn complete");
      }
    }

    // Tool call (alternative structure)
    if (message.toolCall) {
      const functionCalls = message.toolCall.functionCalls || [];
      functionCalls.forEach((call: any) => {
        console.log("Gemini tool call:", call.name, call.args);
        executeFunctionCall(call, ws);
      });
    }

    // Error
    if (message.error) {
      console.error("Gemini API error:", message.error);
      setError(message.error.message || "Gemini API error");
      toast.error(message.error.message || "Gemini API error");
    }
  };

  const executeFunctionCall = async (call: any, ws: WebSocket) => {
    try {
      // Call backend function execution endpoint
      const response = await fetch("/api/voice-agent/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          function_name: call.name,
          arguments: call.args,
          call_id: call.id,
        }),
      });

      const result = await response.json();

      // Send function response back to Gemini
      ws.send(
        JSON.stringify({
          tool_response: {
            function_responses: [
              {
                id: call.id,
                name: call.name,
                response: result.result,
              },
            ],
          },
        })
      );

      setTranscript((prev) => [
        ...prev,
        `[Function Result: ${JSON.stringify(result.result)}]`,
      ]);
    } catch (error: any) {
      console.error("Function execution error:", error);
      toast.error(`Function execution failed: ${error.message}`);
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
            {provider && (
              <Badge variant="outline" className="ml-2">
                {provider === 'gemini' && <Sparkles className="h-3 w-3 mr-1" />}
                {provider === 'openai' ? 'OpenAI' : 'Gemini (19x cheaper!)'}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Test the AI voice booking agent. Click "Start Call" to begin a voice conversation.
            {provider === 'gemini' && (
              <span className="block mt-1 text-green-600 font-medium">
                Using Gemini Live API - $0.016/min vs $0.30/min (OpenAI)
              </span>
            )}
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
                          : line.startsWith("[Function")
                          ? "text-purple-600 italic"
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
              <li>Provider selection is based on your Settings → AI Integrations</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
