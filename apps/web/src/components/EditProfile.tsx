import { Card, Stack, TextInput, Textarea, Button, Avatar, Group, Title, FileButton } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useMe, useUpdateProfile, useUploadAvatar } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export default function EditProfile() {
  const { data } = useMe();
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();

  const form = useForm({
    initialValues: {
      firstName: '',
      lastName: '',
      bio: '',
      avatar: '',
    },
  });

  useEffect(() => {
    const me = data?.me || user;
    if (me) {
      form.setValues({
        firstName: (me as any).firstName || '',
        lastName: (me as any).lastName || '',
        bio: (me as any).bio || '',
        avatar: (me as any).avatar || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, user]);

  const handleSubmit = form.onSubmit((values) => {
    updateProfile.mutate(values, {
      onSuccess: () => notifications.show({ title: 'Profil mis à jour', message: 'Tes informations ont été sauvegardées', color: 'green' }),
      onError: () => notifications.show({ title: 'Erreur', message: 'Impossible de mettre à jour le profil', color: 'red' }),
    });
  });

  return (
    <Card radius="md" padding="lg">
      <Stack>
        <Group>
          <Avatar src={form.values.avatar || '/default-avatar.svg'} radius="xl" size={64} />
          <div>
            <Title order={4}>Modifier mon profil</Title>
          </div>
        </Group>

        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput label="Prénom" {...form.getInputProps('firstName')} />
            <TextInput label="Nom" {...form.getInputProps('lastName')} />
            <Group align="flex-end">
              <TextInput label="Avatar (URL)" placeholder="https://..." sx={{ flex: 1 }} {...form.getInputProps('avatar')} />
              <FileButton
                onChange={(file) => {
                  if (!file) return;
                  uploadAvatar.mutate(file, {
                    onSuccess: (data: any) => {
                      form.setFieldValue('avatar', data.url || '');
                      notifications.show({ title: 'Avatar téléchargé', message: 'L\'avatar a été uploadé', color: 'green' });
                    },
                    onError: () => notifications.show({ title: 'Erreur', message: 'Échec de l\'upload', color: 'red' }),
                  });
                }}
                accept="image/*"
              >
                {(props) => (
                  <Button {...props} loading={uploadAvatar.isLoading} color="gray">
                    Télécharger
                  </Button>
                )}
              </FileButton>
            </Group>
            <Textarea label="Bio" minRows={3} {...form.getInputProps('bio')} />

            <Button type="submit" color="pastelBlue" loading={updateProfile.isPending}>
              Enregistrer
            </Button>
          </Stack>
        </form>
      </Stack>
    </Card>
  );
}
