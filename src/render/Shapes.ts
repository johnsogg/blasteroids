import { Vector2 } from "~/utils/Vector2";
import { ScaleManager } from "~/utils/ScaleManager";
import { TrailPoint } from "~/entities/Ship";
import { WARP_BUBBLE, MESSAGE } from "~/config/constants";
import type { Message } from "~/entities/Message";

// Base ship coordinates (reference dimensions)
const SHIP_BASE_COORDS = {
    // Ship is a triangle pointing forward (right in 0-degree rotation)
    NOSE: new Vector2(10, 0),
    BACK_LEFT: new Vector2(-8, -6),
    BACK_CENTER: new Vector2(-5, 0),
    BACK_RIGHT: new Vector2(-8, 6),

    // Thrust flame positions and sizes
    THRUST_BASE_X: -8,
    THRUST_BASE_LEFT_Y: -3,
    THRUST_BASE_RIGHT_Y: 3,
    THRUST_MIN_LENGTH: 8,
    THRUST_MAX_LENGTH: 14,

    // Strafe thrust positions
    STRAFE_BASE_X: -3,
    STRAFE_LEFT_Y: 8, // Right side of ship (for leftward movement)
    STRAFE_RIGHT_Y: -8, // Left side of ship (for rightward movement)
    STRAFE_MIN_LENGTH: 4,
    STRAFE_MAX_LENGTH: 7,
};

