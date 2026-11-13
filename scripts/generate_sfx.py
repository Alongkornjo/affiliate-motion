#!/usr/bin/env python3
"""Synthesize clean, royalty-free UI & transition sound effects (WAV) into public/sfx/."""

import math
import struct
import wave
from pathlib import Path

import numpy as np

SAMPLE_RATE = 44100


def save_wav(path: Path, samples: np.ndarray):
    path.parent.mkdir(parents=True, exist_ok=True)
    peak = np.max(np.abs(samples)) or 1.0
    norm = np.clip(samples / peak * 0.75, -1.0, 1.0)
    pcm = (norm * 32767).astype(np.int16)
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(pcm.tobytes())


def make_whoosh(duration: float = 0.28) -> np.ndarray:
    n = int(SAMPLE_RATE * duration)
    t = np.linspace(0, duration, n)
    rng = np.random.default_rng(42)
    noise = rng.normal(0, 1, n)
    # Smooth band-like shaping via moving average + sine envelope
    kernel = np.ones(18) / 18
    filtered = np.convolve(noise, kernel, mode="same")
    env = np.sin(np.pi * t / duration) ** 1.6
    sweep = np.sin(2 * math.pi * (180 + 420 * (t / duration)) * t) * 0.25
    return (filtered * 0.8 + sweep) * env


def make_pop(duration: float = 0.11) -> np.ndarray:
    n = int(SAMPLE_RATE * duration)
    t = np.linspace(0, duration, n)
    freq = 680 * np.exp(-18 * t) + 180
    phase = 2 * math.pi * np.cumsum(freq) / SAMPLE_RATE
    env = np.exp(-32 * t) * (1 - np.exp(-220 * t))
    return np.sin(phase) * env


def make_ding(duration: float = 0.42) -> np.ndarray:
    n = int(SAMPLE_RATE * duration)
    t = np.linspace(0, duration, n)
    env = np.exp(-7.5 * t) * (1 - np.exp(-180 * t))
    sig = (
        0.65 * np.sin(2 * math.pi * 1046.5 * t)
        + 0.25 * np.sin(2 * math.pi * 1567.98 * t)
        + 0.10 * np.sin(2 * math.pi * 2093.0 * t)
    )
    return sig * env


def make_sparkle(duration: float = 0.35) -> np.ndarray:
    n = int(SAMPLE_RATE * duration)
    t = np.linspace(0, duration, n)
    notes = [1174.66, 1479.98, 1760.00, 2349.32]
    sig = np.zeros(n)
    for idx, freq in enumerate(notes):
        offset = int(idx * 0.055 * SAMPLE_RATE)
        if offset < n:
            lt = np.linspace(0, (n - offset) / SAMPLE_RATE, n - offset)
            env = np.exp(-11 * lt)
            sig[offset:] += np.sin(2 * math.pi * freq * lt) * env * 0.4
    return sig


def make_bgm_loop(bpm: float = 112.0, bars: int = 4) -> np.ndarray:
    """Synthesize a soft, cheerful, loopable marimba + warm pad + gentle shaker BGM."""
    beat_dur = 60.0 / bpm
    total_dur = beat_dur * 4 * bars
    n = int(SAMPLE_RATE * total_dur)
    t = np.linspace(0, total_dur, n, endpoint=False)
    sig = np.zeros(n)

    # Warm C - G - Am - F progression (Hz)
    chords = [
        [261.63, 329.63, 392.00],  # C
        [196.00, 246.94, 293.66],  # G
        [220.00, 261.63, 329.63],  # Am
        [174.61, 220.00, 261.63],  # F
    ]
    roots = [130.81, 98.00, 110.00, 87.31]

    bar_samples = int(SAMPLE_RATE * beat_dur * 4)
    rng = np.random.default_rng(7)

    for b in range(bars):
        chord = chords[b % len(chords)]
        root = roots[b % len(roots)]
        start_idx = b * bar_samples
        end_idx = min((b + 1) * bar_samples, n)
        bt = np.linspace(0, (end_idx - start_idx) / SAMPLE_RATE, end_idx - start_idx, endpoint=False)

        # Soft warm pad
        pad_env = np.sin(np.pi * bt / (beat_dur * 4)) ** 0.4
        pad = sum(np.sin(2 * math.pi * f * bt) for f in chord) * 0.08 * pad_env
        bass = np.sin(2 * math.pi * root * bt) * 0.14 * np.exp(-1.5 * (bt % beat_dur))
        sig[start_idx:end_idx] += pad + bass

        # Cheerful plucked arpeggio notes on 8th beats
        arp_pattern = [0, 1, 2, 1, 0, 2, 1, 2]
        step_dur = beat_dur / 2.0
        for step, c_idx in enumerate(arp_pattern):
            note_start = start_idx + int(step * step_dur * SAMPLE_RATE)
            note_len = min(int(0.32 * SAMPLE_RATE), n - note_start)
            if note_len <= 0:
                continue
            nt = np.linspace(0, note_len / SAMPLE_RATE, note_len, endpoint=False)
            freq = chord[c_idx] * 2.0
            nenv = np.exp(-11.0 * nt) * (1 - np.exp(-180.0 * nt))
            sig[note_start : note_start + note_len] += np.sin(2 * math.pi * freq * nt) * 0.12 * nenv

            # Subtle light offbeat shaker
            if step % 2 == 1:
                slen = min(int(0.04 * SAMPLE_RATE), n - note_start)
                st = np.linspace(0, slen / SAMPLE_RATE, slen, endpoint=False)
                noise = rng.normal(0, 1, slen)
                senv = np.exp(-80.0 * st)
                sig[note_start : note_start + slen] += noise * senv * 0.025

    return sig


def main():
    sfx_dir = Path(__file__).resolve().parent.parent / "public" / "sfx"
    save_wav(sfx_dir / "whoosh.wav", make_whoosh())
    save_wav(sfx_dir / "pop.wav", make_pop())
    save_wav(sfx_dir / "ding.wav", make_ding())
    save_wav(sfx_dir / "sparkle.wav", make_sparkle())
    save_wav(sfx_dir / "bgm_upbeat.wav", make_bgm_loop())
    print(f"Generated 4 SFX + BGM loop in {sfx_dir}")


if __name__ == "__main__":
    main()
