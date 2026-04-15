import { Badge, Card, Collapse, Group, Text, Divider, UnstyledButton } from '@mantine/core';
import { IconArrowBarToLeft, IconArrowBarToRight, IconMessages } from '@tabler/icons-react';
import ChatPreviewComponent from './ChatPreviewComponent';

type Conversation = {
  id: string;
  username: string;
  avatar: string;
  lastMessage: string;
  lastMessageAt?: string;
  unreadCount?: number;
};

type ChatListComponentProps = {
  conversations: Conversation[];
  collapsed: boolean;
  showOnlyAvatar: boolean;
  onToggle: () => void;
  onToggleShowOnlyAvatar: () => void;
  onSelectConversation: (conversation: Conversation) => void;
};

export default function ChatListComponent({
  conversations,
  collapsed,
  showOnlyAvatar,
  onToggle,
  onToggleShowOnlyAvatar,
  onSelectConversation,
}: ChatListComponentProps) {
  const unreadCount = conversations.reduce((sum, conversation) => sum + (conversation.unreadCount ?? 0), 0);

  return (
    <Card
      radius="xl"
      p="sm"
      withBorder
      style={{ width: collapsed ? 48 : showOnlyAvatar ? 96 : 320, minWidth: collapsed ? 48 : showOnlyAvatar ? 96 : 320 }}
    >
      <UnstyledButton
        onClick={onToggle}
        style={{ width: '100%', display: 'block', textAlign: 'left' }}
      >
        {collapsed ? (
          <Group justify="center" align="center" style={{ width: '100%' }}>
            <IconMessages size={18} />
          </Group>
        ) : (
          <Group justify="apart" align="center" gap="xs">
            <Group gap="xs">
              <div style={{ position: 'relative', display: 'inline-flex' }}>
                <IconMessages size={18} />
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
              {!showOnlyAvatar && <Text fw={700}>Conversations</Text>}
            </Group>
            {showOnlyAvatar ? (
              <IconArrowBarToLeft
                size={18}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleShowOnlyAvatar();
                }}
              />
            ) : (
              <IconArrowBarToRight
                size={18}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleShowOnlyAvatar();
                }}
              />
            )}
          </Group>
        )}
      </UnstyledButton>

      <Collapse in={!collapsed} transitionDuration={200} mt="md">
        <Divider my="sm" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {conversations.map((conversation) => (
            <ChatPreviewComponent
              key={conversation.id}
              avatar={conversation.avatar}
              username={conversation.username}
              lastMessage={conversation.lastMessage}
              unreadCount={conversation.unreadCount}
              onClick={() => onSelectConversation(conversation)}
              showOnlyAvatar={showOnlyAvatar}
            />
          ))}
          {conversations.length === 0 && (
            <Text size="sm" c="dimmed" ta="center">
              Aucune conversation en cours.
            </Text>
          )}
        </div>
      </Collapse>
    </Card>
  );
}
