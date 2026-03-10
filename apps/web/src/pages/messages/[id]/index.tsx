import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages, useSendMessage } from '@/hooks/useApi';
import { Container, Title, Text, Card, Center, Loader, Stack, Textarea, Button } from '@mantine/core';

export default function MessagesUserPage() {
  const router = useRouter();
  const { id } = router.query;
  const userId = typeof id === 'string' ? id : undefined;
  const { data, isLoading } = useMessages(userId);
  const sendMessage = useSendMessage();
  const { isAuthenticated } = useAuth();
  const [content, setContent] = useState('');

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  if (!userId) return null;

  return (
    <Layout>
      <Head>
        <title>Messages — Conversation</title>
      </Head>

      <Container size="sm" py="xl">
        <Title order={2} mb="md">Conversation — {userId}</Title>

        {isLoading && (
          <Center py="xl"><Loader /></Center>
        )}

        <Stack gap="sm">
          {data?.messages?.filter(m => m.sender.id === userId).map((m) => (
            <Card key={m.id} padding="md">
              <Text size="sm" c="dimmed">{new Date(String(m.createdAt)).toLocaleString('fr-FR')}</Text>
              <Text mt="sm">{m.content}</Text>
            </Card>
          ))}

          <Card padding="md">
            <Textarea placeholder="Écrire un message..." value={content} onChange={(e) => setContent(e.currentTarget.value)} autosize minRows={2} />
            <Button mt="sm" color="pastelBlue" onClick={() => { if (!content.trim()) return; sendMessage.mutate({ receiverId: userId, content }, { onSuccess: () => setContent('') }); }}>Envoyer</Button>
          </Card>
        </Stack>
      </Container>
    </Layout>
  );
}
