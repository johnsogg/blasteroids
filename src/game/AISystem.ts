import { Vector2 } from "~/utils/Vector2";
import type { Ship, GameEntity } from "~/entities";
import type { AIState } from "~/entities/Ship";
import { EntityManager } from "./EntityManager";
import { GameState } from "./GameState";
import { WEAPONS } from "~/config/constants";

/**
 * AI input state that mimics human input
 */
export interface AIInput {
    thrust: boolean;
    left: boolean;
    right: boolean;
    strafeLeft: boolean;
    strafeRight: boolean;
    shoot: boolean;
    shootPressed: boolean;
    weapon1: boolean;
    weapon2: boolean;
    weapon3: boolean;
    weapon4: boolean;
}

/**
 * Manages AI behavior for computer-controlled ships
 */
export class AISystem {
    private entityManager: EntityManager;
    private gameState: GameState;

    // AI configuration
    private readonly DECISION_INTERVAL = 100; // milliseconds between AI decisions
    private readonly SAFE_DISTANCE = 80; // minimum distance from asteroids
    private readonly ASSIST_DISTANCE = 200; // distance to stay near player

    constructor(entityManager: EntityManager, gameState: GameState) {
        this.entityManager = entityManager;
        this.gameState = gameState;
    }

    /**
     * Update AI for computer ship
     */
    updateAI(currentTime: number): AIInput {
        const computerShip = this.entityManager.getComputerShip();
        if (!computerShip || !computerShip.isAI) {
            return this.getEmptyInput();
        }

        // Make decisions at regular intervals
        if (
            !computerShip.aiLastDecisionTime ||
            currentTime - computerShip.aiLastDecisionTime >=
                this.DECISION_INTERVAL
        ) {
            this.makeDecisions(computerShip, currentTime);
            computerShip.aiLastDecisionTime = currentTime;
        }

        // Generate input based on current AI state
        return this.generateInput(computerShip, currentTime);
    }

    /**
     * Make high-level AI decisions
     */
    private makeDecisions(ship: Ship, _currentTime: number): void {
        const playerShip = this.entityManager.getPlayerShip();
        const asteroids = this.entityManager.getAsteroids();
        const gifts = this.entityManager.getGifts();

        // Determine AI state based on situation
        if (this.isInDanger(ship)) {
            ship.aiState = "avoiding" as AIState;
            ship.aiTarget = this.getNearestThreat(ship);
        } else if (gifts.length > 0 && this.shouldCollectGifts(ship)) {
            ship.aiState = "collecting" as AIState;
            ship.aiTarget = this.getNearestGift(ship);
        } else if (asteroids.length > 0) {
            ship.aiState = "hunting" as AIState;
            // Keep current target if it's still valid, otherwise pick new one
            if (!ship.aiTarget || !this.isValidTarget(ship.aiTarget)) {
                ship.aiTarget = this.selectBestAsteroidTarget(ship, playerShip);
            }
        } else if (playerShip && this.shouldAssistPlayer(ship, playerShip)) {
            ship.aiState = "assisting" as AIState;
            ship.aiTarget = playerShip;
        } else {
            ship.aiState = "hunting" as AIState;
            ship.aiTarget = null;
        }
    }

    /**
     * Generate input commands based on AI state
     */
    private generateInput(ship: Ship, currentTime: number): AIInput {
        const input: AIInput = this.getEmptyInput();

        switch (ship.aiState) {
            case "avoiding":
                this.handleAvoiding(ship, input);
                break;
            case "collecting":
                this.handleCollecting(ship, input);
                break;
            case "hunting":
                this.handleHunting(ship, input, currentTime);
                break;
            case "assisting":
                this.handleAssisting(ship, input);
                break;
        }

        // Always try to use the best weapon available
        this.selectOptimalWeapon(ship, input);

        return input;
    }

