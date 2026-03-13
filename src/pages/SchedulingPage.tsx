import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Calendar, Clock, X, Loader2 } from 'lucide-react';
import {
  PageTransition,
  Card,
  CardBody,
  Button,
  Badge,
} from '../components/ui';
import { Heading, Label, Text } from '../components/ui/Typography';
import { listItem } from '@/src/lib/motion';
import * as api from '@/src/services/api';
import { useWorkspace } from '@/src/hooks/useWorkspace';
import type { AvailabilityConfig, TimeSlot, Booking } from '@/src/types';

const DAY_NAMES_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function formatDateLong(date: Date): string {
  const dayNames = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado'];
  const day = dayNames[date.getDay()];
  const d = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  return `${day}, ${d} de ${month}`;
}

function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatTime(time: string): string {
  return time.slice(0, 5);
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function SchedulingPage() {
  const { activeWorkspace } = useWorkspace();
  const workspaceId = activeWorkspace?.id;

  const [configs, setConfigs] = useState<AvailabilityConfig[]>([]);
  const [activeConfig, setActiveConfig] = useState<AvailabilityConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Calendar state
  const today = useMemo(() => new Date(), []);
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Time slots
  const [availableTimes, setAvailableTimes] = useState<TimeSlot[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);

  // Confirmation
  const [confirmingSlot, setConfirmingSlot] = useState<TimeSlot | null>(null);
  const [booking, setBooking] = useState(false);

  // My bookings
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Load configs
  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    api.getSchedulingConfigs(workspaceId)
      .then((cfgs) => {
        setConfigs(cfgs);
        if (cfgs.length > 0) setActiveConfig(cfgs[0]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [workspaceId]);

  // Load my bookings
  const loadBookings = useCallback(async () => {
    setLoadingBookings(true);
    try {
      const b = await api.getMyBookings();
      setMyBookings(b);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBookings(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Load available times when date is selected
  useEffect(() => {
    if (!selectedDate || !activeConfig) {
      setAvailableTimes([]);
      return;
    }
    setLoadingTimes(true);
    api.getAvailableTimes(activeConfig.id, formatDateISO(selectedDate))
      .then(setAvailableTimes)
      .catch(() => setAvailableTimes([]))
      .finally(() => setLoadingTimes(false));
  }, [selectedDate, activeConfig]);

  // Enabled days of week from config slots
  const enabledDays = useMemo(() => {
    if (!activeConfig?.slots) return new Set<number>();
    return new Set(activeConfig.slots.map((s) => s.day_of_week));
  }, [activeConfig]);

  // Max date
  const maxDate = useMemo(() => {
    if (!activeConfig) return null;
    const d = new Date();
    d.setDate(d.getDate() + activeConfig.max_advance_days);
    return d;
  }, [activeConfig]);

  // Calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const days: Array<{ date: Date; inMonth: boolean; enabled: boolean }> = [];

    // Previous month padding
    for (let i = 0; i < startOffset; i++) {
      const d = new Date(viewYear, viewMonth, -startOffset + i + 1);
      days.push({ date: d, inMonth: false, enabled: false });
    }

    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(viewYear, viewMonth, i);
      const isPast = d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const isBeyondMax = maxDate ? d > maxDate : false;
      const isDayEnabled = enabledDays.has(d.getDay());
      days.push({ date: d, inMonth: true, enabled: !isPast && !isBeyondMax && isDayEnabled });
    }

    // Next month padding to fill grid
    const remainder = days.length % 7;
    if (remainder > 0) {
      for (let i = 1; i <= 7 - remainder; i++) {
        const d = new Date(viewYear, viewMonth + 1, i);
        days.push({ date: d, inMonth: false, enabled: false });
      }
    }

    return days;
  }, [viewMonth, viewYear, today, maxDate, enabledDays]);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleBook = async () => {
    if (!confirmingSlot || !selectedDate || !activeConfig) return;
    setBooking(true);
    try {
      await api.bookSlot({
        config_id: activeConfig.id,
        date: formatDateISO(selectedDate),
        start_time: confirmingSlot.start,
      });
      setConfirmingSlot(null);
      // Refresh
      const times = await api.getAvailableTimes(activeConfig.id, formatDateISO(selectedDate));
      setAvailableTimes(times);
      loadBookings();
    } catch (err: any) {
      alert(err.message || 'Erro ao agendar');
    } finally {
      setBooking(false);
    }
  };

  const handleCancelBooking = async (id: number) => {
    if (!confirm('Cancelar este agendamento?')) return;
    try {
      await api.cancelBooking(id);
      loadBookings();
      // If viewing the same day, refresh times
      if (selectedDate && activeConfig) {
        const times = await api.getAvailableTimes(activeConfig.id, formatDateISO(selectedDate));
        setAvailableTimes(times);
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao cancelar');
    }
  };

  if (!workspaceId) {
    return (
      <PageTransition id="scheduling" className="flex items-center justify-center py-20">
        <Text muted>Selecione um workspace</Text>
      </PageTransition>
    );
  }

  if (loading) {
    return (
      <PageTransition id="scheduling" className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-gold" size={24} />
      </PageTransition>
    );
  }

  if (configs.length === 0) {
    return (
      <PageTransition id="scheduling" className="space-y-8">
        <h1 className="font-serif text-3xl font-black">Agenda</h1>
        <div className="text-center py-16">
          <Calendar size={32} className="mx-auto mb-4 text-warm-gray/30" />
          <Text muted>Nenhuma agenda disponivel</Text>
        </div>
      </PageTransition>
    );
  }

  const futureBookings = myBookings.filter((b) => {
    const bDate = new Date(b.date + 'T' + b.start_time);
    return bDate >= today && b.status === 'confirmed';
  });

  const pastBookings = myBookings.filter((b) => {
    const bDate = new Date(b.date + 'T' + b.start_time);
    return bDate < today || b.status !== 'confirmed';
  });

  return (
    <PageTransition id="scheduling" className="space-y-16">
      <h1 className="font-serif text-3xl font-black">Agenda</h1>

      {/* Config selector if multiple */}
      {configs.length > 1 && (
        <div className="flex gap-3 flex-wrap">
          {configs.map((cfg) => (
            <button
              key={cfg.id}
              onClick={() => {
                setActiveConfig(cfg);
                setSelectedDate(null);
                setAvailableTimes([]);
              }}
              className={`px-4 py-2 text-sm border transition-all duration-300 ${
                activeConfig?.id === cfg.id
                  ? 'border-gold bg-gold/10 text-gold'
                  : 'border-line text-warm-gray hover:border-gold/40'
              }`}
            >
              {cfg.title}
            </button>
          ))}
        </div>
      )}

      {activeConfig && (
        <>
          {/* Config info */}
          <div className="flex items-center gap-4">
            <Label className="text-warm-gray">
              {activeConfig.title} — {activeConfig.duration_minutes} min
            </Label>
          </div>

          {/* Calendar + Slots */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Calendar */}
            <Card variant="elevated">
              <CardBody className="p-6">
                {/* Month header */}
                <div className="flex items-center justify-between mb-6">
                  <button onClick={prevMonth} className="p-2 hover:text-gold transition-colors">
                    <ChevronLeft size={18} />
                  </button>
                  <span className="font-serif text-xl font-black">
                    {MONTH_NAMES[viewMonth]} {viewYear}
                  </span>
                  <button onClick={nextMonth} className="p-2 hover:text-gold transition-colors">
                    <ChevronRight size={18} />
                  </button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {DAY_NAMES_SHORT.map((d) => (
                    <div key={d} className="text-center mono-label text-[9px] text-warm-gray py-1">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Day grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map(({ date, inMonth, enabled }, i) => {
                    const isSelected = selectedDate && isSameDay(date, selectedDate);
                    const isToday = isSameDay(date, today);

                    return (
                      <button
                        key={i}
                        disabled={!enabled}
                        onClick={() => enabled && setSelectedDate(date)}
                        className={`
                          relative h-10 text-sm transition-all duration-200 rounded
                          ${!inMonth ? 'text-warm-gray/20' : ''}
                          ${inMonth && !enabled ? 'text-warm-gray/30 cursor-not-allowed' : ''}
                          ${inMonth && enabled ? 'hover:bg-gold/10 cursor-pointer font-medium' : ''}
                          ${isSelected ? 'bg-gold text-paper hover:bg-gold' : ''}
                          ${isToday && !isSelected ? 'ring-1 ring-gold/50' : ''}
                          ${inMonth && enabled && !isSelected ? 'text-text' : ''}
                        `}
                      >
                        {date.getDate()}
                        {inMonth && enabled && !isSelected && (
                          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gold/60" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardBody>
            </Card>

            {/* Time slots */}
            <div>
              <AnimatePresence mode="wait">
                {selectedDate ? (
                  <motion.div
                    key={formatDateISO(selectedDate)}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card variant="elevated">
                      <CardBody className="p-6 space-y-6">
                        <div>
                          <Label variant="gold" className="tracking-widest mb-1">
                            HORARIOS DISPONIVEIS
                          </Label>
                          <Heading level={3}>{formatDateLong(selectedDate)}</Heading>
                        </div>

                        {loadingTimes ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="animate-spin text-gold" size={20} />
                          </div>
                        ) : availableTimes.length === 0 ? (
                          <div className="text-center py-8">
                            <Clock size={24} className="mx-auto mb-3 text-warm-gray/30" />
                            <Text muted>Nenhum horario disponivel nesta data</Text>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {availableTimes.map((slot) => (
                              <button
                                key={slot.start}
                                onClick={() => setConfirmingSlot(slot)}
                                className="px-4 py-3 border border-line text-sm font-medium hover:border-gold hover:bg-gold/5 hover:text-gold transition-all duration-200 rounded"
                              >
                                {formatTime(slot.start)}
                              </button>
                            ))}
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center h-full"
                  >
                    <div className="text-center py-16">
                      <Calendar size={32} className="mx-auto mb-4 text-warm-gray/20" />
                      <Text muted>Selecione uma data no calendario</Text>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </>
      )}

      {/* Confirmation dialog */}
      <AnimatePresence>
        {confirmingSlot && selectedDate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm"
            onClick={() => !booking && setConfirmingSlot(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface border border-line p-8 max-w-md w-full mx-4 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <Heading level={3}>Confirmar agendamento?</Heading>
                <button onClick={() => setConfirmingSlot(null)} className="text-warm-gray hover:text-text transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3">
                  <Calendar size={16} className="text-gold" />
                  <Text>{formatDateLong(selectedDate)}</Text>
                </div>
                <div className="flex items-center gap-3">
                  <Clock size={16} className="text-gold" />
                  <Text>{formatTime(confirmingSlot.start)} - {formatTime(confirmingSlot.end)}</Text>
                </div>
                {activeConfig && (
                  <div className="pt-2">
                    <Label className="text-warm-gray">{activeConfig.title} ({activeConfig.duration_minutes} min)</Label>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={handleBook} disabled={booking}>
                  {booking ? 'Agendando...' : 'Confirmar'}
                </Button>
                <Button variant="secondary" onClick={() => setConfirmingSlot(null)} disabled={booking}>
                  Cancelar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* My Bookings */}
      <div className="space-y-8">
        <Heading level={2}>Meus Agendamentos</Heading>

        {loadingBookings ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-gold" size={20} />
          </div>
        ) : myBookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar size={28} className="mx-auto mb-3 text-warm-gray/20" />
            <Text muted>Nenhum agendamento</Text>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Future bookings */}
            {futureBookings.length > 0 && (
              <div className="space-y-4">
                <Label variant="gold" className="tracking-widest">PROXIMOS</Label>
                {futureBookings.map((b, i) => {
                  const bDate = new Date(b.date);
                  return (
                    <motion.div key={b.id} {...listItem(i)}>
                      <Card variant="elevated">
                        <CardBody>
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-6">
                              <div>
                                <Text className="font-medium">
                                  {bDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                </Text>
                                <Label className="text-warm-gray">
                                  {formatTime(b.start_time)} - {formatTime(b.end_time)}
                                </Label>
                              </div>
                              {b.config_title && (
                                <Label className="text-warm-gray/60">{b.config_title}</Label>
                              )}
                              <Badge variant="gold">Confirmado</Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelBooking(b.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </CardBody>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Past bookings */}
            {pastBookings.length > 0 && (
              <div className="space-y-4">
                <Label className="text-warm-gray/60 tracking-widest">HISTORICO</Label>
                {pastBookings.slice(0, 5).map((b, i) => {
                  const bDate = new Date(b.date);
                  return (
                    <motion.div key={b.id} {...listItem(i)}>
                      <Card>
                        <CardBody>
                          <div className="flex items-center gap-6 opacity-60">
                            <div>
                              <Text className="font-medium">
                                {bDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                              </Text>
                              <Label className="text-warm-gray">
                                {formatTime(b.start_time)} - {formatTime(b.end_time)}
                              </Label>
                            </div>
                            {b.config_title && (
                              <Label className="text-warm-gray/60">{b.config_title}</Label>
                            )}
                            <Badge variant="muted">
                              {b.status === 'cancelled' ? 'Cancelado' : 'Realizado'}
                            </Badge>
                          </div>
                        </CardBody>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
