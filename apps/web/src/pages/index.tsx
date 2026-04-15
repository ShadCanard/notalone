import { useEffect, useRef } from 'react';
import { Container, Title, Text, Stack, Center, Loader, Alert, Card, Group, ThemeIcon } from '@mantine/core';
import { IconHeart, IconUsers, IconSun } from '@tabler/icons-react';
import Layout from '@/components/layout/Layout';
import PostCard from '@/components/posts/PostCard';
import CreatePostForm from '@/components/posts/CreatePostForm';
import { usePosts } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import Head from 'next/head';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = usePosts();
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

  useEffect(() => {
    if (!loaderRef.current || !hasNextPage) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    }, { rootMargin: '200px' });

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage]);

  return (
    <Layout>
      <Head>
        <title>NotAlone - Tu n&apos;es pas seul(e)</title>
        <meta name="description" content="Réseau social bienveillant pour lutter contre la dépression et l'isolement" />
      </Head>

      <Container size="sm" py="xl">
        <Stack gap="xl">
          {/* Hero Section */}
              <Card
            radius="xl"
            padding="xl"
            style={{
              border: 'none',
            }}
          >
            <Stack align="center" gap="md">
              <Title order={1} ta="center" c="pastelBlue.8" fw={800}>
                Bienvenue sur NotAlone 🧡
              </Title>
              <Text ta="center" size="lg" c="pastelBlue.7" maw={500}>
                Un espace bienveillant où chaque voix compte. Partage tes pensées, soutiens les autres, et rappelle-toi : tu n&apos;es jamais seul(e).
              </Text>
              <Group gap="xl" mt="md">
                <Group gap="xs">
                  <ThemeIcon color="pastelBlue" variant="light" size="lg" radius="xl">
                    <IconHeart size={20} />
                  </ThemeIcon>
                  <Text size="sm" fw={500}>Bienveillance</Text>
                </Group>
                <Group gap="xs">
                  <ThemeIcon color="pastelBlue" variant="light" size="lg" radius="xl">
                    <IconUsers size={20} />
                  </ThemeIcon>
                  <Text size="sm" fw={500}>Communauté</Text>
                </Group>
                <Group gap="xs">
                  <ThemeIcon color="pastelBlue" variant="light" size="lg" radius="xl">
                    <IconSun size={20} />
                  </ThemeIcon>
                  <Text size="sm" fw={500}>Espoir</Text>
                </Group>
              </Group>
            </Stack>
          </Card>

          {/* Create Post Form */}
          {isAuthenticated && <CreatePostForm />}

          {/* Posts Feed */}
          {isLoading && (
            <Center py="xl">
              <Loader color="pastelBlue" size="lg" />
            </Center>
          )}

          {error && (
            <Alert color="red" title="Erreur">
              Impossible de charger les posts. Vérifie que le serveur est bien lancé.
            </Alert>
          )}

          {posts.length === 0 && !isLoading && !error && (
            <Card padding="xl" radius="lg" withBorder style={{ borderColor: '#FFE8CC' }}>
              <Text ta="center" c="dimmed" size="lg">
                Pas encore de posts. Sois le premier à partager ! 🌟
              </Text>
            </Card>
          )}

          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}

          <div ref={loaderRef} />

          {isFetchingNextPage && (
            <Center py="xl">
              <Loader color="pastelBlue" size="lg" />
            </Center>
          )}
        </Stack>
      </Container>
    </Layout>
  );
}

