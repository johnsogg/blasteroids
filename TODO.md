# Blasteroids Development TODO

### 🎨 Visual & Audio Polish

- [ ] Implement ship trails/afterimage effect

### 🎮 Gameplay Features

- [x] Weapon mechanics: different weapons, each with their own upgrades
    - [x] Weapons the player has acquired can be activated with a number key
    - [x] Each weapon has an icon that is about the same size as the player ship, the details will be designed later. For now use simple shapes to differentiate them.
    - [x] Acquired weapon icons appear on the left side of the screen - there are spots reserved for each one, so if the user has weapons 1 and 3, there are gaps where 2 and 4 would go
    - [x] The weapon icon appears inside Gifts that are currently on the board
    - [x] Default weapon (Bullets)
        - [x] Keyboard shortcut: 1
        - [x] Modify this to consume a very small amount of fuel - I will tweak the value in the constants file
        - [x] Gift Upgrade: 25% faster fire rate + 40% longer range
        - [x] Gift Upgrade: 50% larger bullets + 40% longer range
        - [x] Rebalanced for early game challenge:
            - [x] 25% slower initial fire rate (150ms → 187ms)
            - [x] 50% shorter initial range (3s → 1.5s lifespan)
            - [x] 3-bullet burst limit per key activation
    - [x] Missiles
        - [x] Keyboard shortcut: 2
        - [x] They explode if an object other than the ship is within N pixels of missile
        - [x] Slow rate of fire, 1 per 4 seconds
        - [x] Each shot consumes some fuel
        - [x] Gift Upgrade: 50% faster missile travel speed
        - [x] Gift Upgrade: 50% faster rate of fire
        - [x] Gift Upgrade: missiles can adjust their trajectory if they see an object in a truncated viewing cone in front of them
            - [x] 100-pixel homing range with 60-degree viewing cone
            - [x] Gradual trajectory adjustment (realistic turn rate, not instant lock-on)
            - [x] Maintains missile speed while adjusting direction
        - [x] Polish: Missiles should automatically explode after some period of time
            - [x] 3-second timer with explosion particles and asteroid destruction
        - [x] Polish: Add sound effect when attempting to fire missile but still on cooldown
            - [x] Three descending error beeps (800→600→400Hz) for cooldown attempts
            - [x] Deep "BOOM" + intense whoosh sound for successful missile firing
            - [x] Completely distinct audio feedback - impossible to confuse
        - [x] Polish: Improve missile visual - thin shape pointing in travel direction with small flame thruster and trail
            - [x] Sleek aerodynamic missile body with pointed nose and guidance fins
            - [x] Dynamic flame trails with randomized lengths
            - [x] Particle trail system following missile flight path
        - [x] Polish: Missile should accelerate like a real missile (not constant velocity)
            - [x] Starts at 100 px/s, accelerates at 150 px/s² to 300 px/s max speed
            - [x] Speed upgrade affects maximum velocity (450 px/s with upgrade)
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
- [x] Fuel refill on ship respawn (when using extra life)
- [ ] Add extra life bonus at certain score thresholds
- [ ] Implement UFO enemy ships (original Asteroids feature)
- [ ] Add power-ups or weapon variants

### 🔧 Technical Improvements

- [ ] Add unit tests for physics and collision systems
- [ ] Performance optimizations for large numbers of objects
- [x] Constants should be symbols (not literals) and coded as config objects
- [x] Robust input context system
    - [x] Input context enum for different game states (GAMEPLAY, MENU, LEVEL_COMPLETE, etc.)
    - [x] Context-aware input handling with permission matrix
    - [x] Input consumption system to prevent input bleeding between contexts
    - [x] Type-safe InputName union type for compile-time validation

### 🛠️ Development & Testing Tools

- [x] Debug gift selector in escape menu
    - [x] Force specific gift types for testing
    - [x] Persistent selection across browser sessions via localStorage
    - [x] Intelligent weapon upgrade redirection (auto-gives weapon if upgrade selected for unowned weapon)
    - [x] Dropdown with all gift types for easy access

## Known Bugs

- [x] ~~On the Level Complete screen, pressing the space key currently causes the ship to fire immediately. We should suppress that behavior so the ship does not fire its weapon when clearing the Level Complete screen.~~ **FIXED** - Implemented robust input context system
