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
import { UIStackManager } from "~/ui/UIStackManager";
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
    let mockUIStackManager: any;

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

        const shopUI: { active: boolean; handleInput: (key: string) => void } =
            {
                active: false,
                handleInput: vi.fn(),
            };

        mockUIStackManager = {
            getCurrentInputContext: vi.fn(() => "gameplay"),
            shouldPauseGame: vi.fn(() => false),
            getStackSize: vi.fn(() => 0),
            handleInput: vi.fn(() => false),
            isVisible: vi.fn(() => false),
            showMenu: vi.fn(),
            hide: vi.fn(),
            clear: vi.fn(),
        };

        inputHandler = new InputHandler(
            inputManager,
            gameState,
            weaponSystem,
            shieldSystem,
            entityManager,
            mockUIStackManager as UIStackManager,
            menuManager,
            levelCompleteAnimation,
            zoneChoiceScreen,
            shopUI
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
            // Mock level complete state - UIStackManager returns LEVEL_COMPLETE context
            vi.spyOn(gameState, "gameOver", "get").mockReturnValue(false);
            mockUIStackManager.getCurrentInputContext.mockReturnValue(InputContext.LEVEL_COMPLETE);

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
            // Mock menu state - UIStackManager returns MENU context
            vi.spyOn(gameState, "gameOver", "get").mockReturnValue(false);
            mockUIStackManager.getCurrentInputContext.mockReturnValue(InputContext.MENU);

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
            // Mock paused state - UIStackManager returns PAUSED context
            vi.spyOn(gameState, "gameOver", "get").mockReturnValue(false);
            mockUIStackManager.getCurrentInputContext.mockReturnValue(InputContext.PAUSED);

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
            // Mock zone choice state - UIStackManager returns ZONE_CHOICE context
            vi.spyOn(gameState, "gameOver", "get").mockReturnValue(false);
            mockUIStackManager.getCurrentInputContext.mockReturnValue(InputContext.ZONE_CHOICE);

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

    describe("UI Stack Input Handling", () => {
        beforeEach(() => {
            vi.spyOn(gameState, "gameOver", "get").mockReturnValue(false);
        });

        it("should delegate input to UIStackManager when components are active", () => {
            // Mock UIStackManager having components
            mockUIStackManager.getStackSize.mockReturnValue(1);
            mockUIStackManager.handleInput.mockReturnValue(true);

            // Mock some input being available
            Object.defineProperty(inputManager, "menuUp", {
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

            // Should call UIStackManager.handleInput with "ArrowUp"
            expect(mockUIStackManager.handleInput).toHaveBeenCalledWith("ArrowUp");
        });

        it("should handle escape key when no UI components are active", () => {
            // Mock UIStackManager being empty
            mockUIStackManager.getStackSize.mockReturnValue(0);

            // Mock escape key being pressed
            Object.defineProperty(inputManager, "menuToggle", {
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

            // Should show menu via UIStackManager
            expect(mockUIStackManager.showMenu).toHaveBeenCalledWith(menuManager);
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

        it("should complete level animation when handled by UIStackManager", () => {
            // Mock UIStackManager having LevelCompleteAnimation component
            mockUIStackManager.getStackSize.mockReturnValue(1);
            mockUIStackManager.handleInput.mockReturnValue(true);
            
            // Mock shoot input being available
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

            // Should delegate to UIStackManager which handles the level complete animation
            expect(mockUIStackManager.handleInput).toHaveBeenCalledWith(" ");
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

    describe("State Management", () => {
        it("should delegate pause state to UIStackManager", () => {
            // Mock UIStackManager pause state
            mockUIStackManager.shouldPauseGame.mockReturnValue(true);
            
            expect(inputHandler.isPausedState()).toBe(true);
            
            mockUIStackManager.shouldPauseGame.mockReturnValue(false);
            
            expect(inputHandler.isPausedState()).toBe(false);
        });

        it("should clear UI stack when reset is called", () => {
            inputHandler.reset();
            
            expect(mockUIStackManager.clear).toHaveBeenCalled();
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

    describe("Screenshot Input Handling", () => {
        it("should call screenshot callback when screenshot input is pressed in gameplay", () => {
            // Set context to gameplay
            vi.spyOn(inputManager, "getContext").mockReturnValue(
                InputContext.GAMEPLAY
            );
            vi.spyOn(gameState, "gameOver", "get").mockReturnValue(false);
            vi.spyOn(levelCompleteAnimation, "active", "get").mockReturnValue(
                false
            );
            vi.spyOn(menuManager, "visible", "get").mockReturnValue(false);

            // Mock screenshot input
            Object.defineProperty(inputManager, "screenshot", {
                value: true,
                configurable: true,
            });

            const mockScreenshotCallback = vi.fn();
            const mockGameOverCallback = vi.fn();
            const mockRestartCallback = vi.fn();

            // Add screenshot callback to processInput method
            inputHandler.processInput(
                1000,
                mockGameOverCallback,
                mockRestartCallback,
                mockScreenshotCallback
            );

            expect(mockScreenshotCallback).toHaveBeenCalled();
        });

        it("should not call screenshot callback when not in gameplay context", () => {
            // Set context to menu
            vi.spyOn(inputManager, "getContext").mockReturnValue(
                InputContext.MENU
            );
            vi.spyOn(gameState, "gameOver", "get").mockReturnValue(false);
            vi.spyOn(levelCompleteAnimation, "active", "get").mockReturnValue(
                false
            );
            vi.spyOn(menuManager, "visible", "get").mockReturnValue(true);

            // Mock screenshot input
            Object.defineProperty(inputManager, "screenshot", {
                value: false, // Should be false in menu context anyway
                configurable: true,
            });

            const mockScreenshotCallback = vi.fn();
            const mockGameOverCallback = vi.fn();
            const mockRestartCallback = vi.fn();

            inputHandler.processInput(
                1000,
                mockGameOverCallback,
                mockRestartCallback,
                mockScreenshotCallback
            );

            expect(mockScreenshotCallback).not.toHaveBeenCalled();
        });

        it("should not call screenshot callback when screenshot input is false", () => {
            // Set context to gameplay
            vi.spyOn(inputManager, "getContext").mockReturnValue(
                InputContext.GAMEPLAY
            );
            vi.spyOn(gameState, "gameOver", "get").mockReturnValue(false);
            vi.spyOn(levelCompleteAnimation, "active", "get").mockReturnValue(
                false
            );
            vi.spyOn(menuManager, "visible", "get").mockReturnValue(false);

            // Mock screenshot input as false
            Object.defineProperty(inputManager, "screenshot", {
                value: false,
                configurable: true,
            });

            const mockScreenshotCallback = vi.fn();
            const mockGameOverCallback = vi.fn();
            const mockRestartCallback = vi.fn();

            inputHandler.processInput(
                1000,
                mockGameOverCallback,
                mockRestartCallback,
                mockScreenshotCallback
            );

            expect(mockScreenshotCallback).not.toHaveBeenCalled();
        });
    });
});
