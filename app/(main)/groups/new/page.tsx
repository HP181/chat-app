"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Image from "next/image";
import { ArrowLeft, Search, Plus, X, Check, Loader2 } from "lucide-react";
import FileUpload from "@/components/ui/FileUpload";

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

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="flex items-center p-4 border-b">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">Create New Group</h1>
      </header>
      
      {/* Group creation form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-100 text-red-800 rounded-md">
            {error}
          </div>
        )}
        
        {/* Group image */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Group Image</label>
          <div className="max-w-xs">
            <FileUpload
              value={imageUrl}
              onChange={setImageUrl}
              endpoint="group"
              disabled={isCreating}
            />
          </div>
        </div>
        
        {/* Group name */}
        <div className="space-y-2">
          <label htmlFor="groupName" className="block text-sm font-medium">
            Group Name
          </label>
          <input
            id="groupName"
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Enter group name"
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isCreating}
            required
          />
        </div>
        
        {/* Group description */}
        <div className="space-y-2">
          <label htmlFor="description" className="block text-sm font-medium">
            Description (Optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter group description"
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
            disabled={isCreating}
          />
        </div>
        
        {/* Member selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Add Members ({selectedUsers.length} selected)
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
              placeholder="Search users..."
              className="w-full p-2 pl-10 pr-4 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isCreating}
            />
          </div>
          
          {/* Selected users */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedUsers.map((user) => (
                <div
                  key={user.clerkId}
                  className="flex items-center space-x-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full"
                >
                  <Image
                    src={user.imageUrl}
                    alt={user.name}
                    width={20}
                    height={20}
                    className="rounded-full"
                  />
                  <span className="text-sm">{user.name}</span>
                  <button
                    onClick={() => toggleUserSelection(user)}
                    className="p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full"
                    disabled={isCreating}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Search results */}
          {searchUsers && searchUsers.length > 0 ? (
            <div className="mt-2 space-y-1 max-h-60 overflow-y-auto border rounded-md">
              {searchUsers
                .filter(
                  (user) => !selectedUsers.some((u) => u.clerkId === user.clerkId)
                )
                .map((user) => (
                  <button
                    key={user._id}
                    onClick={() => toggleUserSelection(user)}
                    className="w-full p-2 flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-gray-800"
                    disabled={isCreating}
                  >
                    <Image
                      src={user.imageUrl}
                      alt={user.name}
                      width={30}
                      height={30}
                      className="rounded-full"
                    />
                    <div className="flex-grow text-left">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-gray-500">
                        {user.username || user.email}
                      </div>
                    </div>
                    <Plus className="h-4 w-4 text-blue-500" />
                  </button>
                ))}
            </div>
          ) : searchTerm.trim().length > 0 && searchUsers && searchUsers.length === 0 ? (
            <div className="mt-2 text-center text-gray-500 py-4 border rounded-md">
              No users found
            </div>
          ) : null}
        </div>
        
        {/* Create button */}
        <div className="pt-4">
          <button
            onClick={handleCreateGroup}
            disabled={isCreating || !groupName.trim() || selectedUsers.length === 0}
            className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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
          </button>
        </div>
      </div>
    </div>
  );
}