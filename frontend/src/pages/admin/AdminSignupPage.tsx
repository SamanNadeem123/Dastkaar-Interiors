import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const schema = z
  .object({
    full_name: z.string().min(2, "Enter your full name"),
    email: z.string().email("Enter a valid email"),
    phone: z.string().min(7, "Enter a valid phone number"),
    password: z.string().min(8, "At least 8 characters"),
    confirm_password: z.string(),
    admin_signup_key: z.string().min(1, "Admin signup key is required"),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });
type FormData = z.infer<typeof schema>;

export default function AdminSignupPage() {
  const { adminSignup, isAdminSigningUp } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  return (
    <div className="flex min-h-screen items-center justify-center bg-charcoal px-6 py-16">
      <div className="w-full max-w-sm">
        <p className="text-center font-display text-lg text-ivory-100">
          NA <span className="text-brass-light">Furniture Valley</span>
        </p>
        <h1 className="mt-6 text-center font-display text-2xl text-ivory-100">Create Admin Account</h1>
        <p className="mt-2 text-center text-sm text-ivory-200/60">
          Requires a signup key set by your organization. This should only be used once, then disabled.
        </p>

        <form onSubmit={handleSubmit((data) => adminSignup(data))} className="mt-8 space-y-4 rounded-card border border-ivory-200/10 bg-charcoal-light p-6">
          {(
            [
              ["full_name", "Full Name", "text"],
              ["email", "Email", "email"],
              ["phone", "Phone Number", "tel"],
              ["password", "Password", "password"],
              ["confirm_password", "Confirm Password", "password"],
              ["admin_signup_key", "Admin Signup Key", "password"],
            ] as const
          ).map(([field, label, type]) => (
            <div key={field}>
              <label className="mb-1.5 block text-sm font-medium text-ivory-200/80">{label}</label>
              <input
                type={type}
                {...register(field)}
                className="w-full rounded-card border border-ivory-200/20 bg-charcoal px-4 py-3 text-sm text-ivory-100 placeholder:text-ivory-200/30 focus:border-brass focus:outline-none"
              />
              {errors[field] && <p className="mt-1 text-xs text-red-400">{errors[field]?.message}</p>}
            </div>
          ))}
          <button type="submit" disabled={isAdminSigningUp} className="btn-primary w-full">
            {isAdminSigningUp ? "Creating account..." : "Create Admin Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ivory-200/50">
          Already have an account? <Link to="/admin/login" className="font-semibold text-brass-light hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
