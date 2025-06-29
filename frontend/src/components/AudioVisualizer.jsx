import React, { useEffect, useRef } from 'react';

const AudioVisualizer = ({ isRecording, isPlaying }) => {
    const canvasRef = useRef(null);
    const animationFrameRef = useRef(null);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        const draw = () => {
            ctx.clearRect(0, 0, width, height);
            
            if (isRecording || isPlaying) {
                // Create animated waveform
                const centerY = height / 2;
                const numBars = 20;
                const barWidth = width / numBars;
                const time = Date.now() * 0.005;
                
                ctx.fillStyle = isRecording ? '#10B981' : '#3B82F6'; // Green for recording, blue for playing
                
                for (let i = 0; i < numBars; i++) {
                    const x = i * barWidth;
                    const intensity = Math.sin(time + i * 0.5) * 0.5 + 0.5;
                    const barHeight = intensity * (height * 0.8) * (isRecording || isPlaying ? 1 : 0.1);
                    
                    ctx.fillRect(
                        x + barWidth * 0.2, 
                        centerY - barHeight / 2, 
                        barWidth * 0.6, 
                        barHeight
                    );
                }
            } else {
                // Static line when inactive
                ctx.strokeStyle = '#D1D5DB';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, height / 2);
                ctx.lineTo(width, height / 2);
                ctx.stroke();
            }
            
            animationFrameRef.current = requestAnimationFrame(draw);
        };
        
        draw();
        
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isRecording, isPlaying]);
    
    return (
        <div className="flex flex-col items-center space-y-2">
            <canvas
                ref={canvasRef}
                width={300}
                height={60}
                className="border border-gray-200 rounded-lg bg-gray-50"
            />
            <div className="flex items-center space-x-4 text-sm">
                {isRecording && (
                    <div className="flex items-center space-x-2 text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span>Recording</span>
                    </div>
                )}
                {isPlaying && (
                    <div className="flex items-center space-x-2 text-blue-600">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span>AI Speaking</span>
                    </div>
                )}
                {!isRecording && !isPlaying && (
                    <span className="text-gray-500">Ready</span>
                )}
            </div>
        </div>
    );
};

export default AudioVisualizer;