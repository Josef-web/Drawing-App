'use client';

import { Button } from "@/components/ui/button";
import { Eraser, Pencil, Undo2, Download, Square, Triangle, ArrowRight, Paintbrush, PenTool, Brush, Zap, Circle, Diamond, MousePointer, Type } from "lucide-react";
import { memo, useCallback, useState, useEffect } from "react";

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

const BrushTypeIcon = memo(({ type }: { type: BrushType }) => {
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
});

BrushTypeIcon.displayName = 'BrushTypeIcon';

const BrushMenu = memo(({ 
  brushType, 
  showMenu, 
  onBrushTypeChange, 
  onShapeTypeChange, 
  onClose 
}: { 
  brushType: BrushType;
  showMenu: boolean;
  onBrushTypeChange: (type: BrushType) => void;
  onShapeTypeChange: (type: ShapeType) => void;
  onClose: () => void;
}) => {
  const handleBrushChange = useCallback((type: BrushType) => {
    onBrushTypeChange(type);
    onShapeTypeChange('none');
    onClose();
  }, [onBrushTypeChange, onShapeTypeChange, onClose]);

  return (
    <div className={`absolute left-0 top-[calc(100%+4px)] bg-card/80 backdrop-blur-[24px] shadow-lg rounded-lg overflow-hidden transition-all duration-200 z-50 min-w-[40px] ${
      showMenu ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'
    }`} suppressHydrationWarning>
      <div className="flex flex-col p-1 gap-1">
        {[
          { type: 'normal' as BrushType, icon: <Paintbrush className="h-4 w-4" />, label: 'Normal' },
          { type: 'rough' as BrushType, icon: <Brush className="h-4 w-4" />, label: 'Rough' },
          { type: 'sketchy' as BrushType, icon: <PenTool className="h-4 w-4" />, label: 'Sketchy' },
          { type: 'laser' as BrushType, icon: <Zap className="h-4 w-4 text-red-500 animate-pulse" />, label: 'Laser' }
        ].map(({ type, icon, label }) => (
          <Button
            key={type}
            variant={brushType === type ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => handleBrushChange(type)}
            className="flex items-center gap-2 w-full px-3 justify-start"
            suppressHydrationWarning
          >
            {icon}
            <span className="text-sm">{label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
});

BrushMenu.displayName = 'BrushMenu';

const ShapeButton = memo(({ 
  type, 
  currentType, 
  icon, 
  onShapeTypeChange, 
  disabled 
}: { 
  type: ShapeType;
  currentType: ShapeType;
  icon: React.ReactNode;
  onShapeTypeChange: (type: ShapeType) => void;
  disabled: boolean;
}) => {
  const handleClick = useCallback(() => {
    onShapeTypeChange(currentType === type ? 'none' : type);
  }, [currentType, type, onShapeTypeChange]);

  return (
    <Button
      variant={currentType === type ? 'secondary' : 'ghost'}
      size="icon"
      onClick={handleClick}
      disabled={disabled}
      suppressHydrationWarning
    >
      {icon}
    </Button>
  );
});

ShapeButton.displayName = 'ShapeButton';

const Toolbar = ({
  brushType,
  shapeType,
  onBrushTypeChange,
  onShapeTypeChange,
  onUndo,
  onDownload,
  isEraseMode,
  onToggleEraseMode,
  className,
  color,
  strokeWidth,
  onColorChange,
  onStrokeWidthChange,
}: ToolbarProps) => {
  const [showBrushMenu, setShowBrushMenu] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleBrushClick = useCallback(() => {
    onBrushTypeChange('normal');
    onShapeTypeChange('none');
    setShowBrushMenu(!showBrushMenu);
  }, [onBrushTypeChange, onShapeTypeChange, showBrushMenu]);

  if (!isMounted) {
    return <div className="flex items-center gap-2" suppressHydrationWarning />;
  }

  return (
    <div className={`${className} flex items-center gap-2`} suppressHydrationWarning>
      <ShapeButton
        type="select"
        currentType={shapeType}
        icon={<MousePointer className="h-4 w-4" />}
        onShapeTypeChange={onShapeTypeChange}
        disabled={isEraseMode}
      />
      <ShapeButton
        type="text"
        currentType={shapeType}
        icon={<Type className="h-4 w-4" />}
        onShapeTypeChange={onShapeTypeChange}
        disabled={isEraseMode}
      />
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
          onClick={handleBrushClick}
          suppressHydrationWarning
        >
          <BrushTypeIcon type={brushType} />
        </Button>
        <div className="absolute left-0 w-full h-2 bg-transparent" />
        {isMounted && (
          <BrushMenu
            brushType={brushType}
            showMenu={showBrushMenu}
            onBrushTypeChange={onBrushTypeChange}
            onShapeTypeChange={onShapeTypeChange}
            onClose={() => setShowBrushMenu(false)}
          />
        )}
      </div>
      <div className="flex gap-1">
        {[
          { type: 'square' as ShapeType, icon: <Square className="h-4 w-4" /> },
          { type: 'triangle' as ShapeType, icon: <Triangle className="h-4 w-4" /> },
          { type: 'arrow' as ShapeType, icon: <ArrowRight className="h-4 w-4" /> },
          { type: 'diamond' as ShapeType, icon: <Diamond className="h-4 w-4" /> },
          { type: 'circle' as ShapeType, icon: <Circle className="h-4 w-4" /> }
        ].map(({ type, icon }) => (
          <ShapeButton
            key={type}
            type={type}
            currentType={shapeType}
            icon={icon}
            onShapeTypeChange={onShapeTypeChange}
            disabled={isEraseMode}
          />
        ))}
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