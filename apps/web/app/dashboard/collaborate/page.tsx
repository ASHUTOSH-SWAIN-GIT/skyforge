export default function CollaboratePage() {
  return (
    <div className="space-y-8 text-mocha-text">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Collaborate</h1>
        <p className="text-mocha-subtext0 text-lg">Invite team members and work together on your database projects.</p>
      </div>

      <div className="max-w-2xl border border-mocha-surface0 rounded-xl bg-mocha-mantle/50 p-8 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-mocha-text">Team Members</h2>
            <button className="px-4 py-2 bg-mocha-mauve text-mocha-crust font-medium rounded-lg hover:bg-mocha-mauve/90 transition-colors text-sm">
              Invite Member
            </button>
          </div>

          <div className="space-y-3">
            {/* Example Team Member */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-mocha-surface0 bg-mocha-crust hover:border-mocha-surface1 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-mocha-blue to-mocha-mauve flex items-center justify-center text-sm font-medium text-mocha-crust">
                  JD
                </div>
                <div>
                  <p className="text-sm font-medium text-mocha-text">John Doe</p>
                  <p className="text-xs text-mocha-subtext0">john@example.com</p>
                </div>
              </div>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-mocha-surface0 border border-mocha-surface1 text-mocha-subtext0">
                Owner
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
