import { useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { graphqlClient } from '@/lib/graphql-client';
import { createClient } from 'graphql-ws';
import { useRouter } from 'next/router';
import { notifications as mantineNotifications } from '@mantine/notifications';
import type {
  User,
  Post as PostType,
  Attachment as AttachmentType,
  Comment as CommentType,
  Message,
  Conversation,
  AuthPayload,
  Notification,
  TypingStatus,
  NotificationsQueryData,
  ConversationsQueryData,
  MessageSubscriptionPayload,
  TypingStatusSubscriptionPayload,
  CommentCreatedSubscriptionPayload,
  PostCreatedSubscriptionPayload,
  PaginatedMessagesData,
  InfiniteMessagesData,
  PostQueryData,
  PostPagesData,
} from '@/types';
import { getNotificationText } from '@/lib/tools';
import { gql } from 'graphql-request';

type Comment = CommentType;

// --- Auth Queries ---

const LOGIN_MUTATION = gql`
  mutation Login($identifier: String!, $password: String!) {
    login(identifier: $identifier, password: $password) {
      token
      user {
        id
        email
        username
        firstName
        lastName
        bio
        avatar
        role
      }
    }
  }
`;

const REGISTER_MUTATION = gql`
  mutation Register($email: String!, $username: String!, $password: String!, $firstName: String, $lastName: String) {
    register(email: $email, username: $username, password: $password, firstName: $firstName, lastName: $lastName) {
      token
      user {
        id
        email
        username
        firstName
        lastName
        bio
        avatar
        role
      }
    }
  }
`;

const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      username
      firstName
      lastName
      role
      bio
      avatar
    }
  }
`;

// --- Post Queries ---

const POSTS_QUERY = gql`
  query Posts($limit: Int, $offset: Int) {
    posts(limit: $limit, offset: $offset) {
      id
      content
      mood
      isPublic
      payload
      createdAt
      attachments { id filename path mimeType size createdAt data }
      likesCount
      commentsCount
      isLikedByMe
      author {
        id
        username
        firstName
        lastName
        avatar
      }
      comments {
        id
        content
        createdAt
        author {
          id
          username
          avatar
        }
      }
    }
  }
`;

const CREATE_POST_MUTATION = gql`
  mutation CreatePost($content: String!, $mood: String, $isPublic: Boolean, $attachmentIds: [ID!], $payload: JSON) {
    createPost(content: $content, mood: $mood, isPublic: $isPublic, attachmentIds: $attachmentIds, payload: $payload) {
      id
      content
      mood
      isPublic
      payload
      createdAt
      attachments { id filename path mimeType size createdAt data }
      likesCount
      commentsCount
      isLikedByMe
      author {
        id
        username
        firstName
        lastName
        avatar
      }
    }
  }
`;

const UPDATE_POST_MUTATION = gql`
  mutation UpdatePost($id: ID!, $content: String!) {
    updatePost(id: $id, content: $content) {
      id
      content
      mood
      isPublic
      payload
      createdAt
      attachments { id filename path mimeType size createdAt data }
      likesCount
      commentsCount
      isLikedByMe
      author {
        id
        username
        firstName
        lastName
        avatar
      }
      comments {
        id
        content
        createdAt
        author {
          id
          username
          avatar
        }
      }
      likes {
        id
        user {
          id
          username
          avatar
        }
        createdAt
      }
    }
  }
`;

const POST_QUERY = gql`
  query Post($id: ID!) {
    post(id: $id) {
      id
      content
      mood
      isPublic
      payload
      createdAt
      attachments { id filename path mimeType size createdAt data }
      likesCount
      commentsCount
      isLikedByMe
      author { id username firstName lastName avatar }
      comments { id content createdAt author { id username avatar } }
    }
  }
`;

const TOGGLE_LIKE_MUTATION = gql`
  mutation ToggleLike($postId: ID!) {
    toggleLike(postId: $postId)
  }
`;

const DELETE_POST_MUTATION = gql`
  mutation DeletePost($id: ID!) {
    deletePost(id: $id)
  }
`;

const CREATE_COMMENT_MUTATION = gql`
  mutation CreateComment($postId: ID!, $content: String!) {
    createComment(postId: $postId, content: $content) {
      id
      content
      createdAt
      author {
        id
        username
        avatar
      }
    }
  }
