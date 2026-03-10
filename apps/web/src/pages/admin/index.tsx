import { useEffect } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useUsers, useUpdateUserRole, useDeleteUser } from '@/hooks/useApi';
import { Table, Container, Title, Text, Group, Select, Center, Loader, ActionIcon } from '@mantine/core';
import { IconTrash, IconPencil } from '@tabler/icons-react';

export default function AdminUsersPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (user && user?.role !== 'ADMIN') {
      // non-admins are redirected
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  const { data, isLoading } = useUsers();
  const updateRole = useUpdateUserRole();
  const deleteUser = useDeleteUser();

  if (!isAuthenticated) return null;

  return (
    <Layout>
      <Head>
        <title>Admin — Utilisateurs</title>
      </Head>

      <Container size="lg" py="xl">
        <Group position="apart" mb="md">
          <Title order={2}>Administration — Comptes</Title>
          <Text c="dimmed">Gère les comptes et les rôles</Text>
        </Group>

        {isLoading && (
          <Center py="xl">
            <Loader />
          </Center>
        )}

        {data?.users && (
          <Table highlightOnHover verticalSpacing="sm">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Créé le</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <Text fw={600} style={{ cursor: 'pointer' }} onClick={() => router.push(`/admin/${u.id}`)}>
                      {u.username}
                    </Text>
                    <Text size="xs" c="dimmed">{u.firstName || ''} {u.lastName || ''}</Text>
                  </td>
                  <td>
                    <Text size="sm">{u.email}</Text>
                  </td>
                  <td>
                    <Select
                      value={u.role || 'USER'}
                      data={[{ value: 'USER', label: 'User' }, { value: 'MODERATOR', label: 'Moderator' }, { value: 'ADMIN', label: 'Admin' }]}
                      onChange={(val) => {
                        if (!val) return;
                        updateRole.mutate({ userId: u.id, role: val });
                      }}
                    />
                  </td>
                  <td>
                    <Text size="sm">{new Date(String(u.createdAt)).toLocaleString('fr-FR')}</Text>
                  </td>
                  <td>
                    <Group>
                      <ActionIcon title="Détails" onClick={() => router.push(`/admin/${u.id}`)}>
                        <IconPencil />
                      </ActionIcon>
                      <ActionIcon color="red" title="Supprimer" onClick={() => deleteUser.mutate({ id: u.id })}>
                        <IconTrash />
                      </ActionIcon>
                    </Group>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Container>
    </Layout>
  );
}
