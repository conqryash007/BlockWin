import { gravity, horizontalFriction, verticalFriction } from "../constants";
import { Obstacle, Sink } from "../objects";
import { pad, unpad } from "../padding";

export class Ball {
    private x: number;
    private y: number;
    private radius: number;
    private color: string;
    private vx: number;
    private vy: number;
    private ctx: CanvasRenderingContext2D;
    private obstacles: Obstacle[]
    private sinks: Sink[]
    private onFinish: (index: number) => void;
    private onCollision?: () => void;
    private targetBucket?: number;

    constructor(x: number, y: number, radius: number, color: string, ctx: CanvasRenderingContext2D, obstacles: Obstacle[], sinks: Sink[], onFinish: (index: number) => void, onCollision?: () => void, targetBucket?: number) {
      this.x = x;
      this.y = y;
      this.radius = radius;
      this.color = color;
      // Add random initial horizontal velocity for variety (-2 to +2)
      this.vx = (Math.random() - 0.5) * 4;
      this.vy = 0;
      this.ctx = ctx;
      this.obstacles = obstacles;
      this.sinks = sinks;
      this.onFinish = onFinish;
      this.onCollision = onCollision;
      this.targetBucket = targetBucket;
    }
  
    draw() {
      this.ctx.beginPath();
      this.ctx.arc(unpad(this.x), unpad(this.y), this.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = this.color;
      this.ctx.fill();
      this.ctx.closePath();
    }
  
    update() {
      this.vy += gravity;

      // If target bucket is specified, strongly guide the ball toward it
      if (this.targetBucket !== undefined && this.targetBucket >= 0 && this.targetBucket < this.sinks.length) {
        const targetSink = this.sinks[this.targetBucket];
        const targetX = pad(targetSink.x + targetSink.width / 2);
        const distanceToTarget = targetX - this.x;

        // Check if ball is approaching sink area (last 150 pixels)
        const sinkAreaY = targetSink.y - 150;

        if (unpad(this.y) > sinkAreaY) {
          // In sink area - apply strong steering to guarantee correct bucket
          const steeringForce = distanceToTarget * 0.003;
          this.vx += steeringForce;

          // When very close to sink, snap to target position
          if (unpad(this.y) > targetSink.y - 50) {
            const snapThreshold = 100;
            if (Math.abs(unpad(distanceToTarget)) > snapThreshold) {
              // Force ball toward target
              this.x += distanceToTarget * 0.15;
            }
          }
        } else {
          // Above sink area - gentle steering for visual variety
          const steeringForce = distanceToTarget * 0.0008;
          this.vx += steeringForce;
        }

        // Clamp horizontal velocity
        const maxVx = pad(3);
        if (this.vx > maxVx) this.vx = maxVx;
        if (this.vx < -maxVx) this.vx = -maxVx;
      }

      this.x += this.vx;
      this.y += this.vy;

      // Collision with obstacles
      this.obstacles.forEach(obstacle => {
        const dist = Math.hypot(this.x - obstacle.x, this.y - obstacle.y);
        if (dist < pad(this.radius + obstacle.radius)) {
          // Calculate collision angle
          const angle = Math.atan2(this.y - obstacle.y, this.x - obstacle.x);
          // Reflect velocity
          const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
          this.vx = (Math.cos(angle) * speed * horizontalFriction);
          this.vy = Math.sin(angle) * speed * verticalFriction;

          // Adjust position to prevent sticking
          const overlap = this.radius + obstacle.radius - unpad(dist);
          this.x += pad(Math.cos(angle) * overlap);
          this.y += pad(Math.sin(angle) * overlap);

          // Play collision sound
          this.onCollision?.();
        }
      });

      // Collision with sinks - if target bucket is specified, ONLY land in target
      if (this.targetBucket !== undefined && this.targetBucket >= 0 && this.targetBucket < this.sinks.length) {
        const sink = this.sinks[this.targetBucket];
        // Very lenient collision detection to guarantee landing in correct bucket
        if ((unpad(this.y) + this.radius) >= (sink.y - sink.height / 2)) {
            // Force snap to center of target bucket
            this.x = pad(sink.x + sink.width / 2);
            this.vx = 0;
            this.vy = 0;
            this.onFinish(this.targetBucket);
            return;
        }
      } else {
        // No target bucket - fallback to normal collision detection
        for (let i = 0; i < this.sinks.length; i++) {
          const sink = this.sinks[i];
          if (
              unpad(this.x) > sink.x - sink.width / 2 &&
              unpad(this.x) < sink.x + sink.width / 2 &&
              (unpad(this.y) + this.radius) > (sink.y - sink.height / 2)
          ) {
              this.vx = 0;
              this.vy = 0;
              this.onFinish(i);
              break;
          }
        }
      }
    }
  
  }
