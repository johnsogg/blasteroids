# Manual Test: Debug Zone Persistence After Restart/Death

## Bug Description
When using "Load Zone" from the debug menu to load Zone 2, the game correctly switches to Zone 2. However, when the player dies and restarts (presses 'R'), the game incorrectly resets to Zone 1 Level 1 instead of preserving the debug zone selection.

## Expected Behavior
After selecting "Load Zone 2" from debug menu and then dying/restarting, the game should remain in Zone 2 Level 1.

## Test Procedure

### Setup
1. Start the game (`npm run dev`)
2. Press `Escape` to open the debug menu

### Test Steps
1. **Load Debug Zone**:
   - In the debug menu, find "Load Zone" dropdown
   - Select "Zone 2" from the dropdown
   - Verify the game immediately switches to Zone 2 (nebula effects should be visible)
   - Note the HUD shows "Zone 2-1" at bottom left

2. **Play Until Death**:
   - Close the debug menu (press `Escape`)
   - Play the game until you lose all lives and get a "Game Over" screen
   - Alternatively, you can debug-spawn many asteroids to make death faster

3. **Restart Game**:
   - Press 'R' to restart the game
   - **CRITICAL CHECK**: Verify the game starts in Zone 2 Level 1, NOT Zone 1 Level 1
   - Confirm nebula effects are present (indicating Zone 2)
   - Confirm HUD shows "Zone 2-1" at bottom left

### Expected Results
- ✅ After restart, game should be in Zone 2 Level 1
- ✅ Nebula effects should be visible immediately (no flicker to Zone 1)
- ✅ HUD should show "Zone 2-1" 
- ✅ No brief flash of Zone 1 before switching to Zone 2

### Failure Indicators (Fixed by this commit)
- ❌ Game starts in Zone 1 after restart
- ❌ Brief flash of Zone 1 before switching to Zone 2
- ❌ HUD briefly shows "Zone 1-1" before changing to "Zone 2-1"

## Additional Test Cases

### Test with Different Zones
1. Repeat the test with Zone 3 (should have different mechanics)
2. Verify Zone 1 works correctly when no debug zone is set

### Test Zone Clearing
1. Load Zone 2, then change debug dropdown back to "Current"
2. Die and restart - should go back to Zone 1 normal progression

## Implementation Details
The fix modifies `Game.restart()` to:
1. Check for debug zone preference from localStorage before resetting
2. Immediately apply debug zone after `gameState.reset()` 
3. Initialize systems with the correct zone from the start

This eliminates the delay and flickering that occurred with the previous setTimeout-based approach.