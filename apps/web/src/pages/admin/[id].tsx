import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useAuth } from '@/contexts/AuthContext';
import { useUser, useUpdateUserRole, useDeleteUser } from '@/hooks/useApi';
import { Container, Title, Text, Group, Card, Select, Button, Center, Loader, Modal } from '@mantine/core';

export default function AdminUserDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { user, isAuthenticated } = useAuth();
  const { data, isLoading } = useUser(typeof id === 'string' ? id : undefined);
  const updateRole = useUpdateUserRole();
  const deleteUser = useDeleteUser();
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
    else if (user && user?.role !== 'ADMIN') router.push('/');
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated) return null;

  return (
    <Layout>
      <Head>
        <title>Admin — Détail utilisateur</title>
      </Head>

      <Container size="md" py="xl">
        <Group style={{ justifyContent: 'space-between' }} mb="md">
          <Title order={2}>Détail utilisateur</Title>
        </Group>

        {isLoading && (
          <Center py="xl">
            <Loader />
          </Center>
        )}

        {data?.user && (
          <Card shadow="sm" radius="md" padding="lg">
            <Text fw={700}>{data.user.username} <Text component="span" c="dimmed">({data.user.email})</Text></Text>
            <Text size="sm" c="dimmed">Créé le: {new Date(String(data.user.createdAt)).toLocaleString('fr-FR')}</Text>

            <Group mt="md">
              <Select
                label="Rôle"
                value={data.user.role || 'USER'}
                data={[{ value: 'USER', label: 'User' }, { value: 'MODERATOR', label: 'Moderator' }, { value: 'ADMIN', label: 'Admin' }]}
                onChange={(val) => { if (!val) return; updateRole.mutate({ userId: data.user.id, role: val }); }}
              />

              <Button color="red" onClick={() => setConfirmOpen(true)}>Supprimer le compte</Button>
            </Group>

            <Modal opened={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirmer la suppression">
              <Text mb="md">Tu es sûr(e) de vouloir supprimer ce compte ? Cette action est irréversible.</Text>
              <Group style={{ justifyContent: 'flex-end' }}>
                <Button variant="default" onClick={() => setConfirmOpen(false)}>Annuler</Button>
                <Button color="red" onClick={() => { deleteUser.mutate({ id: data.user.id }, { onSuccess: () => router.push('/admin') }); }}>Supprimer</Button>
              </Group>
            </Modal>
          </Card>
        )}
      </Container>
    </Layout>
  );
}
