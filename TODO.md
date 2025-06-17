# Blasteroids Development TODO

### 🎨 Visual & Audio Polish

- [ ] Implement ship trails/afterimage effect

### 🎮 Gameplay Features

- [ ] Allow the game area to take on different geometries:
    - [ ] Arbitrary width/height
    - [ ] Full window width or height
    - [ ] Largest size that fits in window to match some aspect ratio
- [x] When the player beats a level, show an animation to let the user know they're on the next level
- [ ] Weapon mechanics: different weapons, each with their own upgrades
    - [x] Default weapon already implemented
        - [ ] Gift Upgrade: 25% faster fire rate
        - [ ] Gift Upgrade: 50% larger bullets (for more advantageous collision zone)
    - [ ] Missiles
        - [ ] They explode if an object other than the ship is within N pixels of missile
        - [ ] Slow rate of fire, 1 per 4 seconds
        - [ ] Gift Upgrade: 50% faster missile travel speed
        - [ ] Gift Upgrade: 50% faster rate of fire
        - [ ] Gift Upgrade: missiles can adjust their trajectory if they see an object in a truncated viewing cone in front of them
    - [ ] Lasers!
        - [ ] Firing emits a solid beam, like a laser sword, but it is not very long
        - [ ] It drains power (fuel) quickly
        - [ ] Gift Upgrade: 50% longer ranger
        - [ ] Gift Upgrade: 50% more efficient power usage
    - [ ] Lightning
        - [ ] An electrical arc will zap the nearest object in a circle around the ship
        - [ ] The radius is small
        - [ ] Gift Upgrade: 20% larger radius
        - [ ] Gift Upgrade: After striking an object, another arc will be emitted from the first object to another object, using the same rules
        - [ ] The player ship can not be struck by lightning, but other things like Gifts will be targetted
- [ ] Add gift benefits system
    - [ ] Each gift's warp bubble will have a subtly different animation and color
    - [ ] Gifts have different probabilities of appearing, and those probabilities can be influenced by the game state
    - [ ] Gifts to implement include:
        - [ ] Fuel refill
        - [ ] Extra life
        - [ ] Weapon upgrades
- [ ] Add extra life bonus at certain score thresholds
- [ ] Implement UFO enemy ships (original Asteroids feature)
- [ ] Add power-ups or weapon variants

### 🔧 Technical Improvements

- [ ] Add unit tests for physics and collision systems
- [ ] Performance optimizations for large numbers of objects
- [ ] Constants should be symbols (not literals) and coded as config objects

## Known Bugs

- [x] ~~The display text has a strange line rendered on all the zeros but it should not be there~~ ✅ **Fixed:** Removed diagonal line styling from retro-zero CSS class
- [x] ~~The Level Complete display is somewhat illegible if there are rendered objects behind it. The Level Complete display should have a mostly opaque black background. Rendered objects should only slightly be visible behind it.~~ ✅ **Fixed:** Added semi-transparent black background (80% opacity) to level complete animation
- [x] ~~Upon starting a new level, all bullets, warp bubbles, and gifts should be removed. There is no animation or visual effect for them being removed.~~ ✅ **Fixed:** Clean up all non-ship objects when advancing to next level
- [x] ~~After changing display size to Aspect Fit the game loop is frozen~~ ✅ **Fixed:** Added dimension change detection and resize debouncing to prevent infinite ResizeObserver loops
- [x] ~~Level Complete text: Should read (on several lines) "Level N Complete / Bonus: X / Time To Complete: T seconds". Keep the "Press space to continue" as it is.~~ ✅ **Fixed:** Updated level complete animation to show completion time and improved text format
