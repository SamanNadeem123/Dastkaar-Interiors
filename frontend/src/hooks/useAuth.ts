import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore";
import { authApi, type LoginPayload, type RegisterPayload, type AdminSignupPayload } from "../services/auth";
import { apiErrorMessage } from "../services/api";
import { useCart } from "./useCart";
import { disconnectSocket } from "../services/socket";

export function useAuth() {
  const { user, isAuthenticated, setAuth, logout: clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const { mergeGuestCartIntoServer } = useCart();

  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: async (data) => {
      setAuth(data.user, data.access_token);
      await mergeGuestCartIntoServer();
      toast.success(`Welcome back, ${data.user.full_name.split(" ")[0]}`);
      navigate(data.user.role === "admin" ? "/admin/dashboard" : "/account");
    },
    onError: (err) => toast.error(apiErrorMessage(err, "Invalid credentials.")),
  });

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
    onSuccess: async (data) => {
      setAuth(data.user, data.access_token);
      await mergeGuestCartIntoServer();
      toast.success("Account created successfully");
      navigate("/account");
    },
    onError: (err) => toast.error(apiErrorMessage(err, "Could not create account.")),
  });

  const adminSignupMutation = useMutation({
    mutationFn: (payload: AdminSignupPayload) => authApi.adminSignup(payload),
    onSuccess: (data) => {
      setAuth(data.user, data.access_token);
      toast.success("Admin account created successfully");
      navigate("/admin/dashboard");
    },
    onError: (err) => toast.error(apiErrorMessage(err, "Could not create admin account.")),
  });

  function logout() {
    clearAuth();
    disconnectSocket();
    toast.success("Logged out");
    navigate("/");
  }

  return {
    user,
    isAuthenticated,
    isAdmin: user?.role === "admin",
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    adminSignup: adminSignupMutation.mutate,
    isAdminSigningUp: adminSignupMutation.isPending,
    logout,
  };
}
