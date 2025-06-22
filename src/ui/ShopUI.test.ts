import { describe, it, expect, beforeEach, vi } from "vitest";
import { ShopUI } from "./ShopUI";
import { ShopSystem } from "../game/ShopSystem";
import type { GameState } from "../game/GameState";

describe("ShopUI", () => {
    let shopUI: ShopUI;
    let mockCanvas: HTMLCanvasElement;
    let mockCtx: CanvasRenderingContext2D;
    let mockGameState: GameState;
    let mockShopSystem: ShopSystem;

    beforeEach(() => {
        // Mock canvas and context
        mockCanvas = {
            width: 800,
            height: 600,
        } as HTMLCanvasElement;

        const fillStyleSetter = vi.fn();
        mockCtx = {
            save: vi.fn(),
            restore: vi.fn(),
            fillRect: vi.fn(),
            strokeRect: vi.fn(),
            fillText: vi.fn(),
            measureText: vi.fn(() => ({ width: 100 })),
            beginPath: vi.fn(),
            rect: vi.fn(),
            clip: vi.fn(),
            _fillStyle: "",
            get fillStyle() {
                return this._fillStyle;
            },
            set fillStyle(value) {
                this._fillStyle = value;
                fillStyleSetter(value);
            },
            strokeStyle: "",
            lineWidth: 0,
            font: "",
            textAlign: "",
            fillStyleSetter: fillStyleSetter,
        } as Pick<
            CanvasRenderingContext2D,
            | "fillRect"
            | "strokeRect"
            | "clearRect"
            | "fillText"
            | "measureText"
            | "save"
            | "restore"
            | "translate"
            | "scale"
            | "setTransform"
            | "beginPath"
            | "closePath"
            | "moveTo"
            | "lineTo"
            | "arc"
            | "fill"
            | "stroke"
            | "clip"
            | "fillStyle"
            | "strokeStyle"
            | "lineWidth"
            | "font"
            | "textAlign"
        > & { fillStyleSetter: (color: string) => void };

        // Mock GameState
        mockGameState = {
            currency: 150,
            spendCurrency: vi.fn(() => true),
            hasUpgrade: vi.fn(() => false),
            hasWeapon: vi.fn((weapon: string) => weapon === "bullets"),
        } as Pick<
            GameState,
            "currency" | "spendCurrency" | "hasUpgrade" | "hasWeapon"
        >;

        // Mock ShopSystem with many items to enable scrolling
        const mockItems = [];
        for (let i = 0; i < 15; i++) {
            mockItems.push({
                id: `item_${i}`,
                name: `Test Item ${i}`,
                description: `Description for item ${i}`,
                type: "upgrade",
                price: 30 + i,
                dependencies: ["bullets"],
            });
        }

        mockShopSystem = {
            getAllItems: vi.fn(() => mockItems),
            canPurchase: vi.fn(() => true),
            purchaseItem: vi.fn(() => true),
            getItemsByCategory: vi.fn(() => ({
                weapons: mockItems.slice(0, 5),
                upgrades: mockItems.slice(5, 12),
                other: mockItems.slice(12, 15),
            })),
        } as Pick<
            ShopSystem,
            "canPurchase" | "purchaseItem" | "getItemsByCategory"
        >;

        shopUI = new ShopUI(mockCanvas, mockCtx, mockGameState, mockShopSystem);
    });

    describe("Shop State Management", () => {
        it("should initialize with inactive state", () => {
            expect(shopUI.active).toBe(false);
        });

        it("should become active when shown", () => {
            const onClose = vi.fn();
            shopUI.show(onClose);
            expect(shopUI.active).toBe(true);
        });

        it("should become inactive when hidden", () => {
            const onClose = vi.fn();
            shopUI.show(onClose);
            shopUI.hide();
            expect(shopUI.active).toBe(false);
        });

        it("should reset selection when shown", () => {
            const onClose = vi.fn();
            shopUI.show(onClose);
            expect(shopUI.selectedIndex).toBe(0);
        });
    });

    describe("Keyboard Navigation", () => {
        beforeEach(() => {
            const onClose = vi.fn();
            shopUI.show(onClose);
        });

        it("should handle arrow down navigation", () => {
            const initialIndex = shopUI.selectedIndex;
            const handled = shopUI.handleInput("ArrowDown");
            expect(handled).toBe(true);
            expect(shopUI.selectedIndex).toBe(initialIndex + 1);
        });

        it("should handle arrow up navigation", () => {
            // Move down first, then up
            shopUI.handleInput("ArrowDown");
            const currentIndex = shopUI.selectedIndex;
            shopUI.handleInput("ArrowUp");
            expect(shopUI.selectedIndex).toBe(currentIndex - 1);
        });

        it("should handle WASD navigation", () => {
            const initialIndex = shopUI.selectedIndex;
            shopUI.handleInput("s");
            expect(shopUI.selectedIndex).toBe(initialIndex + 1);

            shopUI.handleInput("w");
            expect(shopUI.selectedIndex).toBe(initialIndex);
        });

        it("should wrap to Done Shopping button when navigating up from first item", () => {
            // Should start at index 0 (first item)
            expect(shopUI.selectedIndex).toBe(0);

            // Navigate up from first item should wrap to Done Shopping button (-1)
            shopUI.handleInput("ArrowUp");
            expect(shopUI.selectedIndex).toBe(-1);
        });

        it("should navigate to Done Shopping button when at last item", () => {
            const maxIndex = mockShopSystem.getAllItems().length - 1;
            // Navigate to max item
            for (let i = 0; i < maxIndex; i++) {
                shopUI.handleInput("ArrowDown");
            }
            expect(shopUI.selectedIndex).toBe(maxIndex);

            // One more down should go to Done Shopping button (-1)
            shopUI.handleInput("ArrowDown");
            expect(shopUI.selectedIndex).toBe(-1);
        });

        it("should handle space key purchase", () => {
            const handled = shopUI.handleInput(" ");
            expect(handled).toBe(true);
            expect(mockShopSystem.purchaseItem).toHaveBeenCalled();
        });

        it("should handle enter key purchase", () => {
            const handled = shopUI.handleInput("Enter");
            expect(handled).toBe(true);
            expect(mockShopSystem.purchaseItem).toHaveBeenCalled();
        });

        it("should handle escape key to close", () => {
            const onClose = vi.fn();
            shopUI.show(onClose);
            const handled = shopUI.handleInput("Escape");
            expect(handled).toBe(true);
            expect(onClose).toHaveBeenCalled();
        });

        it("should not handle input when inactive", () => {
            shopUI.hide();
            const handled = shopUI.handleInput("ArrowDown");
            expect(handled).toBe(false);
        });
    });

    describe("Mouse Interaction", () => {
        beforeEach(() => {
            const onClose = vi.fn();
            shopUI.show(onClose);
        });

        it("should handle mouse click to select item", () => {
            const result = shopUI.handleMouseClick(400, 250); // Mock coordinates
            expect(result).toBe(true);
        });

        it("should handle mouse double click to purchase", () => {
            const result = shopUI.handleMouseDoubleClick(400, 250);
            expect(result).toBe(true);
        });

        it("should not handle mouse clicks when inactive", () => {
            shopUI.hide();
            const result = shopUI.handleMouseClick(400, 250);
            expect(result).toBe(false);
        });
    });

    describe("Purchase Logic", () => {
        beforeEach(() => {
            const onClose = vi.fn();
            shopUI.show(onClose);
        });

        it("should attempt purchase when item is available", () => {
            shopUI.purchaseCurrentItem();
            expect(mockShopSystem.purchaseItem).toHaveBeenCalled();
        });

        it("should not purchase when item is not available", () => {
            mockShopSystem.canPurchase = vi.fn(() => false);
            shopUI.purchaseCurrentItem();
            expect(mockShopSystem.purchaseItem).not.toHaveBeenCalled();
        });
    });

    describe("Rendering", () => {
        it("should not render when inactive", () => {
            shopUI.render();
            expect(mockCtx.save).not.toHaveBeenCalled();
        });

        it("should render when active", () => {
            const onClose = vi.fn();
            shopUI.show(onClose);
            shopUI.render();
            expect(mockCtx.save).toHaveBeenCalled();
            expect(mockCtx.restore).toHaveBeenCalled();
        });

        it("should render shop title", () => {
            const onClose = vi.fn();
            shopUI.show(onClose);
            shopUI.render();
            expect(mockCtx.fillText).toHaveBeenCalledWith(
                expect.stringContaining("Shop"),
                expect.any(Number),
                expect.any(Number)
            );
        });

        it("should render currency display using CURRENCY.NAME constant", () => {
            const onClose = vi.fn();
            shopUI.show(onClose);
            shopUI.render();
            expect(mockCtx.fillText).toHaveBeenCalledWith(
                expect.stringContaining("Spacebucks"),
                expect.any(Number),
                expect.any(Number)
            );
        });

        it("should render shop items", () => {
            const onClose = vi.fn();
            shopUI.show(onClose);
            shopUI.render();

            // Should render item names
            expect(mockCtx.fillText).toHaveBeenCalledWith(
                "Test Item 0",
                expect.any(Number),
                expect.any(Number)
            );
        });

        it("should render item prices using CURRENCY.SYMBOL constant", () => {
            const onClose = vi.fn();
            shopUI.show(onClose);
            shopUI.render();
            expect(mockCtx.fillText).toHaveBeenCalledWith(
                expect.stringContaining("🪙"),
                expect.any(Number),
                expect.any(Number)
            );
        });
    });

    describe("Category Organization", () => {
        it("should organize items by category", () => {
            const onClose = vi.fn();
            shopUI.show(onClose);
            expect(mockShopSystem.getItemsByCategory).toHaveBeenCalled();
        });

        it("should display category headers", () => {
            const onClose = vi.fn();
            shopUI.show(onClose);
            shopUI.render();

            expect(mockCtx.fillText).toHaveBeenCalledWith(
                "WEAPONS",
                expect.any(Number),
                expect.any(Number)
            );
            expect(mockCtx.fillText).toHaveBeenCalledWith(
                "UPGRADES",
                expect.any(Number),
                expect.any(Number)
            );
        });
    });

    describe("Color-Coded Availability States", () => {
        beforeEach(() => {
            const onClose = vi.fn();
            shopUI.show(onClose);
        });

        it("should use green color for affordable items", () => {
            // Set up game state where player can afford item
            mockGameState.currency = 100;
            mockShopSystem.canPurchase = vi.fn(() => true);

            shopUI.render();

            // Should have green price color
            expect(mockCtx.fillStyleSetter).toHaveBeenCalledWith("#00ff00");
        });

        it("should use red color for unaffordable items", () => {
            // Set up game state where player cannot afford item
            mockGameState.currency = 10; // Less than item price
            mockShopSystem.canPurchase = vi.fn(() => false);

            shopUI.render();

            // Should have red price color
            expect(mockCtx.fillStyleSetter).toHaveBeenCalledWith("#ff0000");
        });

        it("should use white color for already owned items", () => {
            // Set up game state where upgrade is already owned
            mockGameState.currency = 100;
            mockGameState.hasUpgrade = vi.fn(() => true); // Already has upgrade
            mockShopSystem.canPurchase = vi.fn(() => false);

            shopUI.render();

            // Should use white color for already owned items
            expect(mockCtx.fillStyleSetter).toHaveBeenCalledWith("#ffffff");
        });

        it("should use yellow color for insufficient currency", () => {
            // Set up game state where player cannot afford item but has prerequisites
            mockGameState.currency = 10; // Less than any item price
            mockGameState.hasWeapon = vi.fn(() => false); // No weapons owned (prerequisites met for basic items)
            mockShopSystem.canPurchase = vi.fn(() => false);

            shopUI.render();

            // Should use yellow color for insufficient currency
            expect(mockCtx.fillStyleSetter).toHaveBeenCalledWith("#ffff00");
        });

        it("should use gray color for items with unmet prerequisites", () => {
            // Set up game state where prerequisites are not met
            mockGameState.currency = 100;
            mockGameState.hasWeapon = vi.fn(
                (weapon: string) => weapon !== "missiles"
            ); // Missing prerequisites
            mockShopSystem.canPurchase = vi.fn(() => false);

            shopUI.render();

            // Should use gray color for items with unmet prerequisites
            expect(mockCtx.fillStyleSetter).toHaveBeenCalledWith("#666666");
        });
    });

    describe("Scrollable Interface", () => {
        beforeEach(() => {
            const onClose = vi.fn();
            shopUI.show(onClose);
        });

        it("should initialize with zero scroll offset", () => {
            expect(shopUI.scrollOffset).toBe(0);
        });

        it("should handle page down scrolling", () => {
            const initialOffset = shopUI.scrollOffset;
            const handled = shopUI.handleInput("PageDown");
            expect(handled).toBe(true);
            expect(shopUI.scrollOffset).toBeGreaterThan(initialOffset);
        });

        it("should handle page up scrolling", () => {
            // First scroll down, then up
            shopUI.handleInput("PageDown");
            const currentOffset = shopUI.scrollOffset;
            shopUI.handleInput("PageUp");
            expect(shopUI.scrollOffset).toBeLessThan(currentOffset);
        });

        it("should not scroll below zero", () => {
            shopUI.handleInput("PageUp");
            expect(shopUI.scrollOffset).toBe(0);
        });

        it("should not scroll beyond content bounds", () => {
            // Scroll down many times to test bounds
            for (let i = 0; i < 20; i++) {
                shopUI.handleInput("PageDown");
            }
            const maxOffset = shopUI.scrollOffset;
            shopUI.handleInput("PageDown");
            expect(shopUI.scrollOffset).toBe(maxOffset);
        });
    });
});
