/**
 * All valid input names in the system
 */
export type InputName =
    | "thrust"
    | "left"
    | "right"
    | "strafeLeft"
    | "strafeRight"
    | "shoot"
    | "shootPressed"
    | "shield"
    | "shieldPressed"
    | "weapon1"
    | "weapon2"
    | "weapon3"
    | "weapon4"
    | "menuToggle"
    | "menuUp"
    | "menuDown"
    | "menuLeft"
    | "menuRight"
    | "menuSelect"
    | "restart"
    | "debugToggle";

/**
 * Input contexts for managing different game states and preventing input bleeding
 */
export enum InputContext {
    /** Normal gameplay - ship movement, shooting, weapon switching */
    GAMEPLAY = "gameplay",

    /** Menu system - navigation only */
    MENU = "menu",

    /** Level complete screen - only space for dismissal */
    LEVEL_COMPLETE = "level_complete",

    /** Game over screen - only 'R' for restart */
    GAME_OVER = "game_over",

    /** Paused state - only escape to unpause */
    PAUSED = "paused",
}

/**
 * Defines which inputs are allowed in each context
 */
export const INPUT_CONTEXT_PERMISSIONS: Record<InputContext, InputName[]> = {
    [InputContext.GAMEPLAY]: [
        // Movement
        "thrust",
        "left",
        "right",
        "strafeLeft",
        "strafeRight",
        // Shield
        "shield",
        "shieldPressed",
        // Shooting
        "shoot",
        "shootPressed",
        // Weapon switching
        "weapon1",
        "weapon2",
        "weapon3",
        "weapon4",
        // System
        "menuToggle",
        "debugToggle",
    ],

    [InputContext.MENU]: [
        "menuToggle",
        "menuUp",
        "menuDown",
        "menuLeft",
        "menuRight",
        "menuSelect",
    ],

    [InputContext.LEVEL_COMPLETE]: [
        "shootPressed", // Only space for dismissal
    ],

    [InputContext.GAME_OVER]: ["restart"],

    [InputContext.PAUSED]: [
        "menuToggle", // Only escape to unpause
    ],
};
