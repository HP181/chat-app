"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Image from "next/image";
import { ArrowLeft, MoreVertical, Phone, Video } from "lucide-react";
import ChatInterface from "@/components/chat/ChatInterface";
import { formatDistanceToNow } from "date-fns";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  
  // Get chat ID from params
  const chatId = typeof params.id === "string" ? params.id : "";
  
  // Get chat data
  const chat = useQuery(api.messages.getChat, { chatId });
  
  // Find the other user's ID
  const otherParticipantId = chat?.participantIds?.find(
    (id) => id !== user?.id
  );
  
  // Get the other user's details directly from Convex
  const otherUser = useQuery(
    api.users.getUserByClerkId,
    otherParticipantId ? { clerkId: otherParticipantId } : "skip"
  );

  // If chat not found, show error
  if (chat === null) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <h2 className="text-xl font-semibold mb-2">Chat not found</h2>
        <p className="text-gray-500 mb-4">
          This chat may have been deleted or you don't have access to it.
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

  // If chat data or user data is still loading
  if (!chat || !user) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center p-4 border-b">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 mr-2 md:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          {/* Loading placeholder */}
          <div className="flex items-center flex-1 animate-pulse">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="ml-3">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded mt-1"></div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center p-4 border-b">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 mr-2 md:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        
        {otherUser ? (
          <div className="flex items-center flex-1">
            {otherUser.imageUrl ? (
              <Image
                src={otherUser.imageUrl}
                alt={otherUser.name}
                width={40}
                height={40}
                className="rounded-full"
              />
            ) : (
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                <span className="text-blue-500 font-semibold text-lg">
                  {otherUser.name?.charAt(0) || "?"}
                </span>
              </div>
            )}
            <div className="ml-3">
              <h2 className="font-semibold">{otherUser.name || "User"}</h2>
              <p className="text-xs text-gray-500">
                {otherUser.lastSeen
                  ? `Last seen ${formatDistanceToNow(new Date(otherUser.lastSeen), { addSuffix: true })}`
                  : "Offline"}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center flex-1 animate-pulse">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="ml-3">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded mt-1"></div>
            </div>
          </div>
        )}
        
        <div className="flex space-x-2">
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <Phone className="h-5 w-5" />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <Video className="h-5 w-5" />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Chat interface */}
      <div className="flex-1 overflow-hidden">
        <ChatInterface chatId={chatId} isGroup={false} />
      </div>
    </div>
  );
}