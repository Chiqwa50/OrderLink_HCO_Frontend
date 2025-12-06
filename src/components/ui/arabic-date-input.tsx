"use client"

import { Calendar } from "lucide-react"

import { cn } from "@/lib/utils"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ArabicDateInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

/**
 * مكون إدخال التاريخ بالعربية
 * يوفر واجهة محسّنة لإدخال التاريخ مع دعم RTL
 */
export function ArabicDateInput({
  label,
  value,
  onChange,
  placeholder = "اختر التاريخ",
  className,
}: ArabicDateInputProps) {
  // تحويل التاريخ إلى صيغة عربية للعرض
  const formatDateToArabic = (dateStr: string): string => {
    if (!dateStr) return ""

    const date = new Date(dateStr)
    const day = date.getDate()
    const month = date.getMonth() + 1
    const year = date.getFullYear()

    const arabicMonths = [
      "يناير",
      "فبراير",
      "مارس",
      "إبريل",
      "مايو",
      "يونيو",
      "يوليو",
      "أغسطس",
      "سبتمبر",
      "أكتوبر",
      "نوفمبر",
      "ديسمبر",
    ]

    return `${day} ${arabicMonths[month - 1]} ${year}`
  }

  return (
    <div className={cn("space-y-2", className)} dir="rtl">
      <Label>{label}</Label>
      <div className="relative">
        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
        <Input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-10 text-right cursor-pointer"
          dir="rtl"
          lang="ar-SA"
          placeholder={placeholder}
        />
        {value && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
            {formatDateToArabic(value)}
          </div>
        )}
      </div>
    </div>
  )
}
