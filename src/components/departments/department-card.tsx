import { Building2, Edit, Star, Trash2, Warehouse as WarehouseIcon } from "lucide-react"
import { useState, useEffect } from "react"
import { Department, DepartmentWarehouse } from "@/types"
import { departmentService } from "@/services/department-service"
import { formatDate } from "@/lib/date-utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Loader2 } from "lucide-react"

interface DepartmentCardProps {
    dept: Department
    onEdit: (dept: Department) => void
    onToggleStatus: (id: string, currentStatus: boolean) => void
    onDelete: (id: string) => void
}

export function DepartmentCard({
    dept,
    onEdit,
    onToggleStatus,
    onDelete,
}: DepartmentCardProps) {
    const [warehouses, setWarehouses] = useState<DepartmentWarehouse[]>([])
    const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false)

    useEffect(() => {
        loadWarehouses()
    }, [dept.id])

    const loadWarehouses = async () => {
        try {
            setIsLoadingWarehouses(true)
            const data = await departmentService.getDepartmentWarehouses(dept.id)
            setWarehouses(data)
        } catch (err) {
            setWarehouses([])
        } finally {
            setIsLoadingWarehouses(false)
        }
    }

    return (
        <Card className="overflow-hidden">
            <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <div className="font-semibold text-lg">{dept.name}</div>
                        <Badge variant="outline" className="font-mono text-xs">
                            {dept.code}
                        </Badge>
                    </div>
                    <Badge variant={dept.isActive ? "default" : "secondary"}>
                        {dept.isActive ? "نشط" : "غير نشط"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-3">
                <div className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                    {dept.description || "لا يوجد وصف"}
                </div>

                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span>{formatDate(dept.createdAt)}</span>
                    </div>

                    {isLoadingWarehouses ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : warehouses.length === 0 ? (
                        <span className="text-xs text-muted-foreground">لا توجد مستودعات</span>
                    ) : (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 gap-1 px-2">
                                    <WarehouseIcon className="h-4 w-4" />
                                    <span>{warehouses.length} مستودع</span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80" align="end">
                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm">المستودعات المرتبطة</h4>
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {warehouses.map((dw) => (
                                            <div
                                                key={dw.id}
                                                className="flex items-center justify-between p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                                            >
                                                <div className="flex items-center gap-2 flex-1">
                                                    <Badge variant="outline" className="font-mono text-xs">
                                                        {dw.priority}
                                                    </Badge>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-sm truncate">
                                                            {dw.warehouse.name}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {dw.warehouse.code}
                                                        </div>
                                                    </div>
                                                </div>
                                                {dw.isPrimary && (
                                                    <Badge variant="default" className="gap-1 text-xs">
                                                        <Star className="h-3 w-3 fill-current" />
                                                        رئيسي
                                                    </Badge>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex gap-2">
                <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => onEdit(dept)}
                >
                    <Edit className="h-4 w-4 ml-2" />
                    تعديل
                </Button>
                <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => onToggleStatus(dept.id, dept.isActive)}
                >
                    {dept.isActive ? "تعطيل" : "تفعيل"}
                </Button>
                <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => onDelete(dept.id)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    )
}
