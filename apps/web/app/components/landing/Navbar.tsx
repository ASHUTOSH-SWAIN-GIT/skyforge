import Link from 'next/link';
import { Button } from '@repo/ui/src/button'; // Assuming shared UI exists, otherwise I'll use standard HTML/Tailwind
// Actually I see @repo/ui in package.json, let's check its exports or just use standard tailwind for now to be safe and fast.
// The user said "professional", so custom styling is good.

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-mocha-surface0/20 bg-mocha-base/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-mocha-text tracking-tight">
              Skyforge
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link href="#features" className="text-mocha-subtext0 hover:text-mocha-text transition-colors px-3 py-2 rounded-md text-sm font-medium">
                Features
              </Link>
              <Link href="#how-it-works" className="text-mocha-subtext0 hover:text-mocha-text transition-colors px-3 py-2 rounded-md text-sm font-medium">
                How it Works
              </Link>
              <Link href="https://github.com/lowkeydev/skyforge" target="_blank" className="text-mocha-subtext0 hover:text-mocha-text transition-colors px-3 py-2 rounded-md text-sm font-medium">
                GitHub
              </Link>
            </div>
          </div>
          <div>
            <Link href="/login">
              <button className="bg-mocha-blue text-mocha-base hover:bg-mocha-sapphire transition-colors px-4 py-2 rounded-full text-sm font-bold shadow-lg shadow-mocha-blue/20">
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

