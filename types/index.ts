// Shared types used by frontend and backend

export interface User {
  id: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  createdAt?: string;
  role?: string;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: User;
}

export interface Attachment {
  id: string;
  filename: string;
  path: string;
  mimeType?: string | null;
  checksum?: string | null;
  size?: number | null;
  createdAt?: string | null;
}

export interface Post {
  id: string;
  content: string;
  mood?: string | null;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  isLikedByMe: boolean;
  author: User;
  comments: Comment[];
  attachments?: Attachment[];
}
