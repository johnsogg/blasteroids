import "./style.css";

import { Game } from "~/game/Game";

console.log("Blasteroids initializing...");

const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");

if (!ctx) {
  throw new Error("Could not get 2D context from canvas");
}

console.log("Canvas initialized:", canvas.width, "x", canvas.height);

const game = new Game(canvas, ctx);
game.start();

console.log("Blasteroids started!");
