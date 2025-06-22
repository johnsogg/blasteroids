/**
 * Screenshot utility functions for Blasteroids game
 */

/**
 * Format a Date object as YYYY-MM-DD-HH-MM-SS timestamp
 */
export function formatTimestamp(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
}

/**
 * Get file extension from MIME type
 */
export function getFileExtensionFromMimeType(mimeType: string): string {
    switch (mimeType) {
        case "image/png":
            return "png";
        case "image/jpeg":
            return "jpg";
        case "image/webp":
            return "webp";
        default:
            return "png"; // Default to PNG
    }
}

/**
 * Generate a screenshot filename with timestamp and optional game info
 */
export function generateScreenshotFilename(
    mimeType: string = "image/png",
    score?: number,
    level?: number
): string {
    const timestamp = formatTimestamp(new Date());
    const extension = getFileExtensionFromMimeType(mimeType);

    let filename = `blasteroids-${timestamp}`;

    // Add score if provided
    if (score !== undefined) {
        filename += `-score-${score}`;
    }

    // Add level if provided
    if (level !== undefined) {
        filename += `-level-${level}`;
    }

    return `${filename}.${extension}`;
}
