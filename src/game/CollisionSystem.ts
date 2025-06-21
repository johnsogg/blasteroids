import { Vector2 } from "~/utils/Vector2";
import type { GameEntity, Ship } from "~/entities";
import { isGift } from "~/entities";
import { Collision } from "~/physics/Collision";
import { AudioManager } from "~/audio/AudioManager";
import { ParticleSystem } from "~/render/ParticleSystem";
import { GameState } from "./GameState";
import { EntityManager } from "./EntityManager";
import { WeaponSystem } from "./WeaponSystem";
import { ShieldSystem } from "./ShieldSystem";
import { MessageSystem } from "./MessageSystem";
import { WEAPONS, SCORING, ASTEROID } from "~/config/constants";

/**
 * Handles all collision detection and response in the game
 */
export class CollisionSystem {
    private audio: AudioManager;
    private particles: ParticleSystem;
    private gameState: GameState;
    private entityManager: EntityManager;
    private weaponSystem: WeaponSystem;
    private shieldSystem: ShieldSystem;
    private messageSystem: MessageSystem;

    constructor(
        audio: AudioManager,
        particles: ParticleSystem,
        gameState: GameState,
        entityManager: EntityManager,
        weaponSystem: WeaponSystem,
        shieldSystem: ShieldSystem,
        messageSystem: MessageSystem
    ) {
        this.audio = audio;
        this.particles = particles;
        this.gameState = gameState;
        this.entityManager = entityManager;
        this.weaponSystem = weaponSystem;
        this.shieldSystem = shieldSystem;
        this.messageSystem = messageSystem;
    }

    /**
     * Check all collision types
     */
    checkAllCollisions(currentTime: number = performance.now()): void {
        const bullets = this.entityManager.getBullets();
        const missiles = this.entityManager.getMissiles();
        const asteroids = this.entityManager.getAsteroids();
        const gifts = this.entityManager.getGifts();
        const warpBubblesOut = this.entityManager.getWarpBubblesOut();
        const ships = this.entityManager.getShips();

        // Check bullet-asteroid collisions
        this.checkBulletAsteroidCollisions(bullets, asteroids, ships[0]); // Pass first ship for repulsor effect

        // Check missile-asteroid collisions (with explosion)
        this.checkMissileAsteroidCollisions(missiles, asteroids, ships[0]); // Pass first ship for repulsor effect

        // Check bullet-gift collisions
        this.checkBulletGiftCollisions(bullets, gifts);

        // Check ship-asteroid collisions for all ships (only if not invulnerable)
        for (const ship of ships) {
            if (!ship.invulnerable) {
                this.checkShipAsteroidCollisions(ship, asteroids, currentTime);
            }

            // Check ship-gift collisions
            this.checkShipGiftCollisions(ship, gifts);

            // Check laser collisions if laser is active
            if (ship.isLaserActive) {
                this.checkLaserCollisions(ship, asteroids, gifts);
            }

            // Check lightning collisions if lightning was recently fired
            if (
                ship.lightningTargets &&
                ship.lightningTargets.length > 0 &&
                ship.lightningTime
            ) {
                // Lightning effects are brief, only check collisions for a short time after firing
                const lightningDuration = 100; // milliseconds
                if (currentTime - ship.lightningTime <= lightningDuration) {
                    // Find the primary target from the lightning targets
                    const primaryTarget = this.findNearestLightningTarget(
                        ship.position,
                        this.weaponSystem.getLightningRadius(ship.playerId)
                    );
                    if (primaryTarget) {
                        this.checkLightningCollisions(
                            ship,
                            primaryTarget,
                            this.weaponSystem.getLightningRadius(ship.playerId),
                            currentTime
                        );
                    }
                }
            }
        }

        // Check gift-warpBubbleOut collisions (gift gets captured by closing warp)
        this.checkGiftWarpBubbleCollisions(gifts, warpBubblesOut);
    }

