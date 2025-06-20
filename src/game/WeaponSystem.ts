import { Vector2 } from "~/utils/Vector2";
import type { GameEntity, Ship } from "~/entities";
import { AudioManager } from "~/audio/AudioManager";
import { ParticleSystem } from "~/render/ParticleSystem";
import { GameState } from "./GameState";
import { EntityManager } from "./EntityManager";
import { BULLET, WEAPONS } from "~/config/constants";
import { InputContext } from "~/input/InputContext";

/**
 * Manages all weapon systems - firing, switching, fuel management, and upgrades
 */
export class WeaponSystem {
    private audio: AudioManager;
    private particles: ParticleSystem;
    private gameState: GameState;
    private entityManager: EntityManager;

    // Weapon state tracking
    private lastShotTime = 0;
    private lastLaserSoundTime = 0;
    private lastLightningTime = 0;
    private bulletsInCurrentActivation = 0;
    private lastShootKeyState = false;

    constructor(
        audio: AudioManager,
        particles: ParticleSystem,
        gameState: GameState,
        entityManager: EntityManager
    ) {
        this.audio = audio;
        this.particles = particles;
        this.gameState = gameState;
        this.entityManager = entityManager;
    }

    /**
     * Handle weapon input and firing
     */
    handleWeaponInput(
        ship: Ship,
        input: {
            weapon1: boolean;
            weapon2: boolean;
            weapon3: boolean;
            weapon4: boolean;
            shoot: boolean;
            shootPressed: boolean;
        },
        currentTime: number,
        inputContext: InputContext
    ): void {
        // Handle weapon switching
        if (input.weapon1) {
            this.gameState.switchWeapon("bullets", ship.playerId);
        } else if (input.weapon2) {
            this.gameState.switchWeapon("missiles", ship.playerId);
        } else if (input.weapon3) {
            this.gameState.switchWeapon("laser", ship.playerId);
        } else if (input.weapon4) {
            this.gameState.switchWeapon("lightning", ship.playerId);
        }

        // Handle shooting only in GAMEPLAY context
        if (inputContext === InputContext.GAMEPLAY) {
            this.handleShooting(ship, input, currentTime);
        }
    }

    /**
     * Handle shooting input based on weapon type
     */
    private handleShooting(
        ship: Ship,
        input: { shoot: boolean; shootPressed: boolean },
        currentTime: number
    ): void {
        // Handle activation tracking for bullet limits
        const currentShootKeyState = input.shoot;
        if (!this.lastShootKeyState && currentShootKeyState) {
            // Key was just pressed - reset bullet count for new activation
            this.bulletsInCurrentActivation = 0;
        } else if (this.lastShootKeyState && !currentShootKeyState) {
            // Key was just released - reset bullet count for next activation
            this.bulletsInCurrentActivation = 0;
        }
        this.lastShootKeyState = currentShootKeyState;

        // Handle shooting based on weapon type
        const playerState = this.gameState.getPlayerState(ship.playerId);
        if (!playerState) return;

        const weaponState = playerState.weaponState;
        if (weaponState.currentWeapon === "bullets") {
            // Bullets: use continuous input (can hold key for burst)
            if (currentShootKeyState) {
                this.shootBullets(ship, currentTime);
            }
        } else if (weaponState.currentWeapon === "laser") {
            // Laser: use continuous input (hold key to fire)
            if (currentShootKeyState) {
                this.shootLaser(ship, currentTime);
            } else if (ship.isLaserActive) {
                // Stop laser when key is released
                ship.isLaserActive = false;
                ship.laserStartTime = undefined;
            }
        } else {
            // Other weapons: use single press input
            if (input.shootPressed) {
                this.handleSinglePressWeapons(ship, currentTime);
            }
        }
    }

    /**
     * Handle weapons that use single press input
     */
    private handleSinglePressWeapons(ship: Ship, currentTime: number): void {
        const playerState = this.gameState.getPlayerState(ship.playerId);
        if (!playerState) return;

        const weaponState = playerState.weaponState;
        switch (weaponState.currentWeapon) {
            case "missiles":
                this.shootMissiles(ship, currentTime);
                break;
            case "lightning":
                this.shootLightning(ship, currentTime);
                break;
        }
    }

