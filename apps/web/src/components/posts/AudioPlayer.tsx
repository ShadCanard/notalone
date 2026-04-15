import { ActionIcon, Group, Text, Box, Paper, UnstyledButton } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlayerPlayFilled, IconPlayerPauseFilled, IconSquare, IconPlayerStopFilled } from '@tabler/icons-react';
import { getUploadUrl } from '@/lib/uploads';
import { useEffect, useRef, useState, useMemo, useCallback, type FC } from 'react';

interface AudioPlayerProps {
  src: string;
  filename?: string;
  autoPlay?: boolean;
  loop?: boolean;
}

const TOTAL_BARS = 40;

const formatTime = (sec: number) => {
  if (!isFinite(sec)) return '0:00';
  const s = Math.floor(sec % 60);
  const m = Math.floor(sec / 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const AudioPlayer: FC<AudioPlayerProps> = ({ src, filename, autoPlay = false, loop = false }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  const [waveformData, setWaveformData] = useState<number[]>(() => Array(TOTAL_BARS).fill(0.15));
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const sourceConnectedRef = useRef(false);
  const usingBlobRef = useRef(false);
  const blobUrlRef = useRef<string | null>(null);
  const originalSrcRef = useRef<string | undefined>(undefined);
  const bufferSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const bufferPlayingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const skipAnalyserRef = useRef(false);

  // Attach audio events
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onLoaded = () => {
      setDuration(isFinite(el.duration) ? el.duration : null);
    };
    const onTime = () => {
      setCurrentTime(el.currentTime || 0);
      const d = el.duration || duration || 180;
      setProgress(((el.currentTime || 0) / d) * 100);
    };
    const onEnded = () => {
      setIsPlaying(false);
    };

    el.addEventListener('loadedmetadata', onLoaded);
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('ended', onEnded);

    return () => {
      el.removeEventListener('loadedmetadata', onLoaded);
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('ended', onEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  // Setup Web Audio analyser to feed waveformData
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = audioRef.current;
    if (!el) return;

    // create AudioContext and analyser
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = audioCtxRef.current ?? new AudioCtx();
    audioCtxRef.current = audioCtx;

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.6;
    analyserRef.current = analyser;

    let source: MediaElementAudioSourceNode | null = null;
    try {
      source = audioCtx.createMediaElementSource(el);
      sourceRef.current = source;
      // always connect to analyser to read data; delay connecting to destination
      source.connect(analyser);
      // only connect to destination if AudioContext already running
      if (audioCtx.state === 'running') {
        try {
          source.connect(audioCtx.destination);
          sourceConnectedRef.current = true;
        } catch (e) {
          sourceConnectedRef.current = false;
        }
      }
      skipAnalyserRef.current = false;
    } catch (e) {
      // creating MediaElementSource can fail (already used, CORS...), skip analyser safely
      skipAnalyserRef.current = true;
      sourceRef.current = null;
      sourceConnectedRef.current = false;
    }

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const tick = () => {
      if (!analyserRef.current || skipAnalyserRef.current) return;
      try {
        analyserRef.current.getByteFrequencyData(dataArray);
      } catch (err) {
        // reading frequency data can throw if CORS taints the buffer; stop analyser
        skipAnalyserRef.current = true;
        return;
      }
      const step = Math.max(1, Math.floor(bufferLength / TOTAL_BARS));
      const bars: number[] = new Array(TOTAL_BARS).fill(0).map((_, i) => {
        let sum = 0;
        const start = i * step;
        const end = Math.min(start + step, bufferLength);
        for (let j = start; j < end; j++) sum += dataArray[j];
        const avg = sum / (end - start || 1);
        return Math.max(0.05, avg / 255);
      });
      setWaveformData(bars);
      rafRef.current = requestAnimationFrame(tick);
    };

    // start loop only if analyser is usable
    if (!skipAnalyserRef.current && rafRef.current == null) {
      rafRef.current = requestAnimationFrame(tick);
    }

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      try {
        if (source) source.disconnect();
        if (analyser) analyser.disconnect();
        sourceRef.current = null;
        sourceConnectedRef.current = false;
      } catch (e) {}
      // do not close AudioContext here to avoid unlock delays on subsequent plays
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  // Play / pause handlers
  const handlePlay = useCallback(async () => {
    const el = audioRef.current;
    if (!el) return;
    // resume AudioContext if needed (user gesture)
    const audioCtx = audioCtxRef.current;
    const tryResume = async () => {
      if (audioCtx && audioCtx.state === 'suspended') {
        try {
          await audioCtx.resume();
        } catch (e) {
          // ignore resume failure, we'll fallback to native controls later
        }
      }
      // if resumed, ensure the media element source is connected to destination
      try {
        if (audioCtx && audioCtx.state === 'running' && sourceRef.current && !sourceConnectedRef.current) {
          try {
            sourceRef.current.connect(audioCtx.destination);
            sourceConnectedRef.current = true;
          } catch (e) {
            sourceConnectedRef.current = false;
          }
        }
      } catch (e) {}
    };

    if (el.paused) {
      try {
        // ensure not muted and volume up
        try {
          el.muted = false;
          el.volume = 1;
        } catch (e) {}
        // resume audio context and connect source if needed (await to ensure state)
        await tryResume();
        // show diagnostic after resume/connect attempt
        try {
        } catch (e) {}
        // if source isn't connected, try fetching the file as a blob (same-origin) and play that
        if (!sourceConnectedRef.current) {
          try {
            // save original src for cleanup
            originalSrcRef.current = el.src;
            const fetchUrl = getUploadUrl(src) || src;
            const resp = await fetch(fetchUrl, { method: 'GET', credentials: 'include' });
            if (resp.ok) {
              const blob = await resp.blob();
              const url = URL.createObjectURL(blob);
              blobUrlRef.current = url;
              usingBlobRef.current = true;
              el.src = url;
            }
          } catch (e) {
            // fetch failed — we'll fallback to native controls later
          }
        }
        const p = el.play();
        if (p && typeof p.then === 'function') {
          p.then(() => {
            setIsPlaying(true);
            // after a short delay, verify playback actually progressed; if not, enable native controls
            setTimeout(() => {
              try {
                const progressed = (el.currentTime || 0) > 0.05;
                if (!progressed) {
                  // try buffer fallback via decodeAudioData
                  (async () => {
                    try {
                      const audioCtx = audioCtxRef.current ?? new (window.AudioContext || (window as any).webkitAudioContext)();
                      audioCtxRef.current = audioCtx;
                      // fetch raw bytes
                      const fetchUrl = getUploadUrl(src) || src;
                      const resp = await fetch(fetchUrl, { method: 'GET', credentials: 'include' });
                      if (!resp.ok) throw new Error('fetch_failed');
                      const ab = await resp.arrayBuffer();
                      const decoded = await audioCtx.decodeAudioData(ab.slice(0));
                      // stop any previous buffer
                      if (bufferPlayingRef.current && bufferSourceRef.current) {
                        try {
                          bufferSourceRef.current.stop();
                        } catch (e) {}
                        bufferSourceRef.current.disconnect();
                        bufferSourceRef.current = null;
                        bufferPlayingRef.current = false;
                      }
                      const bufSrc = audioCtx.createBufferSource();
                      bufSrc.buffer = decoded;
                      bufSrc.connect(audioCtx.destination);
                      bufSrc.start(0);
                      bufferSourceRef.current = bufSrc;
                      bufferPlayingRef.current = true;
                      setIsPlaying(true);
                      return;
                    } catch (e) {
                      try {
                        el.controls = true;
                      } catch (e) {}
                      notifications.show({ title: 'Aucun son détecté', message: 'Active le lecteur natif pour démarrer la lecture.', color: 'red' });
                    }
                  })();
                }
              } catch (e) {}
            }, 600);
          }).catch((err) => {
            // Chrome may block playback; fallback to showing controls so user can interact
            try {
              el.controls = true;
            } catch (e) {}
            notifications.show({ title: 'Lecture bloquée', message: err?.message || 'Clique sur le bouton de lecture du lecteur', color: 'red' });
            setIsPlaying(false);
          });
        }
      } catch (err: any) {
        try {
          el.controls = true;
        } catch (e) {}
        notifications.show({ title: 'Erreur lecture', message: err?.message || 'Impossible de lancer la lecture', color: 'red' });
        setIsPlaying(false);
      }
    } else {
      el.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleStop = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
    setProgress(0);
    // cleanup blob URL if used
    try {
      if (usingBlobRef.current && blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
        usingBlobRef.current = false;
        // restore original src
        if (originalSrcRef.current) el.src = originalSrcRef.current;
      }
    } catch (e) {}
    // stop buffer source if playing
    try {
      if (bufferPlayingRef.current && bufferSourceRef.current) {
        try {
          bufferSourceRef.current.stop();
        } catch (e) {}
        bufferSourceRef.current.disconnect();
        bufferSourceRef.current = null;
        bufferPlayingRef.current = false;
      }
    } catch (e) {}
  }, []);

  // If autoPlay prop set, trigger play when audio loaded
  useEffect(() => {
    if (!autoPlay) return;
    const el = audioRef.current;
    if (!el) return;
    void el.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  }, [autoPlay, src]);

  const progressBarCount = Math.floor((progress / 100) * TOTAL_BARS);

  return (
    <Paper
      radius={9999}
      bg="#d0d0d0"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 24px 12px 8px',
        minWidth: 420,
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1), 0 2px 0 rgba(255,255,255,0.5)',
        userSelect: 'none',
      }}
    >
      <audio ref={audioRef} src={getUploadUrl(src) || src} preload="metadata" loop={loop} crossOrigin="anonymous" />

      {/* Play Button */}
      <UnstyledButton
        onClick={handlePlay}
        style={{
          position: 'relative',
          display: 'flex',
          flexShrink: 0,
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'linear-gradient(to bottom right, #7c3aed, #6d28d9)',
          boxShadow: '0 8px 12px -3px rgba(0, 0, 0, 0.08), 0 3px 4px -3px rgba(0, 0, 0, 0.06)',
          transition: 'transform 150ms ease, box-shadow 150ms ease',
          cursor: 'pointer',
          zIndex: 30,
        }}
        onMouseDown={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'scale(0.95)';
        }}
        onMouseUp={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
        }}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        <Box
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            backgroundColor: '#7c3aed',
            opacity: 0.2,
            filter: 'blur(12px)',
          }}
        />
        {isPlaying ? (
          <IconPlayerPauseFilled color="white" size={16} style={{ position: 'relative', zIndex: 10 }} />
        ) : (
          <IconPlayerPlayFilled color="white" size={20} style={{ position: 'relative', zIndex: 10, marginLeft: 3 }} />
        )}
      </UnstyledButton>

      {/* Stop Button */}
      <ActionIcon
        variant="default"
        size={28}
        radius="md"
        onClick={handleStop}
        style={{
          flexShrink: 0,
          backgroundColor: 'white',
          border: '2px solid #bbb',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          transition: 'transform 150ms ease',
          minWidth: 44,
          marginLeft: -27,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end'
        }}
        onMouseDown={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'scale(0.95)';
        }}
        onMouseUp={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
        }}
        aria-label="Stop"
      >
        <IconPlayerStopFilled style={{ width: 10, height: 10, backgroundColor: 'black', borderRadius: 2 }} />
      </ActionIcon>

      {/* Waveform */}
      <Group
        gap={2}
        wrap="nowrap"
        style={{
          flex: 1,
          height: 28,
          justifyContent: 'center',
          alignItems: 'center',
          padding: '0 8px',
        }}
      >
        {waveformData.map((height, index) => {
          const barHeight = Math.max(height * 26, 4);
          const isActive = index < progressBarCount;
          return (
            <Box
              key={index}
              style={{
                width: 2,
                height: barHeight,
                backgroundColor: isActive ? '#4c1d95' : '#7c3aed',
                opacity: isActive ? 1 : 0.85,
                borderRadius: 9999,
                transition: 'background-color 150ms ease, opacity 150ms ease',
              }}
            />
          );
        })}
      </Group>

      {/* Time Display */}
      <Box style={{ flexShrink: 0, minWidth: 52, textAlign: 'right' }}>
        <Text
          ff="monospace"
          fw={700}
          c="black"
          style={{
            fontSize: 16,
            letterSpacing: '-0.025em',
          }}
        >
          {formatTime(currentTime)}
        </Text>
      </Box>
    </Paper>
  );
};

export default AudioPlayer;
