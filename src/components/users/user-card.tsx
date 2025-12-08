import { Edit, Trash2, User as UserIcon } from "lucide-react"
import { User } from "@/types"
import { formatDate } from "@/lib/date-utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

const roleLabels: Record<string, string> = {
    ADMIN: "مدير",
    WAREHOUSE: "مستودع",
    DEPARTMENT: "قسم",
    DRIVER: "سائق",
}

const roleColors: Record<string, string> = {
    ADMIN: "bg-red-100 text-red-800",
    WAREHOUSE: "bg-blue-100 text-blue-800",
    DEPARTMENT: "bg-green-100 text-green-800",
    DRIVER: "bg-yellow-100 text-yellow-800",
}

interface UserCardProps {
    user: User
    onEdit: (user: User) => void
    onDelete: (id: string) => void
}

export function UserCard({ user, onEdit, onDelete }: UserCardProps) {
    return (
        <Card className="overflow-hidden">
            <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <div className="font-semibold text-lg">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.phone}</div>
                    </div>
                    <Badge className={roleColors[user.role]}>
                        {roleLabels[user.role]}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-3">
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <UserIcon className="h-4 w-4" />
                        <span>{formatDate(user.createdAt)}</span>
                    </div>
                </div>

                <div className="text-sm">
                    <span className="font-medium ml-1">القسم:</span>
                    <span className="text-muted-foreground">
                        {user.department?.name || "-"}
                    </span>
                </div>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex gap-2">
                <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => onEdit(user)}
                >
                    <Edit className="h-4 w-4 ml-2" />
                    تعديل
                </Button>
                <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => onDelete(user.id)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    )
}
