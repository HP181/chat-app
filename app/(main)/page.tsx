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

export default function Dashboard() {
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

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
      createOrUpdateUser({
        clerkId: user.id,
        email: user.emailAddresses[0]?.emailAddress || "",
        name: user.fullName || "",
        imageUrl: user.imageUrl || "",
      });
      
      // Update last seen timestamp
      updateLastSeen({ clerkId: user.id });
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
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    router.push("/sign-in");
    return null;
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="p-4 border-b flex items-center justify-between">
        <h1 className="text-xl font-bold">Messages</h1>
        <div className="flex space-x-2">
          <Link
            href="/group/new"
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
          >
            <Users className="h-5 w-5" />
          </Link>
          <button
            onClick={() => setIsSearching(!isSearching)}
            className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Search bar (conditional) */}
      {isSearching && (
        <div className="p-4 border-b">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-gray-500" />
            </div>
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for users..."
              className="w-full p-2 pl-10 pr-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Search results */}
          {searchUsers && searchUsers.length > 0 ? (
            <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
              {searchUsers.map((searchedUser) => (
                <button
                  key={searchedUser._id}
                  onClick={() => handleStartChat(searchedUser.clerkId)}
                  className="w-full p-2 flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <Image
                    src={searchedUser.imageUrl}
                    alt={searchedUser.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <div className="flex-grow text-left">
                    <div className="font-medium">{searchedUser.name}</div>
                    <div className="text-sm text-gray-500">
                      {searchedUser.username || searchedUser.email}
                    </div>
                  </div>
                  <UserPlus className="h-5 w-5 text-blue-500" />
                </button>
              ))}
            </div>
          ) : searchTerm.trim().length > 0 && searchUsers && searchUsers.length === 0 ? (
            <div className="mt-2 text-center text-gray-500 py-4">
              No users found
            </div>
          ) : null}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b">
        <button className="flex-1 py-2 font-medium text-blue-500 border-b-2 border-blue-500">
          All
        </button>
        <button className="flex-1 py-2 font-medium text-gray-500 hover:text-gray-700">
          Unread
        </button>
        <button className="flex-1 py-2 font-medium text-gray-500 hover:text-gray-700">
          Groups
        </button>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto divide-y">
        {/* Direct chats */}
        {userChats && userChats.length > 0 ? (
          userChats.map((chat) => (
            chat && chat.otherUser && (
              <Link
                key={chat._id}
                href={`/chat/${chat._id}`}
                className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                <Image
                  src={chat.otherUser.imageUrl}
                  alt={chat.otherUser.name}
                  width={50}
                  height={50}
                  className="rounded-full"
                />
                <div className="ml-3 flex-grow">
                  <div className="flex justify-between">
                    <span className="font-medium">{chat.otherUser.name}</span>
                    {chat.lastMessageAt && (
                      <span className="text-xs text-gray-500">
                        {formatDate(chat.lastMessageAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {chat.lastMessagePreview || "Start a conversation"}
                  </p>
                </div>
              </Link>
            )
          ))
        ) : null}

        {/* Group chats */}
        {userGroups && userGroups.length > 0 ? (
          userGroups.map((group) => (
            group && (
              <Link
                key={group._id}
                href={`/group/${group._id}`}
                className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  {group.imageUrl ? (
                    <Image
                      src={group.imageUrl}
                      alt={group.name}
                      width={50}
                      height={50}
                      className="rounded-full"
                    />
                  ) : (
                    <Users className="h-6 w-6 text-blue-500" />
                  )}
                </div>
                <div className="ml-3 flex-grow">
                  <div className="flex justify-between">
                    <span className="font-medium">{group.name}</span>
                    {group.lastMessageAt && (
                      <span className="text-xs text-gray-500">
                        {formatDate(group.lastMessageAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {group.lastMessagePreview || "No messages yet"}
                  </p>
                </div>
              </Link>
            )
          ))
        ) : null}

        {/* Empty state */}
        {(!userChats || userChats.length === 0) && 
         (!userGroups || userGroups.length === 0) && (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
            <p className="text-gray-500 mb-4">
              Search for users or create a group to start chatting.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setIsSearching(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Search People
              </button>
              <Link
                href="/group/new"
                className="px-4 py-2 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30"
              >
                Create Group
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}