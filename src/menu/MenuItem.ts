export type MenuItemType =
    | "action"
    | "toggle"
    | "select"
    | "range"
    | "separator";

export interface MenuItemConfig {
    id: string;
    label: string;
    type: MenuItemType;
    action?: () => void;
    value?: string | number | boolean;
    options?: Array<{ label: string; value: string | number | boolean }>;
    min?: number;
    max?: number;
    step?: number;
    onChange?: (value: string | number | boolean) => void;
    enabled?: boolean;
}

export class MenuItem {
    public id: string;
    public label: string;
    public type: MenuItemType;
    public action?: () => void;
    public value: string | number | boolean;
    public options: Array<{ label: string; value: string | number | boolean }>;
    public min: number;
    public max: number;
    public step: number;
    public onChange?: (value: string | number | boolean) => void;
    public enabled: boolean;

    constructor(config: MenuItemConfig) {
        this.id = config.id;
        this.label = config.label;
        this.type = config.type;
        this.action = config.action;
        this.value = config.value || "";
        this.options = config.options || [];
        this.min = config.min || 0;
        this.max = config.max || 100;
        this.step = config.step || 1;
        this.onChange = config.onChange;
        this.enabled = config.enabled !== false;
    }

    /**
     * Execute the menu item's action
     */
    execute(): void {
        console.log(
            `MenuItem: execute() called for item "${this.id}" (${this.label})`
        );
        console.log(`MenuItem: enabled=${this.enabled}, type=${this.type}`);

        if (!this.enabled) {
            console.log("MenuItem: Item is disabled, not executing");
            return;
        }

        if (this.action) {
            console.log("MenuItem: Executing action function");
            this.action();
        } else if (this.onChange) {
            console.log("MenuItem: Executing onChange function");
            this.onChange(this.value);
        } else {
            console.log("MenuItem: No action or onChange function defined");
        }
    }

    /**
     * Handle left arrow key (decrease value or previous option)
     */
    handleLeft(): boolean {
        if (!this.enabled) return false;

        switch (this.type) {
            case "toggle":
                this.value = !this.value;
                this.onChange?.(this.value);
                return true;

            case "select":
                if (this.options.length > 0) {
                    const currentIndex = this.options.findIndex(
                        (opt) => opt.value === this.value
                    );
                    const newIndex =
                        currentIndex > 0
                            ? currentIndex - 1
                            : this.options.length - 1;
                    this.value = this.options[newIndex].value;
                    this.onChange?.(this.value);
                    return true;
                }
                break;

            case "range":
                const newValue = Math.max(
                    this.min,
                    (this.value as number) - this.step
                );
                if (newValue !== this.value) {
                    this.value = newValue;
                    this.onChange?.(this.value);
                    return true;
                }
                break;
        }

        return false;
    }

    /**
     * Handle right arrow key (increase value or next option)
     */
    handleRight(): boolean {
        if (!this.enabled) return false;

        switch (this.type) {
            case "toggle":
                this.value = !this.value;
                this.onChange?.(this.value);
                return true;

            case "select":
                if (this.options.length > 0) {
                    const currentIndex = this.options.findIndex(
                        (opt) => opt.value === this.value
                    );
                    const newIndex =
                        currentIndex < this.options.length - 1
                            ? currentIndex + 1
                            : 0;
                    this.value = this.options[newIndex].value;
                    this.onChange?.(this.value);
                    return true;
                }
                break;

            case "range":
                const newValue = Math.min(
                    this.max,
                    (this.value as number) + this.step
                );
                if (newValue !== this.value) {
                    this.value = newValue;
                    this.onChange?.(this.value);
                    return true;
                }
                break;
        }

        return false;
    }

    /**
     * Get display text for the current value
     */
    getDisplayValue(): string {
        switch (this.type) {
            case "toggle":
                return this.value ? "ON" : "OFF";

            case "select":
                const option = this.options.find(
                    (opt) => opt.value === this.value
                );
                return option ? option.label : "Unknown";

            case "range":
                return this.value.toString();

            default:
                return "";
        }
    }

    /**
     * Get the full display text for rendering
     */
    getDisplayText(): string {
        if (this.type === "separator") {
            return "──────────────────────";
        }

        if (this.type === "action") {
            return this.label;
        }

        const valueText = this.getDisplayValue();
        return valueText ? `${this.label}: ${valueText}` : this.label;
    }

    /**
     * Check if this item can be navigated to
     */
    isNavigable(): boolean {
        return this.enabled && this.type !== "separator";
    }

    /**
     * Check if this item can be interacted with (left/right arrows)
     */
    isInteractive(): boolean {
        return (
            this.enabled && ["toggle", "select", "range"].includes(this.type)
        );
    }
}
