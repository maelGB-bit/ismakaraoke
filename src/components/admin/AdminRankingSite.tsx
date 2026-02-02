import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Edit, Trash2, Plus, Loader2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MonthlyRankingEntry {
  id: string;
  cantor: string;
  musica: string;
  nota_media: number;
  total_votos: number;
  global_score: number;
  instance_name: string | null;
  instance_code: string | null;
  created_at: string;
}

export function AdminRankingSite() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<MonthlyRankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ cantor: '', musica: '', nota_media: 0, total_votos: 0 });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({ cantor: '', musica: '', nota_media: 0, total_votos: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRanking = async () => {
    try {
      const { data, error } = await supabase
        .from('monthly_ranking')
        .select('*')
        .order('global_score', { ascending: false })
        .limit(50);

      if (error) throw error;
      setEntries((data || []) as MonthlyRankingEntry[]);
    } catch (error) {
      console.error('Error fetching ranking:', error);
      toast({ title: 'Erro ao carregar ranking', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRanking();
  }, []);

  const handleStartEdit = (entry: MonthlyRankingEntry) => {
    setEditingId(entry.id);
    setEditForm({
      cantor: entry.cantor,
      musica: entry.musica,
      nota_media: entry.nota_media,
      total_votos: entry.total_votos,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('performances')
        .update({
          cantor: editForm.cantor,
          musica: editForm.musica,
          nota_media: editForm.nota_media,
          total_votos: editForm.total_votos,
        })
        .eq('id', editingId);

      if (error) throw error;
      
      toast({ title: 'Registro atualizado com sucesso!' });
      setEditingId(null);
      await fetchRanking();
    } catch (error) {
      console.error('Error updating:', error);
      toast({ title: 'Erro ao atualizar registro', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este registro do ranking?')) return;
    
    try {
      const { error } = await supabase
        .from('performances')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({ title: 'Registro excluído com sucesso!' });
      await fetchRanking();
    } catch (error) {
      console.error('Error deleting:', error);
      toast({ title: 'Erro ao excluir registro', variant: 'destructive' });
    }
  };

  const handleAddEntry = async () => {
    if (!newEntry.cantor.trim() || !newEntry.musica.trim()) {
      toast({ title: 'Preencha cantor e música', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('performances')
        .insert({
          cantor: newEntry.cantor.trim(),
          musica: newEntry.musica.trim(),
          nota_media: newEntry.nota_media,
          total_votos: newEntry.total_votos,
          status: 'encerrada',
          karaoke_instance_id: null,
        });

      if (error) throw error;
      
      toast({ title: 'Registro adicionado com sucesso!' });
      setIsAddDialogOpen(false);
      setNewEntry({ cantor: '', musica: '', nota_media: 0, total_votos: 0 });
      await fetchRanking();
    } catch (error) {
      console.error('Error adding:', error);
      toast({ title: 'Erro ao adicionar registro', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Ranking do Site
            </CardTitle>
            <CardDescription>
              Visualize e edite o ranking mensal exibido no site
            </CardDescription>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Registro
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum registro no ranking</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Cantor</TableHead>
                <TableHead>Música</TableHead>
                <TableHead className="text-center">Nota Média</TableHead>
                <TableHead className="text-center">Total Votos</TableHead>
                <TableHead className="text-center">Nota Global</TableHead>
                <TableHead>Instância</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry, index) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">
                    {index + 1}
                    {index === 0 && <span className="ml-1">🥇</span>}
                    {index === 1 && <span className="ml-1">🥈</span>}
                    {index === 2 && <span className="ml-1">🥉</span>}
                  </TableCell>
                  <TableCell>
                    {editingId === entry.id ? (
                      <Input
                        value={editForm.cantor}
                        onChange={(e) => setEditForm({ ...editForm, cantor: e.target.value })}
                        className="h-8"
                      />
                    ) : (
                      <span className="font-medium">{entry.cantor}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === entry.id ? (
                      <Input
                        value={editForm.musica}
                        onChange={(e) => setEditForm({ ...editForm, musica: e.target.value })}
                        className="h-8"
                      />
                    ) : (
                      entry.musica
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {editingId === entry.id ? (
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={editForm.nota_media}
                        onChange={(e) => setEditForm({ ...editForm, nota_media: parseFloat(e.target.value) || 0 })}
                        className="h-8 w-20 mx-auto"
                      />
                    ) : (
                      <span className={entry.nota_media >= 9 ? 'text-yellow-500 font-bold' : ''}>
                        {entry.nota_media?.toFixed(1) || '0.0'}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {editingId === entry.id ? (
                      <Input
                        type="number"
                        min="0"
                        value={editForm.total_votos}
                        onChange={(e) => setEditForm({ ...editForm, total_votos: parseInt(e.target.value) || 0 })}
                        className="h-8 w-20 mx-auto"
                      />
                    ) : (
                      entry.total_votos || 0
                    )}
                  </TableCell>
                  <TableCell className="text-center font-bold">
                    {((entry.nota_media || 0) * (entry.total_votos || 0)).toFixed(1)}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {entry.instance_name || 'Manual'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === entry.id ? (
                      <div className="flex gap-1 justify-end">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={handleSaveEdit}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-1 justify-end">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleStartEdit(entry)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(entry.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Add Entry Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Registro Manual</DialogTitle>
              <DialogDescription>
                Adicione um novo registro ao ranking mensal.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="add-cantor">Cantor</Label>
                <Input
                  id="add-cantor"
                  value={newEntry.cantor}
                  onChange={(e) => setNewEntry({ ...newEntry, cantor: e.target.value })}
                  placeholder="Nome do cantor"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-musica">Música</Label>
                <Input
                  id="add-musica"
                  value={newEntry.musica}
                  onChange={(e) => setNewEntry({ ...newEntry, musica: e.target.value })}
                  placeholder="Nome da música"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="add-nota">Nota Média</Label>
                  <Input
                    id="add-nota"
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={newEntry.nota_media}
                    onChange={(e) => setNewEntry({ ...newEntry, nota_media: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-votos">Total de Votos</Label>
                  <Input
                    id="add-votos"
                    type="number"
                    min="0"
                    value={newEntry.total_votos}
                    onChange={(e) => setNewEntry({ ...newEntry, total_votos: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddEntry} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Adicionar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
