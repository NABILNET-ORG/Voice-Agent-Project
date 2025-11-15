import { useEffect, useRef, useState, useCallback } from 'react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: number;
}

type ConnectionStatus = 'ready' | 'connecting' | 'listening' | 'processing' | 'error';

export function useRealtimeAPI() {
  const [status, setStatus] = useState<ConnectionStatus>('ready');
  const [transcript, setTranscript] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  const addMessage = useCallback((role: 'user' | 'assistant' | 'system', text: string) => {
    setTranscript(prev => [...prev, { role, text, timestamp: Date.now() }]);
  }, []);

  const connect = useCallback(async () => {
    try {
      setStatus('connecting');
      setError(null);
      setTranscript([]);

      // Fetch business context and knowledge
      const contextResponse = await fetch('/api/voice-agent/context');
      if (!contextResponse.ok) {
        console.error('Failed to fetch voice agent context');
      }
      const context = await contextResponse.json();

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      audioStreamRef.current = stream;

      // Get ephemeral token from our API route
      const response = await fetch('/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: 'gpt-4o-realtime-preview-2024-12-17' })
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const data = await response.json();
      if (!data?.client_secret?.value) {
        throw new Error('No session token received');
      }

      const EPHEMERAL_KEY = data.client_secret.value;

      // Create peer connection
      const pc = new RTCPeerConnection();
      peerConnectionRef.current = pc;

      // Add microphone audio to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Handle incoming audio from OpenAI
      pc.ontrack = (event) => {
        const remoteStream = event.streams[0];
        const audioElement = document.getElementById('remote-audio') as HTMLAudioElement;
        if (audioElement) {
          audioElement.srcObject = remoteStream;
          audioElement.play().catch(err => console.error('Audio playback error:', err));
        }
      };

      // Create data channel for events
      const dc = pc.createDataChannel('oai-events');
      dataChannelRef.current = dc;

      dc.onopen = () => {
        console.log('Data channel opened');
        setStatus('listening');
        addMessage('system', 'Connected to AI Booking Agent');

        // Build comprehensive instructions from business context
        let instructions = context.aiConfig?.systemInstructions || 'You are a helpful AI assistant for a booking system.';

        // Add business information
        if (context.business) {
          instructions += `\n\nBusiness Information:`;
          instructions += `\n- Business Name: ${context.business.name}`;
          instructions += `\n- Type: ${context.business.type}`;
          if (context.business.description) {
            instructions += `\n- Description: ${context.business.description}`;
          }

          // Add services information
          if (context.business.services && Array.isArray(context.business.services)) {
            instructions += `\n\nAvailable Services:`;
            context.business.services.forEach((service: any) => {
              instructions += `\n- ${service.name}: $${service.price} (${service.duration} minutes)`;
              if (service.description) {
                instructions += ` - ${service.description}`;
              }
            });
          }

          // Add business hours
          if (context.business.hours) {
            instructions += `\n\nBusiness Hours: ${JSON.stringify(context.business.hours)}`;
          }
        }

        // Add knowledge base summaries
        if (context.knowledge && context.knowledge.length > 0) {
          instructions += `\n\nKnowledge Base (use this information to answer customer questions):`;
          context.knowledge.forEach((source: any, index: number) => {
            instructions += `\n\n[Source ${index + 1}: ${source.title || source.url}]`;
            instructions += `\n${source.summary}`;
          });
        }

        // Add personality and greeting
        if (context.aiConfig?.personality) {
          instructions += `\n\nPersonality: ${context.aiConfig.personality}`;
        }
        if (context.aiConfig?.greetingTemplate) {
          instructions += `\n\nGreeting: ${context.aiConfig.greetingTemplate}`;
        }
        if (context.aiConfig?.confirmationTemplate) {
          instructions += `\n\nBooking Confirmation Template: ${context.aiConfig.confirmationTemplate}`;
        }

        console.log('Voice Agent Instructions:', instructions.substring(0, 500) + '...');

        // Send session configuration with loaded context
        const sessionUpdate = {
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: instructions,
            voice: context.aiConfig?.voice || 'alloy',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1'
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500,
            },
          },
        };
        dc.send(JSON.stringify(sessionUpdate));
      };

      dc.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleRealtimeEvent(message);
        } catch (err) {
          console.error('Error parsing data channel message:', err);
        }
      };

      dc.onerror = (err) => {
        console.error('Data channel error:', err);
        setError('Connection error occurred');
        setStatus('error');
      };

      dc.onclose = () => {
        console.log('Data channel closed');
      };

      // Create and set local offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send offer to OpenAI and get answer
      const baseUrl = 'https://api.openai.com/v1/realtime';
      const model = 'gpt-4o-realtime-preview-2024-12-17';
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${EPHEMERAL_KEY}`,
          'Content-Type': 'application/sdp',
        },
        body: offer.sdp,
      });

      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text();
        throw new Error(`SDP exchange failed: ${sdpResponse.status} - ${errorText}`);
      }

      const answerSdp = await sdpResponse.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

      console.log('WebRTC connection established');
    } catch (err: any) {
      console.error('Connection error:', err);
      setError(err.message || 'Failed to connect');
      setStatus('error');
      disconnect();
    }
  }, [addMessage]);

  const handleRealtimeEvent = (event: any) => {
    switch (event.type) {
      case 'conversation.item.created':
        if (event.item?.type === 'message') {
          const role = event.item.role;
          if (event.item.content) {
            event.item.content.forEach((content: any) => {
              if (content.type === 'text') {
                addMessage(role, content.text);
              }
            });
          }
        }
        break;

      case 'conversation.item.input_audio_transcription.completed':
        if (event.transcript) {
          addMessage('user', event.transcript);
        }
        break;

      case 'response.audio_transcript.delta':
        if (event.delta) {
          setTranscript(prev => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'assistant') {
              return [
                ...prev.slice(0, -1),
                { ...last, text: last.text + event.delta }
              ];
            } else {
              return [...prev, { role: 'assistant', text: event.delta, timestamp: Date.now() }];
            }
          });
        }
        break;

      case 'response.audio_transcript.done':
        if (event.transcript) {
          setTranscript(prev => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'assistant' && !last.text.trim()) {
              return [...prev.slice(0, -1), { ...last, text: event.transcript }];
            }
            return prev;
          });
        }
        break;

      case 'response.done':
        setStatus('listening');
        break;

      case 'input_audio_buffer.speech_started':
        setStatus('listening');
        break;

      case 'input_audio_buffer.speech_stopped':
        setStatus('processing');
        break;

      case 'error':
        console.error('Realtime API error:', event.error);
        setError(event.error?.message || 'An error occurred');
        setStatus('error');
        break;

      default:
        // Log other events for debugging
        if (event.type?.includes('error')) {
          console.error('Error event:', event);
        }
    }
  };

  const disconnect = useCallback(() => {
    // Close data channel
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Stop microphone
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }

    setStatus('ready');
    addMessage('system', 'Disconnected from AI Booking Agent');
  }, [addMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    status,
    transcript,
    error,
    connect,
    disconnect,
    isConnected: status !== 'ready' && status !== 'error',
  };
}
