import Layout from '@/components/Layout';
import { useRouter } from 'next/router';
import { usePost } from '@/hooks/useApi';
import { Center, Loader, Container, Card, Text } from '@mantine/core';
import Head from 'next/head';
import PostCard from '@/components/PostCard';

export default function PostDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const postId = typeof id === 'string' ? id : undefined;
  const { data, isLoading } = usePost(postId);

  if (isLoading) {
    return (
      <Layout>
        <Center py="xl"><Loader /></Center>
      </Layout>
    );
  }

  const post = data?.post;

  return (
    <Layout>
      <Head>
        <title>{`Post — ${post?.id || ''}`}</title>
      </Head>

      <Container size="sm" py="xl">
        {!post && (
          <Card radius="md" padding="lg">
            <Text c="dimmed">Post introuvable.</Text>
          </Card>
        )}

        {post && <PostCard post={post} />}
      </Container>
    </Layout>
  );
}
