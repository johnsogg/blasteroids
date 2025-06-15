import { Vector2 } from '~/utils/Vector2';

export class Shapes {
    static drawShip(ctx: CanvasRenderingContext2D, position: Vector2, rotation: number, color: string): void {
        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(rotation);
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        // Ship is a triangle pointing forward
        ctx.moveTo(10, 0);     // nose
        ctx.lineTo(-8, -6);    // back left
        ctx.lineTo(-5, 0);     // back center
        ctx.lineTo(-8, 6);     // back right
        ctx.closePath();
        
        ctx.stroke();
        ctx.restore();
    }

    static drawAsteroid(ctx: CanvasRenderingContext2D, position: Vector2, rotation: number, size: Vector2, color: string): void {
        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(rotation);
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        
        // Create irregular asteroid shape
        const radius = Math.max(size.x, size.y) / 2;
        const points = 8;
        
        for (let i = 0; i <= points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const variation = 0.3 + Math.sin(angle * 3 + rotation * 2) * 0.2; // Make it irregular
            const distance = radius * variation;
            
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
        ctx.restore();
    }

    static drawBullet(ctx: CanvasRenderingContext2D, position: Vector2, color: string): void {
        ctx.save();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(position.x, position.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}