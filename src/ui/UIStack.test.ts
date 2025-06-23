import { describe, it, expect, vi, beforeEach } from "vitest";
import { UIStack, UIComponent, UIStackEntry } from "./UIStack";
import { InputContext } from "~/input/InputContext";

// Mock UIComponent for testing
class MockUIComponent implements UIComponent {
    public readonly id: string;
    public active = false;
    private showCallback?: () => void;
    private hideCallback?: () => void;

    constructor(id: string) {
        this.id = id;
    }

    show(): void {
        this.active = true;
        if (this.showCallback) this.showCallback();
    }

    hide(): void {
        this.active = false;
        if (this.hideCallback) this.hideCallback();
    }

    handleInput(key: string): boolean {
        return key === "test";
    }

    render(): void {
        // Mock render
    }

    cleanup(): void {
        this.active = false;
    }

    onShow(callback: () => void): void {
        this.showCallback = callback;
    }

    onHide(callback: () => void): void {
        this.hideCallback = callback;
    }
}

describe("UIStack", () => {
    let stack: UIStack;
    let mockComponent1: MockUIComponent;
    let mockComponent2: MockUIComponent;
    let mockEntry1: UIStackEntry;
    let mockEntry2: UIStackEntry;

    beforeEach(() => {
        stack = new UIStack();
        mockComponent1 = new MockUIComponent("test1");
        mockComponent2 = new MockUIComponent("test2");

        mockEntry1 = {
            id: "test1",
            component: mockComponent1,
            inputContext: InputContext.MENU,
            pausesGame: true,
            modal: true,
            renderPriority: 100,
        };

        mockEntry2 = {
            id: "test2",
            component: mockComponent2,
            inputContext: InputContext.SHOP,
            pausesGame: false,
            modal: false,
            renderPriority: 200,
        };
    });

    describe("push()", () => {
        it("should add component to stack and show it", () => {
            stack.push(mockEntry1);

            expect(mockComponent1.active).toBe(true);
            expect(stack.getTopEntry()).toBe(mockEntry1);
            expect(stack.getAllEntries()).toHaveLength(1);
        });

        it("should replace existing component with same ID", () => {
            const showSpy = vi.spyOn(mockComponent1, "show");
            const consoleSpy = vi
                .spyOn(console, "warn")
                .mockImplementation(() => {});

            // Push same component twice
            stack.push(mockEntry1);
            stack.push(mockEntry1);

            // Should be shown twice (once for each push)
            expect(showSpy).toHaveBeenCalledTimes(2);
            expect(stack.getAllEntries()).toHaveLength(1);

            consoleSpy.mockRestore();
        });

        it("should maintain insertion order for input handling", () => {
            stack.push(mockEntry2); // priority 200, pushed first
            stack.push(mockEntry1); // priority 100, pushed second

            const entries = stack.getAllEntries();
            expect(entries[0]).toBe(mockEntry2); // First pushed
            expect(entries[1]).toBe(mockEntry1); // Second pushed (top)
            expect(stack.getTopEntry()).toBe(mockEntry1); // Last pushed is top
        });
    });

    describe("pop()", () => {
        it("should remove and hide top component", () => {
            stack.push(mockEntry1);
            const hideSpy = vi.spyOn(mockComponent1, "hide");
            const cleanupSpy = vi.spyOn(mockComponent1, "cleanup");

            const poppedEntry = stack.pop();

            expect(poppedEntry).toBe(mockEntry1);
            expect(hideSpy).toHaveBeenCalled();
            expect(cleanupSpy).toHaveBeenCalled();
            expect(stack.getAllEntries()).toHaveLength(0);
        });

        it("should return undefined when stack is empty", () => {
            const result = stack.pop();
            expect(result).toBeUndefined();
        });
    });

    describe("popById()", () => {
        it("should remove specific component by ID", () => {
            stack.push(mockEntry1);
            stack.push(mockEntry2);

            const poppedEntry = stack.popById("test1");

            expect(poppedEntry).toBe(mockEntry1);
            expect(stack.getAllEntries()).toHaveLength(1);
            expect(stack.getTopEntry()).toBe(mockEntry2);
        });

        it("should return undefined for non-existent ID", () => {
            stack.push(mockEntry1);
            const result = stack.popById("nonexistent");
            expect(result).toBeUndefined();
        });
    });

    describe("getInputContext()", () => {
        it("should return gameplay context when stack is empty", () => {
            expect(stack.getInputContext()).toBe(InputContext.GAMEPLAY);
        });

        it("should return top component input context when no modals", () => {
            // Make both components non-modal for this test
            mockEntry1.modal = false;
            mockEntry2.modal = false;

            stack.push(mockEntry1); // MENU context
            expect(stack.getInputContext()).toBe(InputContext.MENU);

            stack.push(mockEntry2); // SHOP context
            expect(stack.getInputContext()).toBe(InputContext.SHOP);
        });

        it("should return modal component context when present", () => {
            stack.push(mockEntry2); // Non-modal, SHOP context
            stack.push(mockEntry1); // Modal, MENU context

            // Should return the modal component's context
            expect(stack.getInputContext()).toBe(InputContext.MENU);
        });
    });

    describe("shouldPauseGame()", () => {
        it("should return false when stack is empty", () => {
            expect(stack.shouldPauseGame()).toBe(false);
        });

        it("should return true when any component pauses game", () => {
            stack.push(mockEntry2); // pausesGame: false
            expect(stack.shouldPauseGame()).toBe(false);

            stack.push(mockEntry1); // pausesGame: true
            expect(stack.shouldPauseGame()).toBe(true);
        });
    });

    describe("handleInput()", () => {
        it("should route input to input handling component", () => {
            const handleInputSpy = vi.spyOn(mockComponent1, "handleInput");
            stack.push(mockEntry1);

            const result = stack.handleInput("test");

            expect(handleInputSpy).toHaveBeenCalledWith("test");
            expect(result).toBe(true);
        });

        it("should return false when no components", () => {
            const result = stack.handleInput("test");
            expect(result).toBe(false);
        });
    });

    describe("getVisibleComponents()", () => {
        it("should return only active components", () => {
            stack.push(mockEntry1);
            stack.push(mockEntry2);

            mockComponent1.active = true;
            mockComponent2.active = false;

            const visible = stack.getVisibleComponents();
            expect(visible).toHaveLength(1);
            expect(visible[0]).toBe(mockComponent1);
        });

        it("should return components in render order", () => {
            stack.push(mockEntry2); // priority 200
            stack.push(mockEntry1); // priority 100

            mockComponent1.active = true;
            mockComponent2.active = true;

            const visible = stack.getVisibleComponents();
            expect(visible[0]).toBe(mockComponent1); // Lower priority first
            expect(visible[1]).toBe(mockComponent2); // Higher priority second
        });
    });

    describe("events", () => {
        it("should emit componentPushed event", () => {
            const listener = vi.fn();
            stack.on("componentPushed", listener);

            stack.push(mockEntry1);

            expect(listener).toHaveBeenCalledWith(mockEntry1);
        });

        it("should emit componentPopped event", () => {
            const listener = vi.fn();
            stack.on("componentPopped", listener);

            stack.push(mockEntry1);
            stack.pop();

            expect(listener).toHaveBeenCalledWith(mockEntry1);
        });

        it("should emit inputContextChanged event", () => {
            const listener = vi.fn();
            stack.on("inputContextChanged", listener);

            stack.push(mockEntry1);

            expect(listener).toHaveBeenCalledWith(InputContext.MENU);
        });

        it("should emit pauseStateChanged event", () => {
            const listener = vi.fn();
            stack.on("pauseStateChanged", listener);

            stack.push(mockEntry1); // pausesGame: true

            expect(listener).toHaveBeenCalledWith(true);
        });
    });

    describe("clear()", () => {
        it("should remove all components and hide them", () => {
            stack.push(mockEntry1);
            stack.push(mockEntry2);

            const hideSpy1 = vi.spyOn(mockComponent1, "hide");
            const hideSpy2 = vi.spyOn(mockComponent2, "hide");
            const cleanupSpy1 = vi.spyOn(mockComponent1, "cleanup");
            const cleanupSpy2 = vi.spyOn(mockComponent2, "cleanup");

            stack.clear();

            expect(hideSpy1).toHaveBeenCalled();
            expect(hideSpy2).toHaveBeenCalled();
            expect(cleanupSpy1).toHaveBeenCalled();
            expect(cleanupSpy2).toHaveBeenCalled();
            expect(stack.getAllEntries()).toHaveLength(0);
        });

        it("should emit stackCleared event", () => {
            const listener = vi.fn();
            stack.on("stackCleared", listener);

            stack.push(mockEntry1);
            stack.clear();

            expect(listener).toHaveBeenCalled();
        });
    });
});
