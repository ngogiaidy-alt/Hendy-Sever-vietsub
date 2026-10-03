#!/usr/bin/env python3
"""
Hendy-Server / Python Engine - Master Worker Entrypoint
Module: python-engine/main.py
Description: Boots the background worker processes:
1. GitHub GitCloner / Builder pipeline runner
2. VIETSUB PRO Multi-stream manager (20 tabs capacity)
3. Whisper ASR & Audio Ducking engine
4. Redis Queue Listener daemon
"""

import os
import sys
import time
import signal
import threading
import logging

from github_worker.git_cloner import GitCloner
from github_worker.builder import AppBuilder
from media_node.multi_stream import MultiStreamManager
from media_node.whisper_asr import WhisperEngine
from media_node.audio_ducking import AudioDucker
from queue_consumer.redis_listener import RedisTaskListener

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)-15s | %(message)s"
)
logger = logging.getLogger("HendyMaster")


class HendyWorkerDaemon:
    def __init__(self):
        self.running = True
        logger.info("==================================================")
        logger.info("   HENDY-SERVER PYTHON ENGINE & MEDIA WORKER     ")
        logger.info("   Status: BOOTING WORKER CLUSTER (20 TABS)       ")
        logger.info("==================================================")

        # 1. Initialize Git & Build Engine
        self.cloner = GitCloner(workspace_root=os.getenv("WORKSPACE_ROOT", "/tmp/hendy_builds"))
        self.builder = AppBuilder(registry_prefix=os.getenv("DOCKER_REGISTRY", "hendy-registry.internal"))

        # 2. Initialize Media Node & VIETSUB PRO
        self.stream_manager = MultiStreamManager(max_tabs=20)
        self.whisper_engine = WhisperEngine(
            model_size=os.getenv("WHISPER_MODEL", "large-v3"),
            device="cuda" if os.getenv("ENABLE_CUDA") == "1" else "cpu"
        )
        self.audio_ducker = AudioDucker(
            attenuation_db=float(os.getenv("DUCKING_ATTENUATION_DB", "-14.0")),
            threshold_db=float(os.getenv("DUCKING_THRESHOLD_DB", "-22.0"))
        )

        # 3. Redis Queue Consumer
        self.redis_listener = RedisTaskListener(
            redis_host=os.getenv("REDIS_HOST", "localhost"),
            redis_port=int(os.getenv("REDIS_PORT", 6379))
        )

    def start_background_services(self):
        logger.info("Starting Redis Queue Consumer thread...")
        listener_thread = threading.Thread(target=self.redis_listener.listen_forever, daemon=True)
        listener_thread.start()

        logger.info("Multi-Stream Audio Buffer Pool ready: 20 tabs available.")
        logger.info("Whisper ASR Model loaded into VRAM.")
        logger.info("Audio Ducking Sidechain filters configured.")
        logger.info("Worker Cluster is ONLINE and waiting for tasks.")

    def run(self):
        self.start_background_services()
        try:
            while self.running:
                time.sleep(1.0)
        except KeyboardInterrupt:
            logger.info("Shutdown signal caught. Terminating workers gracefully.")
            self.running = False


if __name__ == "__main__":
    daemon = HendyWorkerDaemon()
    daemon.run()
