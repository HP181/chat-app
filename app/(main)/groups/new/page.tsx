"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Image from "next/image";
import { 
  ArrowLeft, Search, Plus, X, Check, Loader2, 
  Users, Camera, MessageSquare, Info 
} from "lucide-react";
import FileUpload from "@/components/ui/FileUpload";
import { motion, AnimatePresence } from "framer-motion";

export default function CreateGroupPage() {
  const router = useRouter();
  const { user } = useUser();
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("details");
  
  // Search users
  const searchUsers = useQuery(
    api.users.searchUsers,
    user?.id && searchTerm.trim().length > 0
      ? { searchTerm, currentUserClerkId: user.id }
      : "skip"
  );
  
  // Create group mutation
  const createGroup = useMutation(api.groups.createGroup);

  // Handle user selection
  const toggleUserSelection = (selectedUser: any) => {
    setSelectedUsers((prev) => {
      const isSelected = prev.some((u) => u.clerkId === selectedUser.clerkId);
      
      if (isSelected) {
        return prev.filter((u) => u.clerkId !== selectedUser.clerkId);
      } else {
        return [...prev, selectedUser];
      }
    });
  };

  // Check if form is valid
  const isFormValid = groupName.trim() !== "" && selectedUsers.length > 0;

  // Handle group creation
  const handleCreateGroup = async () => {
    if (!user) return;
    
    if (!groupName.trim()) {
      setError("Group name is required");
      return;
    }
    
    if (selectedUsers.length === 0) {
      setError("Please select at least one member");
      return;
    }
    
    setIsCreating(true);
    setError("");
    
    try {
      const result = await createGroup({
        name: groupName.trim(),
        description: description.trim(),
        imageUrl: imageUrl || undefined,
        creatorClerkId: user.id,
        initialMemberIds: selectedUsers.map((u) => u.clerkId),
      });
      
      router.push(`/group/${result.groupId}`);
    } catch (error: any) {
      console.error("Error creating group:", error);
      setError(error.message || "Failed to create group");
      setIsCreating(false);
    }
  };

  if (!user) return null;

  const totalSteps = 2;
  const currentStep = activeTab === "details" ? 1 : 2;

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="flex items-center p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 mr-2 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">Create New Group</h1>
      </header>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-800 h-1">
        <motion.div 
          className="bg-blue-600 h-1" 
          initial={{ width: `${(currentStep - 1) * 100 / totalSteps}%` }}
          animate={{ width: `${currentStep * 100 / totalSteps}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex">
          <button 
            onClick={() => setActiveTab("details")}
            className={`flex-1 py-3 font-medium transition-colors flex items-center justify-center space-x-2 ${
              activeTab === "details" 
                ? "text-blue-600 border-b-2 border-blue-600" 
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <Info className="h-4 w-4" />
            <span>Group Details</span>
          </button>
          <button 
            onClick={() => setActiveTab("members")}
            className={`flex-1 py-3 font-medium transition-colors flex items-center justify-center space-x-2 ${
              activeTab === "members" 
                ? "text-blue-600 border-b-2 border-blue-600" 
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Add Members</span>
            {selectedUsers.length > 0 && (
              <span className="ml-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-xs py-0.5 px-1.5 rounded-full">
                {selectedUsers.length}
              </span>
            )}
          </button>
        </div>
      </div>
      
      {/* Group creation form */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
        <AnimatePresence mode="wait">
          {activeTab === "details" ? (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-xl mx-auto p-6 space-y-6"
            >
              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-lg flex items-start"
                  >
                    <div className="flex-shrink-0 mr-2 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0-1.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11z"/>
                        <path d="M7.5 8V4.5a.5.5 0 0 1 1 0V8a.5.5 0 0 1-1 0z"/>
                        <circle cx="8" cy="10" r=".5"/>
                      </svg>
                    </div>
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Group visual preview */}
              <div className="flex items-center justify-center mb-8">
                <div className="w-24 h-24 relative mx-auto">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt="Group"
                      width={96}
                      height={96}
                      className="rounded-full object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                      <Users className="h-12 w-12 text-blue-500 dark:text-blue-400" />
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 shadow-lg">
                    <Camera className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              
              {/* Group image */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Group Image
                </label>
                <FileUpload
                  value={imageUrl}
                  onChange={setImageUrl}
                  endpoint="group"
                  disabled={isCreating}
                />
              </div>
              
              {/* Group name */}
              <div className="space-y-2">
                <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Group Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MessageSquare className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="groupName"
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Enter group name"
                    className="w-full pl-10 p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    disabled={isCreating}
                    required
                  />
                </div>
              </div>
              
              {/* Group description */}
              <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description (Optional)
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <Info className="h-5 w-5 text-gray-400" />
                  </div>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter group description"
                    className="w-full pl-10 p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900 dark:text-white"
                    rows={3}
                    disabled={isCreating}
                  />
                </div>
              </div>
              
              {/* Navigation buttons */}
              <div className="pt-4 flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab("members")}
                  disabled={!groupName.trim()}
                  className="py-2.5 px-5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  <span>Next</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path fillRule="evenodd" d="M4.5 8a.5.5 0 0 1 .5-.5h5.793L8.146 4.854a.5.5 0 0 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.793 8.5H5a.5.5 0 0 1-.5-.5z"/>
                  </svg>
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="members"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-6 space-y-6 max-w-xl mx-auto"
            >
              {/* Selected users */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Selected Members ({selectedUsers.length})
                </label>
                
                {selectedUsers.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-2 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    {selectedUsers.map((user) => (
                      <motion.div
                        key={user.clerkId}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="flex items-center space-x-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 pl-1 pr-2 py-1 rounded-full"
                      >
                        <Image
                          src={user.imageUrl}
                          alt={user.name}
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                        <span className="text-sm">{user.name}</span>
                        <button
                          onClick={() => toggleUserSelection(user)}
                          className="p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full transition-colors"
                          disabled={isCreating}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                    <Users className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No members selected yet</p>
                  </div>
                )}
              </div>
              
              {/* Search users */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Add Members
                </label>
                
                {/* Search input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="h-4 w-4 text-gray-500" />
                  </div>
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search users by name or username..."
                    className="w-full p-2.5 pl-10 pr-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    disabled={isCreating}
                  />
                </div>
                
                {/* Search results */}
                <AnimatePresence>
                  {searchUsers && searchUsers.length > 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-2 space-y-1 max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm"
                    >
                      {searchUsers
                        .filter(
                          (user) => !selectedUsers.some((u) => u.clerkId === user.clerkId)
                        )
                        .map((user, index) => (
                          <motion.button
                            key={user._id}
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            onClick={() => toggleUserSelection(user)}
                            className="w-full p-2 flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            disabled={isCreating}
                          >
                            <Image
                              src={user.imageUrl}
                              alt={user.name}
                              width={36}
                              height={36}
                              className="rounded-full"
                            />
                            <div className="flex-grow text-left">
                              <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {user.username || user.email}
                              </div>
                            </div>
                            <div className="flex-shrink-0 bg-blue-50 dark:bg-blue-900/30 p-1 rounded-full">
                              <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                          </motion.button>
                        ))}
                    </motion.div>
                  ) : searchTerm.trim().length > 0 && searchUsers && searchUsers.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-2 text-center text-gray-500 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <p>No users found</p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
              
              {/* Navigation buttons */}
              <div className="pt-4 flex justify-between">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab("details")}
                  className="py-2.5 px-5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center space-x-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path fillRule="evenodd" d="M11.5 8a.5.5 0 0 0-.5-.5H5.707l2.147-2.146a.5.5 0 1 0-.708-.708l-3 3a.5.5 0 0 0 0 .708l3 3a.5.5 0 0 0 .708-.708L5.707 8.5H11a.5.5 0 0 0 .5-.5z"/>
                  </svg>
                  <span>Back</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreateGroup}
                  disabled={isCreating || !isFormValid}
                  className="py-2.5 px-5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Create Group</span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}