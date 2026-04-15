import { Card, Text } from '@mantine/core';
import { useEffect, useState, type MouseEvent } from 'react';

interface OGPreviewPostComponentProps {
  url: string | null;
  fallbackTitle?: string | null;
  fallbackDescription?: string | null;
  fallbackImage?: string | null;
  fallbackSiteName?: string | null;
}

const apiBase = (process.env.NEXT_PUBLIC_API_URL?.replace(/\/graphql\/?$/, '') || 'http://localhost:4000');

function getYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com')) {
      return parsed.searchParams.get('v');
    }
    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.slice(1);
    }
    return null;
  } catch {
    return null;
  }
}

export default function OGPreviewPostComponent({
  url,
  fallbackTitle,
  fallbackDescription,
  fallbackImage,
  fallbackSiteName,
}: OGPreviewPostComponentProps) {
  const [preview, setPreview] = useState<{ title?: string; description?: string; image?: string; siteName?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);

  const youTubeId = url ? getYouTubeVideoId(url) : null;

  useEffect(() => {
    if (!url) {
      setPreview(null);
      setLoading(false);
      setShowPlayer(false);
      return;
    }

    const controller = new AbortController();
    const fetchPreview = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${apiBase}/api/og-preview?url=${encodeURIComponent(url)}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          setPreview(null);
          return;
        }
        const data = await res.json();
        setPreview({
          title: data.title || undefined,
          description: data.description || undefined,
          image: data.image || undefined,
          siteName: data.siteName || undefined,
        });
      } catch {
        setPreview(null);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void fetchPreview();
    return () => {
      controller.abort();
    };
  }, [url]);

  if (!url) {
    return null;
  }

  const previewTitle = preview?.title || fallbackTitle || url;
  const previewDescription = preview?.description || fallbackDescription || undefined;
  const previewImage = preview?.image || fallbackImage || undefined;
  const previewSiteName = preview?.siteName || fallbackSiteName || undefined;
  const isYoutube = Boolean(youTubeId);

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (isYoutube) {
      event.preventDefault();
      setShowPlayer(true);
    }
  };

  if (isYoutube) {
    return (
      <Card
        onClick={handleClick}
        shadow="sm"
        padding="md"
        radius="md"
        withBorder
        style={{ marginBottom: 16, textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
      >
        {showPlayer && youTubeId ? (
          <div style={{ position: 'relative', paddingTop: '56.25%', marginBottom: 12 }}>
            <iframe
              src={`https://www.youtube.com/embed/${youTubeId}?autoplay=1&rel=0`}
              title={previewTitle}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: 12 }}
            />
          </div>
        ) : previewImage ? (
          <div style={{ overflow: 'hidden', borderRadius: 12, marginBottom: 12 }}>
            <img
              src={previewImage}
              alt={previewTitle}
              style={{ display: 'block', width: '100%', height: 140, objectFit: 'cover' }}
              onError={(event) => {
                (event.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        ) : null}
        <Text fw={700} lineClamp={2} mb="xs">
          {previewTitle}
        </Text>
        {previewDescription ? (
          <Text size="sm" c="dimmed" lineClamp={3} mb="xs">
            {previewDescription}
          </Text>
        ) : null}
        <Text size="xs" c="dimmed">
          {previewSiteName || (() => {
            try {
              return new URL(url).hostname;
            } catch {
              return url;
            }
          })()}
        </Text>
      </Card>
    );
  }

  return (
    <Card
      component="a"
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      shadow="sm"
      padding="md"
      radius="md"
      withBorder
      style={{ marginBottom: 16, textDecoration: 'none', color: 'inherit' }}
    >
      {previewImage ? (
        <div style={{ overflow: 'hidden', borderRadius: 12, marginBottom: 12 }}>
          <img
            src={previewImage}
            alt={previewTitle}
            style={{ display: 'block', width: '100%', height: 140, objectFit: 'cover' }}
            onError={(event) => {
              (event.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      ) : null}
      <Text fw={700} lineClamp={2} mb="xs">
        {previewTitle}
      </Text>
      {previewDescription ? (
        <Text size="sm" c="dimmed" lineClamp={3} mb="xs">
          {previewDescription}
        </Text>
      ) : null}
      <Text size="xs" c="dimmed">
        {previewSiteName || (() => {
          try {
            return new URL(url).hostname;
          } catch {
            return url;
          }
        })()}
      </Text>
    </Card>
  );
}
