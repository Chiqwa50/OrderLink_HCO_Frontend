"use client"

import { useEffect, useState } from "react"
import { Shield, Users, Warehouse, Truck, Edit, Loader2, Save } from "lucide-react"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

import { userService } from "@/services/user-service"
import { userRestrictionService } from "@/services/user-restriction-service"
import type {
    User,
    UserRestriction,
    UpdateUserRestrictionRequest,
} from "@/types"

export default function UserRestrictionsPage() {
    const [departmentUsers, setDepartmentUsers] = useState<User[]>([])
    const [warehouseUsers, setWarehouseUsers] = useState<User[]>([])
    const [restrictions, setRestrictions] = useState<UserRestriction[]>([])
    const [warehouseRestrictions, setWarehouseRestrictions] = useState<UserRestriction[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Edit dialog state
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [editFormData, setEditFormData] = useState<UpdateUserRestrictionRequest>({})
    const [isUpdating, setIsUpdating] = useState(false)
    const [isLoadingEdit, setIsLoadingEdit] = useState(false)

    // Bulk apply dialog state
    const [showBulkDialog, setShowBulkDialog] = useState(false)
    const [bulkFormData, setBulkFormData] = useState<UpdateUserRestrictionRequest>({})
    const [isBulkUpdating, setIsBulkUpdating] = useState(false)
    const [bulkTargetRole, setBulkTargetRole] = useState<"DEPARTMENT" | "WAREHOUSE">("DEPARTMENT")

    // Pagination state
    const [visibleDepartmentUsersCount, setVisibleDepartmentUsersCount] = useState(10)
    const [visibleWarehouseUsersCount, setVisibleWarehouseUsersCount] = useState(10)

    const visibleDepartmentUsers = departmentUsers.slice(0, visibleDepartmentUsersCount)
    const visibleWarehouseUsers = warehouseUsers.slice(0, visibleWarehouseUsersCount)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setIsLoading(true)
        setError(null)

        try {
            // جلب جميع المستخدمين
            const allUsers = await userService.getUsers()

            // تصفية مسؤولي الأقسام
            const deptUsers = allUsers.filter((u) => u.role === "DEPARTMENT")
            setDepartmentUsers(deptUsers)

            // تصفية مسؤولي المستودعات
            const whUsers = allUsers.filter((u) => u.role === "WAREHOUSE")
            setWarehouseUsers(whUsers)

            // جلب القيود لمسؤولي الأقسام
            const deptRestrictionsData = await userRestrictionService.getRestrictionsByRole("DEPARTMENT")
            setRestrictions(deptRestrictionsData)

            // جلب القيود لمسؤولي المستودعات
            const whRestrictionsData = await userRestrictionService.getRestrictionsByRole("WAREHOUSE")
            setWarehouseRestrictions(whRestrictionsData)
        } catch (err) {
            setError(err instanceof Error ? err.message : "حدث خطأ أثناء تحميل البيانات")
        } finally {
            setIsLoading(false)
        }
    }

    const handleEdit = async (user: User) => {
        setEditingUser(user)
        setShowEditDialog(true)
        setIsLoadingEdit(true)

        // جلب القيود الحالية للمستخدم
        try {
            const userRestrictions = await userRestrictionService.getRestrictions(user.id)

            if (userRestrictions) {
                if (user.role === "DEPARTMENT") {
                    setEditFormData({
                        orderRateLimit: userRestrictions.orderRateLimit,
                        orderRatePeriodHours: userRestrictions.orderRatePeriodHours,
                        canViewAllOrders: userRestrictions.canViewAllOrders,
                        canReceiveReadyOrders: userRestrictions.canReceiveReadyOrders,
                    })
                } else if (user.role === "WAREHOUSE") {
                    setEditFormData({
                        canViewPendingOrders: userRestrictions.canViewPendingOrders,
                        canApproveOrders: userRestrictions.canApproveOrders,
                        canRejectOrders: userRestrictions.canRejectOrders,
                    })
                }
            } else {
                // القيم الافتراضية
                if (user.role === "DEPARTMENT") {
                    setEditFormData({
                        orderRateLimit: null,
                        orderRatePeriodHours: null,
                        canViewAllOrders: false,
                        canReceiveReadyOrders: false,
                    })
                } else if (user.role === "WAREHOUSE") {
                    setEditFormData({
                        canViewPendingOrders: false,
                        canApproveOrders: true,
                        canRejectOrders: true,
                    })
                }
            }
        } catch (err) {
            console.error("Error loading restrictions:", err)
            if (user.role === "DEPARTMENT") {
                setEditFormData({
                    orderRateLimit: null,
                    orderRatePeriodHours: null,
                    canViewAllOrders: false,
                    canReceiveReadyOrders: false,
                })
            } else if (user.role === "WAREHOUSE") {
                setEditFormData({
                    canViewPendingOrders: false,
                    canApproveOrders: true,
                    canRejectOrders: true,
                })
            }
        } finally {
            setIsLoadingEdit(false)
        }
    }

    const handleUpdate = async () => {
        if (!editingUser) return

        setIsUpdating(true)
        setError(null)

        try {
            await userRestrictionService.updateRestrictions(editingUser.id, editFormData)
            setShowEditDialog(false)
            setEditingUser(null)
            setEditFormData({})
            loadData()
        } catch (err) {
            setError(err instanceof Error ? err.message : "حدث خطأ أثناء التحديث")
        } finally {
            setIsUpdating(false)
        }
    }

    const getUserRestriction = (userId: string) => {
        return restrictions.find((r) => r.userId === userId)
    }

    const getWarehouseUserRestriction = (userId: string) => {
        return warehouseRestrictions.find((r) => r.userId === userId)
    }

    const handleBulkApply = async () => {
        setIsBulkUpdating(true)
        setError(null)

        try {
            const targetUsers = bulkTargetRole === "DEPARTMENT" ? departmentUsers : warehouseUsers
            // تطبيق القيود على جميع المستخدمين المستهدفين
            await Promise.all(
                targetUsers.map((user) =>
                    userRestrictionService.updateRestrictions(user.id, bulkFormData)
                )
            )
            setShowBulkDialog(false)
            setBulkFormData({})
            loadData()
        } catch (err) {
            setError(err instanceof Error ? err.message : "حدث خطأ أثناء تطبيق القيود")
        } finally {
            setIsBulkUpdating(false)
        }
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">قيود المستخدمين</h1>
                    <p className="text-muted-foreground">
                        إدارة الصلاحيات والقيود لكل دور وظيفي
                    </p>
                </div>
            </div>

            {/* Vertical Tabs Layout */}
            <Tabs defaultValue="department" className="flex flex-col md:flex-row gap-6" dir="rtl">
                {/* Vertical Tabs List */}
                <TabsList className="flex h-auto w-full flex-row overflow-x-auto md:w-64 md:flex-col items-stretch justify-start gap-2 bg-transparent p-0">
                    <TabsTrigger
                        value="department"
                        className="justify-start gap-3 rounded-lg border-2 border-transparent bg-muted px-4 py-3 text-right data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm min-w-[120px] md:min-w-0"
                    >
                        <Users className="h-5 w-5 shrink-0" />
                        <div className="flex flex-col items-start">
                            <span className="font-semibold">القسم</span>
                            <span className="text-xs text-muted-foreground hidden md:block">
                                Department Supervisor
                            </span>
                        </div>
                    </TabsTrigger>

                    <TabsTrigger
                        value="warehouse"
                        className="justify-start gap-3 rounded-lg border-2 border-transparent bg-muted px-4 py-3 text-right data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm min-w-[120px] md:min-w-0"
                    >
                        <Warehouse className="h-5 w-5 shrink-0" />
                        <div className="flex flex-col items-start">
                            <span className="font-semibold">المستودع</span>
                            <span className="text-xs text-muted-foreground hidden md:block">
                                Warehouse Supervisor
                            </span>
                        </div>
                    </TabsTrigger>

                    <TabsTrigger
                        value="driver"
                        className="justify-start gap-3 rounded-lg border-2 border-transparent bg-muted px-4 py-3 text-right data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm min-w-[120px] md:min-w-0"
                    >
                        <Truck className="h-5 w-5 shrink-0" />
                        <div className="flex flex-col items-start">
                            <span className="font-semibold">السائقين</span>
                            <span className="text-xs text-muted-foreground hidden md:block">Driver</span>
                        </div>
                    </TabsTrigger>
                </TabsList>

                {/* Tab Contents */}
                <div className="flex-1">
                    {/* Department Supervisor Tab */}
                    <TabsContent value="department" className="mt-0 space-y-6">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <Card>
                            <CardHeader>
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Users className="h-5 w-5" />
                                            قيود مسؤول القسم
                                        </CardTitle>
                                        <CardDescription>
                                            إدارة الصلاحيات والقيود الخاصة بمسؤولي الأقسام
                                        </CardDescription>
                                    </div>
                                    {departmentUsers.length > 0 && (
                                        <Button
                                            onClick={() => setShowBulkDialog(true)}
                                            variant="outline"
                                            className="w-full md:w-auto"
                                        >
                                            <Users className="ml-2 h-4 w-4" />
                                            تطبيق على الجميع
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="flex justify-center items-center py-8">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                                ) : departmentUsers.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        لا يوجد مسؤولو أقسام
                                    </div>
                                ) : (
                                    <>
                                        {/* Mobile View (Cards) */}
                                        <div className="grid gap-4 md:hidden">
                                            {visibleDepartmentUsers.map((user) => {
                                                const restriction = getUserRestriction(user.id)
                                                return (
                                                    <Card key={user.id} className="bg-muted/50">
                                                        <CardContent className="p-4 space-y-4">
                                                            <div className="flex items-start justify-between">
                                                                <div className="space-y-1">
                                                                    <p className="font-semibold">{user.name}</p>
                                                                    <p className="text-sm text-muted-foreground">{user.phone}</p>
                                                                </div>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleEdit(user)}
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </div>

                                                            <div className="space-y-2">
                                                                <div className="flex justify-between text-sm">
                                                                    <span className="text-muted-foreground">معدل الطلبات:</span>
                                                                    {restriction?.orderRateLimit && restriction?.orderRatePeriodHours ? (
                                                                        <Badge variant="outline">
                                                                            {restriction.orderRateLimit} طلبات / {restriction.orderRatePeriodHours} ساعة
                                                                        </Badge>
                                                                    ) : (
                                                                        <span className="text-muted-foreground">غير محدد</span>
                                                                    )}
                                                                </div>
                                                                <div className="flex justify-between text-sm">
                                                                    <span className="text-muted-foreground">رؤية الطلبيات:</span>
                                                                    {restriction ? (
                                                                        <Badge variant={restriction.canViewAllOrders ? "default" : "secondary"}>
                                                                            {restriction.canViewAllOrders ? "جميع الطلبيات" : "طلبياته فقط"}
                                                                        </Badge>
                                                                    ) : (
                                                                        <Badge variant="secondary">طلبياته فقط</Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                )
                                            })}
                                        </div>

                                        {/* Desktop View (Table) */}
                                        <div className="hidden md:block">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="text-right">الاسم</TableHead>
                                                        <TableHead className="text-right">رقم الهاتف</TableHead>
                                                        <TableHead className="text-right">معدل الطلبات</TableHead>
                                                        <TableHead className="text-right">رؤية الطلبيات</TableHead>
                                                        <TableHead className="text-left">الإجراءات</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {visibleDepartmentUsers.map((user) => {
                                                        const restriction = getUserRestriction(user.id)
                                                        return (
                                                            <TableRow key={user.id}>
                                                                <TableCell className="font-medium">{user.name}</TableCell>
                                                                <TableCell>{user.phone}</TableCell>
                                                                <TableCell>
                                                                    {restriction?.orderRateLimit && restriction?.orderRatePeriodHours ? (
                                                                        <Badge variant="outline">
                                                                            {restriction.orderRateLimit} طلبات / {restriction.orderRatePeriodHours} ساعة
                                                                        </Badge>
                                                                    ) : (
                                                                        <span className="text-sm text-muted-foreground">غير محدد</span>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {restriction ? (
                                                                        <Badge variant={restriction.canViewAllOrders ? "default" : "secondary"}>
                                                                            {restriction.canViewAllOrders ? "جميع الطلبيات" : "طلبياته فقط"}
                                                                        </Badge>
                                                                    ) : (
                                                                        <Badge variant="secondary">طلبياته فقط</Badge>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="text-left">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => handleEdit(user)}
                                                                    >
                                                                        <Edit className="h-4 w-4" />
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        )
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        {visibleDepartmentUsersCount < departmentUsers.length && (
                                            <div className="flex justify-center pt-4">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setVisibleDepartmentUsersCount((prev) => prev + 10)}
                                                >
                                                    تحميل المزيد
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Warehouse Supervisor Tab */}
                    <TabsContent value="warehouse" className="mt-0 space-y-6">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <Card>
                            <CardHeader>
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Warehouse className="h-5 w-5" />
                                            قيود مسؤول المستودع
                                        </CardTitle>
                                        <CardDescription>
                                            إدارة الصلاحيات والقيود الخاصة بمسؤولي المستودعات
                                        </CardDescription>
                                    </div>
                                    {warehouseUsers.length > 0 && (
                                        <Button
                                            onClick={() => {
                                                setBulkTargetRole("WAREHOUSE")
                                                setShowBulkDialog(true)
                                            }}
                                            variant="outline"
                                            className="w-full md:w-auto"
                                        >
                                            <Users className="ml-2 h-4 w-4" />
                                            تطبيق على الجميع
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="flex justify-center items-center py-8">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                                ) : warehouseUsers.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        لا يوجد مسؤولو مستودعات
                                    </div>
                                ) : (
                                    <>
                                        {/* Mobile View (Cards) */}
                                        <div className="grid gap-4 md:hidden">
                                            {visibleWarehouseUsers.map((user) => {
                                                const restriction = getWarehouseUserRestriction(user.id)
                                                return (
                                                    <Card key={user.id} className="bg-muted/50">
                                                        <CardContent className="p-4 space-y-4">
                                                            <div className="flex items-start justify-between">
                                                                <div className="space-y-1">
                                                                    <p className="font-semibold">{user.name}</p>
                                                                    <p className="text-sm text-muted-foreground">{user.phone}</p>
                                                                </div>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleEdit(user)}
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </div>

                                                            <div className="space-y-2">
                                                                <div className="flex justify-between text-sm">
                                                                    <span className="text-muted-foreground">رؤية الطلبات قيد المراجعة:</span>
                                                                    <Badge variant={restriction?.canViewPendingOrders ? "default" : "secondary"}>
                                                                        {restriction?.canViewPendingOrders ? "نعم" : "لا"}
                                                                    </Badge>
                                                                </div>
                                                                <div className="flex justify-between text-sm">
                                                                    <span className="text-muted-foreground">قبول الطلبات:</span>
                                                                    <Badge variant={restriction?.canApproveOrders !== false ? "default" : "secondary"}>
                                                                        {restriction?.canApproveOrders !== false ? "نعم" : "لا"}
                                                                    </Badge>
                                                                </div>
                                                                <div className="flex justify-between text-sm">
                                                                    <span className="text-muted-foreground">رفض الطلبات:</span>
                                                                    <Badge variant={restriction?.canRejectOrders !== false ? "default" : "secondary"}>
                                                                        {restriction?.canRejectOrders !== false ? "نعم" : "لا"}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                )
                                            })}
                                        </div>

                                        {/* Desktop View (Table) */}
                                        <div className="hidden md:block">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="text-right">الاسم</TableHead>
                                                        <TableHead className="text-right">رقم الهاتف</TableHead>
                                                        <TableHead className="text-right">رؤية الطلبات قيد المراجعة</TableHead>
                                                        <TableHead className="text-right">قبول الطلبات</TableHead>
                                                        <TableHead className="text-right">رفض الطلبات</TableHead>
                                                        <TableHead className="text-left">الإجراءات</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {visibleWarehouseUsers.map((user) => {
                                                        const restriction = getWarehouseUserRestriction(user.id)
                                                        return (
                                                            <TableRow key={user.id}>
                                                                <TableCell className="font-medium">{user.name}</TableCell>
                                                                <TableCell>{user.phone}</TableCell>
                                                                <TableCell>
                                                                    <Badge variant={restriction?.canViewPendingOrders ? "default" : "secondary"}>
                                                                        {restriction?.canViewPendingOrders ? "نعم" : "لا"}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge variant={restriction?.canApproveOrders !== false ? "default" : "secondary"}>
                                                                        {restriction?.canApproveOrders !== false ? "نعم" : "لا"}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge variant={restriction?.canRejectOrders !== false ? "default" : "secondary"}>
                                                                        {restriction?.canRejectOrders !== false ? "نعم" : "لا"}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="text-left">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => handleEdit(user)}
                                                                    >
                                                                        <Edit className="h-4 w-4" />
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        )
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        {visibleWarehouseUsersCount < warehouseUsers.length && (
                                            <div className="flex justify-center pt-4">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setVisibleWarehouseUsersCount((prev) => prev + 10)}
                                                >
                                                    تحميل المزيد
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Driver Tab */}
                    <TabsContent value="driver" className="mt-0">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Truck className="h-5 w-5" />
                                    قيود السائق
                                </CardTitle>
                                <CardDescription>
                                    إدارة الصلاحيات والقيود الخاصة بالسائقين
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="rounded-full bg-muted p-6 mb-4">
                                        <Truck className="h-12 w-12 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2">
                                        محتوى قيود السائق
                                    </h3>
                                    <p className="text-sm text-muted-foreground max-w-md">
                                        سيتم إضافة الصلاحيات والقيود الخاصة بالسائقين هنا
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </div>
            </Tabs>

            {/* Edit Restrictions Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>تعديل قيود المستخدم</DialogTitle>
                        <DialogDescription>
                            قم بتعديل القيود الخاصة بـ {editingUser?.name}
                        </DialogDescription>
                    </DialogHeader>

                    {isLoadingEdit ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <span className="mr-3 text-muted-foreground">جاري تحميل البيانات...</span>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-6 py-4">
                                {editingUser?.role === "DEPARTMENT" ? (
                                    <>
                                        {/* معدل الطلبات */}
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-semibold">معدل الطلبات</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="orderRateLimit">عدد الطلبات المسموح بها</Label>
                                                    <Input
                                                        id="orderRateLimit"
                                                        type="number"
                                                        min="1"
                                                        placeholder="مثال: 3"
                                                        value={editFormData.orderRateLimit || ""}
                                                        onChange={(e) =>
                                                            setEditFormData({
                                                                ...editFormData,
                                                                orderRateLimit: e.target.value ? parseInt(e.target.value) : null,
                                                            })
                                                        }
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="orderRatePeriodHours">الفترة الزمنية (بالساعات)</Label>
                                                    <Input
                                                        id="orderRatePeriodHours"
                                                        type="number"
                                                        min="1"
                                                        placeholder="مثال: 24"
                                                        value={editFormData.orderRatePeriodHours || ""}
                                                        onChange={(e) =>
                                                            setEditFormData({
                                                                ...editFormData,
                                                                orderRatePeriodHours: e.target.value ? parseInt(e.target.value) : null,
                                                            })
                                                        }
                                                    />
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                مثال: 3 طلبات كل 24 ساعة (يستخدم نافذة متحركة)
                                            </p>
                                        </div>

                                        {/* رؤية الطلبيات */}
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-semibold">رؤية الطلبيات</h3>
                                            <div className="flex items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <Label htmlFor="canViewAllOrders" className="text-base">
                                                        رؤية جميع طلبيات القسم
                                                    </Label>
                                                    <p className="text-sm text-muted-foreground">
                                                        إذا كان مفعلاً، يمكن للمستخدم رؤية جميع طلبيات القسم. وإلا، يرى طلبياته فقط.
                                                    </p>
                                                </div>
                                                <Switch
                                                    id="canViewAllOrders"
                                                    checked={editFormData.canViewAllOrders || false}
                                                    onCheckedChange={(checked: boolean) =>
                                                        setEditFormData({
                                                            ...editFormData,
                                                            canViewAllOrders: checked,
                                                        })
                                                    }
                                                />
                                            </div>
                                        </div>

                                        {/* استلام الطلبيات الجاهزة */}
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-semibold">الإجراءات</h3>
                                            <div className="flex items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <Label htmlFor="canReceiveReadyOrders" className="text-base">
                                                        يمكنه استلام الطلبيات الجاهزة
                                                    </Label>
                                                    <p className="text-sm text-muted-foreground">
                                                        إذا كان مفعلاً، يمكن للمستخدم استلام الطلبيات الجاهزة بنفسه بدلاً من انتظار السائق.
                                                    </p>
                                                </div>
                                                <Switch
                                                    id="canReceiveReadyOrders"
                                                    checked={editFormData.canReceiveReadyOrders || false}
                                                    onCheckedChange={(checked: boolean) =>
                                                        setEditFormData({
                                                            ...editFormData,
                                                            canReceiveReadyOrders: checked,
                                                        })
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </>
                                ) : editingUser?.role === "WAREHOUSE" ? (
                                    <>
                                        {/* قيود مسؤول المستودع */}
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-semibold">الصلاحيات</h3>

                                            {/* رؤية الطلبات قيد المراجعة */}
                                            <div className="flex items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <Label htmlFor="canViewPendingOrders" className="text-base">
                                                        رؤية الطلبات قيد المراجعة
                                                    </Label>
                                                    <p className="text-sm text-muted-foreground">
                                                        إذا كان مفعلاً، يمكن للمستخدم رؤية الطلبات التي لم تتم الموافقة عليها بعد.
                                                    </p>
                                                </div>
                                                <Switch
                                                    id="canViewPendingOrders"
                                                    checked={editFormData.canViewPendingOrders || false}
                                                    onCheckedChange={(checked: boolean) =>
                                                        setEditFormData({
                                                            ...editFormData,
                                                            canViewPendingOrders: checked,
                                                        })
                                                    }
                                                />
                                            </div>

                                            {/* قبول الطلبات */}
                                            <div className="flex items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <Label htmlFor="canApproveOrders" className="text-base">
                                                        يمكنه قبول الطلبات
                                                    </Label>
                                                    <p className="text-sm text-muted-foreground">
                                                        إذا كان مفعلاً، يمكن للمستخدم الموافقة على الطلبات قيد المراجعة.
                                                    </p>
                                                </div>
                                                <Switch
                                                    id="canApproveOrders"
                                                    checked={editFormData.canApproveOrders !== false}
                                                    onCheckedChange={(checked: boolean) =>
                                                        setEditFormData({
                                                            ...editFormData,
                                                            canApproveOrders: checked,
                                                        })
                                                    }
                                                />
                                            </div>

                                            {/* رفض الطلبات */}
                                            <div className="flex items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <Label htmlFor="canRejectOrders" className="text-base">
                                                        يمكنه رفض الطلبات
                                                    </Label>
                                                    <p className="text-sm text-muted-foreground">
                                                        إذا كان مفعلاً، يمكن للمستخدم رفض الطلبات قيد المراجعة.
                                                    </p>
                                                </div>
                                                <Switch
                                                    id="canRejectOrders"
                                                    checked={editFormData.canRejectOrders !== false}
                                                    onCheckedChange={(checked: boolean) =>
                                                        setEditFormData({
                                                            ...editFormData,
                                                            canRejectOrders: checked,
                                                        })
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </>
                                ) : null}
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowEditDialog(false)}
                                    disabled={isUpdating}
                                >
                                    إلغاء
                                </Button>
                                <Button onClick={handleUpdate} disabled={isUpdating || isLoadingEdit}>
                                    {isUpdating ? (
                                        <>
                                            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                            جاري الحفظ...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="ml-2 h-4 w-4" />
                                            حفظ التعديلات
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Bulk Apply Restrictions Dialog */}
            <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>تطبيق القيود على جميع المستخدمين</DialogTitle>
                        <DialogDescription>
                            {bulkTargetRole === "DEPARTMENT"
                                ? `سيتم تطبيق هذه القيود على جميع مسؤولي الأقسام (${departmentUsers.length} مستخدم)`
                                : `سيتم تطبيق هذه القيود على جميع مسؤولي المستودعات (${warehouseUsers.length} مستخدم)`
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        {bulkTargetRole === "DEPARTMENT" ? (
                            <>
                                {/* معدل الطلبات */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold">معدل الطلبات</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="bulk-orderRateLimit">عدد الطلبات المسموح بها</Label>
                                            <Input
                                                id="bulk-orderRateLimit"
                                                type="number"
                                                min="1"
                                                placeholder="مثال: 3"
                                                value={bulkFormData.orderRateLimit || ""}
                                                onChange={(e) =>
                                                    setBulkFormData({
                                                        ...bulkFormData,
                                                        orderRateLimit: e.target.value ? parseInt(e.target.value) : null,
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="bulk-orderRatePeriodHours">الفترة الزمنية (بالساعات)</Label>
                                            <Input
                                                id="bulk-orderRatePeriodHours"
                                                type="number"
                                                min="1"
                                                placeholder="مثال: 24"
                                                value={bulkFormData.orderRatePeriodHours || ""}
                                                onChange={(e) =>
                                                    setBulkFormData({
                                                        ...bulkFormData,
                                                        orderRatePeriodHours: e.target.value ? parseInt(e.target.value) : null,
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        مثال: 3 طلبات كل 24 ساعة (يستخدم نافذة متحركة)
                                    </p>
                                </div>

                                {/* رؤية الطلبيات */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold">رؤية الطلبيات</h3>
                                    <div className="flex items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="bulk-canViewAllOrders" className="text-base">
                                                رؤية جميع طلبيات القسم
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                إذا كان مفعلاً، يمكن للمستخدمين رؤية جميع طلبيات القسم. وإلا، يرون طلبياتهم فقط.
                                            </p>
                                        </div>
                                        <Switch
                                            id="bulk-canViewAllOrders"
                                            checked={bulkFormData.canViewAllOrders || false}
                                            onCheckedChange={(checked: boolean) =>
                                                setBulkFormData({
                                                    ...bulkFormData,
                                                    canViewAllOrders: checked,
                                                })
                                            }
                                        />
                                    </div>
                                </div>

                                {/* استلام الطلبيات الجاهزة */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold">الإجراءات</h3>
                                    <div className="flex items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="bulk-canReceiveReadyOrders" className="text-base">
                                                يمكنهم استلام الطلبيات الجاهزة
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                إذا كان مفعلاً، يمكن للمستخدمين استلام الطلبيات الجاهزة بأنفسهم بدلاً من انتظار السائق.
                                            </p>
                                        </div>
                                        <Switch
                                            id="bulk-canReceiveReadyOrders"
                                            checked={bulkFormData.canReceiveReadyOrders || false}
                                            onCheckedChange={(checked: boolean) =>
                                                setBulkFormData({
                                                    ...bulkFormData,
                                                    canReceiveReadyOrders: checked,
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* قيود مسؤول المستودع */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold">الصلاحيات</h3>

                                    {/* رؤية الطلبات قيد المراجعة */}
                                    <div className="flex items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="bulk-canViewPendingOrders" className="text-base">
                                                رؤية الطلبات قيد المراجعة
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                إذا كان مفعلاً، يمكن للمستخدمين رؤية الطلبات التي لم تتم الموافقة عليها بعد.
                                            </p>
                                        </div>
                                        <Switch
                                            id="bulk-canViewPendingOrders"
                                            checked={bulkFormData.canViewPendingOrders || false}
                                            onCheckedChange={(checked: boolean) =>
                                                setBulkFormData({
                                                    ...bulkFormData,
                                                    canViewPendingOrders: checked,
                                                })
                                            }
                                        />
                                    </div>

                                    {/* قبول الطلبات */}
                                    <div className="flex items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="bulk-canApproveOrders" className="text-base">
                                                يمكنهم قبول الطلبات
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                إذا كان مفعلاً، يمكن للمستخدمين الموافقة على الطلبات قيد المراجعة.
                                            </p>
                                        </div>
                                        <Switch
                                            id="bulk-canApproveOrders"
                                            checked={bulkFormData.canApproveOrders !== false}
                                            onCheckedChange={(checked: boolean) =>
                                                setBulkFormData({
                                                    ...bulkFormData,
                                                    canApproveOrders: checked,
                                                })
                                            }
                                        />
                                    </div>

                                    {/* رفض الطلبات */}
                                    <div className="flex items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="bulk-canRejectOrders" className="text-base">
                                                يمكنهم رفض الطلبات
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                إذا كان مفعلاً، يمكن للمستخدمين رفض الطلبات قيد المراجعة.
                                            </p>
                                        </div>
                                        <Switch
                                            id="bulk-canRejectOrders"
                                            checked={bulkFormData.canRejectOrders !== false}
                                            onCheckedChange={(checked: boolean) =>
                                                setBulkFormData({
                                                    ...bulkFormData,
                                                    canRejectOrders: checked,
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowBulkDialog(false)}
                            disabled={isBulkUpdating}
                        >
                            إلغاء
                        </Button>
                        <Button onClick={handleBulkApply} disabled={isBulkUpdating}>
                            {isBulkUpdating ? (
                                <>
                                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                    جاري التطبيق...
                                </>
                            ) : (
                                <>
                                    <Save className="ml-2 h-4 w-4" />
                                    تطبيق على الجميع
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
