"use client";

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, CheckCircle2, Image as ImageIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhotoVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (photos: string[]) => void;
  roomName: string;
}

export const PhotoVerificationModal = ({ isOpen, onClose, onComplete, roomName }: PhotoVerificationModalProps) => {
  const [photos, setPhotos] = useState<string[]>([]);
  const REQUIRED_PHOTOS = 8;

  const addMockPhoto = () => {
    if (photos.length < REQUIRED_PHOTOS) {
      setPhotos([...photos, `https://picsum.photos/seed/${Math.random()}/400/300`]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleComplete = () => {
    if (photos.length === REQUIRED_PHOTOS) {
      onComplete(photos);
      onClose();
      setPhotos([]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] bg-white rounded-[2rem] border-2 shadow-2xl p-0 overflow-hidden">
        <div className="bg-amber-500 h-2 w-full" />
        
        <div className="p-8">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                <Camera size={20} />
              </div>
              <DialogTitle className="text-2xl font-black tracking-tight">Nghiệm thu dọn phòng: {roomName}</DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground font-medium">
              Bạn cần chụp đủ <span className="font-bold text-foreground">{REQUIRED_PHOTOS} ảnh</span> các khu vực (Giường, Nhà vệ sinh, Kệ TV, v.v.) để hoàn thành nhiệm vụ.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-4 gap-4 mt-8">
            {Array.from({ length: REQUIRED_PHOTOS }).map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "aspect-[4/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all relative overflow-hidden group",
                  photos[i] ? "border-green-500 bg-green-50/10" : "border-muted-foreground/20 bg-muted/20 hover:bg-muted/40 cursor-pointer"
                )}
                onClick={() => !photos[i] && addMockPhoto()}
              >
                {photos[i] ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photos[i]} alt={`Photo ${i+1}`} className="w-full h-full object-cover" />
                    <button 
                      onClick={(e) => { e.stopPropagation(); removePhoto(i); }}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                    <div className="absolute bottom-1 right-1 bg-green-500 text-white p-1 rounded-full shadow-lg">
                      <CheckCircle2 size={12} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                      <Camera size={16} className="text-muted-foreground" />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Ảnh {i + 1}</span>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-muted/30 rounded-2xl border border-dashed flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-black text-sm",
                photos.length === REQUIRED_PHOTOS ? "bg-green-500 text-white" : "bg-white text-muted-foreground border-2"
              )}>
                {photos.length}/{REQUIRED_PHOTOS}
              </div>
              <p className="text-sm font-bold text-muted-foreground">
                {photos.length < REQUIRED_PHOTOS 
                  ? `Vui lòng tải thêm ${REQUIRED_PHOTOS - photos.length} ảnh nữa.`
                  : "Đã đủ ảnh! Bạn có thể hoàn thành việc dọn phòng."}
              </p>
            </div>
            {photos.length > 0 && photos.length < REQUIRED_PHOTOS && (
              <Button variant="outline" size="sm" onClick={addMockPhoto} className="rounded-xl font-bold border-2 gap-2">
                <ImageIcon size={14} /> Chụp nhanh (Mock)
              </Button>
            )}
          </div>

          <DialogFooter className="mt-8 gap-3">
            <Button variant="outline" onClick={onClose} className="rounded-xl font-bold px-6 h-12 border-2">Hủy</Button>
            <Button 
              onClick={handleComplete} 
              disabled={photos.length < REQUIRED_PHOTOS}
              className={cn(
                "rounded-xl font-bold px-8 h-12 shadow-lg transition-all",
                photos.length === REQUIRED_PHOTOS 
                  ? "bg-green-600 hover:bg-green-700 text-white shadow-green-200" 
                  : "bg-muted text-muted-foreground"
              )}
            >
              Hoàn thành & Sẵn sàng đón khách
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
