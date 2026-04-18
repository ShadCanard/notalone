import { Box, Group, Text } from '@mantine/core';
import PostPreview from '@/components/posts/PostPreview';
import type { Message } from '@/types';
import ChatPreviewComponent from './ChatPreviewComponent';

type ChatMessageComponentProps = {
  message: Message;
  conversationId: string;
  messageRef: (node: HTMLDivElement | null) => void;
};

const formatMessageTime = (iso: string) => {
  const date = new Date(iso);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

export default function ChatMessageComponent({
  message,
  conversationId,
  messageRef,
}: ChatMessageComponentProps) {
  const isMine = message.sender.id !== conversationId;
  const timeLabel = formatMessageTime(message.createdAt);

  return (
    <Group
      style={{
        justifyContent: isMine ? 'flex-end' : 'flex-start',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {isMine ? (
        <Text size="xs" c="dimmed" style={{ minWidth: 40, textAlign: 'right' }}>
          {timeLabel}
        </Text>
      ) : null}
      <Box
        ref={messageRef}
        style={{
          background: isMine ? '#d6f0ff' : '#f1f3f5',
          color: '#102a43',
          padding: '10px 14px',
          borderRadius: '18px',
          maxWidth: '80%',
          wordBreak: 'break-word',
          boxShadow: isMine ? '0 1px 3px rgba(16, 42, 67, 0.12)' : '0 1px 2px rgba(16, 42, 67, 0.08)',
          border: isMine ? '1px solid rgba(16, 42, 67, 0.08)' : '1px solid rgba(16, 42, 67, 0.12)',
        }}
      >
        <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
          {message.content}
        </Text>
        <ChatPreviewComponent attachments={message.attachments} payload={message.payload} />
      </Box>
      {!isMine ? (
        <Text size="xs" c="dimmed" style={{ minWidth: 40, textAlign: 'left' }}>
          {timeLabel}
        </Text>
      ) : null}
    </Group>
  );
}
