import { Badge, Box, Group, Image, Menu, Stack, Text, Textarea, ActionIcon } from '@mantine/core';
import { IconFile, IconMusic, IconPhoto, IconPlus } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import { useSendMessage, useSetTypingStatus, useUploadAttachments } from '@/hooks/useApi';
import { getUploadUrl } from '@/lib/uploads';
import type { Attachment } from '@/types';

type CreateChatMessageFormProps = {
  conversationId: string;
};

const getLinkPayload = (text: string) => {
  const match = text.match(/https?:\/\/[\w\-./?&%#=]+/i);
  return match ? { linkedUrl: match[0] } : undefined;
};

export default function CreateChatMessageForm({ conversationId }: CreateChatMessageFormProps) {
  const [reply, setReply] = useState('');
  const [pendingAttachmentIds, setPendingAttachmentIds] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const sendMessage = useSendMessage();
  const setTypingStatus = useSetTypingStatus();
  const uploadAttachments = useUploadAttachments();
  const setTypingStatusRef = useRef(setTypingStatus);
  const stopTypingTimer = useRef<number | null>(null);
  const isTypingLocalRef = useRef(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const documentInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setTypingStatusRef.current = setTypingStatus;
  }, [setTypingStatus]);

  const handleFileChange = async (files: FileList | null) => {
    if (!files?.length) return;
    setAttachmentError(null);
    try {
      const fileArray = Array.from(files);
      const result = await uploadAttachments.mutateAsync(fileArray);
      const uploaded = result.attachments ?? [];
      setPendingAttachmentIds(uploaded.map((attachment) => attachment.id));
      setAttachments(uploaded);
    } catch (error) {
      console.error('[Chat] upload attachments failed', error);
      setAttachmentError('Échec de l’envoi des fichiers.');
    }
  };

  const handleAttachmentTypeSelect = (type: 'image' | 'document' | 'audio') => {
    if (type === 'image') {
      imageInputRef.current?.click();
      return;
    }
    if (type === 'audio') {
      audioInputRef.current?.click();
      return;
    }
    documentInputRef.current?.click();
  };

  const resetTypingTimeout = () => {
    if (stopTypingTimer.current) {
      window.clearTimeout(stopTypingTimer.current);
    }
    stopTypingTimer.current = window.setTimeout(async () => {
      if (isTypingLocalRef.current) {
        await setTypingStatusRef.current.mutateAsync({ receiverId: conversationId, isTyping: false });
        isTypingLocalRef.current = false;
      }
      stopTypingTimer.current = null;
    }, 3000);
  };

  const handleTyping = () => {
    if (!isTypingLocalRef.current) {
      isTypingLocalRef.current = true;
      void setTypingStatusRef.current.mutateAsync({ receiverId: conversationId, isTyping: true });
    }
    resetTypingTimeout();
  };

  const handleSend = async () => {
    const trimmed = reply.trim();
    if (!trimmed && pendingAttachmentIds.length === 0) return;

    const payload = getLinkPayload(trimmed || '');
    try {
      await sendMessage.mutateAsync({
        receiverId: conversationId,
        content: trimmed,
        attachmentIds: pendingAttachmentIds.length ? pendingAttachmentIds : undefined,
        payload,
      });
      setReply('');
      setPendingAttachmentIds([]);
      setAttachments([]);
      if (stopTypingTimer.current) {
        window.clearTimeout(stopTypingTimer.current);
        stopTypingTimer.current = null;
      }
      if (isTypingLocalRef.current) {
        await setTypingStatusRef.current.mutateAsync({ receiverId: conversationId, isTyping: false });
        isTypingLocalRef.current = false;
      }
    } catch {
      // ignore send failures for now
    }
  };

  useEffect(() => {
    return () => {
      if (stopTypingTimer.current) {
        window.clearTimeout(stopTypingTimer.current);
      }
      if (isTypingLocalRef.current) {
        void setTypingStatusRef.current.mutateAsync({ receiverId: conversationId, isTyping: false });
        isTypingLocalRef.current = false;
      }
    };
  }, [conversationId]);

  const imageAttachments = attachments.filter((attachment) => attachment.mimeType?.startsWith('image/'));

  return (
    <Stack gap="xs">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(event) => {
          handleFileChange(event.currentTarget.files);
          event.currentTarget.value = '';
        }}
        style={{ display: 'none' }}
      />
      <input
        ref={documentInputRef}
        type="file"
        multiple
        onChange={(event) => {
          handleFileChange(event.currentTarget.files);
          event.currentTarget.value = '';
        }}
        style={{ display: 'none' }}
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        multiple
        onChange={(event) => {
          handleFileChange(event.currentTarget.files);
          event.currentTarget.value = '';
        }}
        style={{ display: 'none' }}
      />

      {imageAttachments.length > 0 ? (
        <Box style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {imageAttachments.map((attachment) => (
            <Image
              key={attachment.id}
              src={getUploadUrl(attachment.path) || attachment.path}
              alt={attachment.filename}
              style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 12 }}
            />
          ))}
        </Box>
      ) : null}

      <Group align="center" spacing="xs" style={{ width: '100%' }}>
        <Menu shadow="md" width={180} withinPortal zIndex={9999}>
          <Menu.Target>
            <ActionIcon color="pastelBlue" radius="xl" size="lg" variant="filled" aria-label="Ajouter une pièce jointe">
              <IconPlus size={18} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item leftSection={<IconPhoto />} onClick={() => handleAttachmentTypeSelect('image')}>Image</Menu.Item>
            <Menu.Item leftSection={<IconFile />} onClick={() => handleAttachmentTypeSelect('document')}>Document</Menu.Item>
            <Menu.Item leftSection={<IconMusic />} onClick={() => handleAttachmentTypeSelect('audio')}>Audio</Menu.Item>
          </Menu.Dropdown>
        </Menu>
        <Textarea
          value={reply}
          onChange={(event) => {
            const newValue = event.currentTarget.value;
            const isDeletion = newValue.length < reply.length;
            setReply(newValue);
            if (!isDeletion) {
              handleTyping();
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              if (event.shiftKey) {
                return;
              }
              event.preventDefault();
              handleSend();
            }
          }}
          placeholder="Écrire..."
          minRows={1}
          maxRows={5}
          autosize
          style={{ flex: 1 }}
        />
      </Group>
      {attachmentError ? <Text size="xs" c="red">{attachmentError}</Text> : null}
      {attachments.length > 0 ? (
        <Box style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {attachments.map((attachment) => (
            <Badge key={attachment.id} size="xs" variant="outline">
              {attachment.filename}
            </Badge>
          ))}
        </Box>
      ) : null}
    </Stack>
  );
}
