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

        // Draw Q key strafe flames (ship moves LEFT, so flames point RIGHT)
        if (strafingLeft) {
            ctx.strokeStyle = "#ff6600"; // Orange flames
            ctx.lineWidth = 1.5;
            ctx.beginPath();

            // Q key: Ship moves LEFT, so starboard thruster fires RIGHT-ward flames (aft)
            const strafeFlameLength = 4 + Math.random() * 3;
            ctx.moveTo(-3, 8); // Right side of ship
            ctx.lineTo(-3 - strafeFlameLength, 8 + strafeFlameLength);
            ctx.moveTo(-3, 8);
            ctx.lineTo(-3 - strafeFlameLength * 0.8, 8);

            ctx.stroke();
        }

        // Draw E key strafe flames (ship moves RIGHT, so flames point LEFT)
        if (strafingRight) {
            ctx.strokeStyle = "#ff6600"; // Orange flames
            ctx.lineWidth = 1.5;
            ctx.beginPath();

            // E key: Ship moves RIGHT, so port thruster fires LEFT-ward flames
            const strafeFlameLength = 4 + Math.random() * 3;
            ctx.moveTo(-3, -8); // Left side of ship
            ctx.lineTo(-3 - strafeFlameLength, -8 - strafeFlameLength);
            ctx.moveTo(-3, -8);
            ctx.lineTo(-3 - strafeFlameLength * 0.8, -8);

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

    static drawMissile(
        ctx: CanvasRenderingContext2D,
        position: Vector2,
        rotation: number,
        color: string
    ): void {
        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(rotation);

        // Draw thrust trail (behind missile)
        ctx.strokeStyle = "#ff6600"; // Orange
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();

        // Multiple flame trails for more dynamic effect
        const flameLength1 = 8 + Math.random() * 4;
        const flameLength2 = 6 + Math.random() * 3;

        ctx.moveTo(-6, -1);
        ctx.lineTo(-6 - flameLength1, -1);
        ctx.moveTo(-6, 1);
        ctx.lineTo(-6 - flameLength2, 1);
        ctx.moveTo(-6, 0);
        ctx.lineTo(-6 - (flameLength1 + flameLength2) / 2, 0);

        ctx.stroke();

        // Reset alpha for missile body
        ctx.globalAlpha = 1.0;

        // Draw missile body (sleek pointed shape)
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;

        // Main body - more aerodynamic shape (nose points right in 0-degree rotation)
        ctx.beginPath();
        ctx.moveTo(8, 0); // Sharp nose pointing right
        ctx.lineTo(6, -1.5);
        ctx.lineTo(2, -2);
        ctx.lineTo(-4, -2);
        ctx.lineTo(-6, -1);
        ctx.lineTo(-6, 1);
        ctx.lineTo(-4, 2);
        ctx.lineTo(2, 2);
        ctx.lineTo(6, 1.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw guidance fins (small triangular fins)
        ctx.fillStyle = "#ffaa44"; // Slightly lighter color for fins
        ctx.beginPath();
        // Top fin
        ctx.moveTo(-2, -2);
        ctx.lineTo(-1, -3);
        ctx.lineTo(-4, -2);
        ctx.closePath();
        ctx.fill();

        // Bottom fin
        ctx.beginPath();
        ctx.moveTo(-2, 2);
        ctx.lineTo(-1, 3);
        ctx.lineTo(-4, 2);
        ctx.closePath();
        ctx.fill();

        // Draw small engine nozzle
        ctx.fillStyle = "#444444";
        ctx.fillRect(-7, -1, 2, 2);

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
        _rotation: number,
        giftType?: string
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

        // Draw gift type icon if specified
        if (giftType) {
            ctx.globalAlpha = 1.0;
            const iconSize = 12;

            switch (giftType) {
                case "fuel_refill":
                    // Draw fuel icon (battery shape)
                    ctx.strokeStyle = "#00ff00";
                    ctx.lineWidth = 2;
                    ctx.strokeRect(
                        -iconSize / 3,
                        -iconSize / 2,
                        (iconSize * 2) / 3,
                        iconSize
                    );
                    ctx.strokeRect(
                        -iconSize / 3 + 2,
                        -iconSize / 2 - 2,
                        (iconSize * 2) / 3 - 4,
                        2
                    );
                    break;

                case "extra_life":
                    // Draw heart shape or ship icon
                    ctx.strokeStyle = "#ff00ff";
                    ctx.lineWidth = 2;
                    this.drawShip(
                        ctx,
                        new Vector2(0, 0),
                        0,
                        "#ff00ff",
                        false,
                        0,
                        false,
                        0.6
                    );
                    break;

                case "weapon_bullets":
                    this.drawWeaponIcon(
                        ctx,
                        new Vector2(0, 0),
                        "bullets",
                        "#ffff00",
                        iconSize
                    );
                    break;

                case "weapon_missiles":
                    this.drawWeaponIcon(
                        ctx,
                        new Vector2(0, 0),
                        "missiles",
                        "#ff8800",
                        iconSize
                    );
                    break;

                case "weapon_laser":
                    this.drawWeaponIcon(
                        ctx,
                        new Vector2(0, 0),
                        "laser",
                        "#ff0088",
                        iconSize
                    );
                    break;

                case "weapon_lightning":
                    this.drawWeaponIcon(
                        ctx,
                        new Vector2(0, 0),
                        "lightning",
                        "#00ffff",
                        iconSize
                    );
                    break;

                default:
                    // For upgrades, show the base weapon icon with a + symbol
                    if (giftType.startsWith("upgrade_bullets")) {
                        this.drawWeaponIcon(
                            ctx,
                            new Vector2(0, 0),
                            "bullets",
                            "#ffff88",
                            iconSize * 0.8
                        );
                        ctx.strokeStyle = "#ffffff";
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(-iconSize / 4, 0);
                        ctx.lineTo(iconSize / 4, 0);
                        ctx.moveTo(0, -iconSize / 4);
                        ctx.lineTo(0, iconSize / 4);
                        ctx.stroke();
                    } else if (giftType.startsWith("upgrade_missiles")) {
                        this.drawWeaponIcon(
                            ctx,
                            new Vector2(0, 0),
                            "missiles",
                            "#ffaa44",
                            iconSize * 0.8
                        );
                        ctx.strokeStyle = "#ffffff";
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(-iconSize / 4, 0);
                        ctx.lineTo(iconSize / 4, 0);
                        ctx.moveTo(0, -iconSize / 4);
                        ctx.lineTo(0, iconSize / 4);
                        ctx.stroke();
                    } else if (giftType.startsWith("upgrade_laser")) {
                        this.drawWeaponIcon(
                            ctx,
                            new Vector2(0, 0),
                            "laser",
                            "#ff44aa",
                            iconSize * 0.8
                        );
                        ctx.strokeStyle = "#ffffff";
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(-iconSize / 4, 0);
                        ctx.lineTo(iconSize / 4, 0);
                        ctx.moveTo(0, -iconSize / 4);
                        ctx.lineTo(0, iconSize / 4);
                        ctx.stroke();
                    } else if (giftType.startsWith("upgrade_lightning")) {
                        this.drawWeaponIcon(
                            ctx,
                            new Vector2(0, 0),
                            "lightning",
                            "#44ffff",
                            iconSize * 0.8
                        );
                        ctx.strokeStyle = "#ffffff";
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(-iconSize / 4, 0);
                        ctx.lineTo(iconSize / 4, 0);
                        ctx.moveTo(0, -iconSize / 4);
                        ctx.lineTo(0, iconSize / 4);
                        ctx.stroke();
                    }
                    break;
            }
        }

        ctx.restore();
    }

    // =============================================================================
    // WEAPON ICONS
    // =============================================================================

    static drawWeaponIcon(
        ctx: CanvasRenderingContext2D,
        position: Vector2,
        weaponType: string,
        color: string,
        size: number = 20
    ): void {
        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2;

        const halfSize = size / 2;

        switch (weaponType) {
            case "bullets":
                // Simple bullet icon - circle with a line
                ctx.beginPath();
                ctx.arc(0, 0, halfSize * 0.6, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(-halfSize * 0.8, 0);
                ctx.lineTo(-halfSize * 0.3, 0);
                ctx.stroke();
                break;

            case "missiles":
                // Missile icon - elongated shape with fins
                ctx.beginPath();
                ctx.moveTo(halfSize, 0);
                ctx.lineTo(-halfSize * 0.3, -halfSize * 0.3);
                ctx.lineTo(-halfSize, -halfSize * 0.2);
                ctx.lineTo(-halfSize, halfSize * 0.2);
                ctx.lineTo(-halfSize * 0.3, halfSize * 0.3);
                ctx.closePath();
                ctx.fill();
                break;

            case "laser":
                // Laser icon - beam with emanating lines
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(-halfSize, 0);
                ctx.lineTo(halfSize, 0);
                ctx.stroke();

                ctx.lineWidth = 1;
                for (let i = 0; i < 3; i++) {
                    const y = (i - 1) * halfSize * 0.4;
                    ctx.beginPath();
                    ctx.moveTo(-halfSize * 0.6, y);
                    ctx.lineTo(halfSize * 0.6, y);
                    ctx.stroke();
                }
                break;

            case "lightning":
                // Lightning icon - zigzag pattern
                ctx.beginPath();
                ctx.moveTo(-halfSize * 0.8, -halfSize * 0.6);
                ctx.lineTo(-halfSize * 0.2, -halfSize * 0.2);
                ctx.lineTo(-halfSize * 0.4, halfSize * 0.2);
                ctx.lineTo(halfSize * 0.2, -halfSize * 0.4);
                ctx.lineTo(halfSize * 0.8, halfSize * 0.6);
                ctx.stroke();
                break;

            default:
                // Unknown weapon - simple square
                ctx.strokeRect(
                    -halfSize * 0.6,
                    -halfSize * 0.6,
                    size * 1.2,
                    size * 1.2
                );
                break;
        }

        ctx.restore();
    }

    static drawWeaponHUD(
        ctx: CanvasRenderingContext2D,
        weapons: { type: string; unlocked: boolean; selected: boolean }[],
        position: Vector2,
        iconSize: number,
        spacing: number
    ): void {
        weapons.forEach((weapon, index) => {
            const iconPos = new Vector2(
                position.x,
                position.y + index * spacing
            );

            let color;
            if (!weapon.unlocked) {
                color = "#444444"; // Dark gray for locked
            } else if (weapon.selected) {
                color = "#ffffff"; // White for selected
            } else {
                color = "#888888"; // Gray for unlocked but not selected
            }

            // Draw weapon slot background
            ctx.save();
            ctx.translate(iconPos.x, iconPos.y);
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.strokeRect(
                -iconSize / 2 - 2,
                -iconSize / 2 - 2,
                iconSize + 4,
                iconSize + 4
            );
            ctx.restore();

            // Draw weapon icon if unlocked
            if (weapon.unlocked) {
                this.drawWeaponIcon(ctx, iconPos, weapon.type, color, iconSize);
            }

            // Draw number indicator
            ctx.save();
            ctx.fillStyle = color;
            ctx.font = "12px Orbitron, monospace";
            ctx.textAlign = "center";
            ctx.fillText(
                (index + 1).toString(),
                iconPos.x,
                iconPos.y + iconSize / 2 + 15
            );
            ctx.restore();
        });
    }
}
