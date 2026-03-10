import { Container, Card, Title, Text, TextInput, Textarea, Button, Stack, Avatar, Center, Loader, Alert } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconUser } from '@tabler/icons-react';
import Layout from '@/components/Layout';
import { useMe, useUpdateProfile, useUser } from '@/hooks/useApi';
import PostCard from '@/components/PostCard';
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
          <Card radius="xl" padding="xl" style={{ background: 'linear-gradient(135deg, #F6FBFF 0%, #EAF7FF 100%)', border: 'none' }}>
            <Stack align="center" gap="md">
              <Avatar src={user?.avatar || '/default-avatar.svg'} size={100} radius="xl" color="pastelBlue" variant="filled">
                {user?.username?.charAt(0).toUpperCase() || <IconUser size={48} />}
              </Avatar>
              <Title order={2} c="pastelBlue.8">
                @{user?.username}
              </Title>
              <Text c="dimmed">{user?.email}</Text>
            </Stack>
          </Card>

          <Card radius="lg" padding="xl" shadow="sm" withBorder style={{ borderColor: '#EAF7FF' }}>
            <Title order={3} mb="md">
              Modifier mon profil
            </Title>
            <form onSubmit={handleSubmit}>
              <Stack gap="md">
                <TextInput label="Prénom" placeholder="Ton prénom" {...form.getInputProps('firstName')} />
                <TextInput label="Nom" placeholder="Ton nom" {...form.getInputProps('lastName')} />
                <Textarea label="Bio" placeholder="Parle-nous un peu de toi..." autosize minRows={3} maxRows={6} {...form.getInputProps('bio')} />
                <Button type="submit" color="pastelBlue" loading={updateProfile.isPending}>
                  Sauvegarder
                </Button>
              </Stack>
            </form>
          </Card>

          <Alert color="pastelBlue" variant="light" radius="lg">
            <Text size="sm">
              💡 <strong>Astuce :</strong> Un profil complet aide les autres à mieux te connaître et facilite les échanges bienveillants.
            </Text>
          </Alert>
        </Stack>

        {userData?.user?.posts && userData.user.posts.length > 0 && (
          <Stack gap="md" mt="xl">
            <Title order={3}>Mes posts</Title>
            {userData.user.posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </Stack>
        )}
      </Container>
    </Layout>
  );
}
