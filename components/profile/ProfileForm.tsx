"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import FileUpload from "../ui/FileUpload";
import { Save, Loader2 } from "lucide-react";

const ProfileForm = () => {
  const { user } = useUser();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Get user data from Convex
  const userData = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Update profile mutation
  const updateProfile = useMutation(api.users.updateProfile);

  // Initialize form with user data
  useEffect(() => {
    if (userData) {
      setName(userData.name || "");
      setUsername(userData.username || "");
      setBio(userData.bio || "");
      setImageUrl(userData.imageUrl || "");
    }
  }, [userData]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setIsLoading(true);
    setMessage({ type: "", text: "" });
    
    try {
      // Update Convex profile
      await updateProfile({
        clerkId: user.id,
        name,
        username,
        bio,
        imageUrl,
      });
      
      // Update Clerk profile if name changed (imageUrl is handled separately)
      if (name !== user.fullName) {
        const nameParts = name.split(" ");
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
        
        await user.update({
          firstName,
          lastName,
        });
      }
      
      // Update profile image in Clerk if it changed
      // Note: Clerk has a separate method for updating images
      if (imageUrl !== user.imageUrl) {
        try {
          // Check if Clerk has a setProfileImage method
          if (user.setProfileImage) {
            await user.setProfileImage({ file: imageUrl });
          }
          // If no specific method is available, we keep the profile image
          // only in Convex. The Clerk UI will use our Convex data.
        } catch (imageError) {
          console.error("Error updating profile image:", imageError);
          // Continue, since the image is still updated in Convex
        }
      }
      
      setMessage({
        type: "success",
        text: "Profile updated successfully!",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({
        type: "error",
        text: "Failed to update profile. Please try again.",
      });
    } finally {
      setIsLoading(false);
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 3000);
    }
  };

  if (!user) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold">Edit Profile</h1>
      
      {/* Profile picture */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Profile Picture</label>
        <div className="max-w-xs">
          <FileUpload
            value={imageUrl}
            onChange={setImageUrl}
            endpoint="profile"
            disabled={isLoading}
          />
        </div>
      </div>
      
      {/* Name */}
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium">
          Full Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
          required
        />
      </div>
      
      {/* Username */}
      <div className="space-y-2">
        <label htmlFor="username" className="block text-sm font-medium">
          Username
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <p className="text-xs text-gray-500">
          This will be used for @mentions and searching.
        </p>
      </div>
      
      {/* Bio */}
      <div className="space-y-2">
        <label htmlFor="bio" className="block text-sm font-medium">
          Bio
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={4}
          maxLength={160}
          disabled={isLoading}
        />
        <p className="text-xs text-gray-500">
          {bio.length}/160 characters
        </p>
      </div>
      
      {/* Submit button */}
      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center space-x-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
      
      {/* Success/Error message */}
      {message.text && (
        <div
          className={`p-3 rounded-md ${
            message.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}
    </form>
  );
};

export default ProfileForm;