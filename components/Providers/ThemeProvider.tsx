"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";

// Define available themes
export const THEMES = {
  light: "light",
  dark: "dark",
  system: "system",
  forest: "forest",
  ocean: "ocean",
  sunset: "sunset",
  galaxy: "galaxy",
  // Add more themes as needed
};

export type Theme = keyof typeof THEMES;

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isLoaded: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  setTheme: () => {},
  isLoaded: false,
});

export const useThemeContext = () => useContext(ThemeContext);

// Inner provider that uses useTheme from next-themes
function ThemeContextProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [isLoaded, setIsLoaded] = useState(false);
  const { theme: nextTheme, setTheme: setNextTheme } = useTheme();
  
  const updateThemePreference = useMutation(api.users.updateThemePreference);
  
  const userTheme = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Set the theme when user data loads
  useEffect(() => {
    if (isUserLoaded && userTheme && userTheme.themePreference) {
      setNextTheme(userTheme.themePreference);
      setIsLoaded(true);
    } else if (isUserLoaded && !user) {
      // If user is not logged in, default to system
      setIsLoaded(true);
    }
  }, [isUserLoaded, userTheme, user, setNextTheme]);

  // Function to set theme and persist to user preferences
  const setTheme = (newTheme: Theme) => {
    setNextTheme(newTheme);
    
    // Persist theme preference to database if user is logged in
    if (user?.id) {
      updateThemePreference({
        clerkId: user.id,
        themePreference: newTheme,
      });
    }
  };

  return (
    <ThemeContext.Provider 
      value={{ 
        theme: (nextTheme as Theme) || "system", 
        setTheme, 
        isLoaded 
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// Main provider that sets up next-themes
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      value={{
        light: "light-theme",
        dark: "dark-theme",
        system: "system-theme",
        forest: "forest-theme",
        ocean: "ocean-theme",
        sunset: "sunset-theme",
        galaxy: "galaxy-theme",
      }}
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ThemeContextProvider>{children}</ThemeContextProvider>
    </NextThemesProvider>
  );
}