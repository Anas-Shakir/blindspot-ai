/**
 * frontend/lib/whiteboard/types.ts
 *
 * Core TypeScript types for the Blindspot AI Whiteboard Subsystem.
 * Structured object model for canvas elements, tool configurations,
 * history tracking, and JSON serialization.
 */

export type ToolType =
  | 'select'
  | 'pan'
  | 'pen'
  | 'rectangle'
  | 'circle'
  | 'arrow'
  | 'text'
  | 'eraser';

export type CanvasObjectType =
  | 'shape'
  | 'text'
  | 'stroke'
  | 'arrow'
  | 'highlight';

export type ShapeSubtype = 'rectangle' | 'circle' | 'card' | 'diamond';

export interface Point {
  x: number;
  y: number;
}

export interface ObjectStyle {
  strokeColor: string;
  fillColor?: string;
  strokeWidth: number;
  opacity: number;
  fontSize?: number;
  fontFamily?: string;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
}

export interface ShapeGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
  subtype: ShapeSubtype;
  label?: string;
  borderRadius?: number;
}

export interface TextGeometry {
  x: number;
  y: number;
  text: string;
  width?: number;
  height?: number;
}

export interface StrokeGeometry {
  points: Point[];
}

export interface ArrowGeometry {
  from: Point;
  to: Point;
  controlPoint?: Point; // for curved arrows
  arrowheadEnd?: boolean;
  arrowheadStart?: boolean;
}

export interface CanvasObject {
  id: string;
  type: CanvasObjectType;
  authoredBy: 'user' | 'ai';
  geometry: ShapeGeometry | TextGeometry | StrokeGeometry | ArrowGeometry;
  style: ObjectStyle;
  createdAt: number;
  linkedStepId?: string | null; // Traceability link back to lesson step / timestamp
  zIndex?: number;
}

export interface ViewportTransform {
  x: number; // translation in px
  y: number;
  scale: number; // zoom factor (e.g. 1.0)
}

export interface WhiteboardState {
  version: '1.0';
  objects: CanvasObject[];
  viewport: ViewportTransform;
  selectedId: string | null;
}
