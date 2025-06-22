import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { Game } from "./Game";

// Mock external dependencies
vi.mock("~/audio/AudioManager");
vi.mock("~/input/InputManager");
vi.mock("~/render/ParticleSystem");
vi.mock("~/display/CanvasManager");
vi.mock("~/menu/MenuManager");
vi.mock("~/animations/LevelCompleteAnimation");
vi.mock("~/ui/ZoneChoiceScreen");
vi.mock("~/ui/HUDRenderer");
vi.mock("~/utils/ScaleManager");
vi.mock("./EntityManager");
vi.mock("./WeaponSystem");
vi.mock("./ShieldSystem");
vi.mock("./CollisionSystem");
vi.mock("./GiftSystem");
vi.mock("./InputHandler");
vi.mock("./AISystem");
vi.mock("./MessageSystem");
vi.mock("./DebugRenderer");
vi.mock("./ZoneSystem");
vi.mock("./NebulaSystem");

describe("Game - Screenshot Functionality", () => {
    let game: Game;
    let mockCanvas: HTMLCanvasElement;
    let mockCtx: CanvasRenderingContext2D;

    beforeEach(() => {
        // Create mock canvas with toDataURL method
        mockCanvas = {
            width: 800,
            height: 600,
            toDataURL: vi
                .fn()
                .mockReturnValue("data:image/png;base64,mockImageData"),
        } as unknown as HTMLCanvasElement;

        // Create mock context
        mockCtx = {
            fillStyle: "",
            fillRect: vi.fn(),
            clearRect: vi.fn(),
            drawImage: vi.fn(),
        } as unknown as CanvasRenderingContext2D;

        // Create game instance
        game = new Game(mockCanvas, mockCtx);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("captureScreenshot", () => {
        it("should capture canvas as PNG data URL", () => {
            const screenshotData = game.captureScreenshot();

            expect(mockCanvas.toDataURL).toHaveBeenCalledWith("image/png");
            expect(screenshotData).toBe("data:image/png;base64,mockImageData");
        });

        it("should support different image formats", () => {
            game.captureScreenshot("image/jpeg");

            expect(mockCanvas.toDataURL).toHaveBeenCalledWith("image/jpeg");
        });

        it("should support quality parameter for JPEG", () => {
            game.captureScreenshot("image/jpeg", 0.8);

            expect(mockCanvas.toDataURL).toHaveBeenCalledWith(
                "image/jpeg",
                0.8
            );
        });

        it("should default to PNG format when no format specified", () => {
            game.captureScreenshot();

            expect(mockCanvas.toDataURL).toHaveBeenCalledWith("image/png");
        });
    });

    describe("downloadScreenshot", () => {
        let mockLink: Partial<HTMLAnchorElement>;
        let createElementSpy: vi.SpyInstance;
        let bodyAppendChildSpy: vi.SpyInstance;
        let bodyRemoveChildSpy: vi.SpyInstance;

        beforeEach(() => {
            // Mock link element
            mockLink = {
                download: "",
                href: "",
                click: vi.fn(),
                style: {},
            };

            // Mock document.createElement
            createElementSpy = vi
                .spyOn(document, "createElement")
                .mockReturnValue(mockLink as HTMLAnchorElement);

            // Mock document.body.appendChild and removeChild
            bodyAppendChildSpy = vi
                .spyOn(document.body, "appendChild")
                .mockImplementation(() => mockLink as Node);
            bodyRemoveChildSpy = vi
                .spyOn(document.body, "removeChild")
                .mockImplementation(() => mockLink as Node);
        });

        it("should create download link with default filename", () => {
            game.downloadScreenshot();

            expect(createElementSpy).toHaveBeenCalledWith("a");
            expect(mockLink.download).toMatch(/blasteroids-.*\.png$/);
            expect(mockLink.href).toBe("data:image/png;base64,mockImageData");
            expect(mockLink.click).toHaveBeenCalled();
            expect(bodyAppendChildSpy).toHaveBeenCalled();
            expect(bodyRemoveChildSpy).toHaveBeenCalled();
        });

        it("should use custom filename when provided", () => {
            game.downloadScreenshot("custom-screenshot.png");

            expect(mockLink.download).toBe("custom-screenshot.png");
            expect(mockLink.click).toHaveBeenCalled();
        });

        it("should handle JPEG format downloads", () => {
            mockCanvas.toDataURL = vi
                .fn()
                .mockReturnValue("data:image/jpeg;base64,mockJpegData");

            game.downloadScreenshot(undefined, "image/jpeg");

            expect(mockLink.download).toMatch(/blasteroids-.*\.jpg$/);
            expect(mockLink.href).toBe("data:image/jpeg;base64,mockJpegData");
        });

        it("should set link display to none", () => {
            game.downloadScreenshot();

            expect(mockLink.style).toEqual({ display: "none" });
        });
    });

    describe("generateTimestamp", () => {
        it("should generate timestamp in YYYY-MM-DD-HH-MM-SS format", () => {
            const timestamp = game.generateTimestamp();

            expect(timestamp).toMatch(/\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}/);
            expect(timestamp).toHaveLength(19); // YYYY-MM-DD-HH-MM-SS
        });

        it("should pad single digit numbers with zero", () => {
            // Mock Date to return date with single digit values
            const mockDate = new Date("2023-01-05T09:08:07.123Z");
            vi.spyOn(global, "Date").mockImplementation(() => mockDate);

            const timestamp = game.generateTimestamp();

            expect(timestamp).toMatch(/\d{4}-01-05-\d{2}-\d{2}-\d{2}/);
        });
    });

    describe("handleScreenshotInput", () => {
        it("should capture and download screenshot when called", () => {
            const captureScreenshotSpy = vi.spyOn(game, "captureScreenshot");
            const downloadScreenshotSpy = vi.spyOn(game, "downloadScreenshot");

            game.handleScreenshotInput();

            expect(captureScreenshotSpy).toHaveBeenCalled();
            expect(downloadScreenshotSpy).toHaveBeenCalled();
        });

        it("should use PNG format by default", () => {
            const downloadScreenshotSpy = vi.spyOn(game, "downloadScreenshot");

            game.handleScreenshotInput();

            expect(downloadScreenshotSpy).toHaveBeenCalledWith(
                undefined,
                "image/png"
            );
        });
    });

    describe("Error Handling", () => {
        it("should handle canvas.toDataURL errors gracefully", () => {
            mockCanvas.toDataURL = vi.fn().mockImplementation(() => {
                throw new Error("Canvas tainted");
            });

            expect(() => game.captureScreenshot()).toThrow("Canvas tainted");
        });

        it("should handle download errors gracefully", () => {
            const mockLinkError: Partial<HTMLAnchorElement> = {
                download: "",
                href: "",
                click: vi.fn().mockImplementation(() => {
                    throw new Error("Download failed");
                }),
                style: {},
            };
            const consoleSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});

            vi.spyOn(document, "createElement").mockReturnValue(
                mockLinkError as HTMLAnchorElement
            );

            // Should not throw but log error
            expect(() => game.downloadScreenshot()).not.toThrow();

            consoleSpy.mockRestore();
        });
    });
});
