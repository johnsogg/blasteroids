import { Shapes } from "~/render/Shapes";
import { Vector2 } from "~/utils/Vector2";
import {
    UI,
    GAME_STATE,
    LEVEL_TIMER,
    SCORING,
    type GiftType,
} from "~/config/constants";
import type { WeaponState, WeaponType, UpgradeType } from "~/entities/Weapons";
import { WeaponManager } from "~/entities/Weapons";

/**
 * Player-specific state for individual players (human and AI)
 */
export interface PlayerState {
    playerId: string;
    fuel: number;
    lives: number;
    score: number;
    weaponState: WeaponState;
}

export class GameState {
    private _players: Map<string, PlayerState> = new Map();
    private _level: number = 1;
    private _gameOver: boolean = false;
    private _highScore: number = 0;
    private _debugNextGift: GiftType | null = null; // Debug override for next gift type
    private _levelTimeRemaining: number = LEVEL_TIMER.INITIAL_TIME; // seconds remaining in current level
    private _extraLifeThresholdsReached: Set<number> = new Set(); // Track which score thresholds have been reached
    private _activeCompanions: Set<string> = new Set(); // Track active AI companion IDs
    private readonly MAX_COMPANIONS = 2; // Maximum number of AI companions
    private readonly HIGH_SCORE_KEY = "blasteroids-highscore";
    private readonly DEBUG_GIFT_KEY = "blasteroids-debug-gift";
    private _onBonusTimerExpired?: () => void; // Callback for when bonus timer reaches zero

    constructor() {
        // Initialize default players
        this.initializePlayer("player");
        this.initializePlayer("computer");
    }

    private initializePlayer(playerId: string): void {
        const playerState: PlayerState = {
            playerId,
            fuel: 100,
            lives: playerId === "player" ? 3 : 1, // Human gets 3 lives, AI gets 1
            score: 0,
            weaponState: WeaponManager.getDefaultWeaponState(),
        };
        this._players.set(playerId, playerState);
    }

    getPlayerState(playerId: string): PlayerState | undefined {
        return this._players.get(playerId);
    }

    // Backward compatibility getters for human player (UI and existing code)
    get score(): number {
        return this.getPlayerState("player")?.score ?? 0;
    }

    get lives(): number {
        return this.getPlayerState("player")?.lives ?? 0;
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
        return this.getPlayerState("player")?.fuel ?? 0;
    }

    get fuelPercentage(): number {
        return this.getPlayerState("player")?.fuel ?? 0;
    }

    get weaponState(): WeaponState {
        return (
            this.getPlayerState("player")?.weaponState ??
            WeaponManager.getDefaultWeaponState()
        );
    }

    get currentWeapon(): WeaponType {
        return (
            this.getPlayerState("player")?.weaponState.currentWeapon ??
            "bullets"
        );
    }

    get debugNextGift(): GiftType | null {
        return this._debugNextGift;
    }

    get levelTimeRemaining(): number {
        return this._levelTimeRemaining;
    }

    get scoreStatus(): "normal" | "near-high" | "new-high" {
        const playerScore = this.score;
        if (playerScore >= this._highScore && playerScore > 0) {
            return "new-high";
        }
        if (playerScore >= this._highScore * 0.8) {
            return "near-high";
        }
        return "normal";
    }

    addScore(points: number, playerId: string = "player"): void {
        const playerState = this.getPlayerState(playerId);
        if (!playerState) return;

        const oldScore = playerState.score;
        playerState.score += points;

        // Only check extra life thresholds and high score for human player
        if (playerId === "player") {
            this.checkExtraLifeThresholds(oldScore, playerId);

            if (playerState.score > this._highScore) {
                this._highScore = playerState.score;
                this.saveHighScore();
            }
        }
        this.updateUI();
    }

    loseLife(playerId: string = "player"): void {
        const playerState = this.getPlayerState(playerId);
        if (!playerState) return;

        playerState.lives = Math.max(0, playerState.lives - 1);

        // Only set game over if human player has no lives left
        if (playerId === "player" && playerState.lives === 0) {
            this._gameOver = true;
        }
        this.updateUI();
    }

    addLife(playerId: string = "player"): void {
        const playerState = this.getPlayerState(playerId);
        if (!playerState) return;

        playerState.lives = Math.min(
            GAME_STATE.MAX_EXTRA_LIVES,
            playerState.lives + 1
        );
        this.updateUI();
    }

    nextLevel(): void {
        this._level++;
        // Refill fuel for all players on level completion
        for (const playerState of this._players.values()) {
            playerState.fuel = 100;
        }
        this._levelTimeRemaining = LEVEL_TIMER.INITIAL_TIME; // Reset timer for new level
        this.updateUI();
    }

    updateLevelTimer(deltaTime: number): void {
        if (this._levelTimeRemaining > 0) {
            const oldTimeRemaining = this._levelTimeRemaining;
            this._levelTimeRemaining = Math.max(
                0,
                this._levelTimeRemaining - deltaTime
            );

            // Check if timer just expired (went from > 0 to 0)
            if (oldTimeRemaining > 0 && this._levelTimeRemaining === 0) {
                if (this._onBonusTimerExpired) {
                    this._onBonusTimerExpired();
                }
            }

            this.updateUI();
        }
    }

    getLevelTimeBonusPoints(): number {
        // Calculate bonus points based on time remaining
        const timeRemaining = Math.ceil(this._levelTimeRemaining);
        return timeRemaining * LEVEL_TIMER.BONUS_POINTS_PER_SECOND;
    }

