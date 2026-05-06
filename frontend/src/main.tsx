import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import App from './App.tsx';
import './index.css';
import { useAuthStore } from "./stores/authStore";

const queryClient = new QueryClient();

// Initialize auth
useAuthStore.getState().loadUser();

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <App />
    <Toaster position="top-right" />
  </QueryClientProvider>,
);
