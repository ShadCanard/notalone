export const typeDefs = /* GraphQL */ `
    type User {
      id: ID!
      email: String
      username: String!
      firstName: String
      lastName: String
      bio: String
      role: String
      avatar: String
      createdAt: String!
      posts: [Post!]!
    }

    type Post {
      id: ID!
      content: String!
      mood: String
      isPublic: Boolean!
      payload: JSON
      createdAt: String!
      author: User!
      comments: [Comment!]!
      likes: [Like!]!
      attachments: [Attachment!]!
      likesCount: Int!
      commentsCount: Int!
      isLikedByMe: Boolean!
    }

    scalar JSON

    type Attachment {
      id: ID!
      filename: String!
      path: String!
      mimeType: String
      checksum: String!
      size: Int!
      createdAt: String!
      data: JSON
    }

    type Comment {
      id: ID!
      content: String!
      createdAt: String!
      author: User!
      post: Post!
    }

    type Like {
      id: ID!
      user: User!
      post: Post!
      createdAt: String!
    }

    type Message {
      id: ID!
      content: String!
      read: Boolean!
      createdAt: String!
      sender: User!
      receiver: User!
    }

    type TypingStatus {
      sender: User!
      receiver: User!
      isTyping: Boolean!
    }

    type Conversation {
      id: ID!
      partner: User!
      lastMessage: String!
      lastMessageAt: String!
      unreadCount: Int!
    }

    enum NotificationType {
      NEW_COMMENT
      NEW_LIKE
      NEW_POST
    }

    type Notification {
      id: ID!
      user: User!
      author: User!
      type: NotificationType!
      linkId: ID!
      read: Boolean!
      createdAt: String!
    }

    type AuthPayload {
      token: String!
      user: User!
    }

    type Query {
      me: User
      user(id: ID!): User
      users: [User!]!
      posts(limit: Int, offset: Int): [Post!]!
      post(id: ID!): Post
      myPosts: [Post!]!
      conversations(limit: Int, offset: Int): [Conversation!]!
      messages(userId: ID!): [Message!]!
      notifications(limit: Int, offset: Int): [Notification!]!
    }

    type Subscription {
      notificationReceived(userId: ID!): Notification!
      messageReceived(userId: ID!): Message!
      typingStatus(userId: ID!): TypingStatus!
    }

    type Mutation {
      register(email: String!, username: String!, password: String!, firstName: String, lastName: String): AuthPayload!
      login(identifier: String!, password: String!): AuthPayload!
      createPost(content: String!, mood: String, isPublic: Boolean, attachmentIds: [ID!], payload: JSON): Post!
      updatePost(id: ID!, content: String!): Post!
      deletePost(id: ID!): Boolean!
      createComment(postId: ID!, content: String!): Comment!
      updateComment(id: ID!, content: String!): Comment!
      deleteComment(id: ID!): Boolean!
      toggleLike(postId: ID!): Boolean!
      sendMessage(receiverId: ID!, content: String!): Message!
      markMessageRead(id: ID!): Message!
      setTypingStatus(receiverId: ID!, isTyping: Boolean!): Boolean!
      markNotificationRead(id: ID!): Notification!
      updateProfile(firstName: String, lastName: String, bio: String, avatar: String, userId: ID): User!
      updateUserRole(userId: ID!, role: String!): User!
      deleteUser(id: ID!): Boolean!
    }
  `;
