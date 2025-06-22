import type { GameState } from "../game/GameState";
import type { ShopSystem, ShopItem } from "../game/ShopSystem";
import type { WeaponType, UpgradeType } from "../entities/Weapons";
import { SHOP } from "../config/constants";

interface ShopCategory {
    title: string;
    items: ShopItem[];
}

export class ShopUI {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private gameState: GameState;
    private shopSystem: ShopSystem;
    private isActive: boolean = false;
    private _selectedIndex: number = 0;
    private categories: ShopCategory[] = [];
    private flatItems: ShopItem[] = [];
    private onClose?: () => void;

    constructor(
        canvas: HTMLCanvasElement,
        ctx: CanvasRenderingContext2D,
        gameState: GameState,
        shopSystem: ShopSystem
    ) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.gameState = gameState;
        this.shopSystem = shopSystem;
    }

    get active(): boolean {
        return this.isActive;
    }

    get selectedIndex(): number {
        return this._selectedIndex;
    }

    show(onClose: () => void): void {
        this.isActive = true;
        this._selectedIndex = 0;
        this.onClose = onClose;
        this.initializeCategories();
    }

    hide(): void {
        this.isActive = false;
        this.onClose = undefined;
    }

    private initializeCategories(): void {
        const itemsByCategory = this.shopSystem.getItemsByCategory();

        this.categories = [];
        this.flatItems = [];

        // Add weapons category
        if (itemsByCategory.weapons.length > 0) {
            this.categories.push({
                title: "WEAPONS",
                items: itemsByCategory.weapons,
            });
            this.flatItems.push(...itemsByCategory.weapons);
        }

        // Add upgrades category
        if (itemsByCategory.upgrades.length > 0) {
            this.categories.push({
                title: "UPGRADES",
                items: itemsByCategory.upgrades,
            });
            this.flatItems.push(...itemsByCategory.upgrades);
        }

        // Add other category
        if (itemsByCategory.other.length > 0) {
            this.categories.push({
                title: "OTHER",
                items: itemsByCategory.other,
            });
            this.flatItems.push(...itemsByCategory.other);
        }
    }

    handleInput(key: string): boolean {
        if (!this.isActive) return false;

        switch (key) {
            case "ArrowUp":
            case "w":
                this._selectedIndex = Math.max(0, this._selectedIndex - 1);
                return true;
            case "ArrowDown":
            case "s":
                this._selectedIndex = Math.min(
                    this.flatItems.length - 1,
                    this._selectedIndex + 1
                );
                return true;
            case "Enter":
            case " ":
                this.purchaseCurrentItem();
                return true;
            case "Escape":
                if (this.onClose) {
                    this.onClose();
                }
                return true;
        }
        return false;
    }

    handleMouseClick(x: number, y: number): boolean {
        if (!this.isActive) return false;

        const itemIndex = this.getItemIndexAtPosition(x, y);
        if (itemIndex >= 0) {
            this._selectedIndex = itemIndex;
            return true;
        }

        // Check if clicked on "Done Shopping" button
        if (this.isClickOnDoneButton(x, y)) {
            if (this.onClose) {
                this.onClose();
            }
            return true;
        }

        return false;
    }

    handleMouseDoubleClick(x: number, y: number): boolean {
        if (!this.isActive) return false;

        const itemIndex = this.getItemIndexAtPosition(x, y);
        if (itemIndex >= 0) {
            this._selectedIndex = itemIndex;
            this.purchaseCurrentItem();
            return true;
        }

        return false;
    }

    private getItemIndexAtPosition(x: number, y: number): number {
        // Calculate panel dimensions
        const panelWidth = SHOP.UI.PANEL_WIDTH;
        const panelHeight = SHOP.UI.PANEL_HEIGHT;
        const panelX = (this.canvas.width - panelWidth) / 2;
        const panelY = (this.canvas.height - panelHeight) / 2;

        // Check if click is within panel
        if (
            x < panelX ||
            x > panelX + panelWidth ||
            y < panelY ||
            y > panelY + panelHeight
        ) {
            return -1;
        }

        // Calculate item positions
        let currentY = panelY + 120; // Starting Y after header
        let currentItemIndex = 0;

        for (const category of this.categories) {
            currentY += SHOP.UI.CATEGORY_SPACING; // Category header height

            for (const _item of category.items) {
                const itemHeight = SHOP.UI.ITEM_HEIGHT;
                if (y >= currentY && y <= currentY + itemHeight) {
                    return currentItemIndex;
                }
                currentY += itemHeight + SHOP.UI.ITEM_SPACING;
                currentItemIndex++;
            }
            currentY += SHOP.UI.ITEM_SPACING; // Category spacing
        }

        return -1;
    }

    private isClickOnDoneButton(x: number, y: number): boolean {
        const panelWidth = SHOP.UI.PANEL_WIDTH;
        const panelHeight = SHOP.UI.PANEL_HEIGHT;
        const panelX = (this.canvas.width - panelWidth) / 2;
        const panelY = (this.canvas.height - panelHeight) / 2;

        const buttonWidth = 150;
        const buttonHeight = 30;
        const buttonX = panelX + panelWidth - buttonWidth - 20;
        const buttonY = panelY + panelHeight - buttonHeight - 20;

        return (
            x >= buttonX &&
            x <= buttonX + buttonWidth &&
            y >= buttonY &&
            y <= buttonY + buttonHeight
        );
    }

    purchaseCurrentItem(): void {
        if (
            this._selectedIndex >= 0 &&
            this._selectedIndex < this.flatItems.length
        ) {
            const item = this.flatItems[this._selectedIndex];
            if (this.shopSystem.canPurchase(item)) {
                this.shopSystem.purchaseItem(item);
            }
        }
    }

    render(): void {
        if (!this.isActive) return;

        this.ctx.save();

        // Draw semi-transparent overlay
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw main panel
        const panelWidth = SHOP.UI.PANEL_WIDTH;
        const panelHeight = SHOP.UI.PANEL_HEIGHT;
        const panelX = (this.canvas.width - panelWidth) / 2;
        const panelY = (this.canvas.height - panelHeight) / 2;

        // Panel background
        this.ctx.fillStyle = "#001122";
        this.ctx.strokeStyle = "#00ffff";
        this.ctx.lineWidth = 2;
        this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

        // Title
        this.ctx.fillStyle = "#00ffff";
        this.ctx.font = '700 24px Orbitron, "Courier New", monospace';
        this.ctx.textAlign = "center";
        this.ctx.fillText("Merchant Shop", this.canvas.width / 2, panelY + 40);

        // Currency display
        this.ctx.fillStyle = "#ffff00";
        this.ctx.font = '400 16px Orbitron, "Courier New", monospace';
        this.ctx.fillText(
            `Current Credits: ${this.gameState.currency}`,
            this.canvas.width / 2,
            panelY + 70
        );

        // Render items by category
        this.renderCategories(panelX, panelY + 120, panelWidth);

        // Done Shopping button
        this.renderDoneButton(panelX, panelY, panelWidth, panelHeight);

        // Instructions
        this.ctx.fillStyle = "#aaaaaa";
        this.ctx.font = '400 12px Orbitron, "Courier New", monospace';
        this.ctx.textAlign = "center";
        this.ctx.fillText(
            "Use ↑/↓ or W/S to select, Space/Enter to purchase, Esc to exit",
            this.canvas.width / 2,
            panelY + panelHeight - 50
        );
        this.ctx.fillText(
            "Mouse: Click to select, Double-click to purchase",
            this.canvas.width / 2,
            panelY + panelHeight - 35
        );

        this.ctx.restore();
    }

    private renderCategories(
        startX: number,
        startY: number,
        panelWidth: number
    ): void {
        let currentY = startY;
        let currentItemIndex = 0;

        for (const category of this.categories) {
            // Category header
            this.ctx.fillStyle = "#00ffff";
            this.ctx.font = '700 16px Orbitron, "Courier New", monospace';
            this.ctx.textAlign = "left";
            this.ctx.fillText(category.title, startX + 20, currentY);
            currentY += SHOP.UI.CATEGORY_SPACING;

            // Category items
            for (const item of category.items) {
                this.renderItem(
                    item,
                    currentItemIndex,
                    startX,
                    currentY,
                    panelWidth
                );
                currentY += SHOP.UI.ITEM_HEIGHT + SHOP.UI.ITEM_SPACING;
                currentItemIndex++;
            }
            currentY += SHOP.UI.ITEM_SPACING; // Category spacing
        }
    }

    private renderItem(
        item: ShopItem,
        itemIndex: number,
        startX: number,
        startY: number,
        panelWidth: number
    ): void {
        const isSelected = itemIndex === this._selectedIndex;
        const canPurchase = this.shopSystem.canPurchase(item);
        const itemHeight = SHOP.UI.ITEM_HEIGHT;

        // Item background
        if (isSelected && canPurchase) {
            this.ctx.fillStyle = "rgba(0, 255, 255, 0.2)";
            this.ctx.fillRect(startX + 20, startY, panelWidth - 40, itemHeight);
            this.ctx.strokeStyle = "#00ffff";
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(
                startX + 20,
                startY,
                panelWidth - 40,
                itemHeight
            );
        } else if (isSelected) {
            this.ctx.fillStyle = "rgba(255, 0, 0, 0.1)";
            this.ctx.fillRect(startX + 20, startY, panelWidth - 40, itemHeight);
            this.ctx.strokeStyle = "#ff0000";
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(
                startX + 20,
                startY,
                panelWidth - 40,
                itemHeight
            );
        }

        // Item name
        const textColor = canPurchase
            ? isSelected
                ? "#00ffff"
                : "#ffffff"
            : "#666666";
        this.ctx.fillStyle = textColor;
        this.ctx.font = '700 14px Orbitron, "Courier New", monospace';
        this.ctx.textAlign = "left";
        this.ctx.fillText(item.name, startX + 30, startY + 20);

        // Item description
        this.ctx.fillStyle = canPurchase ? "#cccccc" : "#555555";
        this.ctx.font = '400 12px Orbitron, "Courier New", monospace';
        this.ctx.fillText(item.description, startX + 30, startY + 35);

        // Dependencies
        if (item.dependencies.length > 0) {
            const depText = `Requires: ${item.dependencies.join(", ")}`;
            this.ctx.fillStyle = "#888888";
            this.ctx.font = '400 10px Orbitron, "Courier New", monospace';
            this.ctx.fillText(depText, startX + 30, startY + 47);
        }

        // Price
        const priceColor =
            this.gameState.currency >= item.price ? "#00ff00" : "#ff0000";
        this.ctx.fillStyle = priceColor;
        this.ctx.font = '700 14px Orbitron, "Courier New", monospace';
        this.ctx.textAlign = "right";
        this.ctx.fillText(
            `${item.price} Credits`,
            startX + panelWidth - 30,
            startY + 20
        );

        // Availability status
        if (!canPurchase) {
            this.ctx.fillStyle = "#ff0000";
            this.ctx.font = '400 10px Orbitron, "Courier New", monospace';
            this.ctx.textAlign = "right";

            if (this.gameState.currency < item.price) {
                this.ctx.fillText(
                    "Insufficient Credits",
                    startX + panelWidth - 30,
                    startY + 35
                );
            } else if (
                item.dependencies.some(
                    (dep) =>
                        dep !== "bullets" &&
                        !this.gameState.hasWeapon(dep as WeaponType)
                )
            ) {
                this.ctx.fillText(
                    "Missing Requirements",
                    startX + panelWidth - 30,
                    startY + 35
                );
            } else if (
                item.type === "upgrade" &&
                this.gameState.hasUpgrade(item.id as UpgradeType)
            ) {
                this.ctx.fillText(
                    "Already Owned",
                    startX + panelWidth - 30,
                    startY + 35
                );
            } else if (
                item.type === "weapon" &&
                this.gameState.hasWeapon(item.id as WeaponType)
            ) {
                this.ctx.fillText(
                    "Already Owned",
                    startX + panelWidth - 30,
                    startY + 35
                );
            }
        }
    }

    private renderDoneButton(
        panelX: number,
        panelY: number,
        panelWidth: number,
        panelHeight: number
    ): void {
        const buttonWidth = 150;
        const buttonHeight = 30;
        const buttonX = panelX + panelWidth - buttonWidth - 20;
        const buttonY = panelY + panelHeight - buttonHeight - 20;

        // Button background
        this.ctx.fillStyle = "#003366";
        this.ctx.strokeStyle = "#00ffff";
        this.ctx.lineWidth = 1;
        this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
        this.ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);

        // Button text
        this.ctx.fillStyle = "#00ffff";
        this.ctx.font = '700 14px Orbitron, "Courier New", monospace';
        this.ctx.textAlign = "center";
        this.ctx.fillText(
            "Done Shopping",
            buttonX + buttonWidth / 2,
            buttonY + buttonHeight / 2 + 5
        );
    }
}
