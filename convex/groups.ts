import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { Id } from "./_generated/dataModel";

// Create a new group
export const createGroup = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    creatorClerkId: v.string(),
    initialMemberIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const creator = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.creatorClerkId))
      .unique();

    if (!creator) {
      throw new ConvexError("Creator not found");
    }

    // Make sure all members exist
    for (const memberId of args.initialMemberIds) {
      const member = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", memberId))
        .unique();

      if (!member) {
        throw new ConvexError(`Member with ID ${memberId} not found`);
      }
    }

    // Ensure creator is included in members
    const allMemberIds = [args.creatorClerkId];
    for (const memberId of args.initialMemberIds) {
      if (memberId !== args.creatorClerkId && !allMemberIds.includes(memberId)) {
        allMemberIds.push(memberId);
      }
    }

    // Create the group
    const groupId = await ctx.db.insert("groups", {
      name: args.name,
      description: args.description || "",
      imageUrl: args.imageUrl,
      createdBy: args.creatorClerkId,
      createdAt: Date.now(),
      memberIds: allMemberIds,
      adminIds: [args.creatorClerkId], // Creator is the initial admin
      lastMessageAt: Date.now(),
      lastMessagePreview: "Group created",
    });

    return { groupId: groupId.toString() };
  },
});

// Get all groups for a user
export const getUserGroups = query({
  args: {
    userClerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get all groups and filter in memory
    const allGroups = await ctx.db.query("groups").collect();
    const groups = allGroups.filter(group => 
      group.memberIds.includes(args.userClerkId)
    );
    
    // Sort by lastMessageAt in descending order
    groups.sort((a, b) => {
      const timeA = a.lastMessageAt || 0;
      const timeB = b.lastMessageAt || 0;
      return timeB - timeA;
    });

    return groups.map((group) => ({
      ...group,
      _id: group._id.toString(),
    }));
  },
});

// Get a single group by ID
export const getGroupById = query({
  args: {
    groupId: v.string(),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId as Id<"groups">);
    if (!group) {
      return null;
    }

    // Get member details
    const memberDetails = await Promise.all(
      group.memberIds.map(async (memberId) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", memberId))
          .unique();

        if (!user) return null;

        return {
          ...user,
          _id: user._id.toString(),
        };
      })
    );

    return {
      ...group,
      _id: group._id.toString(),
      members: memberDetails.filter(Boolean),
    };
  },
});

// Update group information
export const updateGroup = mutation({
  args: {
    groupId: v.string(),
    userClerkId: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId as Id<"groups">);
    if (!group) {
      throw new ConvexError("Group not found");
    }

    // Check if user is an admin
    if (!group.adminIds.includes(args.userClerkId)) {
      throw new ConvexError("Only admins can update group information");
    }

    const updates: Record<string, any> = {};
    
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.imageUrl !== undefined) updates.imageUrl = args.imageUrl;
    
    await ctx.db.patch(args.groupId as Id<"groups">, updates);
    
    return { success: true };
  },
});

// Add a member to a group
export const addGroupMember = mutation({
  args: {
    groupId: v.string(),
    adminClerkId: v.string(),
    newMemberClerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId as Id<"groups">);
    if (!group) {
      throw new ConvexError("Group not found");
    }

    // Check if current user is an admin
    if (!group.adminIds.includes(args.adminClerkId)) {
      throw new ConvexError("Only admins can add members");
    }

    // Check if the new member exists
    const newMember = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.newMemberClerkId))
      .unique();

    if (!newMember) {
      throw new ConvexError("User not found");
    }

    // Check if member is already in the group
    if (group.memberIds.includes(args.newMemberClerkId)) {
      throw new ConvexError("User is already a member of this group");
    }

    // Add the new member
    await ctx.db.patch(args.groupId as Id<"groups">, {
      memberIds: [...group.memberIds, args.newMemberClerkId],
    });

    return { success: true };
  },
});

// Remove a member from a group
export const removeGroupMember = mutation({
  args: {
    groupId: v.string(),
    adminClerkId: v.string(),
    memberClerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId as Id<"groups">);
    if (!group) {
      throw new ConvexError("Group not found");
    }

    // Check if current user is an admin
    if (!group.adminIds.includes(args.adminClerkId)) {
      throw new ConvexError("Only admins can remove members");
    }

    // Cannot remove the last admin
    if (group.adminIds.length === 1 && group.adminIds[0] === args.memberClerkId) {
      throw new ConvexError("Cannot remove the last admin");
    }

    // Remove from members
    await ctx.db.patch(args.groupId as Id<"groups">, {
      memberIds: group.memberIds.filter(id => id !== args.memberClerkId),
      adminIds: group.adminIds.filter(id => id !== args.memberClerkId),
    });

    return { success: true };
  },
});

// Leave a group
export const leaveGroup = mutation({
  args: {
    groupId: v.string(),
    userClerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId as Id<"groups">);
    if (!group) {
      throw new ConvexError("Group not found");
    }

    // Check if user is a member
    if (!group.memberIds.includes(args.userClerkId)) {
      throw new ConvexError("User is not a member of this group");
    }

    // Cannot leave if you're the last admin
    if (group.adminIds.length === 1 && group.adminIds[0] === args.userClerkId) {
      throw new ConvexError("You are the last admin. Please assign another admin before leaving.");
    }

    // Remove user from members and admins
    await ctx.db.patch(args.groupId as Id<"groups">, {
      memberIds: group.memberIds.filter(id => id !== args.userClerkId),
      adminIds: group.adminIds.filter(id => id !== args.userClerkId),
    });

    return { success: true };
  },
});

