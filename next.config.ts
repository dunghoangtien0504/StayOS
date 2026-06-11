import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Windows dev machine: thư mục .next cũ bị khóa bởi user Windows cũ (SID khác,
  // không có quyền xóa file). Build vào .next-local để tránh EPERM.
  // VPS (Linux) vẫn dùng .next mặc định — deploy script và PM2 không đổi.
  distDir: process.platform === "win32" ? ".next-local" : ".next",
};

export default nextConfig;
