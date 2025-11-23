export default function CanvasPage() {
  return (
    <div className="h-[calc(100vh-8rem)] border border-neutral-800 rounded-xl bg-neutral-900/20 relative overflow-hidden flex flex-col items-center justify-center text-center p-8">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#333_1px,transparent_1px)] bg-[size:20px_20px]"></div>
      
      <div className="relative z-10 max-w-md space-y-6">
        <div className="h-16 w-16 bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto border border-neutral-700">
          <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Canvas Editor</h2>
          <p className="text-neutral-400">
            This is where your database design magic happens. Visualize tables, relationships, and queries.
          </p>
        </div>

        <button className="px-6 py-3 bg-white text-black font-medium rounded-full hover:bg-neutral-200 transition-colors">
          Open New Canvas
        </button>
      </div>
    </div>
  );
}

