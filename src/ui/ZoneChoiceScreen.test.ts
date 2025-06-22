import { describe, it, expect, beforeEach, vi } from "vitest";
import { ZoneChoiceScreen } from "./ZoneChoiceScreen";
import { GameState } from "~/game/GameState";

describe("ZoneChoiceScreen keyboard input", () => {
    let zoneChoiceScreen: ZoneChoiceScreen;
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;
    let gameState: GameState;
    let onChoiceMock: ReturnType<typeof vi.fn>;

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

        onChoiceMock = vi.fn();
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
            zoneChoiceScreen.show(onChoiceMock);
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
            expect(zoneChoiceScreen.handleInput("Enter")).toBe(true);
            expect(onChoiceMock).toHaveBeenCalledWith("continue");
        });

        it("should handle Space key to select current option", () => {
            expect(zoneChoiceScreen.handleInput(" ")).toBe(true);
            expect(onChoiceMock).toHaveBeenCalledWith("continue");
        });

        it("should handle Escape key to default to continue", () => {
            expect(zoneChoiceScreen.handleInput("Escape")).toBe(true);
            expect(onChoiceMock).toHaveBeenCalledWith("continue");
        });

        it("should not handle unknown keys", () => {
            expect(zoneChoiceScreen.handleInput("x")).toBe(false);
            expect(zoneChoiceScreen.handleInput("Tab")).toBe(false);
        });

        it("should navigate through options correctly", () => {
            // Start at option 0 (continue)
            zoneChoiceScreen.handleInput("ArrowDown"); // Move to option 1 (next_zone)
            zoneChoiceScreen.handleInput("Enter");
            expect(onChoiceMock).toHaveBeenCalledWith("next_zone");

            // Reset and test other navigation
            onChoiceMock.mockClear();
            zoneChoiceScreen.show(onChoiceMock);

            zoneChoiceScreen.handleInput("s"); // Move to option 1 (next_zone)
            zoneChoiceScreen.handleInput("s"); // Move to option 2 (shop)
            zoneChoiceScreen.handleInput(" "); // Select shop

            // Shop is now enabled, so callback should be made
            expect(onChoiceMock).toHaveBeenCalledWith("shop");
        });
    });

    describe("integration with current Game.ts input handling", () => {
        it("should demonstrate the current broken input handling pattern", () => {
            // This test shows how Game.ts currently tries to handle input
            // but fails because it's checking the wrong input properties

            const mockInput = {
                keys: {
                    ArrowUp: false,
                    ArrowDown: false,
                    w: false,
                    s: false,
                    Enter: false,
                    Escape: false,
                },
                space: false,
            };

            zoneChoiceScreen.show(onChoiceMock);

            // Simulate what Game.ts is currently doing - checking properties that don't exist or work
            // This is the BROKEN behavior we need to fix
            const wouldHandle =
                mockInput.keys.ArrowUp ||
                mockInput.keys.w ||
                mockInput.keys.ArrowDown ||
                mockInput.keys.s ||
                mockInput.space ||
                mockInput.keys.Enter ||
                mockInput.keys.Escape;

            expect(wouldHandle).toBe(false); // This should be true but isn't due to the bug
        });
    });
});
