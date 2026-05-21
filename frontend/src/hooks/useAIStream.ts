import { useEffect, useRef } from 'react';

export function useAIStream(
  videoRef: React.RefObject<HTMLVideoElement>,
  socket: any,
  classId: string,
  userName: string,
  isEnabled: boolean
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isEnabled || !socket || !classId) return;

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }

    const captureFrame = () => {
      if (videoRef.current && canvasRef.current && videoRef.current.readyState === 4) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = 320; // Lower resolution for processing
        canvas.height = 240;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const frame = canvas.toDataURL('image/jpeg', 0.5);

          // In a real production app, we would process this frame via a worker or send to AI service
          // For this simulation, we'll assume the AI logic happens and periodically sends random alerts
          // to demonstrate the Socket.IO flow if something is detected.

          if (Math.random() < 0.05) { // 5% chance every 3 seconds to send a mock alert
            const alertTypes = ['distraction', 'phone', 'absent'];
            const randomType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
            socket.emit('distraction_alert', {
              room: classId,
              name: userName,
              type: randomType,
              message: `Detected: ${randomType}`
            });
          }
        }
      }
    };

    const interval = setInterval(captureFrame, 3000); // Process every 3 seconds
    return () => clearInterval(interval);
  }, [isEnabled, socket, classId, userName, videoRef]);
}
