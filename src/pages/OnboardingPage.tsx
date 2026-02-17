import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { HABIT_OPTIONS } from '@/data/habitOptions';
import { toast } from 'sonner';
import { Check, Plus, X } from 'lucide-react';

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
];

const REFLECTIVE_QUESTIONS = [
  { id: 'q1', text: '¿Qué hábito te está alejando de la persona que quieres ser?' },
  { id: 'q2', text: '¿Qué hábito te gustaría que tu pareja te ayude a mejorar?' },
  { id: 'q3', text: '¿En qué momento del día sueles fallar más?' },
  { id: 'q4', text: '¿Qué te cuesta más controlar: impulsos, disciplina o emociones?' },
];

const OnboardingPage = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1 fields
  const [partnerEmail, setPartnerEmail] = useState('');
  const [myName, setMyName] = useState(profile?.name || '');
  const [partnerName, setPartnerName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [reviewTime, setReviewTime] = useState('21:00');
  const [spiritualMode, setSpiritualMode] = useState(false);
  const [weeklyReviewDay, setWeeklyReviewDay] = useState(5);

  // Step 2 fields
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  const [customHabit, setCustomHabit] = useState('');
  const [reflections, setReflections] = useState<Record<string, string>>({});

  const toggleHabit = (h: string) => {
    setSelectedHabits((prev) =>
      prev.includes(h) ? prev.filter((x) => x !== h) : prev.length < 10 ? [...prev, h] : prev
    );
  };

  const addCustom = () => {
    const trimmed = customHabit.trim();
    if (!trimmed || selectedHabits.length >= 10) return;
    if (!selectedHabits.includes(trimmed)) {
      setSelectedHabits((prev) => [...prev, trimmed]);
    }
    setCustomHabit('');
  };

  const handleStep1 = async () => {
    if (!myName.trim() || !partnerName.trim() || !startDate || !partnerEmail.trim()) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }
    setLoading(true);
    await supabase.from('profiles').update({ name: myName.trim() }).eq('user_id', user!.id);
    setLoading(false);
    setStep(2);
  };

  const handleFinish = async () => {
    if (selectedHabits.length === 0) {
      toast.error('Selecciona al menos un hábito');
      return;
    }

    setLoading(true);

    try {
      // Find partner by email using auth admin or by checking existing profiles
      let partnerId: string | null = null;
      
      // First check if we already have a relationship
      const { data: existingRels } = await supabase
        .from('relationships')
        .select('id, user1_id, user2_id')
        .or(`user1_id.eq.${user!.id},user2_id.eq.${user!.id}`)
        .maybeSingle();

      let relationshipId: string | null = existingRels?.id || null;

      // If no existing relationship, look for partner by matching profiles
      if (!relationshipId) {
        // Search all profiles except own to find partner by name
        const { data: partnerProfiles } = await supabase
          .from('profiles')
          .select('user_id, name')
          .neq('user_id', user!.id);

        const matchingPartner = partnerProfiles?.find(
          (p: any) => p.name?.toLowerCase() === partnerName.trim().toLowerCase()
        );
        if (matchingPartner) partnerId = matchingPartner.user_id;

        if (partnerId && partnerId !== user!.id) {
          const { data: newRel } = await supabase
            .from('relationships')
            .insert({ user1_id: user!.id, user2_id: partnerId })
            .select('id')
            .single();
          relationshipId = newRel?.id || null;
        }
        // If no partner found, DON'T create a self-referencing relationship
        // The relationship will be created when the partner completes onboarding
      }

      if (relationshipId) {
        const { data: existingSettings } = await supabase
          .from('relationship_settings')
          .select('id')
          .eq('relationship_id', relationshipId)
          .maybeSingle();

        const settingsData = {
          partner1_name: myName.trim(),
          partner2_name: partnerName.trim(),
          relationship_start_date: startDate,
          habit_review_time: reviewTime,
          spiritual_mode: spiritualMode,
          weekly_review_day: weeklyReviewDay,
        };

        if (existingSettings) {
          await supabase.from('relationship_settings').update(settingsData).eq('id', existingSettings.id);
        } else {
          await supabase.from('relationship_settings').insert({ ...settingsData, relationship_id: relationshipId });
        }
      }

      await supabase.from('user_habits').delete().eq('user_id', user!.id);

      const habitsToInsert = selectedHabits.map((h) => ({
        user_id: user!.id,
        habit_name: h,
        is_custom: !HABIT_OPTIONS.includes(h),
      }));
      await supabase.from('user_habits').insert(habitsToInsert);

      await supabase.from('profiles').update({ onboarding_completed: true }).eq('user_id', user!.id);

      await refreshProfile();
      toast.success('¡Todo listo! Bienvenido a Pilar 💛');
      navigate('/home');
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar. Inténtalo de nuevo.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen px-5 pt-14 pb-10 bg-background">
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h1 className="text-2xl font-bold text-foreground">Vamos a conoceros mejor 💛</h1>
            <p className="text-muted-foreground text-sm mt-2">Paso 1 de 2 · Información de pareja</p>

            <div className="mt-8 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Tu nombre</label>
                <input value={myName} onChange={(e) => setMyName(e.target.value)} className="w-full h-12 px-4 rounded-2xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm" placeholder="Tu nombre" maxLength={50} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Email de tu pareja</label>
                <input type="email" value={partnerEmail} onChange={(e) => setPartnerEmail(e.target.value)} className="w-full h-12 px-4 rounded-2xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm" placeholder="pareja@email.com" maxLength={255} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Nombre de tu pareja</label>
                <input value={partnerName} onChange={(e) => setPartnerName(e.target.value)} className="w-full h-12 px-4 rounded-2xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm" placeholder="Nombre de tu pareja" maxLength={50} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Fecha de inicio de la relación</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full h-12 px-4 rounded-2xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Hora de revisión diaria</label>
                <input type="time" value={reviewTime} onChange={(e) => setReviewTime(e.target.value)} className="w-full h-12 px-4 rounded-2xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Día de resumen semanal</label>
                <select
                  value={weeklyReviewDay}
                  onChange={(e) => setWeeklyReviewDay(Number(e.target.value))}
                  className="w-full h-12 px-4 rounded-2xl bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">Enfoque espiritual</p>
                  <p className="text-xs text-muted-foreground">Incluir pilares espirituales</p>
                </div>
                <button onClick={() => setSpiritualMode(!spiritualMode)} className={`w-12 h-7 rounded-full transition-colors ${spiritualMode ? 'bg-primary' : 'bg-muted'}`}>
                  <motion.div animate={{ x: spiritualMode ? 22 : 2 }} className="w-5 h-5 rounded-full bg-card shadow" />
                </button>
              </div>
            </div>

            <motion.button whileTap={{ scale: 0.97 }} onClick={handleStep1} disabled={loading} className="mt-8 w-full h-14 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-float disabled:opacity-50">
              {loading ? '...' : 'Siguiente →'}
            </motion.button>
          </motion.div>
        ) : (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <button onClick={() => setStep(1)} className="text-sm text-muted-foreground mb-4">← Volver</button>
            <h1 className="text-2xl font-bold text-foreground">¿Qué quieres mejorar? 🌱</h1>
            <p className="text-muted-foreground text-sm mt-2">Paso 2 de 2 · Selecciona hasta 10 hábitos ({selectedHabits.length}/10)</p>

            {/* Reflective questions */}
            <div className="mt-6 space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Reflexiona primero (opcional)</p>
              {REFLECTIVE_QUESTIONS.map((q) => (
                <div key={q.id} className="p-4 rounded-2xl bg-card border border-border">
                  <p className="text-sm text-foreground mb-2">{q.text}</p>
                  <input
                    value={reflections[q.id] || ''}
                    onChange={(e) => setReflections((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    placeholder="Tu respuesta..."
                    maxLength={200}
                    className="w-full h-10 px-3 rounded-xl bg-muted border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                  />
                </div>
              ))}
            </div>

            {/* Habit selection */}
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-6 mb-3">Selecciona tus hábitos</p>
            <div className="flex flex-wrap gap-2">
              {HABIT_OPTIONS.map((h) => {
                const selected = selectedHabits.includes(h);
                return (
                  <button
                    key={h}
                    onClick={() => toggleHabit(h)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1 ${
                      selected ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-foreground hover:bg-muted'
                    }`}
                  >
                    {selected && <Check size={12} />}
                    {h}
                  </button>
                );
              })}
            </div>

            {/* Custom habit */}
            <div className="mt-4 flex gap-2">
              <input value={customHabit} onChange={(e) => setCustomHabit(e.target.value)} placeholder="Añadir hábito personalizado..." maxLength={50} className="flex-1 h-10 px-4 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm" onKeyDown={(e) => e.key === 'Enter' && addCustom()} />
              <button onClick={addCustom} className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Plus size={16} className="text-primary-foreground" />
              </button>
            </div>

            {selectedHabits.filter((h) => !HABIT_OPTIONS.includes(h)).length > 0 && (
              <div className="mt-3 space-y-1">
                <p className="text-xs text-muted-foreground">Personalizados:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedHabits.filter((h) => !HABIT_OPTIONS.includes(h)).map((h) => (
                    <span key={h} className="px-3 py-1.5 rounded-xl text-xs font-medium bg-accent text-accent-foreground flex items-center gap-1">
                      {h}
                      <button onClick={() => toggleHabit(h)}><X size={12} /></button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <motion.button whileTap={{ scale: 0.97 }} onClick={handleFinish} disabled={loading || selectedHabits.length === 0} className="mt-8 w-full h-14 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-float disabled:opacity-50">
              {loading ? 'Guardando...' : '¡Empezar! 🚀'}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OnboardingPage;
