// Removed Shapes and Vector2 imports - no longer using DOM/separate canvas for UI
import {
    GAME_STATE,
    LEVEL_TIMER,
    SCORING,
    ZONES,
    CURRENCY,
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
    private _zone: number = 1;
    private _level: number = 1; // Level within current zone
    private _gameOver: boolean = false;
    private _highScore: number = 0;
    private _currency: number = CURRENCY.STARTING_AMOUNT;
    private _debugNextGift: GiftType | null = null; // Debug override for next gift type
    private _levelTimeRemaining: number = LEVEL_TIMER.INITIAL_TIME; // seconds remaining in current level
    private _extraLifeThresholdsReached: Set<number> = new Set(); // Track which score thresholds have been reached
    private _activeCompanions: Set<string> = new Set(); // Track active AI companion IDs
    private readonly MAX_COMPANIONS = 2; // Maximum number of AI companions
    private readonly HIGH_SCORE_KEY = "blasteroids-highscore";
    private readonly CURRENCY_KEY = "blasteroids-currency";
    private readonly ZONE_KEY = "blasteroids-zone";
    private readonly ZONE_LEVEL_KEY = "blasteroids-zone-level";
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

    get zone(): number {
        return this._zone;
    }

    get level(): number {
        return this._level;
    }

    get absoluteLevel(): number {
        // Calculate overall level number for backward compatibility
        return (this._zone - 1) * ZONES.LEVELS_PER_CHOICE + this._level;
    }

    get zoneLevel(): string {
        return `${this._zone}-${this._level}`;
    }

    get currency(): number {
        return this._currency;
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
        // UI now updated via canvas rendering in Game.ts
    }

    loseLife(playerId: string = "player"): void {
        const playerState = this.getPlayerState(playerId);
        if (!playerState) return;

        playerState.lives = Math.max(0, playerState.lives - 1);

        // Only set game over if human player has no lives left
        if (playerId === "player" && playerState.lives === 0) {
            this._gameOver = true;
        }
        // UI now updated via canvas rendering in Game.ts
    }

    addLife(playerId: string = "player"): void {
        const playerState = this.getPlayerState(playerId);
        if (!playerState) return;

        playerState.lives = Math.min(
            GAME_STATE.MAX_EXTRA_LIVES,
            playerState.lives + 1
        );
        // UI now updated via canvas rendering in Game.ts
    }

    nextLevel(): void {
        this._level++;

        // Refill fuel for all players on level completion
        for (const playerState of this._players.values()) {
            playerState.fuel = 100;
        }
        this._levelTimeRemaining = LEVEL_TIMER.INITIAL_TIME; // Reset timer for new level
        this.saveZoneProgress();
        // UI now updated via canvas rendering in Game.ts
    }

    continueCurrentZone(): void {
        // Reset to level 1 of current zone
        this._level = 1;

        // Refill fuel for all players
        for (const playerState of this._players.values()) {
            playerState.fuel = 100;
        }
        this._levelTimeRemaining = LEVEL_TIMER.INITIAL_TIME;
        this.saveZoneProgress();
        // UI now updated via canvas rendering in Game.ts
    }

    advanceToNextZone(): void {
        this._zone++;
        this._level = 1;
        this.saveZoneProgress();
        // UI now updated via canvas rendering in Game.ts
    }

    /**
     * Debug method to directly set zone and level (bypasses normal progression)
     */
    setZoneAndLevel(zone: number, level: number): void {
        this._zone = zone;
        this._level = level;

        // Refill fuel for all players when jumping to new zone
        for (const playerState of this._players.values()) {
            playerState.fuel = 100;
        }
        this._levelTimeRemaining = LEVEL_TIMER.INITIAL_TIME;
        this.saveZoneProgress();
        // UI now updated via canvas rendering in Game.ts
    }

    shouldShowChoiceScreen(): boolean {
        return this._level > ZONES.LEVELS_PER_CHOICE;
    }

    addCurrency(amount: number): void {
        this._currency += amount;
        this.saveCurrency();
        // UI now updated via canvas rendering in Game.ts
    }

    spendCurrency(amount: number): boolean {
        if (this._currency >= amount) {
            this._currency -= amount;
            this.saveCurrency();
            // UI now updated via canvas rendering in Game.ts
            return true;
        }
        return false;
    }

    calculateLevelCurrencyReward(): number {
        const zoneConfig =
            ZONES.ZONE_CONFIGS[this._zone as keyof typeof ZONES.ZONE_CONFIGS];
        const baseReward = CURRENCY.BASE_LEVEL_REWARD;
        const zoneMultiplier = zoneConfig?.currencyMultiplier ?? 1.0;
        const timeBonus =
            Math.ceil(this._levelTimeRemaining) *
            CURRENCY.TIME_BONUS_MULTIPLIER;

        return Math.floor((baseReward + timeBonus) * zoneMultiplier);
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

            // UI now updated via canvas rendering in Game.ts
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
            // UI now updated via canvas rendering in Game.ts
            return true;
        }
        return false;
    }

    refillFuel(playerId: string = "player"): void {
        const playerState = this.getPlayerState(playerId);
        if (!playerState) return;

        playerState.fuel = 100;
        // UI now updated via canvas rendering in Game.ts
    }

    reset(): void {
        // Reset all players
        this._players.clear();
        this.initializePlayer("player");
        this.initializePlayer("computer");

        // Reset global game state
        this._zone = 1;
        this._level = 1;
        this._gameOver = false;
        this._debugNextGift = null; // Clear debug gift override
        this._levelTimeRemaining = LEVEL_TIMER.INITIAL_TIME; // Reset timer
        this._extraLifeThresholdsReached.clear(); // Reset extra life thresholds
        this.loadHighScore(); // Preserve high score across resets
        this.loadCurrency(); // Preserve currency across resets
        // Note: Zone progress is reset to 1-1, not loaded from storage on game reset
        // UI now updated via canvas rendering in Game.ts
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

    // NOTE: DOM UI methods removed - UI is now rendered via HUDRenderer in Game.ts

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

    // NOTE: formatRetroNumber removed - now handled by HUDRenderer

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

    private loadCurrency(): void {
        try {
            const saved = localStorage.getItem(this.CURRENCY_KEY);
            if (saved) {
                this._currency =
                    parseInt(saved, 10) || CURRENCY.STARTING_AMOUNT;
            }
        } catch (_error) {
            // localStorage might not be available
            this._currency = CURRENCY.STARTING_AMOUNT;
        }
    }

    private saveCurrency(): void {
        try {
            localStorage.setItem(this.CURRENCY_KEY, this._currency.toString());
        } catch (_error) {
            // localStorage might not be available
        }
    }

    private loadZoneProgress(): void {
        try {
            const savedZone = localStorage.getItem(this.ZONE_KEY);
            const savedLevel = localStorage.getItem(this.ZONE_LEVEL_KEY);
            if (savedZone) {
                this._zone = parseInt(savedZone, 10) || 1;
            }
            if (savedLevel) {
                this._level = parseInt(savedLevel, 10) || 1;
            }
        } catch (_error) {
            // localStorage might not be available
            this._zone = 1;
            this._level = 1;
        }
    }

    private saveZoneProgress(): void {
        try {
            localStorage.setItem(this.ZONE_KEY, this._zone.toString());
            localStorage.setItem(this.ZONE_LEVEL_KEY, this._level.toString());
        } catch (_error) {
            // localStorage might not be available
        }
    }

    // Initialize high score and debug gift on first load
    init(): void {
        this.loadHighScore();
        this.loadDebugGift();
        this.loadCurrency();
        this.loadZoneProgress();
        // UI now updated via canvas rendering in Game.ts
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
