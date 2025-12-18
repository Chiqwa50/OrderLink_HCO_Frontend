
"use client"

import { useEffect, useState } from "react"
import { itemService } from "@/services/item-service"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Calendar as CalendarIcon,
    Filter,
    Loader2,
    X,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Printer,
    Eye,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export default function UnavailableItemsPage() {
    const [logs, setLogs] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [categories, setCategories] = useState<string[]>([])
    const [filters, setFilters] = useState({
        dateFrom: undefined as Date | undefined,
        dateTo: undefined as Date | undefined,
        category: "ALL",
    })
    const [sortConfig, setSortConfig] = useState<{
        key: string
        direction: "asc" | "desc"
    }>({ key: "date", direction: "desc" })

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const [isPrinting, setIsPrinting] = useState(false)
    const [visibleColumns, setVisibleColumns] = useState({
        itemName: true,
        warehouse: true,
        orderNumber: true,
        user: true,
        date: true,
        notes: true,
    })

    useEffect(() => {
        fetchCategories()
    }, [])

    useEffect(() => {
        fetchLogs()
    }, [filters, sortConfig, currentPage, pageSize])

    const fetchCategories = async () => {
        try {
            const data = await itemService.getCategories()
            setCategories(data)
        } catch (error) {
            console.error("Error fetching categories:", error)
        }
    }

    const fetchLogs = async () => {
        setIsLoading(true)
        try {
            const queryFilters: any = {}
            if (filters.dateFrom)
                queryFilters.dateFrom = filters.dateFrom.toISOString()
            if (filters.dateTo) queryFilters.dateTo = filters.dateTo.toISOString()
            if (filters.category !== "ALL") queryFilters.category = filters.category

            queryFilters.sortBy = sortConfig.key
            queryFilters.sortOrder = sortConfig.direction
            queryFilters.page = currentPage
            queryFilters.limit = pageSize

            const data = await itemService.getUnavailableItems(queryFilters)
            console.log("Unavailable items API response:", data);

            if (data && Array.isArray(data.logs)) {
                setLogs(data.logs)
                setTotalPages(data.totalPages || 1)
                setTotalItems(data.total || data.logs.length)
            } else if (Array.isArray(data)) {
                // Fallback for backward compatibility if backend returns array directly
                console.warn("Backend returned array directly. Pagination might not work.");
                setLogs(data);
                setTotalPages(1);
                setTotalItems(data.length);
            } else {
                console.error("Unexpected API response format:", data);
                setLogs([]);
            }
        } catch (error) {
            console.error("Error fetching logs:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSort = (key: string) => {
        setSortConfig((current) => ({
            key,
            direction:
                current.key === key && current.direction === "asc" ? "desc" : "asc",
        }))
    }

    const SortIcon = ({ columnKey }: { columnKey: string }) => {
        if (sortConfig.key !== columnKey) return <ArrowUpDown className="ml-2 h-4 w-4" />
        return sortConfig.direction === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
        ) : (
            <ArrowDown className="ml-2 h-4 w-4" />
        )
    }

    const handlePrint = async () => {
        setIsPrinting(true)
        try {
            // 1. Fetch all filtered data
            const queryFilters: any = {}
            if (filters.dateFrom) queryFilters.dateFrom = filters.dateFrom.toISOString()
            if (filters.dateTo) queryFilters.dateTo = filters.dateTo.toISOString()
            if (filters.category !== "ALL") queryFilters.category = filters.category

            queryFilters.sortBy = sortConfig.key
            queryFilters.sortOrder = sortConfig.direction
            queryFilters.limit = 1000 // Fetch all (or a large number)

            const data = await itemService.getUnavailableItems(queryFilters)
            const printLogs = data.logs || []

            // 2. Generate HTML
            const printWindow = window.open('', '_blank')
            if (!printWindow) {
                alert("Please allow popups to print")
                return
            }

            const dateStr = new Date().toLocaleDateString('ar-EG-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' })
            const timeStr = new Date().toLocaleTimeString('ar-EG-u-nu-latn', { hour: '2-digit', minute: '2-digit' })

            const filterSummary = []
            if (filters.dateFrom) filterSummary.push(`<strong>من تاريخ:</strong> ${filters.dateFrom.toLocaleDateString('ar-EG-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' })}`)
            if (filters.dateTo) filterSummary.push(`<strong>إلى تاريخ:</strong> ${filters.dateTo.toLocaleDateString('ar-EG-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' })}`)
            if (filters.category !== "ALL") filterSummary.push(`<strong>الفئة:</strong> ${filters.category}`)

            const htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <title>تقرير المواد غير المتوفرة</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap');
            
            :root {
              --primary-color: #2563eb;
              --border-color: #cbd5e1;
              --header-bg: #f1f5f9;
              --row-hover: #f8fafc;
              --text-color: #0f172a;
            }

            body { 
              font-family: 'Cairo', sans-serif; 
              padding: 40px; 
              color: var(--text-color); 
              margin: 0;
              background: white;
              font-size: 12px;
            }

            /* ... (header styles remain mostly same) ... */
            .report-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid var(--primary-color);
              padding-bottom: 20px;
              margin-bottom: 30px;
            }

            .company-info h1 {
              margin: 0;
              color: var(--primary-color);
              font-size: 24px;
              font-weight: 700;
            }
            
            /* ... */

            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 30px; 
              table-layout: fixed; /* Ensure columns respect widths */
            }

            th { 
              background-color: var(--header-bg); /* Light background */
              color: var(--text-color); /* Dark text */
              font-weight: 700; 
              text-align: right; 
              padding: 10px 8px;
              font-size: 12px;
              border: 1px solid var(--border-color);
              white-space: nowrap; /* Keep headers on one line if possible */
            }

            td { 
              border: 1px solid var(--border-color); 
              padding: 8px; 
              vertical-align: top; /* Align text to top for better reading */
              word-wrap: break-word; /* Wrap long text */
              overflow-wrap: break-word;
            }

            tr:nth-child(even) { 
              background-color: #fafafa; 
            }
            
            /* Specific column widths - REMOVED to allow dynamic columns */
            /* th:nth-child(1) { width: 25%; } */
            
            /* ... (footer styles) ... */

            .footer { 
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              padding: 20px 40px;
              border-top: 1px solid var(--border-color);
              display: flex;
              justify-content: space-between;
              color: #94a3b8;
              font-size: 11px;
              background: white;
            }

            @media print {
              @page {
                size: A4;
                margin: 10mm;
              }
              body { padding: 0; }
              .no-print { display: none; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
              thead { display: table-header-group; }
              tfoot { display: table-footer-group; }
              .footer { position: fixed; bottom: 0; }
            }
          </style>
        </head>
        <body>
          <div class="report-header">
            <div class="company-info">
              <h1>OrderLink</h1>
              <p>تقرير المواد غير المتوفرة</p>
            </div>
            <div class="report-meta">
              <div><strong>تاريخ التقرير:</strong> ${dateStr}</div>
              <div><strong>وقت التقرير:</strong> ${timeStr}</div>
              <div><strong>عدد السجلات:</strong> ${printLogs.length}</div>
            </div>
          </div>

          ${filterSummary.length > 0 ? `
            <div class="filters-section">
              ${filterSummary.map(f => `<div class="filter-item">${f}</div>`).join('')}
            </div>
          ` : ''}

          <table>
            <thead>
              <tr>
                ${visibleColumns.itemName ? '<th>اسم المادة</th>' : ''}
                ${visibleColumns.warehouse ? '<th>المستودع</th>' : ''}
                ${visibleColumns.orderNumber ? '<th>رقم الطلب</th>' : ''}
                ${visibleColumns.user ? '<th>المستخدم</th>' : ''}
                ${visibleColumns.date ? '<th>التاريخ</th>' : ''}
                ${visibleColumns.notes ? '<th>ملاحظات</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${printLogs.map((log: any) => `
                <tr>
                  ${visibleColumns.itemName ? `<td><strong>${log.itemName || '-'}</strong></td>` : ''}
                  ${visibleColumns.warehouse ? `<td>${log.warehouse?.name || '-'}</td>` : ''}
                  ${visibleColumns.orderNumber ? `<td>${log.order?.orderNumber || '-'}</td>` : ''}
                  ${visibleColumns.user ? `<td>${log.user?.name || '-'}</td>` : ''}
                  ${visibleColumns.date ? `<td dir="ltr" style="text-align: right">${format(new Date(log.timestamp), "yyyy/MM/dd HH:mm")}</td>` : ''}
                  ${visibleColumns.notes ? `<td>${log.notes || '-'}</td>` : ''}
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <div>تم استخراج هذا التقرير آلياً من نظام OrderLink</div>
            <div>صفحة <span class="page-number"></span></div>
          </div>

          <script>
            document.fonts.ready.then(() => {
              setTimeout(() => {
                window.print();
                // window.close(); // Optional: close after print
              }, 500);
            });
          </script>
        </body>
        </html>
      `

            printWindow.document.write(htmlContent)
            printWindow.document.close()

        } catch (error) {
            console.error("Print error:", error)
        } finally {
            setIsPrinting(false)
        }
    }

    const clearFilters = () => {
        setFilters({
            dateFrom: undefined,
            dateTo: undefined,
            category: "ALL",
        })
        setCurrentPage(1) // Reset page on filter clear
    }

    return (
        <div className="container mx-auto p-2 md:p-6 space-y-4 md:space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        المواد غير المتوفرة
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        سجل المواد التي تم تحديدها كغير متوفرة أثناء تجهيز الطلبات
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex flex-col space-y-1.5">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            تصفية النتائج
                        </CardTitle>
                        <CardDescription>
                            يمكنك تصفية السجل حسب التاريخ أو فئة المادة
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" title="إظهار/إخفاء الأعمدة">
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[150px]">
                                <DropdownMenuLabel>عرض الأعمدة</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuCheckboxItem
                                    checked={visibleColumns.itemName}
                                    onCheckedChange={(checked) =>
                                        setVisibleColumns((prev) => ({ ...prev, itemName: checked }))
                                    }
                                >
                                    اسم المادة
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={visibleColumns.warehouse}
                                    onCheckedChange={(checked) =>
                                        setVisibleColumns((prev) => ({ ...prev, warehouse: checked }))
                                    }
                                >
                                    المستودع
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={visibleColumns.orderNumber}
                                    onCheckedChange={(checked) =>
                                        setVisibleColumns((prev) => ({ ...prev, orderNumber: checked }))
                                    }
                                >
                                    رقم الطلب
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={visibleColumns.user}
                                    onCheckedChange={(checked) =>
                                        setVisibleColumns((prev) => ({ ...prev, user: checked }))
                                    }
                                >
                                    المستخدم
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={visibleColumns.date}
                                    onCheckedChange={(checked) =>
                                        setVisibleColumns((prev) => ({ ...prev, date: checked }))
                                    }
                                >
                                    التاريخ
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={visibleColumns.notes}
                                    onCheckedChange={(checked) =>
                                        setVisibleColumns((prev) => ({ ...prev, notes: checked }))
                                    }
                                >
                                    ملاحظات
                                </DropdownMenuCheckboxItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            variant="outline"
                            onClick={handlePrint}
                            disabled={isPrinting}
                            className="gap-2"
                        >
                            {isPrinting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                            طباعة التقرير
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Date From */}
                        <div className="flex-1">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-right font-normal",
                                            !filters.dateFrom && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="ml-2 h-4 w-4" />
                                        {filters.dateFrom ? (
                                            format(filters.dateFrom, "PPP", { locale: ar })
                                        ) : (
                                            <span>من تاريخ</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={filters.dateFrom}
                                        onSelect={(date) => {
                                            setFilters({ ...filters, dateFrom: date })
                                            setCurrentPage(1) // Reset page on filter change
                                        }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Date To */}
                        <div className="flex-1">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-right font-normal",
                                            !filters.dateTo && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="ml-2 h-4 w-4" />
                                        {filters.dateTo ? (
                                            format(filters.dateTo, "PPP", { locale: ar })
                                        ) : (
                                            <span>إلى تاريخ</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={filters.dateTo}
                                        onSelect={(date) => {
                                            setFilters({ ...filters, dateTo: date })
                                            setCurrentPage(1) // Reset page on filter change
                                        }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Category Filter */}
                        <div className="flex-1">
                            <Select
                                value={filters.category}
                                onValueChange={(value) => {
                                    setFilters({ ...filters, category: value })
                                    setCurrentPage(1) // Reset page on filter change
                                }}
                            >
                                <SelectTrigger className="w-full text-right">
                                    <SelectValue placeholder="اختر الفئة" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">جميع الفئات</SelectItem>
                                    {categories.map((category) => (
                                        <SelectItem key={category} value={category}>
                                            {category}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Clear Filters */}
                        <Button
                            variant="ghost"
                            onClick={clearFilters}
                            className="px-3"
                            title="مسح الفلاتر"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="print-content">
                <CardContent className="p-0">
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {visibleColumns.itemName && (
                                        <TableHead className="text-right">
                                            <Button
                                                variant="ghost"
                                                onClick={() => handleSort("itemName")}
                                                className="hover:bg-transparent px-0 font-bold"
                                            >
                                                اسم المادة
                                                <SortIcon columnKey="itemName" />
                                            </Button>
                                        </TableHead>
                                    )}
                                    {visibleColumns.warehouse && (
                                        <TableHead className="text-right">
                                            <Button
                                                variant="ghost"
                                                onClick={() => handleSort("warehouse")}
                                                className="hover:bg-transparent px-0 font-bold"
                                            >
                                                المستودع
                                                <SortIcon columnKey="warehouse" />
                                            </Button>
                                        </TableHead>
                                    )}
                                    {visibleColumns.orderNumber && (
                                        <TableHead className="text-right">
                                            <Button
                                                variant="ghost"
                                                onClick={() => handleSort("order")}
                                                className="hover:bg-transparent px-0 font-bold"
                                            >
                                                رقم الطلب
                                                <SortIcon columnKey="order" />
                                            </Button>
                                        </TableHead>
                                    )}
                                    {visibleColumns.user && (
                                        <TableHead className="text-right">
                                            <Button
                                                variant="ghost"
                                                onClick={() => handleSort("user")}
                                                className="hover:bg-transparent px-0 font-bold"
                                            >
                                                المستخدم
                                                <SortIcon columnKey="user" />
                                            </Button>
                                        </TableHead>
                                    )}
                                    {visibleColumns.date && (
                                        <TableHead className="text-right">
                                            <Button
                                                variant="ghost"
                                                onClick={() => handleSort("date")}
                                                className="hover:bg-transparent px-0 font-bold"
                                            >
                                                التاريخ
                                                <SortIcon columnKey="date" />
                                            </Button>
                                        </TableHead>
                                    )}
                                    {visibleColumns.notes && <TableHead className="text-right">ملاحظات</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <div className="flex justify-center items-center gap-2">
                                                <Loader2 className="h-6 w-6 animate-spin" />
                                                <span>جاري التحميل...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            لا توجد سجلات للمواد غير المتوفرة
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.map((log) => (
                                        <TableRow key={log.id}>
                                            {visibleColumns.itemName && (
                                                <TableCell className="font-medium">
                                                    {log.itemName}
                                                </TableCell>
                                            )}
                                            {visibleColumns.warehouse && (
                                                <TableCell>{log.warehouse?.name}</TableCell>
                                            )}
                                            {visibleColumns.orderNumber && (
                                                <TableCell>{log.order?.orderNumber}</TableCell>
                                            )}
                                            {visibleColumns.user && (
                                                <TableCell>{log.user?.name}</TableCell>
                                            )}
                                            {visibleColumns.date && (
                                                <TableCell>
                                                    {format(new Date(log.timestamp), "PPP p", { locale: ar })}
                                                </TableCell>
                                            )}
                                            {visibleColumns.notes && (
                                                <TableCell className="text-muted-foreground">
                                                    {log.notes || "-"}
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-between px-2 py-4 no-print">
                        <div className="flex-1 text-sm text-muted-foreground">
                            عرض {logs.length} من أصل {totalItems} سجل
                        </div>
                        <div className="flex items-center space-x-6 lg:space-x-8">
                            <div className="flex items-center space-x-2">
                                <p className="text-sm font-medium">صفوف لكل صفحة</p>
                                <Select
                                    value={`${pageSize}`}
                                    onValueChange={(value) => {
                                        setPageSize(Number(value))
                                        setCurrentPage(1)
                                    }}
                                >
                                    <SelectTrigger className="h-8 w-[70px]">
                                        <SelectValue placeholder={pageSize} />
                                    </SelectTrigger>
                                    <SelectContent side="top">
                                        {[10, 20, 30, 40, 50].map((pageSize) => (
                                            <SelectItem key={pageSize} value={`${pageSize}`}>
                                                {pageSize}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                                صفحة {currentPage} من {totalPages}
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    className="hidden h-8 w-8 p-0 lg:flex"
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                >
                                    <span className="sr-only">Go to first page</span>
                                    <ChevronsRight className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-8 w-8 p-0"
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <span className="sr-only">Go to previous page</span>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-8 w-8 p-0"
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    <span className="sr-only">Go to next page</span>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    className="hidden h-8 w-8 p-0 lg:flex"
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                >
                                    <span className="sr-only">Go to last page</span>
                                    <ChevronsLeft className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
