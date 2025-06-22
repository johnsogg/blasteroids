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

        mockCtx = {
            save: vi.fn(),
            restore: vi.fn(),
            fillRect: vi.fn(),
            strokeRect: vi.fn(),
            fillText: vi.fn(),
            measureText: vi.fn(() => ({ width: 100 })),
            fillStyle: "",
            strokeStyle: "",
            lineWidth: 0,
            font: "",
            textAlign: "",
        } as any;

        // Mock GameState
        mockGameState = {
            currency: 150,
            spendCurrency: vi.fn(() => true),
            hasUpgrade: vi.fn(() => false),
            hasWeapon: vi.fn((weapon: string) => weapon === "bullets"),
        } as any;

        // Mock ShopSystem
        mockShopSystem = {
            getAllItems: vi.fn(() => [
                {
                    id: "missiles",
                    name: "Missile Launcher",
                    description: "Powerful homing missiles",
                    type: "weapon",
                    price: 50,
                    dependencies: [],
                },
                {
                    id: "upgrade_bullets_fire_rate",
                    name: "Bullet Fire Rate",
                    description: "Increases bullet firing speed",
                    type: "upgrade",
                    price: 30,
                    dependencies: ["bullets"],
                },
                {
                    id: "extra_life",
                    name: "Extra Life",
                    description: "Gain an additional life",
                    type: "life",
                    price: 80,
                    dependencies: [],
                },
            ]),
            canPurchase: vi.fn(() => true),
            purchaseItem: vi.fn(() => true),
            getItemsByCategory: vi.fn(() => ({
                weapons: [
                    {
                        id: "missiles",
                        name: "Missile Launcher",
                        description: "Powerful homing missiles",
                        type: "weapon",
                        price: 50,
                        dependencies: [],
                    },
                ],
                upgrades: [
                    {
                        id: "upgrade_bullets_fire_rate",
                        name: "Bullet Fire Rate",
                        description: "Increases bullet firing speed",
                        type: "upgrade",
                        price: 30,
                        dependencies: ["bullets"],
                    },
                ],
                other: [
                    {
                        id: "extra_life",
                        name: "Extra Life",
                        description: "Gain an additional life",
                        type: "life",
                        price: 80,
                        dependencies: [],
                    },
                ],
            })),
        } as any;

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

        it("should not go below 0 when navigating up", () => {
            shopUI.handleInput("ArrowUp");
            expect(shopUI.selectedIndex).toBe(0);
        });

        it("should not exceed max index when navigating down", () => {
            const maxIndex = mockShopSystem.getAllItems().length - 1;
            // Navigate to max
            for (let i = 0; i < maxIndex + 5; i++) {
                shopUI.handleInput("ArrowDown");
            }
            expect(shopUI.selectedIndex).toBe(maxIndex);
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

        it("should render currency display", () => {
            const onClose = vi.fn();
            shopUI.show(onClose);
            shopUI.render();
            expect(mockCtx.fillText).toHaveBeenCalledWith(
                expect.stringContaining("Credits"),
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
                "Missile Launcher",
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
});
