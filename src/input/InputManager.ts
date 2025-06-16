export class InputManager {
  private keys: Map<string, boolean> = new Map();

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    window.addEventListener("keydown", (e) => {
      this.keys.set(e.code, true);
    });

    window.addEventListener("keyup", (e) => {
      this.keys.set(e.code, false);
    });
  }

  isKeyPressed(keyCode: string): boolean {
    return this.keys.get(keyCode) || false;
  }

  // Convenient helper methods for common game keys
  get thrust(): boolean {
    return this.isKeyPressed("ArrowUp") || this.isKeyPressed("KeyW");
  }
  get left(): boolean {
    return this.isKeyPressed("ArrowLeft") || this.isKeyPressed("KeyA");
  }
  get right(): boolean {
    return this.isKeyPressed("ArrowRight") || this.isKeyPressed("KeyD");
  }
  get shoot(): boolean {
    return this.isKeyPressed("Space");
  }
  get restart(): boolean {
    return this.isKeyPressed("KeyR");
  }
  get strafeLeft(): boolean {
    return this.isKeyPressed("KeyQ");
  }
  get strafeRight(): boolean {
    return this.isKeyPressed("KeyE");
  }
}
