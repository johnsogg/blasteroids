import "./style.css";

import { Game } from "~/game/Game";

// Blasteroids initializing

const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");

if (!ctx) {
    throw new Error("Could not get 2D context from canvas");
}

// Canvas initialized

const game = new Game(canvas, ctx);
game.start();

// Blasteroids started
