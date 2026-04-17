import { Group, Text, Button, Modal } from '@mantine/core';
import { useDeletePost } from '@/hooks/useApi';
import { notifications } from '@mantine/notifications';
import type { Post } from '@/types';
import PostCard from './PostCard';

interface DeletePostModalProps {
  opened: boolean;
  onClose: () => void;
  post: Post;
}

export default function DeletePostModal({ opened, onClose, post }: DeletePostModalProps) {
  const deletePost = useDeletePost();


  const confirmDelete = () => {
    deletePost.mutate({ id: post.id }, {
      onSuccess: () => {
        onClose();
        notifications.show({ title: 'Post supprimé', message: 'Le post a bien été supprimé.', color: 'green' });
      },
      onError: (error: unknown) => {
        const message = error instanceof Error ? error.message : 'Impossible de supprimer le post.';
        notifications.show({ title: 'Erreur', message, color: 'red' });
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

