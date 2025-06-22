import type { GameState } from "./GameState";
import { SHOP } from "../config/constants";
import type { WeaponType, UpgradeType } from "../entities/Weapons";

export interface ShopItem {
    id: string;
    name: string;
    description: string;
    type: "weapon" | "upgrade" | "life";
    price: number;
    dependencies: string[];
}

export class ShopSystem {
    private gameState: GameState;
    private items: ShopItem[];

    constructor(gameState: GameState) {
        this.gameState = gameState;
        this.items = this.initializeShopItems();
    }

    private initializeShopItems(): ShopItem[] {
        return [
            // Basic Weapons
            {
                id: "missiles",
                name: "Missile Launcher",
                description: "Powerful homing missiles",
                type: "weapon",
                price: SHOP.WEAPON_PRICES.MISSILES,
                dependencies: [],
            },
            {
                id: "laser",
                name: "Laser Cannon",
                description: "Continuous beam weapon",
                type: "weapon",
                price: SHOP.WEAPON_PRICES.LASER,
                dependencies: [],
            },
            {
                id: "lightning",
                name: "Lightning Gun",
                description: "Chain lightning damage",
                type: "weapon",
                price: SHOP.WEAPON_PRICES.LIGHTNING,
                dependencies: [],
            },

            // Bullet Upgrades
            {
                id: "upgrade_bullets_fire_rate",
                name: "Bullet Fire Rate",
                description: "Increases bullet firing speed by 25%",
                type: "upgrade",
                price: SHOP.UPGRADE_PRICES.BULLETS_FIRE_RATE,
                dependencies: ["bullets"],
            },
            {
                id: "upgrade_bullets_size",
                name: "Bullet Size",
                description: "Increases bullet size by 50%",
                type: "upgrade",
                price: SHOP.UPGRADE_PRICES.BULLETS_SIZE,
                dependencies: ["bullets"],
            },

            // Missile Upgrades
            {
                id: "upgrade_missiles_speed",
                name: "Missile Speed",
                description: "Increases missile speed by 50%",
                type: "upgrade",
                price: SHOP.UPGRADE_PRICES.MISSILES_SPEED,
                dependencies: ["missiles"],
            },
            {
                id: "upgrade_missiles_fire_rate",
                name: "Missile Fire Rate",
                description: "Increases missile firing speed by 50%",
                type: "upgrade",
                price: SHOP.UPGRADE_PRICES.MISSILES_FIRE_RATE,
                dependencies: ["missiles"],
            },
            {
                id: "upgrade_missiles_homing",
                name: "Missile Homing",
                description: "Missiles track targets more accurately",
                type: "upgrade",
                price: SHOP.UPGRADE_PRICES.MISSILES_HOMING,
                dependencies: ["missiles"],
            },

            // Laser Upgrades
            {
                id: "upgrade_laser_range",
                name: "Laser Range",
                description: "Increases laser range by 50%",
                type: "upgrade",
                price: SHOP.UPGRADE_PRICES.LASER_RANGE,
                dependencies: ["laser"],
            },
            {
                id: "upgrade_laser_efficiency",
                name: "Laser Efficiency",
                description: "Reduces laser fuel consumption by 50%",
                type: "upgrade",
                price: SHOP.UPGRADE_PRICES.LASER_EFFICIENCY,
                dependencies: ["laser"],
            },

            // Lightning Upgrades
            {
                id: "upgrade_lightning_radius",
                name: "Lightning Radius",
                description: "Increases lightning radius by 20%",
                type: "upgrade",
                price: SHOP.UPGRADE_PRICES.LIGHTNING_RADIUS,
                dependencies: ["lightning"],
            },
            {
                id: "upgrade_lightning_chain",
                name: "Lightning Chain",
                description: "Lightning chains between multiple targets",
                type: "upgrade",
                price: SHOP.UPGRADE_PRICES.LIGHTNING_CHAIN,
                dependencies: ["lightning"],
            },

            // Extra Life
            {
                id: "extra_life",
                name: "Extra Life",
                description: "Gain an additional life",
                type: "life",
                price: SHOP.OTHER_PRICES.EXTRA_LIFE,
                dependencies: [],
            },
        ];
    }

    getAllItems(): ShopItem[] {
        return [...this.items];
    }

    getItem(id: string): ShopItem {
        const item = this.items.find((item) => item.id === id);
        if (!item) {
            throw new Error(`Shop item not found: ${id}`);
        }
        return item;
    }

    canPurchase(item: ShopItem): boolean {
        // Check if player has enough currency
        if (this.gameState.currency < item.price) {
            return false;
        }

        // Check if dependencies are met
        for (const dependency of item.dependencies) {
            if (dependency === "bullets") {
                // Bullets are always available (starting weapon)
                continue;
            }

            if (!this.gameState.hasWeapon(dependency as WeaponType)) {
                return false;
            }
        }

        // Check if already owned (for upgrades)
        if (
            item.type === "upgrade" &&
            this.gameState.hasUpgrade(item.id as UpgradeType)
        ) {
            return false;
        }

        // Check if weapon is already owned
        if (
            item.type === "weapon" &&
            this.gameState.hasWeapon(item.id as WeaponType)
        ) {
            return false;
        }

        return true;
    }

    purchaseItem(item: ShopItem): boolean {
        if (!this.canPurchase(item)) {
            return false;
        }

        // Deduct currency
        if (!this.gameState.spendCurrency(item.price)) {
            return false;
        }

        // Apply the purchase
        switch (item.type) {
            case "weapon":
                this.gameState.unlockWeapon(item.id as WeaponType);
                break;
            case "upgrade":
                this.gameState.applyWeaponUpgrade(item.id as UpgradeType);
                break;
            case "life":
                this.gameState.addLife();
                break;
        }

        return true;
    }

    getItemsByCategory(): {
        weapons: ShopItem[];
        upgrades: ShopItem[];
        other: ShopItem[];
    } {
        const weapons = this.items.filter((item) => item.type === "weapon");
        const upgrades = this.items.filter((item) => item.type === "upgrade");
        const other = this.items.filter((item) => item.type === "life");

        return { weapons, upgrades, other };
    }
}
