import { Edit, Trash2, Warehouse } from "lucide-react"
import { Warehouse as WarehouseType, WarehouseType as WType } from "@/types"
import { formatDate } from "@/lib/date-utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

const warehouseTypeLabels: Record<WType, string> = {
    pharmaceutical: "دوائي",
    logistics: "لوجستي",
    equipment: "أجهزة",
    medical: "طبي",
    general: "عام",
}

const warehouseTypeColors: Record<WType, string> = {
    pharmaceutical: "bg-blue-100 text-blue-800",
    logistics: "bg-green-100 text-green-800",
    equipment: "bg-purple-100 text-purple-800",
    medical: "bg-red-100 text-red-800",
    general: "bg-gray-100 text-gray-800",
}

interface WarehouseCardProps {
    warehouse: WarehouseType
    onEdit: (warehouse: WarehouseType) => void
    onToggleStatus: (id: string, currentStatus: boolean) => void
    onDelete: (id: string) => void
}

export function WarehouseCard({
    warehouse,
    onEdit,
    onToggleStatus,
    onDelete,
}: WarehouseCardProps) {
    return (
        <Card className="overflow-hidden">
            <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <div className="font-semibold text-lg">{warehouse.name}</div>
                        <Badge variant="outline" className="font-mono text-xs">
                            {warehouse.code}
                        </Badge>
                    </div>
                    <Badge variant={warehouse.isActive ? "default" : "secondary"}>
                        {warehouse.isActive ? "نشط" : "غير نشط"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-3">
                <div className="flex items-center justify-between">
                    <Badge className={warehouseTypeColors[warehouse.type]}>
                        {warehouseTypeLabels[warehouse.type]}
                    </Badge>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Warehouse className="h-4 w-4" />
                        <span>{formatDate(warehouse.createdAt)}</span>
                    </div>
                </div>

                <div className="text-sm">
                    <span className="font-medium ml-1">الموقع:</span>
                    <span className="text-muted-foreground">
                        {warehouse.location || "غير محدد"}
                    </span>
                </div>

                <div className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                    {warehouse.description || "لا يوجد وصف"}
                </div>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex gap-2">
                <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => onEdit(warehouse)}
                >
                    <Edit className="h-4 w-4 ml-2" />
                    تعديل
                </Button>
                <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => onToggleStatus(warehouse.id, warehouse.isActive)}
                >
                    {warehouse.isActive ? "تعطيل" : "تفعيل"}
                </Button>
                <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => onDelete(warehouse.id)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    )
}
