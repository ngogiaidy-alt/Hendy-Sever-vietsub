#!/usr/bin/env python3
"""
Hendy-Server / VIETSUB PRO - Audio Ducking & Voiceover Engine
Module: python-engine/media_node/audio_ducking.py
Description: Dynamic sidechain audio ducking processor. When AI voiceover
or synthesized Vietnamese translation speech is detected, the engine smoothly
attenuates the original stream background audio (e.g. -14dB) to ensure crisp
clarity without jarring cutoffs.
"""

import math
import logging
from typing import Dict, Any

logging.basicConfig(level=logging.INFO, format="[%(asctime)s] [%(levelname)s] [AudioDucking] %(message)s")
logger = logging.getLogger("AudioDucking")


class AudioDucker:
    def __init__(
        self,
        attenuation_db: float = -14.0,
        threshold_db: float = -22.0,
        attack_ms: float = 20.0,
        release_ms: float = 250.0,
        ratio: float = 4.0
    ):
        self.attenuation_db = attenuation_db
        self.threshold_db = threshold_db
        self.attack_ms = attack_ms
        self.release_ms = release_ms
        self.ratio = ratio
        self.current_gain = 1.0

    @property
    def linear_attenuation(self) -> float:
        """Converts decibels to linear amplitude multiplier."""
        return math.pow(10, self.attenuation_db / 20.0)

    def calculate_envelope(self, voice_signal_level_db: float) -> float:
        """
        Calculates sidechain gain factor based on input voiceover presence.
        Returns multiplier between linear_attenuation and 1.0.
        """
        if voice_signal_level_db > self.threshold_db:
            # Voice detected: duck background audio
            target_gain = self.linear_attenuation
            # Smooth attack transition
            self.current_gain = 0.85 * self.current_gain + 0.15 * target_gain
        else:
            # Silence: restore background audio smoothly
            target_gain = 1.0
            self.current_gain = 0.92 * self.current_gain + 0.08 * target_gain

        return round(self.current_gain, 4)

    def generate_ffmpeg_filter(self) -> str:
        """
        Produces production FFmpeg sidechaincompress filter graph string
        used in multi-stream RTMP/HLS pipelines.
        """
        # sidechaincompress filter syntax:
        # [0:a][1:a]sidechaincompress=threshold=0.08:ratio=4:attack=20:release=250[out]
        linear_threshold = round(math.pow(10, self.threshold_db / 20.0), 3)
        return (
            f"[0:a][1:a]sidechaincompress="
            f"threshold={linear_threshold}:"
            f"ratio={self.ratio}:"
            f"attack={self.attack_ms}:"
            f"release={self.release_ms}:"
            f"level_sc=1.0[outa]"
        )

    def get_status(self) -> Dict[str, Any]:
        return {
            "attenuation_db": self.attenuation_db,
            "threshold_db": self.threshold_db,
            "attack_ms": self.attack_ms,
            "release_ms": self.release_ms,
            "ratio": self.ratio,
            "current_gain_linear": self.current_gain,
            "ffmpeg_filter_string": self.generate_ffmpeg_filter()
        }


if __name__ == "__main__":
    ducker = AudioDucker()
    print("Testing Audio Ducking Envelope...")
    for level in [-40, -30, -15, -12, -10, -35, -45]:
        gain = ducker.calculate_envelope(level)
        print(f"Voice Level: {level:3d} dB -> BG Gain: {gain:.4f}")
    print("FFmpeg Filter:", ducker.generate_ffmpeg_filter())
