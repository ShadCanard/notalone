import React, { type FC } from 'react';
import { Menu, Group, Text, Badge, Avatar } from '@mantine/core';
import { getNotificationText, getTimeAgo } from '@/lib/tools';
import type { Notification } from '@/types';
import { IconCheck } from '@tabler/icons-react';

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
}

const NotificationItem: FC<NotificationItemProps> = ({ notification, onClick }) => (
  <Menu.Item onClick={onClick}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
      <Group gap="sm" align="center">
        <Avatar src={notification.author.avatar ?? undefined} alt={notification.author.username} radius="xl" size="md" />
        <div>
          <Text size="sm">{getNotificationText(notification)}</Text>
          <Text size="xs" c="dimmed">
            {getTimeAgo(new Date(notification.createdAt))}
          </Text>
        </div>
      </Group>

      {!notification.read && (
        <Badge color="orange" variant="light">
          <IconCheck size={16} />
        </Badge>
      )}
    </div>
  </Menu.Item>
);

export default NotificationItem;
