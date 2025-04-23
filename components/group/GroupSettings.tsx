// components/group/GroupSettings.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { X, Save, Trash2, Loader2 } from "lucide-react";
import FileUpload from "../ui/FileUpload";

// Define interfaces for type safety
interface MemberType {
  _id: string;
  clerkId: string;
  name: string;
  email: string;
  imageUrl: string;
  username?: string;
  bio?: string;
  lastSeen?: number;
  themePreference?: string;
}

interface GroupType {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  createdBy: string;
  createdAt: number;
  memberIds: string[];
  adminIds: string[];
  lastMessageAt?: number;
  lastMessagePreview?: string;
  members?: MemberType[];
}

interface GroupSettingsProps {
  group: GroupType;
  onClose: () => void;
}

const GroupSettings = ({ group, onClose }: GroupSettingsProps) => {
  const router = useRouter();
  const { user } = useUser();
  const [name, setName] = useState(group.name || "");
  const [description, setDescription] = useState(group.description || "");
  const [imageUrl, setImageUrl] = useState(group.imageUrl || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  
  // Group mutations
  const updateGroup = useMutation(api.groups.updateGroup);
  const deleteGroup = useMutation(api.groups.deleteGroup);

  // Handle updating group
  const handleUpdateGroup = async () => {
    if (!user?.id) return;
    
    if (!name.trim()) {
      setError("Group name is required");
      return;
    }
    
    setIsUpdating(true);
    setError("");
    setMessage("");
    
    try {
      await updateGroup({
        groupId: group._id,
        userClerkId: user.id,
        name: name.trim(),
        description: description.trim(),
        imageUrl,
      });
      
      setMessage("Group updated successfully");
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (error: unknown) {
      console.error("Error updating group:", error);
      setError(error instanceof Error ? error.message : "Failed to update group");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle deleting group
  const handleDeleteGroup = async () => {
    if (!user?.id) return;
    
    const confirmation = window.confirm(
      "Are you sure you want to delete this group? This action cannot be undone."
    );
    
    if (!confirmation) return;
    
    setIsDeleting(true);
    setError("");
    
    try {
      await deleteGroup({
        groupId: group._id,
        userClerkId: user.id,
      });
      
      router.push("/");
    } catch (error: unknown) {
      console.error("Error deleting group:", error);
      setError(error instanceof Error ? error.message : "Failed to delete group");
      setIsDeleting(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold">Group Settings</h2>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-100 text-red-800 rounded-md">
            {error}
          </div>
        )}
        
        {/* Success message */}
        {message && (
          <div className="p-3 bg-green-100 text-green-800 rounded-md">
            {message}
          </div>
        )}
        
        {/* Group image */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Group Image</label>
          <div className="max-w-full">
            <FileUpload
              value={imageUrl}
              onChange={setImageUrl}
              endpoint="group"
              disabled={isUpdating || isDeleting}
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
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter group name"
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isUpdating || isDeleting}
            required
          />
        </div>
        
        {/* Group description */}
        <div className="space-y-2">
          <label htmlFor="description" className="block text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter group description"
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={4}
            disabled={isUpdating || isDeleting}
          />
        </div>
        
        {/* Update button */}
        <div>
          <button
            onClick={handleUpdateGroup}
            disabled={isUpdating || isDeleting || !name.trim()}
            className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
        
        {/* Delete group (only for the group creator) */}
        {user && user.id === group.createdBy && (
          <div className="pt-6 border-t mt-6">
            <h3 className="text-lg font-medium text-red-600 mb-2">
              Danger Zone
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Once you delete a group, there is no going back. Please be certain.
            </p>
            <button
              onClick={handleDeleteGroup}
              disabled={isUpdating || isDeleting}
              className="w-full py-2 px-4 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Group</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupSettings;