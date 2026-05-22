"use client";

import React from 'react';
import { Shell } from '@/components/layout/Shell';
import { StaffManagement } from '@/components/settings/StaffManagement';

export default function StaffSettingsPage() {
  return (
    <Shell title="Quản lý Nhân sự">
      <main className="flex-1 p-8">
        <StaffManagement />
      </main>
    </Shell>
  );
}
