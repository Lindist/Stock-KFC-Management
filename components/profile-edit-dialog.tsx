"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Camera, Eye, EyeOff, Loader2, User } from "lucide-react";
import { authClient } from "@/lib/auth/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
}

export function ProfileEditDialog({ open, onOpenChange, user }: ProfileEditDialogProps) {
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

  // Sync props to state when dialog opens
  useEffect(() => {
    if (open) {
      setName(user?.name || "");
      setPhone(user?.phone || "");
      setImageUrl(user?.image || "");
      setAvatarPreview(null);
      setAvatarFile(null);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
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

    // Password validation
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

      // Upload new avatar if selected
      if (avatarFile) {
        const formData = new FormData();
        formData.append("file", avatarFile);
        const uploadRes = await fetch("/api/upload-avatar", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          toast.error(uploadData.error || "อัปโหลดรูปไม่สำเร็จ");
          return;
        }
        finalImageUrl = uploadData.url;
      }

      // Update profile info
      const profileRes = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          image: finalImageUrl,
        }),
      });

      if (!profileRes.ok) {
        const errData = await profileRes.json();
        toast.error(errData.error || "อัปเดตโปรไฟล์ไม่สำเร็จ");
        return;
      }

      // Change password if provided
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

      toast.success("อัปเดตโปรไฟล์สำเร็จ");
      onOpenChange(false);
      // Reload page to get fresh session data
      window.location.reload();
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSaving(false);
    }
  };

  const displayImage = avatarPreview || imageUrl;
  const initials = name
    ? name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
    : "?";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">แก้ไขโปรไฟล์</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            แก้ไขข้อมูลส่วนตัวของคุณ
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Avatar */}
          <div className="flex justify-center">
            <div className="relative group">
              <div
                className="w-20 h-20 rounded-full border-2 border-gray-200 flex items-center justify-center overflow-hidden bg-gray-100 cursor-pointer transition-all hover:border-[#C8102E] hover:shadow-md"
                onClick={() => fileInputRef.current?.click()}
              >
                {displayImage ? (
                  <img src={displayImage} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-gray-500">{initials}</span>
                )}
                <div className="absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white" />
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

          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">ชื่อ-นามสกุล</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ชื่อ-นามสกุล"
              className="h-9"
            />
          </div>

          {/* Phone */}
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

          {/* Email (read-only) */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-muted-foreground">อีเมล</Label>
            <Input
              value={email}
              disabled
              className="h-9 bg-muted/50 text-muted-foreground"
            />
          </div>

          {/* Role (read-only) */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-muted-foreground">สิทธิ์การใช้งาน</Label>
            <Input
              value={roleLabel}
              disabled
              className="h-9 bg-muted/50 text-muted-foreground"
            />
          </div>

          <Separator />

          {/* Password Change */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700">เปลี่ยนรหัสผ่าน</h4>
            <p className="text-xs text-muted-foreground">เว้นว่างไว้หากไม่ต้องการเปลี่ยน</p>

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
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
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
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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

        {/* Actions */}
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
            className="h-9 bg-[#C8102E] hover:bg-[#a50d26] text-white"
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            บันทึก
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
