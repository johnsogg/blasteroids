import type { WeaponType } from "~/config/constants";

/**
 * Weapon upgrade state tracking
 */
export interface WeaponUpgrades {
    // Bullets upgrades
    bulletsFireRate: boolean;
    bulletsSize: boolean;

    // Missiles upgrades
    missilesSpeed: boolean;
    missilesFireRate: boolean;
    missilesHoming: boolean;

    // Laser upgrades
    laserRange: boolean;
    laserEfficiency: boolean;

    // Lightning upgrades
    lightningRadius: boolean;
    lightningChain: boolean;
}

/**
 * Weapon inventory - tracks which weapons are unlocked
 */
export interface WeaponInventory {
    bullets: boolean; // Default weapon, starts unlocked
    missiles: boolean;
    laser: boolean;
    lightning: boolean;
}

/**
 * Complete weapon state
 */
export interface WeaponState {
    currentWeapon: WeaponType;
    inventory: WeaponInventory;
    upgrades: WeaponUpgrades;
}

/**
 * Create initial weapon state
 */
export function createInitialWeaponState(): WeaponState {
    return {
        currentWeapon: "bullets",
        inventory: {
            bullets: true, // Default weapon is always available
            missiles: false,
            laser: false,
            lightning: false,
        },
        upgrades: {
            bulletsFireRate: false,
            bulletsSize: false,
            missilesSpeed: false,
            missilesFireRate: false,
            missilesHoming: false,
            laserRange: false,
            laserEfficiency: false,
            lightningRadius: false,
            lightningChain: false,
        },
    };
}