`;

const UPDATE_COMMENT_MUTATION = gql`
  mutation UpdateComment($id: ID!, $content: String!) {
    updateComment(id: $id, content: $content) {
      id
      content
      createdAt
      author {
        id
        username
        avatar
      }
    }
  }
`;

const DELETE_COMMENT_MUTATION = gql`
  mutation DeleteComment($id: ID!) {
    deleteComment(id: $id)
  }
`;

const MESSAGES_QUERY = gql`
  query Messages($userId: ID!) {
    messages(userId: $userId) {
      id
      content
      read
      createdAt
      sender { id username avatar }
      receiver { id username avatar }
    }
  }
`;

const MESSAGES_PAGINATED_QUERY = gql`
  query MessagesPaginated($userId: ID!, $limit: Int, $offset: Int) {
    messagesPaginated(userId: $userId, limit: $limit, offset: $offset) {
      id
      content
      read
      createdAt
      sender { id username avatar }
      receiver { id username avatar }
    }
  }
`;

const CONVERSATIONS_QUERY = gql`
  query Conversations($limit: Int, $offset: Int) {
    conversations(limit: $limit, offset: $offset) {
      id
      lastMessage
      lastMessageAt
      unreadCount
      partner {
        id
        username
        avatar
      }
    }
  }
`;

const NOTIFICATIONS_QUERY = gql`
  query Notifications($limit: Int, $offset: Int) {
    notifications(limit: $limit, offset: $offset) {
      id
      type
      linkId
      read
      createdAt
      author { id username avatar }
    }
  }
`;

const NOTIFICATIONS_SUBSCRIPTION = gql`
  subscription NotificationReceived($userId: ID!) {
    notificationReceived(userId: $userId) {
      id
      type
      linkId
      read
      createdAt
      author { id username avatar }
      user { id username avatar }
    }
  }
`;

const MESSAGE_RECEIVED_SUBSCRIPTION = gql`
  subscription MessageReceived($userId: ID!) {
    messageReceived(userId: $userId) {
      id
      content
      read
      createdAt
      sender { id username avatar }
      receiver { id username avatar }
    }
  }
`;

const TYPING_STATUS_SUBSCRIPTION = gql`
  subscription TypingStatus($userId: ID!) {
    typingStatus(userId: $userId) {
      sender { id username avatar }
      receiver { id username avatar }
      isTyping
    }
  }
`;

const COMMENT_CREATED_SUBSCRIPTION = gql`
  subscription CommentCreated($postId: ID, $userId: ID) {
    commentCreated(postId: $postId, userId: $userId) {
      id
      content
      createdAt
      author { id username avatar }
      post { id }
    }
  }
`;

const POST_CREATED_SUBSCRIPTION = gql`
  subscription PostCreated($userId: ID) {
    postCreated(userId: $userId) {
      id
      content
      mood
      isPublic
      createdAt
      payload
      author { id username avatar }
      attachments { id filename path mimeType size createdAt data }
      likesCount
      commentsCount
      isLikedByMe
    }
  }
`;

const MARK_NOTIFICATION_READ_MUTATION = gql`
  mutation MarkNotificationRead($id: ID!) {
    markNotificationRead(id: $id) {
      id
      read
    }
  }
`;

const SEND_MESSAGE_MUTATION = gql`
  mutation SendMessage($receiverId: ID!, $content: String!) {
    sendMessage(receiverId: $receiverId, content: $content) {
      id
      content
      createdAt
      sender { id username avatar }
      receiver { id username avatar }
    }
  }
`;

const MARK_MESSAGE_READ_MUTATION = gql`
  mutation MarkMessageRead($id: ID!) {
    markMessageRead(id: $id) {
      id
      read
    }
  }
`;

const SET_TYPING_STATUS_MUTATION = gql`
  mutation SetTypingStatus($receiverId: ID!, $isTyping: Boolean!) {
    setTypingStatus(receiverId: $receiverId, isTyping: $isTyping)
  }
`;

const UPDATE_PROFILE_MUTATION = gql`
  mutation UpdateProfile($firstName: String, $lastName: String, $bio: String, $avatar: String) {
    updateProfile(firstName: $firstName, lastName: $lastName, bio: $bio, avatar: $avatar) {
      id
      email
      username
      firstName
      lastName
      bio
      avatar
    }
  }
