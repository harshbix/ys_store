import { useEffect, useRef, useState } from 'react';

export function Hero3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setHasWebGL(false);
      return;
    }

    const handleResize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    handleResize();
    let animationTime = 0;

    const animate = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;

      // Clear canvas
      ctx.fillStyle = 'transparent';
      ctx.clearRect(0, 0, width, height);

      // Draw animated gradient background
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, 'rgba(30, 27, 75, 0.1)');
      gradient.addColorStop(1, 'rgba(15, 12, 35, 0.05)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      animationTime += 0.003;

      // Draw rotating geometric form (simplified 3D effect)
      ctx.save();
      ctx.translate(width / 2, height / 2);

      // Outer rotating wireframe
      ctx.strokeStyle = 'rgba(79, 70, 229, 0.15)';
      ctx.lineWidth = 1;
      const outerRotation = animationTime;
      drawWireframeIcosahedron(ctx, 100, outerRotation, 0.8);

      // Middle layer
      ctx.strokeStyle = 'rgba(79, 70, 229, 0.25)';
      ctx.lineWidth = 1;
      drawWireframeIcosahedron(ctx, 70, outerRotation * 1.2, 1);

      // Inner solid core
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 0.5;
      drawWireframeIcosahedron(ctx, 40, outerRotation * 0.8, 1.2);

      ctx.restore();

      animationRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', handleResize);
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-slate-950 via-slate-950 to-black">
      {hasWebGL ? (
        <canvas ref={canvasRef} className="w-full h-full" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-32 h-32 rounded-full border border-accent/20 animate-spin-slow" />
        </div>
      )}
    </div>
  );
}

function drawWireframeIcosahedron(
  ctx: CanvasRenderingContext2D,
  size: number,
  rotation: number,
  scale: number
) {
  const g = 1.618034;
  const vertices = [
    [-1, g, 0], [1, g, 0], [-1, -g, 0], [1, -g, 0],
    [0, -1, g], [0, 1, g], [0, -1, -g], [0, 1, -g],
    [g, 0, -1], [g, 0, 1], [-g, 0, -1], [-g, 0, 1]
  ].map(v => [v[0] * size * scale, v[1] * size * scale, v[2] * size * scale]);

  const rotatedVertices = vertices.map(v => rotateAxis(v as [number, number, number], rotation));
  const projectedVertices = rotatedVertices.map(v => project(v as [number, number, number]));

  const edges = [
    [0, 1], [0, 5], [0, 7], [0, 10], [0, 11],
    [1, 5], [1, 7], [1, 9], [1, 8],
    [2, 3], [2, 4], [2, 6], [2, 10], [2, 11],
    [3, 4], [3, 6], [3, 8], [3, 9],
    [4, 5], [4, 11],
    [5, 11],
    [6, 7], [6, 10],
    [7, 8],
    [8, 9],
    [9, 10],
    [9, 11]
  ];

  edges.forEach(([i, j]) => {
    const [x1, y1] = projectedVertices[i];
    const [x2, y2] = projectedVertices[j];
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  });
}

function rotateAxis(p: [number, number, number], angle: number): [number, number, number] {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const x = p[0] * cos - p[1] * sin;
  const y = p[0] * sin + p[1] * cos;
  const z = p[2];
  return [x, y, z];
}

function project(p: [number, number, number]): [number, number] {
  const scale = 500 / (500 + p[2]);
  return [p[0] * scale, p[1] * scale];
}
