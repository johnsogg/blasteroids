import { Vector2 } from "~/utils/Vector2";
import { MESSAGE } from "~/config/constants";
import type { Message, MessageConfig } from "~/entities/Message";
import { calculateMessagePositions } from "~/entities/Message";

/**
 * Manages animated text messages displayed during gameplay
 */
export class MessageSystem {
    private activeMessages: Message[] = [];
    private nextMessageId = 0;

    /**
     * 200 irreverent asteroid collision messages as requested
     */
    private static readonly ASTEROID_COLLISION_MESSAGES = [
        "Bonk!",
        "Where'd that rock come from?",
        "It came... from behind!",
        "Oops!",
        "CLANG!",
        "Well, that hurt!",
        "Space debris!",
        "Doh!",
        "Ouch!",
        "Thud!",
        "BANG!",
        "Smack!",
        "That's gonna leave a mark!",
        "Asteroid: 1, Ship: 0",
        "Not again!",
        "Seriously?",
        "Space rocks are jerks!",
        "Boom goes the asteroid!",
        "Impact!",
        "Whack!",
        "Rock, meet ship!",
        "Ship sandwich!",
        "Oof!",
        "That stung!",
        "Asteroid sneak attack!",
        "Rocks fall, ship hurts!",
        "Surprise!",
        "Gotcha!",
        "Sneaky space rock!",
        "Space pebble of doom!",
        "Rocky road ahead!",
        "Asteroid bowling!",
        "Strike!",
        "Incoming!",
        "Duck!",
        "Bonk goes the ship!",
        "Space collision!",
        "Asteroid tag!",
        "You're it!",
        "Rock paper scissors... rock wins!",
        "Sticks and stones!",
        "Hard knocks in space!",
        "Asteroid parking violation!",
        "No parking zone!",
        "Space fender bender!",
        "Insurance claim incoming!",
        "That'll buff out!",
        "Just a scratch!",
        "Tis but a flesh wound!",
        "Walk it off!",
        "Rub some dirt on it!",
        "Asteroid therapy session!",
        "Rock solid hit!",
        "Stone cold impact!",
        "Between a rock and a hard place!",
        "Rock bottom!",
        "Rolling stone gathers no moss!",
        "Rock on!",
        "Granite you didn't see that coming!",
        "Marble-ous collision!",
        "Sedimentary my dear Watson!",
        "Igneous you were in trouble!",
        "Metamorphic mishap!",
        "Geology rocks!",
        "Take it for granite!",
        "Gneiss impact!",
        "Schist happens!",
        "That rocks!",
        "Stone me!",
        "Hard rock cafe!",
        "Rock and roll!",
        "Living on the edge!",
        "Don't take me for granite!",
        "Rock your world!",
        "Stone cold stunner!",
        "Rock solid mistake!",
        "Hard place, meet rock!",
        "Bedrock bottom!",
        "Quarry you looking at?",
        "Slate me, that hurt!",
        "Shale we try again?",
        "Coal on, really?",
        "Diamond in the rough!",
        "Emerald alert!",
        "Ruby red impact!",
        "Sapphire surprise!",
        "Opal-y cow!",
        "Jasper jeepers!",
        "Agate-a be kidding me!",
        "Onyx-pected visitor!",
        "Turquoise trouble!",
        "Malachite mayhem!",
        "Hematite headache!",
        "Quartz quarter collision!",
        "Feldspar farewell!",
        "Mica-nical malfunction!",
        "Calcite catastrophe!",
        "Gypsum gyration!",
        "Pyrite pirate attack!",
        "Fool's gold, real pain!",
        "Crystal clear mistake!",
        "Mineral mischief!",
        "Ore-some impact!",
        "Vein attempt at dodging!",
        "Lode of trouble!",
        "Prospector's nightmare!",
        "Mining for trouble!",
        "Dig this disaster!",
        "Cave-in coming!",
        "Tunnel vision!",
        "Underground uprising!",
        "Surface tension!",
        "Pressure point!",
        "Fault line failure!",
        "Seismic shock!",
        "Tectonic trouble!",
        "Plate tectonics!",
        "Continental drift!",
        "Pangaea problems!",
        "Supercontinent smash!",
        "Volcanic violence!",
        "Magma mayhem!",
        "Lava-ly collision!",
        "Molten madness!",
        "Igneous ignorance!",
        "Plutonic problems!",
        "Intrusive impact!",
        "Extrusive explosion!",
        "Basalt basic mistake!",
        "Granite granted!",
        "Pumice problems!",
        "Obsidian obstacle!",
        "Andesite anxiety!",
        "Rhyolite riot!",
        "Dacite disaster!",
        "Tuff times!",
        "Breccia breakdown!",
        "Conglomerate chaos!",
        "Sandstone smash!",
        "Limestone limit!",
        "Marble madness!",
        "Slate state!",
        "Shale shock!",
        "Quartzite quandary!",
        "Phyllite fiasco!",
        "Schist show!",
        "Gneiss going!",
        "Amphibolite ambush!",
        "Eclogite emergency!",
        "Migmatite mishap!",
        "Hornfels horror!",
        "Contact catastrophe!",
        "Regional riot!",
        "Dynamic disaster!",
        "Thermal therapy!",
        "Burial blues!",
        "Retrograde regression!",
        "Prograde problems!",
        "Index insight!",
        "Zone zoning out!",
        "Facies face-off!",
        "Blueschist blues!",
        "Greenschist grief!",
        "Amphibolite anguish!",
        "Granulite groaning!",
        "Eclogite emergency exit!",
        "Prehnite problems!",
        "Pumpellyite pain!",
        "Lawsonite lawsuit!",
        "Jadeite justice!",
        "Omphacite oops!",
        "Garnet garnish!",
        "Staurolite stunning!",
        "Andalusite announcement!",
        "Sillimanite silliness!",
        "Kyanite knight!",
        "Cordierite coordination!",
        "Spinel spin!",
        "Corundum conundrum!",
        "Chrysoberyl crisis!",
        "Beryl burial!",
        "Topaz top tier!",
        "Tourmaline tourism!",
        "Spodumene special!",
        "Kunzite kinetic!",
        "Hiddenite hiding!",
        "Peridot period!",
        "Olivine online!",
        "Pyroxene problems!",
        "Augite august!",
        "Diopside discussion!",
        "Enstatite ending!",
        "Hypersthene hyper!",
        "Pigeonite pecking!",
        "Aegirine agreeing!",
        "Jadeite jading!",
        "Spodumene spending!",
        "Hornblende horrible!",
        "Actinolite acting!",
        "Tremolite trembling!",
        "Anthophyllite anthem!",
        "Cummingtonite coming!",
        "Gedrite getting!",
        "Glaucophane glowing!",
        "Riebeckite ribbing!",
        "Crossite crossing!",
        "Katophorite katoring!",
        "Richterite riching!",
        "Winchite winning!",
        "Barroisite barring!",
        "Hastingsite hasting!",
        "Kaersutite kaering!",
        "Taramite taraming!",
        "Magnesio-hornblende magnifying!",
        "Ferro-hornblende ferrying!",
        "Tschermakite scheming!",
        "Edenite editing!",
        "Pargasite parsing!",
    ];

