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
import { useRegister } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';

export default function RegisterPage() {
  const { login } = useAuth();
  const router = useRouter();
  const registerMutation = useRegister();
  const [error, setError] = useState('');

  const form = useForm({
    initialValues: {
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Email invalide'),
      username: (value) =>
        value.length >= 3 ? null : "Le nom d'utilisateur doit faire au moins 3 caractères",
      password: (value) =>
        value.length >= 6 ? null : 'Le mot de passe doit faire au moins 6 caractères',
      confirmPassword: (value, values) =>
        value === values.password ? null : 'Les mots de passe ne correspondent pas',
    },
  });

  const handleSubmit = form.onSubmit((values) => {
    setError('');
    registerMutation.mutate(
      {
        email: values.email,
        username: values.username,
        password: values.password,
        firstName: values.firstName || undefined,
        lastName: values.lastName || undefined,
      },
      {
        onSuccess: (data) => {
          if (data.register) {
            login(data.register.token, data.register.user);
            router.push('/');
          }
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : "Erreur lors de l'inscription");
        },
      }
    );
  });

  return (
    <>
      <Head>
        <title>Inscription - NotAlone</title>
      </Head>

      <Center
        style={{
          minHeight: '100vh',
        }}
      >
        <Container size={440} px="md" py="xl">
          <Stack align="center" gap="md" mb="xl">
            <IconHeart size={48} color="#2aa6ff" fill="#2aa6ff" />
            <Title order={1} ta="center" c="pastelBlue.8">
              Rejoins-nous !
            </Title>
            <Text ta="center" c="dimmed" size="md">
              Crée ton compte et rejoins une communauté bienveillante
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
                  label="Email"
                  placeholder="ton@email.com"
                  required
                  {...form.getInputProps('email')}
                />

                <TextInput
                  label="Nom d'utilisateur"
                  placeholder="Choisis un pseudo"
                  required
                  {...form.getInputProps('username')}
                />

                <TextInput
                  label="Prénom"
                  placeholder="Ton prénom (optionnel)"
                  {...form.getInputProps('firstName')}
                />

                <TextInput
                  label="Nom"
                  placeholder="Ton nom (optionnel)"
                  {...form.getInputProps('lastName')}
                />

                <PasswordInput
                  label="Mot de passe"
                  placeholder="Au moins 6 caractères"
                  required
                  {...form.getInputProps('password')}
                />

                <PasswordInput
                  label="Confirmer le mot de passe"
                  placeholder="Répète ton mot de passe"
                  required
                  {...form.getInputProps('confirmPassword')}
                />

                <Button type="submit" color="pastelBlue" fullWidth mt="md" loading={registerMutation.isPending}>
                  Créer mon compte
                </Button>

                <Text ta="center" size="sm">
                  Déjà un compte ?{' '}
                  <Anchor component={Link} href="/login" c="pastelBlue">
                    Connecte-toi
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
