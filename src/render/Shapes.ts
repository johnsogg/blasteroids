import { Vector2 } from '~/utils/Vector2';

export class Shapes {
    static drawShip(ctx: CanvasRenderingContext2D, position: Vector2, rotation: number, color: string, invulnerable?: boolean, invulnerableTime?: number, showThrust?: boolean, scale: number = 1.0, strafingLeft?: boolean, strafingRight?: boolean): void {
        // Skip drawing if invulnerable and blinking (blink every 0.2 seconds)
        if (invulnerable && invulnerableTime && Math.floor(invulnerableTime * 5) % 2 === 0) {
            return;
        }
        
        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(rotation);
        ctx.scale(scale, scale);
        
        ctx.strokeStyle = invulnerable ? '#ffff00' : color; // Yellow when invulnerable
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        // Ship is a triangle pointing forward
        ctx.moveTo(10, 0);     // nose
        ctx.lineTo(-8, -6);    // back left
        ctx.lineTo(-5, 0);     // back center
        ctx.lineTo(-8, 6);     // back right
        ctx.closePath();
        
        ctx.stroke();
        
        // Draw main thrust flames if thrusting
        if (showThrust) {
            ctx.strokeStyle = '#ff6600'; // Orange flames
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            // Main thrust flames - random length for flicker effect
            const flameLength = 8 + Math.random() * 6;
            ctx.moveTo(-8, -3);
            ctx.lineTo(-8 - flameLength, 0);
            ctx.lineTo(-8, 3);
            
            ctx.stroke();
        }

        // Draw port (left) strafe thruster flames
        if (strafingLeft) {
            ctx.strokeStyle = '#ff6600'; // Orange flames
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            
            // Port thruster flames - smaller than main thruster
            const strafeFlameLength = 4 + Math.random() * 3;
            ctx.moveTo(-3, -8);
            ctx.lineTo(-3 - strafeFlameLength, -8 - strafeFlameLength);
            ctx.moveTo(-3, -8);
            ctx.lineTo(-3, -8 - strafeFlameLength * 0.8);
            
            ctx.stroke();
        }

        // Draw starboard (right) strafe thruster flames
        if (strafingRight) {
            ctx.strokeStyle = '#ff6600'; // Orange flames
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            
            // Starboard thruster flames - smaller than main thruster
            const strafeFlameLength = 4 + Math.random() * 3;
            ctx.moveTo(-3, 8);
            ctx.lineTo(-3 - strafeFlameLength, 8 + strafeFlameLength);
            ctx.moveTo(-3, 8);
            ctx.lineTo(-3, 8 + strafeFlameLength * 0.8);
            
            ctx.stroke();
        }
        
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