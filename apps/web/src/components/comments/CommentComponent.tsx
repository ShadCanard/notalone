import { Group, Text, Avatar, Stack, Menu, ActionIcon, Textarea, Button, Box } from '@mantine/core';
import Link from 'next/link';
import { IconDotsVertical, IconPencil, IconTrash, IconX, IconCheck } from '@tabler/icons-react';
import { getUploadUrl } from '@/lib/uploads';
import { getTimeAgo, parseDate } from '@/lib/tools';
import CreateCommentComponent from '@/components/comments/CreateCommentComponent';
import DeleteCommentModal from '@/components/comments/DeleteCommentModal';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { useDeleteComment, useUpdateComment } from '@/hooks/useApi';
import { notifications } from '@mantine/notifications';
import type { Comment } from '@/types';

interface CommentComponentProps {
  comments: Comment[];
  postId: string;
  showCreate?: boolean;
  preview?: boolean;
}

export default function CommentComponent({ comments, postId, showCreate = false, preview = false }: CommentComponentProps) {
  const { user } = useAuth();
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null);

  const startEdit = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
  };

  const cancelEdit = () => {
    setEditingCommentId(null);
    setEditingContent('');
  };

  const saveEdit = (commentId: string) => {
    if (!editingContent.trim()) return;
    updateComment.mutate(
      { id: commentId, content: editingContent },
      {
        onSuccess: () => {
          setEditingCommentId(null);
          setEditingContent('');
          notifications.show({ title: 'Commentaire modifié', message: 'Ton commentaire a été mis à jour.', color: 'green' });
        },
        onError: (error: any) => {
          notifications.show({ title: 'Erreur', message: error?.message || 'Impossible de modifier le commentaire.', color: 'red' });
        },
      }
    );
  };

  const handleDelete = (commentId: string) => {
    setCommentToDelete(comments.find((comment) => comment.id === commentId) ?? null);
  };

  const confirmDelete = (commentId: string) => {
    deleteComment.mutate(
      { id: commentId },
      {
        onSuccess: () => {
          setCommentToDelete(null);
          notifications.show({ title: 'Commentaire supprimé', message: 'Le commentaire a bien été supprimé.', color: 'green' });
        },
        onError: (error: any) => {
          notifications.show({ title: 'Erreur', message: error?.message || 'Impossible de supprimer le commentaire.', color: 'red' });
        },
      }
    );
  };

  return (
    <Stack gap="sm" mt="md" pt="md" style={{ borderTop: '1px solid #EAF7FF' }}>
      {comments.map((comment) => {
        const canManage = !preview && user?.id === comment.author.id;
        const isEditing = editingCommentId === comment.id;
        return (
          <Group key={comment.id} gap="sm" align="flex-start" style={{ width: '100%', minWidth: 0 }}>
            <Link href={`/profile/${comment.author.id}`} legacyBehavior>
              <a style={{ display: 'inline-block' }}>
                <Avatar src={getUploadUrl(comment.author.avatar) || '/default-avatar.svg'} size="sm" radius="xl" color="pastelBlue">
                  {comment.author.username.charAt(0).toUpperCase()}
                </Avatar>
              </a>
            </Link>
            <Box style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 8, flexWrap: 'wrap' }}>
                <Group gap="xs" style={{ minWidth: 0, flex: 1 }}>
                  <Text size="sm" fw={600} style={{ minWidth: 0 }}>
                    <Link href={`/profile/${comment.author.id}`} legacyBehavior>
                      <a style={{ color: 'inherit', textDecoration: 'none' }}>@{comment.author.username}</a>
                    </Link>
                  </Text>
                  <Text size="xs" c="dimmed">
                    {getTimeAgo(parseDate(comment.createdAt))}
                  </Text>
                </Group>
                {canManage ? (
                  <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                    <Menu withinPortal position="bottom-end" shadow="sm">
                      <Menu.Target>
                        <ActionIcon variant="subtle" color="gray">
                          <IconDotsVertical size={18} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item onClick={() => startEdit(comment)}>
                          <Group gap="xs" align="center">
                            <IconPencil size={16} />
                            Modifier
                          </Group>
                        </Menu.Item>
                        <Menu.Item onClick={() => handleDelete(comment.id)}>
                          <Group gap="xs" align="center">
                            <IconTrash size={16} />
                            Supprimer
                          </Group>
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </div>
                ) : null}
              </div>
              {isEditing ? (
                <div>
                  <Textarea
                    value={editingContent}
                    onChange={(event) => setEditingContent(event.currentTarget.value)}
                    autosize
                    minRows={2}
                    maxRows={6}
                    mb="xs"
                  />
                  <Group gap="xs" mt="xs">
                    <Button size="xs" variant="outline" onClick={cancelEdit}>
                      <IconX size={14} style={{ marginRight: 8 }} />
                      Annuler
                    </Button>
                    <Button size="xs" color="pastelBlue" onClick={() => saveEdit(comment.id)} loading={updateComment.isPending}>
                      <IconCheck size={14} style={{ marginRight: 8 }} />
                      Sauvegarder
                    </Button>
                  </Group>
                </div>
              ) : (
                <Text size="sm">{comment.content}</Text>
              )}
            </Box>
          </Group>
        );
      })}
      {showCreate ? <CreateCommentComponent postId={postId} /> : null}
      <DeleteCommentModal
        opened={Boolean(commentToDelete)}
        onClose={() => setCommentToDelete(null)}
        comment={commentToDelete}
        postId={postId}
        onConfirm={() => commentToDelete && confirmDelete(commentToDelete.id)}
      />
    </Stack>
  );
}

