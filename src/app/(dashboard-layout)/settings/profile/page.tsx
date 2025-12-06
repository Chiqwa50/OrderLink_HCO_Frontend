"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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

export default function ProfilePage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">الملف الشخصي</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>المعلومات الشخصية</CardTitle>
            <CardDescription>قم بتحديث معلومات حسابك</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-2xl">أح</AvatarFallback>
              </Avatar>
              <Button variant="outline">تغيير الصورة</Button>
            </div>
            <div className="space-y-2">
              <Label>الاسم الكامل</Label>
              <Input defaultValue="أحمد محمد" />
            </div>
            <div className="space-y-2">
              <Label>رقم الهاتف</Label>
              <Input defaultValue="0512345678" dir="ltr" disabled />
            </div>
            <div className="space-y-2">
              <Label>القسم</Label>
              <Input defaultValue="الطوارئ" disabled />
            </div>
            <div className="space-y-2">
              <Label>الدور الوظيفي</Label>
              <Input defaultValue="مشرف القسم" disabled />
            </div>
          </CardContent>
          <CardFooter>
            <Button>حفظ التغييرات</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>تغيير كلمة المرور</CardTitle>
            <CardDescription>قم بتحديث كلمة المرور الخاصة بك</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>كلمة المرور الحالية</Label>
              <Input type="password" />
            </div>
            <div className="space-y-2">
              <Label>كلمة المرور الجديدة</Label>
              <Input type="password" />
            </div>
            <div className="space-y-2">
              <Label>تأكيد كلمة المرور الجديدة</Label>
              <Input type="password" />
            </div>
          </CardContent>
          <CardFooter>
            <Button>تحديث كلمة المرور</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