    /**
     * Check bullet-asteroid collisions
     */
    private checkBulletAsteroidCollisions(
        bullets: GameEntity[],
        asteroids: GameEntity[],
        ship: Ship | null
    ): void {
        for (const bullet of bullets) {
            for (const asteroid of asteroids) {
                if (Collision.checkCircleCollision(bullet, asteroid)) {
                    // Mark for removal by setting age very high
                    bullet.age = 999;

                    // Create smaller asteroids if this one is large enough
                    this.destroyAsteroid(asteroid, ship?.position);
                    break; // Bullet can only hit one asteroid
                }
            }
        }
    }

    /**
     * Check missile-asteroid collisions with explosion
     */
    private checkMissileAsteroidCollisions(
        missiles: GameEntity[],
        asteroids: GameEntity[],
        ship: Ship | null
    ): void {
        for (const missile of missiles) {
            for (const asteroid of asteroids) {
                const distance = Math.sqrt(
                    Math.pow(missile.position.x - asteroid.position.x, 2) +
                        Math.pow(missile.position.y - asteroid.position.y, 2)
                );

                // Missiles explode when within explosion radius
                if (distance <= WEAPONS.MISSILES.EXPLOSION_RADIUS) {
                    // Mark missile for removal
                    missile.age = 999;

                    // Create explosion particles
                    this.particles.createMissileExplosion(missile.position);

                    // Destroy all asteroids within explosion radius
                    for (const explosionTarget of asteroids) {
                        const explosionDistance = Math.sqrt(
                            Math.pow(
                                missile.position.x - explosionTarget.position.x,
                                2
                            ) +
                                Math.pow(
                                    missile.position.y -
                                        explosionTarget.position.y,
                                    2
                                )
                        );

                        if (
                            explosionDistance <=
                            WEAPONS.MISSILES.EXPLOSION_RADIUS
                        ) {
                            this.destroyAsteroid(
                                explosionTarget,
                                ship?.position
                            );
                        }
                    }
                    break; // Missile can only explode once
                }
            }
        }
    }

    /**
     * Check bullet-gift collisions
     */
    private checkBulletGiftCollisions(
        bullets: GameEntity[],
        gifts: GameEntity[]
    ): void {
        for (const bullet of bullets) {
            for (const gift of gifts) {
                if (Collision.checkCircleCollision(bullet, gift)) {
                    // Mark bullet for removal
                    bullet.age = 999;

                    // Destroy the gift with penalty
                    this.destroyGift(gift);
                    break; // Bullet can only hit one gift
                }
            }
        }
    }

    /**
     * Check ship-asteroid collisions
     */
    private checkShipAsteroidCollisions(
        ship: Ship,
        asteroids: GameEntity[],
        currentTime: number
    ): void {
        for (const asteroid of asteroids) {
            if (Collision.checkCircleCollision(ship, asteroid)) {
                // Check if ship has an active shield that is not recharging
                if (
                    this.shieldSystem.isShieldActive(ship.playerId) &&
                    !this.shieldSystem.isShieldRecharging(ship.playerId)
                ) {
                    // Handle shield collision (bouncing, fuel consumption, recharging)
                    this.shieldSystem.handleShieldCollision(
                        ship,
                        asteroid,
                        currentTime
                    );
                } else {
                    // No shield or shield is recharging - destroy the ship
                    // Create asteroid collision message first
                    this.messageSystem.createAsteroidCollisionMessage(
                        ship.position,
                        800, // TODO(claude): Get canvas dimensions from canvas manager
                        600
                    );
                    this.destroyShip(ship);
                }
                break; // Only one collision per frame
            }
        }
    }

