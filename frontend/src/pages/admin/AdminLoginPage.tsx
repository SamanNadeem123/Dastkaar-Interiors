import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const schema = z.object({
  identifier: z.string().min(3, "Enter your email or phone"),
  password: z.string().min(1, "Password is required"),
});
type FormData = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const { login, isLoggingIn } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  return (
    <div className="flex min-h-screen items-center justify-center bg-charcoal px-6">
      <div className="w-full max-w-sm">
        <p className="text-center font-display text-lg text-ivory-100">
          NA <span className="text-brass-light">Furniture Valley</span>
        </p>
        <h1 className="mt-6 text-center font-display text-2xl text-ivory-100">Admin Sign In</h1>
        <p className="mt-2 text-center text-sm text-ivory-200/60">Manage products, orders, and your store.</p>

        <form onSubmit={handleSubmit((data) => login(data))} className="mt-8 space-y-4 rounded-card border border-ivory-200/10 bg-charcoal-light p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ivory-200/80">Email or Phone</label>
            <input
              {...register("identifier")}
              className="w-full rounded-card border border-ivory-200/20 bg-charcoal px-4 py-3 text-sm text-ivory-100 placeholder:text-ivory-200/30 focus:border-brass focus:outline-none"
              placeholder="admin@nafurniturevalley.dev"
            />
            {errors.identifier && <p className="mt-1 text-xs text-red-400">{errors.identifier.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ivory-200/80">Password</label>
            <input
              type="password"
              {...register("password")}
              className="w-full rounded-card border border-ivory-200/20 bg-charcoal px-4 py-3 text-sm text-ivory-100 placeholder:text-ivory-200/30 focus:border-brass focus:outline-none"
              placeholder="••••••••"
            />
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
          </div>
          <button type="submit" disabled={isLoggingIn} className="btn-primary w-full">
            {isLoggingIn ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ivory-200/50">
          First time setting up? <Link to="/admin/signup" className="font-semibold text-brass-light hover:underline">Create an admin account</Link>
        </p>
        <p className="mt-2 text-center text-sm text-ivory-200/40">
          <Link to="/" className="hover:underline">Back to storefront</Link>
        </p>
      </div>
    </div>
  );
}
