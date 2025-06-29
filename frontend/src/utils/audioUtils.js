// Audio utilities for handling audio conversion and playback

// Convert audio blob to base64 PCM16 format for OpenAI Realtime API
export const convertAudioToBase64 = async (audioBlob, audioContext) => {
    try {
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Convert to mono if stereo
        const channelData = audioBuffer.numberOfChannels > 1 
            ? audioBuffer.getChannelData(0) 
            : audioBuffer.getChannelData(0);
        
        // Resample to 24kHz if needed
        const targetSampleRate = 24000;
        const resampledData = resampleAudio(channelData, audioBuffer.sampleRate, targetSampleRate);
        
        // Convert to 16-bit PCM
        const pcm16Data = convertToPCM16(resampledData);
        
        // Convert to base64
        return arrayBufferToBase64(pcm16Data.buffer);
        
    } catch (error) {
        console.error('Error converting audio:', error);
        throw error;
    }
};

// Resample audio to target sample rate
const resampleAudio = (inputData, inputSampleRate, outputSampleRate) => {
    if (inputSampleRate === outputSampleRate) {
        return inputData;
    }
    
    const sampleRateRatio = inputSampleRate / outputSampleRate;
    const outputLength = Math.round(inputData.length / sampleRateRatio);
    const output = new Float32Array(outputLength);
    
    for (let i = 0; i < outputLength; i++) {
        const inputIndex = i * sampleRateRatio;
        const inputIndexFloor = Math.floor(inputIndex);
        const inputIndexCeil = Math.min(inputIndexFloor + 1, inputData.length - 1);
        const fraction = inputIndex - inputIndexFloor;
        
        output[i] = inputData[inputIndexFloor] * (1 - fraction) + 
                   inputData[inputIndexCeil] * fraction;
    }
    
    return output;
};

// Convert float32 audio data to 16-bit PCM
const convertToPCM16 = (float32Array) => {
    const pcm16Array = new Int16Array(float32Array.length);
    
    for (let i = 0; i < float32Array.length; i++) {
        // Clamp to [-1, 1] range
        const clamped = Math.max(-1, Math.min(1, float32Array[i]));
        // Convert to 16-bit integer
        pcm16Array[i] = Math.round(clamped * 32767);
    }
    
    return pcm16Array;
};

// Convert ArrayBuffer to base64 string
const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
};

// Convert base64 to ArrayBuffer
const base64ToArrayBuffer = (base64) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
};

// Play audio from base64 PCM16 data
export const playAudioFromBase64 = async (base64Audio) => {
    try {
        // Create audio context if not exists
        if (!window.audioContext) {
            window.audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: 24000
            });
        }
        
        const audioContext = window.audioContext;
        
        // Resume audio context if suspended (required by some browsers)
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }
        
        // Convert base64 to audio buffer
        const arrayBuffer = base64ToArrayBuffer(base64Audio);
        const pcm16Data = new Int16Array(arrayBuffer);
        
        // Create audio buffer
        const audioBuffer = audioContext.createBuffer(1, pcm16Data.length, 24000);
        const channelData = audioBuffer.getChannelData(0);
        
        // Convert 16-bit PCM to float32
        for (let i = 0; i < pcm16Data.length; i++) {
            channelData[i] = pcm16Data[i] / 32768;
        }
        
        // Create and connect audio nodes
        const source = audioContext.createBufferSource();
        const gainNode = audioContext.createGain();
        
        source.buffer = audioBuffer;
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Set volume
        gainNode.gain.value = 0.8;
        
        // Play audio
        source.start();
        
        return new Promise((resolve) => {
            source.onended = resolve;
        });
        
    } catch (error) {
        console.error('Error playing audio:', error);
        throw error;
    }
};

// Initialize audio context (call this on user interaction)
export const initializeAudioContext = async () => {
    try {
        if (!window.audioContext) {
            window.audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: 24000
            });
        }
        
        if (window.audioContext.state === 'suspended') {
            await window.audioContext.resume();
        }
        
        return window.audioContext;
    } catch (error) {
        console.error('Error initializing audio context:', error);
        throw error;
    }
};

// Get user media with optimal settings
export const getUserMedia = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                sampleRate: 24000,
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });
        
        return stream;
    } catch (error) {
        console.error('Error accessing microphone:', error);
        throw new Error('Microphone access denied. Please enable microphone permissions.');
    }
};

// Check if audio is supported
export const isAudioSupported = () => {
    return !!(navigator.mediaDevices && 
              navigator.mediaDevices.getUserMedia && 
              (window.AudioContext || window.webkitAudioContext));
};

// Get audio devices
export const getAudioDevices = async () => {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.filter(device => device.kind === 'audioinput');
    } catch (error) {
        console.error('Error enumerating devices:', error);
        return [];
    }
};