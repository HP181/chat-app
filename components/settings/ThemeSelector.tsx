"use client";

import { useState } from "react";
import { Check, Moon, Sun, Laptop, Palette } from "lucide-react";
import { useThemeContext, THEMES, Theme } from "../Providers/ThemeProvider";

const THEME_DETAILS = {
  light: {
    name: "Light",
    icon: Sun,
    description: "Classic light mode with white background and dark text.",
    color: "bg-white",
  },
  dark: {
    name: "Dark",
    icon: Moon,
    description: "Easy on the eyes dark theme for nighttime use.",
    color: "bg-gray-900",
  },
  system: {
    name: "System",
    icon: Laptop,
    description: "Follows your device's theme setting.",
    color: "bg-gradient-to-r from-white to-gray-900",
  },
  forest: {
    name: "Forest",
    icon: Palette,
    description: "Calming green tones inspired by nature.",
    color: "bg-green-700",
  },
  ocean: {
    name: "Ocean",
    icon: Palette,
    description: "Refreshing blue theme reminiscent of the sea.",
    color: "bg-blue-700",
  },
  sunset: {
    name: "Sunset",
    icon: Palette,
    description: "Warm orange and pink gradient theme.",
    color: "bg-gradient-to-r from-orange-500 to-pink-500",
  },
  galaxy: {
    name: "Galaxy",
    icon: Palette,
    description: "Dark purple and blue with star-like accents.",
    color: "bg-gradient-to-r from-purple-900 to-blue-900",
  },
};

const ThemeSelector = () => {
  const { theme, setTheme, isLoaded } = useThemeContext();
  const [isOpen, setIsOpen] = useState(false);

  if (!isLoaded) {
    return (
      <div className="flex items-center space-x-2 animate-pulse">
        <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        {(() => {
          const currentTheme = THEME_DETAILS[theme as Theme];
          const Icon = currentTheme?.icon || Sun;
          return (
            <>
              <div className={`w-6 h-6 rounded-full flex-shrink-0 ${currentTheme?.color}`} />
              <span className="font-medium">{currentTheme?.name || "Theme"}</span>
            </>
          );
        })()}
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-2 w-72 p-2 bg-white dark:bg-gray-900 rounded-lg shadow-lg border dark:border-gray-800">
          <div className="space-y-1">
            {Object.entries(THEMES).map(([key]) => {
              const themeKey = key as Theme;
              const themeInfo = THEME_DETAILS[themeKey];
              const Icon = themeInfo?.icon || Palette;
              const isActive = theme === themeKey;

              return (
                <button
                  key={themeKey}
                  onClick={() => {
                    setTheme(themeKey);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 p-2 rounded-md transition-colors ${
                    isActive
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 ${themeInfo?.color}`} />
                  <div className="flex-grow text-left">
                    <div className="font-medium">{themeInfo?.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {themeInfo?.description}
                    </div>
                  </div>
                  {isActive && <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;