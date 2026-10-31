import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useAdminDeliveryZones, useAdminDeliveryMutations } from "../../hooks/useAdminData";
import { formatPKR } from "../../components/customer/ProductCard";
import { EmptyState, Spinner } from "../../components/ui/Feedback";

export default function AdminDeliveryPage() {
  const { data: zones, isLoading } = useAdminDeliveryZones();
  const { create, update, remove } = useAdminDeliveryMutations();
  const [cityName, setCityName] = useState("");
  const [fee, setFee] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cityName.trim() || !fee) return;
    create.mutate({ city_name: cityName.trim(), fee: Number(fee) }, {
      onSuccess: () => { setCityName(""); setFee(""); },
    });
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-charcoal">Delivery Zones</h1>
      <p className="mt-1 text-sm text-charcoal/55">
        Set the delivery fee for each city. Existing orders keep the fee they were charged at checkout, even if you change it here.
      </p>

      <form onSubmit={handleSubmit} className="card-editorial mt-6 flex flex-wrap items-end gap-3 p-6">
        <div className="flex-1 min-w-[180px]">
          <label className="label-field">City Name</label>
          <input value={cityName} onChange={(e) => setCityName(e.target.value)} className="input-field" placeholder="e.g. Multan" />
        </div>
        <div className="w-40">
          <label className="label-field">Fee (PKR)</label>
          <input type="number" value={fee} onChange={(e) => setFee(e.target.value)} className="input-field" placeholder="2000" />
        </div>
        <button type="submit" className="btn-primary"><Plus size={16} /> Add Zone</button>
      </form>

      <div className="mt-6 card-editorial overflow-x-auto">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size={24} /></div>
        ) : zones && zones.length > 0 ? (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-charcoal/10 text-xs uppercase tracking-wide text-charcoal/45">
              <tr>
                <th className="px-5 py-3">City</th>
                <th className="px-5 py-3">Fee</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal/10">
              {zones.map((z) => (
                <tr key={z.id} className="hover:bg-sand-light/40">
                  <td className="px-5 py-3 font-medium text-charcoal">{z.city_name}</td>
                  <td className="px-5 py-3 text-charcoal">{formatPKR(z.fee)}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => update.mutate({ id: z.id, payload: { is_active: !z.is_active } })}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${z.is_active ? "bg-moss/10 text-moss" : "bg-charcoal/10 text-charcoal/50"}`}
                    >
                      {z.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => remove.mutate(z.id)} className="rounded-lg p-2 text-charcoal/60 hover:bg-sand-light hover:text-red-500">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState title="No delivery zones yet" description="Add a city to start calculating delivery charges." />
        )}
      </div>
    </div>
  );
}
