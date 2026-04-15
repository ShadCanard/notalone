import { Card, Group, Text, Button, Modal } from '@mantine/core';
import { useDeletePost } from '@/hooks/useApi';
import { notifications } from '@mantine/notifications';
import OGPreviewPostComponent from '@/components/posts/OGPreviewPostComponent';
import type { Post } from '@/types';
import PostCard from './PostCard';

interface DeletePostModalProps {
  opened: boolean;
  onClose: () => void;
  post: Post;
}

export default function DeletePostModal({ opened, onClose, post }: DeletePostModalProps) {
  const deletePost = useDeletePost();

  const linkedPreviewUrl = typeof post.payload?.linkedUrl === 'string' && post.payload.linkedUrl.trim() ? String(post.payload.linkedUrl) : null;
  const linkedPreviewImage = typeof post.payload?.linkedImage === 'string' && post.payload.linkedImage.trim() ? String(post.payload.linkedImage) : null;
  const linkedPreviewTitle = typeof post.payload?.linkedTitle === 'string' && post.payload.linkedTitle.trim() ? String(post.payload.linkedTitle) : linkedPreviewUrl;
  const linkedPreviewDescription = typeof post.payload?.linkedDescription === 'string' ? String(post.payload.linkedDescription) : null;
  const linkedPreviewSiteName = typeof post.payload?.linkedSiteName === 'string' && post.payload.linkedSiteName.trim() ? String(post.payload.linkedSiteName) : null;

  const confirmDelete = () => {
    deletePost.mutate({ id: post.id }, {
      onSuccess: () => {
        onClose();
        notifications.show({ title: 'Post supprimé', message: 'Le post a bien été supprimé.', color: 'green' });
      },
      onError: (error: any) => {
        notifications.show({ title: 'Erreur', message: error?.message || 'Impossible de supprimer le post.', color: 'red' });
      },
    });
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Supprimer ce post" centered>
      <Text size="sm" mb="md">
        Es-tu sûr de vouloir supprimer ce post ? Cette action est irréversible.
      </Text>
      <PostCard post={post} preview />
      <Group justify="space-between" p={'xs'}>
        <Button variant="outline" onClick={onClose}>
          Annuler
        </Button>
        <Button color="red" loading={deletePost.isPending} onClick={confirmDelete}>
          Supprimer
        </Button>
      </Group>
    </Modal>
  );
}

