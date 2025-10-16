const SettingsPage = () => (
  <div className="space-y-8">
    <div className="rounded-3xl border border-white/10 bg-[#0f0f0f]/85 p-8">
      <h1 className="text-3xl font-semibold text-white">Settings</h1>
      <p className="mt-2 text-sm text-white/60">
        Manage billing defaults, notification preferences, and company branding.
      </p>
    </div>
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-3xl border border-white/10 bg-[#111]/80 p-6">
        <h2 className="text-xl font-semibold text-white">Branding</h2>
        <p className="mt-2 text-sm text-white/60">
          Update your logo, accent colors, and email templates to match Driftworks identity.
        </p>
      </div>
      <div className="rounded-3xl border border-white/10 bg-[#111]/80 p-6">
        <h2 className="text-xl font-semibold text-white">Integrations</h2>
        <p className="mt-2 text-sm text-white/60">
          Connect payment providers and analytics tools. Support for Stripe and QuickBooks is coming soon.
        </p>
      </div>
    </div>
  </div>
);

export default SettingsPage;