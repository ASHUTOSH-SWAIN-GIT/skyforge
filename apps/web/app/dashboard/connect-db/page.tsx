export default function ConnectDBPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Connect Database</h1>
        <p className="text-neutral-400 text-lg">Import schemas from your existing databases.</p>
      </div>

      <div className="max-w-2xl border border-neutral-800 rounded-xl bg-neutral-900/30 p-8 space-y-6">
        <div className="grid gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">Database Type</label>
            <div className="grid grid-cols-3 gap-4">
              {['PostgreSQL', 'MySQL', 'SQLite'].map((db) => (
                <button 
                  key={db}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border border-neutral-800 bg-black hover:bg-neutral-900 hover:border-neutral-600 transition-all focus:ring-2 focus:ring-white/20 focus:border-white"
                >
                  <span className="text-sm font-medium">{db}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">Connection String</label>
            <input 
              type="text" 
              placeholder="postgresql://user:password@localhost:5432/mydb"
              className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-all"
            />
          </div>

          <button className="w-full py-3 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors">
            Test Connection
          </button>
        </div>
      </div>
    </div>
  );
}

