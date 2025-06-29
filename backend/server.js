const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');
const RealtimeClient = require('./realtime-client');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = require('http').createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store active connections
const connections = new Map();

wss.on('connection', (ws, request) => {
    console.log('Client connected');
    
    // Create a new Realtime API client for this connection
    const realtimeClient = new RealtimeClient();
    const connectionId = Date.now().toString();
    
    connections.set(connectionId, {
        clientWs: ws,
        realtimeClient: realtimeClient
    });

    // Handle messages from frontend
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Received from client:', data.type);

            switch (data.type) {
                case 'connect':
                    await realtimeClient.connect();
                    
                    // Set up event forwarding from Realtime API to client
                    realtimeClient.on('message', (event) => {
                        if (ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify(event));
                        }
                    });

                    realtimeClient.on('error', (error) => {
                        if (ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify({
                                type: 'error',
                                error: error.message
                            }));
                        }
                    });

                    // Send connection success
                    ws.send(JSON.stringify({
                        type: 'connected',
                        message: 'Connected to OpenAI Realtime API'
                    }));
                    break;

                case 'audio_data':
                    realtimeClient.sendAudioData(data.audio);
                    break;

                case 'text_message':
                    realtimeClient.sendTextMessage(data.text);
                    break;

                case 'commit_audio':
                    realtimeClient.commitAudio();
                    break;

                case 'disconnect':
                    realtimeClient.disconnect();
                    break;

                default:
                    console.log('Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('Error handling client message:', error);
            ws.send(JSON.stringify({
                type: 'error',
                error: error.message
            }));
        }
    });

    // Handle client disconnect
    ws.on('close', () => {
        console.log('Client disconnected');
        const connection = connections.get(connectionId);
        if (connection) {
            connection.realtimeClient.disconnect();
            connections.delete(connectionId);
        }
    });

    // Handle WebSocket errors
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API info endpoint
app.get('/api/info', (req, res) => {
    res.json({
        service: 'OpenAI Realtime API Proxy',
        version: '1.0.0',
        endpoints: {
            websocket: `ws://localhost:${PORT}`,
            health: `/health`
        }
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`WebSocket endpoint: ws://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});