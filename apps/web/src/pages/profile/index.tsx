import { Container, Card, Title, Text, TextInput, Textarea, Button, Stack, Avatar, Center, Loader, Alert } from '@mantine/core';
import { getUploadUrl } from '@/lib/uploads';
import { useForm } from '@mantine/form';
import { IconUser } from '@tabler/icons-react';
import Layout from '@/components/layout/Layout';
import { useMe, useUpdateProfile, useUser } from '@/hooks/useApi';
import FeedComponent from '@/components/posts/FeedComponent';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import Head from 'next/head';

export default function ProfilePage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const { data, isLoading } = useMe();
  const userId = data?.me?.id || user?.id;
  const { data: userData } = useUser(userId);
  const updateProfile = useUpdateProfile();

  const form = useForm({
    initialValues: {
      firstName: '',
      lastName: '',
      bio: '',
    },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (data?.me) {
      form.setValues({
        firstName: data.me.firstName || '',
        lastName: data.me.lastName || '',
        bio: data.me.bio || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.me]);

  const handleSubmit = form.onSubmit((values) => {
    updateProfile.mutate(values, {
      onSuccess: () => {
        notifications.show({
          title: 'Profil mis à jour !',
          message: 'Tes informations ont été sauvegardées 🧡',
          color: 'green',
        });
      },
      onError: () => {
        notifications.show({ title: 'Erreur', message: 'Impossible de mettre à jour le profil', color: 'red' });
      },
    });
  });

  if (!isAuthenticated) return null;

  if (isLoading) {
    return (
      <Layout>
        <Center py="xl">
          <Loader color="pastelBlue" />
        </Center>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Mon Profil - NotAlone</title>
      </Head>

      <Container size="sm" py="xl">
        <Stack gap="xl">
          <Card radius="xl" padding="xl" style={{ border: 'none' }}>
            <Stack align="center" gap="md">
              <Avatar src={getUploadUrl(user?.avatar) || '/default-avatar.svg'} size={100} radius="xl" color="pastelBlue" variant="filled">
                {user?.username?.charAt(0).toUpperCase() || <IconUser size={48} />}
              </Avatar>
              <Title order={2} c="pastelBlue.8">
                @{user?.username}
              </Title>
              <Text c="dimmed">{user?.email}</Text>
            </Stack>
          </Card>
        </Stack>

        <Stack gap="md" mt="xl">
          <Title order={3}>Mes posts</Title>
          <FeedComponent
            posts={(userData?.user as any)?.posts ?? []}
            emptyStateMessage="Tu n'as pas encore partagé de post. Commence dès maintenant !"
          />
        </Stack>
      </Container>
    </Layout>
  );
}