    /**
     * Handle avoiding behavior
     */
    private handleAvoiding(ship: Ship, input: AIInput): void {
        if (!ship.aiTarget) return;

        const threat = ship.aiTarget;
        const toThreat = threat.position.subtract(ship.position);
        const distance = toThreat.magnitude();

        if (distance < this.SAFE_DISTANCE) {
            // Move away from threat
            const awayFromThreat = ship.position
                .subtract(threat.position)
                .normalize();
            this.moveToward(
                ship,
                ship.position.add(awayFromThreat.multiply(100)),
                input
            );
        }
    }

    /**
     * Handle collecting behavior
     */
    private handleCollecting(ship: Ship, input: AIInput): void {
        if (!ship.aiTarget) return;

        this.moveToward(ship, ship.aiTarget.position, input);

        // Don't shoot at gifts - we want to collect them
    }

    /**
     * Handle hunting behavior
     */
    private handleHunting(
        ship: Ship,
        input: AIInput,
        _currentTime: number
    ): void {
        if (!ship.aiTarget) return;

        const target = ship.aiTarget;
        const toTarget = target.position.subtract(ship.position);
        const distance = toTarget.magnitude();

        // Move to optimal shooting position
        const optimalDistance = this.getOptimalShootingDistance(ship);
        if (distance > optimalDistance * 1.2) {
            // Too far - move closer
            this.moveToward(ship, target.position, input);
        } else if (distance < optimalDistance * 0.8) {
            // Too close - move away while keeping target in sight
            const awayFromTarget = ship.position
                .subtract(target.position)
                .normalize();
            const optimalPosition = target.position.add(
                awayFromTarget.multiply(optimalDistance)
            );
            this.moveToward(ship, optimalPosition, input);
        }

        // Aim and shoot
        this.aimAt(ship, target.position, input);
        if (this.canShootAt(ship, target, performance.now())) {
            input.shoot = true;
        }
    }

    /**
     * Handle assisting behavior
     */
    private handleAssisting(ship: Ship, input: AIInput): void {
        const playerShip = this.entityManager.getPlayerShip();
        if (!playerShip) return;

        const toPlayer = playerShip.position.subtract(ship.position);
        const distance = toPlayer.magnitude();

        if (distance > this.ASSIST_DISTANCE) {
            // Move closer to player
            this.moveToward(ship, playerShip.position, input);
        } else {
            // Stay nearby and hunt asteroids
            const nearbyAsteroid = this.getNearestAsteroid(ship);
            if (nearbyAsteroid) {
                this.aimAt(ship, nearbyAsteroid.position, input);
                if (this.canShootAt(ship, nearbyAsteroid, performance.now())) {
                    input.shoot = true;
                }
            }
        }
    }

    /**
     * Move ship toward a target position
     */
    private moveToward(
        ship: Ship,
        targetPosition: Vector2,
        input: AIInput
    ): void {
        const toTarget = targetPosition.subtract(ship.position);
        const distance = toTarget.magnitude();

        if (distance < 10) return; // Close enough

        const targetAngle = Math.atan2(toTarget.y, toTarget.x);
        const currentAngle = ship.rotation;

        // Calculate angle difference
        let angleDiff = targetAngle - currentAngle;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        // Rotate toward target
        if (Math.abs(angleDiff) > 0.1) {
            if (angleDiff > 0) {
                input.right = true;
            } else {
                input.left = true;
            }
        }

        // Thrust if facing roughly the right direction
        if (Math.abs(angleDiff) < Math.PI / 4) {
            input.thrust = true;
        }

        // Use strafe thrusters for fine positioning
        if (distance < 100 && Math.abs(angleDiff) > Math.PI / 6) {
            if (angleDiff > 0) {
                input.strafeRight = true;
            } else {
                input.strafeLeft = true;
            }
        }
    }

    /**
     * Aim ship at target position
     */
    private aimAt(ship: Ship, targetPosition: Vector2, input: AIInput): void {
        const toTarget = targetPosition.subtract(ship.position);
        const targetAngle = Math.atan2(toTarget.y, toTarget.x);
        const currentAngle = ship.rotation;

        let angleDiff = targetAngle - currentAngle;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        // Rotate to aim
        if (Math.abs(angleDiff) > 0.05) {
            if (angleDiff > 0) {
                input.right = true;
            } else {
                input.left = true;
            }
        }
    }