`;

const USERS_QUERY = gql`
  query Users {
    users {
      id
      email
      username
      firstName
      lastName
      bio
      avatar
      createdAt
      role
    }
  }
`;

const USER_QUERY = gql`
  query User($id: ID!) {
    user(id: $id) {
      id
      email
      username
      firstName
      lastName
      bio
      avatar
      createdAt
      role
      posts {
        id
        content
        mood
        isPublic
        createdAt
        attachments { id filename path mimeType size createdAt data }
        likesCount
        commentsCount
        isLikedByMe
        author { id username firstName lastName avatar }
        comments { id content createdAt author { id username avatar } }
      }
    }
  }
`;

const UPDATE_USER_ROLE_MUTATION = gql`
  mutation UpdateUserRole($userId: ID!, $role: String!) {
    updateUserRole(userId: $userId, role: $role) {
      id
      role
    }
  }
`;

const DELETE_USER_MUTATION = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`;

// --- Hooks ---

// Use shared `AuthPayload` for login/register responses

export function useLogin() {
  return useMutation({
    mutationFn: (variables: { identifier: string; password: string }) =>
      graphqlClient.request<{ login: AuthPayload }>(LOGIN_MUTATION, variables),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (variables: { email: string; username: string; password: string; firstName?: string; lastName?: string }) =>
      graphqlClient.request<{ register: AuthPayload }>(REGISTER_MUTATION, variables),
  });
}

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => graphqlClient.request<{ me: User | null }>(ME_QUERY),
  });
}

// Use shared `Post` type from `@/types`
type Post = PostType;

export function usePosts(limit = 20, enabled = true) {
  return useInfiniteQuery<{ posts: Post[] }, Error, { posts: Post[] }, ['posts', number]>({
    queryKey: ['posts', limit],
    enabled,
    queryFn: ({ pageParam = 0 }) => graphqlClient.request<{ posts: Post[] }>(POSTS_QUERY, { limit, offset: pageParam }),
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.posts.length < limit) return undefined;
      return pages.length * limit;
    },
    initialPageParam: 0,
  });
}

export function usePost(id?: string, enabled = true) {
  return useQuery({
    queryKey: ['post', id],
    enabled: enabled && !!id,
    queryFn: () => graphqlClient.request<{ post: Post }>(POST_QUERY, { id }),
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { content: string; mood?: string; isPublic?: boolean; attachmentIds?: string[]; payload?: Record<string, unknown> }) =>
      graphqlClient.request<{ createPost: Post }>(CREATE_POST_MUTATION, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { id: string; content: string }) =>
      graphqlClient.request<{ updatePost: Post }>(UPDATE_POST_MUTATION, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post'] });
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
    },
  });
}

export function useToggleLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { postId: string }) =>
      graphqlClient.request<{ toggleLike: boolean }>(TOGGLE_LIKE_MUTATION, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { postId: string; content: string }) =>
      graphqlClient.request<{ createComment: CommentType }>(CREATE_COMMENT_MUTATION, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useUpdateComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { id: string; content: string }) =>
      graphqlClient.request<{ updateComment: CommentType }>(UPDATE_COMMENT_MUTATION, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { id: string }) =>
      graphqlClient.request<{ deleteComment: boolean }>(DELETE_COMMENT_MUTATION, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { id: string }) =>
      graphqlClient.request<{ deletePost: boolean }>(DELETE_POST_MUTATION, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useMessages(userId?: string) {
  return useQuery({
    queryKey: ['messages', userId],
    enabled: !!userId,
    queryFn: () => graphqlClient.request<{ messages: Message[] }>(MESSAGES_QUERY, { userId }),
  });
}

export function useInfiniteMessages(userId?: string, limit = 50) {
  return useInfiniteQuery<InfiniteMessagesPage, Error, PaginatedMessagesData, ['messages', string | undefined, 'infinite']>({
    queryKey: ['messages', userId, 'infinite'],
    enabled: !!userId,
    queryFn: async ({ pageParam = 0 }) => {
      const result = await graphqlClient.request<PaginatedMessagesData>(MESSAGES_PAGINATED_QUERY, {
        userId,
        limit,
        offset: pageParam,
      });
      return { messages: result.messagesPaginated };
    },
    getNextPageParam: (lastPage, pages) => {
      const pageMessages = lastPage?.messages ?? [];
      if (pageMessages.length < limit) return undefined;
      return pages.length * limit;
    },
    initialPageParam: 0,
  });
}

export function useConversations(limit = 50, offset = 0) {
  return useQuery({
    queryKey: ['conversations', limit, offset],
    queryFn: () => graphqlClient.request<{ conversations: Conversation[] }>(CONVERSATIONS_QUERY, { limit, offset }),
  });
}

function getWebSocketUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/graphql';
  return apiUrl.replace(/^http/, 'ws');
}

