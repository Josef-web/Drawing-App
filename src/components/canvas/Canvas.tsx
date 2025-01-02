'use client';

import { useCallback, useEffect, useRef, useState, forwardRef } from 'react';
import { getStroke } from 'perfect-freehand';
import type { BrushType, ShapeType } from '../toolbar/Toolbar';
import { ZoomControls } from './ZoomControls';

interface Point {
  x: number;
  y: number;
  pressure?: number;
}

interface TextInput {
  x: number;
  y: number;
  isActive: boolean;
}

interface Shape {
  type: ShapeType;
  startPoint: Point;
  endPoint: Point;
  color: string;
  width: number;
  id?: string;
  text?: string;
}

export interface Stroke {
  points: Point[];
  color: string;
  width: number;
  brushType: BrushType;
  id?: string;
}

interface CanvasProps {
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  brushType?: BrushType;
  shapeType?: ShapeType;
  isEraseMode?: boolean;
  strokes?: Stroke[];
  shapes?: Shape[];
  onStrokesChange?: (strokes: Stroke[]) => void;
  onShapesChange?: (shapes: Shape[]) => void;
}

const getBrushOptions = (brushType: BrushType, width: number) => {
  switch (brushType) {
    case 'rough':
      return {
        thinning: 0.6,
        smoothing: 0.4,
        streamline: 0.6,
        easing: (t: number) => Math.pow(t, 1.5),
        simulatePressure: true,
        size: width * 3,
      };
    case 'sketchy':
      return {
        thinning: 0.5,
        smoothing: 0.5,
        streamline: 0.5,
        easing: (t: number) => Math.pow(t, 2),
        simulatePressure: true,
        size: width * 4,
      };
    case 'laser':
      return {
        thinning: 0.8,
        smoothing: 0.6,
        streamline: 0.6,
        easing: (t: number) => Math.pow(t, 1.1),
        simulatePressure: true,
        size: width * 2,
      };
    default:
      return {
        thinning: 0.4,
        smoothing: 0.5,
        streamline: 0.5,
        easing: (t: number) => Math.pow(t, 1.3),
        simulatePressure: true,
        size: width * 5,
      };
  }
};

const drawShape = (ctx: CanvasRenderingContext2D, shape: Shape) => {
  const { type, startPoint, endPoint, color, width, text } = shape;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();

  switch (type) {
    case 'square':
      const width_ = endPoint.x - startPoint.x;
      const height = endPoint.y - startPoint.y;
      ctx.strokeRect(startPoint.x, startPoint.y, width_, height);
      break;
    case 'triangle':
      ctx.moveTo(startPoint.x + (endPoint.x - startPoint.x) / 2, startPoint.y);
      ctx.lineTo(endPoint.x, endPoint.y);
      ctx.lineTo(startPoint.x, endPoint.y);
      ctx.closePath();
      ctx.stroke();
      break;
    case 'arrow':
      const angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);
      const headLength = 20;
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(endPoint.x, endPoint.y);
      ctx.lineTo(
        endPoint.x - headLength * Math.cos(angle - Math.PI / 6),
        endPoint.y - headLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(endPoint.x, endPoint.y);
      ctx.lineTo(
        endPoint.x - headLength * Math.cos(angle + Math.PI / 6),
        endPoint.y - headLength * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();
      break;
    case 'diamond':
      const centerX = (startPoint.x + endPoint.x) / 2;
      const centerY = (startPoint.y + endPoint.y) / 2;
      const diamondWidth = Math.abs(endPoint.x - startPoint.x);
      const diamondHeight = Math.abs(endPoint.y - startPoint.y);
      
      ctx.moveTo(centerX, startPoint.y);
      ctx.lineTo(endPoint.x, centerY);
      ctx.lineTo(centerX, endPoint.y);
      ctx.lineTo(startPoint.x, centerY);
      ctx.closePath();
      ctx.stroke();
      break;
    case 'circle':
      const radiusX = Math.abs(endPoint.x - startPoint.x) / 2;
      const radiusY = Math.abs(endPoint.y - startPoint.y) / 2;
      const centerX_ = (startPoint.x + endPoint.x) / 2;
      const centerY_ = (startPoint.y + endPoint.y) / 2;
      
      ctx.ellipse(centerX_, centerY_, radiusX, radiusY, 0, 0, 2 * Math.PI);
      ctx.stroke();
      break;
    case 'text':
      if (text) {
        const fontSize = width * 10;
        ctx.font = `${fontSize}px Arial`;
        // Calculate text dimensions
        const metrics = ctx.measureText(text);
        const textWidth = metrics.width;
        const textHeight = fontSize;
        
        // If the shape has been resized, scale the text
        if (endPoint.x !== startPoint.x || endPoint.y !== startPoint.y) {
          const scaleX = Math.abs(endPoint.x - startPoint.x) / textWidth;
          const scaleY = Math.abs(endPoint.y - startPoint.y) / textHeight;
          
          // Calculate the center position of the bounding box
          const centerX = (startPoint.x + endPoint.x) / 2;
          const centerY = (startPoint.y + (endPoint.y - textHeight / 2)) / 2;
          
          ctx.save();
          // Translate to the center of the bounding box
          ctx.translate(centerX, centerY);
          ctx.scale(scaleX || 1, scaleY || 1);
          // Draw text centered around the point
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, 0, 0);
          ctx.restore();
        } else {
          ctx.fillText(text, startPoint.x, startPoint.y);
        }
      }
      break;
  }
};