    /**
     * Shoot bullets
     */
    private shootBullets(ship: Ship, currentTime: number): void {
        // Check bullet limit per activation
        if (this.bulletsInCurrentActivation >= BULLET.BULLETS_PER_ACTIVATION) {
            return; // Already fired maximum bullets for this activation
        }

        // Check fire rate (with upgrade consideration)
        let fireRate = BULLET.FIRE_RATE;
        if (
            this.gameState.hasUpgrade(
                "upgrade_bullets_fire_rate",
                ship.playerId
            )
        ) {
            fireRate *= WEAPONS.BULLETS.FIRE_RATE_UPGRADE; // 25% faster
        }

        if (currentTime - this.lastShotTime < fireRate) {
            return; // Too soon to fire again
        }

        // Check and consume fuel
        if (
            !this.gameState.consumeFuel(
                WEAPONS.BULLETS.FUEL_CONSUMPTION,
                ship.playerId
            )
        ) {
            return; // Not enough fuel
        }

        const bulletSpeed = 500; // pixels per second
        const bulletVelocity = Vector2.fromAngle(ship.rotation, bulletSpeed);

        // Add ship's velocity to bullet for realistic physics
        const finalVelocity = ship.velocity.add(bulletVelocity);

        // Position bullet slightly in front of ship
        const bulletOffset = Vector2.fromAngle(ship.rotation, ship.size.x);
        const bulletPosition = ship.position.add(bulletOffset);

        // Determine bullet size and range (with upgrade consideration)
        let bulletSize = BULLET.SIZE;
        let bulletColor: string = WEAPONS.BULLETS.COLOR;
        let bulletMaxAge = BULLET.MAX_AGE;

        // Apply upgrades (each upgrade also increases range by 40%)
        let rangeMultiplier = 1.0;
        if (
            this.gameState.hasUpgrade(
                "upgrade_bullets_fire_rate",
                ship.playerId
            )
        ) {
            rangeMultiplier *= WEAPONS.BULLETS.RANGE_UPGRADE; // 40% increase
        }
        if (this.gameState.hasUpgrade("upgrade_bullets_size", ship.playerId)) {
            bulletSize *= WEAPONS.BULLETS.SIZE_UPGRADE; // 50% larger
            bulletColor = WEAPONS.BULLETS.UPGRADED_COLOR;
            rangeMultiplier *= WEAPONS.BULLETS.RANGE_UPGRADE; // 40% increase
        }

        // Apply range multiplier
        bulletMaxAge *= rangeMultiplier;

        this.entityManager.addEntity({
            position: bulletPosition,
            velocity: finalVelocity,
            size: new Vector2(bulletSize, bulletSize),
            rotation: 0,
            color: bulletColor,
            type: "bullet",
            age: 0,
            maxAge: bulletMaxAge, // Custom max age for this bullet
        });

        this.lastShotTime = currentTime;
        this.gameState.updateLastFireTime(currentTime, ship.playerId);
        this.bulletsInCurrentActivation++; // Increment bullet count for this activation

        // Play shooting sound
        this.audio.playShoot().catch(() => {
            // Ignore audio errors (user hasn't interacted yet)
        });
    }

    /**
     * Shoot missiles
     */
    private shootMissiles(ship: Ship, currentTime: number): void {
        // Check fire rate (with upgrade consideration)
        let fireRate = WEAPONS.MISSILES.FIRE_RATE;
        if (
            this.gameState.hasUpgrade(
                "upgrade_missiles_fire_rate",
                ship.playerId
            )
        ) {
            fireRate *= WEAPONS.MISSILES.FIRE_RATE_UPGRADE; // 50% faster
        }

        if (currentTime - this.lastShotTime < fireRate) {
            // Play cooldown sound effect
            this.audio.playMissileCooldown().catch(() => {
                // Ignore audio errors (user hasn't interacted yet)
            });
            return; // Too soon to fire again
        }

        // Check and consume fuel
        if (
            !this.gameState.consumeFuel(
                WEAPONS.MISSILES.FUEL_CONSUMPTION,
                ship.playerId
            )
        ) {
            return; // Not enough fuel
        }

        // Missile initial speed (with upgrade consideration for max speed)
        const missileSpeed = WEAPONS.MISSILES.INITIAL_SPEED;
        const missileVelocity = Vector2.fromAngle(ship.rotation, missileSpeed);

        // Add ship's velocity to missile for realistic physics
        const finalVelocity = ship.velocity.add(missileVelocity);

        // Position missile slightly in front of ship
        const missileOffset = Vector2.fromAngle(ship.rotation, ship.size.x);
        const missilePosition = ship.position.add(missileOffset);

        this.entityManager.addEntity({
            position: missilePosition,
            velocity: finalVelocity,
            size: new Vector2(WEAPONS.MISSILES.SIZE, WEAPONS.MISSILES.SIZE),
            rotation: ship.rotation, // Missiles have rotation for visual
            color: WEAPONS.MISSILES.COLOR,
            type: "missile",
            age: 0,
        });

        this.lastShotTime = currentTime;
        this.gameState.updateLastFireTime(currentTime, ship.playerId);

        // Play missile launch sound
        this.audio.playMissileLaunch().catch(() => {
            // Ignore audio errors (user hasn't interacted yet)
        });
    }

