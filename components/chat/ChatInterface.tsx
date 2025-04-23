"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Search, Smile } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import MessageBubble from "./MessageBubble";
import FileUpload from "../ui/FileUpload";
import SearchMessages from "./SearchMessages";

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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesData?.messages]);

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

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Chat</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Search overlay (conditionally rendered) */}
      {showSearch && (
        <div className="p-2 border-b">
          <SearchMessages chatId={chatId} isGroup={isGroup} />
        </div>
      )}

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messagesData?.messages && messagesData.messages.length > 0 ? (
          messagesData.messages
            .sort((a, b) => a.timestamp - b.timestamp) // Ensure correct order
            .map((message) => (
              <MessageBubble
                key={message._id}
                message={message}
                isOwnMessage={message.senderId === user.id}
                isGroup={isGroup}
              />
            ))
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            No messages yet. Start the conversation!
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Media upload area (conditionally rendered) */}
      {showMediaUpload && (
        <div className="p-4 border-t">
          <FileUpload
            value={mediaUrl}
            onChange={setMediaUrl}
            endpoint={mediaUrl?.includes("video") ? "messageVideo" : "messageImage"}
          />
        </div>
      )}

      {/* Message input area */}
      <div className="border-t p-4">
        <div className="flex items-end space-x-2">
          <div className="flex-shrink-0">
            <button
              onClick={() => setShowMediaUpload(!showMediaUpload)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              type="button"
            >
              <Paperclip className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-grow">
            <textarea
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              className="w-full p-3 rounded-lg border resize-none max-h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={1}
            />
          </div>
          <div className="flex-shrink-0">
            <button
              onClick={handleSendMessage}
              disabled={!message.trim() && !mediaUrl}
              className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;