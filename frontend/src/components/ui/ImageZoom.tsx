import React from "react";
import { X, Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ImageZoomProps {
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

const ImageZoom: React.FC<ImageZoomProps> = ({ src, alt, isOpen, onClose }) => {
  const [scale, setScale] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      handleReset();
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 md:p-8"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full h-full flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Controls */}
            <div className="absolute top-0 right-0 flex items-center gap-2 z-10">
              <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 border border-white/20">
                <button 
                  onClick={handleZoomOut}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white"
                  title="Zoom Out"
                >
                  <ZoomOut size={20} />
                </button>
                <span className="text-white text-xs font-bold w-12 text-center">
                  {Math.round(scale * 100)}%
                </span>
                <button 
                  onClick={handleZoomIn}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white"
                  title="Zoom In"
                >
                  <ZoomIn size={20} />
                </button>
                <div className="w-px h-4 bg-white/20 mx-1" />
                <button 
                  onClick={handleRotate}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white"
                  title="Rotate"
                >
                  <RotateCcw size={20} />
                </button>
                <button 
                  onClick={handleReset}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white"
                  title="Reset"
                >
                  <Maximize2 size={20} />
                </button>
              </div>
              <button
                onClick={onClose}
                className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full border border-white/20 transition-colors text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* Image Container */}
            <div className="w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing">
              <motion.img
                src={src}
                alt={alt}
                style={{ 
                  scale, 
                  rotate: rotation,
                }}
                className="max-w-full max-h-full object-contain shadow-2xl"
                referrerPolicy="no-referrer"
                drag
                dragConstraints={{ left: -500, right: 500, top: -500, bottom: 500 }}
                dragElastic={0.1}
              />
            </div>

            {/* Caption */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 mb-4">
              <p className="text-white text-sm font-medium">{alt}</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImageZoom;