    /**
     * Check if ship can shoot at target
     */
    private canShootAt(
        ship: Ship,
        target: GameEntity,
        _currentTime: number
    ): boolean {
        // Check if we're aimed at the target
        const toTarget = target.position.subtract(ship.position);
        const targetAngle = Math.atan2(toTarget.y, toTarget.x);
        const currentAngle = ship.rotation;

        let angleDiff = targetAngle - currentAngle;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        // Must be aimed within 15 degrees
        if (Math.abs(angleDiff) > Math.PI / 12) {
            return false;
        }

        // Get AI player's state
        const aiPlayerState = this.gameState.getPlayerState(ship.playerId);
        if (!aiPlayerState) return false;

        // Check if we have fuel for the current weapon
        const weaponType = aiPlayerState.weaponState.currentWeapon;
        let fuelNeeded = 0;
        switch (weaponType) {
            case "bullets":
                fuelNeeded = WEAPONS.BULLETS.FUEL_CONSUMPTION;
                break;
            case "missiles":
                fuelNeeded = WEAPONS.MISSILES.FUEL_CONSUMPTION;
                break;
            case "laser":
                fuelNeeded = WEAPONS.LASER.FUEL_CONSUMPTION_RATE / 60; // Per frame
                break;
            case "lightning":
                fuelNeeded = WEAPONS.LIGHTNING.FUEL_CONSUMPTION;
                break;
        }

        // Check AI player's fuel
        return aiPlayerState.fuel >= fuelNeeded;
    }

    /**
     * Select optimal weapon for current situation
     */
    private selectOptimalWeapon(ship: Ship, input: AIInput): void {
        // Get AI player's state
        const aiPlayerState = this.gameState.getPlayerState(ship.playerId);
        if (!aiPlayerState) return;

        const weapons = aiPlayerState.weaponState.unlockedWeapons;
        const currentWeapon = aiPlayerState.weaponState.currentWeapon;

        // Preference order: missiles > lightning > laser > bullets
        if (weapons.has("missiles") && currentWeapon !== "missiles") {
            input.weapon2 = true;
        } else if (weapons.has("lightning") && currentWeapon !== "lightning") {
            input.weapon4 = true;
        } else if (weapons.has("laser") && currentWeapon !== "laser") {
            input.weapon3 = true;
        } else if (weapons.has("bullets") && currentWeapon !== "bullets") {
            input.weapon1 = true;
        }
    }

    /**
     * Utility methods
     */
    private isInDanger(ship: Ship): boolean {
        const nearbyAsteroids = this.entityManager.findEntitiesInRadius(
            ship.position,
            this.SAFE_DISTANCE,
            ["asteroid"]
        );
        return nearbyAsteroids.length > 0;
    }

    private getNearestThreat(ship: Ship): GameEntity | null {
        const threats = this.entityManager.findEntitiesInRadius(
            ship.position,
            this.SAFE_DISTANCE * 2,
            ["asteroid"]
        );

        if (threats.length === 0) return null;

        let nearest = threats[0];
        let nearestDistance = ship.position
            .subtract(nearest.position)
            .magnitude();

        for (const threat of threats) {
            const distance = ship.position
                .subtract(threat.position)
                .magnitude();
            if (distance < nearestDistance) {
                nearest = threat;
                nearestDistance = distance;
            }
        }

        return nearest;
    }

    private getNearestGift(ship: Ship): GameEntity | null {
        const gifts = this.entityManager.getGifts();
        if (gifts.length === 0) return null;

        let nearest = gifts[0];
        let nearestDistance = ship.position
            .subtract(nearest.position)
            .magnitude();

        for (const gift of gifts) {
            const distance = ship.position.subtract(gift.position).magnitude();
            if (distance < nearestDistance) {
                nearest = gift;
                nearestDistance = distance;
            }
        }

        return nearest;
    }

