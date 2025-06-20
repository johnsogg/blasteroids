// Test setup file for Vitest
import { vi, beforeEach } from "vitest";

// Mock requestAnimationFrame for testing
global.requestAnimationFrame = vi.fn((callback) => {
    return setTimeout(callback, 16) as unknown as number; // ~60fps
});

global.cancelAnimationFrame = vi.fn((id) => {
    clearTimeout(id);
});

// Mock performance.now for consistent timing in tests
const mockNow = vi.fn(() => 0);
global.performance = {
    ...global.performance,
    now: mockNow,
};

// Reset performance.now mock before each test
beforeEach(() => {
    mockNow.mockReturnValue(0);
});

// Helper to advance time in tests
export const advanceTime = (ms: number) => {
    const currentTime = mockNow.getMockImplementation()?.() || 0;
    mockNow.mockReturnValue(currentTime + ms);
};
