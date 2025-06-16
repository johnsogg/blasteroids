import { Vector2 } from "~/utils/Vector2";

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
        particle.velocity.multiply(deltaTime),
      );
      particle.life -= deltaTime;

      // Apply slight friction to particles
      particle.velocity = particle.velocity.multiply(0.98);
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
        Math.PI * 2,
      );
      ctx.fill();
      ctx.restore();
    });
  }

  createAsteroidExplosion(position: Vector2, asteroidSize: number): void {
    // Create subtle particles for asteroid explosion
    const particleCount = Math.floor(asteroidSize / 8); // Smaller asteroids = fewer particles

    for (let i = 0; i < particleCount; i++) {
      const angle =
        (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
      const speed = 50 + Math.random() * 100;
      const velocity = Vector2.fromAngle(angle, speed);

      this.particles.push({
        position: position.add(
          new Vector2((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10),
        ),
        velocity: velocity,
        life: 0.8 + Math.random() * 0.4, // 0.8-1.2 seconds
        maxLife: 1.0,
        size: 1 + Math.random() * 2, // Small particles
        color: "#ffffff",
      });
    }
  }

  createShipExplosion(position: Vector2): void {
    // Create more dramatic but still subtle explosion for ship
    const particleCount = 12;

    for (let i = 0; i < particleCount; i++) {
      const angle =
        (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.3;
      const speed = 80 + Math.random() * 120;
      const velocity = Vector2.fromAngle(angle, speed);

      this.particles.push({
        position: position.add(
          new Vector2((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5),
        ),
        velocity: velocity,
        life: 1.2 + Math.random() * 0.6, // 1.2-1.8 seconds
        maxLife: 1.5,
        size: 1.5 + Math.random() * 2.5, // Slightly larger particles
        color: Math.random() > 0.7 ? "#ffaa00" : "#ffffff", // Mostly white with some orange
      });
    }
  }

  getParticleCount(): number {
    return this.particles.length;
  }
}
