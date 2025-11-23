export default function WorkspacePage() {
  return (
    <div className="space-y-8 text-mocha-text">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Workspace</h1>
        <p className="text-mocha-subtext0 text-lg">Manage your database projects and schemas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Create New Project Card */}
        <button className="group relative h-48 rounded-xl border border-mocha-surface0 bg-mocha-mantle/50 hover:border-mocha-mauve hover:bg-mocha-mantle transition-all duration-300 flex flex-col items-center justify-center gap-4">
          <div className="h-12 w-12 rounded-full bg-mocha-surface0 flex items-center justify-center group-hover:bg-mocha-mauve group-hover:text-mocha-crust transition-colors duration-300">
            <svg 
              className="w-6 h-6 text-mocha-subtext0 group-hover:text-mocha-crust transition-colors" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-sm font-medium text-mocha-subtext0 group-hover:text-mocha-text transition-colors">Create New Project</span>
        </button>

        {/* Example Project Card */}
        <div className="h-48 p-6 rounded-xl border border-mocha-surface0 bg-mocha-mantle hover:border-mocha-blue transition-colors flex flex-col justify-between group cursor-pointer">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-8 w-8 rounded bg-mocha-blue/20 flex items-center justify-center text-mocha-blue border border-mocha-blue/30">
                <span className="text-xs font-bold">E</span>
              </div>
              <span className="text-xs text-mocha-overlay0 font-mono">2h ago</span>
            </div>
            <h3 className="font-semibold text-lg text-mocha-text group-hover:text-mocha-blue transition-colors">E-commerce Schema</h3>
            <p className="text-sm text-mocha-subtext0 line-clamp-2">Main database design for the new store platform including users, orders, and inventory.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-mocha-overlay0">
            <span className="px-2 py-0.5 rounded-full bg-mocha-surface0 border border-mocha-surface1 text-mocha-subtext1">PostgreSQL</span>
            <span>•</span>
            <span>12 Tables</span>
          </div>
        </div>
      </div>
    </div>
  );
}
