// app/(main)/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Image from "next/image";
import { format, isToday, isYesterday } from "date-fns";
import { UserPlus, Users, Plus, Search } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Get user data in Convex
  const createOrUpdateUser = useMutation(api.users.createOrUpdateUser);
  const updateLastSeen = useMutation(api.users.updateLastSeen);
  
  // Get user chats
  const userChats = useQuery(
    api.messages.getUserChats,
    user?.id ? { userClerkId: user.id } : "skip"
  );
  
  // Get user groups
  const userGroups = useQuery(
    api.groups.getUserGroups,
    user?.id ? { userClerkId: user.id } : "skip"
  );
  
  // Search users
  const searchUsers = useQuery(
    api.users.searchUsers,
    isSearching && searchTerm.trim().length > 0 && user?.id
      ? { searchTerm, currentUserClerkId: user.id }
      : "skip"
  );

  // Sync user data with Convex when loaded
  useEffect(() => {
    if (isUserLoaded && user) {
      const primaryEmail = user.emailAddresses?.[0]?.emailAddress || "";
        
      createOrUpdateUser({
        clerkId: user.id,
        email: primaryEmail,
        name: user.fullName || "",
        imageUrl: user.imageUrl || "",
      });
      
      // Update last seen timestamp
      updateLastSeen({ clerkId: user.id });

      // Update last seen timestamp periodically
      const interval = setInterval(() => {
        updateLastSeen({ clerkId: user.id });
      }, 60000);
      
      return () => clearInterval(interval);
    }
  }, [isUserLoaded, user, createOrUpdateUser, updateLastSeen]);

  // Format date for chat previews
  const formatDate = (timestamp: number | undefined) => {
    if (!timestamp) return "";
    
    if (isToday(timestamp)) {
      return format(timestamp, "HH:mm");
    } else if (isYesterday(timestamp)) {
      return "Yesterday";
    } else {
      return format(timestamp, "MMM d");
    }
  };

  // Check if user is online (active within last 2 minutes)
  const isUserOnline = (lastSeen?: number) => {
    if (!lastSeen) return false;
    const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
    return lastSeen > twoMinutesAgo;
  };

  // Start a new chat with user
  const startChat = useMutation(api.messages.getOrCreateChat);

  const handleStartChat = async (otherUserClerkId: string) => {
    if (!user) return;
    
    const result = await startChat({
      currentUserClerkId: user.id,
      otherUserClerkId,
    });
    
    router.push(`/chat/${result.chatId}`);
    setSearchTerm("");
    setIsSearching(false);
  };

  if (!isUserLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    router.push("/sign-in");
    return null;
  }

  // Filter chats based on active tab
  let displayChats: any[] = [];
  let displayGroups: any[] = [];

  if (activeTab === "all") {
    displayChats = (userChats || []).filter(chat => chat !== null);
    displayGroups = [];
  } else if (activeTab === "unread") {
    displayChats = (userChats || [])
      .filter(chat => chat !== null && chat.isUnread === true);
    displayGroups = [];
  } else if (activeTab === "groups") {
    displayChats = [];
    displayGroups = (userGroups || []).filter(group => group !== null);
  }

  const hasContent = displayChats.length > 0 || displayGroups.length > 0;

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Messages</h1>
        <div className="flex space-x-2">
          <Link
            href="/groups/new"
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-sm"
          >
            <Users className="h-5 w-5" />
          </Link>
          <button
            onClick={() => setIsSearching(!isSearching)}
            className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
          >
            <Search className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </header>

      {/* Search bar (conditional) */}
      <AnimatePresence>
        {isSearching && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
          >
            <div className="p-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="h-4 w-4 text-gray-500" />
                </div>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search for users..."
                  className="w-full p-3 pl-10 pr-4 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-800"
                />
              </div>
              
              {/* Search results */}
              <AnimatePresence>
                {searchUsers && searchUsers.length > 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 space-y-1 max-h-60 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    {searchUsers.map((searchedUser, index) => (
                      <motion.button
                        key={searchedUser._id}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleStartChat(searchedUser.clerkId)}
                        className="w-full p-3 flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="relative">
                          {searchedUser.imageUrl ? (
                            <Image
                              src={searchedUser.imageUrl}
                              alt={searchedUser.name}
                              width={40}
                              height={40}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 dark:text-blue-300 font-semibold">
                                {searchedUser.name.charAt(0)}
                              </span>
                            </div>
                          )}
                          {isUserOnline(searchedUser.lastSeen) && (
                            <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                          )}
                        </div>
                        <div className="flex-grow text-left">
                          <div className="font-medium">{searchedUser.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {searchedUser.username || searchedUser.email}
                          </div>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-full">
                          <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                ) : searchTerm.trim().length > 0 && searchUsers && searchUsers.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 text-center text-gray-500 py-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <p>No users found</p>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm z-10">
        <button 
          className={`flex-1 py-3 font-medium transition-all ${
            activeTab === "all" 
              ? "text-blue-600 border-b-2 border-blue-600" 
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
          onClick={() => setActiveTab("all")}
        >
          All
        </button>
        <button 
          className={`flex-1 py-3 font-medium transition-all ${
            activeTab === "unread" 
              ? "text-blue-600 border-b-2 border-blue-600" 
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
          onClick={() => setActiveTab("unread")}
        >
          Unread
        </button>
        <button 
          className={`flex-1 py-3 font-medium transition-all ${
            activeTab === "groups" 
              ? "text-blue-600 border-b-2 border-blue-600" 
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
          onClick={() => setActiveTab("groups")}
        >
          Groups
        </button>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
        <AnimatePresence mode="wait">
          {hasContent ? (
            <motion.div
              key={`content-${activeTab}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="divide-y divide-gray-100 dark:divide-gray-800"
            >
              {/* Render chats */}
              {displayChats.map((chat, index) => {
                if (!chat || !chat.otherUser) return null;
                
                const isUnread = chat.isUnread; // Use the isUnread field we added in getUserChats
                const isOnline = isUserOnline(chat.otherUser.lastSeen);
                
                return (
                  <motion.div
                    key={chat._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={`/chat/${chat._id}`}
                      className={`flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                        isUnread ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                      }`}
                    >
                      <div className="relative">
                        {chat.otherUser.imageUrl ? (
                          <Image
                            src={chat.otherUser.imageUrl}
                            alt={chat.otherUser.name}
                            width={48}
                            height={48}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 dark:text-blue-400 font-semibold text-lg">
                              {chat.otherUser.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-gray-900 ${
                          isOnline ? "bg-green-500" : "bg-gray-400"
                        }`}></div>
                      </div>
                      <div className="ml-4 flex-grow min-w-0">
                        <div className="flex justify-between items-center">
                          <span className={`${isUnread ? "font-bold text-gray-900 dark:text-white" : "font-medium text-gray-800 dark:text-gray-200"} truncate`}>
                            {chat.otherUser.name}
                          </span>
                          {chat.lastMessageAt && (
                            <span className={`text-xs ${isUnread ? "text-blue-600 font-semibold" : "text-gray-500"} flex-shrink-0 ml-2`}>
                              {formatDate(chat.lastMessageAt)}
                            </span>
                          )}
                        </div>
                        <p className={`text-sm truncate ${isUnread 
                          ? "text-gray-800 dark:text-gray-200 font-semibold" 
                          : "text-gray-500 dark:text-gray-400"}`}
                        >
                          {chat.lastMessagePreview || "Start a conversation"}
                        </p>
                        {isUnread && (
                          <div className="mt-1 flex items-center">
                            <div className="h-2 w-2 rounded-full bg-blue-600 mr-2"></div>
                            <span className="text-xs text-blue-600">New message</span>
                          </div>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                );
              })}

              {/* Render groups */}
              {displayGroups.map((group, index) => (
                <motion.div
                  key={group._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={`/groups/${group._id}`}
                    className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center overflow-hidden">
                      {group.imageUrl ? (
                        <Image
                          src={group.imageUrl}
                          alt={group.name}
                          width={48}
                          height={48}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div className="ml-3 flex-grow min-w-0">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-900 dark:text-white truncate">{group.name}</span>
                        {group.lastMessageAt && (
                          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                            {formatDate(group.lastMessageAt)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {group.lastMessagePreview || "No messages yet"}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {group.memberIds?.length || 0} members
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key={`empty-${activeTab}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full p-4 text-center"
            >
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mb-4">
                {activeTab === "groups" ? (
                  <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                ) : activeTab === "unread" ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                ) : (
                  <Plus className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <h3 className="text-xl font-medium mb-2 text-gray-900 dark:text-white">
                {activeTab === "groups" 
                  ? "No groups yet" 
                  : activeTab === "unread" 
                  ? "No unread messages"
                  : "No conversations yet"}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-xs">
                {activeTab === "groups" 
                  ? "Create a new group to start chatting with multiple people."
                  : activeTab === "unread"
                  ? "You're all caught up!"
                  : "Search for users or create a group to start chatting."
                }
              </p>
              
              {activeTab !== "unread" && (
                <div className="flex space-x-4">
                  <button
                    onClick={() => setIsSearching(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm transition-colors"
                  >
                    Search People
                  </button>
                  {activeTab === "groups" && (
                    <Link
                      href="/group/new"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm transition-colors"
                    >
                      Create Group
                    </Link>
                  )}
                  {activeTab === "all" && (
                    <Link
                      href="/group/new"
                      className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                    >
                      Create Group
                    </Link>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}