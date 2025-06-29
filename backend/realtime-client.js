const WebSocket = require('ws');
const EventEmitter = require('events');

class RealtimeClient extends EventEmitter {
    constructor() {
        super();
        this.ws = null;
        this.apiKey = process.env.OPENAI_API_KEY;
        this.url = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01";
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    async connect() {
        try {
            if (!this.apiKey) {
                throw new Error('OpenAI API key not found. Please set OPENAI_API_KEY in your .env file');
            }

            this.ws = new WebSocket(this.url, {
                headers: {
                    "Authorization": `Bearer ${this.apiKey}`,
                    "OpenAI-Beta": "realtime=v1"
                }
            });

            this.ws.on('open', () => {
                console.log('Connected to OpenAI Realtime API');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.setupSession();
            });

            this.ws.on('message', (data) => {
                try {
                    const event = JSON.parse(data.toString());
                    this.handleServerEvent(event);
                } catch (error) {
                    console.error('Error parsing message:', error);
                }
            });

            this.ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                this.emit('error', error);
            });

            this.ws.on('close', (code, reason) => {
                console.log(`WebSocket closed: ${code} - ${reason}`);
                this.isConnected = false;
                this.handleReconnection();
            });

        } catch (error) {
            console.error('Connection failed:', error);
            throw error;
        }
    }

    setupSession() {
        const sessionConfig = {
            type: "session.update",
            session: {
                modalities: ["text", "audio"],
                instructions: "You are a helpful AI assistant. Respond naturally and conversationally. Keep responses concise but engaging.",
                voice: "alloy", // Options: alloy, echo, fable, onyx, nova, shimmer
                input_audio_format: "pcm16",
                output_audio_format: "pcm16",
                input_audio_transcription: {
                    model: "whisper-1"
                },
                turn_detection: {
                    type: "server_vad",
                    threshold: 0.5,
                    prefix_padding_ms: 300,
                    silence_duration_ms: 500
                },
                tools: [
                    {
                        type: "function",
                        name: "get_current_time",
                        description: "Get the current time",
                        parameters: {
                            type: "object",
                            properties: {},
                            required: []
                        }
                    }
                ],
                tool_choice: "auto",
                temperature: 0.8,
                max_response_output_tokens: 2048
            }
        };

        this.sendEvent(sessionConfig);
    }

    sendEvent(event) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(event));
            return true;
        }
        return false;
    }

    handleServerEvent(event) {
        // Forward all events to the client
        this.emit('message', event);

        // Handle specific events for logging or processing
        switch (event.type) {
            case 'session.created':
                console.log('Session created:', event.session.id);
                break;
            
            case 'session.updated':
                console.log('Session updated');
                break;
            
            case 'response.audio.delta':
                // Audio data is being streamed
                break;
            
            case 'response.audio_transcript.delta':
                console.log('AI transcript:', event.delta);
                break;
            
            case 'input_audio_buffer.speech_started':
                console.log('User started speaking');
                break;
            
            case 'input_audio_buffer.speech_stopped':
                console.log('User stopped speaking');
                break;

            case 'response.function_call_arguments.delta':
                console.log('Function call:', event.name, event.delta);
                break;

            case 'response.function_call_arguments.done':
                // Handle function execution
                this.handleFunctionCall(event);
                break;
            
            case 'error':
                console.error('API Error:', event.error);
                this.emit('error', new Error(event.error.message || 'Unknown API error'));
                break;
        }
    }

    handleFunctionCall(event) {
        const { call_id, name, arguments: args } = event;
        
        try {
            let result;
            
            switch (name) {
                case 'get_current_time':
                    result = {
                        time: new Date().toLocaleString(),
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                    };
                    break;
                
                default:
                    result = { error: `Unknown function: ${name}` };
            }

            // Send function response back
            this.sendEvent({
                type: "conversation.item.create",
                item: {
                    type: "function_call_output",
                    call_id: call_id,
                    output: JSON.stringify(result)
                }
            });

        } catch (error) {
            console.error('Function execution error:', error);
            this.sendEvent({
                type: "conversation.item.create",
                item: {
                    type: "function_call_output",
                    call_id: call_id,
                    output: JSON.stringify({ error: error.message })
                }
            });
        }
    }

    sendTextMessage(text) {
        const success = this.sendEvent({
            type: "conversation.item.create",
            item: {
                type: "message",
                role: "user",
                content: [{
                    type: "input_text",
                    text: text
                }]
            }
        });
        
        if (success) {
            this.sendEvent({ type: "response.create" });
        }
        
        return success;
    }

    sendAudioData(audioBase64) {
        return this.sendEvent({
            type: "input_audio_buffer.append",
            audio: audioBase64
        });
    }

    commitAudio() {
        const success1 = this.sendEvent({ type: "input_audio_buffer.commit" });
        const success2 = this.sendEvent({ type: "response.create" });
        return success1 && success2;
    }

    clearAudioBuffer() {
        return this.sendEvent({ type: "input_audio_buffer.clear" });
    }

    cancelResponse() {
        return this.sendEvent({ type: "response.cancel" });
    }

    handleReconnection() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
            
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
            
            setTimeout(() => {
                this.connect().catch(error => {
                    console.error('Reconnection failed:', error);
                });
            }, delay);
        } else {
            console.error('Max reconnection attempts reached');
            this.emit('error', new Error('Connection lost and max reconnection attempts reached'));
        }
    }

    disconnect() {
        if (this.ws) {
            this.isConnected = false;
            this.ws.close();
            this.ws = null;
        }
    }

    getConnectionStatus() {
        return {
            connected: this.isConnected,
            readyState: this.ws ? this.ws.readyState : WebSocket.CLOSED,
            reconnectAttempts: this.reconnectAttempts
        };
    }
}

module.exports = RealtimeClient;