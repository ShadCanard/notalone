import { Container, Title, Tabs, Stack } from '@mantine/core';
import Head from 'next/head';
import Layout from '@/components/layout/Layout';
import EditProfile from '@/components/layout/EditProfile';

export default function SettingsPage() {
  return (
    <Layout>
      <Head>
        <title>Paramètres — NotAlone</title>
      </Head>

      <Container size="md" py="xl">
        <Stack>
          <Title order={2}>Paramètres</Title>

          <Tabs orientation="vertical" defaultValue="profile" variant="pills">
            <Tabs.List style={{ width: 220 }}>
              <Tabs.Tab value="profile">Profil</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="profile">
              <EditProfile />
            </Tabs.Panel>
          </Tabs>
        </Stack>
      </Container>
    </Layout>
  );
}

