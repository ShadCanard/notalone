import { useEffect, useMemo, useRef } from 'react';
import { Center, Loader, Stack, Card, Text, Alert } from '@mantine/core';
import PostCard from './PostCard';
import { usePosts } from '@/hooks/useApi';
import type { Post as PostType } from '@/types';

type FeedComponentProps = {
  posts?: PostType[];
  isLoading?: boolean;
  error?: unknown;
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  emptyStateMessage?: string;
};

export default function FeedComponent({
  posts: externalPosts,
  isLoading: externalLoading,
  error: externalError,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  emptyStateMessage = 'Pas encore de posts. Sois le premier à partager ! 🌟',
}: FeedComponentProps) {
  const isControlled = Array.isArray(externalPosts);
  const {
    data: internalData,
    isLoading: internalLoading,
    error: internalError,
    fetchNextPage: internalFetchNextPage,
    hasNextPage: internalHasNextPage,
    isFetchingNextPage: internalIsFetchingNextPage,
  } = usePosts(20, !isControlled);

  const posts = useMemo(() => {
    if (isControlled) return externalPosts ?? [];
    const pages = ((internalData as any)?.pages ?? []) as Array<{ posts: PostType[] }>;
    return pages.flatMap((page) => page.posts);
  }, [externalPosts, internalData, isControlled]);

  const isLoading = isControlled ? externalLoading : internalLoading;
  const error = isControlled ? externalError : internalError;
  const hasError = Boolean(error);
  const fetchMore = isControlled ? fetchNextPage : internalFetchNextPage;
  const hasMore = isControlled ? hasNextPage : internalHasNextPage;
  const loadingMore = isControlled ? isFetchingNextPage : internalIsFetchingNextPage;
  const showEndMessage = posts.length > 0 && !loadingMore && (hasMore === false || (isControlled && !fetchMore));

  const loaderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!loaderRef.current || !fetchMore || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          fetchMore();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [fetchMore, hasMore]);

  return (
    <Stack gap="xl">
      {isLoading && (
        <Center py="xl">
          <Loader color="pastelBlue" size="lg" />
        </Center>
      )}

      {hasError && (
        <Alert color="red" title="Erreur">
          Impossible de charger les posts. Vérifie que le serveur est bien lancé.
        </Alert>
      )}

      {posts.length === 0 && !isLoading && !hasError && (
        <Card padding="xl" radius="lg" withBorder style={{ borderColor: '#FFE8CC' }}>
          <Text ta="center" c="dimmed" size="lg">
            {emptyStateMessage}
          </Text>
        </Card>
      )}

      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      <div ref={loaderRef} />

      {loadingMore && (
        <Center py="xl">
          <Loader color="pastelBlue" size="lg" />
        </Center>
      )}

      {showEndMessage && (
        <Card padding="md" radius="lg" withBorder style={{ borderColor: '#FFE8CC' }}>
          <Text ta="center" c="dimmed" size="sm">
            Pas de posts supplémentaires
          </Text>
        </Card>
      )}
    </Stack>
  );
}
