import { useCallback, useEffect, useRef } from 'react';

export const usePlinkoSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Initialize AudioContext on user interaction usually, but we try to init lazily
    const initAudio = () => {
        if (!audioContextRef.current) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                audioContextRef.current = new AudioContextClass();
            }
        }
    };
    
    window.addEventListener('click', initAudio, { once: true });
    window.addEventListener('keydown', initAudio, { once: true });
    
    return () => {
       if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
           audioContextRef.current.close().catch(() => {});
       }
    };
  }, []);

  const playPegHit = useCallback(() => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Short, high tick
    // Randomize pitch slightly for realism
    const frequency = 800 + Math.random() * 200;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    // Envelope
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  }, []);

  const playWin = useCallback((multiplier: number) => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    // Determine pitch based on multiplier
    // Higher multiplier = higher pitch / more harmonic content
    const baseFreq = multiplier >= 10 ? 880 : multiplier >= 2 ? 660 : 440;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = multiplier >= 10 ? 'triangle' : 'sine';
    
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    
    // Longer decay for win
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
    
    // Add a second harmonic for "good" wins
    if (multiplier >= 2) {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(baseFreq * 1.5, ctx.currentTime);
        gain2.gain.setValueAtTime(0.05, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc2.start(ctx.currentTime);
        osc2.stop(ctx.currentTime + 0.4);
    }
  }, []);

  return { playPegHit, playWin };
};
