# Blasteroids Features Checklist

## Core Gameplay

- [✅] **Ship Movement**: Arrow keys/WASD rotate ship left/right
- [✅] **Ship Thrust**: Up arrow/W key makes ship accelerate forward
- [✅] **Ship Physics**: Ship has momentum and continues moving after thrust stops
- [✅] **Ship Friction**: Ship gradually slows down when not thrusting
- [⚠️] **Screen Wrapping**: Ship wraps around screen edges (left to right, top to bottom)

## Shooting System

- [✅] **Bullet Firing**: Spacebar fires bullets from ship nose
- [✅] **Bullet Rate Limit**: Cannot fire faster than 150ms between shots
- [✅] **Bullet Physics**: Bullets inherit ship velocity for realistic ballistics
- [✅] **Bullet Cleanup**: Bullets disappear after 3 seconds or when off-screen

## Asteroid Mechanics

- [✅] **Initial Asteroids**: Game starts with 4 asteroids of various sizes
- [✅] **Asteroid Movement**: Asteroids drift in random directions
- [✅] **Asteroid Rotation**: Asteroids slowly rotate as they move
- [⚠️] **Asteroid Wrapping**: Asteroids wrap around screen edges
- [✅] **Size Variety**: Three distinct asteroid sizes (large/medium/small)
- [✅] **Speed Scaling**: Smaller asteroids move faster than larger ones

## Collision Detection

- [✅] **Bullet-Asteroid**: Bullets destroy asteroids on contact
- [✅] **Ship-Asteroid**: Ship takes damage when hitting asteroids
- [✅] **Asteroid Splitting**: Large asteroids split into 2-3 smaller fragments
- [✅] **Fragment Physics**: Split fragments have random velocities

## Score and Lives System

- [✅] **Score Display**: Score shown in top-left UI
- [✅] **Lives Display**: Lives counter shown in top-left UI
- [✅] **Level Display**: Current level shown in top-left UI
- [✅] **Scoring Values**: Large=20pts, Medium=50pts, Small=100pts
- [✅] **Lives Deduction**: Lose 1 life when ship hits asteroid
- [✅] **Score Updates**: Score increases immediately when asteroid destroyed

## Game States

- [✅] **Game Over**: "GAME OVER" screen appears when lives reach 0
- [✅] **Restart**: Press R to restart game from game over screen
- [?] **Reset State**: Restart resets score, lives, and level to initial values

## Level Progression

- [✅] **Level Completion**: New level starts when all asteroids destroyed
- [✅] **Level Counter**: Level number increases and displays in UI
- [✅] **Asteroid Scaling**: Each level spawns 3 + level number asteroids
- [✅] **Safe Spawning**: New asteroids spawn away from ship position

## Visual Effects

- [✅] **Ship Design**: Ship appears as green triangle pointing forward
- [✅] **Asteroid Design**: Asteroids appear as irregular white polygons
- [✅] **Bullet Design**: Bullets appear as small yellow dots
- [✅] **Thrust Flames**: Orange flames appear behind ship when thrusting
- [✅] **Flame Animation**: Thrust flames flicker with random length

## Invincibility System

- [✅] **Invincible Period**: Ship invincible for 3 seconds after destruction
- [✅] **Visual Feedback**: Ship blinks yellow during invincibility
- [✅] **Phase Effect**: Ship phases in/out during invincible period
- [✅] **Collision Immunity**: No damage taken during invincible period

## Input Responsiveness

- [✅] **Smooth Controls**: All inputs feel responsive without lag
- [✅] **Multi-Key Support**: Can thrust and turn simultaneously
- [✅] **Key Alternatives**: Both arrow keys and WASD work for movement

## Performance

- [✅] **Smooth Animation**: Game runs at consistent 60 FPS
- [?] **No Memory Leaks**: Game can run for extended periods
- [✅] **Collision Performance**: No lag with many objects on screen

---

## Instructions for Testing

1. Go through each feature one by one
2. Test thoroughly by playing the game
3. Mark items as ✅ (working) or ❌ (broken) or ⚠️ (partially working)
4. Add notes for any issues found
5. Report any missing features or unexpected behavior

## Notes Section

_Add any observations, bugs, or suggestions here:_

**Screen wrapping:** When an object's bounding box straddles the edge of the
screen, it should partly appear on the opposite side to give the impression of a
wrap-around world.

**Memory Leaks:** I don't know how to test this. Should I use the browser's
performance tab in the dev tools?

**FIXED:** Screen wrapping now shows objects partially on both sides when crossing boundaries for seamless wrap-around effect.
