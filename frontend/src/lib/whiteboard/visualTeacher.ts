/**
 * frontend/src/lib/whiteboard/visualTeacher.ts
 *
 * Automated pedagogical visual scene generator for Blindspot AI.
 * Transforms conceptual Q&A explanations and flow steps into structured,
 * beautifully styled CanvasObjects rendered on the AI Whiteboard.
 */

import { CanvasObject, Point } from './types';
import { FlowStep } from '../api';

export function generateWhiteboardScene(
  topic: string,
  explanation: string,
  flowSteps?: FlowStep[],
  analogy?: string,
  keyTakeaway?: string
): CanvasObject[] {
  const objects: CanvasObject[] = [];
  const now = Date.now();
  const lowerTopic = (topic || '').toLowerCase();
  const isMarketOrCurve =
    lowerTopic.includes('equilibrium') ||
    lowerTopic.includes('supply') ||
    lowerTopic.includes('demand') ||
    lowerTopic.includes('price') ||
    lowerTopic.includes('market') ||
    lowerTopic.includes('elasticity');

  // 1. Header Banner Card
  objects.push({
    id: `hdr-card-${now}`,
    type: 'shape',
    authoredBy: 'ai',
    geometry: {
      x: 60,
      y: 40,
      width: 680,
      height: 64,
      subtype: 'card',
      borderRadius: 12,
    },
    style: {
      strokeColor: '#701a24',
      fillColor: 'rgba(112, 26, 36, 0.25)',
      strokeWidth: 1.5,
      opacity: 1,
    },
    createdAt: now,
  });

  objects.push({
    id: `hdr-txt-${now}`,
    type: 'text',
    authoredBy: 'ai',
    geometry: {
      x: 80,
      y: 52,
      text: `🎨 Visual Lesson: ${topic.replace(/^\d+\.\s*/, '') || 'Conceptual Breakdown'}`,
      width: 640,
      height: 20,
    },
    style: {
      strokeColor: '#f5f5f4',
      fontSize: 16,
      strokeWidth: 1,
      opacity: 1,
      fontFamily: 'sans-serif',
    },
    createdAt: now,
  });

  objects.push({
    id: `hdr-sub-${now}`,
    type: 'text',
    authoredBy: 'ai',
    geometry: {
      x: 80,
      y: 78,
      text: 'AI Whiteboard pedagogical breakdown with interactive visual aids',
      width: 640,
      height: 16,
    },
    style: {
      strokeColor: '#a8a29e',
      fontSize: 12,
      strokeWidth: 1,
      opacity: 0.9,
      fontFamily: 'sans-serif',
    },
    createdAt: now,
  });

  if (isMarketOrCurve) {
    // -------------------------------------------------------------
    // MARKET EQUILIBRIUM & ECONOMIC CURVES VISUAL MODEL
    // -------------------------------------------------------------
    const originX = 140;
    const originY = 380;
    const axisWidth = 320;
    const axisHeight = 220;

    // Y-Axis (Price)
    objects.push({
      id: `axis-y-${now}`,
      type: 'arrow',
      authoredBy: 'ai',
      geometry: {
        from: { x: originX, y: originY },
        to: { x: originX, y: originY - axisHeight },
        arrowheadEnd: true,
      },
      style: {
        strokeColor: '#e7e5e4',
        strokeWidth: 2,
        opacity: 0.9,
      },
      createdAt: now,
    });

    objects.push({
      id: `lbl-y-${now}`,
      type: 'text',
      authoredBy: 'ai',
      geometry: {
        x: originX - 35,
        y: originY - axisHeight - 10,
        text: 'Price (P)',
      },
      style: {
        strokeColor: '#f5f5f4',
        fontSize: 13,
        strokeWidth: 1,
        opacity: 1,
      },
      createdAt: now,
    });

    // X-Axis (Quantity)
    objects.push({
      id: `axis-x-${now}`,
      type: 'arrow',
      authoredBy: 'ai',
      geometry: {
        from: { x: originX, y: originY },
        to: { x: originX + axisWidth, y: originY },
        arrowheadEnd: true,
      },
      style: {
        strokeColor: '#e7e5e4',
        strokeWidth: 2,
        opacity: 0.9,
      },
      createdAt: now,
    });

    objects.push({
      id: `lbl-x-${now}`,
      type: 'text',
      authoredBy: 'ai',
      geometry: {
        x: originX + axisWidth + 10,
        y: originY - 8,
        text: 'Quantity (Q)',
      },
      style: {
        strokeColor: '#f5f5f4',
        fontSize: 13,
        strokeWidth: 1,
        opacity: 1,
      },
      createdAt: now,
    });

    // Demand Curve (Downward Sloping)
    objects.push({
      id: `curve-d-${now}`,
      type: 'arrow',
      authoredBy: 'ai',
      geometry: {
        from: { x: originX + 30, y: originY - 180 },
        to: { x: originX + 260, y: originY - 30 },
        arrowheadEnd: false,
      },
      style: {
        strokeColor: '#38bdf8',
        strokeWidth: 3,
        opacity: 1,
      },
      createdAt: now,
    });

    objects.push({
      id: `lbl-d-${now}`,
      type: 'text',
      authoredBy: 'ai',
      geometry: {
        x: originX + 268,
        y: originY - 35,
        text: 'Demand (D)',
      },
      style: {
        strokeColor: '#38bdf8',
        fontSize: 12,
        strokeWidth: 1,
        opacity: 1,
      },
      createdAt: now,
    });

    // Supply Curve (Upward Sloping)
    objects.push({
      id: `curve-s-${now}`,
      type: 'arrow',
      authoredBy: 'ai',
      geometry: {
        from: { x: originX + 30, y: originY - 30 },
        to: { x: originX + 260, y: originY - 180 },
        arrowheadEnd: false,
      },
      style: {
        strokeColor: '#f43f5e',
        strokeWidth: 3,
        opacity: 1,
      },
      createdAt: now,
    });

    objects.push({
      id: `lbl-s-${now}`,
      type: 'text',
      authoredBy: 'ai',
      geometry: {
        x: originX + 268,
        y: originY - 188,
        text: 'Supply (S)',
      },
      style: {
        strokeColor: '#f43f5e',
        fontSize: 12,
        strokeWidth: 1,
        opacity: 1,
      },
      createdAt: now,
    });

    // Equilibrium Point Circle & Dashed Markers
    const eqX = originX + 145;
    const eqY = originY - 105;

    objects.push({
      id: `eq-pt-${now}`,
      type: 'shape',
      authoredBy: 'ai',
      geometry: {
        x: eqX - 8,
        y: eqY - 8,
        width: 16,
        height: 16,
        subtype: 'circle',
      },
      style: {
        strokeColor: '#fbbf24',
        fillColor: '#fbbf24',
        strokeWidth: 2,
        opacity: 1,
      },
      createdAt: now,
    });

    objects.push({
      id: `eq-txt-${now}`,
      type: 'text',
      authoredBy: 'ai',
      geometry: {
        x: eqX + 12,
        y: eqY - 18,
        text: 'E* (Market Equilibrium)',
      },
      style: {
        strokeColor: '#fbbf24',
        fontSize: 12,
        strokeWidth: 1,
        opacity: 1,
      },
      createdAt: now,
    });

    // Right Side Explanation Card
    objects.push({
      id: `exp-card-${now}`,
      type: 'shape',
      authoredBy: 'ai',
      geometry: {
        x: 480,
        y: 130,
        width: 280,
        height: 160,
        subtype: 'card',
        borderRadius: 10,
      },
      style: {
        strokeColor: 'rgba(255, 255, 255, 0.1)',
        fillColor: 'rgba(23, 23, 23, 0.8)',
        strokeWidth: 1,
        opacity: 1,
      },
      createdAt: now,
    });

    objects.push({
      id: `exp-title-${now}`,
      type: 'text',
      authoredBy: 'ai',
      geometry: {
        x: 495,
        y: 145,
        text: 'Core Equilibrium Dynamics',
      },
      style: {
        strokeColor: '#e7e5e4',
        fontSize: 13,
        strokeWidth: 1,
        opacity: 1,
      },
      createdAt: now,
    });

    objects.push({
      id: `exp-body-1-${now}`,
      type: 'text',
      authoredBy: 'ai',
      geometry: {
        x: 495,
        y: 175,
        text: '• Price coordinates decentralized supply & demand.',
      },
      style: {
        strokeColor: '#a8a29e',
        fontSize: 11,
        strokeWidth: 1,
        opacity: 0.9,
      },
      createdAt: now,
    });

    objects.push({
      id: `exp-body-2-${now}`,
      type: 'text',
      authoredBy: 'ai',
      geometry: {
        x: 495,
        y: 205,
        text: '• If Price > P*: Excess supply forces price downward.',
      },
      style: {
        strokeColor: '#a8a29e',
        fontSize: 11,
        strokeWidth: 1,
        opacity: 0.9,
      },
      createdAt: now,
    });

    objects.push({
      id: `exp-body-3-${now}`,
      type: 'text',
      authoredBy: 'ai',
      geometry: {
        x: 495,
        y: 235,
        text: '• If Price < P*: Excess demand bids price upward.',
      },
      style: {
        strokeColor: '#a8a29e',
        fontSize: 11,
        strokeWidth: 1,
        opacity: 0.9,
      },
      createdAt: now,
    });
  } else {
    // -------------------------------------------------------------
    // SEQUENTIAL FLOWCHART & CONCEPT NODES MODEL
    // -------------------------------------------------------------
    const stepsToRender: FlowStep[] =
      flowSteps && flowSteps.length > 0
        ? flowSteps
        : [
            { step_number: 1, title: 'Foundational Baseline', detail: 'Identify current parameters and active system constraints.' },
            { step_number: 2, title: 'Transformation Rule', detail: 'Apply core governing principle to predict value shifts.' },
            { step_number: 3, title: 'System Resolution', detail: 'Check if stable outcome or equilibrium target is satisfied.' },
          ];

    const startX = 70;
    const cardY = 135;
    const cardWidth = 200;
    const cardHeight = 150;
    const gapX = 40;

    stepsToRender.slice(0, 3).forEach((step, idx) => {
      const curX = startX + idx * (cardWidth + gapX);

      // Step Box Card
      objects.push({
        id: `step-box-${idx}-${now}`,
        type: 'shape',
        authoredBy: 'ai',
        geometry: {
          x: curX,
          y: cardY,
          width: cardWidth,
          height: cardHeight,
          subtype: 'card',
          borderRadius: 10,
        },
        style: {
          strokeColor: idx === 0 ? '#38bdf8' : idx === 1 ? '#fbbf24' : '#34d399',
          fillColor: 'rgba(23, 23, 23, 0.85)',
          strokeWidth: 1.5,
          opacity: 1,
        },
        createdAt: now,
      });

      // Step Number Badge
      objects.push({
        id: `step-num-${idx}-${now}`,
        type: 'text',
        authoredBy: 'ai',
        geometry: {
          x: curX + 15,
          y: cardY + 15,
          text: `STEP 0${step.step_number || idx + 1}`,
        },
        style: {
          strokeColor: idx === 0 ? '#38bdf8' : idx === 1 ? '#fbbf24' : '#34d399',
          fontSize: 10,
          strokeWidth: 1,
          opacity: 1,
          fontFamily: 'monospace',
        },
        createdAt: now,
      });

      // Step Title
      objects.push({
        id: `step-title-${idx}-${now}`,
        type: 'text',
        authoredBy: 'ai',
        geometry: {
          x: curX + 15,
          y: cardY + 38,
          text: step.title,
        },
        style: {
          strokeColor: '#f5f5f4',
          fontSize: 12,
          strokeWidth: 1,
          opacity: 1,
        },
        createdAt: now,
      });

      // Step Detail
      objects.push({
        id: `step-detail-${idx}-${now}`,
        type: 'text',
        authoredBy: 'ai',
        geometry: {
          x: curX + 15,
          y: cardY + 70,
          text: step.detail,
        },
        style: {
          strokeColor: '#a8a29e',
          fontSize: 10.5,
          strokeWidth: 1,
          opacity: 0.9,
        },
        createdAt: now,
      });

      // Connective Arrow between steps
      if (idx < Math.min(stepsToRender.length, 3) - 1) {
        objects.push({
          id: `step-arr-${idx}-${now}`,
          type: 'arrow',
          authoredBy: 'ai',
          geometry: {
            from: { x: curX + cardWidth + 5, y: cardY + cardHeight / 2 },
            to: { x: curX + cardWidth + gapX - 5, y: cardY + cardHeight / 2 },
            arrowheadEnd: true,
          },
          style: {
            strokeColor: '#78716c',
            strokeWidth: 2,
            opacity: 0.8,
          },
          createdAt: now,
        });
      }
    });
  }

  // Bottom Key Takeaway or Analogy Card
  if (keyTakeaway || analogy || explanation) {
    objects.push({
      id: `btm-card-${now}`,
      type: 'shape',
      authoredBy: 'ai',
      geometry: {
        x: 60,
        y: 310,
        width: 680,
        height: 90,
        subtype: 'card',
        borderRadius: 10,
      },
      style: {
        strokeColor: 'rgba(251, 191, 36, 0.4)',
        fillColor: 'rgba(251, 191, 36, 0.08)',
        strokeWidth: 1.2,
        opacity: 1,
      },
      createdAt: now,
    });

    objects.push({
      id: `btm-hdr-${now}`,
      type: 'text',
      authoredBy: 'ai',
      geometry: {
        x: 80,
        y: 325,
        text: '💡 Key Intuition / Analogy',
      },
      style: {
        strokeColor: '#fbbf24',
        fontSize: 12,
        strokeWidth: 1,
        opacity: 1,
      },
      createdAt: now,
    });

    objects.push({
      id: `btm-txt-${now}`,
      type: 'text',
      authoredBy: 'ai',
      geometry: {
        x: 80,
        y: 350,
        text: analogy || keyTakeaway || explanation.slice(0, 140),
      },
      style: {
        strokeColor: '#e7e5e4',
        fontSize: 11.5,
        strokeWidth: 1,
        opacity: 0.95,
      },
      createdAt: now,
    });
  }

  return objects;
}
