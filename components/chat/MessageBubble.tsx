"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { CheckCheck, Trash2, Smile } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface MessageBubbleProps {
  message: any;
  isOwnMessage: boolean;
  isGroup: boolean;
}

const MessageBubble = ({ message, isOwnMessage, isGroup }: MessageBubbleProps) => {
  const { user } = useUser();
  const [showReactions, setShowReactions] = useState(false);
  const reactionMenuRef = useRef<HTMLDivElement>(null);
  const reactionButtonRef = useRef<HTMLButtonElement>(null);
  
  // Use appropriate delete function based on isGroup
  const deleteMessageFn = isGroup
    ? api.groups.deleteGroupMessage
    : api.messages.deleteMessage;

  // Use appropriate reaction function based on isGroup
  const addReactionFn = isGroup
    ? api.groups.addGroupReaction
    : api.messages.addReaction;

  const deleteMessage = useMutation(deleteMessageFn);
  const addReaction = useMutation(addReactionFn);

  // Close reaction menu when clicking outside
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

    if (showReactions) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showReactions]);

  if (!user) return null;

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      deleteMessage({
        messageId: message._id,
        userId: user.id,
      });
    }
  };

  const handleReaction = (reaction: string) => {
    addReaction({
      messageId: message._id,
      userId: user.id,
      reaction,
    });
    setShowReactions(false);
  };

  // Get reaction counts
  const getReactionCounts = () => {
    if (!message.reactions || message.reactions.length === 0) return null;

    const counts: Record<string, number> = {};
    message.reactions.forEach((r: any) => {
      counts[r.reaction] = (counts[r.reaction] || 0) + 1;
    });

    return Object.entries(counts);
  };

  const reactionCounts = getReactionCounts();

  return (
    <div
      id={`message-${message._id}`}
      className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"} relative mb-10`}
    >
      {/* Message bubble */}
      <div
        className={`max-w-[80%] rounded-lg p-3 ${
          isOwnMessage
            ? "bg-blue-500 text-white rounded-br-none"
            : "bg-gray-100 dark:bg-gray-800 rounded-bl-none"
        }`}
      >
        {/* Group message sender name */}
        {isGroup && !isOwnMessage && message.sender && (
          <div className="font-semibold text-xs mb-1">
            {message.sender.name}
          </div>
        )}

        {/* Message content */}
        {message.isDeleted ? (
          <div className="italic text-gray-500 dark:text-gray-400">
            This message was deleted
          </div>
        ) : (
          <>
            {/* Text content */}
            {message.content && <p>{message.content}</p>}

            {/* Media content */}
            {message.mediaUrl && (
              <div className="mt-2">
                {message.mediaType === "image" ? (
                  <Image
                    src={message.mediaUrl}
                    alt="Image"
                    width={300}
                    height={200}
                    className="rounded-md max-h-60 object-contain"
                  />
                ) : message.mediaType === "video" ? (
                  <video
                    src={message.mediaUrl}
                    controls
                    className="rounded-md max-h-60 w-full"
                  />
                ) : null}
              </div>
            )}
          </>
        )}

        {/* Message timestamp and read receipts */}
        <div
          className={`text-xs mt-1 flex items-center ${
            isOwnMessage ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
          }`}
        >
          <span>{format(new Date(message.timestamp), "HH:mm")}</span>
          {isOwnMessage && message.readBy && message.readBy.length > 1 && (
            <span className="ml-2 inline-flex items-center">
              <CheckCheck className="h-3 w-3" />
            </span>
          )}
        </div>
      </div>

      {/* Reactions displayed inline with counts */}
      {reactionCounts && reactionCounts.length > 0 && (
        <div className="flex space-x-2 mt-1">
          {reactionCounts.map(([reaction, count]) => (
            <div
              key={reaction}
              className="bg-gray-800 dark:bg-gray-900 text-white rounded-full px-2 py-1 flex items-center space-x-1"
            >
              <span>{reaction}</span>
              <span className="text-xs">{count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex space-x-2 mt-2">
        {/* Reaction button */}
        <button
          ref={reactionButtonRef}
          onClick={() => setShowReactions(!showReactions)}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700"
        >
          <Smile className="h-4 w-4 text-gray-300" />
        </button>
        
        {/* Delete button (only for own messages) */}
        {isOwnMessage && (
          <button
            onClick={handleDelete}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600"
          >
            <Trash2 className="h-4 w-4 text-white" />
          </button>
        )}
      </div>

      {/* Reaction selector popup */}
      {showReactions && (
        <div 
          ref={reactionMenuRef}
          className={`absolute ${isOwnMessage ? 'right-0' : 'left-0'} -top-12 bg-gray-800/95 dark:bg-gray-900/95 rounded-full shadow-lg py-2 px-3
                    flex space-x-3 border border-gray-700 z-50 min-w-[220px] justify-center`}
        >
          <button
            onClick={() => handleReaction("❤️")}
            className="p-1 hover:bg-gray-700/50 rounded-full text-xl"
          >
            ❤️
          </button>
          <button
            onClick={() => handleReaction("👍")}
            className="p-1 hover:bg-gray-700/50 rounded-full text-xl"
          >
            👍
          </button>
          <button
            onClick={() => handleReaction("😂")}
            className="p-1 hover:bg-gray-700/50 rounded-full text-xl"
          >
            😂
          </button>
          <button
            onClick={() => handleReaction("😮")}
            className="p-1 hover:bg-gray-700/50 rounded-full text-xl"
          >
            😮
          </button>
          <button
            onClick={() => handleReaction("😢")}
            className="p-1 hover:bg-gray-700/50 rounded-full text-xl"
          >
            😢
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageBubble;