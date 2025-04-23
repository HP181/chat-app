import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { Id } from "./_generated/dataModel";

// Get or create a chat between two users
export const getOrCreateChat = mutation({
  args: {
    currentUserClerkId: v.string(),
    otherUserClerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user IDs from clerk IDs
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.currentUserClerkId))
      .unique();

    const otherUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.otherUserClerkId))
      .unique();

    if (!currentUser || !otherUser) {
      throw new ConvexError("One or both users not found");
    }

    // Check if a chat already exists between these users
    // Get all chats and filter in memory
    const chats = await ctx.db.query("chats").collect();
    const existingChat = chats.find(chat => 
      chat.participantIds.includes(currentUser.clerkId) && 
      chat.participantIds.includes(otherUser.clerkId)
    );

    if (existingChat) {
      return { chatId: existingChat._id.toString(), isNew: false };
    }

    // Create a new chat
    const newChatId = await ctx.db.insert("chats", {
      participantIds: [currentUser.clerkId, otherUser.clerkId],
      createdAt: Date.now(),
      lastMessageAt: Date.now(),
      lastMessagePreview: "",
      unreadBy: [], // Initialize with empty array
    });

    return { chatId: newChatId.toString(), isNew: true };
  },
});


// Get a specific chat
export const getChat = query({
  args: { chatId: v.string() },
  handler: async (ctx, args) => {
    try {
      const chat = await ctx.db.get(args.chatId as Id<"chats">);
      return chat;
    } catch (err) {
      return null;
    }
  }
});

// Send a message in a chat
export const sendMessage = mutation({
  args: {
    chatId: v.string(),
    senderId: v.string(),
    content: v.string(),
    mediaUrl: v.optional(v.string()),
    mediaType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId as Id<"chats">);
    if (!chat) {
      throw new ConvexError("Chat not found");
    }

    // Check if sender is a participant in the chat
    if (!chat.participantIds.includes(args.senderId)) {
      throw new ConvexError("User is not a participant in this chat");
    }

    // Insert the message
    const messageId = await ctx.db.insert("messages", {
      chatId: args.chatId,
      senderId: args.senderId,
      content: args.content,
      timestamp: Date.now(),
      mediaUrl: args.mediaUrl,
      mediaType: args.mediaType,
      isDeleted: false,
      readBy: [args.senderId], // Mark as read by sender
    });

    // Find the recipient user ID (the other participant)
    const recipientId = chat.participantIds.find(id => id !== args.senderId);
    
    // Update the chat with the last message preview and mark as unread for recipient
    await ctx.db.patch(args.chatId as Id<"chats">, {
      lastMessageAt: Date.now(),
      lastMessagePreview: args.content.substring(0, 50) + (args.content.length > 50 ? "..." : ""),
      // Mark as unread for the recipient only
      unreadBy: recipientId ? [recipientId] : [],
    });

    return messageId;
  },
});

// Get messages for a chat
export const getMessages = query({
  args: {
    chatId: v.string(),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    
    // Get all messages for this chat
    const allMessages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .order("desc")
      .collect();
    
    // Manually handle pagination
    let startIndex = 0;
    let endIndex = limit;
    let continuation = null;
    
    if (args.cursor) {
      try {
        startIndex = parseInt(args.cursor);
        endIndex = startIndex + limit;
      } catch (e) {
        // Invalid cursor, start from beginning
      }
    }
    
    const messages = allMessages.slice(startIndex, endIndex);
    
    if (endIndex < allMessages.length) {
      continuation = endIndex.toString();
    }

    // Map the messages to include string IDs
    const formattedMessages = messages.map((message) => ({
      ...message,
      _id: message._id.toString(),
    }));

    return {
      messages: formattedMessages,
      continuation: continuation,
    };
  },
});

// Mark messages as read
export const markAsRead = mutation({
  args: {
    chatId: v.string(),
    userId: v.string(),
    messageIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    for (const messageId of args.messageIds) {
      const message = await ctx.db.get(messageId as Id<"messages">);
      if (!message) continue;

      const readBy = message.readBy || [];
      if (!readBy.includes(args.userId)) {
        await ctx.db.patch(messageId as Id<"messages">, {
          readBy: [...readBy, args.userId],
        });
      }
    }

    return { success: true };
  },
});

// Delete a message
export const deleteMessage = mutation({
  args: {
    messageId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId as Id<"messages">);
    if (!message) {
      throw new ConvexError("Message not found");
    }

    if (message.senderId !== args.userId) {
      throw new ConvexError("You can only delete your own messages");
    }

    await ctx.db.patch(args.messageId as Id<"messages">, {
      isDeleted: true,
      content: "This message was deleted",
      mediaUrl: undefined,
      mediaType: undefined,
    });

    return { success: true };
  },
});

