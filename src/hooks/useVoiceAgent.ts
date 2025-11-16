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
  const audioQueueRef = useRef<AudioBufferSourceNode[]>([]);
  const nextPlayTimeRef = useRef<number>(0);
  const isRespondingRef = useRef<boolean>(false);
  const currentTranscriptIndexRef = useRef<number>(-1);
  const transcriptBufferRef = useRef<string>('');

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
        console.error("[VoiceAgent] Token endpoint error:", errorData);
        throw new Error(errorData.error || errorData.message || "Failed to get session token");
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

    // OpenAI Realtime API uses query parameter for authentication
    const authenticatedUrl = `${ws_url}?model=${sessionData.model}`;
    const ws = new WebSocket(authenticatedUrl, [
      'realtime',
      `openai-insecure-api-key.${client_secret}`,
      'openai-beta.realtime-v1'
    ]);

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
      const setupPayload = JSON.stringify(setup_message);
      console.log("[VoiceAgent] Setup message being sent:", setupPayload.substring(0, 500));
      ws.send(setupPayload);
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

        // Log errors in detail
        if (message.error) {
          console.error("[VoiceAgent] Gemini error details:", JSON.stringify(message.error, null, 2));
        }

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
      console.error("[VoiceAgent] Gemini disconnected:", {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean
      });
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

    // Stop all queued audio sources
    audioQueueRef.current.forEach(source => {
      try {
        source.stop();
      } catch (e) {
        // Source may already be stopped
      }
    });
    audioQueueRef.current = [];
    nextPlayTimeRef.current = 0;

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

      let audioChunkCount = 0;
      processor.onaudioprocess = (e) => {
        if (websocketRef.current?.readyState === WebSocket.OPEN) {
          // For OpenAI: Don't send audio while AI is responding (prevents echo/feedback loop)
          if (detectedProvider === 'openai' && isRespondingRef.current) {
            return; // Skip sending audio while AI is talking
          }

          const inputData = e.inputBuffer.getChannelData(0);
          const pcm16 = convertFloat32ToPCM16(inputData);

          audioChunkCount++;
          if (audioChunkCount % 50 === 0) {
            console.log(`[VoiceAgent] Sent ${audioChunkCount} audio chunks to ${detectedProvider}`);
          }

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
    console.log("[VoiceAgent] OpenAI message type:", message.type);

    switch (message.type) {
      case "session.created":
      case "session.updated":
        console.log("[VoiceAgent] OpenAI session ready");
        break;

      case "input_audio_buffer.speech_started":
        // User started speaking - if AI is responding, cancel it (interruption)
        if (isRespondingRef.current && websocketRef.current?.readyState === WebSocket.OPEN) {
          console.log("[VoiceAgent] User interrupted AI, canceling response");
          websocketRef.current.send(JSON.stringify({
            type: "response.cancel"
          }));
          isRespondingRef.current = false;
          setStatus('listening');

          // Clear audio queue to stop playing
          audioQueueRef.current.forEach(source => {
            try {
              source.stop();
            } catch (e) {
              // Already stopped
            }
          });
          audioQueueRef.current = [];
          nextPlayTimeRef.current = 0;
        }
        break;

      case "input_audio_buffer.speech_stopped":
        // Speech stopped - don't manually trigger, Server VAD handles it automatically
        console.log("[VoiceAgent] Speech stopped detected (Server VAD will auto-respond)");
        break;

      case "response.created":
        // AI started responding - stop sending audio to prevent echo/feedback
        console.log("[VoiceAgent] Response started, pausing audio input");
        isRespondingRef.current = true;
        setStatus('processing');
        break;

      case "response.done":
        // AI finished responding - ready for next turn
        console.log("[VoiceAgent] Response complete, ready for next turn");
        isRespondingRef.current = false;
        setStatus('listening');
        break;

      case "conversation.item.created":
        if (message.item.type === "message") {
          const content = message.item.content?.[0];
          if (content?.transcript) {
            addMessage('user', content.transcript);
          }
        }
        break;

      case "conversation.item.input_audio_transcription.completed":
        // User's speech transcription completed
        if (message.transcript) {
          console.log("[VoiceAgent] User said:", message.transcript);
          addMessage('user', message.transcript);
        }
        break;

      case "response.audio.delta":
        // Play audio chunk from OpenAI
        if (message.delta) {
          console.log("[VoiceAgent] Playing OpenAI audio chunk");
          playOpenAIAudio(message.delta);
        }
        break;

      case "response.audio_transcript.delta":
        // Incremental transcript - append to current message
        if (message.delta) {
          transcriptBufferRef.current += message.delta;

          // Update or create the transcript message
          setTranscript(prev => {
            const lastIndex = prev.length - 1;
            const lastMsg = prev[lastIndex];

            // If last message is from assistant and recent, update it
            if (lastMsg && lastMsg.role === 'assistant' && Date.now() - lastMsg.timestamp < 5000) {
              const updated = [...prev];
              updated[lastIndex] = {
                ...lastMsg,
                text: transcriptBufferRef.current
              };
              return updated;
            } else {
              // Create new message
              return [...prev, {
                role: 'assistant',
                text: transcriptBufferRef.current,
                timestamp: Date.now()
              }];
            }
          });
        }
        break;

      case "response.audio_transcript.done":
        // Transcript complete - reset buffer for next response
        transcriptBufferRef.current = '';
        break;

      case "response.function_call_arguments.done":
        console.log("OpenAI function call:", message.name, message.arguments);
        setStatus('processing');
        // Execute the function and send result back to OpenAI
        executeOpenAIFunction(message.call_id, message.name, message.arguments);
        break;

      case "error":
        console.error("OpenAI error:", message.error);
        setError(message.error.message);
        toast.error(message.error.message);
        break;

      default:
        // Log unknown message types for debugging
        if (!['input_audio_buffer.speech_started', 'input_audio_buffer.speech_stopped',
              'input_audio_buffer.committed', 'response.created', 'response.done',
              'response.output_item.added', 'response.output_item.done',
              'response.content_part.added', 'response.content_part.done',
              'rate_limits.updated', 'response.audio.done',
              'conversation.item.input_audio_transcription.delta',
              'conversation.item.input_audio_transcription.completed',
              'response.function_call_arguments.delta'].includes(message.type)) {
          console.log("[VoiceAgent] Unknown OpenAI message type:", message.type);
        }
    }
  };

  const playOpenAIAudio = (base64Audio: string) => {
    try {
      // Same buffering logic as Gemini
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const pcm16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / (pcm16[i] < 0 ? 0x8000 : 0x7fff);
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      }

      const audioContext = audioContextRef.current;
      const audioBuffer = audioContext.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);

      const currentTime = audioContext.currentTime;
      if (nextPlayTimeRef.current < currentTime) {
        nextPlayTimeRef.current = currentTime;
      }

      source.start(nextPlayTimeRef.current);
      nextPlayTimeRef.current += audioBuffer.duration;

      source.onended = () => {
        const index = audioQueueRef.current.indexOf(source);
        if (index > -1) {
          audioQueueRef.current.splice(index, 1);
        }
      };

      audioQueueRef.current.push(source);
    } catch (err) {
      console.error("[VoiceAgent] Error playing OpenAI audio:", err);
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

      // Extract and play audio + text transcript
      if (content.modelTurn) {
        const parts = content.modelTurn.parts || [];
        console.log("[VoiceAgent] modelTurn parts:", parts.length, "parts");

        // Extract and play audio
        const audioPart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('audio/pcm'));
        if (audioPart) {
          console.log("[VoiceAgent] Playing audio chunk");
          playGeminiAudio(audioPart.inlineData.data);
        }

        // Extract text transcript
        const textPart = parts.find((p: any) => p.text);
        if (textPart) {
          console.log("[VoiceAgent] Found text transcript:", textPart.text);
          addMessage('assistant', textPart.text);
        } else {
          console.log("[VoiceAgent] No text part found, only audio");
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

  const playGeminiAudio = (base64Audio: string) => {
    try {
      // Decode base64 to ArrayBuffer
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert PCM16 to Float32 for Web Audio API
      const pcm16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / (pcm16[i] < 0 ? 0x8000 : 0x7fff);
      }

      // Create audio buffer and play (24kHz for Gemini output)
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      }

      const audioContext = audioContextRef.current;
      const audioBuffer = audioContext.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);

      // Schedule playback for smooth continuous audio
      const currentTime = audioContext.currentTime;

      // If we haven't started playing yet, or if there's a gap, start immediately
      if (nextPlayTimeRef.current < currentTime) {
        nextPlayTimeRef.current = currentTime;
      }

      // Start this chunk at the scheduled time
      source.start(nextPlayTimeRef.current);

      // Update next play time to be right after this chunk finishes
      nextPlayTimeRef.current += audioBuffer.duration;

      // Clean up finished sources
      source.onended = () => {
        const index = audioQueueRef.current.indexOf(source);
        if (index > -1) {
          audioQueueRef.current.splice(index, 1);
        }
      };

      audioQueueRef.current.push(source);
    } catch (err) {
      console.error("[VoiceAgent] Error playing audio:", err);
    }
  };

  const executeOpenAIFunction = async (callId: string, functionName: string, args: any) => {
    try {
      console.log("[VoiceAgent] Executing OpenAI function:", functionName, args);

      const response = await fetch("/api/voice-agent/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          function_name: functionName,
          arguments: args,
          call_id: callId,
        }),
      });

      const result = await response.json();
      console.log("[VoiceAgent] Function result:", result);

      // Send function output back to OpenAI using conversation.item.create
      if (websocketRef.current?.readyState === WebSocket.OPEN) {
        websocketRef.current.send(JSON.stringify({
          type: "conversation.item.create",
          item: {
            type: "function_call_output",
            call_id: callId,
            output: JSON.stringify(result.result || result)
          }
        }));

        // Trigger AI to continue with the function result
        websocketRef.current.send(JSON.stringify({
          type: "response.create"
        }));
      }

      setStatus('listening');
    } catch (error: any) {
      console.error("[VoiceAgent] Function execution error:", error);
      toast.error(`Function execution failed: ${error.message}`);
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

      // For Gemini: Use tool_response format
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
