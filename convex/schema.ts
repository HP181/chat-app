// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.string(),
    username: v.optional(v.string()),
    bio: v.optional(v.string()),
    lastSeen: v.optional(v.number()),
    themePreference: v.optional(v.string()),
  }).index("by_clerk_id", ["clerkId"]),

  // Chats table (direct messages between two users)
  chats: defineTable({
    participantIds: v.array(v.string()),
    createdAt: v.number(),
    lastMessageAt: v.optional(v.number()),
    lastMessagePreview: v.optional(v.string()),
    unreadBy: v.optional(v.array(v.string())), // New field to track unread status per user
  }).index("by_participants", ["participantIds"]),

  // Messages table
  messages: defineTable({
    chatId: v.string(),
    senderId: v.string(),
    content: v.string(),
    timestamp: v.number(),
    mediaUrl: v.optional(v.string()),
    mediaType: v.optional(v.string()),
    isDeleted: v.optional(v.boolean()),
    reactions: v.optional(v.array(v.object({
      userId: v.string(),
      reaction: v.string(),
    }))),
    readBy: v.optional(v.array(v.string())),
  })
  .index("by_chat", ["chatId"])
  .index("by_timestamp", ["timestamp"]),

  // Groups table
  groups: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    createdBy: v.string(),
    createdAt: v.number(),
    memberIds: v.array(v.string()),
    adminIds: v.array(v.string()),
    lastMessageAt: v.optional(v.number()),
    lastMessagePreview: v.optional(v.string()),
    unreadBy: v.optional(v.array(v.string())), // New field for groups too
  }).index("by_member", ["memberIds"]),

  // Group messages table
  groupMessages: defineTable({
    groupId: v.string(),
    senderId: v.string(),
    content: v.string(),
    timestamp: v.number(),
    mediaUrl: v.optional(v.string()),
    mediaType: v.optional(v.string()),
    isDeleted: v.optional(v.boolean()),
    reactions: v.optional(v.array(v.object({
      userId: v.string(),
      reaction: v.string(),
    }))),
    readBy: v.optional(v.array(v.string())),
  })
  .index("by_group", ["groupId"])
  .index("by_timestamp", ["timestamp"]),
});