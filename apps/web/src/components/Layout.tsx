import { AppShell, Group, Title, Button, Avatar, Menu, UnstyledButton, Text, Burger, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconHeart, IconUser, IconLogout, IconHome, IconMessageCircle, IconShieldCheck } from '@tabler/icons-react';
import { useAuth } from '@/contexts/AuthContext';
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
      navbar={{
        width: 250,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
      styles={{
        main: {
          background: '#FFF8F0',
          minHeight: '100vh',
        },
        header: {
          background: 'linear-gradient(135deg, #6ccfff 0%, #4bbfff 50%, #2aa6ff 100%)',
          borderBottom: 'none',
        },
        navbar: {
          background: '#F0FAFF',
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

          {isAuthenticated ? (
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <UnstyledButton>
                  <Group gap="xs">
                    <Avatar
                      src={user?.avatar || '/default-avatar.svg'}
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
                <Menu.Item leftSection={<IconUser size={14} />} onClick={() => router.push('/profile')}>
                  Mon Profil
                </Menu.Item>
                <Menu.Item leftSection={<IconMessageCircle size={14} />} onClick={() => router.push('/messages')}>
                  Messages
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

      <AppShell.Navbar p="md">
        <Stack gap="xs">
          <Button
            variant={router.pathname === '/' ? 'light' : 'subtle'}
            color="pastelBlue"
            leftSection={<IconHome size={20} />}
            justify="flex-start"
            fullWidth
            onClick={() => { router.push('/'); close(); }}
          >
            Accueil
          </Button>
          {isAuthenticated && (
            <>
              <Button
                variant={router.pathname === '/profile' ? 'light' : 'subtle'}
                color="pastelBlue"
                leftSection={<IconUser size={20} />}
                justify="flex-start"
                fullWidth
                onClick={() => { router.push('/profile'); close(); }}
              >
                Mon Profil
              </Button>
              <Button
                variant={router.pathname === '/messages' ? 'light' : 'subtle'}
                color="pastelBlue"
                leftSection={<IconMessageCircle size={20} />}
                justify="flex-start"
                fullWidth
                onClick={() => { router.push('/messages'); close(); }}
              >
                Messages
              </Button>
            </>
          )}
        </Stack>

        <Stack gap="xs" mt="auto" pt="md" style={{ borderTop: '1px solid #EAF7FF' }}>
          <Text size="xs" c="dimmed" ta="center">
            Tu n&apos;es pas seul(e) 💙
          </Text>
          <Text size="xs" c="dimmed" ta="center">
            En cas d&apos;urgence : 3114
          </Text>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
