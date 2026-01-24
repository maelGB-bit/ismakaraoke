import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider, useLanguage } from "@/i18n/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";
import Index from "./pages/Index";
import Host from "./pages/Host";
import HostAuthPage from "./pages/HostAuth";
import Vote from "./pages/Vote";
import Ranking from "./pages/Ranking";
import Inscricao from "./pages/Inscricao";
import EventGuide from "./pages/EventGuide";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const { isLanguageSelected } = useLanguage();

  if (!isLanguageSelected) {
    return <LanguageSelector />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/host" element={<Host />} />
        <Route path="/auth/host" element={<HostAuthPage />} />
        <Route path="/vote" element={<Vote />} />
        <Route path="/ranking" element={<Ranking />} />
        <Route path="/inscricao" element={<Inscricao />} />
        <Route path="/guia" element={<EventGuide />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;