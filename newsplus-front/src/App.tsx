import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PwaChrome } from "@/components/brand/pwa/PwaChrome";
import AppRoot from "@/components/layouts/AppRoot";
import AppRoutes from "@/routes";
import { BrowserRouter } from "react-router-dom";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoot>
          <AppRoutes />
        </AppRoot>
        <PwaChrome />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
