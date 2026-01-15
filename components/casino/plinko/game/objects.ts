import { HEIGHT, NUM_SINKS, WIDTH, obstacleRadius, sinkWidth } from "./constants";
import { pad } from "./padding";

export interface Obstacle {
    x: number;
    y: number;
    radius: number;
}

export interface Sink {
    x: number;
    y: number;
    width: number;
    height: number;
    multiplier?: number;
}

const MULTIPLIERS: {[ key: number ]: number} = {
    1: 5,
    2: 3,
    3: 2,
    4: 1.5,
    5: 1.2,
    6: 1,
    7: 1,
    8: 0.8,
    9: 0.5,
    10: 0.8,
    11: 1,
    12: 1,
    13: 1.2,
    14: 1.5,
    15: 2,
    16: 3,
    17: 5
}

export const createObstacles = (): Obstacle[] => {
    const obstacles: Obstacle[] = [];
    const rows = 18;
    for (let row = 2; row < rows; row++) {
        const numObstacles = row + 1;
        const y = 0 + row * 25;
        const spacing = 25;
        for (let col = 0; col < numObstacles; col++) {
            const x = WIDTH / 2 - spacing * (row / 2 - col);
            obstacles.push({x: pad(x), y: pad(y), radius: obstacleRadius });
        }   
    }
    return obstacles;
}

export const createSinks = (): Sink[] => {
    const sinks = [];
    const SPACING = obstacleRadius * 2;

    for (let i = 0; i < NUM_SINKS; i++) {
      const x = WIDTH / 2 + sinkWidth * (i - Math.floor(NUM_SINKS/2)) - SPACING * 1.5;
      const y = HEIGHT - 120;
      const width = sinkWidth;
      const height = width;
      sinks.push({ x, y, width, height, multiplier: MULTIPLIERS[i+1] });
    }

    return sinks;
}
