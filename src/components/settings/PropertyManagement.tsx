"use client";

import React, { useState } from 'react';
import { useTimelineStore } from '@/store/useTimelineStore';
import { Home, Plus, Edit2, Trash2, MapPin, Building2 } from 'lucide-react';
import { Property } from '@/lib/types';

export const PropertyManagement = () => {
  const { properties, addProperty, updateProperty, deleteProperty } = useTimelineStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    checkInTime: '14:00',
    checkOutTime: '12:00'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateProperty(editingId, formData);
      setEditingId(null);
    } else {
      addProperty(formData);
      setIsAdding(false);
    }
    setFormData({ name: '', address: '', checkInTime: '14:00', checkOutTime: '12:00' });
  };

  const handleEdit = (property: Property) => {
    setEditingId(property.id);
    setFormData({ 
      name: property.name, 
      address: property.address,
      checkInTime: property.checkInTime || '14:00',
      checkOutTime: property.checkOutTime || '12:00'
    });
    setIsAdding(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-foreground flex items-center gap-2">
            <Building2 className="text-primary" size={24} />
            Danh sách Cơ sở
          </h2>
          <p className="text-sm text-muted-foreground font-medium">Quản lý các tòa nhà và chi nhánh của bạn</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm shadow-sm hover:scale-105 transition-all"
          >
            <Plus size={18} />
            Thêm cơ sở mới
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-3xl border shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground ml-1">Tên cơ sở</label>
                <input 
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: StayOS Đà Lạt Central"
                  className="w-full px-4 py-3 rounded-2xl border bg-muted/30 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground ml-1">Địa chỉ</label>
                <input 
                  type="text"
                  required
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="VD: 123 Phan Bội Châu, Đà Lạt"
                  className="w-full px-4 py-3 rounded-2xl border bg-muted/30 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button 
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                  setFormData({ name: '', address: '', checkInTime: '14:00', checkOutTime: '12:00' });
                }}
                className="px-6 py-2 rounded-xl font-bold text-sm hover:bg-muted transition-colors"
              >
                Hủy
              </button>
              <button 
                type="submit"
                className="px-6 py-2 bg-foreground text-background rounded-xl font-bold text-sm shadow-lg hover:opacity-90 transition-opacity"
              >
                {editingId ? 'Cập nhật' : 'Lưu cơ sở'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {properties.map(property => (
          <div key={property.id} className="bg-white p-5 rounded-3xl border shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button 
                onClick={() => handleEdit(property)}
                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Edit2 size={16} />
              </button>
              <button 
                onClick={() => {
                  if (confirm('Bạn có chắc chắn muốn xóa cơ sở này? Tất cả phòng và đặt phòng liên quan sẽ bị xóa.')) {
                    deleteProperty(property.id);
                  }
                }}
                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0">
                <Home size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-lg text-foreground leading-none">{property.name}</h3>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin size={14} />
                  <span className="text-xs font-bold truncate max-w-[180px]">{property.address}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
