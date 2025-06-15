export class GameState {
    private _score: number = 0;
    private _lives: number = 3;
    private _level: number = 1;
    private _gameOver: boolean = false;

    get score(): number {
        return this._score;
    }

    get lives(): number {
        return this._lives;
    }

    get gameOver(): boolean {
        return this._gameOver;
    }

    get level(): number {
        return this._level;
    }

    addScore(points: number): void {
        this._score += points;
        this.updateUI();
    }

    loseLife(): void {
        this._lives = Math.max(0, this._lives - 1);
        if (this._lives === 0) {
            this._gameOver = true;
        }
        this.updateUI();
    }

    nextLevel(): void {
        this._level++;
        this.updateUI();
    }

    reset(): void {
        this._score = 0;
        this._lives = 3;
        this._level = 1;
        this._gameOver = false;
        this.updateUI();
    }

    private updateUI(): void {
        const scoreElement = document.getElementById('scoreValue');
        const livesElement = document.getElementById('livesValue');
        const levelElement = document.getElementById('levelValue');
        
        if (scoreElement) {
            scoreElement.textContent = this._score.toString();
        }
        
        if (livesElement) {
            livesElement.textContent = this._lives.toString();
        }
        
        if (levelElement) {
            levelElement.textContent = this._level.toString();
        }
    }

    // Scoring based on original Asteroids
    static getAsteroidScore(size: number): number {
        if (size >= 30) return 20;      // Large asteroid
        if (size >= 20) return 50;      // Medium asteroid  
        return 100;                     // Small asteroid
    }
}