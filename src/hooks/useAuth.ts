import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";

export function useAuth() {
  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );

  return {
    user,
    isAuthenticated,
    isSuperAdmin: user?.role === "super_admin",
    isYgn: user?.role === "ygn",
    isThai: user?.role === "thai",
  };
}
