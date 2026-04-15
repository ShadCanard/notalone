import { Menu, UnstyledButton, Group, Avatar, Text, useMantineColorScheme } from '@mantine/core';
import { IconSettings, IconShieldCheck, IconLogout, IconMoon, IconSun } from '@tabler/icons-react';
import { useAuth } from '@/contexts/AuthContext';
import { getUploadUrl } from '@/lib/uploads';
import { useRouter } from 'next/router';
import type { FC } from 'react';

const NavbarUserMenu: FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  if (!isAuthenticated) return null;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <Menu shadow="md" width={200}>
      <Menu.Target>
        <UnstyledButton>
          <Group gap="xs">
            <Avatar
              src={getUploadUrl(user?.avatar) || '/default-avatar.svg'}
              alt={user?.username}
              radius="xl"
              size="md"
              variant="filled"
            >
              {user?.username?.charAt(0).toUpperCase()}
            </Avatar>
            <Text fw={600} visibleFrom="sm">
              {user?.username}
            </Text>
          </Group>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Item leftSection={<IconSettings size={14} />} onClick={() => router.push('/settings')}>
          Paramètres
        </Menu.Item>
        {user?.role === 'ADMIN' && (
          <>
            <Menu.Divider />
            <Menu.Item leftSection={<IconShieldCheck size={14} />} onClick={() => router.push('/admin')}>
              Admin
            </Menu.Item>
          </>
        )}
        <Menu.Divider />
        <Menu.Item leftSection={colorScheme === 'dark' ? <IconSun size={14} /> : <IconMoon size={14} />} onClick={() => toggleColorScheme()}>
          Mode {colorScheme === 'dark' ? 'clair' : 'sombre'}
        </Menu.Item>
        <Menu.Item color="red" leftSection={<IconLogout size={14} />} onClick={handleLogout}>
          Déconnexion
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};

export default NavbarUserMenu;
