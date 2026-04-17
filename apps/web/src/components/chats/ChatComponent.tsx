import { Avatar, Badge, Box, Card, Collapse, Divider, Group, Skeleton, Stack, Text, Textarea, ActionIcon } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteMessages, useSendMessage, useSetTypingStatus, useMarkMessageRead } from '@/hooks/useApi';
import type { InfiniteMessagesPage, Message } from '@/types';

type ChatComponentProps = {
  conversationId: string;
  avatar: string;
  username: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onClose?: () => void;
  isTyping?: boolean;
};

export default function ChatComponent({
  conversationId,
  avatar,
  username,
  collapsed,
  onToggleCollapse,
  onClose,
  isTyping = false,
}: ChatComponentProps) {
  const [reply, setReply] = useState('');
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteMessages(conversationId, 50);
  const sendMessage = useSendMessage();
  const setTypingStatus = useSetTypingStatus();
  const markMessageRead = useMarkMessageRead();
  const setTypingStatusRef = useRef(setTypingStatus);
  const stopTypingTimer = useRef<number | null>(null);
  const isTypingLocalRef = useRef(false);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const isScrolledToBottomRef = useRef(true);
  const hasScrolledToBottomRef = useRef(false);
  const previousCollapsedRef = useRef(collapsed);
  const previousScrollHeightRef = useRef<number | null>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const alreadyMarkedReadRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setTypingStatusRef.current = setTypingStatus;
  }, [setTypingStatus]);

  const messages = useMemo<Message[]>(() => {
    const pages = (data?.pages ?? []) as InfiniteMessagesPage[];
    if (!pages.length) return [];
    return pages
      .slice()
      .reverse()
      .flatMap((page) => (Array.isArray(page?.messages) ? [...page.messages].reverse() : []));
  }, [data]);
  const unreadCount = messages.filter((message: Message) => message.receiver.id !== conversationId && !message.read).length;


  const sendTypingStatus = async (isTyping: boolean) => {
    try {
      await setTypingStatusRef.current.mutateAsync({ receiverId: conversationId, isTyping });
    } catch (error) {
      console.error('[Chat] failed to update typing status', { conversationId, isTyping }, error);
    }
  };

  const resetTypingTimeout = () => {
    if (stopTypingTimer.current) {
      window.clearTimeout(stopTypingTimer.current);
    }
    stopTypingTimer.current = window.setTimeout(async () => {
      if (isTypingLocalRef.current) {
        await sendTypingStatus(false);
        isTypingLocalRef.current = false;
      }
      stopTypingTimer.current = null;
    }, 3000);
  };

  const formatMessageTime = (iso: string) => {
    const date = new Date(iso);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatMessageDate = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const markVisibleUnreadMessagesRead = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();

    messages.forEach((message) => {
      if (message.read) return;
      if (message.receiver.id === conversationId && message.sender.id !== message.receiver.id) return;
      if (alreadyMarkedReadRef.current.has(message.id)) return;

      const messageEl = messageRefs.current[message.id];
      if (!messageEl) return;
      const rect = messageEl.getBoundingClientRect();
      const isVisible = rect.bottom > containerRect.top && rect.top < containerRect.bottom;
      if (isVisible) {
        alreadyMarkedReadRef.current.add(message.id);
        markMessageRead.mutate({ id: message.id });
      }
    });
  };

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const handleScroll = () => {
      isScrolledToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight <= 8;
      if (el.scrollTop <= 16 && hasNextPage && !isFetchingNextPage) {
        previousScrollHeightRef.current = el.scrollHeight;
        void fetchNextPage();
      }
      markVisibleUnreadMessagesRead();
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      el.removeEventListener('scroll', handleScroll);
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, messages]);

  useEffect(() => {
    markVisibleUnreadMessagesRead();
  }, [messages]);

  const pageCount = data?.pages?.length ?? 0;

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el || previousScrollHeightRef.current === null) return;
    const addedHeight = el.scrollHeight - previousScrollHeightRef.current;
    if (addedHeight > 0) {
      el.scrollTop = addedHeight;
    }
    previousScrollHeightRef.current = null;
  }, [pageCount]);

  const scrollToBottom = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight - el.clientHeight;
  };

  useLayoutEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    const openedConversation = previousCollapsedRef.current && !collapsed;
    previousCollapsedRef.current = collapsed;

    if (!hasScrolledToBottomRef.current || openedConversation || isScrolledToBottomRef.current) {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(scrollToBottom);
      });
      hasScrolledToBottomRef.current = true;
    }
  }, [messages.length, isTyping, collapsed]);

  const handleTyping = () => {
    if (!isTypingLocalRef.current) {
      isTypingLocalRef.current = true;
      void sendTypingStatus(true);
    }
    resetTypingTimeout();
  };

  const handleSend = async () => {
    const trimmed = reply.trim();
    if (!trimmed) return;

    try {
      await sendMessage.mutateAsync({ receiverId: conversationId, content: trimmed });
      setReply('');
      if (stopTypingTimer.current) {
        window.clearTimeout(stopTypingTimer.current);
        stopTypingTimer.current = null;
      }
      if (isTypingLocalRef.current) {
        await sendTypingStatus(false);
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

  return (
    <Card radius="xl" withBorder style={{ width: 320 }}>
      <Group
        wrap="nowrap"
        align="center"
        gap="md"
        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', width: '100%' }}
        onClick={onToggleCollapse}
      >
        <Group wrap="nowrap" align="center" gap="md">
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <Avatar src={avatar} alt={username} radius="xl" size="sm" />
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
          <div>
            <Text fw={700}>{username}</Text>
          </div>
        </Group>

        {onClose ? (
          <ActionIcon
            size="xs"
            variant="outline"
            onClick={(event) => {
              event.stopPropagation();
              onClose();
            }}
          >
            <IconX size={16} />
          </ActionIcon>
        ) : null}
      </Group>

      <Collapse in={!collapsed}>
        <Divider my="md" />

        <Stack gap="sm">
          <Box
            ref={messagesContainerRef}
            style={{
              maxHeight: 240,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {isLoading ? (
              <Text size="sm" c="dimmed">
                Chargement...
              </Text>
            ) : messages.length === 0 ? (
              isTyping ? (
                <Group style={{ justifyContent: 'flex-start' }}>
                  <Box
                    style={{
                      background: '#f1f3f5',
                      padding: '10px 14px',
                      borderRadius: '18px',
                      maxWidth: '65%',
                      boxShadow: '0 1px 2px rgba(16, 42, 67, 0.08)',
                      border: '1px solid rgba(16, 42, 67, 0.12)',
                    }}
                  >
                    <Skeleton height={22} width="100%" radius="xl" animate />
                  </Box>
                </Group>
              ) : (
                <Text size="sm" c="dimmed">
                  Aucune discussion pour l'instant.
                </Text>
              )
            ) : (
              <>
                {(() => {
                  let lastMessageDate = '';
                  return messages.map((message) => {
                    const isMine = message.sender.id !== conversationId;
                    const timeLabel = formatMessageTime(message.createdAt);
                    const messageDate = new Date(message.createdAt).toLocaleDateString('fr-FR');
                    const showDateHeader = messageDate !== lastMessageDate;
                    if (showDateHeader) {
                      lastMessageDate = messageDate;
                    }

                    return (
                      <div key={message.id}>
                        {showDateHeader ? (
                          <Box style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
                            <Text size="xs" c="dimmed" ta="center" style={{ textTransform: 'capitalize' }}>
                              {formatMessageDate(message.createdAt)}
                            </Text>
                          </Box>
                        ) : null}
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
                            ref={(el) => {
                              messageRefs.current[message.id] = el;
                            }}
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
                            <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{message.content}</Text>
                          </Box>
                          {!isMine ? (
                            <Text size="xs" c="dimmed" style={{ minWidth: 40, textAlign: 'left' }}>
                              {timeLabel}
                            </Text>
                          ) : null}
                        </Group>
                      </div>
                    );
                  });
                })()}
                {isTyping ? (
                  <Group style={{ justifyContent: 'flex-start', width: '100%' }}>
                    <Box
                      style={{
                        background: '#f1f3f5',
                        padding: '10px 14px',
                        borderRadius: '18px',
                        maxWidth: '75%',
                        minWidth: 140,
                        width: '75%',
                        boxShadow: '0 1px 2px rgba(16, 42, 67, 0.08)',
                        border: '1px solid rgba(16, 42, 67, 0.12)',
                      }}
                    >
                      <Text size="sm" c="dimmed" style={{fontStyle:"italic"}}>
                        {username} est en train d'écrire...
                      </Text>
                    </Box>
                  </Group>
                ) : null}
              </>
            )}
          </Box>

          <Divider my="sm" />

          <Stack gap="xs">
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
              minRows={2}
              autosize
            />
          </Stack>
        </Stack>
      </Collapse>
    </Card>
  );
}
