import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { InputManager } from "./InputManager";
import { InputContext } from "./InputContext";

describe("InputManager", () => {
    let inputManager: InputManager;

    beforeEach(() => {
        inputManager = new InputManager();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("Screenshot Input", () => {
        it("should register screenshot key press", () => {
            // Set context to gameplay (where screenshot should be allowed)
            inputManager.setContext(InputContext.GAMEPLAY);

            // Simulate keydown event for 'T' key
            window.dispatchEvent(
                new KeyboardEvent("keydown", { code: "KeyT" })
            );

            // Check that screenshot input is triggered
            expect(inputManager.screenshot).toBe(true);
        });

        it("should consume screenshot input after being read", () => {
            // Set context to gameplay
            inputManager.setContext(InputContext.GAMEPLAY);

            // Simulate keydown event for 'T' key
            window.dispatchEvent(
                new KeyboardEvent("keydown", { code: "KeyT" })
            );

            // First read should return true
            expect(inputManager.screenshot).toBe(true);

            // Second read should return false (consumed)
            expect(inputManager.screenshot).toBe(false);
        });

        it("should not trigger screenshot in non-gameplay contexts", () => {
            // Set context to menu
            inputManager.setContext(InputContext.MENU);

            // Simulate keydown event for 'T' key
            window.dispatchEvent(
                new KeyboardEvent("keydown", { code: "KeyT" })
            );

            // Screenshot should not be triggered in menu context
            expect(inputManager.screenshot).toBe(false);
        });

        it("should not trigger screenshot in game over context", () => {
            // Set context to game over
            inputManager.setContext(InputContext.GAME_OVER);

            // Simulate keydown event for 'T' key
            window.dispatchEvent(
                new KeyboardEvent("keydown", { code: "KeyT" })
            );

            // Screenshot should not be triggered in game over context
            expect(inputManager.screenshot).toBe(false);
        });

        it("should not trigger screenshot in paused context", () => {
            // Set context to paused
            inputManager.setContext(InputContext.PAUSED);

            // Simulate keydown event for 'T' key
            window.dispatchEvent(
                new KeyboardEvent("keydown", { code: "KeyT" })
            );

            // Screenshot should not be triggered in paused context
            expect(inputManager.screenshot).toBe(false);
        });

        it("should work with both capital and lowercase T key codes", () => {
            // Set context to gameplay
            inputManager.setContext(InputContext.GAMEPLAY);

            // Test with KeyT (standard)
            window.dispatchEvent(
                new KeyboardEvent("keydown", { code: "KeyT" })
            );
            expect(inputManager.screenshot).toBe(true);

            // Reset state
            inputManager.setContext(InputContext.GAMEPLAY); // Clears consumed inputs

            // Should only work with KeyT code, not other variations
            window.dispatchEvent(
                new KeyboardEvent("keydown", { code: "KeyX" })
            );
            expect(inputManager.screenshot).toBe(false);
        });

        it("should only trigger on single key press, not held down", () => {
            // Set context to gameplay
            inputManager.setContext(InputContext.GAMEPLAY);

            // Simulate initial keydown
            window.dispatchEvent(
                new KeyboardEvent("keydown", { code: "KeyT" })
            );
            expect(inputManager.screenshot).toBe(true);

            // Simulate additional keydown events (key held down) - should not trigger
            window.dispatchEvent(
                new KeyboardEvent("keydown", { code: "KeyT" })
            );
            expect(inputManager.screenshot).toBe(false); // Should not trigger again

            // Simulate keyup to release the key
            window.dispatchEvent(new KeyboardEvent("keyup", { code: "KeyT" }));

            // Need to set context again to clear consumed inputs
            inputManager.setContext(InputContext.GAMEPLAY);

            // Now simulate new keydown - should trigger again
            window.dispatchEvent(
                new KeyboardEvent("keydown", { code: "KeyT" })
            );
            expect(inputManager.screenshot).toBe(true); // Should trigger again after release
        });
    });

    describe("Context Management", () => {
        it("should clear consumed inputs when context changes", () => {
            // Set context to gameplay and trigger screenshot
            inputManager.setContext(InputContext.GAMEPLAY);
            window.dispatchEvent(
                new KeyboardEvent("keydown", { code: "KeyT" })
            );
            expect(inputManager.screenshot).toBe(true); // Consumes input
            expect(inputManager.screenshot).toBe(false); // Should be consumed

            // Release the key first
            window.dispatchEvent(new KeyboardEvent("keyup", { code: "KeyT" }));

            // Change context (should clear consumed inputs)
            inputManager.setContext(InputContext.MENU);
            inputManager.setContext(InputContext.GAMEPLAY);

            // Trigger screenshot again - should work since consumed inputs were cleared
            window.dispatchEvent(
                new KeyboardEvent("keydown", { code: "KeyT" })
            );
            expect(inputManager.screenshot).toBe(true);
        });
    });

    describe("Existing Functionality", () => {
        it("should still handle basic movement inputs", () => {
            inputManager.setContext(InputContext.GAMEPLAY);

            // Test thrust
            window.dispatchEvent(
                new KeyboardEvent("keydown", { code: "ArrowUp" })
            );
            expect(inputManager.thrust).toBe(true);

            // Test left
            window.dispatchEvent(
                new KeyboardEvent("keydown", { code: "ArrowLeft" })
            );
            expect(inputManager.left).toBe(true);

            // Test shoot
            window.dispatchEvent(
                new KeyboardEvent("keydown", { code: "Space" })
            );
            expect(inputManager.shoot).toBe(true);
        });

        it("should handle debug toggle", () => {
            inputManager.setContext(InputContext.GAMEPLAY);

            window.dispatchEvent(
                new KeyboardEvent("keydown", { code: "Backquote" })
            );
            expect(inputManager.debugToggle).toBe(true);
            expect(inputManager.debugToggle).toBe(false); // Should be consumed
        });
    });
});
