import { AppShell, Group, Title, Button, Text, Burger, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconHeart, IconUser, IconHome } from '@tabler/icons-react';
import { useAuth } from '@/contexts/AuthContext';
import NotificationMenu from '@/components/layout/NotificationMenu';
import NavbarUserMenu from '@/components/layout/NavbarUserMenu';
import ChatWidget from '@/components/chats/ChatWidget';
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
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Group gap="xs" style={{ cursor: 'pointer' }} onClick={() => router.push('/')}>
              <IconHeart size={32} />
              <Title order={2} fw={800}>
                NotAlone
              </Title>
            </Group>
          </Group>

          <Group style={{ margin: '0 auto' }} gap="md">
            {isAuthenticated ? <>
            <Button variant="subtle" onClick={() => router.push('/')}>
              <Group gap="xs">
                <IconHome size={18} />
                <Text>Accueil</Text>
              </Group>
            </Button>

            <Button variant="subtle" onClick={() => router.push('/profile')}>
              <Group gap="xs">
                <IconUser size={18} />
                <Text>Mon Profil</Text>
              </Group>
            </Button>

            <NotificationMenu />
            </> : null}
          </Group>

          {isAuthenticated ? (
            <NavbarUserMenu />
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
      <ChatWidget />
      </AppShell.Main>
    </AppShell>
  );
}

