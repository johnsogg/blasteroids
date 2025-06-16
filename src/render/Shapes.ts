import { Vector2 } from "~/utils/Vector2";

export class Shapes {
    static drawShip(
        ctx: CanvasRenderingContext2D,
        position: Vector2,
        rotation: number,
        color: string,
        invulnerable?: boolean,
        invulnerableTime?: number,
        showThrust?: boolean,
        scale: number = 1.0,
        strafingLeft?: boolean,
        strafingRight?: boolean
    ): void {
        // Skip drawing if invulnerable and blinking (blink every 0.2 seconds)
        if (
            invulnerable &&
            invulnerableTime &&
            Math.floor(invulnerableTime * 5) % 2 === 0
        ) {
            return;
        }

        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(rotation);
        ctx.scale(scale, scale);

        ctx.strokeStyle = invulnerable ? "#ffff00" : color; // Yellow when invulnerable
        ctx.lineWidth = 2;
        ctx.beginPath();

        // Ship is a triangle pointing forward
        ctx.moveTo(10, 0); // nose
        ctx.lineTo(-8, -6); // back left
        ctx.lineTo(-5, 0); // back center
        ctx.lineTo(-8, 6); // back right
        ctx.closePath();

        ctx.stroke();

        // Draw main thrust flames if thrusting
        if (showThrust) {
            ctx.strokeStyle = "#ff6600"; // Orange flames
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
            ctx.strokeStyle = "#ff6600"; // Orange flames
            ctx.lineWidth = 1.5;
            ctx.beginPath();

            // Port thruster (left side) - flames point right, ship moves right
            const strafeFlameLength = 4 + Math.random() * 3;
            ctx.moveTo(-3, -8);
            ctx.lineTo(-3 + strafeFlameLength, -8 - strafeFlameLength);
            ctx.moveTo(-3, -8);
            ctx.lineTo(-3 + strafeFlameLength * 0.8, -8);

            ctx.stroke();
        }

        // Draw starboard (right) strafe thruster flames
        if (strafingRight) {
            ctx.strokeStyle = "#ff6600"; // Orange flames
            ctx.lineWidth = 1.5;
            ctx.beginPath();

            // Starboard thruster (right side) - flames point left, ship moves left
            const strafeFlameLength = 4 + Math.random() * 3;
            ctx.moveTo(-3, 8);
            ctx.lineTo(-3 - strafeFlameLength, 8 + strafeFlameLength);
            ctx.moveTo(-3, 8);
            ctx.lineTo(-3 - strafeFlameLength * 0.8, 8);

            ctx.stroke();
        }

        ctx.restore();
    }

    static drawAsteroid(
        ctx: CanvasRenderingContext2D,
        position: Vector2,
        rotation: number,
        size: Vector2,
        color: string
    ): void {
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

    static drawBullet(
        ctx: CanvasRenderingContext2D,
        position: Vector2,
        color: string
    ): void {
        ctx.save();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(position.x, position.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    static drawWarpBubble(
        ctx: CanvasRenderingContext2D,
        position: Vector2,
        animationProgress: number,
        isClosing: boolean = false,
        isDisappearing: boolean = false,
        disappearProgress: number = 0
    ): void {
        ctx.save();
        ctx.translate(position.x, position.y);

        // Calculate bubble size based on animation progress
        const maxRadius = 40;
        let radius;

        if (isDisappearing) {
            // Disappearing animation: shrink to nothing
            radius = maxRadius * (1 - disappearProgress);
        } else if (isClosing) {
            // Closing animation: shrink
            radius = maxRadius * (1 - animationProgress);
        } else {
            // Opening animation: grow
            radius = maxRadius * animationProgress;
        }

        if (radius > 0) {
            // Outer energy ring
            ctx.strokeStyle = "#00ffff";
            ctx.lineWidth = 3;
            ctx.globalAlpha =
                0.8 * (isClosing ? 1 - animationProgress : animationProgress);
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.stroke();

            // Inner pulsing core
            const coreRadius = radius * 0.3;
            const pulseIntensity = 0.5 + 0.5 * Math.sin(Date.now() * 0.01);

            ctx.fillStyle = "#00ffff";
            ctx.globalAlpha =
                0.3 *
                pulseIntensity *
                (isClosing ? 1 - animationProgress : animationProgress);
            ctx.beginPath();
            ctx.arc(0, 0, coreRadius, 0, Math.PI * 2);
            ctx.fill();

            // Energy sparkles around the ring
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2 + Date.now() * 0.005;
                const sparkleX = Math.cos(angle) * radius * 0.9;
                const sparkleY = Math.sin(angle) * radius * 0.9;

                ctx.fillStyle = "#ffffff";
                ctx.globalAlpha =
                    0.6 *
                    Math.random() *
                    (isDisappearing
                        ? 1 - disappearProgress
                        : isClosing
                          ? 1 - animationProgress
                          : animationProgress);
                ctx.beginPath();
                ctx.arc(sparkleX, sparkleY, 1, 0, Math.PI * 2);
                ctx.fill();
            }

            // Blinky collapse lines for disappearing animation
            if (isDisappearing) {
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 2;
                ctx.globalAlpha = 0.8 * (1 - disappearProgress);

                // Draw 6 lines collapsing toward the center
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2;
                    const lineLength = radius * (1 - disappearProgress * 0.5);
                    const startX = Math.cos(angle) * radius;
                    const startY = Math.sin(angle) * radius;
                    const endX = Math.cos(angle) * lineLength;
                    const endY = Math.sin(angle) * lineLength;

                    // Blink effect
                    if (Math.sin(Date.now() * 0.02 + i) > 0) {
                        ctx.beginPath();
                        ctx.moveTo(startX, startY);
                        ctx.lineTo(endX, endY);
                        ctx.stroke();
                    }
                }
            }
        }

        ctx.restore();
    }

    static drawGift(
        ctx: CanvasRenderingContext2D,
        position: Vector2,
        _rotation: number
    ): void {
        ctx.save();
        ctx.translate(position.x, position.y);

        // Gift appears as a bright yellow pulsing circle
        const pulseIntensity = 0.7 + 0.3 * Math.sin(Date.now() * 0.01);
        const radius = 10 * pulseIntensity;

        // Outer glow
        ctx.fillStyle = "#ffff00";
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(0, 0, radius + 5, 0, Math.PI * 2);
        ctx.fill();

        // Main bright circle
        ctx.fillStyle = "#ffff00";
        ctx.globalAlpha = 1.0;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        // Bright white center
        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha = pulseIntensity;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
