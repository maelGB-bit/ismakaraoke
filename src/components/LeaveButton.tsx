import { useState } from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/i18n/LanguageContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LeaveButtonProps {
  onDeleted?: () => void;
}

export function LeaveButton({ onDeleted }: LeaveButtonProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { profile } = useUserProfile();
  const [open, setOpen] = useState(false);
  const [deleteRegisteredByMe, setDeleteRegisteredByMe] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasRegisteredOthers, setHasRegisteredOthers] = useState(false);

  const handleOpenDialog = async () => {
    if (!profile?.name) {
      toast({
        title: t('leave.noProfile'),
        variant: 'destructive',
      });
      return;
    }

    // Check if user has registered others
    const { data: registeredByMe } = await supabase
      .from('waitlist')
      .select('id')
      .eq('status', 'waiting')
      .ilike('registered_by', profile.name.trim())
      .limit(1);

    setHasRegisteredOthers((registeredByMe?.length || 0) > 0);
    setDeleteRegisteredByMe(false);
    setOpen(true);
  };

  const handleConfirmLeave = async () => {
    if (!profile?.name) return;

    setIsDeleting(true);

    try {
      // Delete user's own songs
      const { error: ownError } = await supabase
        .from('waitlist')
        .delete()
        .eq('status', 'waiting')
        .ilike('singer_name', profile.name.trim());

      if (ownError) throw ownError;

      // Optionally delete songs registered by this user for others
      if (deleteRegisteredByMe) {
        const { error: othersError } = await supabase
          .from('waitlist')
          .delete()
          .eq('status', 'waiting')
          .ilike('registered_by', profile.name.trim());

        if (othersError) throw othersError;
      }

      toast({
        title: t('leave.success'),
        description: deleteRegisteredByMe 
          ? t('leave.deletedWithOthers') 
          : t('leave.deletedOnlyMine'),
      });

      setOpen(false);
      onDeleted?.();
    } catch (error) {
      console.error('Error deleting from waitlist:', error);
      toast({
        title: t('host.error'),
        description: t('leave.errorDeleting'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!profile?.name) return null;

  return (
    <>
      <Button
        onClick={handleOpenDialog}
        variant="outline"
        className="text-destructive border-destructive/50 hover:bg-destructive/10"
      >
        <LogOut className="mr-2 h-4 w-4" />
        {t('leave.button')}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('leave.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('leave.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {hasRegisteredOthers && (
            <div className="flex items-start space-x-3 p-3 rounded-lg bg-accent/20 border border-accent/30">
              <Checkbox
                id="delete-registered"
                checked={deleteRegisteredByMe}
                onCheckedChange={(checked) => setDeleteRegisteredByMe(checked === true)}
              />
              <Label 
                htmlFor="delete-registered" 
                className="cursor-pointer text-sm leading-relaxed"
              >
                {t('leave.alsoDeleteRegistered')}
              </Label>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t('host.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmLeave}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              {t('leave.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
