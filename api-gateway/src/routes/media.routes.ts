import { Router, Request, Response } from 'express';
import { store, MediaStreamTab } from '../services/store.ts';

const router = Router();

// GET /api/media/streams - list active streaming tabs
router.get('/streams', (req: Request, res: Response) => {
  res.json(store.mediaStreams);
});

// POST /api/media/streams - create/open a new live stream tab
router.post('/streams', (req: Request, res: Response) => {
  const { name, channelUrl, whisperModel = 'large-v3', sourceLanguage = 'en', targetLanguage = 'vi' } = req.body;

  const count = store.mediaStreams.length + 1;
  const newStream: MediaStreamTab = {
    id: `stream-tab-${String(count).padStart(2, '0')}`,
    name: name || `Tab ${String(count).padStart(2, '0')}: Live Ingest Stream`,
    channelUrl: channelUrl || `rtmp://live.hendy-server.internal/stream/tab_${count}`,
    status: 'transcribing',
    viewers: Math.floor(100 + Math.random() * 2000),
    fps: 60,
    bitrateKbps: 4500,
    whisperModel,
    sourceLanguage,
    targetLanguage,
    audioDucking: {
      enabled: true,
      attenuationDb: -15,
      thresholdDb: -22,
      duckRatio: 4,
      releaseMs: 250
    },
    liveTranscripts: [
      {
        id: `tr-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        speaker: 'AI Voice Detector',
        originalText: 'Live media stream pipeline initialized. Connected to Whisper GPU worker node.',
        translatedText: 'Đã khởi tạo pipeline luồng truyền thông trực tiếp. Đã kết nối với nút GPU Whisper.',
        confidence: 0.99
      }
    ]
  };

  store.mediaStreams.push(newStream);
  res.json({ success: true, stream: newStream });
});

// PATCH /api/media/streams/:id/ducking - update sidechain audio ducking parameters
router.patch('/streams/:id/ducking', (req: Request, res: Response) => {
  const stream = store.mediaStreams.find(s => s.id === req.params.id);
  if (!stream) {
    return res.status(404).json({ error: 'Stream tab not found' });
  }

  const { enabled, attenuationDb, thresholdDb, duckRatio, releaseMs } = req.body;
  if (typeof enabled === 'boolean') stream.audioDucking.enabled = enabled;
  if (typeof attenuationDb === 'number') stream.audioDucking.attenuationDb = attenuationDb;
  if (typeof thresholdDb === 'number') stream.audioDucking.thresholdDb = thresholdDb;
  if (typeof duckRatio === 'number') stream.audioDucking.duckRatio = duckRatio;
  if (typeof releaseMs === 'number') stream.audioDucking.releaseMs = releaseMs;

  res.json({ success: true, audioDucking: stream.audioDucking });
});

// POST /api/media/streams/:id/transcript - inject or simulate live subtitle line
router.post('/streams/:id/transcript', (req: Request, res: Response) => {
  const stream = store.mediaStreams.find(s => s.id === req.params.id);
  if (!stream) {
    return res.status(404).json({ error: 'Stream tab not found' });
  }

  const { speaker = 'Presenter', originalText, translatedText } = req.body;
  if (!originalText) {
    return res.status(400).json({ error: 'originalText is required' });
  }

  const newTranscript = {
    id: `tr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toLocaleTimeString(),
    speaker,
    originalText,
    translatedText: translatedText || `[Dịch tự động AI]: ${originalText}`,
    confidence: Number((0.92 + Math.random() * 0.07).toFixed(2))
  };

  stream.liveTranscripts.push(newTranscript);
  if (stream.liveTranscripts.length > 50) {
    stream.liveTranscripts.shift();
  }

  res.json({ success: true, transcript: newTranscript });
});

export default router;