export function useNotifications(limit = 20, offset = 0) {
  return useQuery<NotificationsQueryData>({
    queryKey: ['notifications', limit, offset],
    queryFn: () => graphqlClient.request<NotificationsQueryData>(NOTIFICATIONS_QUERY, { limit, offset }),
  });
}

export function useNotificationSubscription(userId?: string, token?: string | null) {
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    if (!userId || !token) return;

    const client = createClient({
      url: getWebSocketUrl(),
      connectionParams: {
        authorization: `Bearer ${token}`,
      },
    });

    const dispose = client.subscribe(
      {
        query: NOTIFICATIONS_SUBSCRIPTION,
        variables: { userId },
      },
      {
        next: (result: { data?: MessageSubscriptionPayload | NotificationSubscriptionPayload | TypingStatusSubscriptionPayload }) => {
          const payload = result.data?.notificationReceived;
          if (!payload) return;

          queryClient.setQueryData<NotificationsQueryData>(['notifications', 20, 0], (oldData) => {
            const existing = oldData?.notifications ?? [];
            const merged = [payload, ...existing].filter(
              (item: Notification, index: number, arr: Notification[]) => arr.findIndex((value) => value.id === item.id) === index
            );
            return { notifications: merged.slice(0, 50) };
          });

          mantineNotifications.show({
            title: 'Nouvelle notification',
            message: getNotificationText(payload),
            autoClose: 7000,
            color: 'pastelBlue',
            style: { cursor: 'pointer' },
            onClick: () => router.push(`/posts/${payload.linkId}`),
          });
        },
        error: (err) => {
          console.warn('Notification subscription error', err);
        },
        complete: () => {
          console.info('Notification subscription completed');
        },
      }
    );

    return () => {
      dispose();
      client.dispose();
    };
  }, [queryClient, router, token, userId]);
}

export function useChatSubscriptions(userId?: string, token?: string | null, onTypingStatus?: (typingStatus: TypingStatus) => void, onMessageReceived?: (message: Message) => void) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId || !token) return;

    const client = createClient({
      url: getWebSocketUrl(),
      connectionParams: {
        authorization: `Bearer ${token}`,
      },
    });

    const disposeMessage = client.subscribe(
      {
        query: MESSAGE_RECEIVED_SUBSCRIPTION,
        variables: { userId },
      },
      {
        next: (result: { data?: MessageSubscriptionPayload }) => {
          const payload = result.data?.messageReceived;
          if (!payload) return;

          const sender = payload.sender;

          queryClient.setQueryData<ConversationsQueryData>(['conversations', 50, 0], (oldData) => {
            const existing = oldData?.conversations ?? [];
            const updated = existing.map((conversation) => {
              if (conversation.id !== sender.id) return conversation;
              return {
                ...conversation,
                lastMessage: payload.content,
                lastMessageAt: payload.createdAt,
                unreadCount:
                  sender.id === userId
                    ? 0
                    : (conversation.unreadCount ?? 0) + 1,
              };
            });

            if (existing.some((conversation) => conversation.id === sender.id)) {
              return { conversations: updated };
            }

            const newConversation = {
              id: sender.id,
              partner: sender,
              lastMessage: payload.content,
              lastMessageAt: payload.createdAt,
              unreadCount: sender.id === userId ? 0 : 1,
            };
            return { conversations: [newConversation, ...existing].slice(0, 50) };
          });

          queryClient.setQueryData<{ messages: Message[] }>(['messages', sender.id], (oldData) => {
            const existing = oldData?.messages ?? [];
            if (existing.some((message) => message.id === payload.id)) return oldData;
            return { messages: [...existing, payload] };
          });

          queryClient.setQueryData<InfiniteMessagesData>(['messages', sender.id, 'infinite'], (oldData) => {
            const pages = oldData?.pages ?? [];
            const firstPage = pages[0];
            const existingMessages = firstPage?.messages ?? [];
            if (existingMessages.some((message) => message.id === payload.id)) return oldData;
            const updatedFirstPage = {
              messages: [payload, ...existingMessages],
            };
            if (pages.length === 0) {
              return {
                pages: [updatedFirstPage],
              };
            }
            return {
              ...oldData,
              pages: [updatedFirstPage, ...pages.slice(1)],
            };
          });

          if (onMessageReceived) {
            onMessageReceived(payload);
          }
        },
        error: (err) => {
          console.error('Message subscription error', err);
        },
        complete: () => {
          console.info('Message subscription completed');
        },
      }
    );

    const disposeTyping = client.subscribe(
      {
        query: TYPING_STATUS_SUBSCRIPTION,
        variables: { userId },
      },
      {
        next: (result: { data?: TypingStatusSubscriptionPayload }) => {
          const payload = result.data?.typingStatus;
          if (!payload) return;
          if (onTypingStatus) {
            onTypingStatus(payload);
          }
        },
        error: (err) => {
          console.error('Typing subscription error', err);
        },
        complete: () => {
          console.info('Typing subscription completed');
        },
      }
    );

    return () => {
      disposeMessage();
      disposeTyping();
      client.dispose();
    };
  }, [queryClient, token, userId, onTypingStatus, onMessageReceived]);
}

