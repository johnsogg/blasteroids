# Blasteroids Development TODO

### 🎨 Visual & Audio Polish

- [ ] Implement ship trails/afterimage effect

### 🎮 Gameplay Features

- [x] Allow the game area to take on different geometries:
    - [x] Arbitrary width/height
    - [x] Full window width or height
    - [x] Largest size that fits in window to match some aspect ratio
- [x] Weapon mechanics: different weapons, each with their own upgrades
    - [x] Weapons the player has acquired can be activated with a number key
    - [x] Each weapon has an icon that is about the same size as the player ship, the details will be designed later. For now use simple shapes to differentiate them.
    - [x] Acquired weapon icons appear on the left side of the screen - there are spots reserved for each one, so if the user has weapons 1 and 3, there are gaps where 2 and 4 would go
    - [x] The weapon icon appears inside Gifts that are currently on the board
    - [x] Default weapon (Bullets)
        - [x] Keyboard shortcut: 1
        - [x] Modify this to consume a very small amount of fuel - I will tweak the value in the constants file
        - [x] Gift Upgrade: 25% faster fire rate
        - [x] Gift Upgrade: 50% larger bullets (for more advantageous collision zone)
    - [x] Missiles
        - [x] Keyboard shortcut: 2
        - [x] They explode if an object other than the ship is within N pixels of missile
        - [x] Slow rate of fire, 1 per 4 seconds
        - [x] Each shot consumes some fuel
        - [ ] Gift Upgrade: 50% faster missile travel speed
        - [ ] Gift Upgrade: 50% faster rate of fire
        - [ ] Gift Upgrade: missiles can adjust their trajectory if they see an object in a truncated viewing cone in front of them
        - [ ] Polish: Missiles should automatically explode after some period of time
        - [ ] Polish: Add sound effect when attempting to fire missile but still on cooldown
        - [ ] Polish: Improve missile visual - thin shape pointing in travel direction with small flame thruster and trail
        - [ ] Polish: Missile should accelerate like a real missile (not constant velocity)
    - [ ] Lasers!
        - [ ] Keyboard shortcut: 3
        - [ ] Firing emits a solid beam, like a laser sword, but it is not very long
        - [ ] It drains fuel quickly
        - [ ] Gift Upgrade: 50% longer ranger
        - [ ] Gift Upgrade: 50% more efficient fuel usage
    - [ ] Lightning
        - [ ] Keyboard shortcut: 4
        - [ ] An electrical arc will zap the nearest object in a circle around the ship
        - [ ] Consumes fuel
        - [ ] The radius is small
        - [ ] Gift Upgrade: 20% larger radius
        - [ ] Gift Upgrade: After striking an object, another arc will be emitted from the first object to another object, using the same rules
        - [ ] The player ship can not be struck by lightning, but other things like Gifts will be targeted
- [x] Add gift benefits system
    - [x] Each gift's warp bubble will have a subtly different animation and color
    - [x] Gifts have different probabilities of appearing, and those probabilities can be influenced by the game state
    - [x] Gifts to implement include:
        - [x] Fuel refill
        - [x] Extra life
        - [x] Weapon upgrades
- [ ] Add extra life bonus at certain score thresholds
- [ ] Implement UFO enemy ships (original Asteroids feature)
- [ ] Add power-ups or weapon variants

### 🔧 Technical Improvements

- [ ] Add unit tests for physics and collision systems
- [ ] Performance optimizations for large numbers of objects
- [x] Constants should be symbols (not literals) and coded as config objects

## Known Bugs
