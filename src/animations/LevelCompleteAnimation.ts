import type { GameState } from "~/game/GameState";
import { ANIMATIONS } from "~/config/constants";

export interface LevelCompleteStats {
    completedLevel: number;
    nextLevel: number;
    levelBonus: number;
    totalScore: number;
    completionTime: number; // Time in seconds to complete the level
}

export class LevelCompleteAnimation {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private gameState: GameState;
    private isActive = false;
    private startTime = 0;
    private stats: LevelCompleteStats | null = null;
    private canDismiss = false; // True when text is fully visible and readable

    constructor(
        canvas: HTMLCanvasElement,
        ctx: CanvasRenderingContext2D,
        gameState: GameState
    ) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.gameState = gameState;
    }

    /**
     * Start the level complete animation
     */
    start(completedLevel: number, completionTime: number): void {
        this.isActive = true;
        this.startTime = performance.now();

        // Calculate level completion stats
        const levelBonus = this.calculateLevelBonus(completedLevel);
        this.stats = {
            completedLevel: completedLevel,
            nextLevel: completedLevel + 1,
            levelBonus: levelBonus,
            totalScore: this.gameState.score + levelBonus,
            completionTime: completionTime,
        };

        // Award level bonus
        if (levelBonus > 0) {
            this.gameState.addScore(levelBonus);
        }
    }

    /**
     * Update animation state
     */
    update(currentTime: number): void {
        if (!this.isActive) return;

        const elapsed = currentTime - this.startTime;

        // Enable dismissal when stats are fully displayed
        const statsPhaseStart =
            ANIMATIONS.LEVEL_COMPLETE_PHASES.PAUSE +
            ANIMATIONS.LEVEL_COMPLETE_PHASES.TITLE;
        if (elapsed >= statsPhaseStart + 500) {
            // 500ms after stats start appearing
            this.canDismiss = true;
        }

        // No automatic timeout - only manual dismissal via space key
    }

    /**
     * Render the animation overlay
     */
    render(): void {
        if (!this.isActive || !this.stats) return;

        const elapsed = performance.now() - this.startTime;
        const width = this.canvas.width;
        const height = this.canvas.height;

        this.ctx.save();

        // Draw semi-transparent black background for better text legibility
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        this.ctx.fillRect(0, 0, width, height);

        // Phase 1: Initial pause - just subtle screen effect
        if (elapsed < ANIMATIONS.LEVEL_COMPLETE_PHASES.PAUSE) {
            this.renderScreenFlash(
                elapsed / ANIMATIONS.LEVEL_COMPLETE_PHASES.PAUSE
            );
        }
        // Phase 2: "LEVEL COMPLETE" title
        else if (
            elapsed <
            ANIMATIONS.LEVEL_COMPLETE_PHASES.PAUSE +
                ANIMATIONS.LEVEL_COMPLETE_PHASES.TITLE
        ) {
            const phaseElapsed =
                elapsed - ANIMATIONS.LEVEL_COMPLETE_PHASES.PAUSE;
            this.renderTitle(
                phaseElapsed,
                ANIMATIONS.LEVEL_COMPLETE_PHASES.TITLE,
                width,
                height
            );
        }
        // Phase 3: Stats display
        else if (
            elapsed <
            ANIMATIONS.LEVEL_COMPLETE_PHASES.PAUSE +
                ANIMATIONS.LEVEL_COMPLETE_PHASES.TITLE +
                ANIMATIONS.LEVEL_COMPLETE_PHASES.STATS
        ) {
            const phaseElapsed =
                elapsed -
                ANIMATIONS.LEVEL_COMPLETE_PHASES.PAUSE -
                ANIMATIONS.LEVEL_COMPLETE_PHASES.TITLE;
            this.renderTitle(
                ANIMATIONS.LEVEL_COMPLETE_PHASES.TITLE,
                ANIMATIONS.LEVEL_COMPLETE_PHASES.TITLE,
                width,
                height
            ); // Keep title visible
            this.renderStats(
                phaseElapsed,
                ANIMATIONS.LEVEL_COMPLETE_PHASES.STATS,
                width,
                height
            );
        }
        // Phase 4: Final phase - hold all text visible until manual dismissal
        else {
            this.renderTitle(
                ANIMATIONS.LEVEL_COMPLETE_PHASES.TITLE,
                ANIMATIONS.LEVEL_COMPLETE_PHASES.TITLE,
                width,
                height
            ); // Keep title visible
            this.renderStats(
                ANIMATIONS.LEVEL_COMPLETE_PHASES.STATS,
                ANIMATIONS.LEVEL_COMPLETE_PHASES.STATS,
                width,
                height
            );

            // Add dismissal hint
            this.renderDismissalHint(width, height);
        }

        this.ctx.restore();
    }

    /**
     * Check if animation is currently active
     */
    get active(): boolean {
        return this.isActive;
    }

    /**
     * Check if animation can be dismissed early
     */
    get canBeDismissed(): boolean {
        return this.canDismiss;
    }

    /**
     * Force complete the animation
     */
    complete(): void {
        this.isActive = false;
        this.stats = null;
        this.canDismiss = false;
    }

    /**
     * Calculate level completion bonus
     */
    private calculateLevelBonus(level: number): number {
        return ANIMATIONS.LEVEL_BONUS_MULTIPLIER * level;
    }

    /**
     * Format time in seconds to a readable format
     */
    private formatTime(seconds: number): string {
        // Round to 1 decimal place for cleaner display
        return seconds.toFixed(1);
    }

    /**
     * Render subtle screen flash effect
     */
    private renderScreenFlash(progress: number): void {
        // Subtle flash that fades in and out
        const intensity = Math.sin(progress * Math.PI) * 0.1;
        this.ctx.fillStyle = `rgba(0, 255, 0, ${intensity})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Render the "LEVEL COMPLETE" title with typewriter effect
     */
    private renderTitle(
        elapsed: number,
        duration: number,
        width: number,
        height: number
    ): void {
        const text = `LEVEL ${this.stats?.completedLevel} COMPLETE`;
        const centerY = height / 2 - 50;

        // Typewriter effect - reveal characters over time
        const progress = Math.min(
            1,
            elapsed / (duration * ANIMATIONS.TYPEWRITER_SPEED_RATIO)
        );
        const visibleChars = Math.floor(progress * text.length);
        const visibleText = text.substring(0, visibleChars);

        // Pulsing effect after typing is complete
        const pulsePhase = Math.max(
            0,
            elapsed - duration * ANIMATIONS.TYPEWRITER_SPEED_RATIO
        );
        const pulseIntensity =
            Math.sin((pulsePhase / ANIMATIONS.PULSE_FREQUENCY) * Math.PI) *
                0.3 +
            0.7; // Pulse between 0.4 and 1.0

        this.ctx.font = "bold 36px Orbitron, monospace";
        this.ctx.textAlign = "center";
        this.ctx.fillStyle = `rgba(0, 255, 0, ${pulseIntensity})`;

        // Add glow effect
        this.ctx.shadowColor = "#00ff00";
        this.ctx.shadowBlur = 20;

        this.ctx.fillText(visibleText, width / 2, centerY);

        // Reset shadow
        this.ctx.shadowBlur = 0;

        // Cursor blink while typing
        if (
            progress < 1 &&
            Math.floor(elapsed / ANIMATIONS.PULSE_FREQUENCY) % 2 === 0
        ) {
            const textWidth = this.ctx.measureText(visibleText).width;
            this.ctx.fillText("_", width / 2 + textWidth / 2 + 10, centerY);
        }
    }

    /**
     * Render level statistics
     */
    private renderStats(
        elapsed: number,
        duration: number,
        width: number,
        height: number
    ): void {
        if (!this.stats) return;

        const centerY = height / 2 + 20;
        const lineHeight = 40;
        const progress = Math.min(1, elapsed / duration);

        this.ctx.font = "18px Orbitron, monospace";
        this.ctx.textAlign = "center";
        this.ctx.fillStyle = "#00ff00";

        // Stats appear one by one - format as requested
        const statsLines = [
            `BONUS: ${this.stats.levelBonus}`,
            `${this.formatTime(this.stats.completionTime)} SECONDS`,
        ];

        statsLines.forEach((line, index) => {
            const lineProgress = Math.max(0, progress * 2 - index); // Stagger appearance
            if (lineProgress > 0) {
                const alpha = Math.min(1, lineProgress);
                this.ctx.globalAlpha = alpha;
                this.ctx.fillText(
                    line,
                    width / 2,
                    centerY + index * lineHeight
                );
                this.ctx.globalAlpha = 1;
            }
        });

        // Draw decorative border
        if (progress > ANIMATIONS.BORDER_APPEAR_DELAY) {
            const borderAlpha = Math.min(
                1,
                (progress - ANIMATIONS.BORDER_APPEAR_DELAY) * 2
            );
            this.ctx.globalAlpha = borderAlpha;
            this.renderDecoratitiveBorder(width, height);
            this.ctx.globalAlpha = 1;
        }
    }

    /**
     * Render dismissal hint for the player
     */
    private renderDismissalHint(width: number, height: number): void {
        // Position below the decorative border
        // Border: starts at centerY - 30, height 200px, so ends at centerY + 170
        const centerY = height / 2;
        const borderEndY = centerY + 170; // Bottom of the dashed green border
        const hintY = borderEndY + 30; // 30px below the border

        // Pulsing "PRESS SPACE TO CONTINUE" text (more prominent since it's the only way to proceed)
        const pulseIntensity = Math.sin(Date.now() * 0.008) * 0.3 + 0.7; // More visible pulsing

        this.ctx.font = "18px Orbitron, monospace";
        this.ctx.textAlign = "center";
        this.ctx.fillStyle = `rgba(255, 255, 0, ${pulseIntensity})`;

        // Add subtle glow effect
        this.ctx.shadowColor = "#ffff00";
        this.ctx.shadowBlur = 10;

        this.ctx.fillText("PRESS SPACE TO CONTINUE", width / 2, hintY);

        // Reset shadow
        this.ctx.shadowBlur = 0;
    }

    /**
     * Render decorative border around stats
     */
    private renderDecoratitiveBorder(width: number, height: number): void {
        const centerY = height / 2;
        const borderWidth = 300;
        const borderHeight = 200;
        const borderX = (width - borderWidth) / 2;
        const borderY = centerY - 30;

        this.ctx.strokeStyle = "#00ff00";
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 5]);
        this.ctx.strokeRect(borderX, borderY, borderWidth, borderHeight);
        this.ctx.setLineDash([]); // Reset dash pattern

        // Corner decorations
        const cornerSize = 20;
        const corners = [
            [borderX, borderY], // Top-left
            [borderX + borderWidth, borderY], // Top-right
            [borderX, borderY + borderHeight], // Bottom-left
            [borderX + borderWidth, borderY + borderHeight], // Bottom-right
        ];

        corners.forEach(([x, y]) => {
            this.ctx.beginPath();
            this.ctx.moveTo(x + (x === borderX ? 0 : -cornerSize), y);
            this.ctx.lineTo(x + (x === borderX ? cornerSize : 0), y);
            this.ctx.moveTo(x, y + (y === borderY ? 0 : -cornerSize));
            this.ctx.lineTo(x, y + (y === borderY ? cornerSize : 0));
            this.ctx.stroke();
        });
    }
}
