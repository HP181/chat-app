"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Image from "next/image";
import { ArrowLeft, MoreVertical, Users, Settings, Info } from "lucide-react";
import ChatInterface from "@/components/chat/ChatInterface";
import GroupSettings from "@/components/group/GroupSettings";
import GroupMembersPanel from "@/components/group/GroupMembersPanel";
import { motion, AnimatePresence } from "framer-motion";

export default function GroupChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const [showMembers, setShowMembers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

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
      <div className="flex flex-col items-center justify-center h-full p-8 bg-gray-50 dark:bg-gray-900">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="text-red-500"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
          {group === null ? "Group not found" : "Access denied"}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6 text-center max-w-md">
          {group === null
            ? "This group may have been deleted or doesn't exist."
            : "You are not a member of this group."}
        </p>
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors"
        >
          Go back to chats
        </button>
      </div>
    );
  }

  // Loading state
  if (!group) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Toggle panels
  const toggleMembers = () => {
    setShowMembers(!showMembers);
    if (showSettings) setShowSettings(false);
    if (showInfo) setShowInfo(false);
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
    if (showMembers) setShowMembers(false);
    if (showInfo) setShowInfo(false);
  };

  const toggleInfo = () => {
    setShowInfo(!showInfo);
    if (showMembers) setShowMembers(false);
    if (showSettings) setShowSettings(false);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Group header */}
      <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 mr-2 md:hidden transition-colors"
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
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          )}
          <div className="ml-3">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {group.name}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {group.members?.length || group.memberIds.length} members
            </p>
          </div>
        </div>

        <div className="flex space-x-1">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleMembers}
            className={`p-2 rounded-full transition-colors ${
              showMembers
                ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
                : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
            }`}
          >
            <Users className="h-5 w-5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleInfo}
            className={`p-2 rounded-full transition-colors ${
              showInfo
                ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
                : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
            }`}
          >
            <Info className="h-5 w-5" />
          </motion.button>

          {isAdmin && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleSettings}
              className={`p-2 rounded-full transition-colors ${
                showSettings
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              <Settings className="h-5 w-5" />
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
          >
            <MoreVertical className="h-5 w-5" />
          </motion.button>
        </div>
      </div>

      {/* Main content with sidebars */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Chat interface */}
        <div
          className={`flex-1 overflow-hidden ${
            showMembers || showSettings || showInfo
              ? "hidden md:block md:flex-1"
              : ""
          }`}
        >
          <ChatInterface chatId={groupId} isGroup={true} />
        </div>

        {/* Sidebar overlays for mobile, sidebars for desktop */}
        <AnimatePresence>
          {/* Members panel */}
          {showMembers && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-0 md:relative md:w-80 md:inset-auto z-30 bg-white dark:bg-gray-900 shadow-xl md:shadow-none md:border-l md:border-gray-200 md:dark:border-gray-800"
            >
              <GroupMembersPanel
                group={group}
                onClose={() => setShowMembers(false)}
              />
            </motion.div>
          )}

          {/* Group info panel */}
          {showInfo && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-0 md:relative md:w-80 md:inset-auto z-30 bg-white dark:bg-gray-900 shadow-xl md:shadow-none md:border-l md:border-gray-200 md:dark:border-gray-800"
            >
              <div className="h-full flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                  <h2 className="font-semibold flex items-center">
                    <Info className="h-5 w-5 mr-2" />
                    Group Info
                  </h2>
                  <button
                    onClick={() => setShowInfo(false)}
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="p-4 flex-1 overflow-y-auto">
                  {/* Group image */}
                  <div className="flex justify-center mb-4">
                    {group.imageUrl ? (
                      <Image
                        src={group.imageUrl}
                        alt={group.name}
                        width={100}
                        height={100}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                        <Users className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                      </div>
                    )}
                  </div>

                  {/* Group name and description */}
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {group.name}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                      Group · {group.members?.length || group.memberIds.length}{" "}
                      members
                    </p>
                  </div>

                  {/* Description */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {group.description || "No description provided"}
                    </p>
                  </div>

                  {/* Created info */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Created
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {new Date(group.createdAt).toLocaleDateString()} at{" "}
                      {new Date(group.createdAt).toLocaleTimeString()}
                    </p>
                    {group.members &&
                      group.members.find((m) => m?.clerkId === group.createdBy)
                        ?.name && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                          Created by{" "}
                          {
                            group.members.find(
                              (m) => m?.clerkId === group.createdBy
                            )?.name
                          }
                        </p>
                      )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Settings sidebar */}
          {showSettings && isAdmin && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-0 md:relative md:w-80 md:inset-auto z-30 bg-white dark:bg-gray-900 shadow-xl md:shadow-none md:border-l md:border-gray-200 md:dark:border-gray-800"
            >
              <GroupSettings
                group={group}
                onClose={() => setShowSettings(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overlay for mobile */}
        <AnimatePresence>
          {(showMembers || showSettings || showInfo) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-20 md:hidden"
              onClick={() => {
                setShowMembers(false);
                setShowSettings(false);
                setShowInfo(false);
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
