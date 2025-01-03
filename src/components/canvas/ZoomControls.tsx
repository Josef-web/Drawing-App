"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { memo } from "react";

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

const ZoomButton = memo(({ 
  icon, 
  label, 
  onClick 
}: { 
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          className="h-8 w-8"
        >
          {icon}
          <span className="sr-only">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
));

ZoomButton.displayName = 'ZoomButton';

function ZoomControlsComponent({ zoom, onZoomIn, onZoomOut }: ZoomControlsProps) {
  const zoomPercentage = Math.round(zoom * 100);

  return (
    <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-background/50 backdrop-blur-sm p-1 rounded-lg border shadow-sm">
      <ZoomButton
        icon={<Minus className="h-4 w-4" />}
        label="Zoom Out"
        onClick={onZoomOut}
      />

      <div className="min-w-[3rem] text-center text-sm">
        {zoomPercentage}%
      </div>

      <ZoomButton
        icon={<Plus className="h-4 w-4" />}
        label="Zoom In"
        onClick={onZoomIn}
      />
    </div>
  );
}

ZoomControlsComponent.displayName = 'ZoomControls';

export const ZoomControls = memo(ZoomControlsComponent); 