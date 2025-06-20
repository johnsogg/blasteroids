import { Shapes } from "~/render/Shapes";
import { Vector2 } from "~/utils/Vector2";
import { UI, type GiftType } from "~/config/constants";
import type { WeaponState, WeaponType, UpgradeType } from "~/entities/Weapons";
import { WeaponManager } from "~/entities/Weapons";

export class GameState {
    private _score: number = 0;
    private _lives: number = 3;
    private _level: number = 1;
    private _gameOver: boolean = false;
    private _highScore: number = 0;
    private _fuel: number = 100;
    private _weaponState: WeaponState = WeaponManager.getDefaultWeaponState();
    private _debugNextGift: GiftType | null = null; // Debug override for next gift type
    private readonly HIGH_SCORE_KEY = "blasteroids-highscore";
    private readonly DEBUG_GIFT_KEY = "blasteroids-debug-gift";

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

    get weaponState(): WeaponState {
        return this._weaponState;
    }

    get currentWeapon(): WeaponType {
        return this._weaponState.currentWeapon;
    }

    get debugNextGift(): GiftType | null {
        return this._debugNextGift;
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

    addLife(): void {
        this._lives = Math.min(99, this._lives + 1); // Cap at 99 lives
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
        this._weaponState = WeaponManager.getDefaultWeaponState(); // Reset weapons
        this._debugNextGift = null; // Clear debug gift override
        this.loadHighScore(); // Preserve high score across resets
        this.updateUI();
    }

    switchWeapon(weaponType: WeaponType): boolean {
        return WeaponManager.switchWeapon(this._weaponState, weaponType);
    }

    unlockWeapon(weaponType: WeaponType): void {
        WeaponManager.unlockWeapon(this._weaponState, weaponType);
    }

    applyWeaponUpgrade(upgradeType: UpgradeType): boolean {
        WeaponManager.addUpgrade(this._weaponState, upgradeType);
        return true;
    }

    hasWeapon(weaponType: WeaponType): boolean {
        return WeaponManager.isWeaponUnlocked(this._weaponState, weaponType);
    }

    hasUpgrade(upgradeType: UpgradeType): boolean {
        return WeaponManager.hasUpgrade(this._weaponState, upgradeType);
    }

    updateLastFireTime(time: number): void {
        this._weaponState.lastFireTime = time;
    }

    setDebugNextGift(giftType: GiftType | null): void {
        this._debugNextGift = giftType;
        this.saveDebugGift();
    }

    consumeDebugNextGift(): GiftType | null {
        const giftType = this._debugNextGift;

        // Check if this is an upgrade for an unowned weapon and redirect to weapon gift
        const redirectedGift = this.getRedirectedGiftType(giftType);
        if (redirectedGift !== giftType) {
            // Don't clear the debug gift if we're redirecting, so it persists for next spawn
            return redirectedGift;
        }

        // Normal consumption - clear the debug gift after use
        this._debugNextGift = null;
        this.saveDebugGift();
        return giftType;
    }

    private getRedirectedGiftType(giftType: GiftType | null): GiftType | null {
        if (!giftType) return null;

        // Check if this is an upgrade for an unowned weapon
        if (
            giftType === "upgrade_missiles_speed" ||
            giftType === "upgrade_missiles_fire_rate" ||
            giftType === "upgrade_missiles_homing"
        ) {
            if (!this.hasWeapon("missiles")) {
                return "weapon_missiles";
            }
        }

        if (
            giftType === "upgrade_laser_range" ||
            giftType === "upgrade_laser_efficiency"
        ) {
            if (!this.hasWeapon("laser")) {
                return "weapon_laser";
            }
        }

        if (
            giftType === "upgrade_lightning_radius" ||
            giftType === "upgrade_lightning_chain"
        ) {
            if (!this.hasWeapon("lightning")) {
                return "weapon_lightning";
            }
        }

        return giftType;
    }

    private updateUI(): void {
        const scoreElement = document.getElementById("scoreValue");
        const levelElement = document.getElementById("levelValue");
        const highScoreElement = document.getElementById("highScoreValue");

        if (scoreElement) {
            const formattedScore = this.formatRetroNumber(
                this._score.toString()
            );
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
                this._highScore.toString()
            );
            highScoreElement.innerHTML = formattedHighScore;
        }
    }

    private updateLivesDisplay(): void {
        const livesCanvas = document.getElementById(
            "livesCanvas"
        ) as HTMLCanvasElement;
        if (!livesCanvas) return;

        const ctx = livesCanvas.getContext("2d");
        if (!ctx) return;

        // Clear the canvas
        ctx.clearRect(0, 0, livesCanvas.width, livesCanvas.height);

        const maxLives = UI.MAX_LIVES_DISPLAY;
        const spacing = UI.LIVES_SPACING;
        const rotation = UI.LIVES_ROTATION;

        for (let i = 0; i < maxLives; i++) {
            const x = UI.LIVES_X_OFFSET + i * spacing;
            const y = UI.LIVES_Y_OFFSET;
            const position = new Vector2(x, y);

            // Active lives in green, lost lives in gray
            const color = i < this._lives ? "#00ff00" : "#888888";

            // Draw ship icon at 50% size facing up-right
            Shapes.drawShip({
                ctx,
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
        } catch (_error) {
            // localStorage might not be available
            this._highScore = 0;
        }
    }

    private saveHighScore(): void {
        try {
            localStorage.setItem(
                this.HIGH_SCORE_KEY,
                this._highScore.toString()
            );
        } catch (_error) {
            // localStorage might not be available
        }
    }

    private loadDebugGift(): void {
        try {
            const saved = localStorage.getItem(this.DEBUG_GIFT_KEY);
            if (saved && saved !== "none") {
                this._debugNextGift = saved as GiftType;
            } else {
                this._debugNextGift = null;
            }
        } catch (_error) {
            // localStorage might not be available
            this._debugNextGift = null;
        }
    }

    private saveDebugGift(): void {
        try {
            const value = this._debugNextGift || "none";
            localStorage.setItem(this.DEBUG_GIFT_KEY, value);
        } catch (_error) {
            // localStorage might not be available
        }
    }

    // Initialize high score and debug gift on first load
    init(): void {
        this.loadHighScore();
        this.loadDebugGift();
        this.updateUI();
    }

    // Scoring based on original Asteroids
    static getAsteroidScore(size: number): number {
        if (size >= 30) return 20; // Large asteroid
        if (size >= 20) return 50; // Medium asteroid
        return 100; // Small asteroid
    }
}
