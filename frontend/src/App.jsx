import React from 'react';
import VoiceChat from './components/VoiceChat';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🎤 AI Voice Chat
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Experience real-time voice conversations with OpenAI's GPT-4o. 
            Just click the microphone and start talking!
          </p>
        </header>
        
        <main className="max-w-4xl mx-auto">
          <VoiceChat />
        </main>
        
        {/* <footer className="text-center mt-12 text-gray-500">
          <p>Powered by OpenAI Realtime API</p>
        </footer> */}
      </div>
    </div>
  );
}

export default App;