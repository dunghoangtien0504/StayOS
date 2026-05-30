"use client";

import React, { useState } from 'react';
import { useTimelineStore } from '@/store/useTimelineStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { BookingSource, NotificationType } from '@/lib/types';
import { Trash2, Plus } from 'lucide-react';

const NAV_OPTIONS: { slug: string; label: string }[] = [
  { slug: 'dashboard', label: 'Tổng quan' },
  { slug: 'timeline', label: 'Lịch đặt phòng' },
  { slug: 'bookings-table', label: 'Danh sách đặt phòng' },
  { slug: 'inbox', label: 'Smart Inbox' },
  { slug: 'properties', label: 'Cơ sở / Phòng' },
  { slug: 'guests', label: 'Khách hàng' },
  { slug: 'housekeeping', label: 'Buồng phòng' },
  { slug: 'staff', label: 'Nhân viên' },
  { slug: 'expenses', label: 'Quản lý Chi phí' },
  { slug: 'reports', label: 'Báo cáo P&L' },
  { slug: 'integrations', label: 'Tích hợp & Xuất' },
];

const WIDGET_OPTIONS: { slug: string; label: string }[] = [
  { slug: 'kpis', label: 'KPI Cards' },
  { slug: 'revenue-trend', label: 'Biểu đồ xu hướng doanh thu' },
  { slug: 'finance-summary', label: 'Hiệu suất tài chính' },
  { slug: 'alerts', label: 'Cảnh báo vận hành' },
  { slug: 'recent-bookings', label: 'Đặt phòng mới nhất' },
];

const NOTIF_OPTIONS: { type: NotificationType; label: string }[] = [
  { type: 'check_in', label: 'Khách check-in' },
  { type: 'check_out', label: 'Khách check-out' },
  { type: 'cleaning_done', label: 'Dọn phòng / cảnh báo dọn trễ' },
  { type: 'new_booking', label: 'Đặt phòng mới' },
  { type: 'payment_received', label: 'Thu tiền' },
  { type: 'system', label: 'Hệ thống / cảnh báo check-in trễ' },
];

const SOURCE_OPTIONS: { value: BookingSource; label: string }[] = [
  { value: 'zalo', label: 'Zalo' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'booking', label: 'Booking.com' },
  { value: 'airbnb', label: 'Airbnb' },
  { value: 'walk_in', label: 'Khách vãng lai' },
  { value: 'direct', label: 'Đặt trực tiếp' },
];

function toggleInArray<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value];
}

