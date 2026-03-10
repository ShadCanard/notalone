import { Card, Group, Text, Avatar, ActionIcon, Stack, Badge, Textarea, Button } from '@mantine/core';
import Link from 'next/link';
import { IconHeart, IconHeartFilled, IconMessageCircle } from '@tabler/icons-react';
import { useToggleLike, useCreateComment } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';

interface PostCardProps {
  post: {
    id: string;
    content: string;
    mood?: string;
    createdAt: string;
    likesCount: number;
    commentsCount: number;
    isLikedByMe: boolean;
    author: {
      id: string;
      username: string;
      firstName?: string;
      lastName?: string;
      avatar?: string;
    };
    comments: Array<{
      id: string;
      content: string;
      createdAt: string;
      author: { id: string; username: string; avatar?: string };
    }>;
  };
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

export default function PostCard({ post }: PostCardProps) {
  const { isAuthenticated } = useAuth();
  const toggleLike = useToggleLike();
  const createComment = useCreateComment();
  const [showComments, setShowComments] = useState(() => (post.comments && post.comments.length > 0));
  const [commentText, setCommentText] = useState('');

  const handleLike = () => {
    if (!isAuthenticated) {
      notifications.show({ title: 'Connexion requise', message: 'Connecte-toi pour soutenir ce post', color: 'pastelBlue' });
      return;
    }
    toggleLike.mutate({ postId: post.id });
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    createComment.mutate(
      { postId: post.id, content: commentText },
      {
        onSuccess: () => {
          setCommentText('');
          notifications.show({ title: 'Commentaire ajouté', message: 'Merci pour ton soutien ! 🧡', color: 'green' });
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

  function parseDate(s: string) {
    const n = Number(s);
    return isNaN(n) ? new Date(String(s)) : new Date(n);
  }

  const timeAgo = getTimeAgo(parseDate(post.createdAt));

  return (
    <Card shadow="sm" padding="lg" radius="lg" withBorder style={{ borderColor: '#EAF7FF' }}>
      <Group justify="space-between" mb="sm">
        <Group>
          <Link href={`/profile/${post.author.id}`} legacyBehavior>
            <a style={{ display: 'inline-block' }}>
              <Avatar src={post.author.avatar || '/default-avatar.svg'} alt={post.author.username} radius="xl" color="pastelBlue">
                {post.author.username.charAt(0).toUpperCase()}
              </Avatar>
            </a>
          </Link>
          <div>
            <Text fw={600} size="sm">
              <Link href={`/profile/${post.author.id}`} legacyBehavior>
                <a style={{ color: 'inherit', textDecoration: 'none' }}>{displayName}</a>
              </Link>
            </Text>
            <Text size="xs" c="dimmed">
              <Link href={`/profile/${post.author.id}`} legacyBehavior>
                <a style={{ color: 'inherit', textDecoration: 'none' }}>@{post.author.username}</a>
              </Link>
              {' · '}
              <Link href={`/posts/${post.id}`} legacyBehavior>
                <a style={{ color: 'inherit', textDecoration: 'underline' }}>{timeAgo}</a>
              </Link>
            </Text>
          </div>
        </Group>
        {post.mood && (
          <Badge variant="light" color="pastelBlue" size="lg">
            {moodEmojis[post.mood] || '💭'} {post.mood}
          </Badge>
        )}
      </Group>

      <Text size="md" mb="md" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
        {post.content}
      </Text>

      <Group justify="space-between">
        <Group gap="lg">
          <Group gap={4}>
            <ActionIcon
              variant="subtle"
              color={post.isLikedByMe ? 'red' : 'gray'}
              onClick={handleLike}
              loading={toggleLike.isPending}
            >
              {post.isLikedByMe ? <IconHeartFilled size={20} /> : <IconHeart size={20} />}
            </ActionIcon>
            <Text size="sm" c="dimmed">
              {post.likesCount}
            </Text>
          </Group>
          <Group gap={4}>
            <ActionIcon variant="subtle" color="gray" onClick={() => setShowComments(!showComments)}>
              <IconMessageCircle size={20} />
            </ActionIcon>
            <Text size="sm" c="dimmed">
              {post.commentsCount}
            </Text>
          </Group>
        </Group>
      </Group>

          {showComments && (
        <Stack gap="sm" mt="md" pt="md" style={{ borderTop: '1px solid #EAF7FF' }}>
          {post.comments.map((comment) => (
            <Group key={comment.id} gap="sm" align="flex-start">
              <Link href={`/profile/${comment.author.id}`} legacyBehavior>
                <a style={{ display: 'inline-block' }}>
                  <Avatar src={comment.author.avatar || '/default-avatar.svg'} size="sm" radius="xl" color="pastelBlue">
                    {comment.author.username.charAt(0).toUpperCase()}
                  </Avatar>
                </a>
              </Link>
              <div style={{ flex: 1 }}>
                <Group gap="xs">
                  <Text size="sm" fw={600}>
                    <Link href={`/profile/${comment.author.id}`} legacyBehavior>
                      <a style={{ color: 'inherit', textDecoration: 'none' }}>@{comment.author.username}</a>
                    </Link>
                  </Text>
                  <Text size="xs" c="dimmed">
                    {getTimeAgo(parseDate(comment.createdAt))}
                  </Text>
                </Group>
                <Text size="sm">{comment.content}</Text>
              </div>
            </Group>
          ))}

          {isAuthenticated && (
            <Group align="flex-end">
              <Textarea
                placeholder="Écris un message de soutien..."
                value={commentText}
                onChange={(e) => setCommentText(e.currentTarget.value)}
                style={{ flex: 1 }}
                autosize
                minRows={1}
                maxRows={3}
              />
              <Button
                color="pastelBlue"
                onClick={handleComment}
                loading={createComment.isPending}
                disabled={!commentText.trim()}
              >
                Envoyer
              </Button>
            </Group>
          )}
        </Stack>
      )}
    </Card>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes}min`;
  if (hours < 24) return `il y a ${hours}h`;
  if (days < 7) return `il y a ${days}j`;
  return date.toLocaleDateString('fr-FR');
}
