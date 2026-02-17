import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PenLine, Lock, Eye, Send } from 'lucide-react';
import { toast } from 'sonner';
import ModalOverlay from '@/components/ModalOverlay';

interface LetterRow {
  id: string;
  from_user_id: string;
  to_user_id: string;
  content: string;
  is_public: boolean;
  is_read: boolean;
  created_at: string;
}

const LettersPage = () => {
  const { user, partnerProfile, relationship } = useAuth();
  const [showWrite, setShowWrite] = useState(false);
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [letters, setLetters] = useState<LetterRow[]>([]);
  const [loading, setLoading] = useState(true);

  const partnerId = relationship
    ? relationship.user1_id === user?.id ? relationship.user2_id : relationship.user1_id
    : null;

  useEffect(() => {
    if (!user) return;
    loadLetters();
    const channel = supabase
      .channel('letters-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'letters' }, () => loadLetters())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const loadLetters = async () => {
    const { data } = await supabase.from('letters').select('*').order('created_at', { ascending: false });
    setLetters((data as LetterRow[]) || []);
    setLoading(false);
  };

  const handleSend = async () => {
    if (!content.trim() || !user || !partnerId) return;
    await supabase.from('letters').insert({
      from_user_id: user.id,
      to_user_id: partnerId,
      content: content.trim(),
      is_public: isPublic,
    });
    toast.success(isPublic ? `Carta enviada a ${partnerProfile?.name || 'tu pareja'} 💌` : 'Carta privada guardada.');
    setContent('');
    setShowWrite(false);
  };

  const handleUnlock = async (letter: LetterRow) => {
    if (letter.to_user_id === user?.id && !letter.is_read) {
      await supabase.from('letters').update({ is_read: true }).eq('id', letter.id);
      loadLetters();
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen pb-24 px-5 pt-14">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">Cartas</h1>
        <p className="text-muted-foreground text-sm mt-1">Vuestro espacio privado de palabras</p>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onClick={() => setShowWrite(true)}
        className="mt-6 w-full p-5 rounded-3xl gradient-warm flex items-center gap-4 shadow-float"
      >
        <div className="w-12 h-12 rounded-2xl bg-background/30 flex items-center justify-center">
          <PenLine size={20} className="text-foreground" />
        </div>
        <div className="text-left">
          <p className="font-semibold text-foreground text-sm">Escribir carta</p>
          <p className="text-foreground/60 text-xs">Expresa lo que sientes</p>
        </div>
      </motion.button>

      <div className="mt-6 space-y-3">
        {loading ? (
          <p className="text-center text-muted-foreground text-sm py-8">Cargando...</p>
        ) : letters.length === 0 ? (
          <div className="text-center py-10">
            <span className="text-4xl">💌</span>
            <p className="text-foreground font-medium mt-3">Aún no hay cartas</p>
            <p className="text-muted-foreground text-sm mt-1">Escribe la primera</p>
          </div>
        ) : (
          letters.map((letter, i) => {
            const isMine = letter.from_user_id === user?.id;
            const canRead = letter.is_public || isMine || letter.is_read;
            return (
              <motion.div
                key={letter.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.04 }}
                className="p-5 rounded-2xl bg-card border border-border shadow-card"
                onClick={() => !canRead && handleUnlock(letter)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{isMine ? '✍️' : '💌'}</span>
                    <span className="text-sm font-medium text-foreground">
                      {isMine ? 'Tú' : partnerProfile?.name || 'Tu pareja'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!letter.is_public && <Lock size={12} className="text-muted-foreground" />}
                    <span className="text-xs text-muted-foreground">{formatDate(letter.created_at)}</span>
                  </div>
                </div>
                {canRead ? (
                  <p className="text-sm text-foreground/80 leading-relaxed">{letter.content}</p>
                ) : (
                  <div className="flex items-center gap-2 py-2 cursor-pointer">
                    <Lock size={14} className="text-love" />
                    <p className="text-sm text-love-foreground italic">Carta privada · Toca para desbloquear</p>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* Write modal using ModalOverlay */}
      <ModalOverlay open={showWrite} onClose={() => setShowWrite(false)} position="center">
        <h3 className="text-lg font-bold text-foreground mb-1">Nueva carta</h3>
        <p className="text-muted-foreground text-xs mb-4">Para {partnerProfile?.name || 'tu pareja'} 💛</p>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Querida/o..."
          rows={6}
          maxLength={2000}
          className="w-full p-4 rounded-2xl bg-muted border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none text-sm font-serif leading-relaxed"
        />
        <div className="flex items-center gap-3 mt-4">
          <button onClick={() => setIsPublic(true)} className={`flex-1 h-11 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${isPublic ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            <Eye size={14} /> Pública
          </button>
          <button onClick={() => setIsPublic(false)} className={`flex-1 h-11 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${!isPublic ? 'bg-love text-love-foreground' : 'bg-muted text-muted-foreground'}`}>
            <Lock size={14} /> Privada
          </button>
        </div>
        <button onClick={handleSend} className="mt-3 w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-float flex items-center justify-center gap-2">
          <Send size={16} /> Enviar carta
        </button>
      </ModalOverlay>
    </div>
  );
};

export default LettersPage;
