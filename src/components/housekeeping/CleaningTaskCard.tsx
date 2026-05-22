"use client";

import React from 'react';
import { CleaningAssignment, Room } from '@/lib/types';
import { useTimelineStore } from '@/store/useTimelineStore';
import {
  Clock,
  MapPin,
  Camera,
  Play,
  CheckCircle2,
  UserPlus
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CleaningTaskCardProps {
  assignment: CleaningAssignment;
  room: Room;
  onCompleteClick: () => void;
}

export const CleaningTaskCard = ({ assignment, room, onCompleteClick }: CleaningTaskCardProps) => {
  const { staff, assignTask, startCleaning } = useTimelineStore();
  const activeStaff = staff.filter(s => s.active && s.role === 'housekeeping');

  const handleStart = () => {
    startCleaning(assignment.id, assignment.staffName || 'Nhân viên A');
  };

  return (
    <div className={cn(
      "bg-white rounded-2xl border-2 shadow-sm p-5 space-y-4 hover:shadow-md transition-all group relative overflow-hidden",
      assignment.status === 'in_progress' ? "border-amber-200" : 
      assignment.status === 'done' ? "border-green-200 opacity-75" : "border-slate-100"
    )}>
      {/* Top Section: Room Info */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center font-black text-lg shadow-inner">
            {room.name.replace('P.', '')}
          </div>
          <div>
            <div className="font-black text-sm text-foreground">{room.name}</div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase tracking-tight">
              <MapPin size={10} />
              Tầng {room.floor} · {room.roomType}
            </div>
          </div>
        </div>
        <Badge variant="outline" className="text-[9px] uppercase font-bold tracking-tighter px-1.5 h-4">
          {assignment.status.replace('_', ' ')}
        </Badge>
      </div>

      {/* Staff & Timing */}
      <div className="space-y-2 pt-2 border-t border-slate-50">
        {assignment.staffName ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <div className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center font-black text-[10px]">
                {assignment.staffName.charAt(0)}
              </div>
              {assignment.staffName}
            </div>
            {assignment.status === 'pending' && (
              <select 
                className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2 py-1 rounded outline-none border-none cursor-pointer"
                onChange={(e) => assignTask(assignment.id, e.target.value)}
                value={assignment.staffId || ""}
              >
                <option value="">Đổi người</option>
                {activeStaff.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground italic">
              <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center">
                <UserPlus size={12} />
              </div>
              Chưa phân công
            </div>
            {assignment.status === 'pending' && (
              <select 
                className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2 py-1 rounded outline-none border-none cursor-pointer"
                onChange={(e) => assignTask(assignment.id, e.target.value)}
                value=""
              >
                <option value="">Gán cho...</option>
                {activeStaff.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
          </div>
        )}
        
        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          <Clock size={12} />
          {assignment.status === 'pending' ? (
            <span>Tạo {formatDistanceToNow(assignment.createdAt, { addSuffix: true, locale: vi })}</span>
          ) : assignment.startedAt ? (
            <span>Bắt đầu {formatDistanceToNow(assignment.startedAt, { addSuffix: true, locale: vi })}</span>
          ) : null}
        </div>
      </div>

      {/* Actions */}
      <div className="pt-2">
        {assignment.status === 'pending' && (
          <Button 
            onClick={handleStart} 
            className="w-full rounded-xl bg-primary text-white font-bold h-10 gap-2 shadow-lg shadow-primary/20 group-hover:scale-[1.02] transition-transform"
          >
            <Play size={14} fill="currentColor" /> Bắt đầu dọn
          </Button>
        )}
        
        {assignment.status === 'in_progress' && (
          <Button 
            onClick={onCompleteClick}
            className="w-full rounded-xl bg-amber-500 text-white font-bold h-10 gap-2 shadow-lg shadow-amber-200 group-hover:scale-[1.02] transition-transform"
          >
            <Camera size={14} /> Chụp ảnh nghiệm thu
          </Button>
        )}

        {assignment.status === 'done' && (
          <div className="flex items-center justify-center gap-2 py-2 text-green-600 font-bold text-xs uppercase tracking-widest bg-green-50 rounded-xl border border-green-100">
            <CheckCircle2 size={16} /> Hoàn thành
          </div>
        )}
      </div>

      {/* Background decoration */}
      <div className={cn(
        "absolute -right-4 -bottom-4 w-16 h-16 opacity-[0.03] transition-transform group-hover:scale-125 rotate-12",
        assignment.status === 'in_progress' ? "text-amber-500" : "text-primary"
      )}>
        <MapPin size={64} fill="currentColor" />
      </div>
    </div>
  );
};
