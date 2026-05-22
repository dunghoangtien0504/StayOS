"use client";

import React from 'react';
import { Shell } from '@/components/layout/Shell';
import { DashboardView } from '@/components/dashboard/DashboardView';

export default function HomePage() {
  return (
    <Shell title="Tổng quan">
      <DashboardView />
    </Shell>
  );
}
