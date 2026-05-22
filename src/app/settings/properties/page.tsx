"use client";

import React from 'react';
import { Shell } from '@/components/layout/Shell';
import { PropertyManagement } from '@/components/settings/PropertyManagement';
import { RoomManagement } from '@/components/settings/RoomManagement';
import { useTimelineStore } from '@/store/useTimelineStore';
import { cn } from '@/lib/utils';

export default function PropertiesSettingsPage() {
  const { properties, selectedPropertyId, setSelectedPropertyId } = useTimelineStore();

  return (
    <Shell title="Cấu hình Cơ sở & Phòng">
      <div className="p-8 space-y-8 overflow-y-auto max-h-[calc(100vh-80px)]">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Thiết lập Hệ thống</h1>
          <p className="text-muted-foreground font-medium">Cấu hình danh sách cơ sở và sơ đồ phòng của bạn</p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Property Section */}
          <section className="space-y-4">
            <PropertyManagement />
          </section>

          {/* Quick Property Selector for Room Management */}
          {properties.length > 0 && (
            <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border shadow-sm w-fit">
              {properties.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPropertyId(p.id)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-black transition-all",
                    selectedPropertyId === p.id 
                      ? "bg-primary text-white shadow-md shadow-primary/20 scale-105" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}

          {/* Room Section */}
          <section className="space-y-4">
            <RoomManagement />
          </section>
        </div>
      </div>
    </Shell>
  );
}
