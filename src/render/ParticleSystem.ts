import { Vector2 } from "~/utils/Vector2";
import { VFX } from "~/config/constants";

interface Particle {
    position: Vector2;
    velocity: Vector2;
    life: number;
    maxLife: number;
    size: number;
    color: string;
}

export class ParticleSystem {
    private particles: Particle[] = [];

    update(deltaTime: number): void {
        // Update all particles
        this.particles.forEach((particle) => {
            particle.position = particle.position.add(
                particle.velocity.multiply(deltaTime)
            );
            particle.life -= deltaTime;

            // Apply slight friction to particles
            particle.velocity = particle.velocity.multiply(
                VFX.PARTICLE_FRICTION
            );
        });

        // Remove dead particles
        this.particles = this.particles.filter((particle) => particle.life > 0);
    }

    render(ctx: CanvasRenderingContext2D): void {
        this.particles.forEach((particle) => {
            const alpha = particle.life / particle.maxLife;

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(
                particle.position.x,
                particle.position.y,
                particle.size * alpha,
                0,
                Math.PI * 2
            );
            ctx.fill();
            ctx.restore();
        });
    }

    createAsteroidExplosion(position: Vector2, asteroidSize: number): void {
        // Create subtle particles for asteroid explosion
        const particleCount = Math.floor(
            asteroidSize / VFX.ASTEROID_PARTICLE_SIZE_RATIO
        ); // Smaller asteroids = fewer particles

        for (let i = 0; i < particleCount; i++) {
            const angle =
                (Math.PI * 2 * i) / particleCount +
                (Math.random() - 0.5) * VFX.ASTEROID_PARTICLE_ANGLE_VARIATION;
            const speed =
                VFX.ASTEROID_PARTICLE_SPEED_MIN +
                Math.random() * VFX.ASTEROID_PARTICLE_SPEED_MAX;
            const velocity = Vector2.fromAngle(angle, speed);

            this.particles.push({
                position: position.add(
                    new Vector2(
                        (Math.random() - 0.5) *
                            VFX.ASTEROID_PARTICLE_SPAWN_SPREAD,
                        (Math.random() - 0.5) *
                            VFX.ASTEROID_PARTICLE_SPAWN_SPREAD
                    )
                ),
                velocity: velocity,
                life:
                    VFX.ASTEROID_PARTICLE_LIFE_MIN +
                    Math.random() * VFX.ASTEROID_PARTICLE_LIFE_VARIATION,
                maxLife: VFX.ASTEROID_PARTICLE_MAX_LIFE,
                size:
                    VFX.ASTEROID_PARTICLE_SIZE_MIN +
                    Math.random() * VFX.ASTEROID_PARTICLE_SIZE_VARIATION,
                color: "#ffffff",
            });
        }
    }

    createShipExplosion(position: Vector2): void {
        // Create more dramatic but still subtle explosion for ship
        const particleCount = VFX.SHIP_EXPLOSION_PARTICLES;

        for (let i = 0; i < particleCount; i++) {
            const angle =
                (Math.PI * 2 * i) / particleCount +
                (Math.random() - 0.5) * VFX.SHIP_PARTICLE_ANGLE_VARIATION;
            const speed =
                VFX.SHIP_PARTICLE_SPEED_MIN +
                Math.random() * VFX.SHIP_PARTICLE_SPEED_MAX;
            const velocity = Vector2.fromAngle(angle, speed);

            this.particles.push({
                position: position.add(
                    new Vector2(
                        (Math.random() - 0.5) * VFX.SHIP_PARTICLE_SPAWN_SPREAD,
                        (Math.random() - 0.5) * VFX.SHIP_PARTICLE_SPAWN_SPREAD
                    )
                ),
                velocity: velocity,
                life:
                    VFX.SHIP_PARTICLE_LIFE_MIN +
                    Math.random() * VFX.SHIP_PARTICLE_LIFE_VARIATION,
                maxLife: VFX.SHIP_PARTICLE_MAX_LIFE,
                size:
                    VFX.SHIP_PARTICLE_SIZE_MIN +
                    Math.random() * VFX.SHIP_PARTICLE_SIZE_VARIATION,
                color:
                    Math.random() > VFX.SHIP_PARTICLE_ORANGE_CHANCE
                        ? "#ffaa00"
                        : "#ffffff", // Mostly white with some orange
            });
        }
    }

    createMissileTrail(position: Vector2, velocity: Vector2): void {
        // Create small exhaust particles behind missile
        const trailPosition = position.add(velocity.normalize().multiply(-8)); // Behind missile

        for (let i = 0; i < 2; i++) {
            // Small number of particles per frame
            const spread = (Math.random() - 0.5) * 0.8; // Small spread
            const backwardDirection = velocity.normalize().multiply(-1);
            const trailVelocity = backwardDirection
                .multiply(20 + Math.random() * 20)
                .add(new Vector2(spread * 10, spread * 10));

            this.particles.push({
                position: trailPosition.add(
                    new Vector2(
                        (Math.random() - 0.5) * 3,
                        (Math.random() - 0.5) * 3
                    )
                ),
                velocity: trailVelocity,
                life: 0.1 + Math.random() * 0.2, // Short-lived trail
                maxLife: 0.3,
                size: 0.5 + Math.random() * 1.0, // Small particles
                color: Math.random() > 0.5 ? "#ff6600" : "#ffaa44", // Orange/yellow exhaust
            });
        }
    }

    createMissileExplosion(position: Vector2): void {
        // Create large, dramatic explosion for missile
        const particleCount = 15; // Moderate number of particles

        for (let i = 0; i < particleCount; i++) {
            const angle =
                (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
            const speed = 60 + Math.random() * 80; // Fast-moving particles
            const velocity = Vector2.fromAngle(angle, speed);

            this.particles.push({
                position: position.add(
                    new Vector2(
                        (Math.random() - 0.5) * 8,
                        (Math.random() - 0.5) * 8
                    )
                ),
                velocity: velocity,
                life: 0.4 + Math.random() * 0.6, // 0.4-1.0 seconds
                maxLife: 1.0,
                size: 1.5 + Math.random() * 2.5, // Particle size
                color: Math.random() > 0.6 ? "#ff8800" : "#ffaa44", // Orange explosion colors
            });
        }
    }

    createGiftExplosion(position: Vector2): void {
        // Create orange/red explosion particles to indicate negative event
        const particleCount = 8; // Moderate explosion size

        for (let i = 0; i < particleCount; i++) {
            const angle =
                (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.4;
            const speed = 60 + Math.random() * 40; // Moderate speed
            const velocity = Vector2.fromAngle(angle, speed);

            this.particles.push({
                position: position.add(
                    new Vector2(
                        (Math.random() - 0.5) * 8, // Small spawn spread
                        (Math.random() - 0.5) * 8
                    )
                ),
                velocity: velocity,
                life: 0.6 + Math.random() * 0.4, // Short-lived
                maxLife: 1.0,
                size: 1.5 + Math.random() * 1.5, // Small particles
                color: Math.random() > 0.3 ? "#ff4400" : "#ffaa00", // Orange/red colors
            });
        }
    }

    getParticleCount(): number {
        return this.particles.length;
    }

    clear(): void {
        this.particles = [];
    }
}
