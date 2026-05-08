import React, { useMemo, type FC } from 'react';
import { Menu, Group, Text, Badge, ScrollArea, UnstyledButton } from '@mantine/core';
import { IconBell } from '@tabler/icons-react';
import { useRouter } from 'next/router';
import { useNotifications, useNotificationSubscription, useMarkNotificationRead } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import NotificationItem from './NotificationItem';
import type { Notification } from '@/types';

const NotificationMenu: FC = () => {
  const router = useRouter();
  const { user, token } = useAuth();
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();

  useNotificationSubscription(user?.id, token);

  const notifications = useMemo<Notification[]>(() => {
    return (data as { notifications?: Notification[] } | undefined)?.notifications ?? [];
  }, [data]);

  const unreadCount = notifications.filter((notification) => !notification.read).length;


  const handleClick = async (notification: Notification) => {
    if (!notification.read) {
      try {
        await markRead.mutateAsync({ id: notification.id });
      } catch {
        // ignore
      }
    }

    router.push(`/posts/${notification.linkId}`);
  };

  return (
    <Menu shadow="md" width={400} position="bottom-end">
      <Menu.Target>
        <UnstyledButton>
          <Group gap="xs" align="center">
            <IconBell size={18} />
            <Text>Notifications</Text>
            {unreadCount > 0 && (
              <Badge color="red" size="sm">
                {unreadCount}
              </Badge>
            )}
          </Group>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Notifications récentes</Menu.Label>
        <ScrollArea h={300} offsetScrollbars>
          {isLoading ? (
            <Text p="sm">Chargement...</Text>
          ) : notifications.length === 0 ? (
            <Group justify="center" p="xl">
              <Text color="dimmed">Aucune notification</Text>
            </Group>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => handleClick(notification)}
              />
            ))
          )}
        </ScrollArea>
      </Menu.Dropdown>
    </Menu>
  );
};

export default NotificationMenu;
