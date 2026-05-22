"use client";

import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { 
  FileSpreadsheet, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  ExternalLink,
  Table as TableIcon,
  Clock,
  Settings,
  Share2
} from 'lucide-react';
import { useTimelineStore } from '@/store/useTimelineStore';
import { cn } from '@/lib/utils';

export default function IntegrationsPage() {
  const { bookings, expenses } = useTimelineStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const handleExportCSV = (type: 'bookings' | 'expenses') => {
    const data = type === 'bookings' ? bookings : expenses;
    if (data.length === 0) {
      alert('Không có dữ liệu để xuất!');
      return;
    }

    // Basic CSV generation
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(item => 
      Object.values(item).map(val => 
        typeof val === 'object' ? JSON.stringify(val).replace(/,/g, ';') : val
      ).join(',')
    ).join('\n');
    
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `StayOS_${type}_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGoogleSync = () => {
    setIsSyncing(true);
    // Mocking API call
    setTimeout(() => {
      setIsSyncing(false);
      setLastSync(new Date().toLocaleString('vi-VN'));
    }, 2000);
  };

  return (
    <Shell title="Tích hợp & Xuất dữ liệu">
      <div className="flex-1 p-8 space-y-8 overflow-y-auto bg-background/50">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Header Section */}
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-black tracking-tight text-foreground">Kết nối & Đồng bộ</h1>
            <p className="text-muted-foreground font-medium">
              Xuất dữ liệu báo cáo hoặc đồng bộ trực tiếp với các nền tảng bên thứ ba.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Google Sheets Card */}
            <div className="bg-white p-8 rounded-[2rem] border shadow-sm flex flex-col gap-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <FileSpreadsheet size={120} />
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                  <FileSpreadsheet size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black">Google Sheets</h3>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Đồng bộ tự động</p>
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Tự động đẩy dữ liệu đặt phòng và chi phí sang Google Sheets để theo dõi từ xa hoặc chia sẻ với đối tác.
                </p>
                
                <div className="flex items-center gap-2 text-xs font-bold py-2 px-3 bg-muted/50 rounded-xl w-fit">
                  {lastSync ? (
                    <>
                      <CheckCircle2 size={14} className="text-green-500" />
                      <span className="text-muted-foreground">Đồng bộ lần cuối: {lastSync}</span>
                    </>
                  ) : (
                    <>
                      <Clock size={14} className="text-amber-500" />
                      <span className="text-muted-foreground">Chưa có dữ liệu đồng bộ</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-4">
                <button 
                  onClick={handleGoogleSync}
                  disabled={isSyncing}
                  className={cn(
                    "flex items-center justify-center gap-2 py-4 rounded-2xl font-black transition-all",
                    isSyncing ? "bg-muted text-muted-foreground cursor-wait" : "bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-200"
                  )}
                >
                  {isSyncing ? <RefreshCw size={20} className="animate-spin" /> : <RefreshCw size={20} />}
                  {isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}
                </button>
                <button className="flex items-center justify-center gap-2 py-3 text-muted-foreground hover:text-foreground font-bold text-sm transition-colors">
                  <Settings size={16} />
                  Cấu hình Sheet ID
                </button>
              </div>
            </div>

            {/* Export Data Card */}
            <div className="bg-white p-8 rounded-[2rem] border shadow-sm flex flex-col gap-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Download size={120} />
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                  <Share2 size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black">Xuất File Offline</h3>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Định dạng CSV / Excel</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                Tải xuống bản sao lưu dữ liệu cục bộ để lưu trữ hoặc nhập vào các phần mềm kế toán khác.
              </p>

              <div className="grid grid-cols-1 gap-3 mt-auto">
                <button 
                  onClick={() => handleExportCSV('bookings')}
                  className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 border rounded-2xl transition-all group/btn"
                >
                  <div className="flex items-center gap-3">
                    <TableIcon size={18} className="text-blue-500" />
                    <span className="font-bold text-sm">Danh sách Đặt phòng</span>
                  </div>
                  <Download size={16} className="text-muted-foreground group-hover/btn:text-blue-500 transition-colors" />
                </button>

                <button 
                  onClick={() => handleExportCSV('expenses')}
                  className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 border rounded-2xl transition-all group/btn"
                >
                  <div className="flex items-center gap-3">
                    <Download size={18} className="text-orange-500" />
                    <span className="font-bold text-sm">Danh sách Chi phí</span>
                  </div>
                  <Download size={16} className="text-muted-foreground group-hover/btn:text-orange-500 transition-colors" />
                </button>
              </div>
            </div>

          </div>

          {/* Additional Info */}
          <div className="bg-primary/5 p-6 rounded-[2rem] border border-primary/10 flex items-start gap-4">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
              <ExternalLink size={20} />
            </div>
            <div>
              <h4 className="font-black text-primary">Bạn cần kết nối Webhook?</h4>
              <p className="text-sm text-muted-foreground font-medium mt-1">
                StayOS hỗ trợ API và Webhook để tích hợp sâu với các hệ thống Automation như Zapier hoặc Make.com. Liên hệ bộ phận kỹ thuật để được cấp API Key.
              </p>
            </div>
          </div>

        </div>
      </div>
    </Shell>
  );
}
