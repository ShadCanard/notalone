import { Card, Textarea, Button, Group, Select, Switch, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useCreatePost } from '@/hooks/useApi';
import { notifications } from '@mantine/notifications';

const moodOptions = [
  { value: 'happy', label: '😊 Content(e)' },
  { value: 'grateful', label: '🙏 Reconnaissant(e)' },
  { value: 'hopeful', label: '🌟 Plein(e) d\'espoir' },
  { value: 'calm', label: '😌 Apaisé(e)' },
  { value: 'loved', label: '🥰 Aimé(e)' },
  { value: 'strong', label: '💪 Fort(e)' },
  { value: 'anxious', label: '😰 Anxieux(se)' },
  { value: 'sad', label: '😢 Triste' },
  { value: 'lonely', label: '🫂 Seul(e)' },
  { value: 'struggling', label: '🌧️ En difficulté' },
];

export default function CreatePostForm() {
  const createPost = useCreatePost();

  const form = useForm({
    initialValues: {
      content: '',
      mood: '',
      isPublic: true,
    },
    validate: {
      content: (value) => (value.trim().length < 1 ? 'Écris quelque chose...' : null),
    },
  });

  const handleSubmit = form.onSubmit((values) => {
    createPost.mutate(
      {
        content: values.content,
        mood: values.mood || undefined,
        isPublic: values.isPublic,
      },
      {
        onSuccess: () => {
          form.reset();
          notifications.show({
            title: 'Post publié !',
            message: 'Merci de partager avec la communauté 💙',
            color: 'green',
          });
        },
        onError: () => {
          notifications.show({
            title: 'Erreur',
            message: 'Impossible de publier le post. Réessaie.',
            color: 'red',
          });
        },
      }
    );
  });

  return (
    <Card shadow="sm" padding="lg" radius="lg" withBorder style={{ borderColor: '#EAF7FF' }}>
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Textarea
            placeholder="Comment te sens-tu aujourd'hui ? Partage tes pensées, tes victoires, ou ce qui te pèse... Tu n'es pas seul(e) 🧡"
            autosize
            minRows={3}
            maxRows={8}
            {...form.getInputProps('content')}
          />

          <Group justify="space-between" align="flex-end">
            <Group>
              <Select
                placeholder="Ton humeur"
                data={moodOptions}
                clearable
                styles={{ input: { width: 200 } }}
                {...form.getInputProps('mood')}
              />
              <Switch
                label="Public"
                color="pastelBlue"
                {...form.getInputProps('isPublic', { type: 'checkbox' })}
              />
            </Group>

            <Button type="submit" color="pastelBlue" loading={createPost.isPending}>
              Partager
            </Button>
          </Group>
        </Stack>
      </form>
    </Card>
  );
}
