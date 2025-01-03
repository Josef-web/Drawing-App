import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { memo, useCallback } from "react";

const MODERN_COLORS = [
  '#000000', // Black
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FF69B4', // Hot Pink
  '#4B0082', // Indigo
  '#9400D3', // Violet
  '#00CED1', // Dark Turquoise
  '#FF8C00', // Dark Orange
  '#FFB6C1', // Light Pink
  '#98FB98', // Pale Green
  '#DDA0DD', // Plum
  '#F0E68C', // Khaki
  '#E6E6FA', // Lavender
];

interface LeftToolbarProps {
  color: string;
  strokeWidth: number;
  isEraseMode: boolean;
  onColorChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
}

const ColorButton = memo(({ color, isSelected, onClick }: { 
  color: string; 
  isSelected: boolean; 
  onClick: () => void;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <div
        onClick={onClick}
        className={cn(
          "w-8 h-8 rounded-full border-2 transition-all duration-200 cursor-pointer",
          "hover:scale-110 hover:shadow-lg",
          "focus:outline-none focus:ring-2 focus:ring-primary/50",
          isSelected 
            ? "border-primary shadow-sm scale-110" 
            : "border-border/20"
        )}
        style={{
          backgroundColor: color,
          boxShadow: color === '#FFFFFF' ? '0 0 0 1px rgba(0,0,0,0.1)' : undefined
        }}
      />
    </TooltipTrigger>
    <TooltipContent>
      <p className="text-xs font-medium">{color}</p>
    </TooltipContent>
  </Tooltip>
));

ColorButton.displayName = 'ColorButton';

const CustomColorPicker = memo(({ color, onColorChange }: { 
  color: string; 
  onColorChange: (color: string) => void;
}) => (
  <div className="flex items-center gap-3 mt-2 p-2 rounded-lg bg-muted/50">
    <div className="relative group">
      <input
        type="color"
        value={color}
        onChange={(e) => onColorChange(e.target.value)}
        className="w-8 h-8 rounded-md cursor-pointer border border-border/20 transition-all duration-200 hover:scale-105"
      />
      <div className="absolute inset-0 rounded-md ring-2 ring-border/20 pointer-events-none transition-all duration-200 group-hover:ring-primary/30" />
    </div>
    <div className="flex flex-col">
      <span className="text-xs font-medium">Custom color</span>
      <span className="text-xs text-muted-foreground">{color.toUpperCase()}</span>
    </div>
  </div>
));

CustomColorPicker.displayName = 'CustomColorPicker';

const LeftToolbar = ({
  color,
  strokeWidth,
  isEraseMode,
  onColorChange,
  onStrokeWidthChange,
}: LeftToolbarProps) => {
  const showControls = !isEraseMode;

  const handleStrokeWidthChange = useCallback((value: number[]) => {
    onStrokeWidthChange(value[0]);
  }, [onStrokeWidthChange]);

  if (!showControls) return null;

  return (
    <TooltipProvider>
      <div className="fixed left-4 top-1/2 -translate-y-1/2 flex flex-col gap-8 p-6 bg-card/90 backdrop-blur-[32px] shadow-lg rounded-xl border border-border/40 z-10 min-w-[220px] transition-all duration-200 hover:shadow-xl">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold tracking-tight">Thickness</span>
            <span className="text-xs text-muted-foreground font-medium">{strokeWidth}px</span>
          </div>
          <div className="w-full px-1 py-4">
            <Slider
              value={[strokeWidth]}
              onValueChange={handleStrokeWidthChange}
              min={1}
              max={20}
              step={1}
              className="w-full"
            />
          </div>
          <div className="flex items-center gap-3 mt-1">
            <div className="h-0.5 w-8 bg-foreground/20 rounded-full" />
            <div className="h-1 w-8 bg-foreground/40 rounded-full" />
            <div className="h-1.5 w-8 bg-foreground/60 rounded-full" />
            <div className="h-2 w-8 bg-foreground/80 rounded-full" />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-sm font-semibold tracking-tight">Colors</span>
          <div className="grid grid-cols-5 gap-2">
            {MODERN_COLORS.map((baseColor) => (
              <ColorButton
                key={baseColor}
                color={baseColor}
                isSelected={color === baseColor}
                onClick={() => onColorChange(baseColor)}
              />
            ))}
          </div>
          
          <CustomColorPicker color={color} onColorChange={onColorChange} />
        </div>
      </div>
    </TooltipProvider>
  );
};

export default LeftToolbar; 