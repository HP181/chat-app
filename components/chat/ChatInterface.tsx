// components/chat/ChatInterface.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Search, Image as ImageIcon, Users, X } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import MessageBubble, {
  MessageType,
  DirectMessageType,
  GroupMessageType,
  ReactionType,
} from "./MessageBubble";
import FileUpload from "../ui/FileUpload";
import SearchMessages from "./SearchMessages";
import { motion, AnimatePresence } from "framer-motion";

interface ChatInterfaceProps {
  chatId: string;
  isGroup?: boolean;
}

interface RawMessageBase {
  _id: string;
  senderId: string;
  content: string;
  timestamp: number;
  mediaUrl?: string;
  mediaType?: string;
  isDeleted?: boolean;
  reactions?: ReactionType[];
  readBy?: string[];
}

interface RawGroupMessage extends RawMessageBase {
  groupId: string;
  sender?: {
    _id: string;
    name: string;
    imageUrl: string;
  };
}

interface RawDirectMessage extends RawMessageBase {
  chatId: string;
}

type RawMessage = RawGroupMessage | RawDirectMessage;

const ChatInterface = ({ chatId, isGroup = false }: ChatInterfaceProps) => {
  const { user } = useUser();
  const [message, setMessage] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [fileType, setFileType] = useState<"image" | "video" | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [hasScrolledUp, setHasScrolledUp] = useState(false);

  const sendMessage = useMutation(
    isGroup ? api.groups.sendGroupMessage : api.messages.sendMessage
  );

  const getMessages = useQuery(
    isGroup ? api.groups.getGroupMessages : api.messages.getMessages,
    isGroup ? { groupId: chatId, limit: 50 } : { chatId, limit: 50 }
  ) as { messages: RawMessage[]; continuation?: string } | undefined;

  const markAsRead = useMutation(
    isGroup ? api.groups.markGroupMessagesAsRead : api.messages.markAsRead
  );

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setHasScrolledUp(scrollHeight - scrollTop - clientHeight > 100);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!hasScrolledUp && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [getMessages?.messages, hasScrolledUp]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setHasScrolledUp(false);
  };

  useEffect(() => {
    if (user?.id && getMessages?.messages?.length) {
      const unread = getMessages.messages
        .filter((msg) => !msg.readBy?.includes(user.id))
        .map((msg) => msg._id);
      if (unread.length > 0) {
        markAsRead(
          isGroup
            ? { groupId: chatId, userId: user.id, messageIds: unread }
            : { chatId, userId: user.id, messageIds: unread }
        );
      }
    }
  }, [getMessages, user?.id, chatId, markAsRead, isGroup]);

  const handleSendMessage = () => {
    if ((!message.trim() && !mediaUrl) || !user) return;

    const mediaType = mediaUrl
      ? mediaUrl.endsWith(".mp4")
        ? "video"
        : "image"
      : undefined;

    sendMessage(
      isGroup
        ? {
            groupId: chatId,
            senderId: user.id,
            content: message || "Sent a media",
            mediaUrl,
            mediaType,
          }
        : {
            chatId,
            senderId: user.id,
            content: message || "Sent a media",
            mediaUrl,
            mediaType,
          }
    ).then(() => {
      setMessage("");
      setMediaUrl("");
      setFileType(null);
      setShowMediaUpload(false);
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [message]);

  const transformMessage = (msg: RawMessage): MessageType => {
    const inferredMediaType = msg.mediaUrl?.includes("video")
      ? "video"
      : msg.mediaUrl?.includes("image")
        ? "image"
        : undefined;

    const mediaTypeFinal = msg.mediaType || inferredMediaType;

    console.log("mediaUrl:", msg.mediaUrl);
    console.log("original mediaType:", msg.mediaType);
    console.log("inferred mediaType:", inferredMediaType);
    console.log("final mediaType used:", mediaTypeFinal);

    const baseMessage = {
      ...msg,
      mediaType: mediaTypeFinal,
    };

    if (isGroup) {
      return {
        ...baseMessage,
        groupId: (msg as RawGroupMessage).groupId || chatId,
        sender: (msg as RawGroupMessage).sender,
      } as GroupMessageType;
    } else {
      return {
        ...baseMessage,
        chatId: (msg as RawDirectMessage).chatId || chatId,
      } as DirectMessageType;
    }
  };

  if (!user) return null;

  return (
    <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900">
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {getMessages?.messages?.length ? (
          getMessages.messages
            .sort((a, b) => a.timestamp - b.timestamp)
            .map((message, index) => {
              console.log("mediaType:", message.mediaType);
              return (
                <motion.div
                  key={message._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: index * 0.05,
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                  }}
                >
                  <MessageBubble
                    message={transformMessage(message)}
                    isOwnMessage={message.senderId === user.id}
                    isGroup={isGroup}
                  />
                </motion.div>
              );
            })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Users className="h-10 w-10 text-blue-600" />
            <h3 className="text-xl font-semibold">No messages yet</h3>
            <p className="text-center text-gray-500 dark:text-gray-400 max-w-xs">
              Start the conversation by sending a message below
            </p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <AnimatePresence>
        {hasScrolledUp && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            onClick={scrollToBottom}
            className="absolute bottom-24 right-4 p-2 bg-blue-600 text-white rounded-full shadow-lg z-10"
          >
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <svg
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9" />
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
                setFileType={setFileType}
                endpoint={
                  fileType === "video" ? "messageVideo" : "messageImage"
                }
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
        <div className="flex items-end space-x-2 rounded-lg bg-gray-100 dark:bg-gray-800 p-2">
          <div className="flex space-x-1 px-2">
            <button
              onClick={() => setShowMediaUpload(!showMediaUpload)}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <ImageIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <Search className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            className="flex-grow p-2 rounded-lg bg-transparent focus:outline-none resize-none max-h-32"
            rows={1}
            style={{ minHeight: "40px" }}
          />

          <button
            id="send-button"
            onClick={handleSendMessage}
            disabled={!message.trim() && !mediaUrl}
            className={`p-3 rounded-full transition-colors ${
              !message.trim() && !mediaUrl
                ? "bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-gray-500"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            <motion.div whileTap={{ scale: 0.9 }} whileHover={{ rotate: 15 }}>
              <Send className="h-5 w-5" />
            </motion.div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
