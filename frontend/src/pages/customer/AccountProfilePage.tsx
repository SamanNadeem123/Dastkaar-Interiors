import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/authStore";
import { useAuth } from "../../hooks/useAuth";
import { ordersApi } from "../../services/orders";
import { apiErrorMessage } from "../../services/api";
import type { Address } from "../../types";
import AccountTabs from "../../components/customer/AccountTabs";

export default function AccountProfilePage() {
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuth();
  const { register, handleSubmit, reset } = useForm<Address>();

  useEffect(() => {
    ordersApi.getDefaultAddress().then((address) => {
      if (address) reset(address);
    }).catch(() => {});
  }, [reset]);

  async function onSubmit(data: Address) {
    try {
      await ordersApi.saveAddress(data);
      toast.success("Address saved successfully");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <div className="container-editorial py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-display-md text-charcoal">My Account</h1>
        <button onClick={logout} className="btn-ghost text-sm">Logout</button>
      </div>
      <AccountTabs />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <section>
          <h2 className="font-display text-lg text-charcoal">Profile</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between border-b border-charcoal/10 pb-2">
              <dt className="text-charcoal/50">Full Name</dt><dd className="text-charcoal">{user?.full_name}</dd>
            </div>
            <div className="flex justify-between border-b border-charcoal/10 pb-2">
              <dt className="text-charcoal/50">Email</dt><dd className="text-charcoal">{user?.email}</dd>
            </div>
            <div className="flex justify-between border-b border-charcoal/10 pb-2">
              <dt className="text-charcoal/50">Phone</dt><dd className="text-charcoal">{user?.phone}</dd>
            </div>
          </dl>
        </section>

        <section>
          <h2 className="font-display text-lg text-charcoal">Saved Address</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <div>
              <label className="label-field">Full Name</label>
              <input {...register("full_name")} className="input-field" />
            </div>
            <div>
              <label className="label-field">Phone</label>
              <input {...register("phone")} className="input-field" />
            </div>
            <div>
              <label className="label-field">Address</label>
              <input {...register("address_line")} className="input-field" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-field">City</label>
                <input {...register("city")} className="input-field" />
              </div>
              <div>
                <label className="label-field">Postal Code</label>
                <input {...register("postal_code")} className="input-field" />
              </div>
            </div>
            <button type="submit" className="btn-secondary">Save Address</button>
          </form>
        </section>
      </div>

      <p className="mt-10 text-sm text-charcoal/50">
        Want to browse more pieces? <Link to="/products" className="text-walnut hover:underline">Continue shopping</Link>
      </p>
    </div>
  );
}
