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

export default function LoginPage() {
  const { login, isLoggingIn } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  return (
    <div className="container-editorial flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-display-md text-charcoal">Welcome Back</h1>
        <p className="mt-2 text-sm text-charcoal/60">Log in to view your orders and saved details.</p>

        <form onSubmit={handleSubmit((data) => login(data))} className="mt-8 space-y-4">
          <div>
            <label className="label-field">Email or Phone</label>
            <input {...register("identifier")} className="input-field" placeholder="you@example.com" />
            {errors.identifier && <p className="mt-1 text-xs text-red-600">{errors.identifier.message}</p>}
          </div>
          <div>
            <label className="label-field">Password</label>
            <input type="password" {...register("password")} className="input-field" placeholder="••••••••" />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
          </div>
          <button type="submit" disabled={isLoggingIn} className="btn-primary w-full">
            {isLoggingIn ? "Logging in..." : "Log In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-charcoal/60">
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold text-walnut hover:underline">Create one</Link>
        </p>
        <p className="mt-2 text-center text-sm text-charcoal/60">
          <Link to="/checkout" className="hover:underline">Continue as guest instead</Link>
        </p>
      </div>
    </div>
  );
}
