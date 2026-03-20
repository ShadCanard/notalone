import {
  Container,
  Card,
  Title,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Anchor,
  Alert,
  Center,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconHeart, IconAlertCircle } from '@tabler/icons-react';
import { useLogin } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const loginMutation = useLogin();
  const [error, setError] = useState('');

  const form = useForm({
    initialValues: {
      identifier: '',
      password: '',
    },
    validate: {
      identifier: (value) => (value.length >= 1 ? null : "Email ou nom d'utilisateur requis"),
      password: (value) => (value.length >= 6 ? null : 'Le mot de passe doit faire au moins 6 caractères'),
    },
  });

  const handleSubmit = form.onSubmit((values) => {
    setError('');
    loginMutation.mutate({ identifier: values.identifier, password: values.password }, {
      onSuccess: (data) => {
        if (data.login) {
          login(data.login.token, data.login.user);
          router.push('/');
        }
      },
      onError: (err) => {
        setError(err instanceof Error ? err.message : 'Erreur de connexion');
      },
    });
  });

  return (
    <>
      <Head>
        <title>Connexion - NotAlone</title>
      </Head>

      <Center
        style={{
          minHeight: '100vh',
        }}
      >
        <Container size={440} px="md">
          <Stack align="center" gap="md" mb="xl">
            <IconHeart size={48} color="#2aa6ff" fill="#2aa6ff" />
            <Title order={1} ta="center" c="pastelBlue.8">
              Content de te revoir !
            </Title>
            <Text ta="center" c="dimmed" size="md">
              Connecte-toi pour retrouver ta communauté
            </Text>
          </Stack>

          <Card radius="xl" padding="xl" shadow="md">
            <form onSubmit={handleSubmit}>
              <Stack gap="md">
                {error && (
                  <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md">
                    {error}
                  </Alert>
                )}

                <TextInput
                  label="Email ou nom d'utilisateur"
                  placeholder="email ou pseudo"
                  required
                  {...form.getInputProps('identifier')}
                />

                <PasswordInput
                  label="Mot de passe"
                  placeholder="Ton mot de passe"
                  required
                  {...form.getInputProps('password')}
                />

                <Button type="submit" color="pastelBlue" fullWidth mt="md" loading={loginMutation.isPending}>
                  Se connecter
                </Button>

                <Text ta="center" size="sm">
                  Pas encore de compte ?{' '}
                  <Anchor component={Link} href="/register" c="pastelBlue">
                    Inscris-toi
                  </Anchor>
                </Text>
              </Stack>
            </form>
          </Card>
        </Container>
      </Center>
    </>
  );
}
