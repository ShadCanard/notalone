import { Card, Text, Image, CloseButton, Skeleton } from '@mantine/core';
import { useEffect, useState } from 'react';

export interface OgPreviewData {
  url: string;
  title: string;
  description: string;
  image?: string;
  siteName?: string;
}

interface OGPreviewCreatePostComponentProps {
  url: string | null;
  hiddenUrl: string | null;
  onPreviewChange: (preview: OgPreviewData | null) => void;
  onClose: () => void;
}

const apiBase = (process.env.NEXT_PUBLIC_API_URL?.replace(/\/graphql\/?$/, '') || 'http://localhost:4000');

export default function OGPreviewCreatePostComponent({ url, hiddenUrl, onPreviewChange, onClose }: OGPreviewCreatePostComponentProps) {
  const [preview, setPreview] = useState<OgPreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url || url === hiddenUrl) {
      setLoading(false);
      setPreview(null);
      setError(null);
      onPreviewChange(null);
      return;
    }

    const controller = new AbortController();
    const fetchPreview = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${apiBase}/api/og-preview?url=${encodeURIComponent(url)}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error || 'Impossible de charger l’aperçu');
        }
        const data = await res.json();
        if (!data.title && !data.description && !data.image) {
          throw new Error('Aucun aperçu disponible');
        }

        const nextPreview: OgPreviewData = {
          url: data.url,
          title: data.title || data.siteName || data.url,
          description: data.description || '',
          image: data.image,
          siteName: data.siteName,
        };

        setPreview(nextPreview);
        onPreviewChange(nextPreview);
      } catch (err: any) {
        if (!controller.signal.aborted) {
          setError(err?.message || 'Impossible de récupérer l’aperçu');
          setPreview(null);
          onPreviewChange(null);
        }
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
  }, [url, hiddenUrl, onPreviewChange]);

  if (!url || url === hiddenUrl) {
    return null;
  }

  if (loading) {
    return (
      <Card shadow="sm" padding="md" radius="md" withBorder>
        <Skeleton height={24} width="40%" radius="xl" mb="sm" />
        <Skeleton height={16} width="80%" radius="xl" mb="xs" />
        <Skeleton height={16} width="70%" radius="xl" />
      </Card>
    );
  }

  if (error) {
    return <Text size="xs" c="red">{error}</Text>;
  }

  if (!preview) {
    return null;
  }

  return (
    <Card shadow="sm" padding="md" radius="md" withBorder style={{ width: '100%', position: 'relative' }}>
      <CloseButton
        size="sm"
        style={{ position: 'absolute', right: 10, top: 10, zIndex: 1 }}
        onClick={onClose}
      />
      {preview.image ? (
        <Image src={preview.image} alt={preview.title} height={140} fit="cover" radius="md" style={{ marginBottom: 12 }} />
      ) : null}
      <Text fw={700} lineClamp={2} style={{ marginBottom: 4 }}>
        {preview.title}
      </Text>
      {preview.description ? (
        <Text size="sm" c="dimmed" lineClamp={3} style={{ marginBottom: 8 }}>
          {preview.description}
        </Text>
      ) : null}
      <Text size="xs" c="dimmed">
        {preview.siteName || new URL(preview.url).hostname}
      </Text>
    </Card>
  );
}
