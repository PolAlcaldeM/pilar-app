import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, MessageCircle, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface HabitSummary {
  habit_name: string;
  completed_days: number;
  total_days: number;
  percentage: number;
  user_name: string;
  is_own: boolean;
}

const WeeklySummaryPage = () => {
  const { user, profile, partnerProfile, relationship } = useAuth();
  const [ownSummary, setOwnSummary] = useState<HabitSummary[]>([]);
  const [partnerSummary, setPartnerSummary] = useState<HabitSummary[]>([]);
  const [unregisteredDaysOwn, setUnregisteredDaysOwn] = useState(0);
  const [unregisteredDaysPartner, setUnregisteredDaysPartner] = useState(0);
  const [marked, setMarked] = useState(false);
  const [loading, setLoading] = useState(true);

  const partnerId = relationship
    ? relationship.user1_id === user?.id ? relationship.user2_id : relationship.user1_id
    : null;

  useEffect(() => {
    if (!user || !relationship) return;
    loadSummary();
  }, [user, relationship]);

  const getWeekRange = () => {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { monday, sunday, mondayStr: monday.toISOString().split('T')[0], sundayStr: sunday.toISOString().split('T')[0] };
  };

  const loadUserSummary = async (userId: string, userName: string, isOwn: boolean) => {
    const { mondayStr, sundayStr } = getWeekRange();
    const now = new Date();
    const dayOfWeek = (now.getDay() + 6) % 7; // 0=Mon
    const daysElapsed = Math.min(dayOfWeek + 1, 7);

    const { data: habits } = await supabase
      .from('user_habits')
      .select('id, habit_name')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (!habits || habits.length === 0) return { summaries: [], unregistered: 0 };

    const { data: logs } = await supabase
      .from('daily_habit_logs')
      .select('habit_id, completed, date')
      .eq('user_id', userId)
      .gte('date', mondayStr)
      .lte('date', sundayStr);

    const logsByHabit = new Map<string, { completed: number; total: number }>();
    const datesWithLogs = new Set((logs || []).map((l: any) => l.date));

    habits.forEach((h: any) => {
      const habitLogs = (logs || []).filter((l: any) => l.habit_id === h.id);
      const completed = habitLogs.filter((l: any) => l.completed).length;
      logsByHabit.set(h.id, { completed, total: habitLogs.length });
    });

    const summaries: HabitSummary[] = habits.map((h: any) => {
      const data = logsByHabit.get(h.id) || { completed: 0, total: 0 };
      return {
        habit_name: h.habit_name,
        completed_days: data.completed,
        total_days: daysElapsed,
        percentage: daysElapsed > 0 ? Math.round((data.completed / daysElapsed) * 100) : 0,
        user_name: userName,
        is_own: isOwn,
      };
    });

    const unregistered = daysElapsed - datesWithLogs.size;
    return { summaries, unregistered };
  };

  const loadSummary = async () => {
    const ownResult = await loadUserSummary(user!.id, profile?.name || 'Tú', true);
    setOwnSummary(ownResult.summaries);
    setUnregisteredDaysOwn(ownResult.unregistered);

    if (partnerId && partnerId !== user!.id) {
      const partnerResult = await loadUserSummary(partnerId, partnerProfile?.name || 'Tu pareja', false);
      setPartnerSummary(partnerResult.summaries);
      setUnregisteredDaysPartner(partnerResult.unregistered);
    }

    // Check if already marked
    const { mondayStr, sundayStr } = getWeekRange();
    const { data: existing } = await supabase
      .from('weekly_summaries')
      .select('id')
      .eq('relationship_id', relationship!.id)
      .eq('week_start', mondayStr)
      .maybeSingle();

    if (existing) setMarked(true);
    setLoading(false);
  };

  const handleMarkConversed = async () => {
    const { mondayStr, sundayStr } = getWeekRange();
    await supabase.from('weekly_summaries').upsert({
      relationship_id: relationship!.id,
      week_start: mondayStr,
      week_end: sundayStr,
      summary_text: 'Conversado',
    }, { onConflict: 'relationship_id,week_start' });
    setMarked(true);
    toast.success('¡Marcado como conversado! 💛');
  };

  const positives = (summaries: HabitSummary[]) => summaries.filter((s) => s.percentage >= 80);
  const warnings = (summaries: HabitSummary[]) => summaries.filter((s) => s.percentage < 50);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Cargando resumen...</div>
      </div>
    );
  }

  const allPositives = [...positives(ownSummary), ...positives(partnerSummary)];
  const allWarnings = [...warnings(ownSummary), ...warnings(partnerSummary)];

  return (
    <div className="min-h-screen pb-24 px-5 pt-14">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">Resumen de la Semana</h1>
        <p className="text-muted-foreground text-sm mt-1">Vuestro progreso juntos 💛</p>
      </motion.div>

      {/* Lo que hiciste bien */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-6 p-5 rounded-3xl bg-card border border-border shadow-card"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-success" />
          <span className="text-sm font-semibold text-foreground">Lo que hiciste bien 💛</span>
        </div>
        {allPositives.length > 0 ? (
          <div className="space-y-2">
            {allPositives.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm text-foreground">{s.user_name}: {s.habit_name}</p>
                  <p className="text-xs text-muted-foreground">{s.completed_days}/{s.total_days} días</p>
                </div>
                <span className="text-sm font-bold text-success">{s.percentage}%</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Esta semana es una oportunidad para mejorar 🌱</p>
        )}
      </motion.div>

      {/* Temas que debéis hablar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-4 p-5 rounded-3xl bg-card border border-border shadow-card"
      >
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle size={16} className="text-love" />
          <span className="text-sm font-semibold text-foreground">Temas que debéis hablar 🕊</span>
        </div>
        {allWarnings.length > 0 || unregisteredDaysOwn > 0 || unregisteredDaysPartner > 0 ? (
          <div className="space-y-3">
            {allWarnings.map((s, i) => (
              <div key={i} className="p-3 rounded-2xl bg-love/10">
                <p className="text-sm text-foreground">
                  {s.user_name} tuvo dificultades con <strong>{s.habit_name}</strong> ({s.completed_days}/{s.total_days} días).
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Quizás es un buen momento para hablar sobre ello con cariño.
                </p>
              </div>
            ))}
            {unregisteredDaysOwn > 0 && (
              <div className="p-3 rounded-2xl bg-muted">
                <p className="text-sm text-foreground">
                  {profile?.name} no registró hábitos {unregisteredDaysOwn} día{unregisteredDaysOwn > 1 ? 's' : ''}.
                </p>
                <p className="text-xs text-muted-foreground mt-1">Podría necesitar apoyo en constancia.</p>
              </div>
            )}
            {unregisteredDaysPartner > 0 && partnerId !== user?.id && (
              <div className="p-3 rounded-2xl bg-muted">
                <p className="text-sm text-foreground">
                  {partnerProfile?.name} no registró hábitos {unregisteredDaysPartner} día{unregisteredDaysPartner > 1 ? 's' : ''}.
                </p>
                <p className="text-xs text-muted-foreground mt-1">Podría necesitar apoyo en constancia.</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">¡Todo en orden esta semana! 🎉</p>
        )}
      </motion.div>

      {/* Mark as conversed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6"
      >
        {marked ? (
          <div className="flex items-center justify-center gap-2 py-4">
            <CheckCircle2 size={18} className="text-success" />
            <span className="text-sm font-medium text-foreground">Ya habéis conversado sobre esta semana</span>
          </div>
        ) : (
          <button
            onClick={handleMarkConversed}
            className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-float"
          >
            Marcar como conversado 💬
          </button>
        )}
      </motion.div>
    </div>
  );
};

export default WeeklySummaryPage;
