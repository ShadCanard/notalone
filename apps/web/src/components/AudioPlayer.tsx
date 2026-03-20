import { ActionIcon, Group, Slider, Text, Stack } from '@mantine/core';
import { IconPlayerPlay, IconPlayerPause, IconVolume } from '@tabler/icons-react';
import { getUploadUrl } from '@/lib/uploads';
import { useEffect, useRef, useState, type FC } from 'react';

interface AudioPlayerProps {
  src: string;
  filename?: string;
  autoPlay?: boolean;
  loop?: boolean;
}

function formatTime(sec: number) {
  if (!isFinite(sec)) return '0:00';
  const s = Math.floor(sec % 60);
  const m = Math.floor(sec / 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const AudioPlayer: FC<AudioPlayerProps> = ({ src, filename, autoPlay = false, loop = false }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState<number>(0);
  const [current, setCurrent] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onLoaded = () => setDuration(el.duration || 0);
    const onTime = () => setCurrent(el.currentTime || 0);
    const onEnded = () => setPlaying(false);

    el.addEventListener('loadedmetadata', onLoaded);
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('ended', onEnded);

    return () => {
      el.removeEventListener('loadedmetadata', onLoaded);
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('ended', onEnded);
    };
  }, [src]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = volume;
  }, [volume]);

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      void el.play();
      setPlaying(true);
    }
  };

  const seek = (val: number) => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = val;
    setCurrent(val);
  };

  return (
    <Stack gap="xs">
      <audio ref={audioRef} src={getUploadUrl(src) || src} preload="metadata" loop={loop} />

      <Group position="apart" align="center">
        <Group align="center">
          <ActionIcon onClick={togglePlay} size="lg" variant="light">
            {playing ? <IconPlayerPause size={18} /> : <IconPlayerPlay size={18} />}
          </ActionIcon>
          <Text size="sm" fw={600}>
            {filename ?? src.split('/').pop()}
          </Text>
        </Group>

        <Group gap="xs" align="center">
          <Text size="xs">{formatTime(current)}</Text>
          <Slider
            value={current}
            onChange={seek}
            min={0}
            max={duration || 0}
            step={0.1}
            style={{ width: 220 }}
          />
          <Text size="xs">{formatTime(duration)}</Text>
        </Group>
      </Group>

      <Group align="right" gap="xs">
        <IconVolume size={16} />
        <Slider
          value={volume}
          onChange={(v) => setVolume(v)}
          min={0}
          max={1}
          step={0.01}
          style={{ width: 160 }}
        />
      </Group>
    </Stack>
  );
};

export default AudioPlayer;
