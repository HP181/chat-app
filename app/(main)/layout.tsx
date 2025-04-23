"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { 
  MessageSquare, 
  Users, 
  Settings, 
  User as UserIcon,
  Menu, 
  X,
  LogOut
} from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useClerk } from "@clerk/nextjs";

// Default avatar image that exists in your public directory
const DEFAULT_AVATAR = "/default-avatar.jpg"; // Make sure this file exists

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  const { signOut } = useClerk();
  
  // Get user data in Convex
  const createOrUpdateUser = useMutation(api.users.createOrUpdateUser);
  const updateLastSeen = useMutation(api.users.updateLastSeen);

  // Sync user data with Convex when loaded
  useEffect(() => {
    if (isUserLoaded && user) {
      // Use optional chaining and provide fallbacks for all values
      const primaryEmail = user.emailAddresses && user.emailAddresses.length > 0 
        ? user.emailAddresses[0].emailAddress || "" 
        : "";
        
      createOrUpdateUser({
        clerkId: user.id,
        email: primaryEmail,
        name: user.fullName || "",
        imageUrl: user.imageUrl || DEFAULT_AVATAR,
      });
      
      // Update last seen timestamp
      updateLastSeen({ clerkId: user.id });
      
      // Set up interval to update last seen status
      const interval = setInterval(() => {
        updateLastSeen({ clerkId: user.id });
      }, 60000); // Every minute
      
      return () => clearInterval(interval);
    }
  }, [isUserLoaded, user, createOrUpdateUser, updateLastSeen]);

  // If user is not loaded, show loading spinner
  if (!isUserLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  // If user is not logged in, redirect to sign-in
  if (!user) {
    router.push("/sign-in");
    return null;
  }

  // Render the user avatar - this function handles undefined/null image URLs safely
  const renderUserAvatar = () => {
    // Check if we have a valid image URL
    if (user.imageUrl && typeof user.imageUrl === 'string' && user.imageUrl.trim() !== '') {
      return (
        <Image
          src={user.imageUrl}
          alt={user.fullName || "User"}
          width={40}
          height={40}
          className="rounded-full"
        />
      );
    } else {
      // Fallback to a default avatar icon if no valid URL
      return (
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
          <UserIcon className="h-6 w-6 text-blue-500" />
        </div>
      );
    }
  };

  return (
    <div className="h-screen flex">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="fixed z-20 bottom-4 right-4 p-3 bg-blue-500 text-white rounded-full shadow-lg md:hidden"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Sidebar - responsive */}
      <aside
        className={`fixed inset-y-0 left-0 z-10 w-64 bg-white dark:bg-gray-900 border-r transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0`}
      >
        {/* Close button (mobile only) */}
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden"
        >
          <X className="h-5 w-5" />
        </button>

        {/* User profile */}
        <div className="p-4 border-b">
          <div className="flex items-center space-x-3">
            {renderUserAvatar()}
            <div>
              <h2 className="font-semibold">{user.fullName || "User"}</h2>
              <p className="text-sm text-gray-500 truncate max-w-[180px]">
                {user.emailAddresses && user.emailAddresses.length > 0 
                  ? user.emailAddresses[0].emailAddress 
                  : "No email"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-2 space-y-1">
          <Link
            href="/"
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setIsSidebarOpen(false)}
          >
            <MessageSquare className="h-5 w-5" />
            <span>Chats</span>
          </Link>
          <Link
            href="/groups"
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setIsSidebarOpen(false)}
          >
            <Users className="h-5 w-5" />
            <span>Groups</span>
          </Link>
          <Link
            href="/profile"
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setIsSidebarOpen(false)}
          >
            <UserIcon className="h-5 w-5" />
            <span>Profile</span>
          </Link>
          <Link
            href="/settings"
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setIsSidebarOpen(false)}
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </Link>
        </nav>

        {/* Sign out button */}
        <div className="absolute bottom-0 w-full p-4 border-t">
          <button
            onClick={() => signOut(() => router.push("/sign-in"))}
            className="flex items-center space-x-2 w-full p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {children}
      </main>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-0 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}