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

- [x] Shields: the ship does not slow down when the shield is engaged. It should
      slow down at a configurable rate. This is similar to the "friction" idea.
      Maybe we just temporarily modulate that value?
      **FIXED**: Applied shield slowdown to both thrust power and friction in InputHandler
- [x] Shields: After colliding with an asteroid, the ships bounce (correct) and
      the shield goes into recharging mode (also correct), but it does not come
      out of recharging mode after 10 seconds.
      **FIXED**: Resolved timing mismatch between Date.now() and performance.now()
- [x] Shields: if the shields are engaged but still recharging, the ship can
      pass right through asteroids without harm or bounce. When the shields are
      recharging, they are ineffective and the ship will be destroyed if it
      collides with an asteroid.
      **FIXED**: CollisionSystem now checks both isShieldActive() AND !isShieldRecharging()
- [ ] Lightning weapon: it no longer destroys asteroids. It does fire and the
      A/V effects work, but it doesn't remove asteroids.
