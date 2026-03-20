import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { } from 'react';
import Head from 'next/head';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/hooks/useApi';
import { Container, Title, Text, Card, Center, Loader, Avatar, Stack, Button } from '@mantine/core';
import { getUploadUrl } from '@/lib/uploads';
import PostCard from '@/components/PostCard';

export default function PublicProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  const { data, isLoading } = useUser(typeof id === 'string' ? id : undefined);
  const { isAuthenticated } = useAuth();



  if (isLoading) {
    return (
      <Layout>
        <Center py="xl">
          <Loader />
        </Center>
      </Layout>
    );
  }

  const user = data?.user;

  return (
    <Layout>
      <Head>
        <title>{`Profil — ${user?.username || 'Utilisateur'}`}</title>
      </Head>

      <Container size="sm" py="xl">
        {!user && (
          <Card radius="lg" padding="xl">
            <Text c="dimmed">Utilisateur introuvable.</Text>
          </Card>
        )}

        {user && (
          <Stack gap="md">
            <Card radius="xl" padding="xl" style={{ border: 'none' }}>
              <Stack align="center">
                <Avatar src={getUploadUrl(user.avatar) || '/default-avatar.svg'} size={100} radius="xl" color="pastelBlue" variant="filled">
                  {user.username?.charAt(0).toUpperCase()}
                </Avatar>
                <Title order={2}>@{user.username}</Title>
                {user.firstName || user.lastName ? <Text c="dimmed">{`${user.firstName || ''} ${user.lastName || ''}`.trim()}</Text> : null}
                {user.bio && <Text>{user.bio}</Text>}
                <Text size="sm" c="dimmed">Membre depuis: {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : '—'}</Text>
                {isAuthenticated && <Button onClick={() => router.push('/messages')}>Envoyer un message</Button>}
              </Stack>
            </Card>

            {(user as any).posts && (user as any).posts.length > 0 && (
              <Stack gap="md">
                <Title order={3}>Posts</Title>
                {(user as any).posts.map((p: any) => (
                  <PostCard key={p.id} post={p} />
                ))}
              </Stack>
            )}
          </Stack>
        )}
      </Container>
    </Layout>
  );
}