const Canvas = forwardRef<HTMLCanvasElement, CanvasProps>(({
  width = 800,
  height = 600,
  color = '#000000',
  strokeWidth = 3,
  brushType = 'normal',
  shapeType = 'none',
  isEraseMode = false,
  strokes = [],
  shapes = [],
  onStrokesChange,
  onShapesChange,
}, ref) => {
  const internalCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);
  const [textInput, setTextInput] = useState<TextInput | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  
  // Selection states
  const [selectedElement, setSelectedElement] = useState<{ type: 'stroke' | 'shape', id: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [resizeHandle, setResizeHandle] = useState<'nw' | 'ne' | 'sw' | 'se' | null>(null);
  const [hoverHandle, setHoverHandle] = useState<'nw' | 'ne' | 'sw' | 'se' | null>(null);

  useEffect(() => {
    setIsReady(true);
    // Center the canvas initially
    if (containerRef.current) {
      const { width: containerWidth, height: containerHeight } = containerRef.current.getBoundingClientRect();
      setPan({
        x: (containerWidth - width) / 2,
        y: (containerHeight - height) / 2
      });
    }
  }, [width, height]);

  const getCanvas = useCallback(() => {
    if (typeof ref === 'function') return internalCanvasRef.current;
    return ref?.current || internalCanvasRef.current;
  }, [ref]);

  // Add zoom handlers
  const handleZoomIn = useCallback(() => {
    setZoom(prev => {
      const newZoom = Math.min(prev + 0.1, 3);
      // Adjust pan to keep the center point fixed
      if (containerRef.current) {
        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        setPan(prevPan => ({
          x: centerX - (centerX - prevPan.x) * (newZoom / prev),
          y: centerY - (centerY - prevPan.y) * (newZoom / prev)
        }));
      }
      return newZoom;
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => {
      const newZoom = Math.max(prev - 0.1, 0.1);
      // Adjust pan to keep the center point fixed
      if (containerRef.current) {
        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        setPan(prevPan => ({
          x: centerX - (centerX - prevPan.x) * (newZoom / prev),
          y: centerY - (centerY - prevPan.y) * (newZoom / prev)
        }));
      }
      return newZoom;
    });
  }, []);

  // Modify pointer event handlers to account for zoom and pan
  const getPointerPosition = useCallback((e: React.PointerEvent) => {
    const canvas = getCanvas();
    if (!canvas || !containerRef.current) return { x: 0, y: 0, pressure: 0 };

    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;
    
    return { x, y, pressure: e.pressure };
  }, [getCanvas, zoom, pan]);

  // Add pan functionality
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey) {
      // Zoom with ctrl + wheel
      e.preventDefault();
      const delta = -e.deltaY;
      const zoomFactor = 0.1;
      const newZoom = Math.max(0.1, Math.min(3, zoom + (delta > 0 ? zoomFactor : -zoomFactor)));
      
      // Calculate zoom center point
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Adjust pan to keep the mouse position fixed
        setPan(prevPan => ({
          x: mouseX - (mouseX - prevPan.x) * (newZoom / zoom),
          y: mouseY - (mouseY - prevPan.y) * (newZoom / zoom)
        }));
      }
      
      setZoom(newZoom);
    } else {
      // Pan with wheel
      setPan(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }
  }, [zoom]);

  // Add space + drag panning
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState<Point | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space') {
      e.preventDefault();
      setIsPanning(true);
    }
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space') {
      setIsPanning(false);
      setLastPanPoint(null);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const drawSelectionBox = useCallback((ctx: CanvasRenderingContext2D, element: Shape | Stroke) => {
    if (!selectedElement) return;

    let bounds: { x: number, y: number, width: number, height: number };
    
    if ('points' in element) {
      // For strokes, calculate bounds from points
      const xs = element.points.map(p => p.x);
      const ys = element.points.map(p => p.y);
      bounds = {
        x: Math.min(...xs),
        y: Math.min(...ys),
        width: Math.max(...xs) - Math.min(...xs),
        height: Math.max(...ys) - Math.min(...ys)
      };
    } else {
      // For shapes, calculate bounds from start and end points
      if (element.type === 'text' && element.text) {
        const fontSize = element.width * 10;
        ctx.font = `${fontSize}px Arial`;
        const metrics = ctx.measureText(element.text);
        const textWidth = metrics.width;
        const textHeight = fontSize;

        if (element.endPoint.x !== element.startPoint.x || element.endPoint.y !== element.startPoint.y) {
          bounds = {
            x: element.startPoint.x,
            y: element.startPoint.y - textHeight,
            width: element.endPoint.x - element.startPoint.x,
            height: element.endPoint.y - (element.startPoint.y - textHeight)
          };
        } else {
          bounds = {
            x: element.startPoint.x,
            y: element.startPoint.y - textHeight,
            width: textWidth,
            height: textHeight
          };
        }
      } else {
        bounds = {
          x: Math.min(element.startPoint.x, element.endPoint.x),
          y: Math.min(element.startPoint.y, element.endPoint.y),
          width: Math.abs(element.endPoint.x - element.startPoint.x),
          height: Math.abs(element.endPoint.y - element.startPoint.y)
        };
      }
    }

    const padding = 8;
    
    // Draw selection rectangle
    ctx.strokeStyle = '#00A0FF';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(
      bounds.x - padding,
      bounds.y - padding,
      bounds.width + padding * 2,
      bounds.height + padding * 2
    );
    ctx.setLineDash([]);

    // Draw resize handles with larger size and different colors for better visibility
    const handleSize = 12;
    const handles = [
      { x: bounds.x - padding, y: bounds.y - padding, cursor: 'nw-resize' }, // NW
      { x: bounds.x + bounds.width + padding, y: bounds.y - padding, cursor: 'ne-resize' }, // NE
      { x: bounds.x - padding, y: bounds.y + bounds.height + padding, cursor: 'sw-resize' }, // SW
      { x: bounds.x + bounds.width + padding, y: bounds.y + bounds.height + padding, cursor: 'se-resize' } // SE
    ];

    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#00A0FF';
    handles.forEach(handle => {
      ctx.fillRect(handle.x - handleSize/2, handle.y - handleSize/2, handleSize, handleSize);
      ctx.strokeRect(handle.x - handleSize/2, handle.y - handleSize/2, handleSize, handleSize);
    });
  }, [selectedElement]);

  const drawStroke = useCallback((ctx: CanvasRenderingContext2D, points: Point[], strokeColor: string, width: number, type: BrushType) => {
    const stroke = getStroke(points, {
      ...getBrushOptions(type, width),
    });

    if (stroke.length < 2) return;

    ctx.beginPath();
    ctx.fillStyle = strokeColor;
    
    if (type === 'laser') {
      // Create intense glowing effect for laser
      ctx.shadowColor = strokeColor;
      ctx.shadowBlur = 20;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
      
      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    } else {
      // Excalidraw-like rendering for other brush types
      ctx.beginPath();
      
      // Add slight transparency for more natural look
      const color = strokeColor.startsWith('rgba') ? strokeColor : `${strokeColor}CC`;
      ctx.fillStyle = color;
      
      // Draw the main stroke
      for (const [x, y] of stroke) {
        ctx.lineTo(x, y);
      }
      ctx.fill();
      
      // Add subtle variation for rough and sketchy
      if (type === 'rough' || type === 'sketchy') {
        const roughStroke = getStroke(points, {
          ...getBrushOptions(type, width * 0.3),
          thinning: getBrushOptions(type, width).thinning * 1.5,
        });
        
        ctx.beginPath();
        for (const [x, y] of roughStroke) {
          ctx.lineTo(x, y);
        }
        ctx.fillStyle = `${strokeColor}33`;
        ctx.fill();
      }
    }
  }, []);

  const redrawCanvas = useCallback(() => {
    const canvas = getCanvas();
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all completed strokes
    strokes.forEach((stroke) => {
      drawStroke(ctx, stroke.points, stroke.color, stroke.width, stroke.brushType);
    });

    // Draw all completed shapes
    shapes.forEach((shape) => {
      drawShape(ctx, shape);
    });

    // Draw current shape if any
    if (currentShape) {
      drawShape(ctx, currentShape);
    }

    // Draw selection box if there's a selected element
    if (selectedElement) {
      const element = selectedElement.type === 'shape'
        ? shapes.find(s => s.id === selectedElement.id)
        : strokes.find(s => s.id === selectedElement.id);
      
      if (element) {
        drawSelectionBox(ctx, element);
      }
    }
  }, [strokes, shapes, currentShape, selectedElement, drawStroke, drawSelectionBox]);

  const isPointNearStroke = useCallback((x: number, y: number, strokePoints: Point[]) => {
    // Check if any segment of the stroke is near the point
    for (let i = 0; i < strokePoints.length - 1; i++) {
      const p1 = strokePoints[i];
      const p2 = strokePoints[i + 1];
      
      // Calculate distance from point to line segment
      const A = x - p1.x;
      const B = y - p1.y;
      const C = p2.x - p1.x;
      const D = p2.y - p1.y;

      const dot = A * C + B * D;
      const lenSq = C * C + D * D;
      let param = -1;

      if (lenSq !== 0) param = dot / lenSq;

      let xx, yy;

      if (param < 0) {
        xx = p1.x;
        yy = p1.y;
      } else if (param > 1) {
        xx = p2.x;
        yy = p2.y;
      } else {
        xx = p1.x + param * C;
        yy = p1.y + param * D;
      }

      const dx = x - xx;
      const dy = y - yy;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < strokeWidth * 2.5) return true;
    }
    return false;
  }, [strokeWidth]);

  const isPointNearShape = useCallback((x: number, y: number, shape: Shape) => {
    const { type, startPoint, endPoint, text, width } = shape;
    const margin = strokeWidth * 2.5;
    
    switch (type) {
      case 'square': {
        const left = Math.min(startPoint.x, endPoint.x);
        const right = Math.max(startPoint.x, endPoint.x);
        const top = Math.min(startPoint.y, endPoint.y);
        const bottom = Math.max(startPoint.y, endPoint.y);
        
        // Check if point is near any edge of the rectangle
        const nearHorizontal = (y >= top - margin && y <= bottom + margin) &&
                             (Math.abs(x - left) <= margin || Math.abs(x - right) <= margin);
        const nearVertical = (x >= left - margin && x <= right + margin) &&
                           (Math.abs(y - top) <= margin || Math.abs(y - bottom) <= margin);
        
        return nearHorizontal || nearVertical;
      }
      case 'triangle': {
        const midX = startPoint.x + (endPoint.x - startPoint.x) / 2;
        const points = [
          { x: midX, y: startPoint.y },
          { x: endPoint.x, y: endPoint.y },
          { x: startPoint.x, y: endPoint.y }
        ];
        
        // Check if point is near any of the triangle's edges
        for (let i = 0; i < points.length; i++) {
          const p1 = points[i];
          const p2 = points[(i + 1) % points.length];
          
          const A = x - p1.x;
          const B = y - p1.y;
          const C = p2.x - p1.x;
          const D = p2.y - p1.y;

          const dot = A * C + B * D;
          const lenSq = C * C + D * D;
          let param = -1;

          if (lenSq !== 0) param = dot / lenSq;

          let xx, yy;

          if (param < 0) {
            xx = p1.x;
            yy = p1.y;
          } else if (param > 1) {
            xx = p2.x;
            yy = p2.y;
          } else {
            xx = p1.x + param * C;
            yy = p1.y + param * D;
          }

          const dx = x - xx;
          const dy = y - yy;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < margin) return true;
        }
        return false;
      }
      case 'arrow': {
        // Check main line of arrow
        const A = x - startPoint.x;
        const B = y - startPoint.y;
        const C = endPoint.x - startPoint.x;
        const D = endPoint.y - startPoint.y;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;

        if (lenSq !== 0) param = dot / lenSq;

        let xx, yy;

        if (param < 0) {
          xx = startPoint.x;
          yy = startPoint.y;
        } else if (param > 1) {
          xx = endPoint.x;
          yy = endPoint.y;
        } else {
          xx = startPoint.x + param * C;
          yy = startPoint.y + param * D;
        }

        const dx = x - xx;
        const dy = y - yy;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Check arrowhead
        const angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);
        const headLength = 20;
        const arrowPoint1 = {
          x: endPoint.x - headLength * Math.cos(angle - Math.PI / 6),
          y: endPoint.y - headLength * Math.sin(angle - Math.PI / 6)
        };
        const arrowPoint2 = {
          x: endPoint.x - headLength * Math.cos(angle + Math.PI / 6),
          y: endPoint.y - headLength * Math.sin(angle + Math.PI / 6)
        };

        const distToArrowHead1 = Math.sqrt(
          Math.pow(x - arrowPoint1.x, 2) + Math.pow(y - arrowPoint1.y, 2)
        );
        const distToArrowHead2 = Math.sqrt(
          Math.pow(x - arrowPoint2.x, 2) + Math.pow(y - arrowPoint2.y, 2)
        );

        return distance < margin || distToArrowHead1 < margin || distToArrowHead2 < margin;
      }
      case 'circle': {
        const centerX = (startPoint.x + endPoint.x) / 2;
        const centerY = (startPoint.y + endPoint.y) / 2;
        const radiusX = Math.abs(endPoint.x - startPoint.x) / 2;
        const radiusY = Math.abs(endPoint.y - startPoint.y) / 2;

        // Calculate normalized distance from point to ellipse
        const dx = x - centerX;
        const dy = y - centerY;
        const normalizedDist = Math.sqrt(
          Math.pow(dx / radiusX, 2) + Math.pow(dy / radiusY, 2)
        );

        // Check if point is near the ellipse perimeter
        return Math.abs(normalizedDist - 1) * Math.min(radiusX, radiusY) < margin;
      }
      case 'diamond': {
        const centerX = (startPoint.x + endPoint.x) / 2;
        const centerY = (startPoint.y + endPoint.y) / 2;
        
        // Define the four points of the diamond
        const points = [
          { x: centerX, y: startPoint.y }, // top
          { x: endPoint.x, y: centerY },   // right
          { x: centerX, y: endPoint.y },   // bottom
          { x: startPoint.x, y: centerY }  // left
        ];
        
        // Check if point is near any of the diamond's edges
        for (let i = 0; i < points.length; i++) {
          const p1 = points[i];
          const p2 = points[(i + 1) % points.length];
          
          const A = x - p1.x;
          const B = y - p1.y;
          const C = p2.x - p1.x;
          const D = p2.y - p1.y;

          const dot = A * C + B * D;
          const lenSq = C * C + D * D;
          let param = -1;

          if (lenSq !== 0) param = dot / lenSq;

          let xx, yy;

          if (param < 0) {
            xx = p1.x;
            yy = p1.y;
          } else if (param > 1) {
            xx = p2.x;
            yy = p2.y;
          } else {
            xx = p1.x + param * C;
            yy = p1.y + param * D;
          }

          const dx = x - xx;
          const dy = y - yy;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < margin) return true;
        }
        return false;
      }
      case 'text': {
        if (!text) return false;
        
        const ctx = getCanvas()?.getContext('2d');
        if (!ctx) return false;

        // Set up the context for measurement
        const fontSize = width * 10;
        ctx.font = `${fontSize}px Arial`;
        const metrics = ctx.measureText(text);
        const textWidth = metrics.width;
        const textHeight = fontSize;

        // If the text has been resized, use the resized bounds
        let bounds;
        if (endPoint.x !== startPoint.x || endPoint.y !== startPoint.y) {
          bounds = {
            left: startPoint.x,
            top: startPoint.y - textHeight,
            right: endPoint.x,
            bottom: endPoint.y
          };
        } else {
          bounds = {
            left: startPoint.x,
            top: startPoint.y - textHeight,
            right: startPoint.x + textWidth,
            bottom: startPoint.y
          };
        }

        // Check if point is within the text bounds with margin
        return x >= bounds.left - margin &&
               x <= bounds.right + margin &&
               y >= bounds.top - margin &&
               y <= bounds.bottom + margin;
      }
      default:
        return false;
    }
  }, [strokeWidth, getCanvas]);

  // Helper function to check if two line segments intersect
  const doLineSegmentsIntersect = useCallback((p1: Point, p2: Point, p3: Point, p4: Point) => {
    const denominator = ((p4.y - p3.y) * (p2.x - p1.x)) - ((p4.x - p3.x) * (p2.y - p1.y));
    if (denominator === 0) return false;

    const ua = (((p4.x - p3.x) * (p1.y - p3.y)) - ((p4.y - p3.y) * (p1.x - p3.x))) / denominator;
    const ub = (((p2.x - p1.x) * (p1.y - p3.y)) - ((p2.y - p1.y) * (p1.x - p3.x))) / denominator;

    return (ua >= 0 && ua <= 1) && (ub >= 0 && ub <= 1);
  }, []);

  const getResizeHandle = useCallback((x: number, y: number, element: Shape | Stroke) => {
    let bounds: { x: number, y: number, width: number, height: number };
    
    if ('points' in element) {
      const xs = element.points.map(p => p.x);
      const ys = element.points.map(p => p.y);
      bounds = {
        x: Math.min(...xs),
        y: Math.min(...ys),
        width: Math.max(...xs) - Math.min(...xs),
        height: Math.max(...ys) - Math.min(...ys)
      };
    } else {
      if (element.type === 'text' && element.text) {
        const ctx = getCanvas()?.getContext('2d');
        if (!ctx) return null;

        const fontSize = element.width * 10;
        ctx.font = `${fontSize}px Arial`;
        const metrics = ctx.measureText(element.text);
        const textWidth = metrics.width;
        const textHeight = fontSize;

        if (element.endPoint.x !== element.startPoint.x || element.endPoint.y !== element.startPoint.y) {
          bounds = {
            x: element.startPoint.x,
            y: element.startPoint.y - textHeight,
            width: element.endPoint.x - element.startPoint.x,
            height: element.endPoint.y - (element.startPoint.y - textHeight)
          };
        } else {
          bounds = {
            x: element.startPoint.x,
            y: element.startPoint.y - textHeight,
            width: textWidth,
            height: textHeight
          };
        }
      } else {
        bounds = {
          x: Math.min(element.startPoint.x, element.endPoint.x),
          y: Math.min(element.startPoint.y, element.endPoint.y),
          width: Math.abs(element.endPoint.x - element.startPoint.x),
          height: Math.abs(element.endPoint.y - element.startPoint.y)
        };
      }
    }

    const padding = 8;
    const handleSize = 20; // Increased hit area for easier selection
    const handles = {
      nw: { x: bounds.x - padding, y: bounds.y - padding },
      ne: { x: bounds.x + bounds.width + padding, y: bounds.y - padding },
      sw: { x: bounds.x - padding, y: bounds.y + bounds.height + padding },
      se: { x: bounds.x + bounds.width + padding, y: bounds.y + bounds.height + padding }
    };

    for (const [position, handle] of Object.entries(handles)) {
      if (
        x >= handle.x - handleSize/2 &&
        x <= handle.x + handleSize/2 &&
        y >= handle.y - handleSize/2 &&
        y <= handle.y + handleSize/2
      ) {
        return position as 'nw' | 'ne' | 'sw' | 'se';
      }
    }
    return null;
  }, [getCanvas]);

  const getCursorStyle = useCallback(() => {
    if (isEraseMode) return 'crosshair';
    if (shapeType === 'select') {
      if (isDragging) return 'grabbing';
      if (hoverHandle) {
        switch (hoverHandle) {
          case 'nw':
          case 'se':
            return 'nwse-resize';
          case 'ne':
          case 'sw':
            return 'nesw-resize';
        }
      }
      if (selectedElement?.type === 'shape') {
        const shape = shapes.find(s => s.id === selectedElement.id);
        if (shape?.type === 'text') {
          return 'move'; // Special cursor for text selection
        }
      }
      if (selectedElement) return 'grab';
      return 'default';
    }
    if (shapeType === 'text') return 'text';
    if (shapeType !== 'none') return 'crosshair';
    return 'default';
  }, [isEraseMode, shapeType, isDragging, hoverHandle, selectedElement, shapes]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const canvas = getCanvas();
    if (!canvas) return;
    
    canvas.setPointerCapture(e.pointerId);
    
    if (isPanning) {
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    const point = getPointerPosition(e);

    if (shapeType === 'text') {
      setTextInput({ x: point.x, y: point.y, isActive: true });
      return;
    }

    if (isEraseMode) {
      setCurrentPoints([point]);
      setIsDrawing(true);
      return;
    }

    if (shapeType === 'select') {
      // Check if clicking on a resize handle
      if (selectedElement) {
        const element = selectedElement.type === 'shape' 
          ? shapes.find(s => s.id === selectedElement.id)
          : strokes.find(s => s.id === selectedElement.id);
        
        if (element) {
          const handle = getResizeHandle(point.x, point.y, element);
          if (handle) {
            setIsResizing(true);
            setResizeHandle(handle);
            setDragStart(point);
            return;
          }
        }
      }

      // Check if clicking on an existing element
      let found = false;
      
      // Check shapes first (they're on top)
      for (let i = shapes.length - 1; i >= 0; i--) {
        if (isPointNearShape(point.x, point.y, shapes[i])) {
          setSelectedElement({ type: 'shape', id: shapes[i].id! });
          setIsDragging(true);
          setDragStart(point);
          found = true;
          break;
        }
      }

      // Then check strokes
      if (!found) {
        for (let i = strokes.length - 1; i >= 0; i--) {
          if (isPointNearStroke(point.x, point.y, strokes[i].points)) {
            setSelectedElement({ type: 'stroke', id: strokes[i].id! });
            setIsDragging(true);
            setDragStart(point);
            found = true;
            break;
          }
        }
      }

      // If clicked on empty space, clear selection
      if (!found) {
        setSelectedElement(null);
      }
    } else if (shapeType !== 'none' && !isEraseMode) {
      setCurrentShape({
        type: shapeType,
        startPoint: point,
        endPoint: point,
        color,
        width: strokeWidth,
        id: Math.random().toString(36).substr(2, 9)
      });
      setIsDrawing(true);
    } else {
      setCurrentPoints([point]);
      setIsDrawing(true);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    e.preventDefault();
    const canvas = getCanvas();
    if (!canvas) return;

    if (isPanning && lastPanPoint) {
      const dx = e.clientX - lastPanPoint.x;
      const dy = e.clientY - lastPanPoint.y;
      setPan(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    const point = getPointerPosition(e);

    // Check for resize handle hover when in select mode
    if (shapeType === 'select' && selectedElement && !isDragging && !isResizing) {
      const element = selectedElement.type === 'shape'
        ? shapes.find(s => s.id === selectedElement.id)
        : strokes.find(s => s.id === selectedElement.id);
      
      if (element) {
        const handle = getResizeHandle(point.x, point.y, element);
        setHoverHandle(handle);
      }
    }

    if (isDragging && selectedElement && dragStart) {
      const dx = point.x - dragStart.x;
      const dy = point.y - dragStart.y;

      if (selectedElement.type === 'shape') {
        const newShapes = shapes.map(shape => {
          if (shape.id === selectedElement.id) {
            return {
              ...shape,
              startPoint: {
                x: shape.startPoint.x + dx,
                y: shape.startPoint.y + dy
              },
              endPoint: {
                x: shape.endPoint.x + dx,
                y: shape.endPoint.y + dy
              }
            };
          }
          return shape;
        });
        onShapesChange?.(newShapes);
      } else {
        const newStrokes = strokes.map(stroke => {
          if (stroke.id === selectedElement.id) {
            return {
              ...stroke,
              points: stroke.points.map(p => ({
                x: p.x + dx,
                y: p.y + dy,
                pressure: p.pressure
              }))
            };
          }
          return stroke;
        });
        onStrokesChange?.(newStrokes);
      }
      setDragStart(point);
    } else if (isResizing && selectedElement && dragStart && resizeHandle) {
      if (selectedElement.type === 'shape') {
        const shape = shapes.find(s => s.id === selectedElement.id);
        if (shape) {
          const newShapes = shapes.map(s => {
            if (s.id === selectedElement.id) {
              const newShape = { ...s };
              if (resizeHandle.includes('n')) {
                newShape.startPoint.y = point.y;
              }
              if (resizeHandle.includes('s')) {
                newShape.endPoint.y = point.y;
              }
              if (resizeHandle.includes('w')) {
                newShape.startPoint.x = point.x;
              }
              if (resizeHandle.includes('e')) {
                newShape.endPoint.x = point.x;
              }
              return newShape;
            }
            return s;
          });
          onShapesChange?.(newShapes);
        }
      } else {
        const stroke = strokes.find(s => s.id === selectedElement.id);
        if (stroke) {
          const bounds = {
            minX: Math.min(...stroke.points.map(p => p.x)),
            maxX: Math.max(...stroke.points.map(p => p.x)),
            minY: Math.min(...stroke.points.map(p => p.y)),
            maxY: Math.max(...stroke.points.map(p => p.y))
          };

          // Calculate new dimensions based on resize handle position
          let newWidth = bounds.maxX - bounds.minX;
          let newHeight = bounds.maxY - bounds.minY;
          let newX = bounds.minX;
          let newY = bounds.minY;

          if (resizeHandle.includes('e')) {
            newWidth = point.x - bounds.minX;
          } else if (resizeHandle.includes('w')) {
            newWidth = bounds.maxX - point.x;
            newX = point.x;
          }

          if (resizeHandle.includes('s')) {
            newHeight = point.y - bounds.minY;
          } else if (resizeHandle.includes('n')) {
            newHeight = bounds.maxY - point.y;
            newY = point.y;
          }

          const scaleX = newWidth / (bounds.maxX - bounds.minX);
          const scaleY = newHeight / (bounds.maxY - bounds.minY);
          const translateX = newX - bounds.minX;
          const translateY = newY - bounds.minY;

          const newStrokes = strokes.map(s => {
            if (s.id === selectedElement.id) {
              return {
                ...s,
                points: s.points.map(p => {
                  // Calculate the relative position of each point within the original bounds
                  const relativeX = (p.x - bounds.minX) / (bounds.maxX - bounds.minX);
                  const relativeY = (p.y - bounds.minY) / (bounds.maxY - bounds.minY);
                  
                  // Apply the transformation to maintain the relative positions
                  return {
                    x: newX + (relativeX * newWidth),
                    y: newY + (relativeY * newHeight),
                    pressure: p.pressure
                  };
                })
              };
            }
            return s;
          });
          onStrokesChange?.(newStrokes);
        }
      }
      setDragStart(point);
    } else if (isDrawing) {
      if (shapeType !== 'none' && !isEraseMode && currentShape) {
        setCurrentShape({
          ...currentShape,
          endPoint: point,
        });
      } else {
        setCurrentPoints((prev) => [...prev, point]);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const canvas = getCanvas();
    if (!canvas) return;
    
    canvas.releasePointerCapture(e.pointerId);
    
    setIsDrawing(false);
    setIsDragging(false);
    setIsResizing(false);
    setDragStart(null);
    setResizeHandle(null);
    setHoverHandle(null);

    if (currentShape && !isEraseMode && shapeType !== 'select') {
      onShapesChange?.([...shapes, currentShape]);
      setCurrentShape(null);
    } else if (isEraseMode && currentPoints.length > 0) {
      // Filter out strokes that intersect with the eraser path
      const remainingStrokes = strokes.filter(stroke => {
        // Check if any line segment of the stroke intersects with any eraser line segment
        for (let i = 0; i < stroke.points.length - 1; i++) {
          for (let j = 0; j < currentPoints.length - 1; j++) {
            // Check both point proximity and line segment intersection
            const strokeSegStart = stroke.points[i];
            const strokeSegEnd = stroke.points[i + 1];
            const eraseSegStart = currentPoints[j];
            const eraseSegEnd = currentPoints[j + 1];

            // Check if any point is near the eraser path
            const distance1 = Math.sqrt(
              Math.pow(strokeSegStart.x - eraseSegStart.x, 2) + 
              Math.pow(strokeSegStart.y - eraseSegStart.y, 2)
            );
            const distance2 = Math.sqrt(
              Math.pow(strokeSegEnd.x - eraseSegStart.x, 2) + 
              Math.pow(strokeSegEnd.y - eraseSegStart.y, 2)
            );

            if (distance1 < strokeWidth * 2 || distance2 < strokeWidth * 2) {
              return false;
            }

            // Check if line segments intersect
            if (doLineSegmentsIntersect(strokeSegStart, strokeSegEnd, eraseSegStart, eraseSegEnd)) {
              return false;
            }
          }
        }
        return true;
      });

      // Filter out shapes that intersect with the eraser path
      const remainingShapes = shapes.filter(shape => {
        return !currentPoints.some(erasePoint => 
          isPointNearShape(erasePoint.x, erasePoint.y, shape)
        );
      });

      if (remainingStrokes.length !== strokes.length) {
        onStrokesChange?.(remainingStrokes);
      }
      if (remainingShapes.length !== shapes.length) {
        onShapesChange?.(remainingShapes);
      }
    } else if (!isEraseMode && currentPoints.length > 1 && shapeType !== 'select') {
      const newStroke = {
        points: currentPoints,
        color,
        width: strokeWidth,
        brushType,
        id: Math.random().toString(36).substr(2, 9)
      };
      onStrokesChange?.([...strokes, newStroke]);
    }
    setCurrentPoints([]);
  };

  const handlePointerOut = (e: React.PointerEvent) => {
    handlePointerUp(e);
    setHoverHandle(null);
  };

  // Redraw canvas when strokes or shapes change
  useEffect(() => {
    redrawCanvas();
  }, [strokes, shapes, redrawCanvas]);

  // Draw current stroke
  useEffect(() => {
    const canvas = getCanvas();
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx || currentPoints.length < 2) return;

    redrawCanvas();
    
    if (isEraseMode) {
      // Draw eraser path
      ctx.beginPath();
      ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
      for (let i = 1; i < currentPoints.length; i++) {
        ctx.lineTo(currentPoints[i].x, currentPoints[i].y);
      }
      ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)';
      ctx.lineWidth = strokeWidth * 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    } else {
      drawStroke(ctx, currentPoints, color, strokeWidth, brushType);
    }
  }, [currentPoints, color, strokeWidth, brushType, isEraseMode, drawStroke, redrawCanvas]);

  const handleTextInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && textInput) {
      saveText((e.target as HTMLInputElement).value);
    }
  };

  const saveText = useCallback((text: string) => {
    if (text && textInput) {
      const newShape: Shape = {
        type: 'text',
        startPoint: { x: textInput.x, y: textInput.y },
        endPoint: { x: textInput.x, y: textInput.y },
        color,
        width: strokeWidth,
        text,
        id: Math.random().toString(36).substr(2, 9)
      };
      onShapesChange?.([...shapes, newShape]);
    }
    setTextInput(null);
  }, [textInput, color, strokeWidth, shapes, onShapesChange]);

  useEffect(() => {
    if (textInput?.isActive && shapeType !== 'text') {
      const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement;
      if (inputElement) {
        saveText(inputElement.value);
      }
    }
  }, [shapeType, textInput, saveText]);

  if (!isReady) {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      onWheel={handleWheel}
      style={{ cursor: isPanning ? 'grab' : undefined }}
    >
      <div
        className="absolute"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          width: width * 2,
          height: height * 2,
        }}
      >
        <canvas
          ref={ref || internalCanvasRef}
          width={width * 2}
          height={height * 2}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerOut={handlePointerOut}
          className="touch-none"
          style={{ 
            width: '100%',
            height: '100%',
            cursor: getCursorStyle(),
          }}
        />
        {textInput && (
          <input
            type="text"
            autoFocus
            className="absolute bg-transparent border-none outline-none"
            style={{
              left: textInput.x,
              top: textInput.y - 10,
              color: color,
              fontSize: `${strokeWidth * 10}px`,
              fontFamily: 'Arial',
              transform: `scale(${1/zoom})`,
              transformOrigin: '0 0'
            }}
            onKeyDown={handleTextInput}
            onBlur={(e) => saveText(e.target.value)}
          />
        )}
      </div>
      <ZoomControls
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
      />
    </div>
  );
});

Canvas.displayName = 'Canvas';

export default Canvas; 