import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";

// Landing pages
import LandingPage from "./pages/LandingPage";
import ComoFunciona from "./pages/ComoFunciona";
import DepoimentosPage from "./pages/DepoimentosPage";
import ManualPage from "./pages/ManualPage";
import TestarPage from "./pages/TestarPage";
import PlanosPage from "./pages/PlanosPage";
import EntrarSistema from "./pages/EntrarSistema";

// App pages (system)
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import CadastroTeste from "./pages/CadastroTeste";
import Host from "./pages/Host";
import HostAuthPage from "./pages/HostAuth";
import AdminAuthPage from "./pages/AdminAuth";
import Admin from "./pages/Admin";
import Vote from "./pages/Vote";
import Ranking from "./pages/Ranking";
import Inscricao from "./pages/Inscricao";
import EventGuide from "./pages/EventGuide";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Landing pages */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/como-funciona" element={<ComoFunciona />} />
            <Route path="/depoimentos" element={<DepoimentosPage />} />
            <Route path="/manual" element={<ManualPage />} />
            <Route path="/testar" element={<TestarPage />} />
            <Route path="/planos" element={<PlanosPage />} />
            <Route path="/entrar" element={<EntrarSistema />} />

            {/* App routes (system) */}
            <Route path="/app" element={<Index />} />
            <Route path="/app/login" element={<LoginPage />} />
            <Route path="/app/cadastro" element={<CadastroTeste />} />
            <Route path="/app/host" element={<Host />} />
            <Route path="/app/host/:instanceCode" element={<Host />} />
            <Route path="/app/auth/host" element={<HostAuthPage />} />
            <Route path="/app/auth/admin" element={<AdminAuthPage />} />
            <Route path="/app/admin" element={<Admin />} />
            <Route path="/app/vote" element={<Vote />} />
            <Route path="/app/vote/:instanceCode" element={<Vote />} />
            <Route path="/app/ranking" element={<Ranking />} />
            <Route path="/app/ranking/:instanceCode" element={<Ranking />} />
            <Route path="/app/inscricao" element={<Inscricao />} />
            <Route path="/app/inscricao/:instanceCode" element={<Inscricao />} />
            <Route path="/app/guia" element={<EventGuide />} />

            {/* Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
