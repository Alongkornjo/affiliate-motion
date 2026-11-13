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


def main():
    sfx_dir = Path(__file__).resolve().parent.parent / "public" / "sfx"
    save_wav(sfx_dir / "whoosh.wav", make_whoosh())
    save_wav(sfx_dir / "pop.wav", make_pop())
    save_wav(sfx_dir / "ding.wav", make_ding())
    save_wav(sfx_dir / "sparkle.wav", make_sparkle())
    print(f"Generated 4 SFX files in {sfx_dir}")


if __name__ == "__main__":
    main()
