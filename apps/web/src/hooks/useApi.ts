import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { graphqlClient } from '@/lib/graphql-client';
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
      createdAt
      attachments { id filename path mimeType size createdAt }
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
  mutation CreatePost($content: String!, $mood: String, $isPublic: Boolean, $attachmentIds: [ID!]) {
    createPost(content: $content, mood: $mood, isPublic: $isPublic, attachmentIds: $attachmentIds) {
      id
      content
      mood
      isPublic
      createdAt
      attachments { id filename path mimeType size createdAt }
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

const POST_QUERY = gql`
  query Post($id: ID!) {
    post(id: $id) {
      id
      content
      mood
      isPublic
      createdAt
      attachments { id filename path mimeType size createdAt }
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
        attachments { id filename path mimeType size createdAt }
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

interface AuthResponse {
  login?: { token: string; user: { id: string; email: string; username: string; firstName?: string; lastName?: string; bio?: string; avatar?: string } };
  register?: { token: string; user: { id: string; email: string; username: string; firstName?: string; lastName?: string; bio?: string; avatar?: string } };
}

export function useLogin() {
  return useMutation({
    mutationFn: (variables: { identifier: string; password: string }) =>
      graphqlClient.request<AuthResponse>(LOGIN_MUTATION, variables),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (variables: { email: string; username: string; password: string; firstName?: string; lastName?: string }) =>
      graphqlClient.request<AuthResponse>(REGISTER_MUTATION, variables),
  });
}

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => graphqlClient.request<{ me: { id: string; email: string; username: string; firstName?: string; lastName?: string; bio?: string; avatar?: string } | null }>(ME_QUERY),
  });
}

interface Post {
  id: string;
  content: string;
  mood?: string;
  isPublic: boolean;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  isLikedByMe: boolean;
  author: { id: string; username: string; firstName?: string; lastName?: string; avatar?: string };
  comments: Array<{ id: string; content: string; createdAt: string; author: { id: string; username: string; avatar?: string } }>;
}

export function usePosts(limit = 20, offset = 0) {
  return useQuery({
    queryKey: ['posts', limit, offset],
    queryFn: () => graphqlClient.request<{ posts: Post[] }>(POSTS_QUERY, { limit, offset }),
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
    mutationFn: (variables: { content: string; mood?: string; isPublic?: boolean; attachmentIds?: string[] }) =>
      graphqlClient.request(CREATE_POST_MUTATION, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useToggleLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { postId: string }) =>
      graphqlClient.request(TOGGLE_LIKE_MUTATION, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { postId: string; content: string }) =>
      graphqlClient.request(CREATE_COMMENT_MUTATION, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useMessages(userId?: string) {
  return useQuery({
    queryKey: ['messages', userId],
    enabled: !!userId,
    queryFn: () => graphqlClient.request<{ messages: Array<{ id: string; content: string; createdAt: string; sender: { id: string; username: string; avatar?: string }; receiver: { id: string; username: string; avatar?: string } }> }>(MESSAGES_QUERY, { userId }),
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { receiverId: string; content: string }) => graphqlClient.request(SEND_MESSAGE_MUTATION, variables),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['messages', vars.receiverId] });
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
      return data as { attachments: Array<{ id: string; filename: string; path: string; mimeType?: string; checksum: string; size: number; createdAt: string }> };
    },
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => graphqlClient.request<{ users: Array<{ id: string; email: string; username: string; firstName?: string; lastName?: string; bio?: string; avatar?: string; createdAt: string; role?: string }> }>(USERS_QUERY),
  });
}

export function useUser(id?: string) {
  return useQuery({
    queryKey: ['user', id],
    enabled: !!id,
    queryFn: () => graphqlClient.request<{ user: { id: string; email: string; username: string; firstName?: string; lastName?: string; bio?: string; avatar?: string; createdAt: string; role?: string } }>(USER_QUERY, { id }),
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { userId: string; role: string }) => graphqlClient.request(UPDATE_USER_ROLE_MUTATION, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { id: string }) => graphqlClient.request(DELETE_USER_MUTATION, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
