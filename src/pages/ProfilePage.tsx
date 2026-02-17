import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, Bell, Moon, Shield, ChevronRight, RefreshCw, Camera } from 'lucide-react';
import AvatarCropModal from '@/components/AvatarCropModal';
import { toast } from 'sonner';

const ProfilePage = () => {
  const { user, profile, partnerProfile, relationship, logout, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [daysTogether, setDaysTogether] = useState<number | null>(null);
  const [letterCount, setLetterCount] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [settings, setSettings] = useState<any>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImage, setCropImage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user || !relationship) return;
    loadStats();
  }, [user, relationship]);

  const loadStats = async () => {
    if (!relationship) return;

    const { data: s } = await supabase
      .from('relationship_settings')
      .select('*')
      .eq('relationship_id', relationship.id)
      .maybeSingle();
    setSettings(s);

    if (s?.relationship_start_date) {
      const diff = Math.floor((Date.now() - new Date(s.relationship_start_date).getTime()) / 86400000);
      setDaysTogether(diff);
    }

    const { count } = await supabase
      .from('letters')
      .select('*', { count: 'exact', head: true })
      .or(`from_user_id.eq.${user!.id},to_user_id.eq.${user!.id}`);
    setLetterCount(count || 0);

    const { data: habits } = await supabase
      .from('user_habits')
      .select('best_streak')
      .eq('user_id', user!.id);
    if (habits && habits.length > 0) {
      setBestStreak(Math.max(...habits.map((h: any) => h.best_streak || 0)));
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleReonboard = async () => {
    await supabase.from('profiles').update({ onboarding_completed: false }).eq('user_id', user!.id);
    await refreshProfile();
    navigate('/onboarding');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropImage(reader.result as string);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropComplete = async (blob: Blob) => {
    setCropModalOpen(false);
    if (!user) return;

    const filePath = `${user.id}/avatar.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, blob, { upsert: true, contentType: 'image/jpeg' });

    if (uploadError) {
      toast.error('Error al subir la imagen');
      return;
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('user_id', user.id);
    await refreshProfile();
    toast.success('Foto de perfil actualizada 📸');
  };

  const menuItems = [
    { icon: RefreshCw, label: 'Actualizar mis hábitos', desc: 'Reconfigurar onboarding', action: handleReonboard },
    { icon: Bell, label: 'Notificaciones', desc: settings?.habit_review_time ? `Revisión a las ${settings.habit_review_time}` : 'Configurar' },
    { icon: Moon, label: 'Modo espiritual', desc: settings?.spiritual_mode ? 'Activado' : 'Desactivado' },
    { icon: Shield, label: 'Privacidad', desc: 'Solo tu pareja' },
  ];

  return (
    <div className="min-h-screen pb-24 px-5 pt-14">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">Perfil</h1>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-6 p-6 rounded-3xl gradient-warm shadow-float">
        <div className="flex items-center gap-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="relative w-16 h-16 rounded-2xl bg-background/30 flex items-center justify-center text-3xl overflow-hidden group"
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full rounded-2xl object-cover" />
            ) : '👤'}
            <div className="absolute inset-0 bg-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
              <Camera size={18} className="text-background" />
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
          <div>
            <h2 className="text-xl font-bold text-foreground">{profile?.name || 'Usuario'}</h2>
            <p className="text-foreground/60 text-sm">{user?.email}</p>
          </div>
        </div>
        {partnerProfile && (
          <div className="mt-4 pt-4 border-t border-foreground/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-background/30 flex items-center justify-center text-lg overflow-hidden">
              {partnerProfile.avatar_url ? (
                <img src={partnerProfile.avatar_url} alt="" className="w-full h-full rounded-xl object-cover" />
              ) : '💛'}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Vinculado con {partnerProfile.name}</p>
            </div>
          </div>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-5 grid grid-cols-3 gap-3">
        {[
          { label: 'Días juntos', value: daysTogether !== null ? String(daysTogether) : '—', emoji: '💛' },
          { label: 'Cartas', value: String(letterCount), emoji: '💌' },
          { label: 'Mejor racha', value: String(bestStreak), emoji: '🔥' },
        ].map((s, i) => (
          <div key={i} className="p-4 rounded-2xl bg-card border border-border shadow-card text-center">
            <span className="text-lg">{s.emoji}</span>
            <p className="text-xl font-bold text-foreground mt-1">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-5 rounded-3xl bg-card border border-border shadow-card overflow-hidden">
        {menuItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <button
              key={i}
              onClick={item.action}
              className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors border-b border-border last:border-0"
            >
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                <Icon size={18} className="text-accent-foreground" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
          );
        })}
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        onClick={handleLogout}
        className="mt-5 w-full h-12 rounded-2xl bg-muted text-muted-foreground font-medium text-sm flex items-center justify-center gap-2 hover:bg-destructive/10 hover:text-destructive transition-all"
      >
        <LogOut size={16} /> Cerrar sesión
      </motion.button>

      <AvatarCropModal
        open={cropModalOpen}
        onClose={() => setCropModalOpen(false)}
        imageSrc={cropImage}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};

export default ProfilePage;
