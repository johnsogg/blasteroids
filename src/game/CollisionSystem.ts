import { Vector2 } from "~/utils/Vector2";
import type { GameEntity, Ship } from "~/entities";
import { Collision } from "~/physics/Collision";
import { AudioManager } from "~/audio/AudioManager";
import { ParticleSystem } from "~/render/ParticleSystem";
import { GameState } from "./GameState";
import { EntityManager } from "./EntityManager";
import { WeaponSystem } from "./WeaponSystem";
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

    constructor(
        audio: AudioManager,
        particles: ParticleSystem,
        gameState: GameState,
        entityManager: EntityManager,
        weaponSystem: WeaponSystem
    ) {
        this.audio = audio;
        this.particles = particles;
        this.gameState = gameState;
        this.entityManager = entityManager;
        this.weaponSystem = weaponSystem;
    }

    /**
     * Check all collision types
     */
    checkAllCollisions(): void {
        const bullets = this.entityManager.getBullets();
        const missiles = this.entityManager.getMissiles();
        const asteroids = this.entityManager.getAsteroids();
        const gifts = this.entityManager.getGifts();
        const warpBubblesOut = this.entityManager.getWarpBubblesOut();
        const ship = this.entityManager.getShip();

        // Check bullet-asteroid collisions
        this.checkBulletAsteroidCollisions(bullets, asteroids, ship);

        // Check missile-asteroid collisions (with explosion)
        this.checkMissileAsteroidCollisions(missiles, asteroids, ship);

        // Check bullet-gift collisions
        this.checkBulletGiftCollisions(bullets, gifts);

        // Check ship-asteroid collisions (only if ship is not invulnerable)
        if (ship && !ship.invulnerable) {
            this.checkShipAsteroidCollisions(ship, asteroids);
        }

        // Check ship-gift collisions
        if (ship) {
            this.checkShipGiftCollisions(ship, gifts);
        }

        // Check gift-warpBubbleOut collisions (gift gets captured by closing warp)
        this.checkGiftWarpBubbleCollisions(gifts, warpBubblesOut);

        // Check laser collisions if laser is active
        if (ship && ship.isLaserActive) {
            this.checkLaserCollisions(ship, asteroids, gifts);
        }
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
        asteroids: GameEntity[]
    ): void {
        for (const asteroid of asteroids) {
            if (Collision.checkCircleCollision(ship, asteroid)) {
                this.destroyShip(ship);
                break; // Only one collision per frame
            }
        }
    }

    /**
     * Check ship-gift collisions
     */
    private checkShipGiftCollisions(ship: Ship, gifts: GameEntity[]): void {
        for (const gift of gifts) {
            if (Collision.checkCircleCollision(ship, gift)) {
                this.collectGift(gift);
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
    private collectGift(gift: GameEntity): void {
        // Play gift collection sound
        this.audio.playGiftCollected().catch(() => {
            // Ignore audio errors
        });

        // Remove the gift from the game
        this.entityManager.removeEntity(gift);

        // Award points for gift collection
        this.gameState.addScore(SCORING.GIFT);

        // Apply gift benefits based on type
        const giftType = gift.giftType || "fuel_refill";

        switch (giftType) {
            case "fuel_refill":
                this.gameState.refillFuel();
                break;

            case "extra_life":
                this.gameState.addLife();
                break;

            case "weapon_bullets":
                this.gameState.unlockWeapon("bullets");
                this.gameState.switchWeapon("bullets");
                break;

            case "weapon_missiles":
                this.gameState.unlockWeapon("missiles");
                this.gameState.switchWeapon("missiles");
                break;

            case "weapon_laser":
                this.gameState.unlockWeapon("laser");
                this.gameState.switchWeapon("laser");
                break;

            case "weapon_lightning":
                this.gameState.unlockWeapon("lightning");
                this.gameState.switchWeapon("lightning");
                break;

            default:
                // Handle upgrades
                this.gameState.applyWeaponUpgrade(giftType);
                break;
        }
    }

    /**
     * Destroy a gift with penalty
     */
    private destroyGift(gift: GameEntity): void {
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

        // Lose a life
        this.gameState.loseLife();

        // If game over, remove the ship from the game
        if (this.gameState.gameOver) {
            this.entityManager.removeEntity(ship);
        } else {
            // Reset ship state for respawn
            this.respawnShip(ship);
        }
    }

    /**
     * Respawn the ship after destruction
     */
    private respawnShip(ship: Ship): void {
        // Reset ship position and velocity
        const dimensions = { width: 800, height: 600 }; // TODO: Get from canvas manager
        ship.position = new Vector2(
            dimensions.width * 0.5,
            dimensions.height * 0.5
        );
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
}
