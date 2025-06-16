import { Shapes } from "~/render/Shapes";
import { Vector2 } from "~/utils/Vector2";

export class GameState {
    private _score: number = 0;
    private _lives: number = 3;
    private _level: number = 1;
    private _gameOver: boolean = false;
    private _highScore: number = 0;
    private _fuel: number = 100;
    private readonly HIGH_SCORE_KEY = "blasteroids-highscore";

    get score(): number {
        return this._score;
    }

    get lives(): number {
        return this._lives;
    }

    get gameOver(): boolean {
        return this._gameOver;
    }

    get level(): number {
        return this._level;
    }

    get highScore(): number {
        return this._highScore;
    }

    get fuel(): number {
        return this._fuel;
    }

    get fuelPercentage(): number {
        return this._fuel;
    }

    get scoreStatus(): "normal" | "near-high" | "new-high" {
        if (this._score >= this._highScore && this._score > 0) {
            return "new-high";
        }
        if (this._score >= this._highScore * 0.8) {
            return "near-high";
        }
        return "normal";
    }

    addScore(points: number): void {
        this._score += points;
        if (this._score > this._highScore) {
            this._highScore = this._score;
            this.saveHighScore();
        }
        this.updateUI();
    }

    loseLife(): void {
        this._lives = Math.max(0, this._lives - 1);
        if (this._lives === 0) {
            this._gameOver = true;
        }
        this.updateUI();
    }

    nextLevel(): void {
        this._level++;
        this.refillFuel(); // Refill fuel on level completion
        this.updateUI();
    }

    consumeFuel(amount: number): boolean {
        if (this._fuel >= amount) {
            this._fuel = Math.max(0, this._fuel - amount);
            this.updateUI();
            return true;
        }
        return false;
    }

    refillFuel(): void {
        this._fuel = 100;
        this.updateUI();
    }

    reset(): void {
        this._score = 0;
        this._lives = 3;
        this._level = 1;
        this._gameOver = false;
        this._fuel = 100;
        this.loadHighScore(); // Preserve high score across resets
        this.updateUI();
    }

    private updateUI(): void {
        const scoreElement = document.getElementById("scoreValue");
        const levelElement = document.getElementById("levelValue");
        const highScoreElement = document.getElementById("highScoreValue");

        if (scoreElement) {
            const formattedScore = this.formatRetroNumber(this._score.toString());
            scoreElement.innerHTML = formattedScore;

            // Update score color based on status
            const status = this.scoreStatus;
            scoreElement.classList.remove("new-high");
            if (status === "new-high") {
                scoreElement.style.color = "#00ff00"; // Green
                scoreElement.classList.add("new-high");
            } else if (status === "near-high") {
                scoreElement.style.color = "#ffff00"; // Yellow
            } else {
                scoreElement.style.color = "#ffffff"; // White
            }
        }

        // Update lives display with ship icons
        this.updateLivesDisplay();

        if (levelElement) {
            levelElement.textContent = this._level.toString();
        }

        if (highScoreElement) {
            const formattedHighScore = this.formatRetroNumber(
                this._highScore.toString(),
            );
            highScoreElement.innerHTML = formattedHighScore;
        }
    }

    private updateLivesDisplay(): void {
        const livesCanvas = document.getElementById(
            "livesCanvas",
        ) as HTMLCanvasElement;
        if (!livesCanvas) return;

        const ctx = livesCanvas.getContext("2d");
        if (!ctx) return;

        // Clear the canvas
        ctx.clearRect(0, 0, livesCanvas.width, livesCanvas.height);

        const maxLives = 3;
        const spacing = 30;
        const rotation = -Math.PI / 4; // -45 degrees (up and right)

        for (let i = 0; i < maxLives; i++) {
            const x = 15 + i * spacing;
            const y = 15;
            const position = new Vector2(x, y);

            // Active lives in green, lost lives in gray
            const color = i < this._lives ? "#00ff00" : "#888888";

            // Draw ship icon at 50% size facing up-right
            Shapes.drawShip(ctx, position, rotation, color, false, 0, false, 0.5);
        }
    }

    private formatRetroNumber(numStr: string): string {
    // Add retro styling to zeros with diagonal lines
        return numStr.replace(/0/g, '<span class="retro-zero">0</span>');
    }

    private loadHighScore(): void {
        try {
            const saved = localStorage.getItem(this.HIGH_SCORE_KEY);
            if (saved) {
                this._highScore = parseInt(saved, 10) || 0;
            }
        } catch (error) {
            // localStorage might not be available
            this._highScore = 0;
        }
    }

    private saveHighScore(): void {
        try {
            localStorage.setItem(this.HIGH_SCORE_KEY, this._highScore.toString());
        } catch (error) {
            // localStorage might not be available
        }
    }

    // Initialize high score on first load
    init(): void {
        this.loadHighScore();
        this.updateUI();
    }

    // Scoring based on original Asteroids
    static getAsteroidScore(size: number): number {
        if (size >= 30) return 20; // Large asteroid
        if (size >= 20) return 50; // Medium asteroid
        return 100; // Small asteroid
    }
}
