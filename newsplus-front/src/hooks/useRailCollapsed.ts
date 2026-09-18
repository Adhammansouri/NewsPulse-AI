import { useCallback, useEffect, useState } from "react";
import { getRailCollapsed, setRailCollapsed, subscribeRailCollapsed } from "@/services/railCollapseStore";

export function useRailCollapsed() {
  const [collapsed, setCollapsed] = useState(getRailCollapsed);

  useEffect(() => subscribeRailCollapsed(setCollapsed), []);

  const toggle = useCallback(() => {
    const next = !getRailCollapsed();
    setRailCollapsed(next);
    setCollapsed(next);
  }, []);

  return { collapsed, toggle };
}
