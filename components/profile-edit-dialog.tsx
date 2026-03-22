"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  onProfileUpdated?: (user: any) => void;
}

export function ProfileEditDialog({
  open,
  onOpenChange,
  user,
  onProfileUpdated,
}: ProfileEditDialogProps) {
  type ProfileUpdatePayload = {
    name: string;
    phone: string;
    image: string;
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [imageUrl, setImageUrl] = useState(user?.image || "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    setName(user?.name || "");
    setPhone(user?.phone || "");
    setImageUrl(user?.image || "");
    setAvatarPreview(null);
    setAvatarFile(null);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrentPw(false);
    setShowNewPw(false);
  }, [open, user]);

  const email = user?.email || "";
  const role = user?.role || "staff";
  const roleLabel = role === "manager" ? "ผู้จัดการ" : role === "store" ? "Store" : "พนักงาน";

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("กรุณากรอกชื่อ-นามสกุล");
      return;
    }

    if (newPassword || confirmPassword || currentPassword) {
      if (!currentPassword) {
        toast.error("กรุณากรอกรหัสผ่านปัจจุบัน");
        return;
      }

      if (newPassword.length < 8) {
        toast.error("รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร");
        return;
      }

      if (newPassword !== confirmPassword) {
        toast.error("รหัสผ่านใหม่ไม่ตรงกัน");
        return;
      }
    }

    setSaving(true);

    try {
      let finalImageUrl = imageUrl;

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

        finalImageUrl = uploadData.url;
      }

      const updatePayload: ProfileUpdatePayload = {
        name: name.trim(),
        phone: phone.trim(),
        image: finalImageUrl,
      };

      const updateRes = await authClient.updateUser(updatePayload as any);

      if (updateRes.error) {
        toast.error(updateRes.error.message || "อัปเดตโปรไฟล์ไม่สำเร็จ");
        return;
      }

      if (newPassword && currentPassword) {
        const pwRes = await authClient.changePassword({
          currentPassword,
          newPassword,
          revokeOtherSessions: false,
        });

        if (pwRes.error) {
          toast.error(pwRes.error.message || "เปลี่ยนรหัสผ่านไม่สำเร็จ");
          return;
        }
      }

      const authUser =
        ((updateRes.data as { user?: Record<string, unknown> } | null | undefined)?.user ?? {}) as Record<
          string,
          unknown
        >;

      const updatedUser = {
        ...user,
        ...authUser,
        name: name.trim(),
        phone: phone.trim(),
        image: finalImageUrl,
      };

      setImageUrl(finalImageUrl);
      onProfileUpdated?.(updatedUser);
      toast.success("อัปเดตโปรไฟล์สำเร็จ");
      onOpenChange(false);
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSaving(false);
    }
  };

  const displayImage = avatarPreview || imageUrl;
  const initials = name
    ? name
        .split(" ")
        .map((part: string) => part[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "?";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">แก้ไขโปรไฟล์</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            แก้ไขข้อมูลส่วนตัวของคุณ
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="flex justify-center">
            <div className="group relative">
              <div
                className="flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-gray-200 bg-gray-100 transition-all hover:border-[#C8102E] hover:shadow-md"
                onClick={() => fileInputRef.current?.click()}
              >
                {displayImage ? (
                  <img src={displayImage} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-gray-500">{initials}</span>
                )}
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera className="h-5 w-5 text-white" />
                </div>
              </div>
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
            <Label className="text-sm font-medium">ชื่อ-นามสกุล</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ชื่อ-นามสกุล"
              className="h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">เบอร์โทรศัพท์</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08X-XXX-XXXX"
              maxLength={10}
              className="h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-muted-foreground">อีเมล</Label>
            <Input value={email} disabled className="h-9 bg-muted/50 text-muted-foreground" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-muted-foreground">สิทธิ์การใช้งาน</Label>
            <Input value={roleLabel} disabled className="h-9 bg-muted/50 text-muted-foreground" />
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700">เปลี่ยนรหัสผ่าน</h4>
            <p className="text-xs text-muted-foreground">ปล่อยว่างไว้หากไม่ต้องการเปลี่ยน</p>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">รหัสผ่านปัจจุบัน</Label>
              <div className="relative">
                <Input
                  type={showCurrentPw ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="รหัสผ่านปัจจุบัน"
                  className="h-9 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw((prev) => !prev)}
                  className="absolute top-1/2 right-2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">รหัสผ่านใหม่</Label>
                <div className="relative">
                  <Input
                    type={showNewPw ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="รหัสผ่านใหม่"
                    className="h-9 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw((prev) => !prev)}
                    className="absolute top-1/2 right-2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">ยืนยันรหัสผ่านใหม่</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="ยืนยัน"
                  className="h-9"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="h-9"
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="h-9 bg-[#C8102E] text-white hover:bg-[#a50d26]"
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            บันทึก
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
