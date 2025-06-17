export class AudioManager {
    private audioContext: AudioContext;
    private masterGain: GainNode;

    constructor() {
        // Create audio context - may need user interaction to start
        this.audioContext = new (window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext })
                .webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.setValueAtTime(0.1, this.audioContext.currentTime); // Low volume
        this.masterGain.connect(this.audioContext.destination);
    }

    private async ensureAudioContext(): Promise<void> {
        if (this.audioContext.state === "suspended") {
            await this.audioContext.resume();
        }
    }

    async playShoot(): Promise<void> {
        await this.ensureAudioContext();

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);

        // Sharp, quick laser sound
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(
            400,
            this.audioContext.currentTime + 0.1
        );

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            this.audioContext.currentTime + 0.1
        );

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }

    async playAsteroidHit(): Promise<void> {
        await this.ensureAudioContext();

        // High-pitched rock breaking sound
        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(this.masterGain);

        // Sharp, crackling sound like glass/rock breaking
        oscillator1.frequency.setValueAtTime(
            2000,
            this.audioContext.currentTime
        );
        oscillator1.frequency.exponentialRampToValueAtTime(
            800,
            this.audioContext.currentTime + 0.15
        );

        oscillator2.frequency.setValueAtTime(
            3000,
            this.audioContext.currentTime
        );
        oscillator2.frequency.exponentialRampToValueAtTime(
            1200,
            this.audioContext.currentTime + 0.15
        );

        oscillator1.type = "square";
        oscillator2.type = "sawtooth";

        gainNode.gain.setValueAtTime(0.6, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            this.audioContext.currentTime + 0.15
        );

        oscillator1.start(this.audioContext.currentTime);
        oscillator2.start(this.audioContext.currentTime);
        oscillator1.stop(this.audioContext.currentTime + 0.15);
        oscillator2.stop(this.audioContext.currentTime + 0.15);
    }

    async playAsteroidDestroy(): Promise<void> {
        await this.ensureAudioContext();

        // Distinct high-pitched shatter sound for complete destruction
        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const oscillator3 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        oscillator3.connect(gainNode);
        gainNode.connect(this.masterGain);

        // Distinctive shatter pattern - multiple frequency sweeps
        oscillator1.frequency.setValueAtTime(
            4000,
            this.audioContext.currentTime
        );
        oscillator1.frequency.exponentialRampToValueAtTime(
            200,
            this.audioContext.currentTime + 0.3
        );

        oscillator2.frequency.setValueAtTime(
            2500,
            this.audioContext.currentTime
        );
        oscillator2.frequency.exponentialRampToValueAtTime(
            150,
            this.audioContext.currentTime + 0.3
        );

        oscillator3.frequency.setValueAtTime(
            1800,
            this.audioContext.currentTime
        );
        oscillator3.frequency.exponentialRampToValueAtTime(
            100,
            this.audioContext.currentTime + 0.3
        );

        oscillator1.type = "square";
        oscillator2.type = "sawtooth";
        oscillator3.type = "triangle";

        gainNode.gain.setValueAtTime(0.7, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            this.audioContext.currentTime + 0.3
        );

        oscillator1.start(this.audioContext.currentTime);
        oscillator2.start(this.audioContext.currentTime);
        oscillator3.start(this.audioContext.currentTime);
        oscillator1.stop(this.audioContext.currentTime + 0.3);
        oscillator2.stop(this.audioContext.currentTime + 0.3);
        oscillator3.stop(this.audioContext.currentTime + 0.3);
    }

    async playShipHit(): Promise<void> {
        await this.ensureAudioContext();

        // Dramatic descending tone for ship destruction
        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(this.masterGain);

        // Two oscillators for richer sound
        oscillator1.frequency.setValueAtTime(
            400,
            this.audioContext.currentTime
        );
        oscillator1.frequency.exponentialRampToValueAtTime(
            100,
            this.audioContext.currentTime + 0.8
        );

        oscillator2.frequency.setValueAtTime(
            300,
            this.audioContext.currentTime
        );
        oscillator2.frequency.exponentialRampToValueAtTime(
            80,
            this.audioContext.currentTime + 0.8
        );

        oscillator2.type = "sawtooth";

        gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            this.audioContext.currentTime + 0.8
        );

        oscillator1.start(this.audioContext.currentTime);
        oscillator2.start(this.audioContext.currentTime);
        oscillator1.stop(this.audioContext.currentTime + 0.8);
        oscillator2.stop(this.audioContext.currentTime + 0.8);
    }

    async playThrust(): Promise<void> {
        await this.ensureAudioContext();

        // Generate pink noise for realistic engine sound
        const bufferSize = this.audioContext.sampleRate * 0.2; // 200ms
        const buffer = this.audioContext.createBuffer(
            1,
            bufferSize,
            this.audioContext.sampleRate
        );
        const data = buffer.getChannelData(0);

        // Generate pink noise (1/f noise) - more natural than white noise
        let b0 = 0,
            b1 = 0,
            b2 = 0,
            b3 = 0,
            b4 = 0,
            b5 = 0,
            b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.969 * b2 + white * 0.153852;
            b3 = 0.8665 * b3 + white * 0.3104856;
            b4 = 0.55 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.016898;
            const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            b6 = white * 0.115926;
            data[i] = pink * 0.11; // Scale down the amplitude
        }

        const source = this.audioContext.createBufferSource();
        const filter = this.audioContext.createBiquadFilter();
        const gainNode = this.audioContext.createGain();

        source.buffer = buffer;
        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);

        // Low-pass filter for engine character
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(400, this.audioContext.currentTime);
        filter.Q.setValueAtTime(0.5, this.audioContext.currentTime);

        // Subtle ramp-up effect with increased volume
        gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(
            0.35,
            this.audioContext.currentTime + 0.05
        );
        gainNode.gain.setValueAtTime(0.35, this.audioContext.currentTime + 0.2);

        source.start(this.audioContext.currentTime);
        source.stop(this.audioContext.currentTime + 0.2);
    }

    async playGameOver(): Promise<void> {
        await this.ensureAudioContext();

        // Sad trombone effect - descending notes
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);

        oscillator.type = "triangle"; // Smooth trombone-like tone

        // Classic sad trombone descending pattern
        oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime); // A3
        oscillator.frequency.setValueAtTime(
            196,
            this.audioContext.currentTime + 0.4
        ); // G3
        oscillator.frequency.setValueAtTime(
            175,
            this.audioContext.currentTime + 0.8
        ); // F3
        oscillator.frequency.setValueAtTime(
            147,
            this.audioContext.currentTime + 1.2
        ); // D3

        gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime + 1.0);
        gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            this.audioContext.currentTime + 1.6
        );

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 1.6);
    }

    async playGameStart(): Promise<void> {
        await this.ensureAudioContext();

        // Triumphant "ta da!" fanfare
        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(this.masterGain);

        oscillator1.type = "triangle";
        oscillator2.type = "triangle";

        // Classic fanfare pattern - ascending notes with harmony
        oscillator1.frequency.setValueAtTime(
            262,
            this.audioContext.currentTime
        ); // C4
        oscillator1.frequency.setValueAtTime(
            330,
            this.audioContext.currentTime + 0.2
        ); // E4
        oscillator1.frequency.setValueAtTime(
            392,
            this.audioContext.currentTime + 0.4
        ); // G4
        oscillator1.frequency.setValueAtTime(
            523,
            this.audioContext.currentTime + 0.6
        ); // C5

        // Harmony line
        oscillator2.frequency.setValueAtTime(
            196,
            this.audioContext.currentTime
        ); // G3
        oscillator2.frequency.setValueAtTime(
            262,
            this.audioContext.currentTime + 0.2
        ); // C4
        oscillator2.frequency.setValueAtTime(
            330,
            this.audioContext.currentTime + 0.4
        ); // E4
        oscillator2.frequency.setValueAtTime(
            392,
            this.audioContext.currentTime + 0.6
        ); // G4

        gainNode.gain.setValueAtTime(0.6, this.audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.6, this.audioContext.currentTime + 0.6);
        gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            this.audioContext.currentTime + 1.0
        );

        oscillator1.start(this.audioContext.currentTime);
        oscillator2.start(this.audioContext.currentTime);
        oscillator1.stop(this.audioContext.currentTime + 1.0);
        oscillator2.stop(this.audioContext.currentTime + 1.0);
    }

    async playWarpBubbleOpening(): Promise<void> {
        await this.ensureAudioContext();

        // 3-second theremin with ascending tone (200Hz → 800Hz)
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const tremolo = this.audioContext.createOscillator();
        const tremoloGain = this.audioContext.createGain();

        // Set up theremin oscillator
        oscillator.type = "sine";
        oscillator.connect(gainNode);

        // Set up tremolo for that classic theremin warble
        tremolo.type = "sine";
        tremolo.frequency.setValueAtTime(6, this.audioContext.currentTime); // 6Hz tremolo
        tremolo.connect(tremoloGain);
        tremoloGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        tremoloGain.connect(gainNode.gain);

        gainNode.connect(this.masterGain);

        // Ascending frequency ramp over 3 seconds
        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(
            800,
            this.audioContext.currentTime + 3.0
        );

        // Moderate gain with slight fade-in and sustain
        gainNode.gain.setValueAtTime(0.01, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
            0.25,
            this.audioContext.currentTime + 0.3
        );
        gainNode.gain.setValueAtTime(0.25, this.audioContext.currentTime + 2.7);
        gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            this.audioContext.currentTime + 3.0
        );

        oscillator.start(this.audioContext.currentTime);
        tremolo.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 3.0);
        tremolo.stop(this.audioContext.currentTime + 3.0);
    }

    async playWarpBubbleClosing(): Promise<void> {
        await this.ensureAudioContext();

        // 1-second theremin with descending tone (800Hz → 200Hz)
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const tremolo = this.audioContext.createOscillator();
        const tremoloGain = this.audioContext.createGain();

        // Set up theremin oscillator
        oscillator.type = "sine";
        oscillator.connect(gainNode);

        // Set up tremolo for that classic theremin warble
        tremolo.type = "sine";
        tremolo.frequency.setValueAtTime(6, this.audioContext.currentTime); // 6Hz tremolo
        tremolo.connect(tremoloGain);
        tremoloGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        tremoloGain.connect(gainNode.gain);

        gainNode.connect(this.masterGain);

        // Descending frequency ramp over 1 second
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(
            200,
            this.audioContext.currentTime + 1.0
        );

        // Fading gain
        gainNode.gain.setValueAtTime(0.25, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            this.audioContext.currentTime + 1.0
        );

        oscillator.start(this.audioContext.currentTime);
        tremolo.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 1.0);
        tremolo.stop(this.audioContext.currentTime + 1.0);
    }

    async playGiftCollected(): Promise<void> {
        await this.ensureAudioContext();

        // Pleasant chime for gift collection (will be customizable later)
        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(this.masterGain);

        oscillator1.type = "sine";
        oscillator2.type = "sine";

        // Pleasant bell-like chord
        oscillator1.frequency.setValueAtTime(
            659,
            this.audioContext.currentTime
        ); // E5
        oscillator2.frequency.setValueAtTime(
            523,
            this.audioContext.currentTime
        ); // C5

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            this.audioContext.currentTime + 0.4
        );

        oscillator1.start(this.audioContext.currentTime);
        oscillator2.start(this.audioContext.currentTime);
        oscillator1.stop(this.audioContext.currentTime + 0.4);
        oscillator2.stop(this.audioContext.currentTime + 0.4);
    }

    async playGiftDestroyed(): Promise<void> {
        await this.ensureAudioContext();

        // Frustrated cat "Mwwrrooowwwww" sound
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);

        // Use sawtooth wave for more cat-like timbre
        oscillator.type = "sawtooth";

        // Low-pass filter to soften the harsh sawtooth
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(800, this.audioContext.currentTime);

        // Frequency sweep from high to low for "meow" effect
        oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime); // Start high
        oscillator.frequency.exponentialRampToValueAtTime(
            80,
            this.audioContext.currentTime + 1.0
        ); // Sweep down

        // Envelope: quick attack, sustained, slow decay
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(
            0.25,
            this.audioContext.currentTime + 0.05
        ); // Quick attack
        gainNode.gain.setValueAtTime(0.25, this.audioContext.currentTime + 0.3); // Sustain
        gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            this.audioContext.currentTime + 1.0
        ); // Slow decay

        // Add slight tremolo for more realistic cat sound
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();

        lfo.type = "sine";
        lfo.frequency.setValueAtTime(6, this.audioContext.currentTime); // 6Hz tremolo
        lfoGain.gain.setValueAtTime(0.1, this.audioContext.currentTime); // Subtle effect

        lfo.connect(lfoGain);
        lfoGain.connect(gainNode.gain);

        const duration = 1.0;
        oscillator.start(this.audioContext.currentTime);
        lfo.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
        lfo.stop(this.audioContext.currentTime + duration);
    }
}
