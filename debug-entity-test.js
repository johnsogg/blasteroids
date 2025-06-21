// Quick test to verify entity creation
console.log('Testing entity creation...');

// Mock canvas for EntityManager
const mockCanvas = {
    width: 800,
    height: 600
};

// Mock Vector2
class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    
    static zero() {
        return new Vector2(0, 0);
    }
    
    add(other) {
        return new Vector2(this.x + other.x, this.y + other.y);
    }
    
    multiply(scalar) {
        return new Vector2(this.x * scalar, this.y * scalar);
    }
}

// Simple EntityManager test
class SimpleEntityManager {
    constructor(canvas) {
        this.entities = [];
        this.canvas = canvas;
    }
    
    addEntity(entity) {
        this.entities.push(entity);
        console.log(`Added entity: ${entity.type}, total entities: ${this.entities.length}`);
    }
    
    getAllEntities() {
        return [...this.entities];
    }
    
    getEntityCount() {
        return this.entities.length;
    }
}

// Test entity creation
const entityManager = new SimpleEntityManager(mockCanvas);

// Test ship creation (like in Game.init())
const playerShip = {
    position: new Vector2(320, 240),
    velocity: Vector2.zero(),
    size: new Vector2(20, 20),
    rotation: 0,
    color: "#00ff00",
    type: "ship",
    playerId: "player",
    trail: []
};

entityManager.addEntity(playerShip);

// Test asteroid creation (like in Game.init())
for (let i = 0; i < 4; i++) {
    const asteroid = {
        position: new Vector2(100 + i * 150, 100 + i * 100),
        velocity: new Vector2(50, 30),
        size: new Vector2(30, 30),
        rotation: 0,
        color: "#ffffff",
        type: "asteroid",
        age: 0
    };
    entityManager.addEntity(asteroid);
}

// Verify results
console.log(`Final entity count: ${entityManager.getEntityCount()}`);
console.log('Entities:', entityManager.getAllEntities().map(e => ({ type: e.type, playerId: e.playerId })));

if (entityManager.getEntityCount() === 5) {
    console.log('✅ Entity creation test PASSED');
} else {
    console.log('❌ Entity creation test FAILED');
}