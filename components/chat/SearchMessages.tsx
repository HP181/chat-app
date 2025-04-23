// components/chat/SearchMessages.tsx

import { useState, useEffect } from "react";
import { Search, X, ArrowDown, ArrowUp } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { format } from "date-fns";
import { MessageType, DirectMessageType, GroupMessageType } from "./MessageBubble"; // Import the types

interface SearchMessagesProps {
  chatId: string;
  isGroup: boolean;
}

const SearchMessages = ({ chatId, isGroup }: SearchMessagesProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Use the appropriate search function based on isGroup
  const searchFn = isGroup
    ? api.groups.searchGroupMessages
    : api.messages.searchMessages;

  // Search messages query
  const searchResults = useQuery(
    searchFn,
    searchTerm.trim().length > 0
      ? { chatId, searchTerm }
      : "skip"
  ) as MessageType[] | undefined;

  // Reset selected index when search results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchResults]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (searchResults && searchResults.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % searchResults.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (searchResults && searchResults.length > 0) {
        setSelectedIndex((prev) => 
          prev === 0 ? searchResults.length - 1 : prev - 1
        );
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      scrollToMessage(selectedIndex);
    }
  };

  const scrollToMessage = (index: number) => {
    if (!searchResults || !searchResults[index]) return;
    
    const messageId = searchResults[index]._id;
    const element = document.getElementById(`message-${messageId}`);
    
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("bg-yellow-100", "dark:bg-yellow-900");
      setTimeout(() => {
        element.classList.remove("bg-yellow-100", "dark:bg-yellow-900");
      }, 2000);
    }
  };

  // Helper function to get sender name based on message type
  const getSenderName = (message: MessageType): string => {
    if (isGroup) {
      // For group messages, check if it's a GroupMessageType and has sender info
      if ('groupId' in message && message.sender) {
        return message.sender.name || "Unknown";
      }
      return "Unknown";
    } else {
      // For direct messages, we don't display sender
      return "";
    }
  };

  return (
    <div className="w-full space-y-2">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="h-4 w-4 text-gray-500" />
        </div>
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search in conversation..."
          className="w-full p-2 pl-10 pr-10 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute inset-y-0 right-0 flex items-center pr-3"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        )}
      </div>

      {/* Search results */}
      {searchResults && searchResults.length > 0 ? (
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-gray-500">
            <span>{searchResults.length} results</span>
            <div className="flex space-x-1">
              <button
                onClick={() => {
                  setSelectedIndex((prev) => 
                    prev === 0 ? searchResults.length - 1 : prev - 1
                  );
                  scrollToMessage(
                    selectedIndex === 0 ? searchResults.length - 1 : selectedIndex - 1
                  );
                }}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setSelectedIndex((prev) => (prev + 1) % searchResults.length);
                  scrollToMessage((selectedIndex + 1) % searchResults.length);
                }}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="max-h-40 overflow-y-auto border rounded-lg">
            {searchResults.map((message, index) => (
              <div
                key={message._id}
                onClick={() => {
                  setSelectedIndex(index);
                  scrollToMessage(index);
                }}
                className={`p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  index === selectedIndex ? "bg-blue-100 dark:bg-blue-900" : ""
                }`}
              >
                <div className="flex justify-between">
                  <span className="font-medium">
                    {getSenderName(message)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {format(new Date(message.timestamp), "MMM d, HH:mm")}
                  </span>
                </div>
                <p className="text-sm truncate">
                  {message.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : searchTerm.trim().length > 0 && searchResults && searchResults.length === 0 ? (
        <div className="text-sm text-gray-500 text-center py-2">
          No results found
        </div>
      ) : null}
    </div>
  );
};

export default SearchMessages;