    /**
     * Check ship-gift collisions
     */
    private checkShipGiftCollisions(ship: Ship, gifts: GameEntity[]): void {
        // AI companions (excluding original computer player) should not collect gifts
        const isCompanion = ship.isAI && ship.playerId !== "computer";
        if (isCompanion) {
            return; // Skip gift collection for AI companions
        }

        for (const gift of gifts) {
            if (Collision.checkCircleCollision(ship, gift)) {
                this.collectGift(gift, ship);
                break; // Only collect one gift per frame
            }
        }
    }

    /**
     * Check gift-warpBubbleOut collisions
     */
    private checkGiftWarpBubbleCollisions(
        gifts: GameEntity[],
        warpBubblesOut: GameEntity[]
    ): void {
        for (const gift of gifts) {
            for (const warpOut of warpBubblesOut) {
                // Check if gift has reached the center of the warp bubble (within 10 pixels)
                const dx = gift.position.x - warpOut.position.x;
                const dy = gift.position.y - warpOut.position.y;
                const distanceToCenter = Math.sqrt(dx * dx + dy * dy);
                if (distanceToCenter <= 10 && !warpOut.warpDisappearing) {
                    // Stop the wubwub ambient sound if it's playing
                    if (isGift(gift) && gift.wubwubAudioControl) {
                        gift.wubwubAudioControl.stop();
                    }

                    // Remove the gift (it gets captured by the closing warp)
                    this.entityManager.removeEntity(gift);

                    // Start the warp bubble disappearing animation
                    warpOut.warpDisappearing = true;
                    warpOut.warpDisappearStartTime = performance.now();
                    break;
                }
            }
        }
    }

    /**
     * Check laser collisions with asteroids and gifts
     */
    private checkLaserCollisions(
        ship: Ship,
        asteroids: GameEntity[],
        gifts: GameEntity[]
    ): void {
        const laserLength = this.weaponSystem.getLaserLength();

        // Calculate laser beam end point
        const laserStart = ship.position;
        const laserEnd = laserStart.add(
            Vector2.fromAngle(ship.rotation, laserLength)
        );

        // Track entities to destroy to avoid modifying array during iteration
        const asteroidsToDestroy: GameEntity[] = [];
        const giftsToDestroy: GameEntity[] = [];

        // Check collision with each asteroid using line-circle intersection
        for (const asteroid of asteroids) {
            // Skip newly created asteroids to prevent infinite fragmentation
            if (asteroid.age !== undefined && asteroid.age < 0.1) {
                continue; // Skip asteroids created less than 0.1 seconds ago
            }

            if (
                this.isLineCircleIntersection(
                    laserStart,
                    laserEnd,
                    asteroid.position,
                    asteroid.size.x / 2
                )
            ) {
                // Laser hit this asteroid - mark for destruction
                asteroidsToDestroy.push(asteroid);
            }
        }

        // Check collision with each gift using line-circle intersection
        for (const gift of gifts) {
            if (
                this.isLineCircleIntersection(
                    laserStart,
                    laserEnd,
                    gift.position,
                    gift.size.x / 2
                )
            ) {
                // Laser hit this gift - mark for destruction
                giftsToDestroy.push(gift);
            }
        }

        // Destroy all hit asteroids (this will create fragments, but they won't be hit this frame)
        for (const asteroid of asteroidsToDestroy) {
            this.destroyAsteroid(asteroid, ship.position);
        }

        // Destroy all hit gifts
        for (const gift of giftsToDestroy) {
            this.destroyGift(gift);
        }
    }

    /**
     * Check line-circle intersection for laser collision
     */
    private isLineCircleIntersection(
        lineStart: Vector2,
        lineEnd: Vector2,
        circleCenter: Vector2,
        circleRadius: number
    ): boolean {
        // Vector from line start to circle center
        const toCircle = circleCenter.subtract(lineStart);

        // Vector representing the line direction
        const lineDirection = lineEnd.subtract(lineStart);
        const lineLength = lineDirection.magnitude();

        if (lineLength === 0) return false; // Degenerate line

        // Normalize line direction
        const lineUnit = lineDirection.multiply(1 / lineLength);

        // Project circle center onto line
        const projection = toCircle.dot(lineUnit);

        // Clamp projection to line segment
        const clampedProjection = Math.max(0, Math.min(lineLength, projection));

        // Find closest point on line segment to circle center
        const closestPoint = lineStart.add(
            lineUnit.multiply(clampedProjection)
        );

        // Check if closest point is within circle radius
        const distanceToClosest = circleCenter
            .subtract(closestPoint)
            .magnitude();
        return distanceToClosest <= circleRadius;
    }

    /**
     * Destroy an asteroid and create fragments
     */
    private destroyAsteroid(
        asteroid: GameEntity,
        repulsorSource?: Vector2
    ): void {
        // Create asteroid explosion particles
        this.particles.createAsteroidExplosion(
            asteroid.position,
            asteroid.size.x
        );

        // Add score based on asteroid size
        const points = GameState.getAsteroidScore(asteroid.size.x);
        this.gameState.addScore(points);

        // Remove the asteroid
        this.entityManager.removeEntity(asteroid);

        // Create smaller asteroids if it's large enough to split
        if (asteroid.size.x > 20) {
            // Play asteroid break sound (splitting into pieces)
            this.audio.playAsteroidHit().catch(() => {
                // Ignore audio errors
            });

            // Create 2-3 smaller fragments
            const fragmentCount = 2 + Math.floor(Math.random() * 2);
            for (let i = 0; i < fragmentCount; i++) {
                const fragmentSize =
                    asteroid.size.x * (0.4 + Math.random() * 0.3); // 40-70% of original
                const speed = 80 + Math.random() * 60; // Faster fragments

                // Calculate fragment velocity with repulsor effect
                let angle: number;
                if (repulsorSource) {
                    // Bias fragments away from the repulsor source (usually the ship)
                    const awayFromSource =
                        asteroid.position.subtract(repulsorSource);
                    if (awayFromSource.magnitude() > 0) {
                        const baseAngle = Math.atan2(
                            awayFromSource.y,
                            awayFromSource.x
                        );
                        const randomOffset =
                            (Math.random() - 0.5) *
                            Math.PI *
                            (1 - ASTEROID.REPULSOR_STRENGTH);
                        angle = baseAngle + randomOffset;
                    } else {
                        // Fallback to random if positions are identical
                        angle = Math.random() * Math.PI * 2;
                    }
                } else {
                    // No repulsor source - use completely random angle
                    angle = Math.random() * Math.PI * 2;
                }

                this.entityManager.addEntity({
                    position: asteroid.position.add(
                        new Vector2(
                            (Math.random() - 0.5) * 40,
                            (Math.random() - 0.5) * 40
                        )
                    ),
                    velocity: Vector2.fromAngle(angle, speed),
                    size: new Vector2(fragmentSize, fragmentSize),
                    rotation: Math.random() * Math.PI * 2,
                    color: "#ffffff",
                    type: "asteroid",
                    age: 0, // Mark as newly created
                });
            }
        } else {
            // Play asteroid destruction sound (completely destroyed)
            this.audio.playAsteroidDestroy().catch(() => {
                // Ignore audio errors
            });
        }
    }

