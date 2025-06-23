import type { GameState } from "../game/GameState";
import type { ShopSystem, ShopItem } from "../game/ShopSystem";
import type { WeaponType, UpgradeType } from "../entities/Weapons";
import { SHOP, CURRENCY } from "../config/constants";
import { UIComponent } from "./UIStack";

interface ShopCategory {
    title: string;
    items: ShopItem[];
}

export class ShopUI implements UIComponent {
    public readonly id = "shop";

    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private gameState: GameState;
    private shopSystem: ShopSystem;
    private isActive: boolean = false;
    private _selectedIndex: number = 0;
    private categories: ShopCategory[] = [];
    private flatItems: ShopItem[] = [];
    private _scrollOffset: number = 0;

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

    get scrollOffset(): number {
        return this._scrollOffset;
    }

    show(): void {
        this.isActive = true;
        this.initializeCategories();
        this._selectedIndex = this.findFirstSelectableItem();
        this._scrollOffset = 0;
        this.ensureSelectedItemVisible();
    }

    hide(): void {
        this.isActive = false;
    }

    /**
     * Cleanup when component is removed from stack
     */
    cleanup(): void {
        this.categories = [];
        this.flatItems = [];
        this._selectedIndex = 0;
        this._scrollOffset = 0;
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
                if (this._selectedIndex === -1) {
                    // If on "Done Shopping" button, go to last item
                    this._selectedIndex = this.flatItems.length - 1;
                } else if (this._selectedIndex === 0) {
                    // If at first item, wrap to "Done Shopping" button
                    this._selectedIndex = -1;
                } else {
                    this._selectedIndex = this._selectedIndex - 1;
                }
                this.ensureSelectedItemVisible();
                return true;
            case "ArrowDown":
            case "s":
                if (this._selectedIndex >= this.flatItems.length - 1) {
                    // If at last item, go to "Done Shopping" button
                    this._selectedIndex = -1;
                } else {
                    this._selectedIndex = Math.min(
                        this.flatItems.length - 1,
                        this._selectedIndex + 1
                    );
                    this.ensureSelectedItemVisible();
                }
                return true;
            case "Enter":
            case " ":
                if (this._selectedIndex === -1) {
                    // "Done Shopping" button selected
                    // Just hide - UIStackManager will handle the rest
                    this.hide();
                } else {
                    this.purchaseCurrentItem();
                }
                return true;
            case "Escape":
                // Just hide - UIStackManager will handle the rest
                this.hide();
                return true;
            case "PageDown":
                this.scrollDown();
                return true;
            case "PageUp":
                this.scrollUp();
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
            // Just hide - UIStackManager will handle the rest
            this.hide();
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

    private scrollUp(): void {
        this._scrollOffset = Math.max(
            0,
            this._scrollOffset - SHOP.UI.SCROLL_AMOUNT
        );
    }

    private scrollDown(): void {
        const maxScroll = this.calculateMaxScrollOffset();
        this._scrollOffset = Math.min(
            maxScroll,
            this._scrollOffset + SHOP.UI.SCROLL_AMOUNT
        );
    }

    private calculateMaxScrollOffset(): number {
        const panelHeight = SHOP.UI.PANEL_HEIGHT;
        const headerHeight = SHOP.UI.HEADER_HEIGHT;
        const footerHeight = SHOP.UI.FOOTER_HEIGHT;
        const availableHeight = panelHeight - headerHeight - footerHeight;

        // Calculate total content height
        let contentHeight = 0;
        for (const category of this.categories) {
            contentHeight += SHOP.UI.CATEGORY_SPACING; // Category header
            contentHeight +=
                category.items.length *
                (SHOP.UI.ITEM_HEIGHT + SHOP.UI.ITEM_SPACING);
            contentHeight += SHOP.UI.ITEM_SPACING; // Category spacing
        }

        return Math.max(0, contentHeight - availableHeight);
    }

    private findFirstSelectableItem(): number {
        for (let i = 0; i < this.flatItems.length; i++) {
            if (this.shopSystem.canPurchase(this.flatItems[i])) {
                return i;
            }
        }
        // If no item is purchasable, return first item (or 0 if no items)
        return this.flatItems.length > 0 ? 0 : -1;
    }

    private ensureSelectedItemVisible(): void {
        if (this._selectedIndex === -1 || this.flatItems.length === 0) {
            return;
        }

        // Calculate the Y position of the selected item
        const itemY = this.calculateItemY(this._selectedIndex);
        const itemHeight = SHOP.UI.ITEM_HEIGHT;

        const panelHeight = SHOP.UI.PANEL_HEIGHT;
        const headerHeight = SHOP.UI.HEADER_HEIGHT;
        const footerHeight = SHOP.UI.FOOTER_HEIGHT;
        const visibleAreaHeight = panelHeight - headerHeight - footerHeight;

        // Check if item is above the visible area
        if (itemY < this._scrollOffset) {
            this._scrollOffset = Math.max(0, itemY - SHOP.UI.ITEM_SPACING);
        }
        // Check if item is below the visible area
        else if (itemY + itemHeight > this._scrollOffset + visibleAreaHeight) {
            this._scrollOffset =
                itemY + itemHeight - visibleAreaHeight + SHOP.UI.ITEM_SPACING;
        }
    }

    private calculateItemY(itemIndex: number): number {
        let currentY = 0;
        let currentItemIndex = 0;

        for (const category of this.categories) {
            currentY += SHOP.UI.CATEGORY_SPACING; // Category header height

            for (const _item of category.items) {
                if (currentItemIndex === itemIndex) {
                    return currentY;
                }
                currentY += SHOP.UI.ITEM_HEIGHT + SHOP.UI.ITEM_SPACING;
                currentItemIndex++;
            }
            currentY += SHOP.UI.ITEM_SPACING; // Category spacing
        }

        return currentY;
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
            `Current ${CURRENCY.NAME}: ${this.gameState.currency}`,
            this.canvas.width / 2,
            panelY + 70
        );

        // Set up clipping for scrollable content area
        const contentStartY = panelY + SHOP.UI.HEADER_HEIGHT;
        const contentHeight =
            panelHeight - SHOP.UI.HEADER_HEIGHT - SHOP.UI.FOOTER_HEIGHT;

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(panelX, contentStartY, panelWidth, contentHeight);
        this.ctx.clip();

        // Render items by category with scroll offset
        this.renderCategories(
            panelX,
            contentStartY - this._scrollOffset,
            panelWidth
        );

        this.ctx.restore();

        // Done Shopping button
        this.renderDoneButton(
            panelX,
            panelY,
            panelWidth,
            panelHeight,
            this._selectedIndex === -1
        );

        // Instructions - constrained to not overlap Done Shopping button
        this.ctx.fillStyle = "#aaaaaa";
        this.ctx.font = '400 12px Orbitron, "Courier New", monospace';
        this.ctx.textAlign = "left";

        // Calculate available width for instructions (leave space for Done Shopping button)
        const instructionX = panelX + 20;

        // Split long instruction text to fit
        const instruction1 =
            "Use ↑/↓ or W/S to select, Space/Enter to purchase";
        const instruction2 = "Esc to exit";
        const instruction3 = "Mouse: Click to select, Double-click to purchase";

        this.ctx.fillText(
            instruction1,
            instructionX,
            panelY + panelHeight - 50
        );
        this.ctx.fillText(
            instruction2,
            instructionX,
            panelY + panelHeight - 37
        );
        this.ctx.fillText(
            instruction3,
            instructionX,
            panelY + panelHeight - 24
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

        // Determine item availability state and colors
        let textColor: string;
        let descriptionColor: string;
        let priceColor: string;

        if (canPurchase) {
            // Green: Can afford and purchase
            textColor = isSelected ? "#00ffff" : "#00ff00";
            descriptionColor = "#cccccc";
            priceColor = "#00ff00";
        } else {
            // Check why item cannot be purchased
            const isAlreadyOwned =
                (item.type === "weapon" &&
                    this.gameState.hasWeapon(item.id as WeaponType)) ||
                (item.type === "upgrade" &&
                    this.gameState.hasUpgrade(item.id as UpgradeType));

            const hasUnmetPrerequisites = item.dependencies.some(
                (dep) =>
                    dep !== "bullets" &&
                    !this.gameState.hasWeapon(dep as WeaponType)
            );

            if (isAlreadyOwned) {
                // White: Already owned
                textColor = "#ffffff";
                descriptionColor = "#cccccc";
                priceColor = "#ffffff";
            } else if (this.gameState.currency < item.price) {
                // Yellow: Can't afford (insufficient currency)
                textColor = "#ffff00";
                descriptionColor = "#cccc88";
                priceColor = "#ffff00";
            } else if (hasUnmetPrerequisites) {
                // Gray: Prerequisites not met
                textColor = "#666666";
                descriptionColor = "#555555";
                priceColor = "#666666";
            } else {
                // Fallback gray for other reasons
                textColor = "#666666";
                descriptionColor = "#555555";
                priceColor = "#666666";
            }
        }

        // Item name
        this.ctx.fillStyle = textColor;
        this.ctx.font = '700 14px Orbitron, "Courier New", monospace';
        this.ctx.textAlign = "left";
        this.ctx.fillText(item.name, startX + 30, startY + 20);

        // Item description with dependencies combined (two lines max)
        this.ctx.fillStyle = descriptionColor;
        this.ctx.font = '400 12px Orbitron, "Courier New", monospace';

        if (item.dependencies.length > 0) {
            // Combine description and dependencies on second line
            const depText = `Requires: ${item.dependencies.join(", ")}`;
            this.ctx.fillText(depText, startX + 30, startY + 35);
        } else {
            // Just description if no dependencies
            this.ctx.fillText(item.description, startX + 30, startY + 35);
        }

        // Price
        this.ctx.fillStyle = priceColor;
        this.ctx.font = '700 14px Orbitron, "Courier New", monospace';
        this.ctx.textAlign = "right";
        this.ctx.fillText(
            `${item.price} ${CURRENCY.SYMBOL}`,
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
                    "Can't afford 💔",
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
        panelHeight: number,
        isSelected: boolean = false
    ): void {
        const buttonWidth = 150;
        const buttonHeight = 30;
        const buttonX = panelX + panelWidth - buttonWidth - 20;
        const buttonY = panelY + panelHeight - buttonHeight - 20;

        // Button background
        this.ctx.fillStyle = isSelected ? "#005588" : "#003366";
        this.ctx.strokeStyle = isSelected ? "#ffffff" : "#00ffff";
        this.ctx.lineWidth = isSelected ? 2 : 1;
        this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
        this.ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);

        // Button text
        this.ctx.fillStyle = isSelected ? "#ffffff" : "#00ffff";
        this.ctx.font = '700 14px Orbitron, "Courier New", monospace';
        this.ctx.textAlign = "center";
        this.ctx.fillText(
            "Done Shopping",
            buttonX + buttonWidth / 2,
            buttonY + buttonHeight / 2 + 5
        );
    }
}
