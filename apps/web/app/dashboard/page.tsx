"use client";

import { useUser } from "../../hooks/useUser";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user, isLoading, isError } = useUser();
  const router = useRouter();

  const handleLogout = async () => {
    // Clear the auth cookie by setting it to expire
    document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-white mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">Failed to load user data</p>
          <button
            onClick={() => router.push("/login")}
            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:opacity-90 transition-opacity"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">Skyforge</span>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-8">
          <div className="flex items-center gap-6 mb-8">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-20 h-20 rounded-full border-2 border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Welcome back, {user.name}!
              </h1>
              <p className="text-slate-600 dark:text-slate-400">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Provider</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white capitalize">{user.provider}</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Member Since</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">
                {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">User ID</p>
              <p className="text-sm font-mono text-slate-900 dark:text-white truncate">{user.id}</p>
            </div>
          </div>

          <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Ready to build?
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Start designing your database schema with Skyforge's visual editor.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

