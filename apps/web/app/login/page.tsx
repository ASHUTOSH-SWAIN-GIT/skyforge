import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full font-sans bg-mocha-base">
      {/* Left Panel - Abstract Visuals */}
      <div className="relative flex-1 hidden md:flex flex-col justify-center items-center bg-mocha-crust text-mocha-text overflow-hidden p-8">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_50%_50%,var(--color-mocha-surface0)_0%,var(--color-mocha-crust)_70%)] z-10" />
        <div className="absolute inset-0 opacity-20 z-10 bg-[radial-gradient(var(--color-mocha-surface1)_1px,transparent_1px),radial-gradient(var(--color-mocha-surface1)_1px,transparent_1px)] bg-[size:50px_50px] bg-[position:0_0,25px_25px]" />
        
        <div className="relative z-20 text-center max-w-[80%]">
          <h1 className="text-4xl font-semibold leading-tight mb-4 text-mocha-text">
            Design your database at the speed of thought.
          </h1>
          <p className="text-lg text-mocha-subtext0">
            Visualize, iterate, and build with Skyforge.
          </p>
        </div>
      </div>

      {/* Right Panel - Login Card */}
      <div className="flex-1 flex flex-col justify-center items-center bg-mocha-base text-mocha-text p-8">
        <div className="w-full max-w-[400px] p-12 rounded-2xl border border-mocha-surface0 shadow-lg flex flex-col items-center bg-mocha-mantle backdrop-blur-sm">
          <div className="text-2xl font-bold mb-8 tracking-tighter text-mocha-text">Skyforge</div>
          <h2 className="text-2xl font-semibold mb-8 text-center text-mocha-text">Welcome to Skyforge</h2>

          <a 
            href="http://localhost:8080/auth/google/login" 
            className="flex items-center justify-center w-full p-3 gap-3 border border-mocha-surface0 rounded-xl bg-mocha-surface0 text-mocha-text text-base font-medium transition-all hover:bg-mocha-surface1 hover:border-mocha-mauve/50 hover:-translate-y-px active:translate-y-0 shadow-sm"
          >
            <GoogleIcon />
            Continue with Google
          </a>

          <p className="mt-8 text-xs text-mocha-overlay0 text-center">
            By continuing, you agree to our Terms of Service.
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M23.52 12.29C23.52 11.43 23.43 10.71 23.29 10H12V14.51H18.46C18.18 15.99 17.34 17.25 16.08 18.1L19.95 21.1C22.21 19.01 23.52 15.92 23.52 12.29Z"
        fill="#4285F4"
      />
      <path
        d="M12 24C15.24 24 17.96 22.93 19.95 21.1L16.08 18.1C15 18.82 13.62 19.25 12 19.25C8.87 19.25 6.22 17.14 5.27 14.29L1.27 17.38C3.26 21.34 7.31 24 12 24Z"
        fill="#34A853"
      />
      <path
        d="M5.27 14.29C5.03 13.57 4.9 12.8 4.9 12C4.9 11.2 5.03 10.43 5.27 9.71L1.27 6.62C0.46 8.22 0 10.06 0 12C0 13.94 0.46 15.78 1.27 17.38L5.27 14.29Z"
        fill="#FBBC05"
      />
      <path
        d="M12 4.75C13.76 4.75 15.34 5.36 16.58 6.55L20.04 3.09C17.96 1.15 15.24 0 12 0C7.31 0 3.26 2.66 1.27 6.62L5.27 9.71C6.22 6.86 8.87 4.75 12 4.75Z"
        fill="#EA4335"
      />
    </svg>
  );
}