export const AdminHub = () => {
  const { settings, updateSettings } = useTimelineStore();

  const [newCategory, setNewCategory] = useState('');
  const [newTask, setNewTask] = useState('');

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Cài đặt hệ thống</h1>
          <p className="text-muted-foreground font-medium">Tùy chỉnh thương hiệu, nav, dashboard và quy tắc vận hành</p>
        </div>

        <Tabs defaultValue="branding" className="w-full">
          <TabsList className="grid grid-cols-4 lg:grid-cols-9 w-full">
            <TabsTrigger value="branding">Thương hiệu</TabsTrigger>
            <TabsTrigger value="theme">Giao diện</TabsTrigger>
            <TabsTrigger value="nav">Menu</TabsTrigger>
            <TabsTrigger value="widgets">Widget</TabsTrigger>
            <TabsTrigger value="notif">Thông báo</TabsTrigger>
            <TabsTrigger value="sources">Nguồn booking</TabsTrigger>
            <TabsTrigger value="pricing">Giá phòng</TabsTrigger>
            <TabsTrigger value="categories">Chi phí</TabsTrigger>
            <TabsTrigger value="cleaning">Dọn phòng</TabsTrigger>
          </TabsList>

          {/* Branding */}
          <TabsContent value="branding" className="bg-white p-8 rounded-2xl border space-y-6 mt-4">
            <h2 className="text-xl font-black">Thương hiệu</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="brand-name">Tên thương hiệu</Label>
                <Input id="brand-name" value={settings.branding.name}
                  onChange={(e) => updateSettings({ branding: { ...settings.branding, name: e.target.value } })} />
              </div>
              <div>
                <Label htmlFor="brand-logo">Logo URL</Label>
                <Input id="brand-logo" placeholder="https://..." value={settings.branding.logoUrl ?? ''}
                  onChange={(e) => updateSettings({ branding: { ...settings.branding, logoUrl: e.target.value || undefined } })} />
              </div>
              <div>
                <Label htmlFor="brand-color">Màu chủ đạo</Label>
                <div className="flex gap-2 items-center">
                  <Input id="brand-color" type="color" value={settings.branding.primaryColor}
                    onChange={(e) => updateSettings({ branding: { ...settings.branding, primaryColor: e.target.value } })}
                    className="w-20 h-10 p-1" />
                  <Input value={settings.branding.primaryColor}
                    onChange={(e) => updateSettings({ branding: { ...settings.branding, primaryColor: e.target.value } })} />
                </div>
              </div>
              <div>
                <Label htmlFor="brand-tz">Múi giờ</Label>
                <Input id="brand-tz" value={settings.branding.timezone}
                  onChange={(e) => updateSettings({ branding: { ...settings.branding, timezone: e.target.value } })} />
              </div>
              <div>
                <Label htmlFor="brand-address">Địa chỉ (hiện trên hóa đơn)</Label>
                <Input id="brand-address" placeholder="Số nhà, đường, tỉnh thành..."
                  value={settings.branding.address ?? ''}
                  onChange={(e) => updateSettings({ branding: { ...settings.branding, address: e.target.value } })} />
              </div>
              <div>
                <Label htmlFor="brand-phone">Số điện thoại (hiện trên hóa đơn)</Label>
                <Input id="brand-phone" placeholder="0900 000 000"
                  value={settings.branding.phone ?? ''}
                  onChange={(e) => updateSettings({ branding: { ...settings.branding, phone: e.target.value } })} />
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-base font-black mb-1">Tài khoản ngân hàng (QR hóa đơn)</h3>
              <p className="text-xs text-muted-foreground mb-4">Điền để tự động tạo QR VietQR trên hóa đơn khi khách còn nợ</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="bank-id">Mã ngân hàng</Label>
                  <Input id="bank-id" placeholder="VCB / TCB / MB / ACB / VPB..."
                    value={settings.bankInfo?.bankId ?? ''}
                    onChange={(e) => updateSettings({ bankInfo: { ...(settings.bankInfo || { accountNo: '', accountName: '' }), bankId: e.target.value } })} />
                </div>
                <div>
                  <Label htmlFor="bank-no">Số tài khoản</Label>
                  <Input id="bank-no" placeholder="1234567890"
                    value={settings.bankInfo?.accountNo ?? ''}
                    onChange={(e) => updateSettings({ bankInfo: { ...(settings.bankInfo || { bankId: '', accountName: '' }), accountNo: e.target.value } })} />
                </div>
                <div>
                  <Label htmlFor="bank-name">Tên chủ tài khoản</Label>
                  <Input id="bank-name" placeholder="NGUYEN VAN A"
                    value={settings.bankInfo?.accountName ?? ''}
                    onChange={(e) => updateSettings({ bankInfo: { ...(settings.bankInfo || { bankId: '', accountNo: '' }), accountName: e.target.value } })} />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Theme */}
          <TabsContent value="theme" className="bg-white p-8 rounded-2xl border space-y-4 mt-4">
            <h2 className="text-xl font-black">Giao diện</h2>
            <div className="flex gap-2">
              {(['light', 'dark', 'system'] as const).map(scheme => (
                <Button
                  key={scheme}
                  variant={settings.theme.colorScheme === scheme ? 'default' : 'outline'}
                  onClick={() => updateSettings({ theme: { colorScheme: scheme } })}
                >
                  {scheme === 'light' ? 'Sáng' : scheme === 'dark' ? 'Tối' : 'Theo hệ thống'}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Lưu ý: dark mode sẽ áp dụng ở phiên bản sau.</p>
          </TabsContent>

          {/* Nav */}
          <TabsContent value="nav" className="bg-white p-8 rounded-2xl border space-y-4 mt-4">
            <h2 className="text-xl font-black">Ẩn menu sidebar</h2>
            <p className="text-sm text-muted-foreground">Tích để ẩn mục đó khỏi sidebar</p>
            <div className="grid grid-cols-2 gap-3">
              {NAV_OPTIONS.map(opt => (
                <label key={opt.slug} className="flex items-center gap-2 p-2 rounded hover:bg-muted/30 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.hiddenNavItems.includes(opt.slug)}
                    onChange={() => updateSettings({ hiddenNavItems: toggleInArray(settings.hiddenNavItems, opt.slug) })}
                  />
                  <span className="font-medium text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </TabsContent>

          {/* Widgets */}
          <TabsContent value="widgets" className="bg-white p-8 rounded-2xl border space-y-4 mt-4">
            <h2 className="text-xl font-black">Ẩn widget Dashboard</h2>
            <div className="grid grid-cols-2 gap-3">
              {WIDGET_OPTIONS.map(opt => (
                <label key={opt.slug} className="flex items-center gap-2 p-2 rounded hover:bg-muted/30 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.hiddenWidgets.includes(opt.slug)}
                    onChange={() => updateSettings({ hiddenWidgets: toggleInArray(settings.hiddenWidgets, opt.slug) })}
                  />
                  <span className="font-medium text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </TabsContent>

          {/* Notif prefs */}
          <TabsContent value="notif" className="bg-white p-8 rounded-2xl border space-y-4 mt-4">
            <h2 className="text-xl font-black">Loại thông báo nhận</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {NOTIF_OPTIONS.map(opt => (
                <label key={opt.type} className="flex items-center gap-2 p-2 rounded hover:bg-muted/30 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifPrefs[opt.type] !== false}
                    onChange={(e) => updateSettings({ notifPrefs: { ...settings.notifPrefs, [opt.type]: e.target.checked } })}
                  />
                  <span className="font-medium text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </TabsContent>

          {/* Booking sources */}
          <TabsContent value="sources" className="bg-white p-8 rounded-2xl border space-y-4 mt-4">
            <h2 className="text-xl font-black">Nguồn booking đang dùng</h2>
            <p className="text-sm text-muted-foreground">Bỏ tích để ẩn nguồn này khỏi form đặt phòng</p>
            <div className="grid grid-cols-2 gap-3">
              {SOURCE_OPTIONS.map(opt => (
                <label key={opt.value} className="flex items-center gap-2 p-2 rounded hover:bg-muted/30 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enabledBookingSources.includes(opt.value)}
                    onChange={() => updateSettings({ enabledBookingSources: toggleInArray(settings.enabledBookingSources, opt.value) })}
                  />
                  <span className="font-medium text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </TabsContent>

          {/* Custom expense categories */}
          {/* Pricing */}
          <TabsContent value="pricing" className="bg-white p-8 rounded-2xl border space-y-6 mt-4">
            <div>
              <h2 className="text-xl font-black">Quy tắc giá phòng</h2>
              <p className="text-sm text-muted-foreground">Áp hệ số tự động cho cuối tuần và ngày lễ</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-muted/30 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🗓️</span>
                  <div>
                    <p className="font-black text-sm">Giá cuối tuần</p>
                    <p className="text-xs text-muted-foreground">Thứ 6, Thứ 7, Chủ nhật</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    type="number" min={1} max={5} step={0.05}
                    value={settings.pricing?.weekendMultiplier ?? 1}
                    onChange={e => updateSettings({ pricing: { ...(settings.pricing ?? { peakDates: [], peakMultiplier: 1 }), weekendMultiplier: parseFloat(e.target.value) || 1 } })}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground font-bold">× giá gốc</span>
                  {(settings.pricing?.weekendMultiplier ?? 1) > 1 && (
                    <span className="text-xs font-black text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                      +{(((settings.pricing?.weekendMultiplier ?? 1) - 1) * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-muted/30 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎉</span>
                  <div>
                    <p className="font-black text-sm">Giá ngày lễ / cao điểm</p>
                    <p className="text-xs text-muted-foreground">Các ngày khai báo bên dưới</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    type="number" min={1} max={5} step={0.05}
                    value={settings.pricing?.peakMultiplier ?? 1}
                    onChange={e => updateSettings({ pricing: { ...(settings.pricing ?? { peakDates: [], weekendMultiplier: 1 }), peakMultiplier: parseFloat(e.target.value) || 1 } })}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground font-bold">× giá gốc</span>
                  {(settings.pricing?.peakMultiplier ?? 1) > 1 && (
                    <span className="text-xs font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                      +{(((settings.pricing?.peakMultiplier ?? 1) - 1) * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Ngày lễ / cao điểm tùy chỉnh</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  id="peak-date-input"
                  className="w-48"
                />
                <Button onClick={() => {
                  const input = document.getElementById('peak-date-input') as HTMLInputElement;
                  const val = input?.value;
                  if (!val) return;
                  const existing = settings.pricing?.peakDates ?? [];
                  if (existing.includes(val)) return;
                  updateSettings({ pricing: { ...(settings.pricing ?? { weekendMultiplier: 1, peakMultiplier: 1.5 }), peakDates: [...existing, val].sort() } });
                  input.value = '';
                }}>
                  <Plus size={16} /> Thêm ngày
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(settings.pricing?.peakDates ?? []).map(d => (
                  <div key={d} className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-xl text-xs font-bold">
                    {d}
                    <button onClick={() => updateSettings({ pricing: { ...(settings.pricing ?? { weekendMultiplier: 1, peakMultiplier: 1.5 }), peakDates: (settings.pricing?.peakDates ?? []).filter(x => x !== d) } })}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
                {(settings.pricing?.peakDates ?? []).length === 0 && (
                  <p className="text-xs italic text-muted-foreground">Chưa có ngày cao điểm nào</p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="categories" className="bg-white p-8 rounded-2xl border space-y-4 mt-4">
            <h2 className="text-xl font-black">Danh mục chi phí tùy chỉnh</h2>
            <p className="text-sm text-muted-foreground">Bổ sung ngoài các danh mục mặc định (điện, nước, lương, ...)</p>
            <div className="flex gap-2">
              <Input
                placeholder="Ví dụ: Marketing, Sửa chữa thiết bị"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newCategory.trim()) {
                    updateSettings({ customExpenseCategories: [...settings.customExpenseCategories, newCategory.trim()] });
                    setNewCategory('');
                  }
                }}
              />
              <Button
                onClick={() => {
                  if (!newCategory.trim()) return;
                  updateSettings({ customExpenseCategories: [...settings.customExpenseCategories, newCategory.trim()] });
                  setNewCategory('');
                }}
              >
                <Plus size={16} /> Thêm
              </Button>
            </div>
            <div className="space-y-2">
              {settings.customExpenseCategories.length === 0 ? (
                <p className="text-sm italic text-muted-foreground">Chưa có danh mục tùy chỉnh nào</p>
              ) : settings.customExpenseCategories.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                  <span className="font-medium">{c}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateSettings({ customExpenseCategories: settings.customExpenseCategories.filter((_, idx) => idx !== i) })}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Cleaning templates */}
          <TabsContent value="cleaning" className="bg-white p-8 rounded-2xl border space-y-4 mt-4">
            <h2 className="text-xl font-black">Mẫu công việc dọn phòng</h2>
            <div className="flex gap-2">
              <Input
                placeholder="Ví dụ: Kiểm tra mini bar"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newTask.trim()) {
                    updateSettings({ cleaningTaskTemplates: [...settings.cleaningTaskTemplates, newTask.trim()] });
                    setNewTask('');
                  }
                }}
              />
              <Button
                onClick={() => {
                  if (!newTask.trim()) return;
                  updateSettings({ cleaningTaskTemplates: [...settings.cleaningTaskTemplates, newTask.trim()] });
                  setNewTask('');
                }}
              >
                <Plus size={16} /> Thêm
              </Button>
            </div>
            <div className="space-y-2">
              {settings.cleaningTaskTemplates.map((t, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                  <span className="font-medium">{t}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateSettings({ cleaningTaskTemplates: settings.cleaningTaskTemplates.filter((_, idx) => idx !== i) })}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
