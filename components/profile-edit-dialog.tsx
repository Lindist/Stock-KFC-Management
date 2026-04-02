"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/auth-client";
import { AVATAR_ALLOWED_TYPES, AVATAR_MAX_SIZE, fileToDataUrl } from "@/lib/avatar";
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

type DialogUser = {
  name?: string | null;
  phone?: string | null;
  image?: string | null;
  email?: string | null;
  role?: string | null;
  [key: string]: unknown;
};

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: DialogUser | null | undefined;
  onProfileUpdated?: (user: DialogUser) => void;
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
  const roleLabel = role === "manager" ? "เธเธนเนเธเธฑเธ”เธเธฒเธฃ" : role === "store" ? "Store" : "เธเธเธฑเธเธเธฒเธ";

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!AVATAR_ALLOWED_TYPES.includes(file.type)) {
      toast.error("เธฃเธญเธเธฃเธฑเธเน€เธเธเธฒเธฐเนเธเธฅเน JPG, PNG, WEBP");
      return;
    }

    if (file.size > AVATAR_MAX_SIZE) {
      toast.error("เนเธเธฅเนเธ•เนเธญเธเธกเธตเธเธเธฒเธ”เนเธกเนเน€เธเธดเธ 2MB");
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("เธเธฃเธธเธ“เธฒเธเธฃเธญเธเธเธทเนเธญ-เธเธฒเธกเธชเธเธธเธฅ");
      return;
    }

    if (newPassword || confirmPassword || currentPassword) {
      if (!currentPassword) {
        toast.error("เธเธฃเธธเธ“เธฒเธเธฃเธญเธเธฃเธซเธฑเธชเธเนเธฒเธเธเธฑเธเธเธธเธเธฑเธ");
        return;
      }

      if (newPassword.length < 8) {
        toast.error("เธฃเธซเธฑเธชเธเนเธฒเธเนเธซเธกเนเธ•เนเธญเธเธกเธตเธญเธขเนเธฒเธเธเนเธญเธข 8 เธ•เธฑเธงเธญเธฑเธเธฉเธฃ");
        return;
      }

      if (newPassword !== confirmPassword) {
        toast.error("เธฃเธซเธฑเธชเธเนเธฒเธเนเธซเธกเนเนเธกเนเธ•เธฃเธเธเธฑเธ");
        return;
      }
    }

    setSaving(true);

    try {
      let finalImageUrl = imageUrl;

      if (avatarFile) {
        finalImageUrl = await fileToDataUrl(avatarFile);
      }

      const updatePayload: ProfileUpdatePayload = {
        name: name.trim(),
        phone: phone.trim(),
        image: finalImageUrl,
      };

      const updateRes = await authClient.updateUser(
        updatePayload as Parameters<typeof authClient.updateUser>[0]
      );

      if (updateRes.error) {
        toast.error(updateRes.error.message || "เธญเธฑเธเน€เธ”เธ•เนเธเธฃเนเธเธฅเนเนเธกเนเธชเธณเน€เธฃเนเธ");
        return;
      }

      if (newPassword && currentPassword) {
        const pwRes = await authClient.changePassword({
          currentPassword,
          newPassword,
          revokeOtherSessions: false,
        });

        if (pwRes.error) {
          toast.error(pwRes.error.message || "เน€เธเธฅเธตเนเธขเธเธฃเธซเธฑเธชเธเนเธฒเธเนเธกเนเธชเธณเน€เธฃเนเธ");
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
      toast.success("เธญเธฑเธเน€เธ”เธ•เนเธเธฃเนเธเธฅเนเธชเธณเน€เธฃเนเธ");
      onOpenChange(false);
    } catch {
      toast.error("เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ” เธเธฃเธธเธ“เธฒเธฅเธญเธเนเธซเธกเน");
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
          <DialogTitle className="text-lg font-bold">เนเธเนเนเธเนเธเธฃเนเธเธฅเน</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            เนเธเนเนเธเธเนเธญเธกเธนเธฅเธชเนเธงเธเธ•เธฑเธงเธเธญเธเธเธธเธ“
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
            <Label className="text-sm font-medium">เธเธทเนเธญ-เธเธฒเธกเธชเธเธธเธฅ</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เธเธทเนเธญ-เธเธฒเธกเธชเธเธธเธฅ"
              className="h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">เน€เธเธญเธฃเนเนเธ—เธฃเธจเธฑเธเธ—เน</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08X-XXX-XXXX"
              maxLength={10}
              className="h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-muted-foreground">เธญเธตเน€เธกเธฅ</Label>
            <Input value={email} disabled className="h-9 bg-muted/50 text-muted-foreground" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-muted-foreground">เธชเธดเธ—เธเธดเนเธเธฒเธฃเนเธเนเธเธฒเธ</Label>
            <Input value={roleLabel} disabled className="h-9 bg-muted/50 text-muted-foreground" />
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700">เน€เธเธฅเธตเนเธขเธเธฃเธซเธฑเธชเธเนเธฒเธ</h4>
            <p className="text-xs text-muted-foreground">เธเธฅเนเธญเธขเธงเนเธฒเธเนเธงเนเธซเธฒเธเนเธกเนเธ•เนเธญเธเธเธฒเธฃเน€เธเธฅเธตเนเธขเธ</p>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">เธฃเธซเธฑเธชเธเนเธฒเธเธเธฑเธเธเธธเธเธฑเธ</Label>
              <div className="relative">
                <Input
                  type={showCurrentPw ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="เธฃเธซเธฑเธชเธเนเธฒเธเธเธฑเธเธเธธเธเธฑเธ"
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
                <Label className="text-sm font-medium">เธฃเธซเธฑเธชเธเนเธฒเธเนเธซเธกเน</Label>
                <div className="relative">
                  <Input
                    type={showNewPw ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="เธฃเธซเธฑเธชเธเนเธฒเธเนเธซเธกเน"
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
                <Label className="text-sm font-medium">เธขเธทเธเธขเธฑเธเธฃเธซเธฑเธชเธเนเธฒเธเนเธซเธกเน</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="เธขเธทเธเธขเธฑเธ"
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
            เธขเธเน€เธฅเธดเธ
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="h-9 bg-[#C8102E] text-white hover:bg-[#a50d26]"
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            เธเธฑเธเธ—เธถเธ
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
