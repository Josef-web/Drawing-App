'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Toolbar from '@/components/toolbar/Toolbar';
import LeftToolbar from '@/components/toolbar/LeftToolbar';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import type { BrushType, ShapeType } from '@/components/toolbar/Toolbar';
import type { Stroke } from '@/components/canvas/Canvas';

interface Shape {
  type: ShapeType;
  startPoint: { x: number; y: number; pressure?: number };
  endPoint: { x: number; y: number; pressure?: number };
  color: string;
  width: number;
}

// Dynamically import Canvas with no SSR and loading placeholder
const Canvas = dynamic(() => import('@/components/canvas/Canvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-background">
      <div>Loading Canvas...</div>
    </div>
  ),
});

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [brushType, setBrushType] = useState<BrushType>('normal');
  const [shapeType, setShapeType] = useState<ShapeType>('none');
  const [isEraseMode, setIsEraseMode] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setIsMounted(true);
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight - 80,
      });
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const handleUndo = useCallback(() => {
    if (shapes.length > 0) {
      setShapes((prev) => prev.slice(0, -1));
    } else {
      setStrokes((prev) => prev.slice(0, -1));
    }
  }, [shapes.length]);

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'drawing.png';
    link.href = dataUrl;
    link.click();
  }, []);

  if (!isMounted) {
    return (
      <main className="flex min-h-screen flex-col bg-background">
        <div>Loading...</div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-background relative">
      <div className="absolute inset-0 z-0">
        <Canvas
          ref={canvasRef}
          color={color}
          strokeWidth={strokeWidth}
          brushType={brushType}
          shapeType={shapeType}
          width={dimensions.width}
          height={dimensions.height}
          isEraseMode={isEraseMode}
          strokes={strokes}
          shapes={shapes}
          onStrokesChange={setStrokes}
          onShapesChange={setShapes}
        />
      </div>
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <Toolbar
          color={color}
          strokeWidth={strokeWidth}
          brushType={brushType}
          shapeType={shapeType}
          onColorChange={setColor}
          onStrokeWidthChange={setStrokeWidth}
          onBrushTypeChange={setBrushType}
          onShapeTypeChange={setShapeType}
          onUndo={handleUndo}
          onDownload={handleDownload}
          isEraseMode={isEraseMode}
          onToggleEraseMode={() => setIsEraseMode(!isEraseMode)}
          className="inline-flex items-center gap-4 p-2 bg-card/80 backdrop-blur-sm shadow-md rounded-full border border-border"
        />
      </div>
      <LeftToolbar
        color={color}
        strokeWidth={strokeWidth}
        brushType={brushType}
        shapeType={shapeType}
        isEraseMode={isEraseMode}
        onColorChange={setColor}
        onStrokeWidthChange={setStrokeWidth}
      />
    </main>
  );
}