    /**
     * Collect a gift and apply its benefits
     */
    private collectGift(gift: GameEntity, ship?: Ship): void {
        // Stop the wubwub ambient sound if it's playing
        if (isGift(gift) && gift.wubwubAudioControl) {
            gift.wubwubAudioControl.stop();
        }

        // Play gift collection sound
        this.audio.playGiftCollected().catch(() => {
            // Ignore audio errors
        });

        // Remove the gift from the game
        this.entityManager.removeEntity(gift);

        // Determine which player collected the gift
        const playerId = ship?.playerId || "player";

        // Award points for gift collection
        this.gameState.addScore(SCORING.GIFT, playerId);

        // Apply gift benefits based on type
        const giftType = gift.giftType || "fuel_refill";

        // Create message for gift collection
        if (ship) {
            this.messageSystem.createGiftMessage(
                giftType,
                ship.position,
                800, // TODO(claude): Get canvas dimensions from canvas manager
                600
            );
        }

        switch (giftType) {
            case "fuel_refill":
                this.gameState.refillFuel(playerId);
                break;

            case "extra_life":
                this.gameState.addLife(playerId);
                break;

            case "weapon_bullets":
                this.gameState.unlockWeapon("bullets", playerId);
                this.gameState.switchWeapon("bullets", playerId);
                break;

            case "weapon_missiles":
                this.gameState.unlockWeapon("missiles", playerId);
                this.gameState.switchWeapon("missiles", playerId);
                break;

            case "weapon_laser":
                this.gameState.unlockWeapon("laser", playerId);
                this.gameState.switchWeapon("laser", playerId);
                break;

            case "weapon_lightning":
                this.gameState.unlockWeapon("lightning", playerId);
                this.gameState.switchWeapon("lightning", playerId);
                break;

            case "ai_companion":
                this.spawnAICompanion(ship);
                break;

            default:
                // Handle upgrades
                this.gameState.applyWeaponUpgrade(giftType, playerId);
                break;
        }
    }

    /**
     * Destroy a gift with penalty
     */
    private destroyGift(gift: GameEntity): void {
        // Stop the wubwub ambient sound if it's playing
        if (isGift(gift) && gift.wubwubAudioControl) {
            gift.wubwubAudioControl.stop();
        }

        // Play frustrated cat sound
        this.audio.playGiftDestroyed().catch(() => {
            // Ignore audio errors
        });

        // Remove the gift from the game
        this.entityManager.removeEntity(gift);

        // Apply score penalty for destroying a gift
        this.gameState.addScore(-SCORING.GIFT_DESTRUCTION_PENALTY);

        // Create explosion particles for visual feedback
        this.particles.createGiftExplosion(gift.position);
    }

    /**
     * Destroy the ship
     */
    private destroyShip(ship: Ship): void {
        // Create ship explosion particles
        this.particles.createShipExplosion(ship.position);

        // Play ship destruction sound
        this.audio.playShipHit().catch(() => {
            // Ignore audio errors
        });

        // Handle different ship types
        if (ship.playerId === "player") {
            // Human player loses a life
            this.gameState.loseLife(ship.playerId);

            // If game over, remove the ship from the game
            if (this.gameState.gameOver) {
                this.entityManager.removeEntity(ship);
                return;
            }

            // Respawn human player
            this.respawnShip(ship);
        } else if (ship.playerId === "computer") {
            // Original computer player respawns
            this.respawnShip(ship);
        } else {
            // AI companions are permanently destroyed
            this.gameState.removeAICompanion(ship.playerId);
            this.entityManager.removeEntity(ship);
        }
    }

    /**
     * Respawn the ship after destruction
     */
    private respawnShip(ship: Ship): void {
        // Reset ship position and velocity based on ship type
        const dimensions = { width: 800, height: 600 }; // TODO(claude): Get dimensions from canvas manager instead of hardcoded values

        if (ship.playerId === "player") {
            ship.position = new Vector2(
                dimensions.width * 0.4, // Left side for player
                dimensions.height * 0.5
            );
        } else if (ship.playerId === "computer") {
            ship.position = new Vector2(
                dimensions.width * 0.6, // Right side for computer
                dimensions.height * 0.5
            );
        } else {
            // Fallback to center for ships without playerId
            ship.position = new Vector2(
                dimensions.width * 0.5,
                dimensions.height * 0.5
            );
        }

        ship.velocity = Vector2.zero();
        ship.rotation = 0;

        // Clear trail on respawn
        ship.trail = [];

        // Make ship invulnerable for designated time
        ship.invulnerable = true;
        ship.invulnerableTime = 3.0; // 3 seconds of invulnerability

        // Refill fuel to maximum when using an extra life
        this.gameState.refillFuel();
    }

