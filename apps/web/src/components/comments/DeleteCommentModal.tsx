import { Group, Text, Button, Modal } from '@mantine/core';
import type { Comment } from '@/types';
import CommentComponent from './CommentComponent';

interface DeleteCommentModalProps {
  opened: boolean;
  onClose: () => void;
  comment: Comment | null;
  postId: string;
  onConfirm: () => void;
}

export default function DeleteCommentModal({ opened, onClose, comment, postId, onConfirm }: DeleteCommentModalProps) {
  if (!comment) {
    return null;
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Supprimer ce commentaire" centered>
      <Text size="sm" mb="md">
        Veux-tu vraiment supprimer ce commentaire ? Cette action est irréversible.
      </Text>
      <CommentComponent comments={[comment]} postId={postId} preview />
      <Group justify="space-between" p="xs">
        <Button variant="outline" onClick={onClose}>
          Annuler
        </Button>
        <Button color="red" onClick={onConfirm}>
          Supprimer
        </Button>
      </Group>
    </Modal>
  );
}
