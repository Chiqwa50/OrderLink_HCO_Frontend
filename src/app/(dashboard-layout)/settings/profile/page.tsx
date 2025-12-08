"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { api } from "@/lib/api"

export default function ProfilePage() {
  const { user } = useAuth()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)

  const getRoleName = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "مدير النظام"
      case "DEPARTMENT":
        return "مشرف قسم"
      case "WAREHOUSE":
        return "مشرف مستودع"
      case "DRIVER":
        return "سائق"
      default:
        return role
    }
  }

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("جميع الحقول مطلوبة")
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error("كلمة المرور الجديدة غير متطابقة")
      return
    }

    setIsPasswordLoading(true)
    try {
      await api.updateMe({
        currentPassword,
        newPassword,
      })

      toast.success("تم تحديث كلمة المرور بنجاح")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "حدث خطأ أثناء تحديث كلمة المرور")
    } finally {
      setIsPasswordLoading(false)
    }
  }

  if (!user) {
    return <div>جاري التحميل...</div>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">الملف الشخصي</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>المعلومات الشخصية</CardTitle>
            <CardDescription>معلومات حسابك (للقراءة فقط)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>الاسم الكامل</Label>
              <Input value={user.name} disabled />
            </div>
            <div className="space-y-2">
              <Label>رقم الهاتف</Label>
              <Input value={user.phone} dir="ltr" disabled />
            </div>
            <div className="space-y-2">
              <Label>القسم</Label>
              <Input value={user.department?.name || "لا يوجد"} disabled />
            </div>
            <div className="space-y-2">
              <Label>الدور الوظيفي</Label>
              <Input value={getRoleName(user.role)} disabled />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>تغيير كلمة المرور</CardTitle>
            <CardDescription>قم بتحديث كلمة المرور الخاصة بك</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>كلمة المرور الحالية</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>كلمة المرور الجديدة</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>تأكيد كلمة المرور الجديدة</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleUpdatePassword} disabled={isPasswordLoading}>
              {isPasswordLoading ? "جاري التحديث..." : "تحديث كلمة المرور"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
