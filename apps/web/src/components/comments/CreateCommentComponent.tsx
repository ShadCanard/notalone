import { useState } from 'react';
import { Group, Textarea, Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useCreateComment } from '@/hooks/useApi';

interface CreateCommentComponentProps {
  postId: string;
}

export default function CreateCommentComponent({ postId }: CreateCommentComponentProps) {
  const [commentText, setCommentText] = useState('');
  const createComment = useCreateComment();

  const handleSubmit = () => {
    if (!commentText.trim()) return;
    createComment.mutate(
      { postId, content: commentText },
      {
        onSuccess: () => {
          setCommentText('');
          notifications.show({ title: 'Commentaire ajouté', message: 'Merci pour ton soutien ! 🧡', color: 'green' });
        },
        onError: (error: unknown) => {
          const message = error instanceof Error ? error.message : 'Impossible d\'envoyer le commentaire.';
          notifications.show({ title: 'Erreur', message, color: 'red' });
        },
      }
    );
  };

  return (
    <Group align="flex-end" style={{ width: '100%' }}>
      <Textarea
        placeholder="Écris un message de soutien..."
        value={commentText}
        onChange={(event) => setCommentText(event.currentTarget.value)}
        style={{ flex: 1 }}
        autosize
        minRows={1}
        maxRows={3}
      />
      <Button
        color="pastelBlue"
        onClick={handleSubmit}
        loading={createComment.isPending}
        disabled={!commentText.trim()}
      >
        Envoyer
      </Button>
    </Group>
  );
}