// Add reaction to a message
export const addReaction = mutation({
  args: {
    messageId: v.string(),
    userId: v.string(),
    reaction: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId as Id<"messages">);
    if (!message) {
      throw new ConvexError("Message not found");
    }

    const reactions = message.reactions || [];
    const existingReactionIndex = reactions.findIndex(r => r.userId === args.userId);
    
    if (existingReactionIndex !== -1) {
      // Update existing reaction
      reactions[existingReactionIndex].reaction = args.reaction;
    } else {
      // Add new reaction
      reactions.push({
        userId: args.userId,
        reaction: args.reaction,
      });
    }

    await ctx.db.patch(args.messageId as Id<"messages">, {
      reactions,
    });

    return { success: true };
  },
});

// Search messages in a chat
export const searchMessages = query({
  args: {
    chatId: v.string(),
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.searchTerm.trim()) {
      return [];
    }

    const searchTerm = args.searchTerm.toLowerCase();
    
    // Get all messages and filter in memory
    const allMessages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .collect();
      
    const messages = allMessages.filter(message => 
      message.content.toLowerCase().includes(searchTerm)
    );

    return messages.map((message) => ({
      ...message,
      _id: message._id.toString(),
    }));
  },
});

export const markChatAsRead = mutation({
  args: {
    chatId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId as Id<"chats">);
    if (!chat) {
      throw new ConvexError("Chat not found");
    }

    // Check if user is a participant
    if (!chat.participantIds.includes(args.userId)) {
      throw new ConvexError("User is not a participant in this chat");
    }

    // Remove user from the unreadBy array
    const unreadBy = chat.unreadBy || [];
    if (unreadBy.includes(args.userId)) {
      await ctx.db.patch(args.chatId as Id<"chats">, {
        unreadBy: unreadBy.filter(id => id !== args.userId),
      });
    }

    // Also mark all messages as read by this user
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .collect();

    for (const message of messages) {
      if (message.senderId !== args.userId) { // Only mark messages from others as read
        const readBy = message.readBy || [];
        if (!readBy.includes(args.userId)) {
          await ctx.db.patch(message._id, {
            readBy: [...readBy, args.userId],
          });
        }
      }
    }

    return { success: true };
  },
});




// Get message recipient status
export const getMessageRecipientStatus = query({
  args: {
    messageId: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId as Id<"messages">);
    if (!message) {
      throw new ConvexError("Message not found");
    }

    // Get chat to find recipient
    const chat = await ctx.db.get(message.chatId as Id<"chats">);
    if (!chat) {
      throw new ConvexError("Chat not found");
    }

    // Find recipient (the other participant who isn't the sender)
    const recipientId = chat.participantIds.find(id => id !== message.senderId);
    if (!recipientId) {
      return { isOnline: false };
    }

    // Get recipient user details
    const recipient = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", recipientId))
      .unique();

    if (!recipient) {
      return { isOnline: false };
    }

    // Check if recipient is online (active within last 2 minutes)
    const isOnline = recipient.lastSeen 
      ? (Date.now() - recipient.lastSeen) < 2 * 60 * 1000 
      : false;

    return { isOnline };
  },
});




export const getUserChats = query({
  args: {
    userClerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get all chats and filter in memory
    const allChats = await ctx.db.query("chats").collect();
    const chats = allChats.filter(chat => 
      chat.participantIds.includes(args.userClerkId)
    );
    
    // Sort by lastMessageAt in descending order
    chats.sort((a, b) => {
      const timeA = a.lastMessageAt || 0;
      const timeB = b.lastMessageAt || 0;
      return timeB - timeA;
    });

    // Fetch participant details for each chat
    const chatsWithDetails = await Promise.all(
      chats.map(async (chat) => {
        // Get the other participant (for UI display)
        const otherParticipantId = chat.participantIds.find(id => id !== args.userClerkId);
        
        if (!otherParticipantId) {
          return null; // Skip if no other participant (shouldn't happen)
        }

        const otherUser = await ctx.db
          .query("users")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", otherParticipantId))
          .unique();

        if (!otherUser) {
          return null; // Skip if user not found
        }

        return {
          ...chat,
          _id: chat._id.toString(),
          otherUser: {
            ...otherUser,
            _id: otherUser._id.toString(),
          },
          // Check if current user is in unreadBy array
          isUnread: (chat.unreadBy || []).includes(args.userClerkId),
        };
      })
    );

    // Filter out any nulls and return
    return chatsWithDetails.filter(Boolean);
  },
});