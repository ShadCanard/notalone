import { Avatar, Badge, Group, Text, UnstyledButton } from '@mantine/core';

type ChatPreviewComponentProps = {
  avatar: string;
  username: string;
  lastMessage: string;
  onClick: () => void;
  showOnlyAvatar?: boolean;
  unreadCount?: number;
};

export default function ChatPreviewComponent({
  avatar,
  username,
  lastMessage,
  onClick,
  showOnlyAvatar,
  unreadCount = 0,
}: ChatPreviewComponentProps) {
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
            <Text size="xs" c="dimmed" lineClamp={2}>
              {lastMessage}
            </Text>
          </div>
        )}
      </Group>
    </UnstyledButton>
  );
}