function addCommentToPostCache(queryClient: ReturnType<typeof useQueryClient>, postId: string, comment: Comment) {
  queryClient.setQueryData<PostQueryData>(['post', postId], (oldData) => {
    const post = oldData?.post;
    if (!post) return oldData;
    if (post.comments?.some((existing: Comment) => existing.id === comment.id)) return oldData;
    return {
      post: {
        ...post,
        comments: [...(post.comments ?? []), comment],
        commentsCount: (post.commentsCount ?? 0) + 1,
      },
    };
  });

  queryClient.setQueryData<PostPagesData>(['posts', 20], (oldData) => {
    if (!oldData?.pages) return oldData;
    return {
      ...oldData,
      pages: oldData.pages.map((page) => ({
        posts: page.posts.map((post) => {
          if (post.id !== postId) return post;
          if (post.comments?.some((existing: Comment) => existing.id === comment.id)) return post;
          return {
            ...post,
            comments: [...(post.comments ?? []), comment],
            commentsCount: (post.commentsCount ?? 0) + 1,
          };
        }),
      })),
    };
  });
}

function addPostToCache(queryClient: ReturnType<typeof useQueryClient>, post: Post) {
  queryClient.setQueryData<PostPagesData>(['posts', 20], (oldData) => {
    if (!oldData?.pages) return oldData;
    const firstPage = oldData.pages[0];
    const alreadyExists = firstPage?.posts?.some((existing: Post) => existing.id === post.id);
    if (alreadyExists) return oldData;
    return {
      ...oldData,
      pages: [
        {
          posts: [post, ...(firstPage?.posts ?? [])],
        },
        ...oldData.pages.slice(1),
      ],
    };
  });

  if (post.author?.id) {
    queryClient.setQueryData<{ user: User }>(['user', post.author.id], (oldData) => {
      const user = oldData?.user;
      if (!user) return oldData;
      const existingPosts = user.posts ?? [];
      if (existingPosts.some((existing: Post) => existing.id === post.id)) return oldData;
      return {
        user: {
          ...user,
          posts: [post, ...existingPosts],
        },
      };
    });
  }
}

