"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Package } from "lucide-react";
import { toast } from "sonner";
import { signIn } from "@/lib/auth/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default function SignInPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    setLoading(true);
    try {
      // better-auth uses email format; we store as username@kfc.local
      const email = username.trim().includes("@")
        ? username.trim()
        : `${username.trim()}@kfc.local`;

      const { data, error } = await signIn.email({
        email,
        password,
        callbackURL: "/",
      });

      if (error) {
        toast.error(error.message || "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง");
        return;
      }
      toast.success("เข้าสู่ระบบสำเร็จ");
      router.push("/");
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-2xl shadow-xl gap-0 py-0">
        {/* Header */}
        <CardHeader className="bg-[#C8102E] rounded-t-2xl px-8 py-10 flex flex-col items-center gap-2 border-b-0">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
            <Package className="w-9 h-9 text-white" />
          </div>
          <CardTitle className="text-white text-2xl font-bold tracking-wide text-center">
            KFC StockFlow
          </CardTitle>
          <CardDescription className="text-white/80 text-sm text-center">
            ระบบจัดการคลังวัตถุดิบ
          </CardDescription>
        </CardHeader>

        {/* Form */}
        <CardContent className="px-8 py-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div className="space-y-1.5">
              <Label htmlFor="signin-username" className="text-gray-700 font-medium">
                ชื่อผู้ใช้งาน
              </Label>
              <Input
                id="signin-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="กรอกชื่อผู้ใช้งาน"
                className="h-10 border-gray-300 focus-visible:border-[#C8102E] focus-visible:ring-[#C8102E]/20 rounded-lg"
                autoComplete="username"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="signin-password" className="text-gray-700 font-medium">
                รหัสผ่าน
              </Label>
              <div className="relative">
                <Input
                  id="signin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่าน"
                  className="h-10 pr-10 border-gray-300 focus-visible:border-[#C8102E] focus-visible:ring-[#C8102E]/20 rounded-lg"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button
              id="signin-submit"
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-[#C8102E] hover:bg-[#a50d26] text-white font-semibold rounded-lg transition-colors duration-200"
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin mr-2" />
              )}
              เข้าสู่ระบบ
            </Button>

            {/* Link to sign-up */}
            <p className="text-center text-sm text-gray-500">
              ยังไม่มีบัญชี?{" "}
              <Link
                href="/sign-up"
                className="text-[#C8102E] font-medium hover:underline"
              >
                สมัครสมาชิก
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}