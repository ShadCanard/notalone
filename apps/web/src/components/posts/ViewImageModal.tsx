import { Modal, Group, Image, Stack, Text, Avatar, Divider, Textarea, Button, ScrollArea, ActionIcon } from '@mantine/core';
import { useState, useEffect } from 'react';
import { useCreateComment, useToggleLike } from '@/hooks/useApi';
import { Comment, Post } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { getUploadUrl } from '@/lib/uploads';
import { IconHeart, IconHeartFilled } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { getTimeAgo, parseDate } from '@/lib/tools';

interface ViewImageModalProps {
  opened: boolean;
  onClose: () => void;
  imageSrc: string;
  post?: Post;
}

export default function ViewImageModal({ opened, onClose, imageSrc, post }: ViewImageModalProps) {
  const [localComments, setLocalComments] = useState<Comment[]>(post?.comments || []);
  const [newComment, setNewComment] = useState('');
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });
  const [modalSize, setModalSize] = useState({ w: 'auto', h: '70vh' });
  const createComment = useCreateComment();
  const { isAuthenticated } = useAuth();
  const toggleLike = useToggleLike();
  
  useEffect(() => {
    setLocalComments(post?.comments || []);
  }, [post]);

    
      const handleLike = () => {
        if (!isAuthenticated) {
          notifications.show({ title: 'Connexion requise', message: 'Connecte-toi pour soutenir ce post', color: 'pastelBlue' });
          return;
        }
        if (!post?.id) return;
        toggleLike.mutate({ postId: post.id });
      };

  useEffect(() => {
    function computeSizes() {
      const sidebarWidth = 420; // right panel
      const spacing = 48; // Group spacing + paddings

      const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
      const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

      const maxModalWidth = Math.floor(vw * 0.95);
      const maxModalHeight = Math.floor(vh * 0.9);

      const maxImageWidth = Math.max(100, maxModalWidth - sidebarWidth - spacing);
      const maxImageHeight = Math.max(100, maxModalHeight - 40);

      const nw = naturalSize.w || maxImageWidth;
      const nh = naturalSize.h || maxImageHeight;

      const scale = Math.min(1, maxImageWidth / nw, maxImageHeight / nh);

      const dw = Math.floor(nw * scale);
      const dh = Math.floor(nh * scale);

      const totalW = Math.min(maxModalWidth, dw + sidebarWidth + spacing);
      const totalH = Math.min(maxModalHeight, Math.max(dh, 420));

      setDisplaySize({ w: dw, h: dh });
      setModalSize({ w: `${totalW}px`, h: `${totalH}px` });
    }

    computeSizes();
    window.addEventListener('resize', computeSizes);
    return () => window.removeEventListener('resize', computeSizes);
  }, [naturalSize]);

  async function handleAddComment() {
    if (!newComment.trim()) return;
    if (!post?.id) {
      const temp = { id: `tmp-${Date.now()}`, content: newComment.trim(), createdAt: new Date().toISOString(), author: { id: 'me', username: 'Moi' } } as Comment;
      setLocalComments((c) => [temp, ...c]);
      setNewComment('');
      return;
    }

    try {
      const res = await createComment.mutateAsync({ postId: post.id, content: newComment.trim() });
      const created = res.createComment;
      setLocalComments((c) => [created, ...c]);
      setNewComment('');
    } catch (e) {
      console.error('add comment error', e);
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="auto"
      centered
      withCloseButton={false}
      padding={0}
      styles={{ header: { display: 'none' }, content: { overflow: 'hidden', width: modalSize.w, height: modalSize.h } }}
    >
      <Group align="stretch" gap="xl" style={{ maxHeight: modalSize.h, height: modalSize.h }}>
        <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0, overflow: 'hidden' }}>
          <Image
            src={getUploadUrl(imageSrc) || imageSrc}
            alt="attachment"
            fit="contain"
            onLoad={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
            }}
            style={{ display: 'block', width: displaySize.w ? `${displaySize.w}px` : 'auto', height: displaySize.h ? `${displaySize.h}px` : 'auto', objectFit: 'contain' }}
          />
        </div>

        <div style={{ width: 420, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Stack gap="sm" style={{ padding: 12, flex: '0 0 auto' }}>
            <Group gap="sm">
              <Avatar src={getUploadUrl(post?.author?.avatar) || '/default-avatar.svg'} radius="xl" />
              <div>
                <Text fw={700}>{post?.author?.username ?? 'Utilisateur'}</Text>
                <Text size="xs" c="dimmed">{ getTimeAgo(parseDate(post?.createdAt as string))}</Text>
              </div>
            </Group>

            <Divider />

            <Text style={{ whiteSpace: 'pre-wrap' }}>{post?.content}</Text>
          </Stack>

          <Divider />

          <div style={{ padding: 12, flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}>
            <ScrollArea style={{ flex: 1 }} type="always">
              <Stack gap="sm">
                {localComments.map((c) => (
                  <Group key={c.id} gap="sm" align="flex-start">
                    <Avatar src={getUploadUrl(c.author.avatar) || '/default-avatar.svg'} radius="xl" size="sm" />
                    <div style={{ flex: 1 }}>
                      <Text fw={600}>{c.author.username}</Text>
                      <Text size="sm" c="dimmed">{ getTimeAgo(parseDate(c.createdAt))}</Text>
                      <Text style={{ whiteSpace: 'pre-wrap' }}>{c.content}</Text>
                    </div>
                  </Group>
                ))}
              </Stack>
            </ScrollArea>

            <div style={{ marginTop: 8 }}>
              {isAuthenticated ? (
                <div>
                    <Group gap={4}>
                        <ActionIcon
                          variant="subtle"
                          color={(post?.isLikedByMe) ? 'red' : 'gray'}
                          onClick={handleLike}
                          loading={toggleLike.isPending}
                          >
                          {post?.isLikedByMe ? <IconHeartFilled size={20} /> : <IconHeart size={20} />}
                          </ActionIcon>
                          <Text size="sm" c="dimmed">
                          {post?.likesCount}
                          </Text>
                    </Group>
                  <Textarea value={newComment} onChange={(e) => setNewComment(e.currentTarget.value)} placeholder="Écris un message de soutien..." autosize minRows={2} />
                  <Group align="right" mt="xs">
                    <Button onClick={handleAddComment} loading={createComment.isPending}>Envoyer</Button>
                  </Group>
                </div>
              ) : (
                <Text size="sm" c="dimmed">Connecte-toi pour laisser un commentaire.</Text>
              )}
            </div>
          </div>
        </div>
      </Group>
    </Modal>
  );
}