    /**
     * Create a new animated message
     */
    createMessage(config: MessageConfig): void {
        const {
            text,
            shipPosition,
            canvasWidth,
            canvasHeight,
            messageType = "generic",
            duration = MESSAGE.DEFAULT_DURATION,
        } = config;

        // Calculate start and end positions
        const positions = calculateMessagePositions(
            shipPosition,
            canvasWidth,
            canvasHeight,
            20 // Ship diameter estimate
        );

        const message: Message = {
            text,
            startPosition: positions.start,
            endPosition: positions.end,
            currentPosition: positions.start.copy(),
            startTime: performance.now(),
            duration,
            currentScale: MESSAGE.SCALE_START,
            currentOpacity: MESSAGE.OPACITY_START,
            currentHue: Math.random() * 360, // Random starting hue
            messageType,
            id: `msg_${this.nextMessageId++}`,
        };

        this.activeMessages.push(message);
    }

    /**
     * Create a gift collection message
     */
    createGiftMessage(
        giftType: string,
        shipPosition: Vector2,
        canvasWidth: number,
        canvasHeight: number
    ): void {
        const friendlyNames: Record<string, string> = {
            fuel_refill: "Fuel Refill: Tank Full!",
            extra_life: "Extra Life: +1 Life!",
            weapon_bullets: "Bullets: Basic Pew Pew!",
            weapon_missiles: "Missiles: Big Boom!",
            weapon_laser: "Laser: Continuous Zap!",
            weapon_lightning: "Lightning: Chain Zap!",
            upgrade_bullets_fire_rate: "Bullets: Fire Rate +25%!",
            upgrade_bullets_size: "Bullets: Size +50%!",
            upgrade_missiles_speed: "Missiles: Speed +50%!",
            upgrade_missiles_fire_rate: "Missiles: Fire Rate +50%!",
            upgrade_missiles_homing: "Missiles: Homing Enabled!",
            upgrade_laser_range: "Laser: Range +50%!",
            upgrade_laser_efficiency: "Laser: Efficiency +50%!",
            upgrade_lightning_radius: "Lightning: Radius +20%!",
            upgrade_lightning_chain: "Lightning: Chain Lightning!",
            ai_companion: "AI Companion: Helper Acquired!",
        };

        const displayText = friendlyNames[giftType] || `Gift: ${giftType}`;

        this.createMessage({
            text: displayText,
            shipPosition,
            canvasWidth,
            canvasHeight,
            messageType: "gift_collected",
        });
    }

