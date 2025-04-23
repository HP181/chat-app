"use client";

import { useState } from "react";
import { ArrowLeft, Moon, Sun, Monitor, Check, PaintBucket } from "lucide-react";
import { useRouter } from "next/navigation";
import { Theme, useThemeContext } from "@/components/Providers/ThemeProvider";

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("appearance");
  const { theme, setTheme } = useThemeContext();
  const [selectedBackground, setSelectedBackground] = useState("bg-white");

  // Theme options with details
  const themes = [
    {
      id: "light",
      name: "Light Mode",
      icon: Sun,
      description: "Bright and clean interface with light colors",
      preview: "bg-gradient-to-r from-white to-gray-100",
    },
    {
      id: "dark",
      name: "Dark Mode",
      icon: Moon,
      description: "Easy on the eyes with a dark color scheme",
      preview: "bg-gradient-to-r from-gray-900 to-gray-800",
    },
    {
      id: "system",
      name: "System Preference",
      icon: Monitor,
      description: "Follows your device's theme setting",
      preview: "bg-gradient-to-r from-gray-100 to-gray-800",
    },
    {
      id: "forest",
      name: "Forest Theme",
      icon: PaintBucket,
      description: "Calming green tones inspired by nature",
      preview: "bg-gradient-to-r from-green-800 to-green-600",
    },
    {
      id: "ocean",
      name: "Ocean Theme",
      icon: PaintBucket,
      description: "Cool blue colors reminiscent of the sea",
      preview: "bg-gradient-to-r from-blue-700 to-blue-500",
    },
    {
      id: "sunset",
      name: "Sunset Theme",
      icon: PaintBucket,
      description: "Warm orange and pink gradient",
      preview: "bg-gradient-to-r from-orange-500 to-pink-500",
    },
    {
      id: "galaxy",
      name: "Galaxy Theme",
      icon: PaintBucket,
      description: "Deep purples and blues with a space vibe",
      preview: "bg-gradient-to-r from-purple-900 to-indigo-700",
    },
  ];

  // Chat background options with preview and color
  const chatBackgrounds = [
    { name: "Default White", class: "bg-white dark:bg-gray-900", border: "border border-gray-200 dark:border-gray-700" },
    { name: "Light Gray", class: "bg-gray-100 dark:bg-gray-800", border: "border border-gray-200 dark:border-gray-700" },
    { name: "Soft Blue", class: "bg-blue-50 dark:bg-blue-900/30", border: "border border-blue-200 dark:border-blue-800" },
    { name: "Nature Green", class: "bg-green-50 dark:bg-green-900/30", border: "border border-green-200 dark:border-green-800" },
    { name: "Lavender", class: "bg-purple-50 dark:bg-purple-900/30", border: "border border-purple-200 dark:border-purple-800" },
    { name: "Warm Beige", class: "bg-amber-50 dark:bg-amber-900/30", border: "border border-amber-200 dark:border-amber-800" },
    { name: "Cool Mint", class: "bg-emerald-50 dark:bg-emerald-900/30", border: "border border-emerald-200 dark:border-emerald-800" },
    { name: "Soft Coral", class: "bg-red-50 dark:bg-red-900/20", border: "border border-red-200 dark:border-red-800" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center p-4 border-b">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 mr-2 md:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">Settings</h1>
      </header>
      
      {/* Settings content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r border-gray-200 dark:border-gray-800 p-4 hidden md:block">
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab("appearance")}
              className={`w-full p-2 text-left rounded-md ${
                activeTab === "appearance"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              Appearance
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`w-full p-2 text-left rounded-md ${
                activeTab === "notifications"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              Notifications
            </button>
            <button
              onClick={() => setActiveTab("privacy")}
              className={`w-full p-2 text-left rounded-md ${
                activeTab === "privacy"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              Privacy & Security
            </button>
            <button
              onClick={() => setActiveTab("about")}
              className={`w-full p-2 text-left rounded-md ${
                activeTab === "about"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              About
            </button>
          </div>
        </div>
        
        {/* Mobile tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 md:hidden">
          <button
            onClick={() => setActiveTab("appearance")}
            className={`flex-1 py-2 text-center ${
              activeTab === "appearance"
                ? "text-blue-500 border-b-2 border-blue-500"
                : ""
            }`}
          >
            Appearance
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`flex-1 py-2 text-center ${
              activeTab === "notifications"
                ? "text-blue-500 border-b-2 border-blue-500"
                : ""
            }`}
          >
            Notifications
          </button>
          <button
            onClick={() => setActiveTab("privacy")}
            className={`flex-1 py-2 text-center ${
              activeTab === "privacy"
                ? "text-blue-500 border-b-2 border-blue-500"
                : ""
            }`}
          >
            Privacy
          </button>
        </div>
        
        {/* Main content area */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "appearance" && (
            <div className="space-y-8">
              {/* Theme Selection */}
              <div>
                <h2 className="text-lg font-semibold mb-2">Theme</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Choose your preferred theme for the application.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  {themes.map((themeOption) => {
                    const isActive = theme === themeOption.id;
                    
                    return (
                      <button
                      key={themeOption.id}
                      onClick={() => setTheme(themeOption.id as Theme)}
                      className={`flex items-start p-3 rounded-lg border transition-all ${
                        isActive 
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                          : "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                        <div className={`${themeOption.preview} w-12 h-12 rounded-md mr-3 flex-shrink-0`}></div>
                        <div className="flex-grow text-left">
                          <div className="flex items-center">
                            <span className="font-medium">{themeOption.name}</span>
                            {isActive && <Check className="h-4 w-4 text-blue-500 ml-2" />}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{themeOption.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Font Size */}
              <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
                <h2 className="text-lg font-semibold mb-2">Font Size</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Adjust the font size of the application.
                </p>
                <div className="flex items-center space-x-4 mt-4">
                  <span className="text-sm">Small</span>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="1"
                    defaultValue="2"
                    className="w-full max-w-xs accent-blue-500"
                  />
                  <span className="text-lg">Large</span>
                </div>
              </div>
              
              {/* Chat Background */}
              <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
                <h2 className="text-lg font-semibold mb-2">Chat Background</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Choose a background for your chat conversations.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  {chatBackgrounds.map((bg, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedBackground(bg.class)}
                      className={`aspect-square rounded-md ${bg.class} ${bg.border} hover:opacity-90 transition-opacity ${
                        selectedBackground === bg.class ? "ring-2 ring-blue-500" : ""
                      }`}
                    >
                      {selectedBackground === bg.class && (
                        <div className="flex items-center justify-center h-full">
                          <Check className="h-5 w-5 text-blue-500" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Background colors will adjust automatically based on your theme preference.
                </p>
              </div>
              
              {/* Animation Settings */}
              <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
                <h2 className="text-lg font-semibold mb-2">Animation & Effects</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Control animation effects throughout the application.
                </p>
                
                <div className="space-y-3 mt-4">
                  <div className="flex items-center justify-between">
                    <label className="flex-1">Enable animations</label>
                    <div className="flex-none">
                      <input type="checkbox" defaultChecked className="mr-2 accent-blue-500" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="flex-1">Reduced motion</label>
                    <div className="flex-none">
                      <input type="checkbox" className="mr-2 accent-blue-500" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="flex-1">Message transitions</label>
                    <div className="flex-none">
                      <input type="checkbox" defaultChecked className="mr-2 accent-blue-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold mb-2">Notification Settings</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Control how and when you receive notifications.
              </p>
              
              <div className="space-y-4 mt-4">
                <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Message notifications</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when you receive a direct message</p>
                  </div>
                  <div className="flex-none">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
                
                <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Group message notifications</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Get notified about new messages in group chats</p>
                  </div>
                  <div className="flex-none">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
                
                <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">New member notifications</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when someone joins a group you&apos;re in</p>
                  </div>
                  <div className="flex-none">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
                
                <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Sound effects</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Play sounds for message notifications</p>
                  </div>
                  <div className="flex-none">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === "privacy" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold mb-2">Privacy & Security</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Manage your privacy and security settings.
              </p>
              
              <div className="space-y-4 mt-4">
                <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Show online status</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Let others see when you&apos;re online</p>
                  </div>
                  <div className="flex-none">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
                
                <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Show read receipts</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Let others know when you&apos;ve read their messages</p>
                  </div>
                  <div className="flex-none">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
                
                <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Show typing indicators</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Let others see when you&apos;re typing</p>
                  </div>
                  <div className="flex-none">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-800 pt-6 mt-6">
                <h3 className="font-semibold mb-2">Data & Storage</h3>
                <div className="mt-4 space-y-3">
                  <button
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                  >
                    Clear All Chat History
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    This will permanently delete all your message history. This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === "about" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold mb-2">About</h2>
              
              <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                <h3 className="text-xl font-bold mb-1">Chat App</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Version 1.0.0</p>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  A real-time messaging platform built with modern web technologies.
                </p>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs">Next.js</div>
                  <div className="bg-indigo-500 text-white px-2 py-1 rounded text-xs">Convex</div>
                  <div className="bg-green-500 text-white px-2 py-1 rounded text-xs">Clerk</div>
                  <div className="bg-orange-500 text-white px-2 py-1 rounded text-xs">Cloudinary</div>
                </div>
              </div>
              
              <div className="pt-4">
                <h3 className="font-semibold mb-2">Technologies Used</h3>
                <ul className="space-y-3 mt-3">
                  <li className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current"><path d="M11.572 0c-.176 0-.31.001-.358.007a19.76 19.76 0 0 1-.364.033C7.443.346 4.25 2.185 2.228 5.012a11.875 11.875 0 0 0-2.119 5.243c-.096.659-.108.854-.108 1.747s.012 1.089.108 1.748c.652 4.506 3.86 8.292 8.209 9.695.779.25 1.6.422 2.534.525.363.04 1.935.04 2.299 0 1.611-.178 2.977-.577 4.323-1.264.207-.106.247-.134.219-.158-.02-.013-.9-1.193-1.955-2.62l-1.919-2.592-2.404-3.558a338.739 338.739 0 0 0-2.422-3.556c-.009-.002-.018 1.579-.023 3.51-.007 3.38-.01 3.515-.052 3.595a.426.426 0 0 1-.206.214c-.075.037-.14.044-.495.044H7.81l-.108-.068a.438.438 0 0 1-.157-.171l-.05-.106.006-4.703.007-4.705.072-.092a.645.645 0 0 1 .174-.143c.096-.047.134-.051.54-.051.478 0 .558.018.682.154.035.038 1.337 1.999 2.895 4.361a10760.433 10760.433 0 0 0 4.735 7.17l1.9 2.879.096-.063a12.317 12.317 0 0 0 2.466-2.163 11.944 11.944 0 0 0 2.824-6.134c.096-.66.108-.854.108-1.748 0-.893-.012-1.088-.108-1.747-.652-4.506-3.859-8.292-8.208-9.695a12.597 12.597 0 0 0-2.499-.523A33.119 33.119 0 0 0 11.573 0zm4.069 7.217c.347 0 .408.005.486.047a.473.473 0 0 1 .237.277c.018.06.023 1.365.018 4.304l-.006 4.218-.744-1.14-.746-1.14v-3.066c0-1.982.01-3.097.023-3.15a.478.478 0 0 1 .233-.296c.096-.05.13-.054.5-.054z" /></svg>
                    </div>
                    <div>
                      <div className="font-medium">Next.js</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">React framework for production</div>
                    </div>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current"><path d="M12 1.5C6.21 1.5 1.5 6.21 1.5 12S6.21 22.5 12 22.5 22.5 17.79 22.5 12 17.79 1.5 12 1.5zM9.65 17.4c-.3.28-.7.28-1 0-.28-.3-.28-.7 0-1l4.75-4.75c.3-.28.7-.28 1 0 .28.3.28.7 0 1L9.65 17.4zm.15-8.42c0-.38.3-.68.68-.68h3.04c.38 0 .68.3.68.68 0 .38-.3.68-.68.68H10.48c-.38 0-.68-.3-.68-.68z" /></svg>
                    </div>
                    <div>
                      <div className="font-medium">Convex</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Real-time backend as a service</div>
                    </div>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current"><path d="M22.1 11.5c0-4.3-3.4-7.8-7.7-7.8s-7.8 3.4-7.8 7.8c0 1.8.7 3.5 1.8 4.9l-1.8 1.8c-.6.6-.2 1.7.7 1.7h7.1c4.2 0 7.7-3.5 7.7-7.8v-.6zm-7.8 6.6h-5.8c-.5 0-.7-.6-.2-.8 1-.7 2-1.5 2.9-2.4.2-.2.3-.5.3-.8v-7.6c0-.6.5-1.1 1.1-1.1h1.7c.6 0 1.1.5 1.1 1.1v10.5c0 .6-.5 1.1-1.1 1.1zm-11-14.5c0 .4-.3.7-.7.7-.4 0-.7-.3-.7-.7v-1.8c0-.4.3-.7.7-.7.4 0 .7.3.7.7v1.8zm-1.4 0c0 .4-.3.7-.7.7-.4 0-.7-.3-.7-.7v-1.8c0-.4.3-.7.7-.7.4 0 .7.3.7.7v1.8zm-1.4 0c0 .4-.3.7-.7.7-.4 0-.7-.3-.7-.7v-1.8c0-.4.3-.7.7-.7.4 0 .7.3.7.7v1.8z" /></svg>
                    </div>
                    <div>
                      <div className="font-medium">Clerk</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Authentication and user management</div>
                    </div>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current"><path d="M4.4 4.9c-.3-.3-.7-.4-1.1-.4-.8 0-1.4.6-1.4 1.4 0 .4.2.8.4 1.1.3.3.7.4 1.1.4.8 0 1.4-.6 1.4-1.4-.1-.4-.2-.8-.4-1.1zm4.9 3.8l-1.1-1.1c-.2-.2-.4-.3-.7-.3-.3 0-.5.1-.7.3l-1.1 1.1c-.2.2-.3.4-.3.7 0 .3.1.5.3.7l1.1 1.1c.2.2.4.3.7.3.3 0 .5-.1.7-.3l1.1-1.1c.2-.2.3-.4.3-.7 0-.3-.1-.5-.3-.7zm8.1-3.8c-.3-.3-.7-.4-1.1-.4-.8 0-1.4.6-1.4 1.4 0 .4.2.8.4 1.1.3.3.7.4 1.1.4.8 0 1.4-.6 1.4-1.4 0-.4-.1-.8-.4-1.1zm-4.3 3.8c-.2-.2-.4-.3-.7-.3-.3 0-.5.1-.7.3l-1.1 1.1c-.2.2-.3.4-.3.7 0 .3.1.5.3.7l1.1 1.1c.2.2.4.3.7.3.3 0 .5-.1.7-.3l1.1-1.1c.2-.2.3-.4.3-.7 0-.3-.1-.5-.3-.7l-1.1-1.1zm-3.8 8.1c-.3-.3-.7-.4-1.1-.4-.8 0-1.4.6-1.4 1.4 0 .4.2.8.4 1.1.3.3.7.4 1.1.4.8 0 1.4-.6 1.4-1.4.1-.4-.1-.8-.4-1.1zm8.1 0c-.3-.3-.7-.4-1.1-.4-.8 0-1.4.6-1.4 1.4 0 .4.2.8.4 1.1.3.3.7.4 1.1.4.8 0 1.4-.6 1.4-1.4 0-.4-.1-.8-.4-1.1zm-3.8-4.2c-.2-.2-.4-.3-.7-.3-.3 0-.5.1-.7.3l-1.1 1.1c-.2.2-.3.4-.3.7 0 .3.1.5.3.7l1.1 1.1c.2.2.4.3.7.3.3 0 .5-.1.7-.3l1.1-1.1c.2-.2.3-.4.3-.7 0-.3-.1-.5-.3-.7l-1.1-1.1z" /></svg>
                    </div>
                    <div>
                      <div className="font-medium">Cloudinary</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Media storage and optimization</div>
                    </div>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current"><path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.337 6.182 14.976 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.337 13.382 8.976 12 6.001 12z" /></svg>
                    </div>
                    <div>
                      <div className="font-medium">Tailwind CSS</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Utility-first CSS framework</div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}