import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
  barColor?: string;
  height?: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  analyserNode,
  isPlaying,
  barColor = '#6366f1',
  height = 48,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const bufferLength = analyserNode ? analyserNode.frequencyBinCount : 32;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationId = requestAnimationFrame(render);
      const width = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, width, h);

      if (analyserNode && isPlaying) {
        analyserNode.getByteFrequencyData(dataArray);
      } else {
        // Subtle resting idle waveform
        for (let i = 0; i < dataArray.length; i++) {
          dataArray[i] = Math.sin(Date.now() * 0.003 + i * 0.2) * 8 + 12;
        }
      }

      const barCount = 32;
      const barWidth = (width / barCount) - 2;
      let x = 0;

      for (let i = 0; i < barCount; i++) {
        // Sample frequencies smoothly across the spectrum
        const sampleIndex = Math.floor((i / barCount) * (dataArray.length * 0.5));
        const val = dataArray[sampleIndex] || 10;
        const percent = val / 255;
        const barHeight = Math.max(3, percent * h * 0.95);

        // Gradient for bars
        const gradient = ctx.createLinearGradient(0, h, 0, h - barHeight);
        gradient.addColorStop(0, barColor);
        gradient.addColorStop(1, '#a855f7');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, h - barHeight, barWidth, barHeight, [2, 2, 0, 0]);
        ctx.fill();

        x += barWidth + 2;
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [analyserNode, isPlaying, barColor]);

  return (
    <canvas
      ref={canvasRef}
      width={180}
      height={height}
      className="w-full max-w-[200px] h-full opacity-80"
    />
  );
};
