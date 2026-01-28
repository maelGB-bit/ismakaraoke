import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Key, Users, Mic2, LogOut, Loader2, UserPlus, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminApiKeys } from '@/components/admin/AdminApiKeys';
import { AdminCoordinators } from '@/components/admin/AdminCoordinators';
import { AdminInstances } from '@/components/admin/AdminInstances';
import { AdminCoordinatorRequests } from '@/components/admin/AdminCoordinatorRequests';
import { AdminSiteVideos } from '@/components/admin/AdminSiteVideos';
import { useAdminAuthState, AdminAuthContext } from '@/hooks/useAdminAuth';

function AdminContent() {
  const navigate = useNavigate();
  const { user, isLoading, isAdmin, logout } = useAdminAuthState();

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate('/app/auth/admin');
    }
  }, [isLoading, user, isAdmin, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <Loader2 className="w-16 h-16 text-primary animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen gradient-bg p-4 lg:p-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield className="w-10 h-10 text-primary" />
            <div>
              <h1 className="text-3xl font-black font-display neon-text-pink">
                Painel Administrativo
              </h1>
              <p className="text-sm text-muted-foreground">
                Gerencie API Keys, Coordenadores e Instâncias
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </header>

        {/* Tabs */}
        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
            <TabsTrigger value="requests" className="gap-2">
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Solicitações</span>
            </TabsTrigger>
            <TabsTrigger value="coordinators" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Coordenadores</span>
            </TabsTrigger>
            <TabsTrigger value="instances" className="gap-2">
              <Mic2 className="h-4 w-4" />
              <span className="hidden sm:inline">Instâncias</span>
            </TabsTrigger>
            <TabsTrigger value="api-keys" className="gap-2">
              <Key className="h-4 w-4" />
              <span className="hidden sm:inline">API Keys</span>
            </TabsTrigger>
            <TabsTrigger value="videos" className="gap-2">
              <Video className="h-4 w-4" />
              <span className="hidden sm:inline">Vídeos</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            <AdminCoordinatorRequests />
          </TabsContent>

          <TabsContent value="coordinators">
            <AdminCoordinators />
          </TabsContent>

          <TabsContent value="instances">
            <AdminInstances />
          </TabsContent>

          <TabsContent value="api-keys">
            <AdminApiKeys />
          </TabsContent>

          <TabsContent value="videos">
            <AdminSiteVideos />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}

export default function Admin() {
  const authState = useAdminAuthState();

  return (
    <AdminAuthContext.Provider value={authState}>
      <AdminContent />
    </AdminAuthContext.Provider>
  );
}
