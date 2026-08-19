import { useMutation } from "@tanstack/react-query";
import { login, logout } from "@/apis/auth.api";
import { loginSuccess, logout as logoutAction } from "@/redux/slices/authSlice";
import { useAppDispatch } from "@/redux/hooks";
import type { LoginCredentials } from "@/types/auth";
import { useNavigate } from "react-router-dom";

function canUseThaiApp(role: string, branch?: string): boolean {
  return role === "super_admin" || (role === "thai" && branch === "THAI");
}

export function useLogin() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const result = await login(credentials);
      if (!canUseThaiApp(result.user.role, result.user.branch)) {
        await logout().catch(() => undefined);
        throw {
          response: {
            data: {
              message: "This app is for Thai branch accounts only. Use the YGN POS app.",
            },
          },
        };
      }
      return result;
    },
    onSuccess: (data) => {
      dispatch(loginSuccess(data.user));
      navigate("/dashboard");
    },
    onError: () => {
      dispatch(logoutAction());
    },
  });
}
