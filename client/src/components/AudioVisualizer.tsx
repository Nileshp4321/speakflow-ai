import { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  analyserNode: AnalyserNode | null;
  isActive: boolean;
  barCount?: number;
  className?: string;
}

export function AudioVisualizer({
  analyserNode,
  isActive,
  barCount = 32,
  className = '',
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;

    function draw() {
      frameId = requestAnimationFrame(draw);
      const W = canvas!.width;
      const H = canvas!.height;

      ctx!.clearRect(0, 0, W, H);

      if (!analyserNode || !isActive) {
        // Idle bars
        const barW = W / barCount - 1;
        for (let i = 0; i < barCount; i++) {
          const x = i * (barW + 1);
          const h = 4;
          ctx!.fillStyle = 'rgba(99,102,241,0.3)';
          ctx!.beginPath();
          ctx!.roundRect(x, H / 2 - h / 2, barW, h, 2);
          ctx!.fill();
        }
        return;
      }

      const bufferLength = analyserNode.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserNode.getByteFrequencyData(dataArray);

      const barW = W / barCount - 1;
      const step = Math.floor(bufferLength / barCount);

      for (let i = 0; i < barCount; i++) {
        const value = dataArray[i * step] / 255;
        const h = Math.max(4, value * H);
        const x = i * (barW + 1);
        const y = (H - h) / 2;

        const gradient = ctx!.createLinearGradient(0, y, 0, y + h);
        gradient.addColorStop(0, `rgba(129,140,248,${0.4 + value * 0.6})`);
        gradient.addColorStop(1, `rgba(99,102,241,${0.8 + value * 0.2})`);

        ctx!.fillStyle = gradient;
        ctx!.beginPath();
        ctx!.roundRect(x, y, barW, h, 2);
        ctx!.fill();
      }
    }

    draw();
    animRef.current = frameId!;

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [analyserNode, isActive, barCount]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={60}
      className={`w-full ${className}`}
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