    /**
     * Shoot laser
     */
    private shootLaser(ship: Ship, currentTime: number): void {
        // Calculate fuel consumption rate with upgrades
        let fuelConsumptionRate = WEAPONS.LASER.FUEL_CONSUMPTION_RATE;
        if (
            this.gameState.hasUpgrade("upgrade_laser_efficiency", ship.playerId)
        ) {
            fuelConsumptionRate *= WEAPONS.LASER.EFFICIENCY_UPGRADE; // 50% more efficient
        }

        // Check if we're starting to fire the laser
        if (!ship.isLaserActive) {
            ship.isLaserActive = true;
            ship.laserStartTime = currentTime;
        }

        // Calculate fuel consumption for this frame (assuming 60fps)
        const deltaTime = 1 / 60; // Approximate frame time in seconds
        const fuelNeeded = fuelConsumptionRate * deltaTime;

        // Check if we have enough fuel to continue firing
        if (!this.gameState.consumeFuel(fuelNeeded, ship.playerId)) {
            // Not enough fuel, stop the laser
            ship.isLaserActive = false;
            ship.laserStartTime = undefined;
            return;
        }

        // Play laser sound effect periodically while firing
        if (currentTime - this.lastLaserSoundTime > 150) {
            // Every 150ms
            this.audio.playLaserFire().catch(() => {
                // Ignore audio errors
            });
            this.lastLaserSoundTime = currentTime;
        }
    }

    /**
     * Shoot lightning
     */
    private shootLightning(ship: Ship, currentTime: number): void {
        // Check cooldown
        if (
            currentTime - this.lastLightningTime <
            WEAPONS.LIGHTNING.FIRE_RATE
        ) {
            return; // Too soon to fire again
        }

        // Calculate lightning radius with upgrades
        let lightningRadius = WEAPONS.LIGHTNING.RADIUS;
        if (
            this.gameState.hasUpgrade("upgrade_lightning_radius", ship.playerId)
        ) {
            lightningRadius *= WEAPONS.LIGHTNING.RADIUS_UPGRADE; // 20% larger
        }

        // Find nearest target within range FIRST
        const target = this.findNearestTarget(ship.position, lightningRadius);

        if (!target) {
            // No target found - play muffled electric "urk" sound but don't consume fuel or cooldown
            this.audio.playLightningMiss().catch(() => {
                // Ignore audio errors
            });
            return;
        }

        // Only now check and consume fuel (since we have a valid target)
        if (
            !this.gameState.consumeFuel(
                WEAPONS.LIGHTNING.FUEL_CONSUMPTION,
                ship.playerId
            )
        ) {
            return; // Not enough fuel
        }

        // Store lightning data for rendering
        this.setLightningTargets(ship, target, lightningRadius, currentTime);

        // Update cooldown
        this.lastLightningTime = currentTime;

        // Play lightning sound effect
        this.audio.playLightningStrike().catch(() => {
            // Ignore audio errors
        });
    }

