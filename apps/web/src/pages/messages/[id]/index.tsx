import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages, useSendMessage, useSetTypingStatus, useUploadAttachments } from '@/hooks/useApi';
import PostPreview from '@/components/posts/PostPreview';
import type { Attachment } from '@/types';
import { Container, Title, Text, Card, Center, Loader, Stack, Textarea, Button, Badge, Box } from '@mantine/core';

export default function MessagesUserPage() {
  const router = useRouter();
  const { id } = router.query;
  const userId = typeof id === 'string' ? id : undefined;
  const { data, isLoading } = useMessages(userId);
  const sendMessage = useSendMessage();
  const uploadAttachments = useUploadAttachments();
  const setTypingStatus = useSetTypingStatus();
  const { isAuthenticated } = useAuth();
  const [content, setContent] = useState('');
  const [pendingAttachmentIds, setPendingAttachmentIds] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  const getLinkPayload = (text: string) => {
    const match = text.match(/https?:\/\/[\w\-./?&%#=]+/i);
    return match ? { linkedUrl: match[0] } : undefined;
  };

  const handleFileChange = async (files: FileList | null) => {
    if (!files?.length) return;
    setAttachmentError(null);
    try {
      const result = await uploadAttachments.mutateAsync(Array.from(files));
      const uploaded = result.attachments ?? [];
      setPendingAttachmentIds(uploaded.map((attachment) => attachment.id));
      setAttachments(uploaded);
    } catch (error) {
      console.error('[Messages] upload attachments failed', error);
      setAttachmentError('Échec de l’envoi des fichiers.');
    }
  };

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
              <Text mt="sm" style={{ whiteSpace: 'pre-wrap' }}>{m.content}</Text>
              <PostPreview attachments={m.attachments} payload={m.payload} />
            </Card>
          ))}

          <Card padding="md">
            <Textarea placeholder="Écrire un message..." value={content} onChange={(e) => setContent(e.currentTarget.value)} autosize minRows={2} />
            <input type="file" accept="image/*,audio/*" multiple onChange={(e) => handleFileChange(e.currentTarget.files)} style={{ width: '100%', marginTop: 12 }} />
            {attachmentError ? <Text size="xs" c="red">{attachmentError}</Text> : null}
            {attachments.length > 0 ? (
              <Box style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {attachments.map((attachment) => (
                  <Badge key={attachment.id} size="xs" variant="outline">
                    {attachment.filename}
                  </Badge>
                ))}
              </Box>
            ) : null}
            <Button
              mt="sm"
              color="pastelBlue"
              onClick={() => {
                if (!content.trim() && pendingAttachmentIds.length === 0) return;
                const payload = getLinkPayload(content.trim());
                sendMessage.mutate(
                  { receiverId: userId, content, attachmentIds: pendingAttachmentIds.length ? pendingAttachmentIds : undefined, payload },
                  {
                    onSuccess: () => {
                      setContent('');
                      setPendingAttachmentIds([]);
                      setAttachments([]);
                      setTypingStatus.mutate({ receiverId: userId, isTyping: false });
                    },
                  }
                );
              }}
            >
              Envoyer
            </Button>
          </Card>
        </Stack>
      </Container>
    </Layout>
  );
}
