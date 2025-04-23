"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Image from "next/image";
import Link from "next/link";
import { Users, Plus, Search, ArrowLeft } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";

export default function GroupsPage() {
  const router = useRouter();
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredGroups, setFilteredGroups] = useState<any[]>([]);
  
  // Get user groups
  const userGroups = useQuery(
    api.groups.getUserGroups,
    user?.id ? { userClerkId: user.id } : "skip"
  );

  // Filter groups when search term changes
  useEffect(() => {
    if (!userGroups) {
      setFilteredGroups([]);
      return;
    }

    if (!searchTerm.trim()) {
      setFilteredGroups(userGroups);
      return;
    }

    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filtered = userGroups.filter(group => 
      group.name.toLowerCase().includes(lowerCaseSearchTerm) ||
      (group.description && group.description.toLowerCase().includes(lowerCaseSearchTerm))
    );
    
    setFilteredGroups(filtered);
  }, [userGroups, searchTerm]);

  // Format date for group previews
  const formatDate = (timestamp: number) => {
    if (isToday(timestamp)) {
      return format(timestamp, "HH:mm");
    } else if (isYesterday(timestamp)) {
      return "Yesterday";
    } else {
      return format(timestamp, "MMM d");
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 mr-2 md:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold">Groups</h1>
        </div>
        <div className="flex space-x-2">
          <Link
            href="/groups/new"
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
          >
            <Plus className="h-5 w-5" />
          </Link>
        </div>
      </header>

      {/* Search bar */}
      <div className="p-4 border-b">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-gray-500" />
          </div>
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search groups..."
            className="w-full p-2 pl-10 pr-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Groups list */}
      <div className="flex-1 overflow-y-auto divide-y">
        {filteredGroups && filteredGroups.length > 0 ? (
          filteredGroups.map((group) => (
            <Link
              key={group._id}
              href={`/groups/${group._id}`}
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
                  {group.description || (group.lastMessagePreview ? `Last message: ${group.lastMessagePreview}` : "No messages yet")}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {group.memberIds?.length || 0} members
                </p>
              </div>
            </Link>
          ))
        ) : userGroups && userGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-medium mb-2">No groups yet</h3>
            <p className="text-gray-500 mb-4">
              Create a new group to start chatting with multiple people.
            </p>
            <Link
              href="/groups/new"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Create Group
            </Link>
          </div>
        ) : (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        )}
      </div>
    </div>
  );
}