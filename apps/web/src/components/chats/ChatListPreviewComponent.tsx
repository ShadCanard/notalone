import { Avatar, Badge, Group, Text, UnstyledButton } from '@mantine/core';
import { IconPhoto } from '@tabler/icons-react';
import type { Attachment, Message } from '@/types';

type LastPreviewMessage = {
  content: string;
  attachments?: Attachment[] | null;
};

type ChatListPreviewComponentProps = {
  avatar: string;
  username: string;
  lastMessage: Message | LastPreviewMessage;
  onClick: () => void;
  showOnlyAvatar?: boolean;
  unreadCount?: number;
};

export default function ChatListPreviewComponent({
  avatar,
  username,
  lastMessage,
  onClick,
  showOnlyAvatar,
  unreadCount = 0,
}: ChatListPreviewComponentProps) {
  return (
    <UnstyledButton
      onClick={onClick}
      style={{ width: '100%', textAlign: 'left', borderRadius: 16 }}
    >
      <Group wrap="nowrap" align="flex-start" gap="md" px="sm" py="xs">
        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <Avatar src={avatar} alt={username} radius="xl" size="md" />
          {unreadCount > 0 ? (
            <Badge
              size="xs"
              variant="filled"
              color="red"
              style={{ position: 'absolute', top: -6, right: -6, minWidth: 18, height: 18, padding: '0 6px' }}
            >
              {unreadCount}
            </Badge>
          ) : null}
        </div>

        {!showOnlyAvatar && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text size="sm" fw={700} lineClamp={1}>
              {username}
            </Text>
            {(() => {
              const content = lastMessage?.content?.trim() ?? '';
              const attachments = 'attachments' in lastMessage ? lastMessage.attachments ?? [] : [];
              const hasImageAttachment = !content && attachments.some((attachment) => attachment.mimeType?.startsWith('image/'));

              if (content.length > 0) {
                return (
                  <Text size="xs" c="dimmed" lineClamp={2}>
                    {content}
                  </Text>
                );
              }

              if (hasImageAttachment) {
                return (
                  <Group spacing="xs">
                    <IconPhoto size={14} style={{ opacity: 0.7 }} />
                    <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }}>
                      image
                    </Text>
                  </Group>
                );
              }

              return (
                <Text size="xs" c="dimmed" lineClamp={2}>
                  {content}
                </Text>
              );
            })()}
          </div>
        )}
      </Group>
    </UnstyledButton>
  );
}
