# Blasteroids Development TODO

### 🎨 Visual & Audio Polish

### 🎮 Gameplay Features

- [x] When an important event happens, show a temporary message
    - [x] The message is animated and stylized:
        - [x] Render text in animated rainbow colors
        - [x] The text will move slightly while it is shown for a configurable length of time (default = 2 seconds)
        - [x] The initial position of the text should be the ship's current position, and then towards the center of the board by 2 ship's diameters. This is so the text is offset a little bit and won't go offscreen
        - [x] The ending position of the text should be 3 ship's diameters away from its initial position, in the direction of the center of the board
        - [x] The text grows by 50%
        - [x] The text alpha starts at fully opaque and smoothly transitions to fully transparent
    - [x] The important events to show messages for are:
        - [x] Picking up a gift. Text to show is a user-friendly name for the gift and what it does, e.g. "Missile: Speed +50%"
        - [x] Running into an asteroid: use your lingual talents to come up with a list of 200 irreverent statements, like "Bonk!" or "Where'd that rock come from?" or "It came... from behind!"
        - [x] Running out of bonus time, say "Bonus Timer Done"
              **COMPLETED**: Full animated message system implemented with rainbow text, scaling, fading, smart positioning, and 200+ hilarious asteroid collision messages. Integrated with gift collection, asteroid collisions, and bonus timer expiration.

### 🔧 Technical Improvements

- [ ] Debugging utility: press ~ (tilde) to turn on debugging. For now this simply means to draw the collision circles around objects

#### Physics Testing Foundation (for future gravity system)

- [ ] Add physics unit tests as foundation for future gravity system refactor
- [ ] Create baseline physics behavior tests (ship movement, bullet inheritance, collision)
- [ ] Add performance benchmarks for physics calculations with many entities

#### General

- [ ] Performance optimizations for large numbers of objects

## Big New Features

### 🛠️ Development & Testing Tools

## Known Bugs

- [x] Lightning weapon: it no longer destroys asteroids. It does fire and the
      A/V effects work, but it doesn't remove asteroids.
      **FIXED**: Added missing lightning collision detection to CollisionSystem.checkAllCollisions(). The weapon was firing correctly but the collision check was never being called from the main game loop.
