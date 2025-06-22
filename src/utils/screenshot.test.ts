import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
    generateScreenshotFilename,
    formatTimestamp,
    getFileExtensionFromMimeType,
} from "./screenshot";

describe("Screenshot Utilities", () => {
    beforeEach(() => {
        // Mock Date.now() for consistent testing
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2023-12-25T14:30:45.123Z"));
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    describe("formatTimestamp", () => {
        it("should format date as YYYY-MM-DD-HH-MM-SS", () => {
            const date = new Date("2023-12-25T14:30:45.123Z");
            const formatted = formatTimestamp(date);

            // The format should be consistent regardless of timezone
            expect(formatted).toMatch(/2023-12-25-\d{2}-\d{2}-\d{2}/);
        });

        it("should pad single digits with zeros", () => {
            const date = new Date("2023-01-05T09:08:07.123Z");
            const formatted = formatTimestamp(date);

            expect(formatted).toMatch(/2023-01-05-\d{2}-\d{2}-\d{2}/);
        });

        it("should handle edge case dates", () => {
            const date = new Date("2000-01-01T00:00:00.000Z");
            const formatted = formatTimestamp(date);

            // The exact date/time will depend on timezone, but format should be consistent
            expect(formatted).toMatch(/\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}/);
            expect(formatted).toHaveLength(19); // YYYY-MM-DD-HH-MM-SS = 19 chars
        });
    });

    describe("getFileExtensionFromMimeType", () => {
        it("should return png for image/png", () => {
            expect(getFileExtensionFromMimeType("image/png")).toBe("png");
        });

        it("should return jpg for image/jpeg", () => {
            expect(getFileExtensionFromMimeType("image/jpeg")).toBe("jpg");
        });

        it("should return webp for image/webp", () => {
            expect(getFileExtensionFromMimeType("image/webp")).toBe("webp");
        });

        it("should return png for unknown mime types", () => {
            expect(getFileExtensionFromMimeType("image/unknown")).toBe("png");
            expect(getFileExtensionFromMimeType("text/plain")).toBe("png");
            expect(getFileExtensionFromMimeType("")).toBe("png");
        });

        it("should handle undefined input", () => {
            expect(
                getFileExtensionFromMimeType(undefined as unknown as string)
            ).toBe("png");
        });
    });

    describe("generateScreenshotFilename", () => {
        it("should generate filename with timestamp and PNG extension by default", () => {
            const filename = generateScreenshotFilename();

            expect(filename).toMatch(
                /^blasteroids-2023-12-25-\d{2}-\d{2}-\d{2}\.png$/
            );
        });

        it("should generate filename with JPEG extension", () => {
            const filename = generateScreenshotFilename("image/jpeg");

            expect(filename).toMatch(
                /^blasteroids-2023-12-25-\d{2}-\d{2}-\d{2}\.jpg$/
            );
        });

        it("should generate filename with WebP extension", () => {
            const filename = generateScreenshotFilename("image/webp");

            expect(filename).toMatch(
                /^blasteroids-2023-12-25-\d{2}-\d{2}-\d{2}\.webp$/
            );
        });

        it("should use PNG extension for unknown mime types", () => {
            const filename = generateScreenshotFilename("image/unknown");

            expect(filename).toMatch(
                /^blasteroids-2023-12-25-\d{2}-\d{2}-\d{2}\.png$/
            );
        });

        it("should include score in filename when provided", () => {
            const filename = generateScreenshotFilename("image/png", 1500);

            expect(filename).toMatch(
                /^blasteroids-2023-12-25-\d{2}-\d{2}-\d{2}-score-1500\.png$/
            );
        });

        it("should include level in filename when provided", () => {
            const filename = generateScreenshotFilename(
                "image/png",
                undefined,
                5
            );

            expect(filename).toMatch(
                /^blasteroids-2023-12-25-\d{2}-\d{2}-\d{2}-level-5\.png$/
            );
        });

        it("should include both score and level when both provided", () => {
            const filename = generateScreenshotFilename("image/png", 2500, 7);

            expect(filename).toMatch(
                /^blasteroids-2023-12-25-\d{2}-\d{2}-\d{2}-score-2500-level-7\.png$/
            );
        });

        it("should handle zero values for score and level", () => {
            const filename = generateScreenshotFilename("image/png", 0, 0);

            expect(filename).toMatch(
                /^blasteroids-2023-12-25-\d{2}-\d{2}-\d{2}-score-0-level-0\.png$/
            );
        });

        it("should generate unique filenames for different timestamps", () => {
            const filename1 = generateScreenshotFilename();

            // Advance time by 1 second
            vi.advanceTimersByTime(1000);

            const filename2 = generateScreenshotFilename();

            expect(filename1).not.toBe(filename2);
        });
    });
});
