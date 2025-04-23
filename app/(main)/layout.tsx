// app/(main)/layout.tsx
"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { 
  MessageSquare, 
  Users, 
  Settings, 
  User,
  Menu, 
  X,
  LogOut
} from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useClerk } from "@clerk/nextjs";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();
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
        imageUrl: user.imageUrl || "/default-avatar.png",
        preserveImage: true, // Add this line to preserve existing Convex image URLs
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
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  // If user is not logged in, redirect to sign-in
  if (!user) {
    router.push("/sign-in");
    return null;
  }

  // Get safe values with fallbacks
  const fullName = user.fullName || "User";
  const imageUrl = user.imageUrl || "/default-avatar.png";
  const email = user.emailAddresses && user.emailAddresses.length > 0 
    ? user.emailAddresses[0].emailAddress || "No email"
    : "No email";

  // Function to check if a link is active
  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Mobile sidebar toggle - only visible on mobile */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed z-30 bottom-6 right-6 p-4 bg-blue-600 text-white rounded-full shadow-lg md:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>
      )}

      {/* Sidebar - always visible on desktop, conditionally visible on mobile */}
      <aside
        className={`w-72 bg-gray-900 text-white h-full overflow-y-auto
                   ${isSidebarOpen ? 'fixed inset-0 z-40' : 'hidden'} 
                   md:relative md:block md:z-auto`}
      >
        <div className="h-full flex flex-col">
          {/* Close button (mobile only) */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors md:hidden"
          >
            <X className="h-5 w-5" />
          </button>

          {/* User profile */}
          <div className="p-5 border-b border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="relative w-12 h-12">
                <Image
                  src={imageUrl}
                  alt={fullName}
                  width={48}
                  height={48}
                  className="rounded-full object-cover"
                />
                <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold truncate">{fullName}</h2>
                <p className="text-sm text-gray-400 truncate">{email}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-3 space-y-1 flex-1">
            {[
              { href: "/", label: "Chats", icon: MessageSquare },
              { href: "/groups", label: "Groups", icon: Users },
              { href: "/profile", label: "Profile", icon: User },
              { href: "/settings", label: "Settings", icon: Settings },
            ].map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    active 
                    ? "bg-blue-600 text-white" 
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <Icon className={`h-5 w-5 ${active ? "text-white" : "text-gray-400"}`} />
                  <span>{item.label}</span>
                  {active && (
                    <div className="ml-auto h-2 w-2 rounded-full bg-white" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sign out button */}
          <div className="p-4 border-t border-gray-800">
            <button
              onClick={() => signOut(() => router.push("/sign-in"))}
              className="flex items-center justify-center space-x-2 w-full p-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {children}
      </main>

      {/* Overlay for mobile sidebar - only shown when sidebar is open on mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}