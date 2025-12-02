"use client";

import { useState } from "react";
import { createProject } from "../../lib/projects";
import { useRouter } from "next/navigation";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!isOpen) return null;

  const validateForm = () => {
    // Check for spaces in name
    if (/\s/.test(name)) {
      setError("Project name cannot contain spaces. Use hyphens or underscores instead.");
      return false;
    }

    // Check word count in description
    const wordCount = description.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount > 150) {
      setError(`Description must be 150 words or less. Current count: ${wordCount}`);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await createProject({ name, description, collaborators: [] });
      setName("");
      setDescription("");
      onSuccess?.();
      onClose();
      router.refresh();
    } catch {
      setError("Failed to create project. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md transform rounded-xl border border-mocha-surface0 bg-mocha-base p-6 shadow-2xl transition-all relative">
        <h2 className="text-xl font-semibold text-mocha-text mb-4">Create New Project</h2>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-mocha-red/10 border border-mocha-red/20 text-mocha-red text-sm flex items-start gap-2">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-mocha-subtext0 mb-1">
              Project Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              required
              className="w-full rounded-lg border border-mocha-surface0 bg-mocha-mantle px-4 py-2 text-mocha-text focus:border-mocha-mauve focus:outline-none transition-colors"
              placeholder="my-awesome-project"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-mocha-subtext0 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setError(null);
              }}
              rows={3}
              className="w-full rounded-lg border border-mocha-surface0 bg-mocha-mantle px-4 py-2 text-mocha-text focus:border-mocha-mauve focus:outline-none transition-colors resize-none"
              placeholder="Describe your project (max 150 words)..."
            />
            <p className="text-xs text-mocha-overlay0 mt-1 text-right">
              {description.trim().split(/\s+/).filter(Boolean).length}/150 words
            </p>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-mocha-subtext0 hover:bg-mocha-surface0 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-lg bg-mocha-mauve text-mocha-crust font-medium hover:bg-mocha-mauve/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

