// Shared types used by frontend and backend

export interface User {
  id: string;
  email?: string | null;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  bio?: string | null;
  avatar?: string | null;
  createdAt?: string;
  role?: string;
  posts?: Post[];
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: User;
  post?: Post;
}

export interface Attachment {
  id: string;
  filename: string;
  path: string;
  mimeType?: string | null;
  checksum?: string | null;
  size?: number | null;
  createdAt?: string | null;
  data?: AttachmentData | null;
}

export interface Post {
  id: string;
  content: string;
  mood?: string | null;
  isPublic?: boolean;
  payload?: Record<string, any> | null;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  isLikedByMe: boolean;
  author: User;
  comments: Comment[];
  likes?: Like[];
  attachments?: Attachment[];
}

export interface AttachmentData {
  waveform?: number[] | null;
  [key: string]: any;
}

export interface Like {
  id: string;
  user: User;
  post: Post;
  createdAt: string;
}

export interface Message {
  id: string;
  content: string;
  read: boolean;
  createdAt: string;
  sender: User;
  receiver: User;
}

export interface TypingStatus {
  sender: User;
  receiver: User;
  isTyping: boolean;
}

export interface Conversation {
  id: string;
  partner: User;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface Notification {
  id: string;
  user: User;
  author: User;
  type: 'NEW_COMMENT' | 'NEW_LIKE' | 'NEW_POST';
  linkId: string;
  read: boolean;
  createdAt: string;
}

export interface AuthPayload {
  token: string;
  user: User;
}

export interface NotificationsQueryData {
  notifications: Notification[];
}

export interface ConversationsQueryData {
  conversations: Conversation[];
}

export interface MessageSubscriptionPayload {
  messageReceived: Message;
}

export interface TypingStatusSubscriptionPayload {
  typingStatus: TypingStatus;
}

export interface CommentCreatedSubscriptionPayload {
  commentCreated: Comment;
}

export interface PostCreatedSubscriptionPayload {
  postCreated: Post;
}

export interface PaginatedMessagesData {
  messagesPaginated: Message[];
}

export interface InfiniteMessagesPage {
  messages: Message[];
}

export interface InfiniteMessagesData {
  pages: InfiniteMessagesPage[];
}

export interface PostQueryData {
  post: Post;
}

export interface PostPagesData {
  pages: { posts: Post[] }[];
}