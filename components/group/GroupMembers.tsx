"use client";

import { useState } from "react";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { X, Search, Plus, Crown, UserPlus, MoreHorizontal, Shield, UserMinus } from "lucide-react";

interface GroupMembersProps {
  group: any;
  isAdmin: boolean;
  onClose: () => void;
}

const GroupMembers = ({ group, isAdmin, onClose }: GroupMembersProps) => {
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showMemberActions, setShowMemberActions] = useState<string | null>(null);
  
  // Search users to add to group
  const searchUsers = useQuery(
    api.users.searchUsers,
    showAddMembers && searchTerm.trim().length > 0 && user?.id
      ? { searchTerm, currentUserClerkId: user.id }
      : "skip"
  );
  
  // Group mutations
  const addMember = useMutation(api.groups.addGroupMember);
  const removeMember = useMutation(api.groups.removeGroupMember);
  const promoteToAdmin = useMutation(api.groups.promoteToAdmin);
  const leaveGroup = useMutation(api.groups.leaveGroup);

  // Handle adding a member
  const handleAddMember = async (memberClerkId: string) => {
    if (!user?.id) return;
    
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
    }
  };

  // Handle removing a member
  const handleRemoveMember = async (memberClerkId: string) => {
    if (!user?.id) return;
    
    try {
      await removeMember({
        groupId: group._id,
        adminClerkId: user.id,
        memberClerkId,
      });
      setShowMemberActions(null);
    } catch (error) {
      console.error("Error removing member:", error);
      alert("Failed to remove member");
    }
  };

  // Handle promoting a member to admin
  const handlePromoteToAdmin = async (memberClerkId: string) => {
    if (!user?.id) return;
    
    try {
      await promoteToAdmin({
        groupId: group._id,
        adminClerkId: user.id,
        memberClerkId,
      });
      setShowMemberActions(null);
    } catch (error) {
      console.error("Error promoting member:", error);
      alert("Failed to promote member");
    }
  };

  // Handle leaving the group
  const handleLeaveGroup = async () => {
    if (!user?.id) return;
    
    if (window.confirm("Are you sure you want to leave this group?")) {
      try {
        await leaveGroup({
          groupId: group._id,
          userClerkId: user.id,
        });
        // Redirect will happen automatically due to the isMember check in the parent component
      } catch (error) {
        console.error("Error leaving group:", error);
        alert("Failed to leave group");
      }
    }
  };

  // Filter members by search term
  const filteredMembers = group.members?.filter((member: any) =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold">Group Members ({group.members?.length || 0})</h2>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <div className="p-2">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-gray-500" />
          </div>
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={showAddMembers ? "Search users to add..." : "Search members..."}
            className="w-full p-2 pl-10 pr-4 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>
      
      {/* Add members button (for admins) */}
      {isAdmin && (
        <div className="px-4 py-2">
          <button
            onClick={() => setShowAddMembers(!showAddMembers)}
            className={`w-full p-2 rounded-md flex items-center justify-center space-x-2 ${
              showAddMembers
                ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
            }`}
          >
            {showAddMembers ? (
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
      
      {/* Search results for adding members */}
      {showAddMembers && isAdmin && (
        <div className="flex-1 overflow-y-auto p-2">
          {searchUsers && searchUsers.length > 0 ? (
            <div className="space-y-1">
              {searchUsers
                .filter(
                  (user) => !group.memberIds.includes(user.clerkId)
                )
                .map((searchedUser) => (
                  <button
                    key={searchedUser._id}
                    onClick={() => handleAddMember(searchedUser.clerkId)}
                    className="w-full p-2 flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                  >
                    <Image
                      src={searchedUser.imageUrl}
                      alt={searchedUser.name}
                      width={36}
                      height={36}
                      className="rounded-full"
                    />
                    <div className="flex-grow text-left">
                      <div className="font-medium">{searchedUser.name}</div>
                      <div className="text-xs text-gray-500">
                        {searchedUser.username || searchedUser.email}
                      </div>
                    </div>
                    <Plus className="h-4 w-4 text-blue-500" />
                  </button>
                ))}
            </div>
          ) : searchTerm.trim().length > 0 && searchUsers && searchUsers.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              No users found
            </div>
          ) : searchTerm.trim().length > 0 ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
          ) : null}
        </div>
      )}
      
      {/* Member list */}
      {!showAddMembers && (
        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {filteredMembers.map((member: any) => (
              <div
                key={member._id}
                className="relative p-2 flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
              >
                <Image
                  src={member.imageUrl}
                  alt={member.name}
                  width={36}
                  height={36}
                  className="rounded-full"
                />
                <div className="flex-grow">
                  <div className="font-medium flex items-center">
                    {member.name}
                    {member.clerkId === group.createdBy && (
                      <Crown className="h-3 w-3 text-yellow-500 ml-1" />
                    )}
                    {group.adminIds.includes(member.clerkId) && 
                     member.clerkId !== group.createdBy && (
                      <Shield className="h-3 w-3 text-blue-500 ml-1" />
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {member.username || member.email}
                  </div>
                </div>
                
                {/* Member actions for admins */}
                {isAdmin && member.clerkId !== user?.id && (
                  <div className="relative">
                    <button
                      onClick={() => setShowMemberActions(
                        showMemberActions === member.clerkId ? null : member.clerkId
                      )}
                      className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    
                    {showMemberActions === member.clerkId && (
                      <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-900 rounded-md shadow-lg border dark:border-gray-800 z-10">
                        {/* Promote to admin (if not already an admin) */}
                        {!group.adminIds.includes(member.clerkId) && (
                          <button
                            onClick={() => handlePromoteToAdmin(member.clerkId)}
                            className="w-full p-2 text-left text-sm flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <Shield className="h-4 w-4 text-blue-500" />
                            <span>Make admin</span>
                          </button>
                        )}
                        
                        {/* Remove from group */}
                        <button
                          onClick={() => handleRemoveMember(member.clerkId)}
                          className="w-full p-2 text-left text-sm flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-red-500"
                        >
                          <UserMinus className="h-4 w-4" />
                          <span>Remove from group</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Leave group button */}
      {user && user.id !== group.createdBy && (
        <div className="p-4 border-t">
          <button
            onClick={handleLeaveGroup}
            className="w-full p-2 text-red-500 border border-red-200 dark:border-red-900 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center space-x-2"
          >
            <UserMinus className="h-4 w-4" />
            <span>Leave Group</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default GroupMembers;