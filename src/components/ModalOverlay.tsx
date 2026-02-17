import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

interface ModalOverlayProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  position?: 'center' | 'bottom';
}

const ModalOverlay = ({ open, onClose, children, position = 'bottom' }: ModalOverlayProps) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-foreground/30 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={position === 'bottom' ? { y: 100, opacity: 0 } : { scale: 0.95, opacity: 0 }}
            animate={position === 'bottom' ? { y: 0, opacity: 1 } : { scale: 1, opacity: 1 }}
            exit={position === 'bottom' ? { y: 100, opacity: 0 } : { scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-card rounded-3xl p-6 shadow-card"
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ModalOverlay;
