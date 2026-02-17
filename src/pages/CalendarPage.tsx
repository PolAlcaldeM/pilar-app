import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import ModalOverlay from '@/components/ModalOverlay';

interface EventRow {
  id: string;
  created_by: string;
  title: string;
  date: string;
  event_type: string;
}

const TYPE_CONFIG: Record<string, { emoji: string; color: string }> = {
  espiritual: { emoji: '🙏', color: 'bg-accent' },
  cita: { emoji: '❤️', color: 'bg-love/30' },
  importante: { emoji: '⭐', color: 'bg-primary/20' },
  personalizado: { emoji: '📌', color: 'bg-muted' },
};

const CalendarPage = () => {
  const { user, partnerProfile, relationship } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('cita');
  const [events, setEvents] = useState<EventRow[]>([]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const adjustedFirst = firstDay === 0 ? 6 : firstDay - 1;
  const monthName = currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const todayDate = new Date();
  const isCurrentMonth = todayDate.getMonth() === month && todayDate.getFullYear() === year;

  useEffect(() => {
    if (!relationship) return;
    loadEvents();
    const channel = supabase
      .channel('events-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shared_events' }, () => loadEvents())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [relationship, currentMonth]);

  const loadEvents = async () => {
    if (!relationship) return;
    const startOfMonth = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endOfMonth = `${year}-${String(month + 1).padStart(2, '0')}-${daysInMonth}`;
    const { data } = await supabase
      .from('shared_events')
      .select('*')
      .eq('relationship_id', relationship.id)
      .gte('date', startOfMonth)
      .lte('date', endOfMonth);
    setEvents((data as EventRow[]) || []);
  };

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter((e) => e.date === dateStr);
  };

  const handleAdd = async () => {
    if (!newTitle.trim() || !user || !relationship || selectedDay === null) return;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    await supabase.from('shared_events').insert({
      created_by: user.id,
      relationship_id: relationship.id,
      title: newTitle.trim(),
      date: dateStr,
      event_type: newType,
    });
    toast.success('Evento añadido 📅');
    setNewTitle('');
    setShowAdd(false);
  };

  return (
    <div className="min-h-screen pb-24 px-5 pt-14">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Calendario</h1>
          <button
            onClick={() => { if (selectedDay) setShowAdd(true); else toast.info('Selecciona un día primero'); }}
            className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-float"
          >
            <Plus size={18} className="text-primary-foreground" />
          </button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mt-6 flex items-center justify-between">
        <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
          <ChevronLeft size={16} className="text-muted-foreground" />
        </button>
        <h2 className="text-base font-semibold text-foreground capitalize">{monthName}</h2>
        <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
          <ChevronRight size={16} className="text-muted-foreground" />
        </button>
      </motion.div>

      <div className="grid grid-cols-7 gap-1 mt-4 mb-2">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-muted-foreground">{d}</div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid grid-cols-7 gap-1">
        {Array.from({ length: adjustedFirst }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayEvents = getEventsForDay(day);
          const isToday = isCurrentMonth && day === todayDate.getDate();
          const isSelected = day === selectedDay;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day === selectedDay ? null : day)}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition-all relative ${
                isSelected ? 'bg-primary text-primary-foreground font-bold'
                  : isToday ? 'bg-accent text-accent-foreground font-semibold'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              {day}
              {dayEvents.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {dayEvents.slice(0, 3).map((e) => (
                    <div key={e.id} className={`w-1 h-1 rounded-full ${e.created_by === user?.id ? 'bg-primary' : 'bg-love'}`} style={isSelected ? { backgroundColor: 'hsl(var(--primary-foreground))' } : undefined} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </motion.div>

      <AnimatePresence>
        {selectedDay && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 space-y-2">
            {getEventsForDay(selectedDay).length > 0 ? (
              getEventsForDay(selectedDay).map((e) => {
                const cfg = TYPE_CONFIG[e.event_type] || TYPE_CONFIG.personalizado;
                return (
                  <div key={e.id} className={`p-4 rounded-2xl border border-border shadow-card flex items-center gap-3 ${cfg.color}`}>
                    <span className="text-xl">{cfg.emoji}</span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{e.title}</p>
                      <p className="text-xs text-muted-foreground">Por {e.created_by === user?.id ? 'ti' : partnerProfile?.name || 'tu pareja'}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Sin eventos este día</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add event modal - using ModalOverlay for proper z-index */}
      <ModalOverlay open={showAdd} onClose={() => setShowAdd(false)} position="center">
        <h3 className="text-lg font-bold text-foreground mb-4">Nuevo evento · {selectedDay} {monthName}</h3>
        <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Nombre del evento" maxLength={100} className="w-full h-12 px-4 rounded-2xl bg-muted border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
        <div className="flex gap-2 mt-4">
          {Object.entries(TYPE_CONFIG).map(([t, cfg]) => (
            <button key={t} onClick={() => setNewType(t)} className={`flex-1 h-11 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all capitalize ${newType === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {cfg.emoji} {t}
            </button>
          ))}
        </div>
        <button onClick={handleAdd} className="mt-4 w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-float">Añadir evento</button>
      </ModalOverlay>
    </div>
  );
};

export default CalendarPage;
