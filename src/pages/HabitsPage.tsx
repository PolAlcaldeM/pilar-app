import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Check, X, TrendingUp, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface HabitWithLog {
  id: string;
  habit_name: string;
  current_streak: number;
  best_streak: number;
  todayLog?: boolean;
}

const HabitsPage = () => {
  const { user, profile, partnerProfile, relationship } = useAuth();
  const [habits, setHabits] = useState<HabitWithLog[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [weekData, setWeekData] = useState<{ day: string; value: number }[]>([]);
  const [isLocked, setIsLocked] = useState(true);
  const [reviewTime, setReviewTime] = useState('21:00');
  const [countdown, setCountdown] = useState('');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!user || !relationship) return;
    loadSettings();
    loadHabits();
    loadWeekData();
  }, [user, relationship]);

  useEffect(() => {
    const interval = setInterval(() => {
      updateLockStatus();
    }, 1000);
    return () => clearInterval(interval);
  }, [reviewTime]);

  const loadSettings = async () => {
    if (!relationship) return;
    const { data: s } = await supabase
      .from('relationship_settings')
      .select('habit_review_time')
      .eq('relationship_id', relationship.id)
      .maybeSingle();
    if (s?.habit_review_time) {
      setReviewTime(s.habit_review_time);
    }
  };

  const updateLockStatus = () => {
    const now = new Date();
    const [h, m] = reviewTime.split(':').map(Number);
    const target = new Date(now);
    target.setHours(h, m, 0, 0);

    if (now >= target) {
      setIsLocked(false);
      setCountdown('');
    } else {
      setIsLocked(true);
      const diff = target.getTime() - now.getTime();
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setCountdown(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
    }
  };

  const loadHabits = async () => {
    const { data: userHabits } = await supabase
      .from('user_habits')
      .select('*')
      .eq('user_id', user!.id)
      .eq('is_active', true);

    if (!userHabits || userHabits.length === 0) {
      setHabits([]);
      setLoading(false);
      return;
    }

    const { data: todayLogs } = await supabase
      .from('daily_habit_logs')
      .select('habit_id, completed')
      .eq('user_id', user!.id)
      .eq('date', today);

    const logMap = new Map((todayLogs || []).map((l: any) => [l.habit_id, l.completed]));

    const merged = userHabits.map((h: any) => ({
      id: h.id,
      habit_name: h.habit_name,
      current_streak: h.current_streak,
      best_streak: h.best_streak,
      todayLog: logMap.has(h.id) ? logMap.get(h.id) : undefined,
    }));

    setHabits(merged);
    setSubmitted(merged.every((h) => h.todayLog !== undefined));
    setLoading(false);
  };

  const loadWeekData = async () => {
    const now = new Date();
    const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));

    const result: { day: string; value: number }[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];

      if (d > now) {
        result.push({ day: days[i], value: 0 });
        continue;
      }

      const { data: logs } = await supabase
        .from('daily_habit_logs')
        .select('completed')
        .eq('user_id', user!.id)
        .eq('date', dateStr);

      if (!logs || logs.length === 0) {
        result.push({ day: days[i], value: -1 });
      } else {
        const completed = logs.filter((l: any) => l.completed).length;
        result.push({ day: days[i], value: Math.round((completed / logs.length) * 100) });
      }
    }

    setWeekData(result);
  };

  const handleAnswer = async (habitId: string, completed: boolean) => {
    setHabits((prev) =>
      prev.map((h) => (h.id === habitId ? { ...h, todayLog: completed } : h))
    );

    await supabase.from('daily_habit_logs').upsert(
      { user_id: user!.id, habit_id: habitId, date: today, completed },
      { onConflict: 'user_id,habit_id,date' }
    );

    if (completed) {
      const habit = habits.find((h) => h.id === habitId);
      if (habit) {
        const newStreak = habit.current_streak + 1;
        const newBest = Math.max(newStreak, habit.best_streak);
        await supabase.from('user_habits').update({ current_streak: newStreak, best_streak: newBest }).eq('id', habitId);
        setHabits((prev) => prev.map((h) => h.id === habitId ? { ...h, current_streak: newStreak, best_streak: newBest } : h));
      }
    } else {
      await supabase.from('user_habits').update({ current_streak: 0 }).eq('id', habitId);
      setHabits((prev) => prev.map((h) => h.id === habitId ? { ...h, current_streak: 0 } : h));
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
    toast.success('Revisión diaria guardada 💛');
    loadWeekData();
  };

  const allAnswered = habits.length > 0 && habits.every((h) => h.todayLog !== undefined);
  const positives = habits.filter((h) => h.todayLog === true).length;
  const score = habits.length > 0 ? Math.round((positives / habits.length) * 100) : 0;
  const semaforo = score >= 80 ? 'verde' : score >= 50 ? 'amarillo' : 'rojo';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <div className="min-h-screen pb-24 px-5 pt-14">
        <h1 className="text-2xl font-bold text-foreground">Nuestros hábitos</h1>
        <div className="mt-10 text-center">
          <span className="text-5xl">🌱</span>
          <p className="text-foreground font-medium mt-4">No tienes hábitos configurados</p>
          <p className="text-muted-foreground text-sm mt-2">Ve a Perfil → Actualizar mis hábitos para empezar</p>
        </div>
      </div>
    );
  }

  // Locked screen
  if (isLocked) {
    return (
      <div className="min-h-screen pb-24 px-5 pt-14">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Nuestros hábitos</h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-12 p-8 rounded-3xl bg-card border border-border shadow-card text-center"
        >
          <div className="w-16 h-16 rounded-full bg-accent mx-auto flex items-center justify-center mb-4">
            <Clock size={28} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Aún no es momento 💛</h2>
          <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
            Habéis elegido revisar vuestros hábitos a las {reviewTime}.
            <br />La constancia también es respetar el proceso.
          </p>
          <div className="mt-6 text-4xl font-bold text-foreground font-sans tracking-wider">
            {countdown}
          </div>
          <p className="text-xs text-muted-foreground mt-2">para tu revisión diaria</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-5 pt-14">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">Nuestros hábitos</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Hoy cuenta 💛 · {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </motion.div>

      {/* Weekly progress */}
      {weekData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 p-5 rounded-3xl bg-card border border-border shadow-card"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-success" />
            <span className="text-sm font-medium text-foreground">Progreso semanal</span>
          </div>
          <div className="flex items-end justify-between gap-1 h-20">
            {weekData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-lg bg-muted overflow-hidden" style={{ height: '60px' }}>
                  {d.value >= 0 ? (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${d.value}%` }}
                      transition={{ delay: 0.2 + i * 0.05, duration: 0.4 }}
                      className="w-full rounded-lg"
                      style={{
                        background: d.value >= 80 ? 'hsl(var(--success))' : d.value >= 50 ? 'hsl(var(--primary))' : 'hsl(var(--love))',
                        position: 'relative',
                        top: `${100 - d.value}%`,
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-[8px] text-muted-foreground">—</span>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">{d.day}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Questions */}
      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div key="questions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-5 space-y-3">
            {habits.map((h, i) => (
              <motion.div
                key={h.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.06 }}
                className="p-4 rounded-2xl bg-card border border-border shadow-card flex items-center justify-between gap-3"
              >
                <div className="flex-1">
                  <p className="text-sm text-foreground">{h.habit_name}</p>
                  {h.current_streak > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">🔥 {h.current_streak} días</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAnswer(h.id, true)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      h.todayLog === true ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground hover:bg-success/20'
                    }`}
                  >
                    <Check size={18} />
                  </button>
                  <button
                    onClick={() => handleAnswer(h.id, false)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      h.todayLog === false ? 'bg-love text-love-foreground' : 'bg-muted text-muted-foreground hover:bg-love/20'
                    }`}
                  >
                    <X size={18} />
                  </button>
                </div>
              </motion.div>
            ))}

            {allAnswered && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleSubmit}
                className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-float mt-4"
              >
                Enviar revisión
              </motion.button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 p-6 rounded-3xl bg-card border border-border shadow-card text-center"
          >
            <div className="text-5xl mb-3">
              {semaforo === 'verde' ? '🟢' : semaforo === 'amarillo' ? '🟡' : '🔴'}
            </div>
            <h3 className="text-lg font-bold text-foreground">Resumen del día</h3>
            <p className="text-3xl font-bold text-foreground mt-2">{score}%</p>
            <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
              {score >= 80
                ? `¡Hoy creciste en disciplina 💪 Gran día, ${profile?.name}!`
                : score >= 50
                ? 'Buen esfuerzo hoy. Hay espacio para mejorar, pero cada paso cuenta.'
                : 'Hoy fue un día difícil. No es para juzgar, es para apoyarse. Mañana será mejor 💛'}
            </p>
            {partnerProfile && (
              <p className="text-xs text-muted-foreground mt-4">
                Esperando a que {partnerProfile.name} complete su revisión...
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HabitsPage;
