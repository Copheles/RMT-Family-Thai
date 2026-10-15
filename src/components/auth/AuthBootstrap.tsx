import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { me, logout as logoutApi } from "@/apis/auth.api";
import { LoadingState } from "@/components/shared/PageStates";
import { useAppDispatch } from "@/redux/hooks";
import { logout, setUser } from "@/redux/slices/authSlice";
import type { AppDispatch } from "@/redux/store";

function canUseThaiApp(role: string, branch?: string): boolean {
  return role === "super_admin" || (role === "thai" && branch === "THAI");
}


export function AuthBootstrap({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void me()
      .then((user) => {
        if (cancelled) return;
        if (canUseThaiApp(user.role, user.branch)) {
          dispatch(setUser(user));
        } else {
          dispatch(setUser(null));
        }
      })
      .catch(() => {
        if (!cancelled) dispatch(setUser(null));
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  useEffect(() => {
    function handleUnauthorized() {
      dispatch(logout());
      navigate("/login", { replace: true });
    }

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, [dispatch, navigate]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingState label="Loading session..." />
      </div>
    );
  }

  return children;
}

export async function performLogout(dispatch: AppDispatch): Promise<void> {
  try {
    await logoutApi();
  } catch {
    // Cookie may already be cleared
  }
  dispatch(logout());
}