    /**
     * Create an asteroid collision message with random irreverent text
     */
    createAsteroidCollisionMessage(
        shipPosition: Vector2,
        canvasWidth: number,
        canvasHeight: number
    ): void {
        const randomMessage =
            MessageSystem.ASTEROID_COLLISION_MESSAGES[
                Math.floor(
                    Math.random() *
                        MessageSystem.ASTEROID_COLLISION_MESSAGES.length
                )
            ];

        this.createMessage({
            text: randomMessage,
            shipPosition,
            canvasWidth,
            canvasHeight,
            messageType: "asteroid_collision",
        });
    }

    /**
     * Create a bonus timer expiration message
     */
    createBonusTimerExpiredMessage(
        shipPosition: Vector2,
        canvasWidth: number,
        canvasHeight: number
    ): void {
        this.createMessage({
            text: "Bonus Timer Done",
            shipPosition,
            canvasWidth,
            canvasHeight,
            messageType: "bonus_timer_expired",
        });
    }

    /**
     * Update all active messages
     */
    update(currentTime: number): void {
        // Update each message's animation state
        for (const message of this.activeMessages) {
            const elapsed = currentTime - message.startTime;
            const progress = Math.min(elapsed / message.duration, 1.0);

            // Update position (linear interpolation)
            const deltaPosition = message.endPosition.subtract(
                message.startPosition
            );
            message.currentPosition = message.startPosition.add(
                deltaPosition.multiply(progress)
            );

            // Update scale (linear interpolation)
            const deltaScale = MESSAGE.SCALE_END - MESSAGE.SCALE_START;
            message.currentScale = MESSAGE.SCALE_START + deltaScale * progress;

            // Update opacity (linear interpolation)
            const deltaOpacity = MESSAGE.OPACITY_END - MESSAGE.OPACITY_START;
            message.currentOpacity =
                MESSAGE.OPACITY_START + deltaOpacity * progress;

            // Update hue for rainbow effect (continuous cycling)
            const hueSpeed = 360 / (MESSAGE.HUE_CYCLE_SPEED * 1000); // degrees per millisecond
            message.currentHue = (message.currentHue + hueSpeed * 16.67) % 360; // Assuming ~60fps
        }

        // Remove expired messages
        this.activeMessages = this.activeMessages.filter(
            (message) => currentTime - message.startTime < message.duration
        );
    }

    /**
     * Get all active messages for rendering
     */
    getActiveMessages(): readonly Message[] {
        return this.activeMessages;
    }

    /**
     * Get the number of active messages
     */
    getActiveMessageCount(): number {
        return this.activeMessages.length;
    }

    /**
     * Clear all active messages (for game reset)
     */
    clearAllMessages(): void {
        this.activeMessages = [];
    }

    /**
     * Get message statistics
     */
    getMessageStats(): {
        active: number;
        giftMessages: number;
        asteroidMessages: number;
        bonusMessages: number;
        genericMessages: number;
    } {
        return {
            active: this.activeMessages.length,
            giftMessages: this.activeMessages.filter(
                (m) => m.messageType === "gift_collected"
            ).length,
            asteroidMessages: this.activeMessages.filter(
                (m) => m.messageType === "asteroid_collision"
            ).length,
            bonusMessages: this.activeMessages.filter(
                (m) => m.messageType === "bonus_timer_expired"
            ).length,
            genericMessages: this.activeMessages.filter(
                (m) => m.messageType === "generic"
            ).length,
        };
    }
}
