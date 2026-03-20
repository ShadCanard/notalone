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
      createdAt: String!
      author: User!
      comments: [Comment!]!
      likes: [Like!]!
      attachments: [Attachment!]!
      likesCount: Int!
      commentsCount: Int!
      isLikedByMe: Boolean!
    }

    type Attachment {
      id: ID!
      filename: String!
      path: String!
      mimeType: String
      checksum: String!
      size: Int!
      createdAt: String!
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
      messages(userId: ID!): [Message!]!
    }

    type Mutation {
      register(email: String!, username: String!, password: String!, firstName: String, lastName: String): AuthPayload!
      login(identifier: String!, password: String!): AuthPayload!
      createPost(content: String!, mood: String, isPublic: Boolean, attachmentIds: [ID!]): Post!
      deletePost(id: ID!): Boolean!
      createComment(postId: ID!, content: String!): Comment!
      toggleLike(postId: ID!): Boolean!
      sendMessage(receiverId: ID!, content: String!): Message!
      markMessageRead(id: ID!): Message!
      updateProfile(firstName: String, lastName: String, bio: String, avatar: String, userId: ID): User!
      updateUserRole(userId: ID!, role: String!): User!
      deleteUser(id: ID!): Boolean!
    }
  `;