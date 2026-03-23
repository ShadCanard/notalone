import React from 'react';
import { Menu, Group, Text, Badge, ScrollArea, UnstyledButton } from '@mantine/core';
import { IconBell } from '@tabler/icons-react';
import { useRouter } from 'next/router';
import { useNotifications, useMarkNotificationRead } from '@/hooks/useApi';
import { getTimeAgo } from '@/lib/tools';

export default function NotificationMenu() {
  const router = useRouter();
  const { data, isLoading } = useNotifications();
  const notifications: Array<any> = (data && (data as any).notifications) || [];
  const unreadCount = notifications.filter((n) => !n.read).length;
  const markRead = useMarkNotificationRead();

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
                <Group position="apart" style={{ width: '100%' }}>
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
