// components/chat/MessageBubble.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { Check, CheckCheck, Trash2, Smile, X } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";

// Reaction Types
export interface ReactionType {
  userId: string;
  reaction: string;
}

// Message Types
export interface BaseMessageType {
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

export interface DirectMessageType extends BaseMessageType {
  chatId: string;
}

export interface GroupMessageType extends BaseMessageType {
  groupId: string;
  sender?: {
    _id: string;
    name: string;
    imageUrl: string;
  };
}

export type MessageType = DirectMessageType | GroupMessageType;

export interface MessageBubbleProps {
  message: MessageType;
  isOwnMessage: boolean;
  isGroup: boolean;
}

const MessageBubble = ({
  message,
  isOwnMessage,
  isGroup,
}: MessageBubbleProps) => {
  const { user } = useUser();
  const [showReactions, setShowReactions] = useState(false);
  const reactionMenuRef = useRef<HTMLDivElement>(null);
  const reactionButtonRef = useRef<HTMLButtonElement>(null);

  const isGroupMessage = "groupId" in message;

  const deleteMessageFn = isGroup
    ? api.groups.deleteGroupMessage
    : api.messages.deleteMessage;

  const addReactionFn = isGroup
    ? api.groups.addGroupReaction
    : api.messages.addReaction;

  const deleteMessage = useMutation(deleteMessageFn);
  const addReaction = useMutation(addReactionFn);

  const recipientStatus = useQuery(
    api.messages.getMessageRecipientStatus,
    isOwnMessage && !isGroup ? { messageId: message._id } : "skip"
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        reactionMenuRef.current &&
        !reactionMenuRef.current.contains(event.target as Node) &&
        reactionButtonRef.current &&
        !reactionButtonRef.current.contains(event.target as Node)
      ) {
        setShowReactions(false);
      }
    };
    if (showReactions)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showReactions]);

  if (!user) return null;

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      deleteMessage({ messageId: message._id, userId: user.id });
    }
  };

  const handleReaction = (reaction: string) => {
    addReaction({ messageId: message._id, userId: user.id, reaction });
    setShowReactions(false);
  };

  const getReactionCounts = () => {
    if (!message.reactions?.length) return null;
    const counts: Record<string, number> = {};
    message.reactions.forEach((r) => {
      counts[r.reaction] = (counts[r.reaction] || 0) + 1;
    });
    return Object.entries(counts);
  };

  const messageStatus = () => {
    if (!isOwnMessage) return null;
    const readBy = message.readBy || [];
    const hasBeenRead = readBy.some((id) => id !== user.id);
    const isOnline = recipientStatus?.isOnline;
    if (hasBeenRead) return "read";
    if (isOnline) return "delivered";
    return "sent";
  };

  const senderName = () => {
    if (isGroup && !isOwnMessage && isGroupMessage && message.sender) {
      return message.sender.name;
    }
    return null;
  };

  return (
    <div
      id={`message-${message._id}`}
      className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"} relative mb-6`}
    >
      <motion.div
        whileHover={{ scale: 1.01 }}
        className={`max-w-[80%] rounded-xl p-3 ${
          isOwnMessage
            ? "bg-blue-600 text-white"
            : "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white"
        }`}
      >
        {senderName() && (
          <div className="font-semibold text-xs mb-1">{senderName()}</div>
        )}

        {message.isDeleted ? (
          <div className="italic text-gray-400 dark:text-gray-400">
            This message was deleted
          </div>
        ) : (
          <>
            {message.content && (
              <p className="leading-normal">{message.content}</p>
            )}

            {message.mediaUrl && (
              <div className="mt-2 rounded-lg overflow-hidden">
                {message.mediaUrl.includes(".mp4") ||
                message.mediaUrl.includes("/video/") ? (
                  <video
                    src={message.mediaUrl}
                    controls
                    className="rounded-md max-h-60 w-full mt-2"
                  />
                ) : (
                  <Image
                    src={message.mediaUrl}
                    alt="Image"
                    width={300}
                    height={200}
                    className="rounded-md max-h-60 object-contain cursor-default"
                  />
                )}
              </div>
            )}
          </>
        )}

        <div
          className={`text-xs mt-1 flex items-center justify-end ${
            isOwnMessage ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
          }`}
        >
          <span>{format(new Date(message.timestamp), "HH:mm")}</span>
          {isOwnMessage && (
            <span className="ml-1 inline-flex items-center">
              {messageStatus() === "read" && (
                <CheckCheck className="h-4 w-4 text-green-400" />
              )}
              {messageStatus() === "delivered" && (
                <CheckCheck className="h-3.5 w-3.5" />
              )}
              {messageStatus() === "sent" && <Check className="h-3.5 w-3.5" />}
            </span>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {getReactionCounts() && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex space-x-2 mt-1"
          >
            {getReactionCounts()?.map(([reaction, count]) => (
              <motion.div
                key={reaction}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="bg-gray-800 dark:bg-gray-900 text-white rounded-full px-2 py-1 flex items-center space-x-1"
              >
                <span>{reaction}</span>
                <span className="text-xs">{count}</span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex space-x-2 mt-2">
        <motion.button
          ref={reactionButtonRef}
          onClick={() => setShowReactions(!showReactions)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
        >
          <Smile className="h-4 w-4" />
        </motion.button>

        {isOwnMessage && (
          <motion.button
            onClick={handleDelete}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {showReactions && (
          <motion.div
            ref={reactionMenuRef}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className={`absolute ${isOwnMessage ? "right-0" : "left-0"} -top-16 bg-gray-800/95 dark:bg-gray-900/95 rounded-full shadow-lg py-2 px-3 flex space-x-3 z-50 min-w-[220px] justify-center`}
          >
            {["❤️", "👍", "😂", "😮", "😢"].map((emoji) => (
              <motion.button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                className="p-1 hover:bg-gray-700/50 rounded-full text-xl"
              >
                {emoji}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MessageBubble;
