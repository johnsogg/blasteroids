# Blasteroids Development TODO

### 🎨 Visual & Audio Polish

### 🎮 Gameplay Features

### 🔧 Technical Improvements

#### Physics Testing Foundation (for future gravity system)

- [ ] Add physics unit tests as foundation for future gravity system refactor
- [ ] Create baseline physics behavior tests (ship movement, bullet inheritance, collision)
- [ ] Add performance benchmarks for physics calculations with many entities

#### General

- [ ] Performance optimizations for large numbers of objects

## Big New Features

- [ ] Shields! When the user presses S or the Down Arrow it puts a shield around the ship that also slows the ship down.
    - [ ] Keyboard keys S and Down Arrow
    - [ ] Shield is a bright light blue circle where the collision detection circle is
    - [ ] Sound effect is a crackly btzz btzz sound that loops
    - [ ] Shield does not draw power during use
    - [ ] Exception: if the ship collides with an asteroid, it eats up fuel (lots for large asteroids, less for smaller asteroids)
    - [ ] When a shield/asteroid collision happens:
        - [ ] asteroid and ship bounce off each other
        - [ ] it plays an amusing BONK sound
    - [ ] After a collision, the shield is in a "recharging" mode
        - [ ] Recharging mode initially lasts 10 seconds
        - [ ] This will eventually be modifiable via gifts
        - [ ] When the shield is on and recharging, audio effect is a "click click" that does not loop - it only plays when the user first engages it
        - [ ] When the shield is recharging it still slows the ship down when in use (this is also a feature in that you can now stop the ship)
        - [ ] After the recharge is complete and the user is still engaging the shield it automatically flips back to its original state where it deflects asteroids

### 🛠️ Development & Testing Tools

## Known Bugs

- [ ] The lightning weapon no longer destroys asteroids. It does fire and the
      A/V effects work, but it doesn't remove asteroids.