export function useCommentSubscriptions(token?: string | null, userId?: string, postId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) return;

    const client = createClient({
      url: getWebSocketUrl(),
      connectionParams: {
        authorization: `Bearer ${token}`,
      },
    });

    const variables: Record<string, string> = {};
    if (postId) variables.postId = postId;
    if (userId) variables.userId = userId;

    const dispose = client.subscribe(
      {
        query: COMMENT_CREATED_SUBSCRIPTION,
        variables: Object.keys(variables).length ? variables : undefined,
      },
      {
        next: (result: { data?: CommentCreatedSubscriptionPayload }) => {
          const payload = result.data?.commentCreated;
          if (!payload) return;
          const postId = payload.post?.id;
          if (!postId) return;
          addCommentToPostCache(queryClient, postId, payload);
        },
        error: (err) => {
          console.error('Comment subscription error', err);
        },
        complete: () => {
          console.info('Comment subscription completed');
        },
      }
    );

    return () => {
      dispose();
      client.dispose();
    };
  }, [queryClient, token, userId, postId]);
}

export function usePostSubscriptions(token?: string | null, userId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) return;

    const client = createClient({
      url: getWebSocketUrl(),
      connectionParams: {
        authorization: `Bearer ${token}`,
      },
    });

    const variables: Record<string, string> = {};
    if (userId) variables.userId = userId;

    const dispose = client.subscribe(
      {
        query: POST_CREATED_SUBSCRIPTION,
        variables: Object.keys(variables).length ? variables : undefined,
      },
      {
        next: (result: { data?: PostCreatedSubscriptionPayload }) => {
          const payload = result.data?.postCreated;
          if (!payload) return;
          addPostToCache(queryClient, payload);
        },
        error: (err) => {
          console.error('Post subscription error', err);
        },
        complete: () => {
          console.info('Post subscription completed');
        },
      }
    );

    return () => {
      dispose();
      client.dispose();
    };
  }, [queryClient, token, userId]);
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { id: string }) => graphqlClient.request<{ markNotificationRead: { id: string; read: boolean } }>(MARK_NOTIFICATION_READ_MUTATION, variables),
    onSuccess: (_data, _vars) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { receiverId: string; content: string }) => graphqlClient.request<{ sendMessage: Message }>(SEND_MESSAGE_MUTATION, variables),
    onSuccess: (_data, _vars) => {
      queryClient.invalidateQueries({ queryKey: ['messages', _vars.receiverId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useMarkMessageRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { id: string }) => graphqlClient.request<{ markMessageRead: { id: string; read: boolean } }>(MARK_MESSAGE_READ_MUTATION, variables),
    onSuccess: (_data, _vars) => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useSetTypingStatus() {
  return useMutation({
    mutationFn: (variables: { receiverId: string; isTyping: boolean }) =>
      graphqlClient.request<{ setTypingStatus: boolean }>(SET_TYPING_STATUS_MUTATION, variables),
    onError: (error, variables) => {
      console.error('[Chat] setTypingStatus failed', variables, error);
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { firstName?: string; lastName?: string; bio?: string; avatar?: string }) =>
      graphqlClient.request(UPDATE_PROFILE_MUTATION, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useUploadAvatar() {
  return useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append('avatar', file);
      const apiBase = (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.replace(/\/graphql\/?$/, '')) || 'http://localhost:4000';
      const res = await fetch(`${apiBase}/upload/avatar`, {
        method: 'POST',
        body: fd,
        credentials: 'include',
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Upload failed');
      }
      const data = await res.json();
      // no automatic cache invalidation here — caller will update profile if needed
      return data as { url: string };
    },
  });
}

export function useUploadAttachments() {
  return useMutation({
    mutationFn: async (files: File[]) => {
      const fd = new FormData();
      files.forEach((f) => fd.append('files', f));
      const apiBase = (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.replace(/\/graphql\/?$/, '')) || 'http://localhost:4000';
      const res = await fetch(`${apiBase}/upload/attachments`, {
        method: 'POST',
        body: fd,
        credentials: 'include',
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Upload failed');
      }
      const data = await res.json();
      return data as { attachments: AttachmentType[] };
    },
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => graphqlClient.request<{ users: User[] }>(USERS_QUERY),
  });
}

export function useUser(id?: string) {
  return useQuery({
    queryKey: ['user', id],
    enabled: !!id,
    queryFn: () => graphqlClient.request<{ user: User & { posts?: Post[] } }>(USER_QUERY, { id }),
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { userId: string; role: string }) => graphqlClient.request<{ updateUserRole: User }>(UPDATE_USER_ROLE_MUTATION, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { id: string }) => graphqlClient.request<{ deleteUser: boolean }>(DELETE_USER_MUTATION, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
