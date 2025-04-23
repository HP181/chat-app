// components/chat/ChatInterface.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Search, Image as ImageIcon, X, Users, MessageSquare } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import MessageBubble, { MessageType, BaseMessageType, DirectMessageType, GroupMessageType } from "./MessageBubble";
import FileUpload from "../ui/FileUpload";
import SearchMessages from "./SearchMessages";
import { motion, AnimatePresence } from "framer-motion";

interface ChatInterfaceProps {
  chatId: string;
  isGroup?: boolean;
}

const ChatInterface = ({ chatId, isGroup = false }: ChatInterfaceProps) => {
  const { user } = useUser();
  const [message, setMessage] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [hasScrolledUp, setHasScrolledUp] = useState(false);

  // Determine which API functions to use based on isGroup
  const sendMessageFn = isGroup
    ? api.groups.sendGroupMessage
    : api.messages.sendMessage;
  const getMessagesFn = isGroup
    ? api.groups.getGroupMessages
    : api.messages.getMessages;
  const markAsReadFn = isGroup
    ? api.groups.markGroupMessagesAsRead
    : api.messages.markAsRead;

  // Send message mutation
  const sendMessage = useMutation(sendMessageFn);

  // Get messages query with proper parameters based on chat type
  const messagesData = useQuery(
    getMessagesFn, 
    isGroup 
      ? { groupId: chatId, limit: 50 }
      : { chatId, limit: 50 }
  );

  // Mark messages as read
  const markAsRead = useMutation(markAsReadFn);

  // Detect scroll position
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // If we've scrolled up more than 100px from the bottom
      setHasScrolledUp(scrollHeight - scrollTop - clientHeight > 100);
    };
    
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!hasScrolledUp && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messagesData?.messages, hasScrolledUp]);

  // Scroll to bottom button
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setHasScrolledUp(false);
  };

  // Mark messages as read when they are viewed
  useEffect(() => {
    if (user?.id && messagesData?.messages && messagesData.messages.length > 0) {
      const unreadMessages = messagesData.messages
        .filter((msg) => !msg.readBy?.includes(user.id))
        .map((msg) => msg._id);

      if (unreadMessages.length > 0) {
        markAsRead(
          isGroup
            ? {
                groupId: chatId,
                userId: user.id,
                messageIds: unreadMessages,
              }
            : {
                chatId,
                userId: user.id,
                messageIds: unreadMessages,
              }
        );
      }
    }
  }, [messagesData, user?.id, chatId, markAsRead, isGroup]);

  // Handle send message
  const handleSendMessage = () => {
    if ((!message.trim() && !mediaUrl) || !user) return;

    const messageContent = message.trim();
    const mediaType = mediaUrl
      ? mediaUrl.includes("image") ? "image" : "video"
      : undefined;

    // Animation preparation - get the current position of the send button
    const sendButton = document.getElementById('send-button');
    const rect = sendButton?.getBoundingClientRect();
    const startX = rect ? rect.x + rect.width/2 : 0;
    const startY = rect ? rect.y + rect.height/2 : 0;
    
    // Create a flying dot animation
    if (startX && startY) {
      const dot = document.createElement('div');
      dot.className = 'flying-dot';
      dot.style.cssText = `
        position: fixed;
        width: 8px;
        height: 8px;
        background-color: #3b82f6;
        border-radius: 50%;
        z-index: 100;
        left: ${startX}px;
        top: ${startY}px;
        transition: all 0.5s cubic-bezier(0.075, 0.82, 0.165, 1);
      `;
      document.body.appendChild(dot);
      
      // Position where message will appear
      const endY = messagesContainerRef.current?.getBoundingClientRect().bottom || 0;
      
      setTimeout(() => {
        dot.style.transform = `translate(${isGroup ? -100 : 100}px, ${endY - startY - 100}px) scale(0)`;
        dot.style.opacity = '0';
      }, 10);
      
      setTimeout(() => {
        document.body.removeChild(dot);
      }, 500);
    }

    sendMessage(
      isGroup 
        ? {
            groupId: chatId,
            senderId: user.id,
            content: messageContent || "Sent a media",
            mediaUrl: mediaUrl || undefined,
            mediaType,
          }
        : {
            chatId,
            senderId: user.id,
            content: messageContent || "Sent a media",
            mediaUrl: mediaUrl || undefined,
            mediaType,
          }
    ).then(() => {
      setMessage("");
      setMediaUrl("");
      setShowMediaUpload(false);
    });
  };

  // Handle key press (Enter to send, Shift+Enter for new line)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [message]);

  if (!user) return null;

  // Helper function to transform message to the correct type
  const transformMessage = (msg: any): MessageType => {
    if (isGroup) {
      // Transform to GroupMessageType
      return {
        _id: msg._id,
        groupId: msg.groupId || chatId,
        senderId: msg.senderId,
        content: msg.content,
        timestamp: msg.timestamp,
        mediaUrl: msg.mediaUrl,
        mediaType: msg.mediaType,
        isDeleted: msg.isDeleted,
        reactions: msg.reactions,
        readBy: msg.readBy,
        sender: msg.sender
      } as GroupMessageType;
    } else {
      // Transform to DirectMessageType
      return {
        _id: msg._id,
        chatId: msg.chatId || chatId,
        senderId: msg.senderId,
        content: msg.content,
        timestamp: msg.timestamp,
        mediaUrl: msg.mediaUrl,
        mediaType: msg.mediaType,
        isDeleted: msg.isDeleted,
        reactions: msg.reactions,
        readBy: msg.readBy
      } as DirectMessageType;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900">
      {/* Messages container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messagesData?.messages && messagesData.messages.length > 0 ? (
          messagesData.messages
            .sort((a, b) => a.timestamp - b.timestamp) // Ensure correct order
            .map((message, index) => (
              <motion.div
                key={message._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: index * 0.05,
                  type: "spring",
                  stiffness: 500,
                  damping: 30
                }}
              >
                <MessageBubble
                  message={transformMessage(message)}
                  isOwnMessage={message.senderId === user.id}
                  isGroup={isGroup}
                />
              </motion.div>
            ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4"
            >
              {isGroup ? 
                <Users className="h-10 w-10 text-blue-600" /> : 
                <MessageSquare className="h-10 w-10 text-blue-600" />
              }
            </motion.div>
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl font-semibold mb-2"
            >
              No messages yet
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center text-gray-500 dark:text-gray-400 max-w-xs"
            >
              Start the conversation by sending a message below
            </motion.p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button (shown when scrolled up) */}
      <AnimatePresence>
        {hasScrolledUp && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={scrollToBottom}
            className="absolute bottom-24 right-4 p-2 bg-blue-600 text-white rounded-full shadow-lg z-10"
          >
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Search overlay (conditionally rendered) */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-b dark:border-gray-800 z-20"
          >
            <div className="flex items-center">
              <button
                onClick={() => setShowSearch(false)}
                className="p-2 mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
              <SearchMessages chatId={chatId} isGroup={isGroup} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media upload area (conditionally rendered) */}
      <AnimatePresence>
        {showMediaUpload && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t dark:border-gray-800 bg-white dark:bg-gray-900"
          >
            <div className="p-4">
              <FileUpload
                value={mediaUrl}
                onChange={setMediaUrl}
                endpoint={mediaUrl?.includes("video") ? "messageVideo" : "messageImage"}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message input area */}
      <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
        <div className="flex items-end space-x-2 rounded-lg bg-gray-100 dark:bg-gray-800 p-2">
          <div className="flex space-x-1 px-2">
            <button
              onClick={() => setShowMediaUpload(!showMediaUpload)}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              type="button"
            >
              <ImageIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              type="button"
            >
              <Search className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          
          <div className="flex-grow relative">
            <textarea
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              className="w-full p-2 rounded-lg bg-transparent focus:outline-none resize-none max-h-32"
              rows={1}
              style={{ minHeight: '40px' }}
            />
          </div>
          
          <button
            id="send-button"
            onClick={handleSendMessage}
            disabled={!message.trim() && !mediaUrl}
            className={`p-3 rounded-full transition-colors ${
              !message.trim() && !mediaUrl
                ? "bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-gray-500"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
            type="button"
          >
            <motion.div 
              whileTap={{ scale: 0.9 }}
              whileHover={{ rotate: 15 }}
            >
              <Send className="h-5 w-5" />
            </motion.div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;