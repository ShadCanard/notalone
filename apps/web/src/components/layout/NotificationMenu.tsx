import React, { useEffect, useMemo, useState } from 'react';
import { Menu, Group, Text, Badge, ScrollArea, UnstyledButton } from '@mantine/core';
import { IconBell } from '@tabler/icons-react';
import { useRouter } from 'next/router';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from 'graphql-ws';
import { useNotifications, useMarkNotificationRead } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { getTimeAgo } from '@/lib/tools';

const NOTIFICATIONS_SUBSCRIPTION = `subscription NotificationReceived($userId: ID!) {
  notificationReceived(userId: $userId) {
    id
    type
    linkId
    read
    createdAt
    author { id username avatar }
    user { id username avatar }
  }
}`;


export default function NotificationMenu() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, token } = useAuth();
  const { data, isLoading } = useNotifications();
  const [liveNotifications, setLiveNotifications] = useState<Array<any>>([]);

  const notifications: Array<any> = useMemo(() => {
    const fetched = (data && (data as any).notifications) || [];
    return [...(liveNotifications || []), ...fetched].filter((item, index, self) => self.findIndex((n) => n.id === item.id) === index);
  }, [data, liveNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const markRead = useMarkNotificationRead();

  useEffect(() => {
    if (!user?.id || !token) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/graphql';
    const wsUrl = apiUrl.replace(/^http/, 'ws');

    const client = createClient({
      url: wsUrl,
      connectionParams: {
        authorization: `Bearer ${token}`,
      },
    });

    const dispose = client.subscribe(
      {
        query: NOTIFICATIONS_SUBSCRIPTION,
        variables: { userId: user.id },
      },
      {
        next: (result) => {
          const payload = (result as any).data?.notificationReceived;
          if (!payload) return;

          setLiveNotifications((prev) => {
            if (prev.some((n) => n.id === payload.id)) return prev;
            return [payload, ...prev].slice(0, 50);
          });

          queryClient.setQueryData(['notifications', 20, 0], (oldData: any) => {
            const existing = oldData?.notifications ?? [];
            const merged = [payload, ...existing].filter((val, idx, arr) => arr.findIndex((it) => it.id === val.id) === idx);
            return { notifications: merged.slice(0, 50) };
          });
        },
        error: (err) => {
          console.error('Notification subscription error', err);
        },
        complete: () => {
          console.info('Notification subscription completed');
        },
      }
    );

    return () => {
      dispose();
      client.dispose();
    };
  }, [user?.id, token, queryClient]);

  const handleClick = async (n: any) => {
    try {
      await markRead.mutateAsync({ id: n.id });
    } catch (e) {
      // ignore
    }
    // reconstruct URL: for now map all types to posts
    router.push(`/posts/${n.linkId}`);
  };

  return (
    <Menu withArrow position="bottom-end">
      <Menu.Target>
        <UnstyledButton>
          <Group gap="xs">
            <IconBell size={18} />
            <Text>Notifications</Text>
            {unreadCount > 0 ? <Badge color="red" size="sm">{unreadCount}</Badge> : null}
          </Group>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown style={{ minWidth: 300 }}>
        <Menu.Label>Notifications</Menu.Label>
        <ScrollArea style={{ height: 300 }}>
          {isLoading ? (
            <Text p="sm">Chargement...</Text>
          ) : notifications.length === 0 ? (
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Text p="sm">Aucune notification</Text>
            </div>
          ) : (
            notifications.map((n) => (
              <Menu.Item key={n.id} onClick={() => handleClick(n)}>
                <Group justify="space-between" style={{ width: '100%' }}>
                  <div>
                    <Text size="sm">{n.type.replace(/_/g, ' ').toLowerCase()}</Text>
                    <Text size="xs" c="dimmed">{getTimeAgo(new Date(n.createdAt))}</Text>
                  </div>
                  {!n.read ? <Badge color="orange">new</Badge> : null}
                </Group>
              </Menu.Item>
            ))
          )}
        </ScrollArea>
      </Menu.Dropdown>
    </Menu>
  );
}
