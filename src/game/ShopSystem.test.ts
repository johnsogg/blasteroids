import { describe, it, expect, beforeEach } from "vitest";
import { ShopSystem } from "./ShopSystem";
import type { GameState } from "./GameState";

describe("ShopSystem", () => {
    let shopSystem: ShopSystem;
    let mockGameState: GameState;

    beforeEach(() => {
        // Mock GameState with essential methods
        const mockCurrency = { value: 100 };
        mockGameState = {
            get currency() {
                return mockCurrency.value;
            },
            spendCurrency: (amount: number) => {
                if (mockCurrency.value >= amount) {
                    mockCurrency.value -= amount;
                    return true;
                }
                return false;
            },
            hasUpgrade: () => false,
            applyWeaponUpgrade: () => true,
            hasWeapon: (weapon: string) => weapon === "bullets", // Default: only has bullets
            unlockWeapon: () => {},
            addLife: () => {},
        } as any;

        shopSystem = new ShopSystem(mockGameState);
    });

    describe("Shop Item Structure", () => {
        it("should have all required shop items", () => {
            const items = shopSystem.getAllItems();

            expect(items.length).toBeGreaterThan(0);
            expect(
                items.some(
                    (item) => item.type === "weapon" && item.id === "missiles"
                )
            ).toBe(true);
            expect(
                items.some(
                    (item) => item.type === "weapon" && item.id === "laser"
                )
            ).toBe(true);
            expect(
                items.some(
                    (item) => item.type === "weapon" && item.id === "lightning"
                )
            ).toBe(true);
            expect(
                items.some(
                    (item) =>
                        item.type === "upgrade" &&
                        item.id === "upgrade_bullets_fire_rate"
                )
            ).toBe(true);
            expect(items.some((item) => item.type === "life")).toBe(true);
        });

        it("should have valid pricing for all items", () => {
            const items = shopSystem.getAllItems();

            items.forEach((item) => {
                expect(item.price).toBeGreaterThan(0);
                expect(typeof item.price).toBe("number");
            });
        });

        it("should have proper dependencies structure", () => {
            const items = shopSystem.getAllItems();

            items.forEach((item) => {
                expect(Array.isArray(item.dependencies)).toBe(true);
                if (item.dependencies.length > 0) {
                    item.dependencies.forEach((dep) => {
                        expect(typeof dep).toBe("string");
                    });
                }
            });
        });
    });

    describe("Item Availability", () => {
        it("should allow purchasing basic weapons when player has currency", () => {
            const missilesItem = shopSystem.getItem("missiles");
            expect(shopSystem.canPurchase(missilesItem)).toBe(true);
        });

        it("should not allow purchasing when insufficient currency", () => {
            const mockCurrency = { value: 5 };
            mockGameState = {
                ...mockGameState,
                get currency() {
                    return mockCurrency.value;
                },
            } as any;
            shopSystem = new ShopSystem(mockGameState);
            const missilesItem = shopSystem.getItem("missiles");
            expect(shopSystem.canPurchase(missilesItem)).toBe(false);
        });

        it("should not allow purchasing upgrades without base weapon", () => {
            mockGameState.hasWeapon = () => false; // Player has no weapons
            const missileUpgrade = shopSystem.getItem("upgrade_missiles_speed");
            expect(shopSystem.canPurchase(missileUpgrade)).toBe(false);
        });

        it("should allow purchasing upgrades when dependencies are met", () => {
            mockGameState.hasWeapon = (weapon: string) => weapon === "missiles";
            const missileUpgrade = shopSystem.getItem("upgrade_missiles_speed");
            expect(shopSystem.canPurchase(missileUpgrade)).toBe(true);
        });

        it("should not allow purchasing already owned upgrades", () => {
            mockGameState.hasUpgrade = (type: string) =>
                type === "upgrade_bullets_fire_rate";
            const bulletUpgrade = shopSystem.getItem(
                "upgrade_bullets_fire_rate"
            );
            expect(shopSystem.canPurchase(bulletUpgrade)).toBe(false);
        });
    });

    describe("Purchase Process", () => {
        it("should successfully purchase valid items", () => {
            const missilesItem = shopSystem.getItem("missiles");
            const initialCurrency = mockGameState.currency;

            const result = shopSystem.purchaseItem(missilesItem);

            expect(result).toBe(true);
            expect(mockGameState.currency).toBe(
                initialCurrency - missilesItem.price
            );
        });

        it("should fail to purchase invalid items", () => {
            const mockCurrency = { value: 5 };
            mockGameState = {
                ...mockGameState,
                get currency() {
                    return mockCurrency.value;
                },
                spendCurrency: (amount: number) => {
                    if (mockCurrency.value >= amount) {
                        mockCurrency.value -= amount;
                        return true;
                    }
                    return false;
                },
            } as any;
            shopSystem = new ShopSystem(mockGameState);
            const missilesItem = shopSystem.getItem("missiles");
            const initialCurrency = mockGameState.currency;

            const result = shopSystem.purchaseItem(missilesItem);

            expect(result).toBe(false);
            expect(mockGameState.currency).toBe(initialCurrency);
        });

        it("should apply weapon upgrades correctly", () => {
            let appliedUpgrade = "";
            mockGameState.applyWeaponUpgrade = (type: string) => {
                appliedUpgrade = type;
                return true;
            };

            const bulletUpgrade = shopSystem.getItem(
                "upgrade_bullets_fire_rate"
            );
            shopSystem.purchaseItem(bulletUpgrade);

            expect(appliedUpgrade).toBe("upgrade_bullets_fire_rate");
        });

        it("should add weapons correctly", () => {
            let addedWeapon = "";
            mockGameState.unlockWeapon = (weapon: string) => {
                addedWeapon = weapon;
            };

            const missilesItem = shopSystem.getItem("missiles");
            shopSystem.purchaseItem(missilesItem);

            expect(addedWeapon).toBe("missiles");
        });

        it("should add extra lives correctly", () => {
            let livesAdded = false;
            mockGameState.addLife = () => {
                livesAdded = true;
            };

            const lifeItem = shopSystem.getItem("extra_life");
            shopSystem.purchaseItem(lifeItem);

            expect(livesAdded).toBe(true);
        });
    });

    describe("Shop Categories", () => {
        it("should group items by category correctly", () => {
            const categories = shopSystem.getItemsByCategory();

            expect(categories.weapons).toBeDefined();
            expect(categories.upgrades).toBeDefined();
            expect(categories.other).toBeDefined();

            expect(categories.weapons.length).toBeGreaterThan(0);
            expect(categories.upgrades.length).toBeGreaterThan(0);
            expect(categories.other.length).toBeGreaterThan(0);
        });
    });
});
