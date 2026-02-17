import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { sendLocalNotification } from '@/lib/notifications';

const STORAGE_KEY = 'missyou_pos';
const MARGIN_BOTTOM = 100;
const BUTTON_SIZE = 56;
const EDGE_MARGIN = 12;

const MissYouButton = () => {
  const { user, profile, partnerProfile, relationship } = useAuth();
  const [sent, setSent] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const constraintsRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const partnerId = relationship
    ? relationship.user1_id === user?.id ? relationship.user2_id : relationship.user1_id
    : null;

  useEffect(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_${user?.id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPos(parsed);
      } catch {}
    } else {
      setPos({ x: window.innerWidth - BUTTON_SIZE - EDGE_MARGIN, y: window.innerHeight - MARGIN_BOTTOM - BUTTON_SIZE });
    }
  }, [user]);

  const snapToEdge = (x: number, y: number) => {
    const maxX = window.innerWidth - BUTTON_SIZE - EDGE_MARGIN;
    const maxY = window.innerHeight - MARGIN_BOTTOM - BUTTON_SIZE;
    const minY = EDGE_MARGIN;
    const snappedX = x < window.innerWidth / 2 ? EDGE_MARGIN : maxX;
    const snappedY = Math.max(minY, Math.min(y, maxY));
    return { x: snappedX, y: snappedY };
  };

  const handleDragEnd = (_: any, info: any) => {
    const newX = pos.x + info.offset.x;
    const newY = pos.y + info.offset.y;
    const snapped = snapToEdge(newX, newY);
    setPos(snapped);
    localStorage.setItem(`${STORAGE_KEY}_${user?.id}`, JSON.stringify(snapped));
    setTimeout(() => { isDragging.current = false; }, 100);
  };

  const handleSend = async () => {
    if (isDragging.current) return;
    if (!user || !partnerId) return;
    setSent(true);

    await supabase.from('love_notifications').insert({
      sender_id: user.id,
      receiver_id: partnerId,
    });

    // Send local push notification (will show even if app is in background on PWA)
    const name = profile?.name || 'Tu pareja';
    sendLocalNotification(
      `${name} te está pensando 💛`,
      'Alguien especial quiere que sepas que te extraña.',
      'miss-you'
    );

    toast(`${partnerProfile?.name || 'Tu pareja'} recibirá que la estás pensando 💛`, { duration: 3000 });
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <motion.button
      drag
      dragMomentum={false}
      onDragStart={() => { isDragging.current = true; }}
      onDragEnd={handleDragEnd}
      onClick={handleSend}
      animate={{ x: pos.x, y: pos.y }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      whileTap={{ scale: 0.9 }}
      style={{ position: 'fixed', top: 0, left: 0, zIndex: 40, touchAction: 'none' }}
      className="w-14 h-14 rounded-full bg-love flex items-center justify-center shadow-float cursor-grab active:cursor-grabbing"
    >
      <AnimatePresence mode="wait">
        {sent ? (
          <motion.span key="sent" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="text-lg">💛</motion.span>
        ) : (
          <motion.div key="heart" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
            <Heart size={22} className="text-love-foreground fill-love-foreground" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export default MissYouButton;
