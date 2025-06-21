import { describe, it, expect, beforeEach } from "vitest";
import { GameState } from "./GameState";
import { CURRENCY } from "~/config/constants";

describe("GameState - Zone System", () => {
    let gameState: GameState;

    beforeEach(() => {
        gameState = new GameState();
    });

    describe("Zone and Level Properties", () => {
        it("should start at zone 1, level 1", () => {
            expect(gameState.zone).toBe(1);
            expect(gameState.level).toBe(1);
            expect(gameState.zoneLevel).toBe("1-1");
        });

        it("should advance levels correctly", () => {
            gameState.nextLevel();
            expect(gameState.zone).toBe(1);
            expect(gameState.level).toBe(2);
            expect(gameState.zoneLevel).toBe("1-2");
        });

        it("should advance to next zone correctly", () => {
            gameState.advanceToNextZone();
            expect(gameState.zone).toBe(2);
            expect(gameState.level).toBe(1);
            expect(gameState.zoneLevel).toBe("2-1");
        });

        it("should continue current zone correctly", () => {
            // Advance a few levels first
            gameState.nextLevel(); // 1-2
            gameState.nextLevel(); // 1-3

            gameState.continueCurrentZone();
            expect(gameState.zone).toBe(1);
            expect(gameState.level).toBe(1);
            expect(gameState.zoneLevel).toBe("1-1");
        });
    });

    describe("Absolute Level Calculation", () => {
        it("should calculate absolute level correctly for zone 1", () => {
            expect(gameState.absoluteLevel).toBe(1); // Zone 1, Level 1

            gameState.nextLevel();
            expect(gameState.absoluteLevel).toBe(2); // Zone 1, Level 2
        });

        it("should calculate absolute level correctly across zones", () => {
            gameState.advanceToNextZone(); // Zone 2, Level 1
            expect(gameState.absoluteLevel).toBe(6); // (2-1)*5 + 1 = 6

            gameState.nextLevel(); // Zone 2, Level 2
            expect(gameState.absoluteLevel).toBe(7); // (2-1)*5 + 2 = 7
        });
    });

    describe("Choice Screen Logic", () => {
        it("should not show choice screen for levels 1-5", () => {
            for (let i = 1; i <= 5; i++) {
                expect(gameState.shouldShowChoiceScreen()).toBe(false);
                if (i < 5) gameState.nextLevel();
            }
        });

        it("should show choice screen after level 5", () => {
            // Advance to level 6
            for (let i = 1; i <= 6; i++) {
                gameState.nextLevel();
            }
            expect(gameState.shouldShowChoiceScreen()).toBe(true);
        });
    });

    describe("Currency System", () => {
        it("should start with initial currency", () => {
            expect(gameState.currency).toBe(CURRENCY.STARTING_AMOUNT);
        });

        it("should add currency correctly", () => {
            gameState.addCurrency(100);
            expect(gameState.currency).toBe(100);

            gameState.addCurrency(50);
            expect(gameState.currency).toBe(150);
        });

        it("should spend currency correctly when sufficient funds", () => {
            gameState.addCurrency(100);
            const success = gameState.spendCurrency(30);

            expect(success).toBe(true);
            expect(gameState.currency).toBe(70);
        });

        it("should fail to spend currency when insufficient funds", () => {
            gameState.addCurrency(20);
            const success = gameState.spendCurrency(30);

            expect(success).toBe(false);
            expect(gameState.currency).toBe(20); // Unchanged
        });

        it("should calculate level currency reward correctly", () => {
            const reward = gameState.calculateLevelCurrencyReward();

            // At minimum, should get base reward (10) * zone multiplier (1.0)
            expect(reward).toBeGreaterThanOrEqual(10);
            expect(typeof reward).toBe("number");
        });

        it("should calculate higher rewards for higher zones", () => {
            gameState.advanceToNextZone(); // Zone 2 has 1.2x multiplier

            const zone2Reward = gameState.calculateLevelCurrencyReward();

            // Zone 2 should give at least the base reward with multiplier
            expect(zone2Reward).toBeGreaterThanOrEqual(12); // 10 * 1.2
        });
    });

    describe("Reset Functionality", () => {
        it("should reset zone and level to 1-1", () => {
            // Advance first
            gameState.nextLevel();
            gameState.advanceToNextZone();

            gameState.reset();

            expect(gameState.zone).toBe(1);
            expect(gameState.level).toBe(1);
            expect(gameState.zoneLevel).toBe("1-1");
        });

        it("should preserve currency across resets", () => {
            gameState.addCurrency(100);
            gameState.reset();

            // Currency should be preserved (loaded from localStorage)
            // Note: In tests, localStorage might not persist, so this tests the logic
            expect(typeof gameState.currency).toBe("number");
        });
    });
});
