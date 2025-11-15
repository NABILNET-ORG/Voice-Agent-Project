import { useEffect, useRef, useState, useCallback } from 'react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: number;
  isTyping?: boolean;  // For typing animation
  fullText?: string;   // Complete text for typing animation
}

type ConnectionStatus = 'ready' | 'connecting' | 'listening' | 'processing' | 'error';

export function useRealtimeAPI() {
  const [status, setStatus] = useState<ConnectionStatus>('ready');
  const [transcript, setTranscript] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const addMessage = useCallback((role: 'user' | 'assistant' | 'system', text: string) => {
    setTranscript(prev => [...prev, { role, text, timestamp: Date.now() }]);
  }, []);

  // Add message with typing animation (for assistant only)
  const addMessageWithTyping = useCallback((role: 'user' | 'assistant' | 'system', fullText: string) => {
    if (role !== 'assistant') {
      // No typing animation for user/system messages
      addMessage(role, fullText);
      return;
    }

    // Clear any existing typing interval
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    // Add message with empty text, then animate
    setTranscript(prev => {
      const messageIndex = prev.length;
      const newMessage: Message = {
        role,
        text: '',
        fullText,
        isTyping: true,
        timestamp: Date.now()
      };

      // Typing animation - add characters progressively
      let currentIndex = 0;
      const typingSpeed = 30; // milliseconds per character

      typingIntervalRef.current = setInterval(() => {
        if (currentIndex < fullText.length) {
          currentIndex++;
          setTranscript(prev => {
            const updated = [...prev];
            if (updated[messageIndex]) {
              updated[messageIndex] = {
                ...updated[messageIndex],
                text: fullText.substring(0, currentIndex)
              };
            }
            return updated;
          });
        } else {
          // Typing complete
          if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
          }
          setTranscript(prev => {
            const updated = [...prev];
            if (updated[messageIndex]) {
              updated[messageIndex] = {
                ...updated[messageIndex],
                isTyping: false,
                fullText: undefined
              };
            }
            return updated;
          });
        }
      }, typingSpeed);

      return [...prev, newMessage];
    });
  }, [addMessage]);

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

        // Build comprehensive instructions from ALL settings data
        let instructions = context.aiConfig?.systemInstructions || 'You are a helpful AI assistant for a booking system.';

        // Business Information
        if (context.business) {
          instructions += `\n\n=== BUSINESS INFORMATION ===`;
          instructions += `\nName: ${context.business.name}`;
          instructions += `\nType: ${context.business.type} (${context.business.category})`;
          if (context.business.description) {
            instructions += `\nDescription: ${context.business.description}`;
          }
          if (context.business.phone) instructions += `\nPhone: ${context.business.phone}`;
          if (context.business.address) instructions += `\nAddress: ${context.business.address}`;
          if (context.business.website) instructions += `\nWebsite: ${context.business.website}`;
          instructions += `\nLanguage: ${context.business.language}`;
          instructions += `\nCurrency: ${context.business.currency}`;
          instructions += `\nTimezone: ${context.business.timezone}`;
        }

        // Services/Products
        if (context.services && Array.isArray(context.services) && context.services.length > 0) {
          instructions += `\n\n=== SERVICES/PRODUCTS ===`;
          context.services.forEach((service: any) => {
            instructions += `\n• ${service.name}`;
            if (service.price) instructions += ` - ${context.business.currency} ${service.price}`;
            if (service.duration) instructions += ` (${service.duration} min)`;
            if (service.category) instructions += ` [${service.category}]`;
            if (service.description) instructions += `\n  ${service.description}`;
          });
        }

        // Schedule & Hours
        if (context.schedule) {
          instructions += `\n\n=== SCHEDULE & HOURS ===`;
          if (context.schedule.is24_7) {
            instructions += `\nOpen 24/7`;
          } else if (context.schedule.hours) {
            instructions += `\nBusiness Hours:`;
            Object.entries(context.schedule.hours).forEach(([day, hours]: [string, any]) => {
              if (hours && hours.open && hours.close) {
                instructions += `\n  ${day.charAt(0).toUpperCase() + day.slice(1)}: ${hours.open} - ${hours.close}`;
              } else {
                instructions += `\n  ${day.charAt(0).toUpperCase() + day.slice(1)}: Closed`;
              }
            });
          }
          if (context.schedule.breakTimes) {
            instructions += `\nBreak Times: ${JSON.stringify(context.schedule.breakTimes)}`;
          }
        }

        // Booking Policies
        if (context.booking) {
          instructions += `\n\n=== BOOKING POLICIES ===`;
          if (context.booking.bufferMinutes) instructions += `\nBuffer between appointments: ${context.booking.bufferMinutes} minutes`;
          if (context.booking.maxAdvanceDays) instructions += `\nMaximum advance booking: ${context.booking.maxAdvanceDays} days`;
          if (context.booking.minAdvanceHours) instructions += `\nMinimum advance notice: ${context.booking.minAdvanceHours} hours`;
          instructions += `\nSame-day bookings: ${context.booking.allowSameDay ? 'Allowed' : 'Not allowed'}`;
          if (context.booking.maxPerDay) instructions += `\nMaximum appointments per day: ${context.booking.maxPerDay}`;
        }

        // Delivery Info (if applicable)
        if (context.delivery) {
          instructions += `\n\n=== DELIVERY INFORMATION ===`;
          if (context.delivery.defaultTimeMinutes) instructions += `\nEstimated delivery time: ${context.delivery.defaultTimeMinutes} minutes`;
          if (context.delivery.minimumOrderAmount) instructions += `\nMinimum order: ${context.business.currency} ${context.delivery.minimumOrderAmount}`;
          if (context.delivery.maxRadiusKm) instructions += `\nDelivery radius: ${context.delivery.maxRadiusKm} km`;
          instructions += `\nAccept orders outside hours: ${context.delivery.acceptOutsideHours ? 'Yes' : 'No'}`;
          if (context.delivery.zones) instructions += `\nDelivery zones: ${JSON.stringify(context.delivery.zones)}`;
        }

        // Emergency Services (if applicable)
        if (context.emergency) {
          instructions += `\n\n=== EMERGENCY SERVICES ===`;
          instructions += `\nEmergency service available: ${context.emergency.available ? 'Yes' : 'No'}`;
          if (context.emergency.surcharge) instructions += `\nEmergency surcharge: ${context.business.currency} ${context.emergency.surcharge}`;
          if (context.emergency.weekendSurcharge) instructions += `\nWeekend surcharge: ${context.business.currency} ${context.emergency.weekendSurcharge}`;
          if (context.emergency.afterHoursSurcharge) instructions += `\nAfter-hours surcharge: ${context.business.currency} ${context.emergency.afterHoursSurcharge}`;
          if (context.emergency.serviceAreas) instructions += `\nService areas: ${context.emergency.serviceAreas.join(', ')}`;
          if (context.emergency.responseTimes) instructions += `\nResponse times: ${JSON.stringify(context.emergency.responseTimes)}`;
        }

        // Payment Information
        if (context.payment) {
          instructions += `\n\n=== PAYMENT INFORMATION ===`;
          if (context.payment.acceptedMethods) instructions += `\nAccepted payment methods: ${context.payment.acceptedMethods.join(', ')}`;
          instructions += `\nPayment required upfront: ${context.payment.requireUpfront ? 'Yes' : 'No'}`;
          if (context.payment.depositAmount) {
            instructions += `\nDeposit required: ${context.business.currency} ${context.payment.depositAmount}`;
            if (context.payment.depositType) instructions += ` (${context.payment.depositType})`;
          }
        }

        // Notifications & Confirmations
        if (context.notifications) {
          instructions += `\n\n=== CONFIRMATIONS & NOTIFICATIONS ===`;
          if (context.notifications.instantConfirmation) instructions += `\nInstant confirmation sent: Yes`;
          if (context.notifications.customer.sendReminders && context.notifications.customer.reminderHoursBefore) {
            instructions += `\nReminders sent ${context.notifications.customer.reminderHoursBefore} hours before appointment`;
          }
          instructions += `\nCustomer notifications: ${context.notifications.customer.email ? 'Email' : ''}${context.notifications.customer.sms ? ', SMS' : ''}`;
        }

        // Knowledge Base
        if (context.knowledge && context.knowledge.length > 0) {
          instructions += `\n\n=== KNOWLEDGE BASE (${context.knowledge.length} sources) ===`;
          instructions += `\nUse this information to answer customer questions accurately:`;
          context.knowledge.forEach((source: any, index: number) => {
            instructions += `\n\n[${index + 1}] ${source.title || source.url}`;
            instructions += `\n${source.summary}`;
          });
        }

        // AI Behavior Guidelines
        instructions += `\n\n=== AI BEHAVIOR GUIDELINES ===`;
        if (context.aiConfig?.personality) instructions += `\nPersonality: ${context.aiConfig.personality}`;
        if (context.aiConfig?.greetingTemplate) instructions += `\nGreeting: ${context.aiConfig.greetingTemplate}`;
        if (context.aiConfig?.confirmationTemplate) instructions += `\nConfirmation template: ${context.aiConfig.confirmationTemplate}`;
        if (context.aiConfig?.enableSmallTalk) instructions += `\nSmall talk: Enabled`;
        if (context.aiConfig?.askForEmail) instructions += `\nAlways ask for email: Yes`;
        if (context.aiConfig?.confirmBeforeBooking) instructions += `\nConfirm before booking: Yes`;
        if (context.aiConfig?.maxCallDuration) instructions += `\nMaximum call duration: ${context.aiConfig.maxCallDuration} minutes`;

        // Important reminders
        instructions += `\n\nIMPORTANT REMINDERS:`;
        instructions += `\n- All times are in ${context.business?.timezone || 'UTC'} timezone`;
        instructions += `\n- All prices are in ${context.business?.currency || 'USD'}`;
        instructions += `\n- Use the knowledge base information to answer specific questions about products/services`;
        instructions += `\n- Follow the booking policies strictly`;
        instructions += `\n- Inform customers about notification methods and payment requirements`;
        instructions += `\n\nBOOKING WORKFLOW:`;
        instructions += `\n1. ALWAYS call check_availability tool FIRST to see available time slots`;
        instructions += `\n2. Present available slots to customer and let them choose`;
        instructions += `\n3. Collect: name, email, phone (if not already provided)`;
        instructions += `\n4. ONLY call create_booking tool AFTER customer confirms the time`;
        instructions += `\n5. NEVER say "I've booked you" without actually calling create_booking tool`;
        instructions += `\n6. Wait for create_booking success response before confirming to customer`;

        console.log('Voice Agent Instructions (length: ' + instructions.length + ' chars):');
        console.log(instructions.substring(0, 800) + '...\n\n[FULL CONTEXT LOADED WITH ALL SETTINGS]');

        // Send session configuration with loaded context and booking tools
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
            tools: [
              {
                type: 'function',
                name: 'check_availability',
                description: 'Check available time slots for booking. MUST be called before creating any booking to verify the time is available.',
                parameters: {
                  type: 'object',
                  properties: {
                    date: {
                      type: 'string',
                      description: 'Date in YYYY-MM-DD format (e.g., 2025-11-16)'
                    },
                    service_name: {
                      type: 'string',
                      description: 'Name of the service the customer wants to book'
                    }
                  },
                  required: ['date']
                }
              },
              {
                type: 'function',
                name: 'create_booking',
                description: 'Create a new booking. ONLY call this after checking availability with check_availability tool.',
                parameters: {
                  type: 'object',
                  properties: {
                    customer_name: {
                      type: 'string',
                      description: 'Customer full name'
                    },
                    customer_email: {
                      type: 'string',
                      description: 'Customer email address'
                    },
                    customer_phone: {
                      type: 'string',
                      description: 'Customer phone number'
                    },
                    service_name: {
                      type: 'string',
                      description: 'Name of the service to book'
                    },
                    date: {
                      type: 'string',
                      description: 'Booking date in YYYY-MM-DD format'
                    },
                    time: {
                      type: 'string',
                      description: 'Booking time in HH:MM format (24-hour, e.g., 15:00)'
                    },
                    notes: {
                      type: 'string',
                      description: 'Additional notes or special requests'
                    }
                  },
                  required: ['customer_name', 'customer_email', 'service_name', 'date', 'time']
                }
              }
            ],
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

  const handleFunctionCall = async (callId: string, functionName: string, argsJson: string) => {
    try {
      const args = JSON.parse(argsJson);
      console.log(`[Tool Call] ${functionName}:`, args);

      let result: any = {};

      if (functionName === 'check_availability') {
        // Call availability API
        const response = await fetch('/api/bookings/check-availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: args.date,
            service_name: args.service_name
          })
        });

        if (response.ok) {
          result = await response.json();
        } else {
          result = { error: 'Failed to check availability' };
        }
      } else if (functionName === 'create_booking') {
        // Call booking creation API
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_name: args.customer_name,
            customer_email: args.customer_email,
            customer_phone: args.customer_phone,
            service_name: args.service_name,
            date: args.date,
            time: args.time,
            notes: args.notes || ''
          })
        });

        if (response.ok) {
          result = await response.json();
        } else {
          const errorData = await response.json();
          result = { error: errorData.error || 'Failed to create booking' };
        }
      }

      // Send function result back to agent
      if (dataChannelRef.current?.readyState === 'open') {
        const functionOutput = {
          type: 'conversation.item.create',
          item: {
            type: 'function_call_output',
            call_id: callId,
            output: JSON.stringify(result)
          }
        };
        dataChannelRef.current.send(JSON.stringify(functionOutput));

        // Trigger a response from the agent
        dataChannelRef.current.send(JSON.stringify({ type: 'response.create' }));
      }
    } catch (error) {
      console.error('Error handling function call:', error);
    }
  };

  const handleRealtimeEvent = (event: any) => {
    switch (event.type) {
      case 'conversation.item.created':
        if (event.item?.type === 'message') {
          const role = event.item.role;
          if (event.item.content) {
            event.item.content.forEach((content: any) => {
              if (content.type === 'text') {
                // Use regular message (audio_transcript.delta handles typing)
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
        // Real-time transcript deltas as agent speaks
        if (event.delta) {
          setTranscript(prev => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'assistant' && last.isTyping !== false) {
              // Append delta to existing assistant message
              return [
                ...prev.slice(0, -1),
                { ...last, text: last.text + event.delta, isTyping: true }
              ];
            } else {
              // Start new assistant message with typing indicator
              return [...prev, {
                role: 'assistant',
                text: event.delta,
                timestamp: Date.now(),
                isTyping: true
              }];
            }
          });
        }
        break;

      case 'response.audio_transcript.done':
        // Finalize transcript - remove typing indicator
        setTranscript(prev => {
          const last = prev[prev.length - 1];
          if (last && last.role === 'assistant') {
            return [
              ...prev.slice(0, -1),
              { ...last, isTyping: false, fullText: undefined }
            ];
          }
          return prev;
        });
        break;

      case 'response.done':
        setStatus('listening');
        break;

      case 'response.function_call_arguments.done':
        // Agent is calling a tool/function
        console.log('[Function Call]', event.name, event.arguments);
        handleFunctionCall(event.call_id, event.name, event.arguments);
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
    // Clear typing animation interval
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }

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
