"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Store, Settings, Users } from "lucide-react";
import { toast } from "sonner";
import { signUp } from "@/lib/auth/auth-client";
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

type Role = "admin" | "manager" | "staff";

const ROLES: { value: Role; label: string; desc: string; Icon: React.ElementType }[] = [
  { value: "staff",   label: "พนักงาน",  desc: "สต็อกของแต่ละวันประจำวัน",  Icon: Users    },
  { value: "manager", label: "Store",    desc: "ตรวจสอบสต็อกทุกสาขา",      Icon: Store    },
  { value: "admin",   label: "ผู้จัดการ", desc: "ดูแล+จัดการระบบทั้งหมด",   Icon: Settings },
];

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    username: "",
    password: "",
    role: "staff" as Role,
  });
  const [loading, setLoading] = useState(false);

  const set = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.username.trim() || !form.password) {
      toast.error("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
      return;
    }
    if (form.password.length < 8) {
      toast.error("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }
    setLoading(true);
    try {
      // better-auth requires email — store username as username@kfc.local
      const email = `${form.username.trim()}@kfc.local`;

      const { data, error } = await signUp.email({
        email,
        password: form.password,
        name: form.full_name.trim(),
        // additionalFields จาก auth.ts
        phone: form.phone.trim(),
        role: form.role,
      } as Parameters<typeof signUp.email>[0]);

      if (error) {
        toast.error(error.message || "สมัครสมาชิกไม่สำเร็จ");
        return;
      }

      toast.success("สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ");
      router.push("/sign-in");
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
        <CardHeader className="bg-[#C8102E] rounded-t-2xl px-8 py-7 flex flex-col items-center gap-1 border-b-0">
          <CardTitle className="text-white text-xl font-bold text-center">
            สมัครสมาชิก
          </CardTitle>
          <CardDescription className="text-white/80 text-sm text-center">
            สร้างบัญชีเพื่อเข้าใช้งานระบบ KFC StockFlow
          </CardDescription>
        </CardHeader>

        {/* Form */}
        <CardContent className="px-8 py-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="signup-fullname" className="text-gray-700 font-medium">
                ชื่อ-นามสกุล
              </Label>
              <Input
                id="signup-fullname"
                type="text"
                value={form.full_name}
                onChange={(e) => set("full_name", e.target.value)}
                placeholder="เช่น สมชาย ใจดี"
                className="h-10 border-gray-300 focus-visible:border-[#C8102E] focus-visible:ring-[#C8102E]/20 rounded-lg"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="signup-phone" className="text-gray-700 font-medium">
                เบอร์โทรศัพท์
              </Label>
              <Input
                id="signup-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="เช่น 08X-XXX-XXXX"
                maxLength={10}
                className="h-10 border-gray-300 focus-visible:border-[#C8102E] focus-visible:ring-[#C8102E]/20 rounded-lg"
              />
            </div>

            {/* Username + Password */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="signup-username" className="text-gray-700 font-medium">
                  ชื่อผู้ใช้งาน
                </Label>
                <Input
                  id="signup-username"
                  type="text"
                  value={form.username}
                  onChange={(e) => set("username", e.target.value)}
                  placeholder="Username"
                  className="h-10 border-gray-300 focus-visible:border-[#C8102E] focus-visible:ring-[#C8102E]/20 rounded-lg"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signup-password" className="text-gray-700 font-medium">
                  รหัสผ่าน
                </Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="Password"
                  className="h-10 border-gray-300 focus-visible:border-[#C8102E] focus-visible:ring-[#C8102E]/20 rounded-lg"
                  autoComplete="new-password"
                />
              </div>
            </div>

            {/* Role selector */}
            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">สิทธิ์การใช้งาน</Label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map(({ value, label, desc, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    id={`signup-role-${value}`}
                    onClick={() => set("role", value)}
                    className={[
                      "flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-center transition-all duration-200",
                      form.role === value
                        ? "border-[#C8102E] bg-[#C8102E]/5"
                        : "border-gray-200 hover:border-gray-300",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                        form.role === value
                          ? "bg-[#C8102E] text-white"
                          : "bg-gray-100 text-gray-500",
                      ].join(" ")}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-xs font-semibold ${
                        form.role === value ? "text-[#C8102E]" : "text-gray-700"
                      }`}
                    >
                      {label}
                    </span>
                    <span className="text-[10px] text-gray-400 leading-tight">{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <Button
              id="signup-submit"
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-[#C8102E] hover:bg-[#a50d26] text-white font-semibold rounded-lg transition-colors duration-200"
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin mr-2" />
              )}
              บันทึกข้อมูล
            </Button>

            {/* Back to sign-in */}
            <Link
              href="/sign-in"
              className="flex items-center justify-center gap-1 text-sm text-[#C8102E] hover:underline font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              กลับไปหน้าเข้าสู่ระบบ
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}