import { Anchor, Card, Image, Modal, Stack } from '@mantine/core';
import { useMemo, useState } from 'react';
import { getUploadUrl } from '@/lib/uploads';
import AudioPlayer from '@/components/posts/AudioPlayer';
import OGPreviewPostComponent from '@/components/posts/OGPreviewPostComponent';
import type { Attachment } from '@/types';
import ChatImageModal from './ChatImageModal';

interface ChatPreviewComponentProps {
  attachments?: Attachment[] | null;
  payload?: Record<string, unknown> | null;
}

function getPayloadString(payload: Record<string, unknown> | null | undefined, key: string) {
  const value = payload?.[key];
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export default function ChatPreviewComponent({ attachments, payload }: ChatPreviewComponentProps) {
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const linkedPreviewUrl = getPayloadString(payload, 'linkedUrl');
  const linkedPreviewImage = getPayloadString(payload, 'linkedImage');
  const linkedPreviewTitle = getPayloadString(payload, 'linkedTitle') || linkedPreviewUrl;
  const linkedPreviewDescription = getPayloadString(payload, 'linkedDescription');
  const linkedPreviewSiteName = getPayloadString(payload, 'linkedSiteName');

  const attachmentItems = useMemo(() => attachments ?? [], [attachments]);

  const hasPreview = Boolean(linkedPreviewUrl || attachmentItems.length > 0);
  if (!hasPreview) return null;

  const handleImageClick = (path: string) => {
    setSelectedImage(path);
    setImageModalOpen(true);
  };

  return (
    <>
      {linkedPreviewUrl ? (
        <OGPreviewPostComponent
          url={linkedPreviewUrl}
          fallbackTitle={linkedPreviewTitle || undefined}
          fallbackDescription={linkedPreviewDescription || undefined}
          fallbackImage={linkedPreviewImage || undefined}
          fallbackSiteName={linkedPreviewSiteName || undefined}
        />
      ) : null}

      {attachmentItems.length > 0 ? (
        <Stack gap="xs" mb="md">
          {attachmentItems.map((attachment) => {
            const url = getUploadUrl(attachment.path) || attachment.path;
            if (attachment.mimeType?.startsWith('image/')) {
              return (
                <img
                  key={attachment.id}
                  src={url}
                  alt={attachment.filename}
                  style={{ maxWidth: '100%', borderRadius: 8, cursor: 'pointer' }}
                  onClick={() => handleImageClick(attachment.path)}
                />
              );
            }

            if (attachment.mimeType?.startsWith('audio/')) {
              return <AudioPlayer key={attachment.id} src={attachment.path} filename={attachment.filename} />;
            }

            return (
              <Card key={attachment.id} shadow="sm" padding="sm" radius="md" withBorder>
                <Anchor href={url} target="_blank" rel="noreferrer noopener">
                  {attachment.filename}
                </Anchor>
              </Card>
            );
          })}
        </Stack>
      ) : null}
      <ChatImageModal opened={imageModalOpen} onClose={() => setImageModalOpen(false)} imageUrl={getUploadUrl(selectedImage as string) || ''} />
    </>
  );
}
