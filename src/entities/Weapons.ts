/**
 * Weapon system types and interfaces
 * Defines the core architecture for the multi-weapon system
 */

// Available weapon types
export type WeaponType = "bullets" | "missiles" | "laser" | "lightning";

// Available upgrade types
export type UpgradeType =
    | "upgrade_bullets_fire_rate"
    | "upgrade_bullets_size"
    | "upgrade_missiles_speed"
    | "upgrade_missiles_fire_rate"
    | "upgrade_missiles_homing"
    | "upgrade_laser_range"
    | "upgrade_laser_efficiency"
    | "upgrade_lightning_radius"
    | "upgrade_lightning_chain";

// Weapon configuration interface
export interface WeaponConfig {
    name: string;
    keyboardShortcut: number; // 1-4
    fuelCost: number; // fuel consumed per shot
    fireRate: number; // milliseconds between shots
    unlocked: boolean;
}

// Weapon upgrade effects
export interface WeaponUpgrades {
    fireRateMultiplier: number; // 1.0 = normal, 1.25 = 25% faster
    sizeMultiplier: number; // 1.0 = normal, 1.5 = 50% larger
    speedMultiplier: number; // for missiles
    efficiencyMultiplier: number; // for laser fuel efficiency
    rangeMultiplier: number; // for laser range
    radiusMultiplier: number; // for lightning radius
    hasHoming: boolean; // for missiles
    hasChain: boolean; // for lightning
}

// Default upgrade values (no upgrades)
export const DEFAULT_UPGRADES: WeaponUpgrades = {
    fireRateMultiplier: 1.0,
    sizeMultiplier: 1.0,
    speedMultiplier: 1.0,
    efficiencyMultiplier: 1.0,
    rangeMultiplier: 1.0,
    radiusMultiplier: 1.0,
    hasHoming: false,
    hasChain: false,
};

// Weapon state for GameState
export interface WeaponState {
    unlockedWeapons: Set<WeaponType>;
    currentWeapon: WeaponType;
    upgrades: Set<UpgradeType>;
    lastFireTime: number;
}

// Helper functions for weapon management
export class WeaponManager {
    static getDefaultWeaponState(): WeaponState {
        return {
            unlockedWeapons: new Set(["bullets"]), // Start with bullets unlocked
            currentWeapon: "bullets",
            upgrades: new Set(),
            lastFireTime: 0,
        };
    }

    static isWeaponUnlocked(state: WeaponState, weapon: WeaponType): boolean {
        return state.unlockedWeapons.has(weapon);
    }

    static unlockWeapon(state: WeaponState, weapon: WeaponType): void {
        state.unlockedWeapons.add(weapon);
    }

    static addUpgrade(state: WeaponState, upgrade: UpgradeType): void {
        state.upgrades.add(upgrade);
    }

    static hasUpgrade(state: WeaponState, upgrade: UpgradeType): boolean {
        return state.upgrades.has(upgrade);
    }

    static switchWeapon(state: WeaponState, weapon: WeaponType): boolean {
        if (WeaponManager.isWeaponUnlocked(state, weapon)) {
            state.currentWeapon = weapon;
            return true;
        }
        return false;
    }

    static getWeaponUpgrades(
        state: WeaponState,
        weapon: WeaponType
    ): WeaponUpgrades {
        const upgrades: WeaponUpgrades = { ...DEFAULT_UPGRADES };

        switch (weapon) {
            case "bullets":
                if (state.upgrades.has("upgrade_bullets_fire_rate")) {
                    upgrades.fireRateMultiplier = 1.25; // 25% faster
                }
                if (state.upgrades.has("upgrade_bullets_size")) {
                    upgrades.sizeMultiplier = 1.5; // 50% larger
                }
                break;
            case "missiles":
                if (state.upgrades.has("upgrade_missiles_speed")) {
                    upgrades.speedMultiplier = 1.5; // 50% faster
                }
                if (state.upgrades.has("upgrade_missiles_fire_rate")) {
                    upgrades.fireRateMultiplier = 1.5; // 50% faster
                }
                if (state.upgrades.has("upgrade_missiles_homing")) {
                    upgrades.hasHoming = true;
                }
                break;
            case "laser":
                if (state.upgrades.has("upgrade_laser_range")) {
                    upgrades.rangeMultiplier = 1.5; // 50% longer
                }
                if (state.upgrades.has("upgrade_laser_efficiency")) {
                    upgrades.efficiencyMultiplier = 0.5; // 50% more efficient (less fuel)
                }
                break;
            case "lightning":
                if (state.upgrades.has("upgrade_lightning_radius")) {
                    upgrades.radiusMultiplier = 1.2; // 20% larger radius
                }
                if (state.upgrades.has("upgrade_lightning_chain")) {
                    upgrades.hasChain = true;
                }
                break;
        }

        return upgrades;
    }
}
