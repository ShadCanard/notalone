import { Card, Textarea, Button, Group, Select, Switch, Stack, FileButton, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useCreatePost, useUploadAttachments } from '@/hooks/useApi';
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
  const uploadAttachments = useUploadAttachments();

  const form = useForm({
    initialValues: {
      content: '',
      mood: '',
      isPublic: true,
      files: [] as File[],
    },
    validate: {
      content: (value) => (value.trim().length < 1 ? 'Écris quelque chose...' : null),
    },
  });

  const handleSubmit = form.onSubmit(async (values) => {
    try {
      let attachmentIds: string[] | undefined = undefined;
      if (values.files && values.files.length > 0) {
        const res = await uploadAttachments.mutateAsync(values.files as File[]);
        attachmentIds = res.attachments.map((a) => a.id);
      }

      await createPost.mutateAsync({ content: values.content, mood: values.mood || undefined, isPublic: values.isPublic, attachmentIds });
      form.reset();
      notifications.show({ title: 'Post publié !', message: 'Merci de partager avec la communauté 💙', color: 'green' });
    } catch (e) {
      notifications.show({ title: 'Erreur', message: 'Impossible de publier le post. Réessaie.', color: 'red' });
    }
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
              <FileButton
                onChange={(file) => {
                  if (!file) return;
                  // support multiple files by appending
                  const prev = (form.values as any).files || [];
                  form.setFieldValue('files', [...prev, file]);
                }}
                accept="image/*,audio/*"
              >
                {(props) => <Button {...props}>Ajouter fichier</Button>}
              </FileButton>
              {(form.values as any).files && (form.values as any).files.length > 0 && (
                <Text size="xs" c="dimmed">{(form.values as any).files.map((f: File) => f.name).join(', ')}</Text>
              )}
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
