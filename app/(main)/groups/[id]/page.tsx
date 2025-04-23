"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Image from "next/image";
import { ArrowLeft, MoreVertical, Users, Settings } from "lucide-react";
import ChatInterface from "@/components/chat/ChatInterface";
import GroupMembers from "@/components/group/GroupMembers";
import GroupSettings from "@/components/group/GroupSettings";

export default function GroupChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const [showMembers, setShowMembers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Get group ID from params
  const groupId = typeof params.id === "string" ? params.id : "";
  
  // Get group data
  const group = useQuery(api.groups.getGroupById, { groupId });
  
  // Check if current user is a member
  const isMember = group ? group.memberIds.includes(user?.id || "") : false;
  
  // Check if current user is an admin
  const isAdmin = group ? group.adminIds.includes(user?.id || "") : false;

  // If group not found or user is not a member, show error
  if (group === null || (group && !isMember)) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <h2 className="text-xl font-semibold mb-2">
          {group === null ? "Group not found" : "Access denied"}
        </h2>
        <p className="text-gray-500 mb-4">
          {group === null
            ? "This group may have been deleted."
            : "You are not a member of this group."}
        </p>
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Go back to chats
        </button>
      </div>
    );
  }

  // Loading state
  if (!group) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  // Toggle panels
  const toggleMembers = () => {
    setShowMembers(!showMembers);
    if (showSettings) setShowSettings(false);
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
    if (showMembers) setShowMembers(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Group header */}
      <div className="flex items-center p-4 border-b">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 mr-2 md:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        
        <div className="flex items-center flex-1">
          {group.imageUrl ? (
            <Image
              src={group.imageUrl}
              alt={group.name}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
          )}
          <div className="ml-3">
            <h2 className="font-semibold">{group.name}</h2>
            <p className="text-xs text-gray-500">
              {group.members?.length || group.memberIds.length} members
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={toggleMembers}
            className={`p-2 rounded-full ${
              showMembers
                ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
                : "hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <Users className="h-5 w-5" />
          </button>
          {isAdmin && (
            <button
              onClick={toggleSettings}
              className={`p-2 rounded-full ${
                showSettings
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <Settings className="h-5 w-5" />
            </button>
          )}
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Main content with sidebars */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat interface */}
        <div className={`flex-1 overflow-hidden ${showMembers || showSettings ? "hidden md:block md:flex-1" : ""}`}>
          <ChatInterface chatId={groupId} isGroup={true} />
        </div>
        
        {/* Members sidebar */}
        {showMembers && (
          <div className="w-full md:w-80 border-l overflow-y-auto">
            <GroupMembers 
              group={group} 
              isAdmin={isAdmin}
              onClose={() => setShowMembers(false)} 
            />
          </div>
        )}
        
        {/* Settings sidebar */}
        {showSettings && isAdmin && (
          <div className="w-full md:w-80 border-l overflow-y-auto">
            <GroupSettings 
              group={group}
              onClose={() => setShowSettings(false)} 
            />
          </div>
        )}
      </div>
    </div>
  );
}