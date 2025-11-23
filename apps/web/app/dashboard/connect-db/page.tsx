export default function ConnectDBPage() {
  return (
    <div className="space-y-8 text-mocha-text">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Connect Database</h1>
        <p className="text-mocha-subtext0 text-lg">Import schemas from your existing databases.</p>
      </div>

      <div className="max-w-2xl border border-mocha-surface0 rounded-xl bg-mocha-mantle/50 p-8 space-y-6">
        <div className="grid gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-mocha-subtext1">Database Type</label>
            <div className="grid grid-cols-3 gap-4">
              {['PostgreSQL', 'MySQL', 'SQLite'].map((db) => (
                <button 
                  key={db}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border border-mocha-surface0 bg-mocha-crust hover:bg-mocha-surface0 hover:border-mocha-surface1 transition-all focus:ring-2 focus:ring-mocha-mauve/20 focus:border-mocha-mauve"
                >
                  <span className="text-sm font-medium text-mocha-text">{db}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-mocha-subtext1">Connection String</label>
            <input 
              type="text" 
              placeholder="postgresql://user:password@localhost:5432/mydb"
              className="w-full bg-mocha-crust border border-mocha-surface0 rounded-lg px-4 py-3 text-sm text-mocha-text placeholder-mocha-overlay0 focus:outline-none focus:border-mocha-mauve focus:ring-1 focus:ring-mocha-mauve transition-all"
            />
          </div>

          <button className="w-full py-3 bg-mocha-mauve text-mocha-crust font-medium rounded-lg hover:bg-mocha-mauve/90 transition-colors">
            Test Connection
          </button>
        </div>
      </div>
    </div>
  );
}
