import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { logout } from "@/services/authService";

export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);

  const run = useCallback(async () => {
    setPending(true);
    await logout();
    queryClient.clear();
    navigate("/login", { replace: true });
  }, [navigate, queryClient]);

  return { logout: run, pending };
}
