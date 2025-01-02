'use client';

import { Button } from "@/components/ui/button";
import { Eraser, Pencil, Undo2, Download, Square, Triangle, ArrowRight, Paintbrush, PenTool, Brush, Zap, Circle, Diamond, MousePointer, Type } from "lucide-react";
import { useState, useEffect } from "react";

export type BrushType = 'normal' | 'rough' | 'sketchy' | 'laser';
export type ShapeType = 'none' | 'square' | 'triangle' | 'arrow' | 'diamond' | 'circle' | 'select' | 'text';

interface ToolbarProps {
  color: string;
  strokeWidth: number;
  brushType: BrushType;
  shapeType: ShapeType;
  onColorChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
  onBrushTypeChange: (type: BrushType) => void;
  onShapeTypeChange: (type: ShapeType) => void;
  onUndo: () => void;
  onDownload: () => void;
  isEraseMode: boolean;
  onToggleEraseMode: () => void;
  className?: string;
}

const BrushTypeIcon = ({ type }: { type: BrushType }) => {
  switch (type) {
    case 'normal':
      return <Paintbrush className="h-4 w-4" />;
    case 'rough':
      return <Brush className="h-4 w-4" />;
    case 'sketchy':
      return <PenTool className="h-4 w-4" />;
    case 'laser':
      return <Zap className="h-4 w-4 text-red-500 animate-pulse" />;
  }
};

const Toolbar = ({
  brushType,
  shapeType,
  onBrushTypeChange,
  onShapeTypeChange,
  onUndo,
  onDownload,
  isEraseMode,
  onToggleEraseMode,
  className
}: ToolbarProps) => {
  const [showBrushMenu, setShowBrushMenu] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="flex items-center gap-2" suppressHydrationWarning />;
  }

  return (
    <div className={`${className} flex items-center gap-2`} suppressHydrationWarning>
      <Button
        variant={shapeType === 'select' ? 'secondary' : 'ghost'}
        size="icon"
        onClick={() => {
          if (shapeType === 'select') {
            onShapeTypeChange('none');
          } else {
            onShapeTypeChange('select');
          }
        }}
        disabled={isEraseMode}
        suppressHydrationWarning
      >
        <MousePointer className="h-4 w-4" />
      </Button>
      <Button
        variant={shapeType === 'text' ? 'secondary' : 'ghost'}
        size="icon"
        onClick={() => {
          if (shapeType === 'text') {
            onShapeTypeChange('none');
          } else {
            onShapeTypeChange('text');
          }
        }}
        disabled={isEraseMode}
        suppressHydrationWarning
      >
        <Type className="h-4 w-4" />
      </Button>
      <div 
        className="relative"
        onMouseEnter={() => setShowBrushMenu(true)}
        onMouseLeave={() => setShowBrushMenu(false)}
      >
        <Button
          variant="ghost"
          size="icon"
          className={`relative ${shapeType === 'none' ? (brushType !== 'normal' ? 'bg-secondary' : '') : ''}`}
          disabled={isEraseMode}
          onClick={() => {
            onBrushTypeChange('normal');
            onShapeTypeChange('none');
            setShowBrushMenu(!showBrushMenu);
          }}
          suppressHydrationWarning
        >
          <BrushTypeIcon type={brushType} />
        </Button>
        <div className="absolute left-0 w-full h-2 bg-transparent" />
        {isMounted && (
          <div className={`absolute left-0 top-[calc(100%+4px)] bg-card/80 backdrop-blur-[24px] shadow-lg rounded-lg overflow-hidden transition-all duration-200 z-50 min-w-[40px] ${
            showBrushMenu ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'
          }`} suppressHydrationWarning>
            <div className="flex flex-col p-1 gap-1">
              <Button
                variant={brushType === 'normal' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => {
                  onBrushTypeChange('normal');
                  onShapeTypeChange('none');
                  setShowBrushMenu(false);
                }}
                className="flex items-center gap-2 w-full px-3 justify-start"
                suppressHydrationWarning
              >
                <Paintbrush className="h-4 w-4" />
                <span className="text-sm">Normal</span>
              </Button>
              <Button
                variant={brushType === 'rough' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => {
                  onBrushTypeChange('rough');
                  onShapeTypeChange('none');
                  setShowBrushMenu(false);
                }}
                className="flex items-center gap-2 w-full px-3 justify-start"
                suppressHydrationWarning
              >
                <Brush className="h-4 w-4" />
                <span className="text-sm">Rough</span>
              </Button>
              <Button
                variant={brushType === 'sketchy' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => {
                  onBrushTypeChange('sketchy');
                  onShapeTypeChange('none');
                  setShowBrushMenu(false);
                }}
                className="flex items-center gap-2 w-full px-3 justify-start"
                suppressHydrationWarning
              >
                <PenTool className="h-4 w-4" />
                <span className="text-sm">Sketchy</span>
              </Button>
              <Button
                variant={brushType === 'laser' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => {
                  onBrushTypeChange('laser');
                  onShapeTypeChange('none');
                  setShowBrushMenu(false);
                }}
                className="flex items-center gap-2 w-full px-3 justify-start"
                suppressHydrationWarning
              >
                <Zap className="h-4 w-4 text-red-500 animate-pulse" />
                <span className="text-sm">Laser</span>
              </Button>
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-1">
        <Button
          variant={shapeType === 'square' ? 'secondary' : 'ghost'}
          size="icon"
          onClick={() => {
            if (shapeType === 'square') {
              onShapeTypeChange('none');
            } else {
              onShapeTypeChange('square');
            }
          }}
          disabled={isEraseMode}
          suppressHydrationWarning
        >
          <Square className="h-4 w-4" />
        </Button>
        <Button
          variant={shapeType === 'triangle' ? 'secondary' : 'ghost'}
          size="icon"
          onClick={() => {
            if (shapeType === 'triangle') {
              onShapeTypeChange('none');
            } else {
              onShapeTypeChange('triangle');
            }
          }}
          disabled={isEraseMode}
          suppressHydrationWarning
        >
          <Triangle className="h-4 w-4" />
        </Button>
        <Button
          variant={shapeType === 'arrow' ? 'secondary' : 'ghost'}
          size="icon"
          onClick={() => {
            if (shapeType === 'arrow') {
              onShapeTypeChange('none');
            } else {
              onShapeTypeChange('arrow');
            }
          }}
          disabled={isEraseMode}
          suppressHydrationWarning
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button
          variant={shapeType === 'diamond' ? 'secondary' : 'ghost'}
          size="icon"
          onClick={() => {
            if (shapeType === 'diamond') {
              onShapeTypeChange('none');
            } else {
              onShapeTypeChange('diamond');
            }
          }}
          disabled={isEraseMode}
          suppressHydrationWarning
        >
          <Diamond className="h-4 w-4" />
        </Button>
        <Button
          variant={shapeType === 'circle' ? 'secondary' : 'ghost'}
          size="icon"
          onClick={() => {
            if (shapeType === 'circle') {
              onShapeTypeChange('none');
            } else {
              onShapeTypeChange('circle');
            }
          }}
          disabled={isEraseMode}
          suppressHydrationWarning
        >
          <Circle className="h-4 w-4" />
        </Button>
      </div>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onToggleEraseMode}
        data-state={isEraseMode ? "active" : "inactive"}
        className={isEraseMode ? "bg-secondary" : ""}
        suppressHydrationWarning
      >
        {isEraseMode ? <Pencil className="h-4 w-4" /> : <Eraser className="h-4 w-4" />}
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onUndo}
        suppressHydrationWarning
      >
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onDownload}
        suppressHydrationWarning
      >
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default Toolbar; 