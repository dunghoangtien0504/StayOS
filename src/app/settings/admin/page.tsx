"use client";

import React from 'react';
import { Shell } from '@/components/layout/Shell';
import { AdminHub } from '@/components/settings/AdminHub';

export default function AdminSettingsPage() {
  return (
    <Shell title="Cài đặt hệ thống">
      <AdminHub />
    </Shell>
  );
}
