/**
 * LocalStorage utility for persisting debug settings and game preferences
 */
export class LocalStorage {
    private static readonly PREFIX = "blasteroids-debug-";

    // Debug setting keys
    private static readonly DEBUG_GRAPHICS_KEY = `${LocalStorage.PREFIX}graphics`;
    private static readonly DEBUG_ZONE_KEY = `${LocalStorage.PREFIX}zone`;
    private static readonly DEBUG_GIFTS_KEY = `${LocalStorage.PREFIX}gifts`;

    /**
     * Get debug graphics toggle state
     */
    static getDebugGraphics(): boolean {
        try {
            const value = localStorage.getItem(LocalStorage.DEBUG_GRAPHICS_KEY);
            return value === "true";
        } catch {
            return false;
        }
    }

    /**
     * Set debug graphics toggle state
     */
    static setDebugGraphics(enabled: boolean): void {
        try {
            localStorage.setItem(
                LocalStorage.DEBUG_GRAPHICS_KEY,
                enabled.toString()
            );
        } catch {
            // Ignore localStorage errors
        }
    }

    /**
     * Get debug zone preference
     */
    static getDebugZone(): number | null {
        try {
            const value = localStorage.getItem(LocalStorage.DEBUG_ZONE_KEY);
            if (value === null || value === "null") return null;
            const zone = parseInt(value, 10);
            return isNaN(zone) ? null : zone;
        } catch {
            return null;
        }
    }

    /**
     * Set debug zone preference
     */
    static setDebugZone(zone: number | null): void {
        try {
            if (zone === null) {
                localStorage.removeItem(LocalStorage.DEBUG_ZONE_KEY);
            } else {
                localStorage.setItem(
                    LocalStorage.DEBUG_ZONE_KEY,
                    zone.toString()
                );
            }
        } catch {
            // Ignore localStorage errors
        }
    }

    /**
     * Get debug gifts preference
     */
    static getDebugGifts(): string | null {
        try {
            const value = localStorage.getItem(LocalStorage.DEBUG_GIFTS_KEY);
            return value === "null" ? null : value;
        } catch {
            return null;
        }
    }

    /**
     * Set debug gifts preference
     */
    static setDebugGifts(giftType: string | null): void {
        try {
            if (giftType === null) {
                localStorage.removeItem(LocalStorage.DEBUG_GIFTS_KEY);
            } else {
                localStorage.setItem(LocalStorage.DEBUG_GIFTS_KEY, giftType);
            }
        } catch {
            // Ignore localStorage errors
        }
    }

    /**
     * Clear all debug settings
     */
    static clearDebugSettings(): void {
        try {
            localStorage.removeItem(LocalStorage.DEBUG_GRAPHICS_KEY);
            localStorage.removeItem(LocalStorage.DEBUG_ZONE_KEY);
            localStorage.removeItem(LocalStorage.DEBUG_GIFTS_KEY);
        } catch {
            // Ignore localStorage errors
        }
    }
}
