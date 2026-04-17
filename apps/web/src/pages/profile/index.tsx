import { Container, Card, Title, Text, Stack, Avatar, Center, Loader } from '@mantine/core';
import { getUploadUrl } from '@/lib/uploads';
import { IconUser } from '@tabler/icons-react';
import Layout from '@/components/layout/Layout';
import { useMe, useUser } from '@/hooks/useApi';
import FeedComponent from '@/components/posts/FeedComponent';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Head from 'next/head';

export default function ProfilePage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const { data, isLoading } = useMe();
  const userId = data?.me?.id || user?.id;
  const { data: userData } = useUser(userId);


  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);


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
            userId={userId}
            posts={userData?.user?.posts ?? []}
            emptyStateMessage="Tu n'as pas encore partagé de post. Commence dès maintenant !"
          />
        </Stack>
      </Container>
    </Layout>
  );
}

