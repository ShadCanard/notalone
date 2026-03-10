import { Card, Stack, TextInput, Textarea, Button, Avatar, Group, Title, FileButton, ActionIcon } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useMe, useUpdateProfile, useUploadAvatar } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useRef, useState } from 'react';
import { IconEdit } from '@tabler/icons-react';

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

  const inputRef = useRef<HTMLInputElement | null>(null);
  const [hovered, setHovered] = useState(false);

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
          <div
            style={{ position: 'relative', display: 'inline-block' }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <Avatar src={form.values.avatar || '/default-avatar.svg'} radius="xl" size={64} />

            <div
              role="button"
              onClick={() => inputRef.current?.click()}
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                background: hovered ? 'rgba(0,0,0,0.35)' : 'transparent',
                transition: 'background .12s ease',
                cursor: 'pointer',
              }}
            >
              <ActionIcon variant="filled" color="dark" size="sm" style={{ opacity: hovered ? 1 : 0, transition: 'opacity .12s' }}>
                <IconEdit size={16} />
              </ActionIcon>
            </div>
          </div>

          <div>
            <Title order={4}>Modifier mon profil</Title>
          </div>
        </Group>

        {/* hidden input used when clicking avatar overlay */}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            uploadAvatar.mutate(file, {
              onSuccess: (data: any) => {
                form.setFieldValue('avatar', data.url || '');
                notifications.show({ title: 'Avatar téléchargé', message: "L'avatar a été uploadé", color: 'green' });
              },
              onError: () => notifications.show({ title: 'Erreur', message: "Échec de l'upload", color: 'red' }),
            });
            // reset so same file can be selected again
            e.currentTarget.value = '';
          }}
        />

        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput label="Prénom" {...form.getInputProps('firstName')} />
            <TextInput label="Nom" {...form.getInputProps('lastName')} />
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