export class Shapes {
    static drawShip({
        ctx,
        position,
        rotation,
        color,
        invulnerable = false,
        invulnerableTime = 0,
        showThrust = false,
        scale = 1.0,
        strafingLeft = false,
        strafingRight = false,
        trail,
        scaleManager,
    }: {
        ctx: CanvasRenderingContext2D;
        position: Vector2;
        rotation: number;
        color: string;
        invulnerable?: boolean;
        invulnerableTime?: number;
        showThrust?: boolean;
        scale?: number;
        strafingLeft?: boolean;
        strafingRight?: boolean;
        trail?: TrailPoint[];
        scaleManager?: ScaleManager;
    }): void {
        // Draw trail first (behind ship)
        if (trail && trail.length > 1) {
            this.drawShipTrail(ctx, trail, color);
        }

        // Skip drawing if invulnerable and blinking (blink every 0.2 seconds)
        if (
            invulnerable &&
            invulnerableTime &&
            Math.floor(invulnerableTime * 5) % 2 === 0
        ) {
            return;
        }

        // Get scaling factor
        const displayScale = scaleManager ? scaleManager.getScale() : 1.0;
        const combinedScale = scale * displayScale;

        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(rotation);
        ctx.scale(combinedScale, combinedScale);

        ctx.strokeStyle = invulnerable ? "#ffff00" : color; // Yellow when invulnerable
        ctx.lineWidth = scaleManager ? scaleManager.scaleValue(2) : 2;
        ctx.beginPath();

        // Ship is a triangle pointing forward - use scaled coordinates
        const nose = scaleManager
            ? scaleManager.scaleVector(SHIP_BASE_COORDS.NOSE)
            : SHIP_BASE_COORDS.NOSE;
        const backLeft = scaleManager
            ? scaleManager.scaleVector(SHIP_BASE_COORDS.BACK_LEFT)
            : SHIP_BASE_COORDS.BACK_LEFT;
        const backCenter = scaleManager
            ? scaleManager.scaleVector(SHIP_BASE_COORDS.BACK_CENTER)
            : SHIP_BASE_COORDS.BACK_CENTER;
        const backRight = scaleManager
            ? scaleManager.scaleVector(SHIP_BASE_COORDS.BACK_RIGHT)
            : SHIP_BASE_COORDS.BACK_RIGHT;

        ctx.moveTo(nose.x, nose.y);
        ctx.lineTo(backLeft.x, backLeft.y);
        ctx.lineTo(backCenter.x, backCenter.y);
        ctx.lineTo(backRight.x, backRight.y);
        ctx.closePath();

        ctx.stroke();

        // Draw main thrust flames if thrusting
        if (showThrust) {
            ctx.strokeStyle = "#ff6600"; // Orange flames
            ctx.lineWidth = scaleManager ? scaleManager.scaleValue(2) : 2;
            ctx.beginPath();

            // Main thrust flames - random length for flicker effect
            const baseFlameLength =
                SHIP_BASE_COORDS.THRUST_MIN_LENGTH +
                Math.random() *
                    (SHIP_BASE_COORDS.THRUST_MAX_LENGTH -
                        SHIP_BASE_COORDS.THRUST_MIN_LENGTH);
            const flameLength = scaleManager
                ? scaleManager.scaleValue(baseFlameLength)
                : baseFlameLength;

            const thrustBaseX = scaleManager
                ? scaleManager.scaleValue(SHIP_BASE_COORDS.THRUST_BASE_X)
                : SHIP_BASE_COORDS.THRUST_BASE_X;
            const thrustLeftY = scaleManager
                ? scaleManager.scaleValue(SHIP_BASE_COORDS.THRUST_BASE_LEFT_Y)
                : SHIP_BASE_COORDS.THRUST_BASE_LEFT_Y;
            const thrustRightY = scaleManager
                ? scaleManager.scaleValue(SHIP_BASE_COORDS.THRUST_BASE_RIGHT_Y)
                : SHIP_BASE_COORDS.THRUST_BASE_RIGHT_Y;

            ctx.moveTo(thrustBaseX, thrustLeftY);
            ctx.lineTo(thrustBaseX - flameLength, 0);
            ctx.lineTo(thrustBaseX, thrustRightY);

            ctx.stroke();
        }

        // Draw Q key strafe flames (ship moves LEFT, so flames point RIGHT)
        if (strafingLeft) {
            ctx.strokeStyle = "#ff6600"; // Orange flames
            ctx.lineWidth = scaleManager ? scaleManager.scaleValue(1.5) : 1.5;
            ctx.beginPath();

            // Q key: Ship moves LEFT, so starboard thruster fires RIGHT-ward flames (aft)
            const baseStrafeLength =
                SHIP_BASE_COORDS.STRAFE_MIN_LENGTH +
                Math.random() *
                    (SHIP_BASE_COORDS.STRAFE_MAX_LENGTH -
                        SHIP_BASE_COORDS.STRAFE_MIN_LENGTH);
            const strafeFlameLength = scaleManager
                ? scaleManager.scaleValue(baseStrafeLength)
                : baseStrafeLength;

            const strafeBaseX = scaleManager
                ? scaleManager.scaleValue(SHIP_BASE_COORDS.STRAFE_BASE_X)
                : SHIP_BASE_COORDS.STRAFE_BASE_X;
            const strafeLeftY = scaleManager
                ? scaleManager.scaleValue(SHIP_BASE_COORDS.STRAFE_LEFT_Y)
                : SHIP_BASE_COORDS.STRAFE_LEFT_Y;

            ctx.moveTo(strafeBaseX, strafeLeftY); // Right side of ship
            ctx.lineTo(
                strafeBaseX - strafeFlameLength,
                strafeLeftY + strafeFlameLength
            );
            ctx.moveTo(strafeBaseX, strafeLeftY);
            ctx.lineTo(strafeBaseX - strafeFlameLength * 0.8, strafeLeftY);

            ctx.stroke();
        }

        // Draw E key strafe flames (ship moves RIGHT, so flames point LEFT)
        if (strafingRight) {
            ctx.strokeStyle = "#ff6600"; // Orange flames
            ctx.lineWidth = scaleManager ? scaleManager.scaleValue(1.5) : 1.5;
            ctx.beginPath();

            // E key: Ship moves RIGHT, so port thruster fires LEFT-ward flames
            const baseStrafeLength =
                SHIP_BASE_COORDS.STRAFE_MIN_LENGTH +
                Math.random() *
                    (SHIP_BASE_COORDS.STRAFE_MAX_LENGTH -
                        SHIP_BASE_COORDS.STRAFE_MIN_LENGTH);
            const strafeFlameLength = scaleManager
                ? scaleManager.scaleValue(baseStrafeLength)
                : baseStrafeLength;

            const strafeBaseX = scaleManager
                ? scaleManager.scaleValue(SHIP_BASE_COORDS.STRAFE_BASE_X)
                : SHIP_BASE_COORDS.STRAFE_BASE_X;
            const strafeRightY = scaleManager
                ? scaleManager.scaleValue(SHIP_BASE_COORDS.STRAFE_RIGHT_Y)
                : SHIP_BASE_COORDS.STRAFE_RIGHT_Y;

            ctx.moveTo(strafeBaseX, strafeRightY); // Left side of ship
            ctx.lineTo(
                strafeBaseX - strafeFlameLength,
                strafeRightY - strafeFlameLength
            );
            ctx.moveTo(strafeBaseX, strafeRightY);
            ctx.lineTo(strafeBaseX - strafeFlameLength * 0.8, strafeRightY);

            ctx.stroke();
        }

        ctx.restore();
    }

