"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "../../hooks/useUser";
import { LogOut, ChevronDown } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const [showLogout, setShowLogout] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  // Handle token from OAuth callback (production only)
  useEffect(() => {
    // Use window.location.search to avoid Suspense boundary requirement
    if (typeof window === "undefined") return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    if (token) {
      // Exchange token with backend and set cookie server-side (HttpOnly for security)
      fetch("/api/auth/set-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
        credentials: "include",
      })
        .then((res) => {
          if (res.ok) {
            // Remove token from URL and do a full page reload to clear SWR cache
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete("token");
            window.location.href = newUrl.pathname;
          } else {
            router.replace("/login");
          }
        })
        .catch(() => {
          router.replace("/login");
        });
    }
  }, [router]);
  
  // Check if we're on a canvas page - don't show header for canvas
  const isCanvasPage = pathname?.includes("/canvas/");

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowLogout(false);
      }
    };

    if (showLogout) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showLogout]);

  // Full page layout for canvas
  if (isCanvasPage) {
    return <div className="min-h-screen bg-mocha-base">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-mocha-base text-mocha-text font-sans antialiased">
      {/* Top Header */}
      <header className="h-16 border-b border-mocha-surface0 bg-mocha-mantle/80 backdrop-blur-sm fixed top-0 left-0 right-0 z-50">
        <div className="max-w-6xl mx-auto h-full px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-tight text-mocha-text">Skyforge</span>
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowLogout(!showLogout)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-mocha-surface0 transition-colors"
            >
              {(() => {
                const avatarUrlRaw = user?.avatar_url;
                let avatarUrl: string | null = null;
                
                if (avatarUrlRaw) {
                  if (typeof avatarUrlRaw === "string") {
                    avatarUrl = avatarUrlRaw;
                  } else if (typeof avatarUrlRaw === "object" && avatarUrlRaw !== null && "String" in avatarUrlRaw && "Valid" in avatarUrlRaw) {
                    const nullString = avatarUrlRaw as { String: string; Valid: boolean };
                    if (nullString.Valid && nullString.String) {
                      avatarUrl = nullString.String;
                    }
                  }
                }
                
                const hasAvatar = avatarUrl && avatarUrl.trim() !== "";
                
                if (hasAvatar) {
                  return (
                    <img
                      src={avatarUrl!}
                      alt={user?.name || "User"}
                      className="h-8 w-8 rounded-full border border-mocha-surface1 object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  );
                }
                return (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-mocha-surface1 to-mocha-surface0 flex items-center justify-center text-xs font-medium border border-mocha-surface1 text-mocha-text">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                );
              })()}
              <span className="text-sm font-medium text-mocha-text hidden sm:block">{user?.name || "User"}</span>
              <ChevronDown className={`w-4 h-4 text-mocha-overlay0 transition-transform ${showLogout ? "rotate-180" : ""}`} />
            </button>
            
            {/* Dropdown Menu */}
            {showLogout && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-mocha-mantle border border-mocha-surface0 rounded-lg shadow-xl py-1 z-50">
                <button 
                  onClick={async () => {
                    try {
                      await fetch("/api/auth/logout", {
                        method: "POST",
                        credentials: "include",
                      });
                      
                      if (typeof window !== 'undefined') {
                        localStorage.clear();
                        sessionStorage.clear();
                      }
                      
                      window.location.href = "/";
                    } catch {
                      document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                      window.location.href = "/";
                    }
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-mocha-subtext0 hover:text-mocha-red hover:bg-mocha-red/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pt-16 min-h-screen bg-mocha-base">
        <div className="max-w-6xl mx-auto p-6 lg:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
