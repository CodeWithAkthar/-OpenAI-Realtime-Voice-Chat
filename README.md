# 🎤 OpenAI Realtime Voice Chat

A real-time voice chat application built with OpenAI's Realtime API, featuring low-latency speech-to-speech conversations with AI. Built with Node.js backend and React frontend.


## 🚀 Demo

![Voice Chat Demo](https://via.placeholder.com/800x400/4299e1/ffffff?text=Voice+Chat+Demo)

> **Live Demo**: [Will add soon..]
()
## ✨ Features

### 🎯 Core Features
- **Real-time Voice Chat**: Low-latency speech-to-speech conversations with GPT-4o
- **Text Messaging**: Fallback text input when voice isn't available
- **Audio Visualization**: Real-time visual feedback during recording and playback
- **Connection Management**: Automatic reconnection and robust error handling
- **Function Calling**: Extensible tool system for AI to perform actions

### 🎛️ Voice Quality Controls
- **6 AI Voices**: Choose from Alloy, Echo, Fable, Onyx, Nova, and Shimmer
- **Playback Speed**: Adjustable from 0.5x to 1.5x for optimal clarity
- **Volume Control**: Fine-tune audio output levels
- **Response Length**: Control AI response duration (Short/Medium/Long)
- **Quick Presets**: One-click optimization for different use cases

### 🛠️ Technical Features
- **WebSocket Communication**: Real-time bidirectional communication
- **Audio Processing**: PCM16 format conversion and noise reduction
- **Responsive Design**: Works on desktop and mobile devices
- **Error Recovery**: Graceful handling of network issues
- **Modern UI**: Clean interface built with Tailwind CSS

## 🏗️ Architecture

```
┌─────────────────┐    WebSocket    ┌─────────────────┐    WebSocket    ┌─────────────────┐
│                 │ ───────────────► │                 │ ───────────────► │                 │
│  React Frontend │                 │  Node.js Server │                 │   OpenAI API    │
│                 │ ◄─────────────── │                 │ ◄─────────────── │                 │
└─────────────────┘                 └─────────────────┘                 └─────────────────┘
        │                                   │
        │                                   │
   Web Audio API                      Express + WS Server
   - Microphone                       - Connection Proxy
   - Audio Processing                 - Function Calling
   - Real-time Playback              - Error Handling
```

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** (v16.0.0 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** package manager
- **OpenAI API Key** with Realtime API access - [Get one here](https://platform.openai.com/api-keys)
- **Modern browser** with Web Audio API support
- **Microphone access** for voice input

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/CodeWithAkthar/-OpenAI-Realtime-Voice-Chat.git
cd openai-realtime-voice-chat
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Add your OpenAI API key to .env
echo "OPENAI_API_KEY=your_api_key_here" >> .env
echo "PORT=3001" >> .env
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 4. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend Health**: http://localhost:3001/health

## 📁 Project Structure

```
openai-realtime-voice-chat/
├── 📁 backend/
│   ├── 📄 server.js              # Express server with WebSocket
│   ├── 📄 realtime-client.js     # OpenAI Realtime API client
│   ├── 📄 package.json           # Backend dependencies
│   ├── 📄 .env.example           # Environment template
│   └── 📄 .env                   # Environment variables (create this)
├── 📁 frontend/
│   ├── 📁 src/
│   │   ├── 📄 App.jsx             # Main React component
│   │   ├── 📄 main.jsx            # React entry point
│   │   ├── 📁 components/
│   │   │   ├── 📄 VoiceChat.jsx   # Main chat interface
│   │   │   ├── 📄 AudioVisualizer.jsx # Audio visualization
│   │   │   └── 📄 VoiceControls.jsx   # Voice quality controls
│   │   └── 📁 utils/
│   │       └── 📄 audioUtils.js   # Audio processing utilities
│   ├── 📄 package.json           # Frontend dependencies
│   ├── 📄 vite.config.js         # Vite configuration
│   ├── 📄 tailwind.config.js     # Tailwind CSS config
│   └── 📄 index.html             # HTML template
├── 📄 README.md                  # This file
├── 📄 LICENSE                    # MIT License
└── 📄 .gitignore                 # Git ignore rules
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Required
OPENAI_API_KEY=your_openai_api_key_here

# Optional
PORT=3001
NODE_ENV=development

# Voice Settings (optional)
DEFAULT_VOICE=alloy
DEFAULT_TEMPERATURE=0.7
MAX_RESPONSE_TOKENS=1500
```

### Voice Configuration

The AI supports 6 different voices:

| Voice | Description | Best For |
|-------|-------------|----------|
| `alloy` | Neutral, clear | General conversations |
| `echo` | Male, deeper | Professional tone |
| `fable` | Expressive | Storytelling |
| `onyx` | Deep, rich | Authoritative responses |
| `nova` | Female, bright | Friendly conversations |
| `shimmer` | Soft, warm | Casual chat |

### Audio Quality Settings

Optimize for your use case:

```javascript
// For maximum clarity (slower)
{
  playbackSpeed: 0.85,
  voice: "alloy",
  responseLength: "medium",
  volume: 0.8
}

// For natural conversation
{
  playbackSpeed: 1.0,
  voice: "nova",
  responseLength: "medium",
  volume: 0.7
}

// For quick responses
{
  playbackSpeed: 1.1,
  voice: "echo",
  responseLength: "short",
  volume: 0.6
}
```

## 🛠️ Development

### Available Scripts

**Backend:**
```bash
npm start          # Start production server
npm run dev        # Start with nodemon (auto-restart)
npm test           # Run tests (when available)
```

**Frontend:**
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

### Adding Custom Functions

Extend the AI's capabilities by adding custom functions:

```javascript
// In realtime-client.js
tools: [
  {
    type: "function",
    name: "get_weather",
    description: "Get current weather for a location",
    parameters: {
      type: "object",
      properties: {
        location: { type: "string", description: "City name" }
      },
      required: ["location"]
    }
  }
]

// Implement the function
handleFunctionCall(event) {
  switch (event.name) {
    case 'get_weather':
      return await this.getWeather(JSON.parse(event.arguments).location);
  }
}
```

### Customizing AI Behavior

Modify the system instructions in `realtime-client.js`:

```javascript
instructions: `You are a helpful AI assistant with the following characteristics:
- Speak clearly and at a moderate pace
- Use natural conversational language
- Keep responses concise but informative
- Ask follow-up questions when appropriate
- Be friendly and engaging

Guidelines for voice responses:
- Speak slowly enough to be understood
- Use natural pauses between thoughts
- Avoid technical jargon unless requested
- Keep responses under 30 seconds when possible`
```

## 🔧 Troubleshooting

### Common Issues

**❌ "API key not found" Error**
```bash
# Solution: Check your .env file
cd backend
cat .env  # Should show OPENAI_API_KEY=your_key_here

# Restart the server after adding the key
npm start
```

**❌ Audio Too Fast/Unclear**
```javascript
// Try these settings in VoiceControls:
playbackSpeed: 0.85,  // Slower speech
voice: "alloy",       // Clearest voice
volume: 0.8,          // Higher volume
responseLength: "medium"  // Natural length
```

**❌ Microphone Not Working**
- Check browser permissions (🔒 icon in address bar)
- Try HTTPS in production (required for microphone access)
- Test with different browsers
- Ensure microphone isn't muted

**❌ Connection Issues**
```bash
# Check if backend is running
curl http://localhost:3001/health

# Check WebSocket connection in browser console
# Should see: "Connected to server" and "Connected to OpenAI"
```

**❌ High API Costs**
The Realtime API is more expensive than regular OpenAI APIs:
- Monitor usage at [OpenAI Usage Dashboard](https://platform.openai.com/usage)
- Use shorter response lengths
- Implement usage limits in production
- Consider rate limiting

### Debug Mode

Enable detailed logging:

```javascript
// Backend - Add to server.js
const DEBUG = process.env.NODE_ENV === 'development';
if (DEBUG) {
  console.log('Debug mode enabled');
  // Add detailed logging
}

// Frontend - Browser console
localStorage.setItem('debug', 'true');
// Refresh page to see detailed logs
```

### Performance Optimization

**Backend Optimizations:**
```javascript
// Add connection pooling
const connectionPool = new Map();
const maxConnections = 100;

// Implement rate limiting
const rateLimit = require('express-rate-limit');
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // requests per window
}));
```

**Frontend Optimizations:**
```javascript
// Lazy load components
const VoiceControls = React.lazy(() => import('./VoiceControls'));

// Optimize audio processing
const processAudio = useMemo(() => 
  debounce(convertAudioToBase64, 100), []);
```

## 🚀 Deployment

### Environment Setup

**Production Environment Variables:**
```env
NODE_ENV=production
OPENAI_API_KEY=your_production_key
PORT=3001
MAX_CONNECTIONS=1000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

### Docker Deployment

**Backend Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]
```

**Docker Compose:**
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - NODE_ENV=production
    restart: unless-stopped
  
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
```

### Cloud Deployment Options

| Platform | Backend | Frontend | Difficulty |
|----------|---------|----------|------------|
| **Heroku** | ✅ Node.js app | ✅ Static site | Easy |
| **Vercel** | ✅ Serverless | ✅ Auto-deploy | Easy |
| **Railway** | ✅ Container | ✅ Static | Easy |
| **AWS** | ✅ ECS/Lambda | ✅ S3+CloudFront | Medium |
| **DigitalOcean** | ✅ App Platform | ✅ Static | Medium |

### Production Checklist

- [ ] Environment variables configured
- [ ] API keys secured (not in frontend code)
- [ ] Rate limiting implemented
- [ ] Error logging setup (Winston, Sentry)
- [ ] Health checks configured
- [ ] SSL certificates installed
- [ ] Domain and DNS configured
- [ ] Monitoring alerts setup
- [ ] Backup strategy implemented
- [ ] Load testing completed

## 📊 Monitoring & Analytics

### Health Monitoring

```javascript
// Add to server.js
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    connections: activeConnections,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});
```

### Usage Analytics

```javascript
// Track important events
const analytics = {
  sessionsStarted: 0,
  messagesProcessed: 0,
  averageSessionDuration: 0,
  errorRate: 0
};

// Export metrics
app.get('/metrics', (req, res) => {
  res.json(analytics);
});
```

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Setup

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Install dependencies**: `npm install` in both directories
4. **Make your changes**
5. **Test thoroughly**
6. **Commit changes**: `git commit -m 'Add amazing feature'`
7. **Push to branch**: `git push origin feature/amazing-feature`
8. **Open a Pull Request**

### Contribution Guidelines

- **Code Style**: Follow existing patterns, use ESLint
- **Testing**: Add tests for new features
- **Documentation**: Update README for significant changes
- **Performance**: Ensure changes don't impact performance
- **Security**: Follow security best practices

### Types of Contributions

- 🐛 **Bug fixes**
- ✨ **New features**
- 📚 **Documentation improvements**
- 🎨 **UI/UX enhancements**
- ⚡ **Performance optimizations**
- 🔒 **Security improvements**

## 📝 API Reference

### WebSocket Events

**Client → Server:**
```javascript
// Connect to OpenAI
{ type: 'connect' }

// Send audio data
{ type: 'audio_data', audio: 'base64_string' }

// Send text message
{ type: 'text_message', text: 'Hello AI' }

// Change voice
{ type: 'change_voice', voice: 'alloy' }

// Update settings
{ type: 'update_response_settings', settings: {...} }
```

**Server → Client:**
```javascript
// Connection established
{ type: 'connected', message: 'Connected to OpenAI' }

// Audio response
{ type: 'response.audio.delta', delta: 'base64_audio' }

// Text response
{ type: 'response.text.delta', delta: 'Hello!' }

// Error occurred
{ type: 'error', error: 'Error message' }
```

### HTTP Endpoints

```
GET  /health              # Health check
GET  /api/info           # API information
GET  /metrics            # Usage metrics (if enabled)
```

## 📚 Resources

### Documentation
- [OpenAI Realtime API Docs](https://platform.openai.com/docs/guides/realtime)
- [Web Audio API Reference](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [WebSocket API Guide](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)

### Tutorials
- [Building Real-time Apps](https://web.dev/websockets/)
- [Audio Processing in JavaScript](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_Web_Audio_API)
- [React Performance Tips](https://react.dev/learn/render-and-commit)


MIT License

Copyright (c) 2024 Shuhaib Akthar 

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🙏 Acknowledgments

- **OpenAI** for the amazing Realtime API
- **React Team** for the excellent frontend framework
- **Node.js Community** for the robust backend ecosystem
- **Tailwind CSS** for the beautiful styling system
- **Contributors** who helped improve this project

## 📞 Support

### Getting Help

1. **Check the documentation** above
2. **Search existing issues** on GitHub
3. **Create a new issue** with detailed information
4. **Join community discussions** in the Issues tab

### Issue Template

When reporting bugs, please include:

```markdown
**Bug Description**: Clear description of the issue

**Steps to Reproduce**:
1. Step one
2. Step two
3. Step three

**Expected Behavior**: What should happen

**Actual Behavior**: What actually happens

**Environment**:
- OS: [Windows/Mac/Linux]
- Browser: [Chrome/Firefox/Safari]
- Node.js version: [16.x.x]
- Project version: [1.x.x]

**Console Logs**: Any error messages
```

---

## 🌟 Star History

If this project helped you, please give it a ⭐ on GitHub!



---

**Built with ❤️ by Shuhaib Akthar

*Happy coding! 🚀*