    static drawAsteroid({
        ctx,
        position,
        rotation,
        size,
        color,
        scale = 1.0,
        scaleManager,
    }: {
        ctx: CanvasRenderingContext2D;
        position: Vector2;
        rotation: number;
        size: Vector2;
        color: string;
        scale?: number;
        scaleManager?: ScaleManager;
    }): void {
        // Get scaling factor
        const displayScale = scaleManager ? scaleManager.getScale() : 1.0;
        const combinedScale = scale * displayScale;

        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(rotation);
        ctx.scale(combinedScale, combinedScale);

        ctx.strokeStyle = color;
        ctx.lineWidth = scaleManager ? scaleManager.scaleValue(1.5) : 1.5;
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

    static drawBullet({
        ctx,
        position,
        color,
        scale = 1.0,
        scaleManager,
    }: {
        ctx: CanvasRenderingContext2D;
        position: Vector2;
        color: string;
        scale?: number;
        scaleManager?: ScaleManager;
    }): void {
        // Get scaling factor
        const displayScale = scaleManager ? scaleManager.getScale() : 1.0;
        const combinedScale = scale * displayScale;
        const radius = scaleManager ? scaleManager.scaleValue(2) : 2;

        ctx.save();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(position.x, position.y, radius * combinedScale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    static drawMissile({
        ctx,
        position,
        rotation,
        color,
        scale = 1.0,
        scaleManager,
    }: {
        ctx: CanvasRenderingContext2D;
        position: Vector2;
        rotation: number;
        color: string;
        scale?: number;
        scaleManager?: ScaleManager;
    }): void {
        // Get scaling factor
        const displayScale = scaleManager ? scaleManager.getScale() : 1.0;
        const combinedScale = scale * displayScale;

        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(rotation);
        ctx.scale(combinedScale, combinedScale);

        // Draw thrust trail (behind missile)
        ctx.strokeStyle = "#ff6600"; // Orange
        ctx.lineWidth = scaleManager ? scaleManager.scaleValue(3) : 3;
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
        ctx.lineWidth = scaleManager ? scaleManager.scaleValue(1) : 1;

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

    static drawWarpBubble({
        ctx,
        position,
        animationProgress,
        isClosing = false,
        isDisappearing = false,
        disappearProgress = 0,
        scale = 1.0,
        scaleManager,
    }: {
        ctx: CanvasRenderingContext2D;
        position: Vector2;
        animationProgress: number;
        isClosing?: boolean;
        isDisappearing?: boolean;
        disappearProgress?: number;
        scale?: number;
        scaleManager?: ScaleManager;
    }): void {
        // Get scaling factor
        const displayScale = scaleManager ? scaleManager.getScale() : 1.0;
        const combinedScale = scale * displayScale;

        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.scale(combinedScale, combinedScale);

        // Calculate bubble size based on animation progress
        const maxRadius = scaleManager
            ? scaleManager.scaleValue(WARP_BUBBLE.RADIUS)
            : WARP_BUBBLE.RADIUS;
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
            for (let i = 0; i < WARP_BUBBLE.SPARKLE_COUNT; i++) {
                const angle =
                    (i / WARP_BUBBLE.SPARKLE_COUNT) * Math.PI * 2 +
                    Date.now() * 0.005;
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
                ctx.lineWidth = scaleManager ? scaleManager.scaleValue(2) : 2;
                ctx.globalAlpha = 0.8 * (1 - disappearProgress);

                // Draw collapse lines toward the center
                for (let i = 0; i < WARP_BUBBLE.COLLAPSE_LINES; i++) {
                    const angle =
                        (i / WARP_BUBBLE.COLLAPSE_LINES) * Math.PI * 2;
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

    static drawGift({
        ctx,
        position,
        giftType,
        scale = 1.0,
        scaleManager,
    }: {
        ctx: CanvasRenderingContext2D;
        position: Vector2;
        giftType?: string;
        scale?: number;
        scaleManager?: ScaleManager;
    }): void {
        // Get scaling factor
        const displayScale = scaleManager ? scaleManager.getScale() : 1.0;
        const combinedScale = scale * displayScale;

        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.scale(combinedScale, combinedScale);

        // Gift appears as a bright yellow pulsing circle
        const pulseIntensity = 0.7 + 0.3 * Math.sin(Date.now() * 0.01);
        const baseRadius = scaleManager ? scaleManager.scaleValue(10) : 10;
        const radius = baseRadius * pulseIntensity;

        // Outer glow
        ctx.fillStyle = "#ffff00";
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        const glowRadius =
            radius + (scaleManager ? scaleManager.scaleValue(5) : 5);
        ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
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
            const iconSize = scaleManager ? scaleManager.scaleValue(12) : 12;

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
                    this.drawShip({
                        ctx,
                        position: new Vector2(0, 0),
                        rotation: 0,
                        color: "#ff00ff",
                        invulnerable: false,
                        invulnerableTime: 0,
                        showThrust: false,
                        scale: 0.6,
                    });
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

    /**
     * Draw a laser beam from ship position
     */
    static drawLaser(
        ctx: CanvasRenderingContext2D,
        startPosition: Vector2,
        rotation: number,
        length: number,
        color: string = "#ff0088",
        width: number = 3
    ): void {
        ctx.save();

        // Calculate end position
        const endPosition = startPosition.add(
            Vector2.fromAngle(rotation, length)
        );

        // Draw main laser beam with glow effect
        ctx.lineCap = "round";

        // Draw outer glow
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = color;
        ctx.lineWidth = width * 3;
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(startPosition.x, startPosition.y);
        ctx.lineTo(endPosition.x, endPosition.y);
        ctx.stroke();

        // Draw main beam
        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.moveTo(startPosition.x, startPosition.y);
        ctx.lineTo(endPosition.x, endPosition.y);
        ctx.stroke();

        // Draw bright core
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = width * 0.3;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(startPosition.x, startPosition.y);
        ctx.lineTo(endPosition.x, endPosition.y);
        ctx.stroke();

        ctx.restore();
    }

    static drawLightning(
        ctx: CanvasRenderingContext2D,
        lightningTargets: { start: Vector2; end: Vector2 }[],
        lightningTime: number,
        currentTime: number,
        color: string = "#00ffff",
        width: number = 2
    ): void {
        // Only show lightning for a brief moment (200ms)
        const lightningDuration = 200;
        if (currentTime - lightningTime > lightningDuration) {
            return;
        }

        ctx.save();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // Draw each lightning arc
        for (let i = 0; i < lightningTargets.length; i++) {
            const { start, end } = lightningTargets[i];

            // Reduce intensity for chain lightning
            const intensity = i === 0 ? 1.0 : 0.7 - i * 0.1;
            const arcColor = i === 0 ? color : this.dimColor(color, intensity);

            this.drawLightningArc(ctx, start, end, arcColor, width * intensity);
        }

        ctx.restore();
    }

    private static drawLightningArc(
        ctx: CanvasRenderingContext2D,
        start: Vector2,
        end: Vector2,
        color: string,
        width: number
    ): void {
        // Generate jagged lightning path
        const points = this.generateLightningPath(start, end);

        // Draw outer glow
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = color;
        ctx.lineWidth = width * 4;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        this.drawPath(ctx, points);

        // Draw main arc
        ctx.globalAlpha = 0.8;
        ctx.lineWidth = width * 2;
        ctx.shadowBlur = 5;
        this.drawPath(ctx, points);

        // Draw bright core
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = width * 0.5;
        ctx.shadowBlur = 0;
        this.drawPath(ctx, points);
    }

    private static generateLightningPath(
        start: Vector2,
        end: Vector2
    ): Vector2[] {
        const points: Vector2[] = [start];

        // Calculate the direction and distance
        const direction = end.subtract(start);
        const distance = direction.magnitude();
        const segments = Math.max(3, Math.floor(distance / 15)); // One segment per 15 pixels

        const unitDirection = direction.multiply(1 / distance);
        const perpendicular = new Vector2(-unitDirection.y, unitDirection.x);

        // Generate intermediate points with random offsets
        for (let i = 1; i < segments; i++) {
            const progress = i / segments;
            const basePoint = start.add(direction.multiply(progress));

            // Random offset perpendicular to the line
            const maxOffset = 15 * Math.sin(progress * Math.PI); // Arc shape
            const offset = (Math.random() - 0.5) * maxOffset;
            const jaggedPoint = basePoint.add(perpendicular.multiply(offset));

            points.push(jaggedPoint);
        }

        points.push(end);
        return points;
    }

    private static drawPath(
        ctx: CanvasRenderingContext2D,
        points: Vector2[]
    ): void {
        if (points.length < 2) return;

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }

        ctx.stroke();
    }

    private static dimColor(color: string, intensity: number): string {
        // Simple color dimming for chain lightning
        if (color === "#00ffff") {
            const alpha = Math.floor(255 * intensity)
                .toString(16)
                .padStart(2, "0");
            return `#00ffff${alpha}`;
        }
        return color;
    }

    static drawShipTrail(
        ctx: CanvasRenderingContext2D,
        trail: TrailPoint[],
        _color: string
    ): void {
        if (trail.length < 1) return;

        ctx.save();

        // Draw trail particles (circles) from oldest to newest
        for (const point of trail) {
            const alpha = point.opacity;
            if (alpha <= 0.01) continue;

            // Convert HSL to RGB for the particle color
            const saturation = 80; // Rich orange saturation
            const lightness =
                50 + Math.sin(Date.now() * 0.003 + point.hue) * 10; // Subtle flicker
            const color = this.hslToRgb(point.hue, saturation, lightness);

            // Set particle color with alpha
            ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;

            // Add glow effect for larger particles (adjusted threshold for smaller particles)
            if (point.size > 1.5) {
                ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.3})`;
                ctx.shadowBlur = point.size * 1.5;
            } else {
                ctx.shadowBlur = 0;
            }

            // Draw particle as a circle
            ctx.beginPath();
            ctx.arc(
                point.position.x,
                point.position.y,
                point.size,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }

        ctx.restore();
    }

    private static hslToRgb(
        h: number,
        s: number,
        l: number
    ): { r: number; g: number; b: number } {
        h = h % 360;
        s = Math.max(0, Math.min(100, s)) / 100;
        l = Math.max(0, Math.min(100, l)) / 100;

        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        const m = l - c / 2;

        let r = 0,
            g = 0,
            b = 0;

        if (0 <= h && h < 60) {
            r = c;
            g = x;
            b = 0;
        } else if (60 <= h && h < 120) {
            r = x;
            g = c;
            b = 0;
        } else if (120 <= h && h < 180) {
            r = 0;
            g = c;
            b = x;
        } else if (180 <= h && h < 240) {
            r = 0;
            g = x;
            b = c;
        } else if (240 <= h && h < 300) {
            r = x;
            g = 0;
            b = c;
        } else if (300 <= h && h < 360) {
            r = c;
            g = 0;
            b = x;
        }

        return {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255),
        };
    }

    /**
     * Draw an animated message with rainbow colors, scaling, and fading
     */
    static drawAnimatedMessage(
        ctx: CanvasRenderingContext2D,
        message: Message,
        scaleManager?: ScaleManager
    ): void {
        ctx.save();

        // Apply scaling
        const displayScale = scaleManager ? scaleManager.getScale() : 1.0;
        const totalScale = message.currentScale * displayScale;

        // Position and scale
        ctx.translate(message.currentPosition.x, message.currentPosition.y);
        ctx.scale(totalScale, totalScale);

        // Set font
        const fontSize = scaleManager
            ? scaleManager.scaleValue(MESSAGE.FONT_SIZE)
            : MESSAGE.FONT_SIZE;
        ctx.font = `${MESSAGE.FONT_WEIGHT} ${fontSize}px ${MESSAGE.FONT_FAMILY}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Convert HSL to RGB for rainbow effect
        const color = this.hslToRgb(
            message.currentHue,
            MESSAGE.SATURATION,
            MESSAGE.LIGHTNESS
        );

        // Apply opacity to both fill and stroke
        const fillColor = `rgba(${color.r}, ${color.g}, ${color.b}, ${message.currentOpacity})`;
        const strokeColor = `rgba(0, 0, 0, ${message.currentOpacity})`;

        // Draw text stroke (outline) for readability
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = scaleManager
            ? scaleManager.scaleValue(MESSAGE.STROKE_WIDTH)
            : MESSAGE.STROKE_WIDTH;
        ctx.strokeText(message.text, 0, 0);

        // Draw text fill
        ctx.fillStyle = fillColor;
        ctx.fillText(message.text, 0, 0);

        ctx.restore();
    }

    /**
     * Draw all active messages
     */
    static drawActiveMessages(
        ctx: CanvasRenderingContext2D,
        messages: readonly Message[],
        scaleManager?: ScaleManager
    ): void {
        for (const message of messages) {
            this.drawAnimatedMessage(ctx, message, scaleManager);
        }
    }
}