    private getNearestAsteroid(ship: Ship): GameEntity | null {
        const asteroids = this.entityManager.getAsteroids();
        if (asteroids.length === 0) return null;

        let nearest = asteroids[0];
        let nearestDistance = ship.position
            .subtract(nearest.position)
            .magnitude();

        for (const asteroid of asteroids) {
            const distance = ship.position
                .subtract(asteroid.position)
                .magnitude();
            if (distance < nearestDistance) {
                nearest = asteroid;
                nearestDistance = distance;
            }
        }

        return nearest;
    }

    private selectBestAsteroidTarget(
        ship: Ship,
        playerShip: Ship | null
    ): GameEntity | null {
        const asteroids = this.entityManager.getAsteroids();
        if (asteroids.length === 0) return null;

        // Prefer asteroids that are:
        // 1. Closer to the AI ship
        // 2. Not too close to the player (avoid interference)
        // 3. Medium-sized (good balance of points and difficulty)

        let bestTarget = asteroids[0];
        let bestScore = this.scoreAsteroidTarget(ship, bestTarget, playerShip);

        for (const asteroid of asteroids) {
            const score = this.scoreAsteroidTarget(ship, asteroid, playerShip);
            if (score > bestScore) {
                bestTarget = asteroid;
                bestScore = score;
            }
        }

        return bestTarget;
    }

    private scoreAsteroidTarget(
        ship: Ship,
        asteroid: GameEntity,
        playerShip: Ship | null
    ): number {
        const distance = ship.position.subtract(asteroid.position).magnitude();
        let score = 1000 / (distance + 1); // Closer is better

        // Prefer medium-sized asteroids
        const size = asteroid.size.x;
        if (size >= 20 && size <= 30) {
            score *= 1.5; // Medium asteroids are preferred
        } else if (size < 20) {
            score *= 1.2; // Small asteroids are okay
        }

        // Avoid targets too close to player
        if (playerShip) {
            const distanceToPlayer = playerShip.position
                .subtract(asteroid.position)
                .magnitude();
            if (distanceToPlayer < 100) {
                score *= 0.5; // Reduce score for asteroids near player
            }
        }

        return score;
    }

    private shouldCollectGifts(ship: Ship): boolean {
        // Get AI player's state
        const aiPlayerState = this.gameState.getPlayerState(ship.playerId);
        if (!aiPlayerState) return false;

        // Collect gifts if fuel is low or we don't have many weapons
        const weaponCount = aiPlayerState.weaponState.unlockedWeapons.size;
        return aiPlayerState.fuel < 50 || weaponCount < 3;
    }

    private shouldAssistPlayer(ship: Ship, playerShip: Ship): boolean {
        const distance = ship.position
            .subtract(playerShip.position)
            .magnitude();
        return distance > this.ASSIST_DISTANCE * 2; // If too far from player
    }

    private isValidTarget(target: GameEntity | null): boolean {
        if (!target) return false;

        // Check if target still exists in the game
        const allEntities = this.entityManager.getAllEntities();
        return allEntities.includes(target);
    }

    private getOptimalShootingDistance(ship: Ship): number {
        // Get AI player's state
        const aiPlayerState = this.gameState.getPlayerState(ship.playerId);
        if (!aiPlayerState) return 180; // Default distance

        const weaponType = aiPlayerState.weaponState.currentWeapon;
        switch (weaponType) {
            case "laser":
                return 150; // Medium range for laser
            case "lightning":
                return 120; // Close range for lightning
            case "missiles":
                return 200; // Long range for missiles
            default:
                return 180; // Default for bullets
        }
    }

    private getEmptyInput(): AIInput {
        return {
            thrust: false,
            left: false,
            right: false,
            strafeLeft: false,
            strafeRight: false,
            shoot: false,
            shootPressed: false,
            weapon1: false,
            weapon2: false,
            weapon3: false,
            weapon4: false,
        };
    }
}