    /**
     * Check lightning collisions and apply damage
     */
    checkLightningCollisions(
        ship: Ship,
        primaryTarget: GameEntity,
        _radius: number,
        _currentTime: number
    ): void {
        // Destroy primary target
        if (primaryTarget.type === "asteroid") {
            this.destroyAsteroid(primaryTarget, ship.position);
        } else if (primaryTarget.type === "gift") {
            this.destroyGift(primaryTarget);
        }

        // Chain lightning upgrade - find secondary targets
        if (this.gameState.hasUpgrade("upgrade_lightning_chain")) {
            let chainSource = primaryTarget.position;
            let chainsRemaining = 2; // Maximum 2 additional jumps

            while (chainsRemaining > 0) {
                const lightningRadius = this.weaponSystem.getLightningRadius();
                const secondaryTarget = this.findNearestLightningTarget(
                    chainSource,
                    lightningRadius * 0.8
                ); // Slightly reduced range for chains
                if (!secondaryTarget || secondaryTarget === primaryTarget) {
                    break; // No more valid targets
                }

                // Destroy secondary target
                if (secondaryTarget.type === "asteroid") {
                    this.destroyAsteroid(secondaryTarget, ship.position);
                } else if (secondaryTarget.type === "gift") {
                    this.destroyGift(secondaryTarget);
                }

                chainSource = secondaryTarget.position;
                chainsRemaining--;
            }
        }
    }

    /**
     * Find nearest target for lightning within range
     */
    private findNearestLightningTarget(
        sourcePosition: Vector2,
        radius: number
    ): GameEntity | null {
        let nearestTarget: GameEntity | null = null;
        let nearestDistance = Infinity;

        // Get all potential targets (asteroids and gifts)
        const potentialTargets = [
            ...this.entityManager.getAsteroids(),
            ...this.entityManager.getGifts(),
        ];

        for (const obj of potentialTargets) {
            const distance = sourcePosition.subtract(obj.position).magnitude();
            if (distance <= radius && distance < nearestDistance) {
                nearestTarget = obj;
                nearestDistance = distance;
            }
        }

        return nearestTarget;
    }

    /**
     * Spawn an AI companion ship near the collecting ship
     */
    private spawnAICompanion(collectingShip?: Ship): void {
        // Generate unique companion ID
        const companionId = `companion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Register the companion in game state
        this.gameState.addAICompanion(companionId);

        // Position companion near the collecting ship (or center if no ship provided)
        let spawnPosition: Vector2;
        if (collectingShip) {
            // Spawn near the collecting ship but offset to avoid collision
            const offsetAngle = Math.random() * Math.PI * 2;
            const offsetDistance = 80; // Safe distance from player
            const offset = Vector2.fromAngle(offsetAngle, offsetDistance);
            spawnPosition = collectingShip.position.add(offset);
        } else {
            // Fallback to center position
            spawnPosition = new Vector2(400, 300); // TODO(claude): Get canvas center from canvas manager
        }

        // Create AI companion ship
        const companion: Ship = {
            position: spawnPosition,
            velocity: Vector2.zero(),
            size: new Vector2(20, 10), // Same size as regular ships
            rotation: 0,
            color: "#00dd88", // Distinct green color for AI companions
            type: "ship",
            playerId: companionId,
            age: 0,

            // AI-specific properties
            isAI: true,
            aiState: "assisting", // Start in assisting mode to follow player
            aiTarget: null,
            aiLastDecisionTime: 0,

            // Ship state
            invulnerable: true, // Brief invulnerability on spawn
            invulnerableTime: 2.0, // 2 seconds
            thrusting: false,
            strafingLeft: false,
            strafingRight: false,
            isLaserActive: false,
            trail: [],
        };

        // Add the companion to the entity manager
        this.entityManager.addEntity(companion);
    }
}
