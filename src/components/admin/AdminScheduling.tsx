import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Save, Loader2, Calendar, Clock, FileText } from 'lucide-react';
import {
  Card, CardBody, Button, Badge, Input, Toggle, StatCard,
} from '../ui';
import { Heading, Label, Text } from '../ui/Typography';
import { listItem } from '@/src/lib/motion';
import * as api from '@/src/services/api';
import { useWorkspace } from '@/src/hooks/useWorkspace';
import type { AvailabilityConfig, AvailabilitySlot, Booking } from '@/src/types';

const DAY_NAMES = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado'];

interface SlotRow {
  day_of_week: number;
  enabled: boolean;
  start_time: string;
  end_time: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

function formatTime(time: string): string {
  return time.slice(0, 5);
}

export default function AdminScheduling() {
  const { activeWorkspace } = useWorkspace();
  const workspaceId = activeWorkspace?.id;

  const [configs, setConfigs] = useState<AvailabilityConfig[]>([]);
  const [activeConfig, setActiveConfig] = useState<AvailabilityConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('60');
  const [buffer, setBuffer] = useState('15');
  const [maxDays, setMaxDays] = useState('30');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  // Slots state
  const [slotRows, setSlotRows] = useState<SlotRow[]>(
    Array.from({ length: 7 }, (_, i) => ({
      day_of_week: i,
      enabled: i >= 1 && i <= 5, // Mon-Fri default
      start_time: '09:00',
      end_time: '17:00',
    }))
  );
  const [savingSlots, setSavingSlots] = useState(false);

  // Bookings
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [editingNotes, setEditingNotes] = useState<Record<number, string>>({});

  const loadData = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const cfgs = await api.getSchedulingConfigs(workspaceId);
      setConfigs(cfgs);
      if (cfgs.length > 0 && !activeConfig) {
        selectConfig(cfgs[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectConfig = async (cfg: AvailabilityConfig) => {
    setActiveConfig(cfg);
    setTitle(cfg.title);
    setDuration(String(cfg.duration_minutes));
    setBuffer(String(cfg.buffer_minutes));
    setMaxDays(String(cfg.max_advance_days));
    setIsActive(cfg.is_active === 1);

    // Load full config with slots
    try {
      const full = await api.getSchedulingConfig(cfg.id);
      if (full.slots && full.slots.length > 0) {
        const newRows: SlotRow[] = Array.from({ length: 7 }, (_, i) => {
          const slot = full.slots!.find((s) => s.day_of_week === i);
          return slot
            ? { day_of_week: i, enabled: true, start_time: slot.start_time.slice(0, 5), end_time: slot.end_time.slice(0, 5) }
            : { day_of_week: i, enabled: false, start_time: '09:00', end_time: '17:00' };
        });
        setSlotRows(newRows);
      } else {
        setSlotRows(
          Array.from({ length: 7 }, (_, i) => ({
            day_of_week: i,
            enabled: false,
            start_time: '09:00',
            end_time: '17:00',
          }))
        );
      }
    } catch (err) {
      console.error(err);
    }

    // Load bookings
    setLoadingBookings(true);
    try {
      const bks = await api.getConfigBookings(cfg.id);
      setBookings(bks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleCreateConfig = async () => {
    if (!workspaceId || !title.trim()) return;
    setSaving(true);
    try {
      const created = await api.createSchedulingConfig({
        workspace_id: workspaceId,
        title: title.trim(),
        duration_minutes: Number(duration) || 60,
        buffer_minutes: Number(buffer) || 15,
        max_advance_days: Number(maxDays) || 30,
        is_active: 1,
      });
      setShowCreate(false);
      setTitle('');
      await loadData();
      selectConfig(created);
    } catch (err: any) {
      alert(err.message || 'Erro ao criar');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateConfig = async () => {
    if (!activeConfig) return;
    setSaving(true);
    try {
      await api.updateSchedulingConfig(activeConfig.id, {
        title: title.trim(),
        duration_minutes: Number(duration) || 60,
        buffer_minutes: Number(buffer) || 15,
        max_advance_days: Number(maxDays) || 30,
        is_active: isActive ? 1 : 0,
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfig = async () => {
    if (!activeConfig || !confirm('Excluir esta agenda?')) return;
    try {
      await api.deleteSchedulingConfig(activeConfig.id);
      setActiveConfig(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir');
    }
  };

  const handleSaveSlots = async () => {
    if (!activeConfig) return;
    setSavingSlots(true);
    try {
      const enabled = slotRows.filter((r) => r.enabled).map((r) => ({
        day_of_week: r.day_of_week,
        start_time: r.start_time,
        end_time: r.end_time,
      }));
      await api.setSchedulingSlots(activeConfig.id, enabled);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar');
    } finally {
      setSavingSlots(false);
    }
  };

  const handleSaveNotes = async (bookingId: number) => {
    const notes = editingNotes[bookingId];
    if (notes === undefined) return;
    try {
      await api.updateBookingNotes(bookingId, notes);
      setEditingNotes((prev) => {
        const next = { ...prev };
        delete next[bookingId];
        return next;
      });
      // Refresh bookings
      if (activeConfig) {
        const bks = await api.getConfigBookings(activeConfig.id);
        setBookings(bks);
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar notas');
    }
  };

  const updateSlotRow = (dayIndex: number, updates: Partial<SlotRow>) => {
    setSlotRows((prev) => prev.map((r) => r.day_of_week === dayIndex ? { ...r, ...updates } : r));
  };

  const activeBookings = bookings.filter((b) => b.status === 'confirmed');
  const totalBookings = bookings.length;

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center py-20">
        <Text muted>Selecione um workspace</Text>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-gold" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard label="Agendas" value={String(configs.length)} trend="" />
        <StatCard label="Agendamentos Ativos" value={String(activeBookings.length)} trend="" />
        <StatCard label="Total de Agendamentos" value={String(totalBookings)} trend="" />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-6">
        <Heading level={3}>Configuracao de Agenda</Heading>
        <Button icon={<Plus size={16} />} onClick={() => {
          setShowCreate(true);
          setTitle('');
          setDuration('60');
          setBuffer('15');
          setMaxDays('30');
        }}>
          Nova Agenda
        </Button>
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Card variant="elevated">
              <CardBody className="space-y-4">
                <Heading level={3}>Nova Agenda</Heading>
                <div className="space-y-1">
                  <Label>Titulo</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Tutoria Individual"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label>Duracao (min)</Label>
                    <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} min={15} />
                  </div>
                  <div className="space-y-1">
                    <Label>Intervalo (min)</Label>
                    <Input type="number" value={buffer} onChange={(e) => setBuffer(e.target.value)} min={0} />
                  </div>
                  <div className="space-y-1">
                    <Label>Antecedencia max (dias)</Label>
                    <Input type="number" value={maxDays} onChange={(e) => setMaxDays(e.target.value)} min={1} />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button onClick={handleCreateConfig} disabled={saving || !title.trim()}>
                    {saving ? 'Criando...' : 'Criar Agenda'}
                  </Button>
                  <Button variant="secondary" onClick={() => setShowCreate(false)}>
                    Cancelar
                  </Button>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Config selector */}
      {configs.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {configs.map((cfg) => (
            <button
              key={cfg.id}
              onClick={() => selectConfig(cfg)}
              className={`px-4 py-2 text-sm border transition-all duration-300 ${
                activeConfig?.id === cfg.id
                  ? 'border-gold bg-gold/10 text-gold'
                  : 'border-line text-warm-gray hover:border-gold/40'
              }`}
            >
              {cfg.title}
              {cfg.is_active === 0 && <span className="ml-2 text-warm-gray/40">(inativa)</span>}
            </button>
          ))}
        </div>
      )}

      {/* Active config edit */}
      {activeConfig && !showCreate && (
        <>
          <Card variant="elevated">
            <CardBody className="space-y-6">
              <div className="flex items-center justify-between">
                <Heading level={3}>Configuracao</Heading>
                <div className="flex items-center gap-4">
                  <Toggle checked={isActive} onChange={setIsActive} label="Ativa" />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 size={14} className="text-red-400" />}
                    onClick={handleDeleteConfig}
                  >
                    Excluir
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <Label>Titulo</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label>Duracao (min)</Label>
                  <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} min={15} />
                </div>
                <div className="space-y-1">
                  <Label>Intervalo (min)</Label>
                  <Input type="number" value={buffer} onChange={(e) => setBuffer(e.target.value)} min={0} />
                </div>
                <div className="space-y-1">
                  <Label>Antecedencia max (dias)</Label>
                  <Input type="number" value={maxDays} onChange={(e) => setMaxDays(e.target.value)} min={1} />
                </div>
              </div>

              <Button icon={<Save size={14} />} onClick={handleUpdateConfig} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar Configuracao'}
              </Button>
            </CardBody>
          </Card>

          {/* Weekly schedule */}
          <Card variant="elevated">
            <CardBody className="space-y-6">
              <Heading level={3}>Horarios Semanais</Heading>

              <div className="space-y-3">
                {slotRows.map((row) => (
                  <div
                    key={row.day_of_week}
                    className={`flex items-center gap-4 p-3 border border-line rounded transition-all ${
                      row.enabled ? 'bg-surface' : 'bg-bg opacity-60'
                    }`}
                  >
                    <div className="w-28">
                      <Toggle
                        checked={row.enabled}
                        onChange={(v) => updateSlotRow(row.day_of_week, { enabled: v })}
                        label={DAY_NAMES[row.day_of_week]}
                      />
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        type="time"
                        value={row.start_time}
                        onChange={(e) => updateSlotRow(row.day_of_week, { start_time: e.target.value })}
                        disabled={!row.enabled}
                        className="w-32"
                      />
                      <span className="text-warm-gray text-sm">ate</span>
                      <Input
                        type="time"
                        value={row.end_time}
                        onChange={(e) => updateSlotRow(row.day_of_week, { end_time: e.target.value })}
                        disabled={!row.enabled}
                        className="w-32"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <Button icon={<Save size={14} />} onClick={handleSaveSlots} disabled={savingSlots}>
                {savingSlots ? 'Salvando...' : 'Salvar Horarios'}
              </Button>
            </CardBody>
          </Card>

          {/* Bookings list */}
          <div className="space-y-6">
            <Heading level={3}>Agendamentos</Heading>

            {loadingBookings ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-gold" size={20} />
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar size={28} className="mx-auto mb-3 text-warm-gray/20" />
                <Text muted>Nenhum agendamento</Text>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((b, i) => {
                  const isEditing = editingNotes[b.id] !== undefined;
                  return (
                    <motion.div key={b.id} {...listItem(i)}>
                      <Card variant="elevated">
                        <CardBody>
                          <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                            {/* Info */}
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-4 flex-wrap">
                                <div className="flex items-center gap-2">
                                  <Calendar size={14} className="text-gold" />
                                  <Text className="font-medium">{formatDate(b.date)}</Text>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock size={14} className="text-gold" />
                                  <Text>{formatTime(b.start_time)} - {formatTime(b.end_time)}</Text>
                                </div>
                                <Badge variant={b.status === 'confirmed' ? 'gold' : 'muted'}>
                                  {b.status === 'confirmed' ? 'Confirmado' : 'Cancelado'}
                                </Badge>
                              </div>
                              {(b.user_name || b.user_email || b.user_phone) && (
                                <div className="flex items-center gap-4 flex-wrap">
                                  {b.user_name && <Label>{b.user_name}</Label>}
                                  {b.user_phone && <Label className="text-warm-gray/60">{b.user_phone}</Label>}
                                  {b.user_email && <Label className="text-warm-gray/60">{b.user_email}</Label>}
                                </div>
                              )}
                            </div>

                            {/* Notes */}
                            <div className="lg:w-64 space-y-2">
                              <div className="flex items-center gap-2">
                                <FileText size={12} className="text-warm-gray/40" />
                                <Label className="text-warm-gray/60">Notas</Label>
                              </div>
                              <textarea
                                value={isEditing ? editingNotes[b.id] : (b.notes || '')}
                                onChange={(e) => setEditingNotes((prev) => ({ ...prev, [b.id]: e.target.value }))}
                                onFocus={() => {
                                  if (!isEditing) setEditingNotes((prev) => ({ ...prev, [b.id]: b.notes || '' }));
                                }}
                                placeholder="Notas..."
                                rows={2}
                                className="w-full bg-bg border border-line px-3 py-2 text-sm focus:outline-none focus:border-gold transition-colors resize-none"
                              />
                              {isEditing && (
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => handleSaveNotes(b.id)}>Salvar</Button>
                                  <Button size="sm" variant="secondary" onClick={() => {
                                    setEditingNotes((prev) => {
                                      const next = { ...prev };
                                      delete next[b.id];
                                      return next;
                                    });
                                  }}>
                                    Cancelar
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
