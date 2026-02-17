import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPilarDelDia } from '@/data/pilares';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ModalOverlay from '@/components/ModalOverlay';
import { requestNotificationPermission, scheduleDailyNotification, scheduleHabitReminder } from '@/lib/notifications';

const HomePage = () => {
  const { user, profile, partnerProfile, relationship } = useAuth();
  const navigate = useNavigate();
  const pilar = getPilarDelDia();
  const [showReflect, setShowReflect] = useState(false);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  const [daysTogether, setDaysTogether] = useState<number | null>(null);
  const [bestStreak, setBestStreak] = useState(0);
  const [unreadLetters, setUnreadLetters] = useState(0);
  const [weekProgress, setWeekProgress] = useState<number | null>(null);

  useEffect(() => {
    if (!user || !relationship) return;

    const loadData = async () => {
      const { data: settings } = await supabase
        .from('relationship_settings')
        .select('relationship_start_date, habit_review_time')
        .eq('relationship_id', relationship.id)
        .maybeSingle();

      if (settings?.relationship_start_date) {
        const start = new Date(settings.relationship_start_date);
        const diff = Math.floor((Date.now() - start.getTime()) / 86400000);
        setDaysTogether(diff);
      }

      // Request notification permission and schedule daily notifications
      const granted = await requestNotificationPermission();
      if (granted) {
        // Schedule daily motivational phrase at 8:00
        scheduleDailyNotification(8, 0);
        // Schedule habit reminder at configured time
        if (settings?.habit_review_time) {
          scheduleHabitReminder(settings.habit_review_time);
        }
      }

      const { data: habits } = await supabase
        .from('user_habits')
        .select('best_streak')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (habits && habits.length > 0) {
        setBestStreak(Math.max(...habits.map((h: any) => h.best_streak || 0)));
      }

      const { count } = await supabase
        .from('letters')
        .select('*', { count: 'exact', head: true })
        .eq('to_user_id', user.id)
        .eq('is_read', false);
      setUnreadLetters(count || 0);

      const today = new Date();
      const monday = new Date(today);
      monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
      const mondayStr = monday.toISOString().split('T')[0];

      const { data: logs } = await supabase
        .from('daily_habit_logs')
        .select('completed')
        .eq('user_id', user.id)
        .gte('date', mondayStr);

      if (logs && logs.length > 0) {
        const completed = logs.filter((l: any) => l.completed).length;
        setWeekProgress(Math.round((completed / logs.length) * 100));
      }
    };

    loadData();
  }, [user, relationship]);

  const handleSave = async () => {
    if (!note.trim() || !user) return;
    await supabase.from('daily_reflections').upsert({
      user_id: user.id,
      pilar_id: pilar.id,
      content: note.trim(),
      date: new Date().toISOString().split('T')[0],
    }, { onConflict: 'user_id,date' });
    setSaved(true);
    setTimeout(() => { setShowReflect(false); setSaved(false); setNote(''); }, 2000);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="min-h-screen pb-24 px-5 pt-14">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p className="text-muted-foreground text-sm">{greeting},</p>
        <h1 className="text-2xl font-bold text-foreground mt-0.5">{profile?.name || 'Amigo'} 💛</h1>
        {partnerProfile && (
          <p className="text-muted-foreground text-xs mt-1">Conectado con {partnerProfile.name}</p>
        )}
      </motion.div>

      {/* Pilar del día */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="mt-8 p-6 rounded-3xl bg-card border border-border shadow-card"
      >
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={14} className="text-primary" style={{ color: 'hsl(45 100% 50%)' }} />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pilar del día</span>
        </div>
        <div className="text-5xl mt-4 mb-3">{pilar.emoji}</div>
        <h2 className="text-xl font-bold text-foreground">{pilar.titulo}</h2>
        <p className="text-muted-foreground text-sm mt-2 leading-relaxed">{pilar.frase}</p>
        {pilar.categoria === 'mandamiento' && (
          <span className="inline-block mt-3 px-3 py-1 rounded-full bg-love/30 text-love-foreground text-xs font-medium">✨ Inspiración espiritual</span>
        )}
        <button onClick={() => setShowReflect(true)} className="mt-5 w-full h-12 rounded-2xl bg-accent text-accent-foreground font-medium text-sm flex items-center justify-center gap-2 hover:brightness-95 transition-all">
          <MessageCircle size={16} /> Reflexionar juntos
        </button>
      </motion.div>

      {/* Reflexión modal */}
      <ModalOverlay open={showReflect} onClose={() => setShowReflect(false)} position="center">
        <h3 className="text-lg font-bold text-foreground mb-1">Reflexión compartida</h3>
        <p className="text-muted-foreground text-xs mb-4">Escribe tu reflexión sobre "{pilar.titulo}"</p>
        {saved ? (
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-center py-8">
            <span className="text-4xl">💛</span>
            <p className="text-foreground font-medium mt-2">¡Reflexión guardada!</p>
            {partnerProfile && <p className="text-muted-foreground text-xs mt-1">{partnerProfile.name} podrá verla</p>}
          </motion.div>
        ) : (
          <>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Escribe lo que sientes..." rows={4} maxLength={1000} className="w-full p-4 rounded-2xl bg-muted border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none text-sm" />
            <button onClick={handleSave} className="mt-3 w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-float">Guardar reflexión</button>
          </>
        )}
      </ModalOverlay>

      {/* Dynamic stats */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }} className="mt-5 grid grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-card border border-border shadow-card">
          <span className="text-2xl">💛</span>
          <p className="text-2xl font-bold text-foreground mt-1">{daysTogether !== null ? daysTogether : '—'}</p>
          <p className="text-muted-foreground text-xs">Días juntos</p>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-border shadow-card">
          <span className="text-2xl">🔥</span>
          <p className="text-2xl font-bold text-foreground mt-1">{bestStreak || '—'}</p>
          <p className="text-muted-foreground text-xs">Mejor racha</p>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-border shadow-card cursor-pointer" onClick={() => navigate('/letters')}>
          <span className="text-2xl">💌</span>
          <p className="text-2xl font-bold text-foreground mt-1">{unreadLetters}</p>
          <p className="text-muted-foreground text-xs">Cartas sin leer</p>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-border shadow-card cursor-pointer" onClick={() => navigate('/summary')}>
          <span className="text-2xl">📊</span>
          <p className="text-2xl font-bold text-foreground mt-1">{weekProgress !== null ? `${weekProgress}%` : '—'}</p>
          <p className="text-muted-foreground text-xs">Progreso semanal</p>
        </div>
      </motion.div>
    </div>
  );
};

export default HomePage;
