import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { motion } from 'framer-motion';
import ModalOverlay from './ModalOverlay';

interface AvatarCropModalProps {
  open: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (blob: Blob) => void;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (e) => reject(e));
    image.crossOrigin = 'anonymous';
    image.src = url;
  });

async function getCroppedImg(imageSrc: string, crop: { x: number; y: number; width: number; height: number }): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = 256;
  canvas.height = 256;
  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, 256, 256);
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.9));
}

const AvatarCropModal = ({ open, onClose, imageSrc, onCropComplete }: AvatarCropModalProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropDone = useCallback((_: any, croppedPixels: any) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
    onCropComplete(blob);
  };

  return (
    <ModalOverlay open={open} onClose={onClose} position="center">
      <h3 className="text-lg font-bold text-foreground mb-4">Recortar foto de perfil</h3>
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-muted">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropDone}
        />
      </div>
      <input
        type="range"
        min={1}
        max={3}
        step={0.1}
        value={zoom}
        onChange={(e) => setZoom(Number(e.target.value))}
        className="w-full mt-4 accent-primary"
      />
      <div className="flex gap-3 mt-4">
        <button onClick={onClose} className="flex-1 h-12 rounded-2xl bg-muted text-muted-foreground font-medium text-sm">
          Cancelar
        </button>
        <button onClick={handleSave} className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-float">
          Guardar
        </button>
      </div>
    </ModalOverlay>
  );
};

export default AvatarCropModal;