// Promote a member to admin
export const promoteToAdmin = mutation({
  args: {
    groupId: v.string(),
    adminClerkId: v.string(),
    memberClerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId as Id<"groups">);
    if (!group) {
      throw new ConvexError("Group not found");
    }

    // Check if current user is an admin
    if (!group.adminIds.includes(args.adminClerkId)) {
      throw new ConvexError("Only admins can promote members");
    }

    // Check if target user is a member
    if (!group.memberIds.includes(args.memberClerkId)) {
      throw new ConvexError("User is not a member of this group");
    }

    // Check if target user is already an admin
    if (group.adminIds.includes(args.memberClerkId)) {
      throw new ConvexError("User is already an admin");
    }

    // Add to admins
    await ctx.db.patch(args.groupId as Id<"groups">, {
      adminIds: [...group.adminIds, args.memberClerkId],
    });

    return { success: true };
  },
});

// Delete group (add this function)
export const deleteGroup = mutation({
  args: {
    groupId: v.string(),
    userClerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId as Id<"groups">);
    if (!group) {
      throw new ConvexError("Group not found");
    }

    // Only the creator can delete the group
    if (group.createdBy !== args.userClerkId) {
      throw new ConvexError("Only the group creator can delete the group");
    }

    // Delete all group messages first
    const groupMessages = await ctx.db
      .query("groupMessages")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();
    
    for (const message of groupMessages) {
      await ctx.db.delete(message._id);
    }

    // Delete the group
    await ctx.db.delete(args.groupId as Id<"groups">);

    return { success: true };
  },
});

// Send a group message
export const sendGroupMessage = mutation({
  args: {
    groupId: v.string(),
    senderId: v.string(),
    content: v.string(),
    mediaUrl: v.optional(v.string()),
    mediaType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId as Id<"groups">);
    if (!group) {
      throw new ConvexError("Group not found");
    }

    // Check if sender is a member
    if (!group.memberIds.includes(args.senderId)) {
      throw new ConvexError("User is not a member of this group");
    }

    // Insert the message
    const messageId = await ctx.db.insert("groupMessages", {
      groupId: args.groupId,
      senderId: args.senderId,
      content: args.content,
      timestamp: Date.now(),
      mediaUrl: args.mediaUrl,
      mediaType: args.mediaType,
      isDeleted: false,
      readBy: [args.senderId], // Mark as read by sender
    });

    // Update the group with the last message preview
    await ctx.db.patch(args.groupId as Id<"groups">, {
      lastMessageAt: Date.now(),
      lastMessagePreview: args.content.substring(0, 50) + (args.content.length > 50 ? "..." : ""),
    });

    return messageId;
  },
});

// Get group messages
export const getGroupMessages = query({
  args: {
    groupId: v.string(),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    
    // Get all messages for this group
    const allMessages = await ctx.db
      .query("groupMessages")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();
    
    // Sort by timestamp in descending order
    allMessages.sort((a, b) => b.timestamp - a.timestamp);
    
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

    // Get user info for each message
    const messagesWithUserInfo = await Promise.all(
      messages.map(async (message) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", message.senderId))
          .unique();

        return {
          ...message,
          _id: message._id.toString(),
          sender: user ? {
            ...user,
            _id: user._id.toString(),
          } : null,
        };
      })
    );

    return {
      messages: messagesWithUserInfo,
      continuation: continuation,
    };
  },
});

// Mark group messages as read
export const markGroupMessagesAsRead = mutation({
  args: {
    groupId: v.string(),
    userId: v.string(),
    messageIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId as Id<"groups">);
    if (!group) {
      throw new ConvexError("Group not found");
    }

    // Check if user is a member
    if (!group.memberIds.includes(args.userId)) {
      throw new ConvexError("User is not a member of this group");
    }

    for (const messageId of args.messageIds) {
      const message = await ctx.db.get(messageId as Id<"groupMessages">);
      if (!message) continue;

      const readBy = message.readBy || [];
      if (!readBy.includes(args.userId)) {
        await ctx.db.patch(messageId as Id<"groupMessages">, {
          readBy: [...readBy, args.userId],
        });
      }
    }

    return { success: true };
  },
});

// Search group messages
export const searchGroupMessages = query({
  args: {
    groupId: v.string(),
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.searchTerm.trim()) {
      return [];
    }

    const searchTerm = args.searchTerm.toLowerCase();
    
    // Get all messages and filter in memory
    const allMessages = await ctx.db
      .query("groupMessages")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();
      
    const filteredMessages = allMessages.filter(message => 
      message.content.toLowerCase().includes(searchTerm)
    );

    // Get user info for each message
    return await Promise.all(
      filteredMessages.map(async (message) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", message.senderId))
          .unique();

        return {
          ...message,
          _id: message._id.toString(),
          sender: user ? {
            ...user,
            _id: user._id.toString(),
          } : null,
        };
      })
    );
  },
});

// Add reaction to a group message
export const addGroupReaction = mutation({
  args: {
    messageId: v.string(),
    userId: v.string(),
    reaction: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId as Id<"groupMessages">);
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

    await ctx.db.patch(args.messageId as Id<"groupMessages">, {
      reactions,
    });

    return { success: true };
  },
});

// Delete a group message
export const deleteGroupMessage = mutation({
  args: {
    messageId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId as Id<"groupMessages">);
    if (!message) {
      throw new ConvexError("Message not found");
    }

    if (message.senderId !== args.userId) {
      // Check if the user is a group admin
      const group = await ctx.db.get(message.groupId as Id<"groups">);
      if (!group || !group.adminIds.includes(args.userId)) {
        throw new ConvexError("You can only delete your own messages or if you're an admin");
      }
    }

    await ctx.db.patch(args.messageId as Id<"groupMessages">, {
      isDeleted: true,
      content: "This message was deleted",
      mediaUrl: undefined,
      mediaType: undefined,
    });

    return { success: true };
  },
});