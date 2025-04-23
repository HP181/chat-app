// app/(main)/chat/[id]/page.tsx
"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Image from "next/image";
import { ArrowLeft, MoreVertical, Phone, Video } from "lucide-react";
import ChatInterface from "@/components/chat/ChatInterface";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

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

  // Mutation to mark chat as read
  const markChatAsRead = useMutation(api.messages.markChatAsRead);

  // When the chat is opened, mark it as read
  useEffect(() => {
    if (chat && user?.id && chatId) {
      markChatAsRead({
        chatId,
        userId: user.id
      }).catch(error => {
        console.error("Error marking chat as read:", error);
      });
    }
  }, [chat, user?.id, chatId, markChatAsRead]);

  // Check if user is online (active within last 2 minutes)
  const isUserOnline = (lastSeen?: number) => {
    if (!lastSeen) return false;
    const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
    return lastSeen > twoMinutesAgo;
  };

  // If chat not found, show error
  if (chat === null) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 bg-gray-100 dark:bg-gray-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
            <path d="M10 14l4-4m0 0l4-4m-4 4l-4-4m4 4l4 4"></path>
          </svg>
        </motion.div>
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl font-bold mb-3 text-center"
        >
          Chat not found
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-gray-500 dark:text-gray-400 mb-6 text-center max-w-md"
        >
          This chat may have been deleted or you don&apos;t have access to it.
        </motion.p>
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push("/")}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors"
        >
          Go back to chats
        </motion.button>
      </div>
    );
  }

  // If chat data or user data is still loading
  if (!chat || !user) {
    return (
      <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900">
        <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 mr-2"
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

  const userOnlineStatus = isUserOnline(otherUser?.lastSeen);

  return (
    <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900">
      {/* Chat header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
      >
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 mr-2 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        
        {otherUser ? (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center flex-1"
          >
            <div className="relative">
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
              <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${
                userOnlineStatus ? "bg-green-500" : "bg-gray-400"
              }`}></span>
            </div>
            <div className="ml-3">
              <h2 className="font-semibold">{otherUser.name || "User"}</h2>
              <p className="text-xs text-gray-500">
                {userOnlineStatus
                  ? "Online"
                  : otherUser.lastSeen
                  ? `Last seen ${formatDistanceToNow(new Date(otherUser.lastSeen), { addSuffix: true })}`
                  : "Offline"}
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="flex items-center flex-1 animate-pulse">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="ml-3">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded mt-1"></div>
            </div>
          </div>
        )}
        
        <div className="flex space-x-1">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-blue-600 transition-colors"
          >
            <Phone className="h-5 w-5" />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-blue-600 transition-colors"
          >
            <Video className="h-5 w-5" />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <MoreVertical className="h-5 w-5" />
          </motion.button>
        </div>
      </motion.div>
      
      {/* Chat interface */}
      <div className="flex-1 overflow-hidden">
        <ChatInterface chatId={chatId} isGroup={false} />
      </div>
    </div>
  );
}