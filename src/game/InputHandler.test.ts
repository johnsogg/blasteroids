import { describe, it, expect, beforeEach, vi } from "vitest";
import { InputHandler } from "./InputHandler";
import { InputManager } from "~/input/InputManager";
import { InputContext } from "~/input/InputContext";
import { GameState } from "./GameState";
import { WeaponSystem } from "./WeaponSystem";
import { ShieldSystem } from "./ShieldSystem";
import { EntityManager } from "./EntityManager";
import { MenuManager } from "~/menu/MenuManager";
import { LevelCompleteAnimation } from "~/animations/LevelCompleteAnimation";
import { ZoneChoiceScreen } from "~/ui/ZoneChoiceScreen";
import type { Game } from "~/game/Game";

// Mock dependencies
vi.mock("~/input/InputManager");
vi.mock("~/menu/MenuManager");
vi.mock("~/animations/LevelCompleteAnimation");
vi.mock("~/ui/ZoneChoiceScreen");
vi.mock("./ShieldSystem", () => ({
    ShieldSystem: vi.fn().mockImplementation(() => ({
        handleShieldInput: vi.fn(),
        getMovementSlowdownFactor: vi.fn().mockReturnValue(1.0),
    })),
}));

describe("InputHandler", () => {
    let inputHandler: InputHandler;
    let inputManager: InputManager;
    let gameState: GameState;
    let weaponSystem: WeaponSystem;
    let shieldSystem: ShieldSystem;
    let menuManager: MenuManager;
    let levelCompleteAnimation: LevelCompleteAnimation;
    let zoneChoiceScreen: ZoneChoiceScreen;
    let mockCanvas: HTMLCanvasElement;

    beforeEach(() => {
        mockCanvas = { width: 800, height: 600 } as HTMLCanvasElement;
        inputManager = new InputManager();
        gameState = new GameState();

        // Create minimal weapon system for testing
        weaponSystem = {
            handleWeaponInput: vi.fn(),
        } as unknown as WeaponSystem;

        // Create minimal shield system for testing
        shieldSystem = {
            handleShieldInput: vi.fn(),
            getMovementSlowdownFactor: vi.fn().mockReturnValue(1.0),
        } as unknown as ShieldSystem;

        const mockGame = {} as Game;
        const mockCtx = {} as CanvasRenderingContext2D;

        menuManager = new MenuManager(mockGame, mockCanvas, mockCtx);
        levelCompleteAnimation = new LevelCompleteAnimation(
            mockCanvas,
            mockCtx,
            gameState
        );

        zoneChoiceScreen = new ZoneChoiceScreen(mockCanvas, mockCtx, gameState);

        // Create proper mock EntityManager using actual class
        const entityManager = new EntityManager(mockCanvas);
        vi.spyOn(entityManager, "getShip").mockReturnValue(null);

        inputHandler = new InputHandler(
            inputManager,
            gameState,
            weaponSystem,
            shieldSystem,
            entityManager,
            menuManager,
            levelCompleteAnimation,
            zoneChoiceScreen
        );

        // Initialize game state
        gameState.init();

        // Mock input manager methods
        vi.spyOn(inputManager, "setContext");
        vi.spyOn(inputManager, "getContext").mockReturnValue(
            InputContext.GAMEPLAY
        );
        vi.spyOn(menuManager, "handleInput");
        vi.spyOn(menuManager, "toggle");
        vi.spyOn(menuManager, "show");
        vi.spyOn(menuManager, "hide");
        vi.spyOn(zoneChoiceScreen, "active", "get").mockReturnValue(false);
        vi.spyOn(zoneChoiceScreen, "handleInput");
    });

    describe("Context Management", () => {
        it("should set correct context for gameplay", () => {
            // Mock game state for normal gameplay
            vi.spyOn(gameState, "gameOver", "get").mockReturnValue(false);
            vi.spyOn(levelCompleteAnimation, "active", "get").mockReturnValue(
                false
            );
            vi.spyOn(menuManager, "visible", "get").mockReturnValue(false);

            const mockGameOverCallback = vi.fn();
            const mockRestartCallback = vi.fn();

            inputHandler.processInput(
                0,
                mockGameOverCallback,
                mockRestartCallback
            );

            expect(inputManager.setContext).toHaveBeenCalledWith(
                InputContext.GAMEPLAY
            );
        });

        it("should set correct context for game over", () => {
            // Mock game state for game over
            vi.spyOn(gameState, "gameOver", "get").mockReturnValue(true);
            vi.spyOn(levelCompleteAnimation, "active", "get").mockReturnValue(
                false
            );

            const mockGameOverCallback = vi.fn();
            const mockRestartCallback = vi.fn();

            inputHandler.processInput(
                0,
                mockGameOverCallback,
                mockRestartCallback
            );

            expect(inputManager.setContext).toHaveBeenCalledWith(
                InputContext.GAME_OVER
            );
        });

        it("should set correct context for level complete", () => {
            // Mock level complete state
            vi.spyOn(gameState, "gameOver", "get").mockReturnValue(false);
            vi.spyOn(levelCompleteAnimation, "active", "get").mockReturnValue(
                true
            );

            const mockGameOverCallback = vi.fn();
            const mockRestartCallback = vi.fn();

            inputHandler.processInput(
                0,
                mockGameOverCallback,
                mockRestartCallback
            );

            expect(inputManager.setContext).toHaveBeenCalledWith(
                InputContext.LEVEL_COMPLETE
            );
        });

        it("should set correct context for menu", () => {
            // Mock menu state
            vi.spyOn(gameState, "gameOver", "get").mockReturnValue(false);
            vi.spyOn(levelCompleteAnimation, "active", "get").mockReturnValue(
                false
            );
            vi.spyOn(menuManager, "visible", "get").mockReturnValue(true);

            const mockGameOverCallback = vi.fn();
            const mockRestartCallback = vi.fn();

            inputHandler.processInput(
                0,
                mockGameOverCallback,
                mockRestartCallback
            );

            expect(inputManager.setContext).toHaveBeenCalledWith(
                InputContext.MENU
            );
        });

        it("should set correct context for paused", () => {
            // Mock paused state
            vi.spyOn(gameState, "gameOver", "get").mockReturnValue(false);
            vi.spyOn(levelCompleteAnimation, "active", "get").mockReturnValue(
                false
            );
            vi.spyOn(menuManager, "visible", "get").mockReturnValue(false);
            inputHandler.setPaused(true);

            const mockGameOverCallback = vi.fn();
            const mockRestartCallback = vi.fn();

            inputHandler.processInput(
                0,
                mockGameOverCallback,
                mockRestartCallback
            );

            expect(inputManager.setContext).toHaveBeenCalledWith(
                InputContext.PAUSED
            );
        });

        it("should set correct context for zone choice", () => {
            // Mock game state for zone choice screen active
            vi.spyOn(gameState, "gameOver", "get").mockReturnValue(false);
            vi.spyOn(levelCompleteAnimation, "active", "get").mockReturnValue(
                false
            );
            vi.spyOn(menuManager, "visible", "get").mockReturnValue(false);
            vi.spyOn(zoneChoiceScreen, "active", "get").mockReturnValue(true);

            const mockGameOverCallback = vi.fn();
            const mockRestartCallback = vi.fn();

            inputHandler.processInput(
                0,
                mockGameOverCallback,
                mockRestartCallback
            );

            expect(inputManager.setContext).toHaveBeenCalledWith(
                InputContext.ZONE_CHOICE
            );
        });
    });

    describe("Menu Input Handling", () => {
        beforeEach(() => {
            // Set context to menu
            vi.spyOn(inputManager, "getContext").mockReturnValue(
                InputContext.MENU
            );
            vi.spyOn(menuManager, "visible", "get").mockReturnValue(true);
        });

        it("should handle menu navigation input", () => {
            // Mock menu input
            Object.defineProperty(inputManager, "menuUp", {
                value: true,
                configurable: true,
            });
            Object.defineProperty(inputManager, "menuDown", {
                value: false,
                configurable: true,
            });
            Object.defineProperty(inputManager, "menuLeft", {
                value: false,
                configurable: true,
            });
            Object.defineProperty(inputManager, "menuRight", {
                value: false,
                configurable: true,
            });
            Object.defineProperty(inputManager, "menuSelect", {
                value: false,
                configurable: true,
            });

            const mockGameOverCallback = vi.fn();
            const mockRestartCallback = vi.fn();

            inputHandler.processInput(
                0,
                mockGameOverCallback,
                mockRestartCallback
            );

            expect(menuManager.handleInput).toHaveBeenCalledWith("up");
        });

        it("should handle menu selection input", () => {
            // Mock menu select input
            Object.defineProperty(inputManager, "menuUp", {
                value: false,
                configurable: true,
            });
            Object.defineProperty(inputManager, "menuDown", {
                value: false,
                configurable: true,
            });
            Object.defineProperty(inputManager, "menuLeft", {
                value: false,
                configurable: true,
            });
            Object.defineProperty(inputManager, "menuRight", {
                value: false,
                configurable: true,
            });
            Object.defineProperty(inputManager, "menuSelect", {
                value: true,
                configurable: true,
            });

            const mockGameOverCallback = vi.fn();
            const mockRestartCallback = vi.fn();

            inputHandler.processInput(
                0,
                mockGameOverCallback,
                mockRestartCallback
            );

            expect(menuManager.handleInput).toHaveBeenCalledWith("select");
        });
    });

    describe("Zone Choice Input Handling", () => {
        beforeEach(() => {
            // Set context to zone choice
            vi.spyOn(inputManager, "getContext").mockReturnValue(
                InputContext.ZONE_CHOICE
            );
        });

        it("should handle zone choice navigation input", () => {
            // Mock input states for navigation
            vi.spyOn(inputManager, "menuUp", "get").mockReturnValue(true);
            vi.spyOn(inputManager, "menuDown", "get").mockReturnValue(false);
            vi.spyOn(inputManager, "menuSelect", "get").mockReturnValue(false);
            vi.spyOn(inputManager, "menuToggle", "get").mockReturnValue(false);

            const mockGameOverCallback = vi.fn();
            const mockRestartCallback = vi.fn();

            inputHandler.processInput(
                0,
                mockGameOverCallback,
                mockRestartCallback
            );

            expect(zoneChoiceScreen.handleInput).toHaveBeenCalledWith(
                "ArrowUp"
            );
        });

        it("should handle zone choice selection input", () => {
            // Mock input states for selection
            vi.spyOn(inputManager, "menuUp", "get").mockReturnValue(false);
            vi.spyOn(inputManager, "menuDown", "get").mockReturnValue(false);
            vi.spyOn(inputManager, "menuSelect", "get").mockReturnValue(true);
            vi.spyOn(inputManager, "menuToggle", "get").mockReturnValue(false);

            const mockGameOverCallback = vi.fn();
            const mockRestartCallback = vi.fn();

            inputHandler.processInput(
                0,
                mockGameOverCallback,
                mockRestartCallback
            );

            expect(zoneChoiceScreen.handleInput).toHaveBeenCalledWith("Enter");
        });

        it("should handle zone choice escape input", () => {
            // Mock input states for escape
            vi.spyOn(inputManager, "menuUp", "get").mockReturnValue(false);
            vi.spyOn(inputManager, "menuDown", "get").mockReturnValue(false);
            vi.spyOn(inputManager, "menuSelect", "get").mockReturnValue(false);
            vi.spyOn(inputManager, "menuToggle", "get").mockReturnValue(true);

            const mockGameOverCallback = vi.fn();
            const mockRestartCallback = vi.fn();

            inputHandler.processInput(
                0,
                mockGameOverCallback,
                mockRestartCallback
            );

            expect(zoneChoiceScreen.handleInput).toHaveBeenCalledWith("Escape");
        });
    });

    describe("Game Over Input Handling", () => {
        beforeEach(() => {
            // Set context to game over
            vi.spyOn(inputManager, "getContext").mockReturnValue(
                InputContext.GAME_OVER
            );
            vi.spyOn(gameState, "gameOver", "get").mockReturnValue(true);
        });

        it("should call restart callback when restart input is pressed", () => {
            // Mock restart input
            Object.defineProperty(inputManager, "restart", {
                value: true,
                configurable: true,
            });

            const mockGameOverCallback = vi.fn();
            const mockRestartCallback = vi.fn();

            inputHandler.processInput(
                0,
                mockGameOverCallback,
                mockRestartCallback
            );

            expect(mockRestartCallback).toHaveBeenCalled();
        });

        it("should not call restart callback when restart input is not pressed", () => {
            // Mock no restart input
            Object.defineProperty(inputManager, "restart", {
                value: false,
                configurable: true,
            });

            const mockGameOverCallback = vi.fn();
            const mockRestartCallback = vi.fn();

            inputHandler.processInput(
                0,
                mockGameOverCallback,
                mockRestartCallback
            );

            expect(mockRestartCallback).not.toHaveBeenCalled();
        });
    });

    describe("Level Complete Input Handling", () => {
        beforeEach(() => {
            // Set context to level complete
            vi.spyOn(inputManager, "getContext").mockReturnValue(
                InputContext.LEVEL_COMPLETE
            );
            vi.spyOn(levelCompleteAnimation, "active", "get").mockReturnValue(
                true
            );
        });

        it("should complete level animation when shoot is pressed and can be dismissed", () => {
            // Mock level complete state
            vi.spyOn(
                levelCompleteAnimation,
                "canBeDismissed",
                "get"
            ).mockReturnValue(true);
            vi.spyOn(levelCompleteAnimation, "complete");
            Object.defineProperty(inputManager, "shootPressed", {
                value: true,
                configurable: true,
            });

            const mockGameOverCallback = vi.fn();
            const mockRestartCallback = vi.fn();

            inputHandler.processInput(
                0,
                mockGameOverCallback,
                mockRestartCallback
            );

            expect(levelCompleteAnimation.complete).toHaveBeenCalled();
        });

        it("should not complete level animation when cannot be dismissed", () => {
            // Mock level complete state where animation cannot be dismissed
            vi.spyOn(
                levelCompleteAnimation,
                "canBeDismissed",
                "get"
            ).mockReturnValue(false);
            vi.spyOn(levelCompleteAnimation, "complete");
            Object.defineProperty(inputManager, "shootPressed", {
                value: true,
                configurable: true,
            });

            const mockGameOverCallback = vi.fn();
            const mockRestartCallback = vi.fn();

            inputHandler.processInput(
                0,
                mockGameOverCallback,
                mockRestartCallback
            );

            expect(levelCompleteAnimation.complete).not.toHaveBeenCalled();
        });
    });

    describe("Pause Toggle", () => {
        it("should toggle pause when menu toggle is pressed", () => {
            // Mock menu toggle input
            Object.defineProperty(inputManager, "menuToggle", {
                value: true,
                configurable: true,
            });

            const initialPauseState = inputHandler.isPausedState();

            const mockGameOverCallback = vi.fn();
            const mockRestartCallback = vi.fn();

            inputHandler.processInput(
                0,
                mockGameOverCallback,
                mockRestartCallback
            );

            expect(inputHandler.isPausedState()).toBe(!initialPauseState);
            expect(menuManager.toggle).toHaveBeenCalled();
        });

        it("should not toggle pause when menu toggle is not pressed", () => {
            // Mock no menu toggle input
            Object.defineProperty(inputManager, "menuToggle", {
                value: false,
                configurable: true,
            });

            const initialPauseState = inputHandler.isPausedState();

            const mockGameOverCallback = vi.fn();
            const mockRestartCallback = vi.fn();

            inputHandler.processInput(
                0,
                mockGameOverCallback,
                mockRestartCallback
            );

            expect(inputHandler.isPausedState()).toBe(initialPauseState);
            expect(menuManager.toggle).not.toHaveBeenCalled();
        });
    });

    describe("State Management", () => {
        it("should reset pause state when reset is called", () => {
            // Set paused state
            inputHandler.setPaused(true);
            expect(inputHandler.isPausedState()).toBe(true);

            // Reset
            inputHandler.reset();

            expect(inputHandler.isPausedState()).toBe(false);
        });

        it("should set pause state correctly", () => {
            // Test setting paused
            inputHandler.setPaused(true);
            expect(inputHandler.isPausedState()).toBe(true);
            expect(menuManager.show).toHaveBeenCalled();

            // Test setting unpaused
            inputHandler.setPaused(false);
            expect(inputHandler.isPausedState()).toBe(false);
            expect(menuManager.hide).toHaveBeenCalled();
        });

        it("should return current input context", () => {
            const mockContext = InputContext.GAMEPLAY;
            vi.spyOn(inputManager, "getContext").mockReturnValue(mockContext);

            expect(inputHandler.getCurrentContext()).toBe(mockContext);
        });
    });

    describe("Ship Movement", () => {
        it("should handle weapon input during gameplay", () => {
            // Set context to gameplay
            vi.spyOn(inputManager, "getContext").mockReturnValue(
                InputContext.GAMEPLAY
            );
            vi.spyOn(gameState, "gameOver", "get").mockReturnValue(false);
            vi.spyOn(levelCompleteAnimation, "active", "get").mockReturnValue(
                false
            );
            vi.spyOn(menuManager, "visible", "get").mockReturnValue(false);

            // Mock weapon input
            Object.defineProperty(inputManager, "weapon1", {
                value: true,
                configurable: true,
            });
            Object.defineProperty(inputManager, "weapon2", {
                value: false,
                configurable: true,
            });
            Object.defineProperty(inputManager, "weapon3", {
                value: false,
                configurable: true,
            });
            Object.defineProperty(inputManager, "weapon4", {
                value: false,
                configurable: true,
            });
            Object.defineProperty(inputManager, "shoot", {
                value: false,
                configurable: true,
            });
            Object.defineProperty(inputManager, "shootPressed", {
                value: false,
                configurable: true,
            });

            const mockGameOverCallback = vi.fn();
            const mockRestartCallback = vi.fn();

            inputHandler.processInput(
                1000,
                mockGameOverCallback,
                mockRestartCallback
            );

            // Should not have called weapon system since ship is null in this test
            expect(weaponSystem.handleWeaponInput).not.toHaveBeenCalled();
        });
    });
});
