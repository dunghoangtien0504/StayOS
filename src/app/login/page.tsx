"use client";

import React, { useState } from 'react';
import { useTimelineStore } from '@/store/useTimelineStore';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ChevronRight, Loader2, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@stayos.com');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const login = useTimelineStore(state => state.login);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Artificial delay for premium feel
    await new Promise(resolve => setTimeout(resolve, 1200));

    const success = await login(email, password);
    if (success) {
      router.push('/');
    } else {
      setError('Email hoặc mật khẩu không chính xác');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex overflow-hidden font-sans">
      {/* Left Decoration Side */}
      <div className="hidden lg:flex w-1/2 bg-foreground relative overflow-hidden flex-col justify-between p-16">
        {/* Animated Background Gradients */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[100px]" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
              <ShieldCheck className="text-white" size={28} />
            </div>
            <span className="text-3xl font-black text-white tracking-tighter italic">STAYOS</span>
          </div>
          
          <h1 className="text-7xl font-black text-white leading-[0.9] tracking-tighter mb-8">
            Quản lý lưu trú <br />
            <span className="text-primary">thông minh hơn.</span>
          </h1>
          <p className="text-white/60 text-xl font-medium max-w-md leading-relaxed">
            Nền tảng quản lý khách sạn & homestay tối ưu nhất cho doanh nghiệp của bạn.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-8">
          <div className="flex -space-x-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-12 h-12 rounded-full border-4 border-foreground bg-muted flex items-center justify-center text-xs font-bold">
                {String.fromCharCode(64 + i)}
              </div>
            ))}
          </div>
          <p className="text-white/40 text-sm font-bold uppercase tracking-widest">
            Hơn 2,000+ quản lý tin dùng
          </p>
        </div>
      </div>

      {/* Right Login Side */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-16">
        <div className="w-full max-w-md space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl font-black tracking-tight text-foreground">Chào mừng trở lại</h2>
            <p className="text-muted-foreground font-semibold">Đăng nhập để tiếp tục quản lý cơ sở của bạn</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-black text-muted-foreground uppercase tracking-widest ml-1">Email doanh nghiệp</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 rounded-[2rem] border bg-white focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-lg shadow-sm"
                  placeholder="admin@stayos.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-black text-muted-foreground uppercase tracking-widest ml-1">Mật khẩu</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 rounded-[2rem] border bg-white focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-lg shadow-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold animate-in fade-in slide-in-from-top-2 duration-300">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between px-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" className="w-5 h-5 rounded-lg border-2 border-muted checked:bg-primary transition-all cursor-pointer" />
                <span className="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">Ghi nhớ đăng nhập</span>
              </label>
              <button type="button" className="text-sm font-black text-primary hover:underline">Quên mật khẩu?</button>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-6 bg-primary text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:hover:scale-100"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  Đang xác thực...
                </>
              ) : (
                <>
                  Đăng nhập ngay
                  <ChevronRight size={24} />
                </>
              )}
            </button>
          </form>

          <div className="pt-8 text-center">
            <p className="text-muted-foreground font-semibold">
              Chưa có tài khoản? <button className="text-primary font-black hover:underline">Dùng thử miễn phí</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
