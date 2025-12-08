"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut, User } from "lucide-react"

import { getInitials } from "@/lib/utils"

import { useAuth } from "@/contexts/auth-context"
import { useIsDarkMode } from "@/hooks/use-mode"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function UserDropdown() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const isDarkMode = useIsDarkMode()

  const avatarSrc = isDarkMode
    ? "/images/avatars/male-Dark.svg"
    : "/images/avatars/male-Light.svg"

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-lg"
          aria-label="User"
        >
          <Avatar className="size-9">
            <AvatarImage src={avatarSrc} alt="" />
            <AvatarFallback className="bg-transparent">
              {user?.name && getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent forceMount>
        <DropdownMenuLabel className="flex gap-2">
          <Avatar>
            <AvatarImage src={avatarSrc} alt="Avatar" />
            <AvatarFallback className="bg-transparent">
              {user?.name && getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground font-semibold truncate">
              {user.phone}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup className="max-w-48">
          <DropdownMenuItem asChild>
            <Link href="/settings/profile">
              <User className="me-2 size-4" />
              الملف الشخصي
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="me-2 size-4" />
          تسجيل الخروج
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
