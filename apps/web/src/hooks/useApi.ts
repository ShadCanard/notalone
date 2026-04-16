import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { graphqlClient } from '@/lib/graphql-client';
import type { User, Post as PostType, Attachment as AttachmentType, Comment as CommentType, Like, Message, Conversation, AuthPayload } from '@/types';
import { gql } from 'graphql-request';

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
    keepPreviousData: true,
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
  return useInfiniteQuery({
    queryKey: ['messages', userId, 'infinite'],
    enabled: !!userId,
    queryFn: ({ pageParam = 0 }) =>
      graphqlClient.request<{ messages: Message[] }>(MESSAGES_PAGINATED_QUERY, {
        userId,
        limit,
        offset: pageParam,
      }),
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.messages.length < limit) return undefined;
      return pages.length * limit;
    },
  });
}

export function useConversations(limit = 50, offset = 0) {
  return useQuery({
    queryKey: ['conversations', limit, offset],
    queryFn: () => graphqlClient.request<{ conversations: Conversation[] }>(CONVERSATIONS_QUERY, { limit, offset }),
  });
}

export function useNotifications(limit = 20, offset = 0) {
  return useQuery({
    queryKey: ['notifications', limit, offset],
    queryFn: () => graphqlClient.request<{ notifications: Array<any> }>(NOTIFICATIONS_QUERY, { limit, offset }),
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { id: string }) => graphqlClient.request<{ markNotificationRead: { id: string; read: boolean } }>(MARK_NOTIFICATION_READ_MUTATION, variables),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { receiverId: string; content: string }) => graphqlClient.request<{ sendMessage: Message }>(SEND_MESSAGE_MUTATION, variables),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['messages', vars.receiverId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useMarkMessageRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { id: string }) => graphqlClient.request<{ markMessageRead: { id: string; read: boolean } }>(MARK_MESSAGE_READ_MUTATION, variables),
    onSuccess: (_data, vars) => {
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
  const queryClient = useQueryClient();
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
