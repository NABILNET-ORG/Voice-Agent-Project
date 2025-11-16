/**
 * useVoiceAgent Hook
 *
 * Unified WebSocket-based voice agent hook supporting both OpenAI and Gemini
 * Replaces useRealtimeAPI (WebRTC-based, OpenAI only)
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: number;
}

type ConnectionStatus = 'ready' | 'connecting' | 'listening' | 'processing' | 'error';
type Provider = 'openai' | 'gemini' | 'openrouter';

export function useVoiceAgent() {
  const [status, setStatus] = useState<ConnectionStatus>('ready');
  const [transcript, setTranscript] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [provider, setProvider] = useState<Provider | null>(null);

  const websocketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const setupMessageRef = useRef<any>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  const addMessage = useCallback((role: 'user' | 'assistant' | 'system', text: string) => {
    setTranscript(prev => [...prev, { role, text, timestamp: Date.now() }]);
  }, []);

  const connect = useCallback(async () => {
    try {
      console.log("[VoiceAgent] Starting connection...");
      setError(null);
      setStatus('connecting');

      // Get session credentials from backend
      const tokenResponse = await fetch("/api/voice-agent/token", {
        method: "POST",
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        throw new Error(errorData.error || "Failed to get session token");
      }

      const sessionData = await tokenResponse.json();
      const detectedProvider: Provider = sessionData.provider;
      setProvider(detectedProvider);

      console.log("[VoiceAgent] Session data:", {
        provider: detectedProvider,
        model: sessionData.model,
        voice: sessionData.voice
      });

      if (detectedProvider === 'openai') {
        await connectOpenAI(sessionData);
      } else if (detectedProvider === 'gemini') {
        await connectGemini(sessionData);
      } else {
        throw new Error(`Unsupported provider: ${detectedProvider}`);
      }

    } catch (err: any) {
      console.error("[VoiceAgent] Connection error:", err);
      setError(err.message);
      setStatus('error');
      toast.error(err.message);
    }
  }, []);

  const connectOpenAI = async (sessionData: any) => {
    const { client_secret, ws_url } = sessionData;

    const ws = new WebSocket(ws_url, {
      headers: {
        Authorization: `Bearer ${client_secret}`,
        "OpenAI-Beta": "realtime=v1",
      },
    } as any);

    ws.onopen = () => {
      setIsConnected(true);
      setStatus('listening');
      toast.success("Connected to OpenAI voice agent");
      addMessage('system', 'Connected to AI Booking Agent (OpenAI)');
      startAudioCapture(24000, 'openai');
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleOpenAIMessage(message);
    };

    ws.onerror = () => {
      setError("Connection error occurred");
      setStatus('error');
    };

    ws.onclose = () => {
      setIsConnected(false);
      setStatus('ready');
      stopAudioCapture();
    };

    websocketRef.current = ws;
  };

  const connectGemini = async (sessionData: any) => {
    const { ws_url, setup_message } = sessionData;
    setupMessageRef.current = setup_message;

    const ws = new WebSocket(ws_url);

    ws.onopen = () => {
      console.log("[VoiceAgent] Gemini WebSocket opened, sending setup...");
      ws.send(JSON.stringify(setup_message));
    };

    ws.onmessage = async (event) => {
      console.log("[VoiceAgent] Gemini message received, type:", typeof event.data, event.data instanceof Blob ? `Blob(${event.data.size})` : 'String');
      try {
        let messageText = event.data;
        if (event.data instanceof Blob) {
          messageText = await event.data.text();
          console.log("[VoiceAgent] Blob converted to text:", messageText);
        }
        const message = JSON.parse(messageText);
        console.log("[VoiceAgent] Parsed Gemini message:", message);
        handleGeminiMessage(message, ws);
      } catch (err) {
        console.error("[VoiceAgent] Failed to parse Gemini message:", err);
      }
    };

    ws.onerror = () => {
      setError("Connection error occurred");
      setStatus('error');
    };

    ws.onclose = (event) => {
      console.log("[VoiceAgent] Gemini disconnected:", event.code, event.reason);
      setIsConnected(false);
      setStatus('ready');
      stopAudioCapture();
      if (event.reason) {
        toast.error(`Disconnected: ${event.reason}`);
      }
    };

    websocketRef.current = ws;
  };

  const disconnect = useCallback(() => {
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
    stopAudioCapture();
    setIsConnected(false);
    setStatus('ready');
    setProvider(null);
  }, []);

  const startAudioCapture = async (sampleRate: number, detectedProvider: Provider) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      mediaStreamRef.current = stream;

      const audioContext = new AudioContext({ sampleRate });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        if (websocketRef.current?.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcm16 = convertFloat32ToPCM16(inputData);

          if (detectedProvider === 'openai') {
            websocketRef.current.send(
              JSON.stringify({
                type: "input_audio_buffer.append",
                audio: arrayBufferToBase64(pcm16),
              })
            );
          } else if (detectedProvider === 'gemini') {
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

      setStatus('listening');
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
  };

  const handleOpenAIMessage = (message: any) => {
    switch (message.type) {
      case "conversation.item.created":
        if (message.item.type === "message") {
          const content = message.item.content?.[0];
          if (content?.transcript) {
            addMessage('user', content.transcript);
          }
        }
        break;

      case "response.audio_transcript.done":
        addMessage('assistant', message.transcript);
        break;

      case "response.function_call_arguments.done":
        console.log("Function called:", message.name, message.arguments);
        setStatus('processing');
        break;

      case "error":
        console.error("OpenAI error:", message.error);
        setError(message.error.message);
        toast.error(message.error.message);
        break;
    }
  };

  const handleGeminiMessage = (message: any, ws: WebSocket) => {
    console.log("[VoiceAgent] handleGeminiMessage called with:", Object.keys(message));

    if (message.setupComplete) {
      console.log("[VoiceAgent] Setup complete received!");
      setIsConnected(true);
      setStatus('listening');
      const costSavings = provider === 'gemini' ? ' (19x cheaper!)' : '';
      toast.success(`Connected to Gemini voice agent${costSavings}`);
      addMessage('system', 'Connected to AI Booking Agent (Gemini - 94.7% cheaper!)');
      startAudioCapture(16000, 'gemini');
      return;
    }

    if (message.error) {
      console.error("Gemini error:", message.error);
      setError(message.error.message || JSON.stringify(message.error));
      toast.error(message.error.message || "Gemini API error");
      return;
    }

    if (message.serverContent) {
      const content = message.serverContent;

      // Extract text transcript
      if (content.modelTurn) {
        const parts = content.modelTurn.parts || [];
        const textPart = parts.find((p: any) => p.text);
        if (textPart) {
          addMessage('assistant', textPart.text);
        }
      }

      // Handle function calls
      if (content.functionCalls) {
        setStatus('processing');
        content.functionCalls.forEach((call: any) => {
          console.log("Gemini function call:", call.name, call.args);
          executeFunctionCall(call, ws);
        });
      }
    }
  };

  const executeFunctionCall = async (call: any, ws: WebSocket) => {
    try {
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

      setStatus('listening');
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

  return {
    status,
    transcript,
    error,
    connect,
    disconnect,
    isConnected,
    provider
  };
}
