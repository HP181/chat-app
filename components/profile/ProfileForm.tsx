"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import FileUpload from "../ui/FileUpload";
import { Save, Loader2, User, AtSign, FileText, Camera } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";

const ProfileForm = () => {
  const { user } = useUser();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const userData = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const updateProfile = useMutation(api.users.updateProfile);

  useEffect(() => {
    if (userData) {
      setName(userData.name || "");
      setUsername(userData.username || "");
      setBio(userData.bio || "");
      setImageUrl(userData.imageUrl || "");
    }
  }, [userData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // Upload the image file to Clerk
      if (imageUrl && imageUrl !== user.imageUrl) {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], "profile.jpg", { type: blob.type });

        await user.setProfileImage({ file });
      }

      // Update Clerk name if changed
      if (name !== user.fullName) {
        const [firstName, ...rest] = name.split(" ");
        await user.update({
          firstName,
          lastName: rest.join(" "),
        });
      }

      // Update Convex profile
      await updateProfile({
        clerkId: user.id,
        name,
        username,
        bio,
        imageUrl,
      });

      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      console.error("Update error:", err);
      setMessage({ type: "error", text: "Failed to update profile. Try again." });
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  if (!user) return null;


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl overflow-hidden"
        >
          {/* Profile header with banner */}
          <div className="relative h-40 bg-gradient-to-r from-blue-600 to-indigo-600">
            <div className="absolute left-0 bottom-0 w-full p-6 pb-0">
              <div className="flex items-end">
                <div className="relative mr-4">
                  <div className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-700 shadow-lg">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={name || "User"}
                        width={96}
                        height={96}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-100 dark:bg-blue-900">
                        <User className="w-12 h-12 text-blue-600 dark:text-blue-300" />
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 p-1 bg-blue-600 rounded-full shadow-md">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="pb-5">
                  <h2 className="text-white font-bold text-2xl shadow-sm">
                    {name || "Your Profile"}
                  </h2>
                  {username && (
                    <p className="text-blue-200 flex items-center">
                      <AtSign className="w-3 h-3 mr-1" /> {username}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Form contents */}
          <form onSubmit={handleSubmit} className="p-6 pt-12 space-y-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-4">
              Edit Your Profile
            </h1>
            
            {/* Profile Picture Section */}
            <div className="p-5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
              <div className="flex flex-col md:flex-row md:items-center">
                <div className="md:w-1/3">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Profile Picture
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 md:mb-0">
                    Upload a photo to personalize your account
                  </p>
                </div>
                <div className="md:w-2/3">
                  <FileUpload
                    value={imageUrl}
                    onChange={setImageUrl}
                    endpoint="profile"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
            
            {/* Personal Information Section */}
            <div className="p-5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Personal Information
              </h3>
              
              {/* Name */}
              <div className="mb-4">
                <div className="flex flex-col md:flex-row md:items-center">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 md:w-1/3 mb-2 md:mb-0">
                    Full Name
                  </label>
                  <div className="md:w-2/3">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full py-2.5 pl-10 pr-3 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Username */}
              <div>
                <div className="flex flex-col md:flex-row md:items-center">
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 md:w-1/3 mb-2 md:mb-0">
                    Username
                  </label>
                  <div className="md:w-2/3">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <AtSign className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full py-2.5 pl-10 pr-3 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
                        disabled={isLoading}
                        placeholder="your_username"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      This will be used for @mentions and searching
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Bio Section */}
            <div className="p-5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/3 mb-4 md:mb-0">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Bio
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Tell others a little about yourself
                  </p>
                </div>
                <div className="md:w-2/3">
                  <div className="relative">
                    <div className="absolute left-3 top-3 flex items-start pointer-events-none">
                      <FileText className="h-5 w-5 text-gray-400" />
                    </div>
                    <textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full py-2.5 pl-10 pr-3 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 resize-none min-h-[120px]"
                      rows={4}
                      maxLength={160}
                      disabled={isLoading}
                      placeholder="Write a short bio..."
                    />
                  </div>
                  <div className="flex justify-end mt-1">
                    <p className={`text-xs ${bio.length > 140 ? 'text-orange-500' : 'text-gray-500'}`}>
                      {bio.length}/160 characters
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Submit and Message Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 flex flex-col items-center">
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[180px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    <span>Save Changes</span>
                  </>
                )}
              </motion.button>
              
              {/* Success/Error message */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ 
                  opacity: message.text ? 1 : 0,
                  y: message.text ? 0 : 10,
                  height: message.text ? 'auto' : 0
                }}
                className="w-full mt-4"
              >
                {message.text && (
                  <div
                    className={`p-4 rounded-lg ${
                      message.type === "success"
                        ? "bg-green-100 text-green-800 border border-green-200"
                        : "bg-red-100 text-red-800 border border-red-200"
                    }`}
                  >
                    {message.text}
                  </div>
                )}
              </motion.div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfileForm;