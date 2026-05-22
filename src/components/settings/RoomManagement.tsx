"use client";

import React, { useState } from 'react';
import { useTimelineStore } from '@/store/useTimelineStore';
import { Plus, Edit2, Trash2, Bed, Layers, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Room, RoomStatus } from '@/lib/types';

interface RoomFormData {
  name: string;
  roomType: string;
  floor: number;
  status: RoomStatus;
  basePrice: number;
}

export const RoomManagement = () => {
  const { properties, rooms, addRoom, updateRoom, deleteRoom, selectedPropertyId } = useTimelineStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<RoomFormData>({
    name: '',
    roomType: 'Standard',
    floor: 1,
    status: 'clean',
    basePrice: 600000,
  });

  const filteredRooms = rooms.filter(r => r.propertyId === selectedPropertyId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateRoom(editingId, formData);
      setEditingId(null);
    } else {
      addRoom({ ...formData, propertyId: selectedPropertyId });
      setIsAdding(false);
    }
    setFormData({ name: '', roomType: 'Standard', floor: 1, status: 'clean', basePrice: 600000 });
  };

  const handleEdit = (room: Room) => {
    setEditingId(room.id);
    setFormData({ 
      name: room.name, 
      roomType: room.roomType, 
      floor: room.floor,
      status: room.status,
      basePrice: room.basePrice || 600000
    });
    setIsAdding(true);
  };

  if (!selectedPropertyId && properties.length > 0) {
    return (
      <div className="bg-white p-8 rounded-[2.5rem] border border-dashed border-muted-foreground/20 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center text-muted-foreground">
          <Building2 size={32} />
        </div>
        <div>
          <h3 className="font-black text-lg">Chọn cơ sở để quản lý phòng</h3>
          <p className="text-sm text-muted-foreground font-medium">Bạn cần chọn một cơ sở từ danh sách phía trên hoặc bên trái.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-foreground flex items-center gap-2">
            <Bed className="text-primary" size={24} />
            Quản lý Phòng
          </h2>
          <p className="text-sm text-muted-foreground font-medium">Thiết lập danh sách phòng cho cơ sở đang chọn</p>
        </div>
        {!isAdding && selectedPropertyId && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-xl font-bold text-sm shadow-sm hover:scale-105 transition-all"
          >
            <Plus size={18} />
            Thêm phòng mới
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-3xl border shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground ml-1">Tên/Số phòng</label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <input 
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="VD: P.101"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border bg-muted/30 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground ml-1">Tầng</label>
                <div className="relative">
                  <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <input 
                    type="number"
                    required
                    value={formData.floor}
                    onChange={e => setFormData({ ...formData, floor: parseInt(e.target.value) })}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border bg-muted/30 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground ml-1">Loại phòng</label>
                <select 
                  value={formData.roomType}
                  onChange={e => setFormData({ ...formData, roomType: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border bg-muted/30 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold appearance-none cursor-pointer"
                >
                  <option value="Standard">Standard</option>
                  <option value="Deluxe">Deluxe</option>
                  <option value="Suite">Suite</option>
                  <option value="Studio">Studio</option>
                  <option value="Family">Family</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button 
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                  setFormData({ name: '', roomType: 'Standard', floor: 1, status: 'clean', basePrice: 600000 });
                }}
                className="px-6 py-2 rounded-xl font-bold text-sm hover:bg-muted transition-colors"
              >
                Hủy
              </button>
              <button 
                type="submit"
                className="px-6 py-2 bg-primary text-white rounded-xl font-bold text-sm shadow-lg hover:opacity-90 transition-opacity"
              >
                {editingId ? 'Cập nhật' : 'Lưu phòng'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] border shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b bg-muted/20">
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Phòng</th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Tầng</th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Loại</th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Trạng thái</th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredRooms.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground font-medium">
                  Chưa có phòng nào được thiết lập cho cơ sở này.
                </td>
              </tr>
            ) : (
              filteredRooms.map(room => (
                <tr key={room.id} className="hover:bg-muted/10 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-black">
                        {room.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-foreground">Tầng {room.floor}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-black">
                      {room.roomType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        room.status === 'clean' ? "bg-green-500" : 
                        room.status === 'dirty' ? "bg-red-500" : "bg-yellow-500"
                      )} />
                      <span className="text-sm font-bold capitalize">
                        {room.status === 'clean' ? 'Sạch' : room.status === 'dirty' ? 'Bẩn' : 'Đang dọn'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(room)}
                        className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm('Xác nhận xóa phòng này?')) {
                            deleteRoom(room.id);
                          }
                        }}
                        className="p-2 hover:bg-red-50 rounded-lg text-muted-foreground hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Helper component for missing icon
const Building2 = ({ size }: { size: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
    <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
    <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
    <path d="M10 6h4"/>
    <path d="M10 10h4"/>
    <path d="M10 14h4"/>
    <path d="M10 18h4"/>
  </svg>
);
