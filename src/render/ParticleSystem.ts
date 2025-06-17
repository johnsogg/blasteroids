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

    getParticleCount(): number {
        return this.particles.length;
    }
}
