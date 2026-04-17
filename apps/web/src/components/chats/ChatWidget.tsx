import { Box, Loader } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ChatComponent from './ChatComponent';
import ChatListComponent from './ChatListComponent';
import { useChatSubscriptions, useConversations } from '@/hooks/useApi';

type OpenConversation = {
  id: string;
  username: string;
  avatar: string;
  lastMessage: string;
  lastMessageAt?: string;
  unreadCount?: number;
  collapsed?: boolean;
  isTyping?: boolean;
};

const OPEN_CONVERSATIONS_STORAGE_KEY = 'notalone_open_conversations';

export default function ChatWidget() {
  const [collapsed, setCollapsed] = useState(false);
  const [showOnlyAvatar, setShowOnlyAvatar] = useState(false);
  const [openConversations, setOpenConversations] = useState<OpenConversation[]>([]);
  const [hasRestoredState, setHasRestoredState] = useState(false);

  const conversationsQuery = useConversations(50, 0);

  const { user, token } = useAuth();

  const conversations = useMemo(
    () =>
      conversationsQuery.data?.conversations.map((conversation) => ({
        id: conversation.id,
        username: conversation.partner.username,
        avatar: conversation.partner.avatar ?? '',
        lastMessage: conversation.lastMessage,
        lastMessageAt: conversation.lastMessageAt,
        unreadCount: conversation.unreadCount,
      })) ?? [],
    [conversationsQuery.data]
  );

  useEffect(() => {
    if (hasRestoredState || !conversationsQuery.isSuccess) return;

    try {
      const savedValue = localStorage.getItem(OPEN_CONVERSATIONS_STORAGE_KEY);
      if (!savedValue) {
        setHasRestoredState(true);
        return;
      }

      const parsed = JSON.parse(savedValue) as
        | {
            openConversations?: Array<{ id: string; collapsed?: boolean }>;
            collapsed?: boolean | string;
            showOnlyAvatar?: boolean | string;
          }
        | null;

      const savedOpenConversations = Array.isArray(parsed?.openConversations) ? parsed.openConversations : [];
      const restoredOpenConversations = savedOpenConversations.flatMap((item) => {
        const conversation = conversations.find((c) => c.id === item.id);
        if (!conversation) return [];
        return [{ ...conversation, collapsed: !!item.collapsed }];
      });

      if (restoredOpenConversations.length > 0) {
        setOpenConversations(restoredOpenConversations);
      }

      if (parsed?.collapsed !== undefined) {
        setCollapsed(parsed.collapsed === true || parsed.collapsed === 'true');
      }
      if (parsed?.showOnlyAvatar !== undefined) {
        setShowOnlyAvatar(parsed.showOnlyAvatar === true || parsed.showOnlyAvatar === 'true');
      }
    } catch {
      // ignore invalid stored value
    } finally {
      setHasRestoredState(true);
    }
  }, [conversations, hasRestoredState]);

  useEffect(() => {
    try {
      localStorage.setItem(
        OPEN_CONVERSATIONS_STORAGE_KEY,
        JSON.stringify({
          openConversations: openConversations.map((conversation) => ({
            id: conversation.id,
            collapsed: !!conversation.collapsed,
          })),
          collapsed,
          showOnlyAvatar,
        })
      );
    } catch {
      // ignore storage failures
    }
  }, [openConversations, collapsed, showOnlyAvatar]);

  const handleOpenConversation = (conversation: OpenConversation) => {
    setOpenConversations((current) => {
      if (current.some((item) => item.id === conversation.id)) {
        return current;
      }
      return [...current, { ...conversation, collapsed: false }];
    });
    setCollapsed(false);
  };

  const handleCloseConversation = (conversationId: string) => {
    setOpenConversations((current) => current.filter((conversation) => conversation.id !== conversationId));
  };

  const handleToggleConversationListCollapsed = () => {
    setCollapsed((current) => !current);
  };

  const handleToggleShowOnlyAvatar = () => {
    setShowOnlyAvatar((current) => !current);
  };

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<OpenConversation>;
      const conversation = custom.detail;
      if (!conversation?.id) return;
      handleOpenConversation(conversation);
    };

    window.addEventListener('notalone:openConversation', handler);
    return () => {
      window.removeEventListener('notalone:openConversation', handler);
    };
  }, []);

  useChatSubscriptions(
    user?.id,
    token,
    (typingStatus) => {
      const sender = typingStatus.sender;
      setOpenConversations((current) =>
        current.map((conversation) =>
          conversation.id === sender.id ? { ...conversation, isTyping: typingStatus.isTyping } : conversation
        )
      );
    },
    (message) => {
      const sender = message.sender;
      setOpenConversations((current) =>
        current.map((conversation) =>
          conversation.id === sender.id ? { ...conversation, isTyping: false } : conversation
        )
      );
    }
  );

  const handleToggleConversationCollapsed = (conversationId: string) => {
    setOpenConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, collapsed: !conversation.collapsed }
          : conversation
      )
    );
  };

  return (
    <Box
      style={{
        position: 'fixed',
        right: 20,
        bottom: 20,
        zIndex: 999,
        display: 'flex',
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-end',
      }}
    >
      {openConversations.map((conversation) => (
        <ChatComponent
          key={conversation.id}
          conversationId={conversation.id}
          avatar={conversation.avatar}
          username={conversation.username}
          lastMessage={conversation.lastMessage}
          collapsed={!!conversation.collapsed}
          isTyping={!!conversation.isTyping}
          onToggleCollapse={() => handleToggleConversationCollapsed(conversation.id)}
          onClose={() => handleCloseConversation(conversation.id)}
        />
      ))}
      {conversationsQuery.isLoading && <Loader size="sm" />}
      <ChatListComponent
        conversations={conversations}
        collapsed={collapsed}
        showOnlyAvatar={showOnlyAvatar}
        onToggle={handleToggleConversationListCollapsed}
        onToggleShowOnlyAvatar={handleToggleShowOnlyAvatar}
        onSelectConversation={handleOpenConversation}
      />
    </Box>
  );
}
