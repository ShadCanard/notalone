import { Container, Title, Text, Card, Stack, Center } from '@mantine/core';
import { IconMessageCircle } from '@tabler/icons-react';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Head from 'next/head';

export default function MessagesPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <Layout>
      <Head>
        <title>Messages - NotAlone</title>
      </Head>

      <Container size="sm" py="xl">
        <Stack gap="xl">
          <Title order={2} c="pastelBlue.8">
            Messages
          </Title>

          <Card radius="lg" padding="xl" withBorder style={{ borderColor: '#EAF7FF' }}>
            <Center py="xl">
              <Stack align="center" gap="md">
                <IconMessageCircle size={64} color="#6ccfff" />
                <Text c="dimmed" ta="center" size="lg">
                  Tes conversations apparaîtront ici
                </Text>
                <Text c="dimmed" ta="center" size="sm">
                  Envoie un message à quelqu&apos;un de la communauté pour commencer une conversation bienveillante 💙
                </Text>
              </Stack>
            </Center>
          </Card>
        </Stack>
      </Container>
    </Layout>
  );
}
