import { Card, Group, Text, Avatar, ActionIcon, Stack, Badge, Menu, Textarea, Button } from '@mantine/core';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { IconHeart, IconHeartFilled, IconMessageCircle, IconDotsVertical, IconPencil, IconTrash, IconFlag } from '@tabler/icons-react';
import { useToggleLike, useUpdatePost } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { getUploadUrl } from '@/lib/uploads';
import ViewImageModal from '@/components/posts/ViewImageModal';
import AudioPlayer from '@/components/posts/AudioPlayer';
import OGPreviewPostComponent from '@/components/posts/OGPreviewPostComponent';
import DeletePostModal from '@/components/posts/DeletePostModal';
import CommentComponent from '@/components/comments/CommentComponent';
import { Post } from '@/types';
import { getTimeAgo, parseDate } from '@/lib/tools';

interface PostCardProps {
  post: Post;
  preview?: boolean;
}

const moodEmojis: Record<string, string> = {
  happy: '😊',
  grateful: '🙏',
  hopeful: '🌟',
  calm: '😌',
  loved: '🥰',
  strong: '💪',
  anxious: '😰',
  sad: '😢',
  lonely: '🫂',
  struggling: '🌧️',
};

export default function PostCard({ post, preview }: PostCardProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const canModifyPost = isAuthenticated && user?.id === post.author.id;
  const toggleLike = useToggleLike();
  const updatePost = useUpdatePost();
  const [showComments, setShowComments] = useState(() => (post.comments && post.comments.length > 0));
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [content, setContent] = useState(post.content);

  useEffect(() => {
    setEditedContent(post.content);
    setContent(post.content);
  }, [post.content]);

  const handleLike = () => {
    if (!isAuthenticated) {
      notifications.show({ title: 'Connexion requise', message: 'Connecte-toi pour soutenir ce post', color: 'pastelBlue' });
      return;
    }
    toggleLike.mutate({ postId: post.id });
  };

  const handleDelete = () => {
    setDeleteModalOpened(true);
  };

  const handleReport = () => {
    notifications.show({
      title: 'Post signalé',
      message: 'Merci de votre vigilance, nous allons examiner ce contenu.',
      color: 'red',
    });
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleModerate = () => {
    router.push(`/admin/moderate/post/${post.id}`);
  };

  const handleSaveEdit = () => {
    if (!editedContent.trim()) {
      notifications.show({ title: 'Contenu vide', message: 'Le post ne peut pas être vide.', color: 'red' });
      return;
    }

    updatePost.mutate(
      { id: post.id, content: editedContent },
      {
        onSuccess: () => {
          setContent(editedContent);
          setIsEditing(false);
          notifications.show({ title: 'Post modifié', message: 'Le contenu du post a été mis à jour.', color: 'green' });
        },
        onError: (error: unknown) => {
          const message = error instanceof Error ? error.message : 'Impossible de modifier le post.';
          notifications.show({ title: 'Erreur', message, color: 'red' });
        },
      }
    );
  };

  useEffect(() => {
    if (post.comments && post.comments.length > 0) setShowComments(true);
  }, [post.comments]);

  const displayName = post.author.firstName
    ? `${post.author.firstName} ${post.author.lastName || ''}`.trim()
    : post.author.username;

  const timeAgo = getTimeAgo(parseDate(post.createdAt));

  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const linkedPreviewUrl = typeof post.payload?.linkedUrl === 'string' && post.payload.linkedUrl.trim() ? String(post.payload.linkedUrl) : null;
  const linkedPreviewImage = typeof post.payload?.linkedImage === 'string' && post.payload.linkedImage.trim() ? String(post.payload.linkedImage) : null;
  const linkedPreviewTitle = typeof post.payload?.linkedTitle === 'string' && post.payload.linkedTitle.trim() ? String(post.payload.linkedTitle) : linkedPreviewUrl;
  const linkedPreviewDescription = typeof post.payload?.linkedDescription === 'string' ? String(post.payload.linkedDescription) : null;
  const linkedPreviewSiteName = typeof post.payload?.linkedSiteName === 'string' && post.payload.linkedSiteName.trim() ? String(post.payload.linkedSiteName) : null;

  return (
    <Card shadow="sm" padding="lg" radius="lg" withBorder style={{ borderColor: '#EAF7FF' }}>
      <Group justify="space-between" mb="sm">
        <Group>
          <Link href={`/profile/${post.author.id}`} style={{ display: 'inline-block' }}>
            <Avatar src={getUploadUrl(post.author.avatar) || '/default-avatar.svg'} alt={post.author.username} radius="xl" color="pastelBlue">
              {post.author.username.charAt(0).toUpperCase()}
            </Avatar>
          </Link>
          <div>
            <Text fw={600} size="sm">
              <Link href={`/profile/${post.author.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                {displayName}
              </Link>
            </Text>
            <Text size="xs" c="dimmed">
              <Link href={`/profile/${post.author.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                @{post.author.username}
              </Link>
              {' · '}
              <Link href={`/posts/${post.id}`} style={{ color: 'inherit', textDecoration: 'underline' }}>
                {timeAgo}
              </Link>
            </Text>
          </div>
        </Group>
        {post.mood && (
          <Badge variant="light" color="pastelBlue" size="lg">
            {moodEmojis[post.mood] || '💭'} {post.mood}
          </Badge>
        )}
        {!preview && (
        <Menu withinPortal position="bottom-end" shadow="sm">
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray">
              <IconDotsVertical size={20} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item color="red" onClick={handleReport} leftSection={<IconFlag size={16} />}>
              Signaler
            </Menu.Item>
            {canModifyPost && (
              <>
                <Menu.Item onClick={handleEdit}>
                  <Group gap="xs" align="center">
                    <IconPencil size={16} />
                    Modifier
                  </Group>
                </Menu.Item>
                <Menu.Item onClick={handleDelete}>
                  <Group gap="xs" align="center">
                    <IconTrash size={16} />
                    Supprimer
                  </Group>
                </Menu.Item>
              </>
            )}
            {isAdmin && (
              <Menu.Item onClick={handleModerate}>
                <Group gap="xs" align="center">
                  <IconFlag size={16} />
                  Modérer ce message
                </Group>
              </Menu.Item>
            )}
          </Menu.Dropdown>
        </Menu>
        )}
      </Group>

      {!preview && (
      <DeletePostModal opened={deleteModalOpened} onClose={() => setDeleteModalOpened(false)} post={post} />
      )}
      {isEditing ? (
        <div style={{ marginBottom: 16 }}>
          <Textarea
            value={editedContent}
            onChange={(event) => setEditedContent(event.currentTarget.value)}
            autosize
            minRows={3}
            maxRows={8}
            mb="sm"
          />
          <Button size="sm" color="pastelBlue" onClick={handleSaveEdit} loading={updatePost.isPending}>
            Modifier
          </Button>
        </div>
      ) : (
        <Text size="md" mb="md" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
          {content}
        </Text>
      )}

      {linkedPreviewUrl ? (
        <OGPreviewPostComponent
          url={linkedPreviewUrl}
          fallbackTitle={linkedPreviewTitle}
          fallbackDescription={linkedPreviewDescription || undefined}
          fallbackImage={linkedPreviewImage || undefined}
          fallbackSiteName={linkedPreviewSiteName || undefined}
        />
      ) : null}

      {post.attachments && post.attachments.length > 0 && (
        <Stack gap="xs" mb="md">
          {post.attachments.map((a) => (
            <div key={a.id}>
              {a.mimeType?.startsWith('image/') ? (
                <img
                  src={getUploadUrl(a.path)}
                  alt={a.filename}
                  style={{ maxWidth: '100%', borderRadius: 8, cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedImage(a.path);
                    setImageModalOpen(true);
                  }}
                />
              ) : a.mimeType?.startsWith('audio/') ? (
                <AudioPlayer src={a.path} filename={a.filename} />
              ) : (
                <a href={getUploadUrl(a.path)} target="_blank" rel="noreferrer">{a.filename}</a>
              )}
            </div>
          ))}
        </Stack>
      )}

      <ViewImageModal
        opened={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        imageSrc={selectedImage || ''}
        post={post}
      />

      <Group justify="space-between">
        <Group gap="lg">
          <Group gap={4}>
            <ActionIcon
              variant="subtle"
              color={post.isLikedByMe ? 'red' : 'gray'}
              onClick={handleLike}
              loading={toggleLike.isPending}
              disabled={preview}
            >
              {post.isLikedByMe ? <IconHeartFilled size={20} /> : <IconHeart size={20} />}
            </ActionIcon>
            <Text size="sm" c="dimmed">
              {post.likesCount}
            </Text>
          </Group>
          <Group gap={4}>
            <ActionIcon variant="subtle" color="gray" 
              disabled={preview} onClick={() => setShowComments(!showComments)}>
              <IconMessageCircle size={20} />
            </ActionIcon>
            <Text size="sm" c="dimmed">
              {post.commentsCount}
            </Text>
          </Group>
        </Group>
      </Group>

      {showComments && (
        <CommentComponent
          comments={post.comments}
          postId={post.id}
          showCreate={!preview && isAuthenticated}
        />
      )}
    </Card>
  );
}
