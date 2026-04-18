import { Anchor, Card, Image, Modal, Stack } from '@mantine/core';
import { useMemo, useState } from 'react';
import { getUploadUrl } from '@/lib/uploads';
import AudioPlayer from '@/components/posts/AudioPlayer';
import OGPreviewPostComponent from '@/components/posts/OGPreviewPostComponent';
import type { Post } from '@/types';
import ViewImageModal from './ViewImageModal';

interface PostPreviewProps {
  post?: Post;
}

function getPayloadString(payload: Record<string, unknown> | null | undefined, key: string) {
  const value = payload?.[key];
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export default function PostPreview({ post }: PostPreviewProps) {
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const linkedPreviewUrl = getPayloadString(post?.payload, 'linkedUrl');
  const linkedPreviewImage = getPayloadString(post?.payload, 'linkedImage');
  const linkedPreviewTitle = getPayloadString(post?.payload, 'linkedTitle') || linkedPreviewUrl;
  const linkedPreviewDescription = getPayloadString(post?.payload, 'linkedDescription');
  const linkedPreviewSiteName = getPayloadString(post?.payload, 'linkedSiteName');

  const attachmentItems = useMemo(() => post?.attachments ?? [], [post?.attachments]);

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

      <ViewImageModal opened={imageModalOpen} onClose={() => setImageModalOpen(false)} imageSrc={selectedImage as string} post={post} />
    </>
  );
}
