import { Vector2 } from "~/utils/Vector2";
import { CURRENCY, UI } from "~/config/constants";
import { Shapes } from "~/render/Shapes";

export interface HUDElement {
    position: Vector2;
    text: string;
    color: string;
    font: string;
    align: CanvasTextAlign;
}

export interface ScoreStatus {
    status: "normal" | "near-high" | "new-high";
    color: string;
}

export class HUDRenderer {
    private ctx: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    /**
     * Format numbers with retro-style spacing for visual appeal
     */
    private formatRetroNumber(value: string): string {
        return value.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }

    /**
     * Get color based on score status
     */
    private getScoreColor(status: "normal" | "near-high" | "new-high"): string {
        switch (status) {
            case "new-high":
                return "#00ff00"; // Green
            case "near-high":
                return "#ffff00"; // Yellow
            default:
                return "#ffffff"; // White
        }
    }

    /**
     * Get color based on timer remaining
     */
    private getTimerColor(timeRemaining: number): string {
        if (timeRemaining <= 10) {
            return "#ff0000"; // Red for critical time
        } else if (timeRemaining <= 20) {
            return "#ffff00"; // Yellow for warning
        }
        return "#ffffff"; // White for normal
    }

    /**
     * Render text with specified styling
     */
    private renderText(
        text: string,
        x: number,
        y: number,
        color: string,
        font: string,
        align: CanvasTextAlign = "left",
        withGlow: boolean = false
    ): void {
        this.ctx.save();
        this.ctx.font = font;
        this.ctx.textAlign = align;

        // Add glow effect for certain elements
        if (withGlow) {
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 10;
        }

        this.ctx.fillStyle = color;
        this.ctx.fillText(text, x, y);
        this.ctx.restore();
    }

    /**
     * Render score display
     */
    renderScore(
        score: number,
        status: "normal" | "near-high" | "new-high",
        canvasWidth: number
    ): void {
        const formattedScore = this.formatRetroNumber(score.toString());
        const color = this.getScoreColor(status);
        const x = canvasWidth - 20; // Right side with padding
        const y = 30; // Top area

        // Value with retro styling and glow
        this.renderText(
            formattedScore,
            x,
            y,
            color,
            'bold 36px "Orbitron", "Courier New", monospace',
            "right",
            true
        );
    }

    /**
     * Render lives display using ship icons
     */
    renderLives(lives: number): void {
        const maxLives = UI.MAX_LIVES_DISPLAY;
        const spacing = UI.LIVES_SPACING;
        const startX = 20; // Left side with padding
        const y = 20; // Top area
        const rotation = UI.LIVES_ROTATION;

        // Label with retro styling
        this.renderText(
            "LIVES",
            startX,
            y,
            "#888888",
            '18px "Orbitron", "Courier New", monospace'
        );

        // Ship icons
        for (let i = 0; i < maxLives; i++) {
            const x = startX + i * spacing;
            const iconY = y + 30; // More space below label
            const position = new Vector2(x, iconY);
            const color = i < lives ? "#00ff00" : "#888888";

            // Draw ship icon using Shapes.drawShip
            Shapes.drawShip({
                ctx: this.ctx,
                position,
                rotation,
                color,
                invulnerable: false,
                invulnerableTime: 0,
                showThrust: false,
                scale: UI.LIVES_ICON_SIZE,
            });
        }
    }

    /**
     * Render level display
     */
    renderLevel(level: string, canvasHeight: number): void {
        const x = 20; // Left side with padding
        const y = canvasHeight - 40; // Bottom area

        // Combined label and value with spacing
        const text = `Level: ${level}`;
        this.renderText(
            text,
            x,
            y,
            "#888888",
            '18px "Orbitron", "Courier New", monospace'
        );
    }

    /**
     * Render timer display
     */
    renderTimer(timeRemaining: number, canvasWidth: number): void {
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = Math.floor(timeRemaining % 60);
        const formattedTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;
        const color = this.getTimerColor(timeRemaining);
        const x = canvasWidth / 2; // Center
        const y = 20; // Top area

        // Combined label and value
        const text = `Time: ${formattedTime}`;
        this.renderText(
            text,
            x,
            y,
            color,
            '18px "Orbitron", "Courier New", monospace',
            "center"
        );
    }

    /**
     * Render currency display
     */
    renderCurrency(currency: number, canvasHeight: number): void {
        const formattedCurrency = this.formatRetroNumber(currency.toString());
        const text = `${CURRENCY.SYMBOL} ${formattedCurrency}`;
        const x = 20; // Left side with padding
        const y = canvasHeight - 65; // Above level display with spacing

        this.renderText(
            text,
            x,
            y,
            "#888888",
            '18px "Orbitron", "Courier New", monospace'
        );
    }

    /**
     * Render high score display
     */
    renderHighScore(
        highScore: number,
        canvasWidth: number,
        canvasHeight: number
    ): void {
        const formattedHighScore = this.formatRetroNumber(highScore.toString());
        const x = canvasWidth - 20; // Right side with padding
        const y = canvasHeight - 40; // Bottom area

        // Combined label and value
        const text = `High: ${formattedHighScore}`;
        this.renderText(
            text,
            x,
            y,
            "#888888",
            '18px "Orbitron", "Courier New", monospace',
            "right"
        );
    }

    /**
     * Render all HUD elements
     */
    renderHUD(
        gameState: {
            score: number;
            scoreStatus: "normal" | "near-high" | "new-high";
            lives: number;
            zoneLevel: string;
            levelTimeRemaining: number;
            currency: number;
            highScore: number;
        },
        canvasWidth: number,
        canvasHeight: number
    ): void {
        this.ctx.save();

        this.renderScore(gameState.score, gameState.scoreStatus, canvasWidth);
        this.renderLives(gameState.lives);
        this.renderLevel(gameState.zoneLevel, canvasHeight);
        this.renderTimer(gameState.levelTimeRemaining, canvasWidth);
        this.renderCurrency(gameState.currency, canvasHeight);
        this.renderHighScore(gameState.highScore, canvasWidth, canvasHeight);

        this.ctx.restore();
    }
}
