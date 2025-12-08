"use client"

import { useState } from "react"
import { Eye, Search } from "lucide-react"

import type { Order } from "@/types"

import { formatDateTime } from "@/lib/date-utils"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { OrderStatusBadge } from "./order-status-badge"

interface DeliveriesTableProps {
    orders: Order[]
    onViewOrder?: (order: Order) => void
}

export function DeliveriesTable({
    orders,
    onViewOrder,
}: DeliveriesTableProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    const filteredOrders = orders.filter((order) => {
        const matchesSearch =
            order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.departmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.warehouseName.toLowerCase().includes(searchTerm.toLowerCase())

        return matchesSearch
    })

    // Pagination logic
    const totalPages = Math.ceil(filteredOrders.length / pageSize)
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex)

    // Reset to page 1 when search changes
    if (currentPage > 1 && paginatedOrders.length === 0 && filteredOrders.length > 0) {
        setCurrentPage(1)
    }

    // Helper to get preparation date (when status became READY)
    const getPreparationDate = (order: Order) => {
        // Debug log
        // console.log(`Order ${order.orderNumber} history:`, order.history)

        const readyLog = order.history?.find(h => h.status === 'READY')
        return readyLog ? formatDateTime(readyLog.timestamp || readyLog.changedAt || '') : '-'
    }

    // Helper to get delivery date (when status became DELIVERED)
    const getDeliveryDate = (order: Order) => {
        // First try the order's deliveredAt field
        if (order.deliveredAt) return formatDateTime(order.deliveredAt)

        // Fallback to history log
        const deliveredLog = order.history?.find(h => h.status === 'DELIVERED')
        if (deliveredLog) return formatDateTime(deliveredLog.timestamp || deliveredLog.changedAt || '')

        // Final fallback to updatedAt (for legacy data)
        return formatDateTime(order.updatedAt)
    }

    // Helper to get driver name
    const getDriverName = (order: Order) => {
        const deliveredLog = order.history?.find(h => h.status === 'DELIVERED')
        return deliveredLog?.user?.name || deliveredLog?.changedByName || '-'
    }

    return (
        <div className="space-y-4" dir="rtl">
            {/* Search */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="بحث برقم الطلبية، القسم أو المستودع..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value)
                            setCurrentPage(1)
                        }}
                        className="pr-10"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right">رقم الطلبية</TableHead>
                            <TableHead className="text-right">القسم</TableHead>
                            <TableHead className="text-right">المستودع</TableHead>
                            <TableHead className="text-right">تاريخ التجهيز</TableHead>
                            <TableHead className="text-right">تاريخ التسليم</TableHead>
                            <TableHead className="text-right">السائق</TableHead>
                            <TableHead className="text-left">الإجراءات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedOrders.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    className="text-center h-24 text-muted-foreground"
                                >
                                    لا توجد توصيلات
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedOrders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="text-center font-mono text-sm sm:text-base py-4 whitespace-nowrap font-medium">
                                        {order.orderNumber}
                                    </TableCell>
                                    <TableCell className="text-center py-4 text-sm sm:text-base whitespace-nowrap">
                                        <div className="flex flex-col items-center">
                                            <span className="font-medium">
                                                {order.departmentName}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center py-4 text-sm sm:text-base whitespace-nowrap">
                                        <div className="flex flex-col items-center">
                                            <span className="font-medium">{order.warehouseName}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center text-sm sm:text-base py-4 whitespace-nowrap">{getPreparationDate(order)}</TableCell>
                                    <TableCell className="text-center text-sm sm:text-base py-4 whitespace-nowrap">{getDeliveryDate(order)}</TableCell>
                                    <TableCell className="text-center text-sm sm:text-base py-4 whitespace-nowrap">{getDriverName(order)}</TableCell>
                                    <TableCell className="text-center py-4">
                                        <div className="flex gap-2 justify-center">
                                            {onViewOrder && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => onViewOrder(order)}
                                                    title="عرض التفاصيل"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Results count */}
            <div className="text-sm text-muted-foreground">
                عرض {filteredOrders.length} من {orders.length} توصيلة
            </div>
        </div>
    )
}
