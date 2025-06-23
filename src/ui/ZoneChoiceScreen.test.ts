import { describe, it, expect, beforeEach, vi } from "vitest";
import { ZoneChoiceScreen } from "./ZoneChoiceScreen";
import { GameState } from "~/game/GameState";

describe("ZoneChoiceScreen keyboard input", () => {
    let zoneChoiceScreen: ZoneChoiceScreen;
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;
    let gameState: GameState;

    beforeEach(() => {
        // Create mock canvas and context
        canvas = {
            width: 800,
            height: 600,
        } as HTMLCanvasElement;

        ctx = {
            save: vi.fn(),
            restore: vi.fn(),
            fillRect: vi.fn(),
            strokeRect: vi.fn(),
            fillText: vi.fn(),
            measureText: vi.fn(() => ({ width: 100 })),
        } as unknown as CanvasRenderingContext2D;

        // Create mock game state
        gameState = {
            zone: 1,
            currency: 100,
        } as GameState;

        zoneChoiceScreen = new ZoneChoiceScreen(canvas, ctx, gameState);
    });

    describe("when zone choice screen is not active", () => {
        it("should not handle any keyboard input", () => {
            expect(zoneChoiceScreen.handleInput("ArrowUp")).toBe(false);
            expect(zoneChoiceScreen.handleInput("ArrowDown")).toBe(false);
            expect(zoneChoiceScreen.handleInput("Enter")).toBe(false);
            expect(zoneChoiceScreen.handleInput("Escape")).toBe(false);
        });
    });

    describe("when zone choice screen is active", () => {
        beforeEach(() => {
            zoneChoiceScreen.show();
        });

        it("should handle ArrowUp and w keys to navigate up", () => {
            // Start at first option (0), move to last option
            expect(zoneChoiceScreen.handleInput("ArrowUp")).toBe(true);
            expect(zoneChoiceScreen.handleInput("w")).toBe(true);
        });

        it("should handle ArrowDown and s keys to navigate down", () => {
            expect(zoneChoiceScreen.handleInput("ArrowDown")).toBe(true);
            expect(zoneChoiceScreen.handleInput("s")).toBe(true);
        });

        it("should handle Enter key to select current option", () => {
            expect(zoneChoiceScreen.active).toBe(true);
            expect(zoneChoiceScreen.handleInput("Enter")).toBe(true);
            expect(zoneChoiceScreen.active).toBe(false);
            expect(zoneChoiceScreen.getLastChoice()).toBe("continue");
        });

        it("should handle Space key to select current option", () => {
            expect(zoneChoiceScreen.active).toBe(true);
            expect(zoneChoiceScreen.handleInput(" ")).toBe(true);
            expect(zoneChoiceScreen.active).toBe(false);
            expect(zoneChoiceScreen.getLastChoice()).toBe("continue");
        });

        it("should handle Escape key to default to continue", () => {
            expect(zoneChoiceScreen.active).toBe(true);
            expect(zoneChoiceScreen.handleInput("Escape")).toBe(true);
            expect(zoneChoiceScreen.active).toBe(false);
            expect(zoneChoiceScreen.getLastChoice()).toBe("continue");
        });

        it("should not handle unknown keys", () => {
            expect(zoneChoiceScreen.handleInput("x")).toBe(false);
            expect(zoneChoiceScreen.handleInput("Tab")).toBe(false);
        });

        it("should navigate through options correctly", () => {
            // Start at option 0 (continue)
            zoneChoiceScreen.handleInput("ArrowDown"); // Move to option 1 (next_zone)
            zoneChoiceScreen.handleInput("Enter");
            expect(zoneChoiceScreen.getLastChoice()).toBe("next_zone");

            // Reset and test other navigation
            zoneChoiceScreen.show();

            zoneChoiceScreen.handleInput("s"); // Move to option 1 (next_zone)
            zoneChoiceScreen.handleInput("s"); // Move to option 2 (shop)
            zoneChoiceScreen.handleInput(" "); // Select shop

            // Shop is now enabled, so choice should be stored
            expect(zoneChoiceScreen.getLastChoice()).toBe("shop");
        });
    });

    describe("UIStackManager integration", () => {
        it("should store choice when component becomes inactive", () => {
            zoneChoiceScreen.show();
            expect(zoneChoiceScreen.active).toBe(true);

            // Navigate to next_zone option and select it
            zoneChoiceScreen.handleInput("ArrowDown");
            zoneChoiceScreen.handleInput("Enter");

            expect(zoneChoiceScreen.active).toBe(false);
            expect(zoneChoiceScreen.getLastChoice()).toBe("next_zone");
        });
    });
});
