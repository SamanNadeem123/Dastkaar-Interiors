import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const schema = z
  .object({
    full_name: z.string().min(2, "Full name is required"),
    email: z.string().email("Enter a valid email"),
    phone: z.string().min(7, "Enter a valid phone number"),
    password: z.string().min(8, "At least 8 characters"),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const { register: registerUser, isRegistering } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  return (
    <div className="container-editorial flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-display-md text-charcoal">Create Account</h1>
        <p className="mt-2 text-sm text-charcoal/60">Save your details for faster checkout next time.</p>

        <form onSubmit={handleSubmit((data) => registerUser(data))} className="mt-8 space-y-4">
          <div>
            <label className="label-field">Full Name</label>
            <input {...register("full_name")} className="input-field" placeholder="Ali Ahmed" />
            {errors.full_name && <p className="mt-1 text-xs text-red-600">{errors.full_name.message}</p>}
          </div>
          <div>
            <label className="label-field">Email</label>
            <input {...register("email")} className="input-field" placeholder="you@example.com" />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>
          <div>
            <label className="label-field">Phone Number</label>
            <input {...register("phone")} className="input-field" placeholder="03XX-XXXXXXX" />
            {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
          </div>
          <div>
            <label className="label-field">Password</label>
            <input type="password" {...register("password")} className="input-field" placeholder="••••••••" />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
          </div>
          <div>
            <label className="label-field">Confirm Password</label>
            <input type="password" {...register("confirm_password")} className="input-field" placeholder="••••••••" />
            {errors.confirm_password && <p className="mt-1 text-xs text-red-600">{errors.confirm_password.message}</p>}
          </div>
          <button type="submit" disabled={isRegistering} className="btn-primary w-full">
            {isRegistering ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-charcoal/60">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-walnut hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
