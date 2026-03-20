import { Button, Group, Text } from '@mantine/core';
import { IconBell } from '@tabler/icons-react';
import { useRouter } from 'next/router';
import React from 'react';

export default function NotificationMenu() {
  const router = useRouter();
  return (
    <Button variant="subtle" onClick={() => router.push('/notifications')}>
      <Group gap="xs">
        <IconBell size={18} />
        <Text>Notifications</Text>
      </Group>
    </Button>
  );
}
