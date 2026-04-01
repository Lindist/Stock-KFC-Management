"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, ChevronLeft, Settings, Store, Users } from "lucide-react";
import { toast } from "sonner";
import { authClient, signUp } from "@/lib/auth/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Role = "manager" | "store" | "staff";

const ROLES: { value: Role; label: string; desc: string; Icon: React.ElementType }[] = [
  { value: "staff", label: "พนักงาน", desc: "เบิกวัตถุดิบและติดตามงานประจำวัน", Icon: Users },
  { value: "store", label: "Store", desc: "จัดการใบสั่งซื้อและสถานะการส่งของ", Icon: Store },
  { value: "manager", label: "ผู้จัดการ", desc: "ดูแลภาพรวมคลังและอนุมัติรายการ", Icon: Settings },
];

export default function SignUpPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    username: "",
    password: "",
    role: "staff" as Role,
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("รองรับเฉพาะไฟล์ JPG, PNG, WEBP");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("ไฟล์ต้องมีขนาดไม่เกิน 2MB");
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

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
      let imageUrl = "";

      if (avatarFile) {
        const formData = new FormData();
        formData.append("file", avatarFile);

        const uploadRes = await fetch("/api/upload-avatar", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();

        if (!uploadRes.ok) {
          toast.error(uploadData.error || "อัปโหลดรูปไม่สำเร็จ");
          return;
        }

        imageUrl = uploadData.url;
      }

      const email = `${form.username.trim()}@kfc.local`;

      const { error } = await signUp.email({
        email,
        password: form.password,
        name: form.full_name.trim(),
        phone: form.phone.trim(),
        role: form.role,
        image: imageUrl,
      } as Parameters<typeof signUp.email>[0]);

      if (error) {
        toast.error(error.message || "สมัครสมาชิกไม่สำเร็จ");
        return;
      }

      if (imageUrl) {
        const syncImageResult = await authClient.updateUser({
          image: imageUrl,
        } as Parameters<typeof authClient.updateUser>[0]);

        if (syncImageResult?.error) {
          console.error("Failed to sync avatar after sign up:", syncImageResult.error);
        }
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
    <div className="flex min-h-screen items-center justify-center bg-[#f0f0f0] p-4">
      <Card className="w-full max-w-md gap-0 rounded-2xl py-0 shadow-xl">
        <CardHeader className="flex flex-col items-center gap-1 rounded-t-2xl border-b-0 bg-[#C8102E] px-8 py-7">
          <CardTitle className="text-center text-xl font-bold text-white">สมัครสมาชิก</CardTitle>
          <CardDescription className="text-center text-sm text-white/80">
            สร้างบัญชีเพื่อเข้าใช้งานระบบ KFC StockFlow
          </CardDescription>
        </CardHeader>

        <CardContent className="px-8 py-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-center">
              <div className="group relative">
                <div
                  className="flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-full border-3 border-dashed border-gray-300 bg-gray-50 transition-all duration-200 hover:border-[#C8102E] hover:bg-[#C8102E]/5"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <Camera className="h-6 w-6 text-gray-400 transition-colors group-hover:text-[#C8102E]" />
                      <span className="text-[9px] text-gray-400 transition-colors group-hover:text-[#C8102E]">
                        อัปโหลดรูป
                      </span>
                    </div>
                  )}
                </div>

                {avatarPreview ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setAvatarFile(null);
                      setAvatarPreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white shadow-sm transition-colors hover:bg-red-600"
                  >
                    x
                  </button>
                ) : null}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="signup-fullname" className="font-medium text-gray-700">
                ชื่อ-นามสกุล
              </Label>
              <Input
                id="signup-fullname"
                type="text"
                value={form.full_name}
                onChange={(event) => set("full_name", event.target.value)}
                placeholder="เช่น สมชาย ใจดี"
                className="h-10 rounded-lg border-gray-300 focus-visible:border-[#C8102E] focus-visible:ring-[#C8102E]/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="signup-phone" className="font-medium text-gray-700">
                เบอร์โทรศัพท์
              </Label>
              <Input
                id="signup-phone"
                type="tel"
                value={form.phone}
                onChange={(event) => set("phone", event.target.value)}
                placeholder="เช่น 08X-XXX-XXXX"
                maxLength={10}
                className="h-10 rounded-lg border-gray-300 focus-visible:border-[#C8102E] focus-visible:ring-[#C8102E]/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="signup-username" className="font-medium text-gray-700">
                  ชื่อผู้ใช้งาน
                </Label>
                <Input
                  id="signup-username"
                  type="text"
                  value={form.username}
                  onChange={(event) => set("username", event.target.value)}
                  placeholder="Username"
                  autoComplete="off"
                  className="h-10 rounded-lg border-gray-300 focus-visible:border-[#C8102E] focus-visible:ring-[#C8102E]/20"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signup-password" className="font-medium text-gray-700">
                  รหัสผ่าน
                </Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={form.password}
                  onChange={(event) => set("password", event.target.value)}
                  placeholder="Password"
                  autoComplete="new-password"
                  className="h-10 rounded-lg border-gray-300 focus-visible:border-[#C8102E] focus-visible:ring-[#C8102E]/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-medium text-gray-700">สิทธิ์การใช้งาน</Label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map(({ value, label, desc, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => set("role", value)}
                    className={[
                      "flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-center transition-all duration-200",
                      form.role === value
                        ? "border-[#C8102E] bg-[#C8102E]/5"
                        : "border-gray-200 hover:border-gray-300",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                        form.role === value ? "bg-[#C8102E] text-white" : "bg-gray-100 text-gray-500",
                      ].join(" ")}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span
                      className={`text-xs font-semibold ${
                        form.role === value ? "text-[#C8102E]" : "text-gray-700"
                      }`}
                    >
                      {label}
                    </span>
                    <span className="text-[10px] leading-tight text-gray-400">{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-10 w-full rounded-lg bg-[#C8102E] font-semibold text-white transition-colors duration-200 hover:bg-[#a50d26]"
            >
              {loading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
            </Button>

            <div className="pt-2 text-center">
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-[#C8102E]"
              >
                <ChevronLeft className="h-4 w-4" />
                กลับไปเข้าสู่ระบบ
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
