import { useAuth } from '@/contexts/AuthContext';
import { Container, Title, Text, Stack, Card, Group, ThemeIcon } from '@mantine/core';
import { IconHeart, IconUsers, IconSun } from '@tabler/icons-react';
import Layout from '@/components/layout/Layout';
import CreatePostForm from '@/components/posts/CreatePostForm';
import FeedComponent from '@/components/posts/FeedComponent';
import Head from 'next/head';

export default function Home() {
  const { isAuthenticated } = useAuth();

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
          <FeedComponent />
        </Stack>
      </Container>
    </Layout>
  );
}

