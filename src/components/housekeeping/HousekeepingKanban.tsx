"use client";

import React, { useState } from 'react';
import { useTimelineStore } from '@/store/useTimelineStore';
import { CleaningTaskCard } from './CleaningTaskCard';
import { PhotoVerificationModal } from './PhotoVerificationModal';
import { 
  ClipboardList, 
  PlayCircle, 
  CheckCircle2, 
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export const HousekeepingKanban = () => {
  const { assignments, rooms, staff, completeCleaning } = useTimelineStore();
  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const getRoom = (roomId: string) => rooms.find(r => r.id === roomId);

  const columns = [
    { 
      id: 'pending', 
      title: 'Cần dọn', 
      icon: ClipboardList, 
      color: 'text-slate-500', 
      bg: 'bg-slate-50',
      description: 'Chờ phân công & bắt đầu'
    },
    { 
      id: 'in_progress', 
      title: 'Đang dọn', 
      icon: PlayCircle, 
      color: 'text-amber-500', 
      bg: 'bg-amber-50',
      description: 'Đang vệ sinh thực tế'
    },
    { 
      id: 'done', 
      title: 'Đã hoàn thành', 
      icon: CheckCircle2, 
      color: 'text-green-500', 
      bg: 'bg-green-50',
      description: 'Sẵn sàng đón khách'
    }
  ];

  const handleOpenPhotoModal = (id: string) => {
    setActiveAssignmentId(id);
  };

  const handleComplete = (photos: string[]) => {
    if (activeAssignmentId) {
      completeCleaning(activeAssignmentId, photos);
      setActiveAssignmentId(null);
    }
  };

  const activeAssignment = assignments.find(a => a.id === activeAssignmentId);

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Search & Stats Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-[2rem] border-2 shadow-sm">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-72 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
            <Input 
              placeholder="Tìm theo tên phòng..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 rounded-xl border-slate-200 h-10 font-medium text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-muted-foreground" />
            <select 
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="bg-muted/50 border-none outline-none rounded-xl h-10 px-4 font-bold text-sm min-w-[150px] cursor-pointer"
            >
              <option value="all">Tất cả nhân viên</option>
              {staff.filter(s => s.role === 'housekeeping').map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex items-center gap-8 px-6 border-l-2">
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tổng task</p>
            <p className="text-lg font-black">{assignments.length}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Đang chạy</p>
            <p className="text-lg font-black text-amber-500">
              {assignments.filter(a => a.status === 'in_progress').length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-green-500">Xong (Hôm nay)</p>
            <p className="text-lg font-black text-green-500">
              {assignments.filter(a => a.status === 'done').length}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-muted ml-2">
            <RefreshCw size={18} className="text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0 overflow-hidden">
        {columns.map((col) => (
          <div key={col.id} className={cn("flex flex-col h-full rounded-[2rem] border-2 overflow-hidden", col.bg, "border-transparent")}>
            {/* Column Header */}
            <div className="p-6 pb-2 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center bg-white shadow-sm", col.color)}>
                    <col.icon size={18} />
                  </div>
                  <h3 className="font-black text-sm uppercase tracking-wider">{col.title}</h3>
                </div>
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center font-black text-[10px] shadow-sm">
                  {assignments.filter(a => a.status === col.id).length}
                </div>
              </div>
              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tight ml-10">
                {col.description}
              </p>
            </div>

            {/* Tasks Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {assignments
                .filter(a => a.status === col.id)
                .filter(a => selectedStaffId === 'all' || a.staffId === selectedStaffId)
                .filter(a => {
                  const room = getRoom(a.roomId);
                  if (!room) return false;
                  return room.name.toLowerCase().includes(searchQuery.toLowerCase());
                })
                .map(assignment => {
                  const room = getRoom(assignment.roomId);
                  if (!room) return null;
                  return (
                    <CleaningTaskCard
                      key={assignment.id}
                      assignment={assignment}
                      room={room}
                      onCompleteClick={() => handleOpenPhotoModal(assignment.id)}
                    />
                  );
                })}
              
              {assignments.filter(a => a.status === col.id).length === 0 && (
                <div className="h-32 flex flex-col items-center justify-center text-muted-foreground/30 border-2 border-dashed rounded-2xl">
                  <col.icon size={24} className="mb-2" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Trống</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {activeAssignment && getRoom(activeAssignment.roomId) && (
        <PhotoVerificationModal
          isOpen={activeAssignmentId !== null}
          onClose={() => setActiveAssignmentId(null)}
          onComplete={handleComplete}
          roomName={getRoom(activeAssignment.roomId)!.name}
        />
      )}
    </div>
  );
};