    /**
     * Find nearest target within range for lightning
     */
    private findNearestTarget(
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
     * Set lightning targets for rendering
     */
    private setLightningTargets(
        ship: Ship,
        primaryTarget: GameEntity,
        radius: number,
        currentTime: number
    ): void {
        // Store lightning targets for rendering
        const lightningTargets: { start: Vector2; end: Vector2 }[] = [];

        // Primary arc from ship to target
        lightningTargets.push({
            start: ship.position,
            end: primaryTarget.position,
        });

        // Chain lightning upgrade - find secondary targets
        if (
            this.gameState.hasUpgrade("upgrade_lightning_chain", ship.playerId)
        ) {
            let chainSource = primaryTarget.position;
            let chainsRemaining = 2; // Maximum 2 additional jumps

            while (chainsRemaining > 0) {
                const secondaryTarget = this.findNearestTarget(
                    chainSource,
                    radius * 0.8
                ); // Slightly reduced range for chains
                if (!secondaryTarget || secondaryTarget === primaryTarget) {
                    break; // No more valid targets
                }

                // Add chain lightning arc
                lightningTargets.push({
                    start: chainSource,
                    end: secondaryTarget.position,
                });

                chainSource = secondaryTarget.position;
                chainsRemaining--;
            }
        }

        // Store lightning data for rendering
        ship.lightningTargets = lightningTargets;
        ship.lightningTime = currentTime;
    }

    /**
     * Update missile physics
     */
    updateMissilePhysics(deltaTime: number): void {
        const missiles = this.entityManager.getMissiles();

        missiles.forEach((missile) => {
            // Apply missile acceleration
            this.updateMissileAcceleration(missile, deltaTime);

            // Apply homing behavior if upgrade is active
            if (this.gameState.hasUpgrade("upgrade_missiles_homing")) {
                this.updateMissileHoming(missile, deltaTime);
            }

            // Create missile trail particles
            this.particles.createMissileTrail(
                missile.position,
                missile.velocity
            );
        });
    }

    /**
     * Update missile acceleration
     */
    private updateMissileAcceleration(
        missile: GameEntity,
        deltaTime: number
    ): void {
        // Calculate current speed
        const currentSpeed = Math.sqrt(
            missile.velocity.x * missile.velocity.x +
                missile.velocity.y * missile.velocity.y
        );

        // Calculate max speed (with upgrade consideration)
        let maxSpeed = WEAPONS.MISSILES.MAX_SPEED;
        if (this.gameState.hasUpgrade("upgrade_missiles_speed")) {
            maxSpeed *= WEAPONS.MISSILES.SPEED_UPGRADE; // 50% faster max speed
        }

        // Apply acceleration if below max speed
        if (currentSpeed < maxSpeed) {
            const accelerationAmount =
                WEAPONS.MISSILES.ACCELERATION * deltaTime;
            const direction = missile.velocity.normalize();
            const newSpeed = Math.min(
                currentSpeed + accelerationAmount,
                maxSpeed
            );

            // Update velocity with new speed in same direction
            missile.velocity = direction.multiply(newSpeed);
        }
    }

    /**
     * Update missile homing behavior
     */
    private updateMissileHoming(missile: GameEntity, deltaTime: number): void {
        // Find the closest asteroid within homing range
        const asteroids = this.entityManager.getAsteroids();
        let closestAsteroid: GameEntity | null = null;
        let closestDistance: number = WEAPONS.MISSILES.HOMING_RANGE;

        for (const asteroid of asteroids) {
            const distance = Math.sqrt(
                Math.pow(missile.position.x - asteroid.position.x, 2) +
                    Math.pow(missile.position.y - asteroid.position.y, 2)
            );

            if (distance < closestDistance) {
                // Check if asteroid is in the missile's viewing cone (front 90 degrees)
                const toAsteroid = new Vector2(
                    asteroid.position.x - missile.position.x,
                    asteroid.position.y - missile.position.y
                ).normalize();

                const missileDirection = Vector2.fromAngle(missile.rotation, 1);
                const dotProduct = toAsteroid.dot(missileDirection);

                // Only target asteroids in front of the missile (dot product > 0.5 = ~60 degree cone)
                if (dotProduct > 0.5) {
                    closestDistance = distance;
                    closestAsteroid = asteroid;
                }
            }
        }

        // If we found a target, adjust missile trajectory
        if (closestAsteroid) {
            const targetDirection = new Vector2(
                closestAsteroid.position.x - missile.position.x,
                closestAsteroid.position.y - missile.position.y
            ).normalize();

            // Current missile speed
            const currentSpeed = Math.sqrt(
                missile.velocity.x * missile.velocity.x +
                    missile.velocity.y * missile.velocity.y
            );

            // Gradually turn toward target (not instant lock-on)
            const turnRate = 3.0; // radians per second
            const maxTurnThisFrame = turnRate * deltaTime;

            const currentDirection = missile.velocity.normalize();
            const targetAngle = Math.atan2(
                targetDirection.y,
                targetDirection.x
            );
            const currentAngle = Math.atan2(
                currentDirection.y,
                currentDirection.x
            );

            let angleDiff = targetAngle - currentAngle;

            // Normalize angle difference to [-π, π]
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

            // Limit turn rate
            const turnAmount =
                Math.sign(angleDiff) *
                Math.min(Math.abs(angleDiff), maxTurnThisFrame);
            const newAngle = currentAngle + turnAmount;

            // Update missile velocity and rotation
            missile.velocity = Vector2.fromAngle(newAngle, currentSpeed);
            missile.rotation = newAngle;
        }
    }

    /**
     * Get laser length for collision detection
     */
    getLaserLength(): number {
        let laserLength = WEAPONS.LASER.LENGTH;
        if (this.gameState.hasUpgrade("upgrade_laser_range")) {
            laserLength *= WEAPONS.LASER.LENGTH_UPGRADE; // 50% longer
        }
        return laserLength;
    }

    /**
     * Get lightning radius for collision detection
     */
    getLightningRadius(playerId: string = "player"): number {
        let lightningRadius = WEAPONS.LIGHTNING.RADIUS;
        if (this.gameState.hasUpgrade("upgrade_lightning_radius", playerId)) {
            lightningRadius *= WEAPONS.LIGHTNING.RADIUS_UPGRADE; // 20% larger
        }
        return lightningRadius;
    }

    /**
     * Reset weapon state (for game restart)
     */
    reset(): void {
        this.lastShotTime = 0;
        this.lastLaserSoundTime = 0;
        this.lastLightningTime = 0;
        this.bulletsInCurrentActivation = 0;
        this.lastShootKeyState = false;
    }
}
