import { useEffect, useState } from "react";
import { getSession, subscribeToSession, type NewsplusSession } from "@/services/sessionStore";

export function useSession() {
  const [session, setSession] = useState<NewsplusSession | null>(() => getSession());

  useEffect(() => subscribeToSession(() => setSession(getSession())), []);

  return session;
}