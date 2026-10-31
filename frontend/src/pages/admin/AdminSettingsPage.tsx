import { useEffect, useState } from "react";
import { useAdminSettings, useAdminSettingsMutations } from "../../hooks/useAdminData";
import { Spinner } from "../../components/ui/Feedback";
import type { StoreSettings } from "../../types";

const FIELDS: { key: keyof StoreSettings; label: string; type?: string }[] = [
  { key: "store_name", label: "Store Name" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email", type: "email" },
  { key: "whatsapp_number", label: "WhatsApp Number" },
  { key: "address", label: "Address" },
  { key: "opening_hours", label: "Opening Hours" },
  { key: "facebook_url", label: "Facebook URL" },
  { key: "instagram_url", label: "Instagram URL" },
  { key: "currency", label: "Currency" },
];

export default function AdminSettingsPage() {
  const { data: settings, isLoading } = useAdminSettings();
  const { update, uploadLogo } = useAdminSettingsMutations();
  const [form, setForm] = useState<Partial<StoreSettings>>({});

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    update.mutate(form);
  }

  if (isLoading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Spinner size={28} /></div>;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl text-charcoal">Store Settings</h1>
      <p className="mt-1 text-sm text-charcoal/55">
        These details power your navbar, footer, contact page, and WhatsApp buttons across the site.
      </p>

      <div className="card-editorial mt-6 p-6">
        <p className="label-field">Logo</p>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-card bg-sand-light">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt="Logo" className="h-full w-full object-contain" />
            ) : (
              <span className="font-display text-xs text-charcoal/40">No logo</span>
            )}
          </div>
          <label className="btn-secondary cursor-pointer">
            Change Logo
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadLogo.mutate(e.target.files[0])} />
          </label>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card-editorial mt-6 space-y-4 p-6">
        {FIELDS.map(({ key, label, type }) => (
          <div key={key}>
            <label className="label-field">{label}</label>
            <input
              type={type ?? "text"}
              value={(form[key] as string) ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
              className="input-field"
            />
          </div>
        ))}
        <button type="submit" disabled={update.isPending} className="btn-primary">
          {update.isPending ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </div>
  );
}
