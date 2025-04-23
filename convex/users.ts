import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

// Create or update a user
export const createOrUpdateUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.string(),
    username: v.optional(v.string()),
    bio: v.optional(v.string()),
    themePreference: v.optional(v.string()),
    preserveImage: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existingUser) {
      // Prepare update object
      const updates: Record<string, any> = {
        email: args.email,
        name: args.name,
        username: args.username,
        bio: args.bio,
        themePreference: args.themePreference,
      };
      
      // Only update imageUrl if preserveImage is not true or the existing image is missing
      if (!args.preserveImage || !existingUser.imageUrl) {
        updates.imageUrl = args.imageUrl;
      }
      
      // Update existing user
      return await ctx.db.patch(existingUser._id, updates);
    } else {
      // Create new user
      return await ctx.db.insert("users", {
        clerkId: args.clerkId,
        email: args.email,
        name: args.name,
        imageUrl: args.imageUrl,
        username: args.username,
        bio: args.bio,
        lastSeen: Date.now(),
        themePreference: args.themePreference || "system",
      });
    }
  },
});

// Get a user by Clerk ID
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      return null;
    }

    return {
      ...user,
      _id: user._id.toString(),
    };
  },
});

// Update a user's last seen timestamp
export const updateLastSeen = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new ConvexError("User not found");
    }

    await ctx.db.patch(user._id, {
      lastSeen: Date.now(),
    });
  },
});

// Search for users by name or username
export const searchUsers = query({
  args: { searchTerm: v.string(), currentUserClerkId: v.string() },
  handler: async (ctx, args) => {
    if (!args.searchTerm.trim()) {
      return [];
    }

    const searchTerm = args.searchTerm.toLowerCase();
    
    // Get all users and filter in memory since Convex might not support
    // case-insensitive search directly in the query builder
    const allUsers = await ctx.db.query("users").collect();
    
    // Filter users by name or username (case insensitive)
    const users = allUsers.filter(user => {
      const nameMatch = user.name.toLowerCase().includes(searchTerm);
      const usernameMatch = user.username ? 
        user.username.toLowerCase().includes(searchTerm) : 
        false;
      
      return nameMatch || usernameMatch;
    });

    // Exclude the current user from results
    return users
      .filter((user) => user.clerkId !== args.currentUserClerkId)
      .map((user) => ({
        ...user,
        _id: user._id.toString(),
      }));
  },
});

// Update user profile
export const updateProfile = mutation({
  args: {
    clerkId: v.string(),
    name: v.optional(v.string()),
    username: v.optional(v.string()),
    bio: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new ConvexError("User not found");
    }

    const updates: Record<string, any> = {};
    
    if (args.name !== undefined) updates.name = args.name;
    if (args.username !== undefined) updates.username = args.username;
    if (args.bio !== undefined) updates.bio = args.bio;
    if (args.imageUrl !== undefined) updates.imageUrl = args.imageUrl;
    
    await ctx.db.patch(user._id, updates);
    
    return { success: true };
  },
});

// Update user theme preference
export const updateThemePreference = mutation({
  args: {
    clerkId: v.string(),
    themePreference: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new ConvexError("User not found");
    }

    await ctx.db.patch(user._id, {
      themePreference: args.themePreference,
    });
    
    return { success: true };
  },
});