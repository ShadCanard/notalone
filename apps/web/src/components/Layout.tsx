import { AppShell, Group, Title, Button, Avatar, Menu, UnstyledButton, Text, Burger, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconHeart, IconUser, IconLogout, IconHome, IconMessageCircle, IconShieldCheck, IconSettings } from '@tabler/icons-react';
import { useAuth } from '@/contexts/AuthContext';
import { getUploadUrl } from '@/lib/uploads';
import NotificationMenu from '@/components/NotificationMenu';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [opened, { toggle, close }] = useDisclosure(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <AppShell
      header={{ height: 70 }}
      styles={{
        main: {
          minHeight: '100vh',
        },
        header: {
          borderBottom: 'none',
        },
        navbar: {
          borderRight: '1px solid #EAF7FF',
        },
      }}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" color="white" />
            <Group gap="xs" style={{ cursor: 'pointer' }} onClick={() => router.push('/')}>
              <IconHeart size={32} color="white" fill="white" />
              <Title order={2} c="white" fw={800}>
                NotAlone
              </Title>
            </Group>
          </Group>

          <Group style={{ margin: '0 auto' }} gap="md">
            <Button variant="subtle" onClick={() => router.push('/')}>
              <Group gap="xs">
                <IconHome size={18} color="white" />
                <Text c="white">Accueil</Text>
              </Group>
            </Button>

            <Button variant="subtle" onClick={() => router.push('/profile')}>
              <Group gap="xs">
                <IconUser size={18} color="white" />
                <Text c="white">Mon Profil</Text>
              </Group>
            </Button>

            <NotificationMenu />
          </Group>

          {isAuthenticated ? (
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
                    <Text c="white" fw={600} visibleFrom="sm">
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
                <Menu.Item color="red" leftSection={<IconLogout size={14} />} onClick={handleLogout}>
                  Déconnexion
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          ) : (
            <Group>
              <Button variant="white" color="pastelBlue" onClick={() => router.push('/login')}>
                Connexion
              </Button>
              <Button variant="filled" color="white" c="pastelBlue" onClick={() => router.push('/register')}>
                Inscription
              </Button>
            </Group>
          )}
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        {children}

      <Group p="md" style={{ borderTop: '1px solid #EAF7FF'}}>
        <Group style={{ width: '100%', justifyContent: 'center' }}>
          <Stack align="center" gap={0}>
            <Text size="xs" c="dimmed" ta="center">
              Tu n&apos;es pas seul(e) 💙
            </Text>
            <Text size="xs" c="dimmed" ta="center">
              En cas d&apos;urgence : 3114
            </Text>
          </Stack>
        </Group>
      </Group>
      </AppShell.Main>
    </AppShell>
  );
}
