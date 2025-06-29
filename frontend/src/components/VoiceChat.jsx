// Fixed VoiceChat.jsx - Proper error handling

import React, { useState, useRef, useEffect, useCallback } from 'react';
import AudioVisualizer from './AudioVisualizer';
import { convertAudioToBase64, playAudioFromBase64 } from '../utils/audioUtils';

const VoiceChat = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('Disconnected');
    const [messages, setMessages] = useState([]);
    const [error, setError] = useState(null);
    
    const wsRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioContextRef = useRef(null);
    const audioChunksRef = useRef([]);

    // Helper function to safely extract error message
    const getErrorMessage = (errorData) => {
        // If it's already a string, return it
        if (typeof errorData === 'string') {
            return errorData;
        }
        
        // If it's an object, extract the message
        if (typeof errorData === 'object' && errorData !== null) {
            // Try different possible error message fields
            return errorData.message || 
                   errorData.error?.message || 
                   errorData.details || 
                   JSON.stringify(errorData);
        }
        
        // Fallback
        return 'Unknown error occurred';
    };

    // Initialize WebSocket connection
    const connectToServer = useCallback(() => {
        try {
            setConnectionStatus('Connecting...');
            setError(null);
            
            wsRef.current = new WebSocket('ws://localhost:3001');
            
            wsRef.current.onopen = () => {
                console.log('Connected to server');
                setConnectionStatus('Connected to Server');
                
                // Connect to OpenAI Realtime API through server
                wsRef.current.send(JSON.stringify({ type: 'connect' }));
            };
            
            wsRef.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    handleServerMessage(data);
                } catch (error) {
                    console.error('Error parsing server message:', error);
                    setError('Failed to parse server response');
                }
            };
            
            wsRef.current.onclose = () => {
                console.log('Disconnected from server');
                setIsConnected(false);
                setConnectionStatus('Disconnected');
            };
            
            wsRef.current.onerror = (error) => {
                console.error('WebSocket error:', error);
                setError('Connection error. Please check if the server is running.');
                setConnectionStatus('Connection Error');
            };
            
        } catch (error) {
            console.error('Failed to connect:', error);
            setError('Failed to connect to server');
        }
    }, []);

    const handleServerMessage = useCallback((data) => {
        console.log('Received:', data.type);
        
        switch (data.type) {
            case 'connected':
                setIsConnected(true);
                setConnectionStatus('Connected to OpenAI');
                addMessage('system', 'Connected! You can start talking.');
                break;
                
            case 'response.audio.delta':
                // Play audio chunk
                if (data.delta) {
                    playAudioFromBase64(data.delta);
                    setIsPlaying(true);
                }
                break;
                
            case 'response.audio.done':
                setIsPlaying(false);
                break;
                
            case 'response.text.delta':
                // Update last AI message with streaming text
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    
                    if (lastMessage && lastMessage.role === 'assistant' && lastMessage.type === 'text') {
                        lastMessage.content += data.delta;
                    } else {
                        newMessages.push({
                            role: 'assistant',
                            type: 'text',
                            content: data.delta,
                            timestamp: new Date()
                        });
                    }
                    
                    return newMessages;
                });
                break;
                
            case 'response.audio_transcript.delta':
                // Update AI transcript
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    
                    if (lastMessage && lastMessage.role === 'assistant' && lastMessage.type === 'transcript') {
                        lastMessage.content += data.delta;
                    } else {
                        newMessages.push({
                            role: 'assistant',
                            type: 'transcript',
                            content: data.delta,
                            timestamp: new Date()
                        });
                    }
                    
                    return newMessages;
                });
                break;
                
            case 'input_audio_buffer.speech_started':
                addMessage('system', 'Listening...');
                break;
                
            case 'input_audio_buffer.speech_stopped':
                addMessage('system', 'Processing...');
                break;
                
            case 'error':
                // FIXED: Properly handle error objects
                const errorMessage = getErrorMessage(data.error);
                console.error('Server error:', data.error);
                setError(errorMessage);
                addMessage('system', `Error: ${errorMessage}`, 'error');
                
                // If it's an authentication error, provide helpful message
                if (errorMessage.includes('authentication') || 
                    errorMessage.includes('API key') || 
                    errorMessage.includes('unauthorized')) {
                    setError('OpenAI API key is invalid or missing. Please check your .env file.');
                }
                break;
                
            // Handle OpenAI API errors that might come through
            case 'session.error':
            case 'response.error':
                const apiErrorMessage = getErrorMessage(data.error);
                console.error('OpenAI API error:', data);
                setError(`OpenAI API Error: ${apiErrorMessage}`);
                addMessage('system', `API Error: ${apiErrorMessage}`, 'error');
                break;
                
            default:
                console.log('Unhandled message type:', data.type, data);
        }
    }, []);

    const addMessage = (role, content, type = 'text') => {
        // Ensure content is always a string
        const messageContent = typeof content === 'string' ? content : JSON.stringify(content);
        
        setMessages(prev => [...prev, {
            role,
            type,
            content: messageContent, // Guaranteed to be a string
            timestamp: new Date()
        }]);
    };

    // Start recording
    const startRecording = async () => {
        try {
            setError(null); // Clear any previous errors
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    sampleRate: 24000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true
                } 
            });
            
            audioContextRef.current = new AudioContext({ sampleRate: 24000 });
            mediaRecorderRef.current = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });
            
            audioChunksRef.current = [];
            
            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };
            
            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                
                try {
                    const base64Audio = await convertAudioToBase64(audioBlob, audioContextRef.current);
                    
                    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                        // Send audio data
                        wsRef.current.send(JSON.stringify({
                            type: 'audio_data',
                            audio: base64Audio
                        }));
                        
                        // Commit audio and trigger response
                        wsRef.current.send(JSON.stringify({
                            type: 'commit_audio'
                        }));
                        
                        addMessage('user', 'Audio message sent', 'audio');
                    }
                } catch (error) {
                    console.error('Error processing audio:', error);
                    setError(`Audio processing error: ${error.message}`);
                }
                
                // Clean up
                stream.getTracks().forEach(track => track.stop());
            };
            
            mediaRecorderRef.current.start(1000); // Collect data every second
            setIsRecording(true);
            addMessage('system', 'Recording started...');
            
        } catch (error) {
            console.error('Error starting recording:', error);
            setError(`Microphone error: ${error.message}`);
        }
    };

    // Stop recording
    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            addMessage('system', 'Recording stopped. Processing...');
        }
    };

    // Send text message
    const sendTextMessage = (text) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && text.trim()) {
            wsRef.current.send(JSON.stringify({
                type: 'text_message',
                text: text.trim()
            }));
            
            addMessage('user', text.trim(), 'text');
        }
    };

    // Disconnect
    const disconnect = () => {
        if (wsRef.current) {
            wsRef.current.send(JSON.stringify({ type: 'disconnect' }));
            wsRef.current.close();
        }
        setIsConnected(false);
        setConnectionStatus('Disconnected');
    };

    // Auto-connect on component mount
    useEffect(() => {
        connectToServer();
        
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [connectToServer]);

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            {/* Status Bar */}
            <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                        isConnected ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="font-medium">{connectionStatus}</span>
                </div>
                
                <div className="flex space-x-2">
                    {!isConnected ? (
                        <button
                            onClick={connectToServer}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Connect
                        </button>
                    ) : (
                        <button
                            onClick={disconnect}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                            Disconnect
                        </button>
                    )}
                </div>
            </div>

            {/* Error Display - FIXED */}
            {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <strong>Error:</strong>
                            <p className="mt-1 text-sm">{error}</p>
                            {error.includes('API key') && (
                                <p className="mt-2 text-xs text-red-600">
                                    💡 Make sure your .env file contains: OPENAI_API_KEY=your_key_here
                                </p>
                            )}
                        </div>
                        <button 
                            onClick={() => setError(null)}
                            className="ml-2 text-red-500 hover:text-red-700 text-lg"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {/* Voice Controls */}
            <div className="flex flex-col items-center space-y-4 mb-6">
                <AudioVisualizer isRecording={isRecording} isPlaying={isPlaying} />
                
                <div className="flex space-x-4">
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={!isConnected}
                        className={`px-8 py-4 rounded-full text-white font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                            isRecording 
                                ? 'bg-red-500 hover:bg-red-600' 
                                : 'bg-green-500 hover:bg-green-600'
                        }`}
                    >
                        {isRecording ? '🛑 Stop Recording' : '🎤 Start Recording'}
                    </button>
                </div>
                
                <p className="text-sm text-gray-600 text-center">
                    {isRecording 
                        ? 'Speak clearly into your microphone...' 
                        : 'Click the microphone to start a voice conversation'
                    }
                </p>
            </div>

            {/* Text Input */}
            <div className="mb-6">
                <form onSubmit={(e) => {
                    e.preventDefault();
                    const text = e.target.message.value;
                    sendTextMessage(text);
                    e.target.message.value = '';
                }}>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            name="message"
                            placeholder="Or type a message..."
                            disabled={!isConnected}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        />
                        <button
                            type="submit"
                            disabled={!isConnected}
                            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Send
                        </button>
                    </div>
                </form>
            </div>

            {/* Chat Messages */}
            <div className="h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 space-y-3">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        <p>No messages yet. Start by connecting and speaking or typing!</p>
                    </div>
                ) : (
                    messages.map((message, index) => (
                        <div key={index} className={`flex ${
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}>
                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                message.role === 'user' 
                                    ? 'bg-blue-500 text-white' 
                                    : message.role === 'system'
                                    ? message.type === 'error'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-gray-100 text-gray-600'
                                    : 'bg-gray-200 text-gray-800'
                            }`}>
                                <div className="flex items-center space-x-2 mb-1">
                                    <span className="text-xs font-medium">
                                        {message.role === 'user' ? 'You' : 
                                         message.role === 'system' ? 'System' : 'AI'}
                                    </span>
                                    {message.type === 'audio' && <span>🎵</span>}
                                    {message.type === 'transcript' && <span>📝</span>}
                                    {message.type === 'error' && <span>⚠️</span>}
                                </div>
                                {/* FIXED: Ensure content is always a string */}
                                <p className="text-sm break-words">{message.content}</p>
                                <span className="text-xs opacity-70">
                                    {message.timestamp.toLocaleTimeString()}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Instructions */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">How to use:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Click "Start Recording" to begin voice chat</li>
                    <li>• Speak naturally - the AI will respond with voice</li>
                    <li>• Use the text input for written messages</li>
                    <li>• Make sure your microphone is enabled</li>
                    <li>• Check that your OpenAI API key is set in backend/.env</li>
                </ul>
            </div>
        </div>
    );
};

export default VoiceChat;