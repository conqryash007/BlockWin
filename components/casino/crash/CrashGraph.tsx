"use client";

import { useEffect, useRef, useCallback } from "react";

interface CrashGraphProps {
  multiplier: number;
  gameState: "waiting" | "starting" | "running" | "crashed";
  crashPoint?: number;
}

export function CrashGraph({ multiplier, gameState, crashPoint }: CrashGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<{ x: number; y: number }[]>([]);
  const animationRef = useRef<number>();

  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, "rgba(13, 16, 20, 0.9)");
    bgGradient.addColorStop(1, "rgba(13, 16, 20, 1)");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;

    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = padding + (i / 10) * (width - padding * 2);
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }

    // Horizontal grid lines with multiplier labels
    const maxDisplayMultiplier = Math.max(multiplier * 1.5, 2);
    const gridSteps = [1, 1.5, 2, 3, 5, 10, 20, 50, 100];
    const step = gridSteps.find(s => maxDisplayMultiplier / s <= 5) || 100;
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.font = "12px Inter, sans-serif";
    ctx.textAlign = "right";

    for (let m = 1; m <= maxDisplayMultiplier; m += step) {
      const y = height - padding - ((m - 1) / (maxDisplayMultiplier - 1)) * (height - padding * 2);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
      ctx.fillText(`${m.toFixed(1)}×`, padding - 8, y + 4);
    }

    // Draw axes
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw the curve
    if (pointsRef.current.length > 1) {
      const isCrashed = gameState === "crashed";
      
      // Create gradient for the line
      const lineGradient = ctx.createLinearGradient(0, height, 0, 0);
      if (isCrashed) {
        lineGradient.addColorStop(0, "#ef4444");
        lineGradient.addColorStop(1, "#dc2626");
      } else {
        lineGradient.addColorStop(0, "#00ffa3");
        lineGradient.addColorStop(1, "#00d48b");
      }

      // Draw filled area under curve
      ctx.beginPath();
      ctx.moveTo(pointsRef.current[0].x, height - padding);
      pointsRef.current.forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.lineTo(pointsRef.current[pointsRef.current.length - 1].x, height - padding);
      ctx.closePath();
      
      const fillGradient = ctx.createLinearGradient(0, height, 0, 0);
      if (isCrashed) {
        fillGradient.addColorStop(0, "rgba(239, 68, 68, 0.0)");
        fillGradient.addColorStop(1, "rgba(239, 68, 68, 0.2)");
      } else {
        fillGradient.addColorStop(0, "rgba(0, 255, 163, 0.0)");
        fillGradient.addColorStop(1, "rgba(0, 255, 163, 0.15)");
      }
      ctx.fillStyle = fillGradient;
      ctx.fill();

      // Draw the line
      ctx.beginPath();
      ctx.moveTo(pointsRef.current[0].x, pointsRef.current[0].y);
      
      for (let i = 1; i < pointsRef.current.length; i++) {
        const prevPoint = pointsRef.current[i - 1];
        const currPoint = pointsRef.current[i];
        const cpx = (prevPoint.x + currPoint.x) / 2;
        ctx.quadraticCurveTo(prevPoint.x, prevPoint.y, cpx, (prevPoint.y + currPoint.y) / 2);
      }
      
      const lastPoint = pointsRef.current[pointsRef.current.length - 1];
      ctx.lineTo(lastPoint.x, lastPoint.y);
      
      ctx.strokeStyle = lineGradient;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();

      // Draw glow effect
      ctx.shadowColor = isCrashed ? "#ef4444" : "#00ffa3";
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw end point
      ctx.beginPath();
      ctx.arc(lastPoint.x, lastPoint.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = isCrashed ? "#ef4444" : "#00ffa3";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Pulse effect on end point
      if (!isCrashed) {
        ctx.beginPath();
        ctx.arc(lastPoint.x, lastPoint.y, 12 + Math.sin(Date.now() / 200) * 3, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(0, 255, 163, 0.3)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // Draw crash explosion effect
    if (gameState === "crashed" && pointsRef.current.length > 0) {
      const lastPoint = pointsRef.current[pointsRef.current.length - 1];
      const explosionRadius = 30 + Math.sin(Date.now() / 100) * 10;
      
      const explosionGradient = ctx.createRadialGradient(
        lastPoint.x, lastPoint.y, 0,
        lastPoint.x, lastPoint.y, explosionRadius
      );
      explosionGradient.addColorStop(0, "rgba(239, 68, 68, 0.6)");
      explosionGradient.addColorStop(0.5, "rgba(239, 68, 68, 0.3)");
      explosionGradient.addColorStop(1, "rgba(239, 68, 68, 0)");
      
      ctx.beginPath();
      ctx.arc(lastPoint.x, lastPoint.y, explosionRadius, 0, Math.PI * 2);
      ctx.fillStyle = explosionGradient;
      ctx.fill();
    }

  }, [multiplier, gameState]);

  // Update points when multiplier changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;

    if (gameState === "waiting") {
      pointsRef.current = [];
    } else if (gameState === "running" || gameState === "crashed") {
      const maxDisplayMultiplier = Math.max(multiplier * 1.5, 2);
      const progress = pointsRef.current.length / 200; // Normalize to 0-1 over time
      
      const x = padding + progress * (width - padding * 2);
      const y = height - padding - ((multiplier - 1) / (maxDisplayMultiplier - 1)) * (height - padding * 2);
      
      // Only add new points if running
      if (gameState === "running") {
        pointsRef.current.push({ x: Math.min(x, width - padding), y: Math.max(y, padding) });
        
        // Limit points to prevent memory issues
        if (pointsRef.current.length > 500) {
          pointsRef.current = pointsRef.current.slice(-400);
        }
      }
    }

    drawGraph();
  }, [multiplier, gameState, drawGraph]);

  // Animation loop for effects
  useEffect(() => {
    const animate = () => {
      drawGraph();
      animationRef.current = requestAnimationFrame(animate);
    };

    if (gameState === "running" || gameState === "crashed") {
      animate();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, drawGraph]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={400}
      className="w-full h-full rounded-xl"
      style={{ maxHeight: "400px" }}
    />
  );
}