    private checkExtraLifeThresholds(oldScore: number, playerId: string): void {
        const playerState = this.getPlayerState(playerId);
        if (!playerState) return;

        // Check each threshold to see if we've crossed it
        for (const threshold of SCORING.EXTRA_LIFE_THRESHOLDS) {
            // If we've crossed this threshold and haven't awarded it before
            if (
                playerState.score >= threshold &&
                oldScore < threshold &&
                !this._extraLifeThresholdsReached.has(threshold)
            ) {
                // Only award extra life if we haven't reached the maximum
                if (playerState.lives < GAME_STATE.MAX_EXTRA_LIVES) {
                    this.addLife(playerId);
                }
                // Mark this threshold as reached regardless of whether we awarded a life
                this._extraLifeThresholdsReached.add(threshold);
            }
        }
    }

    consumeFuel(amount: number, playerId: string = "player"): boolean {
        const playerState = this.getPlayerState(playerId);
        if (!playerState) return false;

        if (playerState.fuel >= amount) {
            playerState.fuel = Math.max(0, playerState.fuel - amount);
            this.updateUI();
            return true;
        }
        return false;
    }

    refillFuel(playerId: string = "player"): void {
        const playerState = this.getPlayerState(playerId);
        if (!playerState) return;

        playerState.fuel = 100;
        this.updateUI();
    }

    reset(): void {
        // Reset all players
        this._players.clear();
        this.initializePlayer("player");
        this.initializePlayer("computer");

        // Reset global game state
        this._level = 1;
        this._gameOver = false;
        this._debugNextGift = null; // Clear debug gift override
        this._levelTimeRemaining = LEVEL_TIMER.INITIAL_TIME; // Reset timer
        this._extraLifeThresholdsReached.clear(); // Reset extra life thresholds
        this.loadHighScore(); // Preserve high score across resets
        this.updateUI();
    }

    switchWeapon(weaponType: WeaponType, playerId: string = "player"): boolean {
        const playerState = this.getPlayerState(playerId);
        if (!playerState) return false;
        return WeaponManager.switchWeapon(playerState.weaponState, weaponType);
    }

    unlockWeapon(weaponType: WeaponType, playerId: string = "player"): void {
        const playerState = this.getPlayerState(playerId);
        if (!playerState) return;
        WeaponManager.unlockWeapon(playerState.weaponState, weaponType);
    }

    applyWeaponUpgrade(
        upgradeType: UpgradeType,
        playerId: string = "player"
    ): boolean {
        const playerState = this.getPlayerState(playerId);
        if (!playerState) return false;
        WeaponManager.addUpgrade(playerState.weaponState, upgradeType);
        return true;
    }

    hasWeapon(weaponType: WeaponType, playerId: string = "player"): boolean {
        const playerState = this.getPlayerState(playerId);
        if (!playerState) return false;
        return WeaponManager.isWeaponUnlocked(
            playerState.weaponState,
            weaponType
        );
    }

    hasUpgrade(upgradeType: UpgradeType, playerId: string = "player"): boolean {
        const playerState = this.getPlayerState(playerId);
        if (!playerState) return false;
        return WeaponManager.hasUpgrade(playerState.weaponState, upgradeType);
    }

    updateLastFireTime(time: number, playerId: string = "player"): void {
        const playerState = this.getPlayerState(playerId);
        if (!playerState) return;
        playerState.weaponState.lastFireTime = time;
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
                this.score.toString()
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

        // Update level timer display
        const timerElement = document.getElementById("timerValue");
        if (timerElement) {
            const minutes = Math.floor(this._levelTimeRemaining / 60);
            const seconds = Math.floor(this._levelTimeRemaining % 60);
            const formattedTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;
            timerElement.textContent = formattedTime;

            // Change color based on remaining time
            if (this._levelTimeRemaining <= 10) {
                timerElement.style.color = "#ff0000"; // Red for critical time
            } else if (this._levelTimeRemaining <= 20) {
                timerElement.style.color = "#ffff00"; // Yellow for warning
            } else {
                timerElement.style.color = "#ffffff"; // White for normal
            }
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
            const playerLives = this.getPlayerState("player")?.lives ?? 0;
            const color = i < playerLives ? "#00ff00" : "#888888";

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

    /**
     * Add an AI companion to the active companions list
     */
    addAICompanion(companionId: string): void {
        this._activeCompanions.add(companionId);
        // Initialize player state for the companion
        this.initializePlayer(companionId);
    }

    /**
     * Remove an AI companion from the active companions list
     */
    removeAICompanion(companionId: string): void {
        this._activeCompanions.delete(companionId);
        this._players.delete(companionId);
    }

    /**
     * Check if we can spawn more AI companions
     */
    canSpawnAICompanion(): boolean {
        return this._activeCompanions.size < this.MAX_COMPANIONS;
    }

    /**
     * Get the number of active AI companions
     */
    getActiveCompanionCount(): number {
        return this._activeCompanions.size;
    }

    /**
     * Get all active AI companion IDs
     */
    getActiveCompanionIds(): string[] {
        return Array.from(this._activeCompanions);
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

    /**
     * Set callback for when bonus timer expires
     */
    setOnBonusTimerExpired(callback: () => void): void {
        this._onBonusTimerExpired = callback;
    }
}
