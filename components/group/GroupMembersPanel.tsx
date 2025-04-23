// components/group/GroupMembersPanel.tsx
"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Image from "next/image";
import { 
  X, Search, UserPlus, UserMinus, Shield, MoreHorizontal,
  Crown, Users, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

interface GroupMembersPanelProps {
  group: GroupType;
  onClose: () => void;
}

const GroupMembersPanel = ({ group, onClose }: GroupMembersPanelProps) => {
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [addingMembers, setAddingMembers] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Determine if current user is admin
  const isAdmin = user && group.adminIds.includes(user.id);
  const isCreator = user && group.createdBy === user.id;
  
  // Search users to add to group
  const searchUsers = useQuery(
    api.users.searchUsers,
    addingMembers && searchTerm.trim().length > 0 && user?.id
      ? { searchTerm, currentUserClerkId: user.id }
      : "skip"
  ) as MemberType[] | undefined;
  
  // Group mutations
  const addMember = useMutation(api.groups.addGroupMember);
  const removeMember = useMutation(api.groups.removeGroupMember);
  const promoteToAdmin = useMutation(api.groups.promoteToAdmin);
  const leaveGroup = useMutation(api.groups.leaveGroup);

  // Handle adding a member
  const handleAddMember = async (memberClerkId: string) => {
    if (!user?.id) return;
    
    setIsProcessing(true);
    try {
      await addMember({
        groupId: group._id,
        adminClerkId: user.id,
        newMemberClerkId: memberClerkId,
      });
      setSearchTerm("");
    } catch (error) {
      console.error("Error adding member:", error);
      alert("Failed to add member");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle removing a member
  const handleRemoveMember = async (memberClerkId: string) => {
    if (!user?.id) return;
    
    setIsProcessing(true);
    try {
      await removeMember({
        groupId: group._id,
        adminClerkId: user.id,
        memberClerkId,
      });
      setSelectedMember(null);
    } catch (error) {
      console.error("Error removing member:", error);
      alert("Failed to remove member");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle promoting a member to admin
  const handlePromoteToAdmin = async (memberClerkId: string) => {
    if (!user?.id) return;
    
    setIsProcessing(true);
    try {
      await promoteToAdmin({
        groupId: group._id,
        adminClerkId: user.id,
        memberClerkId,
      });
      setSelectedMember(null);
    } catch (error) {
      console.error("Error promoting member:", error);
      alert("Failed to promote member");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle leaving the group
  const handleLeaveGroup = async () => {
    if (!user?.id) return;
    
    if (window.confirm("Are you sure you want to leave this group?")) {
      setIsProcessing(true);
      try {
        await leaveGroup({
          groupId: group._id,
          userClerkId: user.id,
        });
        // Redirect will happen automatically due to the isMember check in the parent component
      } catch (error) {
        console.error("Error leaving group:", error);
        alert("Failed to leave group");
        setIsProcessing(false);
      }
    }
  };

  // Check if user is online (active within last 2 minutes)
  const isUserOnline = (lastSeen?: number) => {
    if (!lastSeen) return false;
    const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
    return lastSeen > twoMinutesAgo;
  };

  // Filter members by search term
  const filteredMembers = (group.members || []).filter((member: MemberType) =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.username && member.username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Filter search results to exclude existing members
  const filteredSearchResults = searchUsers?.filter(
    searchedUser => !group.memberIds.includes(searchedUser.clerkId)
  ) || [];

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <h2 className="font-semibold flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Group Members ({group.members?.length || 0})
        </h2>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-gray-500" />
          </div>
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={addingMembers ? "Search users to add..." : "Search members..."}
            className="w-full p-2.5 pl-10 pr-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>
      </div>
      
      {/* Add members button (for admins) */}
      {isAdmin && (
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => {
              setAddingMembers(!addingMembers);
              setSearchTerm("");
              setSelectedMember(null);
            }}
            className={`w-full p-2.5 rounded-lg flex items-center justify-center space-x-2 transition-colors ${
              addingMembers
                ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50"
            }`}
            disabled={isProcessing}
          >
            {addingMembers ? (
              <>
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                <span>Add Members</span>
              </>
            )}
          </button>
        </div>
      )}
      
      {/* Content area - either member list or search results */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {addingMembers ? (
            <motion.div
              key="add-members"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-2"
            >
              {isProcessing && (
                <div className="p-4 flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                </div>
              )}
              
              {!isProcessing && filteredSearchResults.length > 0 ? (
                <div className="space-y-1">
                  {filteredSearchResults.map((searchedUser) => (
                    <motion.div
                      key={searchedUser._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 mx-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center">
                        <div className="relative">
                          {searchedUser.imageUrl ? (
                            <Image
                              src={searchedUser.imageUrl}
                              alt={searchedUser.name}
                              width={40}
                              height={40}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                                {searchedUser.name.charAt(0)}
                              </span>
                            </div>
                          )}
                          
                          {/* Online status indicator */}
                          <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${
                            isUserOnline(searchedUser.lastSeen) 
                              ? "bg-green-500" 
                              : "bg-gray-400"
                          }`}></div>
                        </div>
                        
                        <div className="ml-3 flex-grow">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {searchedUser.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {searchedUser.username || searchedUser.email}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleAddMember(searchedUser.clerkId)}
                          className="ml-2 p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                          disabled={isProcessing}
                        >
                          <UserPlus className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : !isProcessing && filteredSearchResults.length === 0 && searchTerm.trim() !== "" ? (
                <div className="py-6 text-center text-gray-500 dark:text-gray-400">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p>No users found</p>
                </div>
              ) : !isProcessing && searchTerm.trim() === "" ? (
                <div className="py-6 text-center text-gray-500 dark:text-gray-400">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p>Search for users to add to the group</p>
                </div>
              ) : null}
            </motion.div>
          ) : (
            <motion.div
              key="member-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-2"
            >
              {isProcessing && (
                <div className="p-4 flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                </div>
              )}
              
              {!isProcessing && filteredMembers.length > 0 ? (
                <div className="space-y-1">
                  {filteredMembers.map((member: MemberType) => (
                    <motion.div
                      key={member._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-3 mx-2 rounded-lg transition-colors ${
                        selectedMember === member.clerkId 
                          ? "bg-blue-50 dark:bg-blue-900/20" 
                          : "hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="relative">
                          {member.imageUrl ? (
                            <Image
                              src={member.imageUrl}
                              alt={member.name}
                              width={40}
                              height={40}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                                {member.name.charAt(0)}
                              </span>
                            </div>
                          )}
                          
                          {/* Online status indicator */}
                          <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${
                            isUserOnline(member.lastSeen) 
                              ? "bg-green-500" 
                              : "bg-gray-400"
                          }`}></div>
                        </div>
                        
                        <div className="ml-3 flex-grow">
                          <div className="font-medium text-gray-900 dark:text-white flex items-center">
                            {member.name}
                            
                            {member.clerkId === group.createdBy && (
                              <span className="ml-1.5 inline-flex bg-yellow-100 dark:bg-yellow-900/30 px-1.5 py-0.5 rounded text-xs text-yellow-800 dark:text-yellow-300 items-center">
                                <Crown className="h-3 w-3 mr-0.5" />
                                Owner
                              </span>
                            )}
                            
                            {group.adminIds.includes(member.clerkId) && 
                             member.clerkId !== group.createdBy && (
                              <span className="ml-1.5 inline-flex bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded text-xs text-blue-800 dark:text-blue-300 items-center">
                                <Shield className="h-3 w-3 mr-0.5" />
                                Admin
                              </span>
                            )}

                            {member.clerkId === user?.id && (
                              <span className="ml-1.5 inline-flex bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs text-gray-800 dark:text-gray-300">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {member.username || member.email}
                          </div>
                        </div>
                        
                        {/* Member actions */}
                        {isAdmin && member.clerkId !== user?.id && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedMember(
                              selectedMember === member.clerkId ? null : member.clerkId
                            )}
                            className="ml-2 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          >
                            <MoreHorizontal className="h-5 w-5" />
                          </motion.button>
                        )}

                        {/* Action popup */}
                        <AnimatePresence>
                          {selectedMember === member.clerkId && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: 10 }}
                              className="absolute right-4 mt-12 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                              style={{ width: "180px" }}
                            >
                              {/* Promote to admin (if not already) */}
                              {!group.adminIds.includes(member.clerkId) && (
                                <button
                                  onClick={() => handlePromoteToAdmin(member.clerkId)}
                                  className="w-full p-2.5 flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
                                  disabled={isProcessing}
                                >
                                  <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                  <span>Make Admin</span>
                                </button>
                              )}
                              
                              {/* Remove from group */}
                              <button
                                onClick={() => handleRemoveMember(member.clerkId)}
                                className="w-full p-2.5 flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm text-red-600 dark:text-red-400"
                                disabled={isProcessing}
                              >
                                <UserMinus className="h-4 w-4" />
                                <span>Remove from group</span>
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : !isProcessing && filteredMembers.length === 0 && searchTerm.trim() !== "" ? (
                <div className="py-6 text-center text-gray-500 dark:text-gray-400">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p>No members found</p>
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Leave group button (for non-creators) */}
      {user && user.id !== group.createdBy && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={handleLeaveGroup}
            disabled={isProcessing}
            className="w-full p-2.5 rounded-lg flex items-center justify-center space-x-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <UserMinus className="h-4 w-4" />
                <span>Leave Group</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default GroupMembersPanel;