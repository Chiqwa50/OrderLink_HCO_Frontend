import type { LucideIcon, icons } from "lucide-react"
import type { ComponentType, SVGAttributes } from "react"

export type LayoutType = "vertical" | "horizontal"

export type ModeType = "light" | "dark" | "system"

export type OrientationType = "vertical" | "horizontal"

export type DirectionType = "ltr" | "rtl"

export type LocaleType = "en" | "ar"

export type ThemeType = string

export type RadiusType = number

export type SettingsType = {
  theme: ThemeType
  mode: ModeType
  radius: RadiusType
  layout: LayoutType
  locale: LocaleType
}

export interface IconProps extends SVGAttributes<SVGElement> {
  children?: never
  color?: string
}

export type IconType = ComponentType<IconProps> | LucideIcon

export type DynamicIconNameType = keyof typeof icons

export interface UserType {
  id: string
  firstName: string
  lastName: string
  name: string
  password: string
  username: string
  role: string
  avatar: string
  background: string
  status: string
  phoneNumber: string
  email: string
  state: string
  country: string
  address: string
  zipCode: string
  language: string
  timeZone: string
  currency: string
  organization: string
  twoFactorAuth: boolean
  loginAlerts: boolean
  accountReoveryOption?: "email" | "sms" | "codes"
  connections: number
  followers: number
}

export interface NavigationType {
  title: string
  items: NavigationRootItem[]
}

export type NavigationRootItem =
  | NavigationRootItemWithHrefType
  | NavigationRootItemWithItemsType

export interface NavigationRootItemBasicType {
  title: string
  label?: string
  iconName: DynamicIconNameType
}

export interface NavigationRootItemWithHrefType
  extends NavigationRootItemBasicType {
  href: string
  items?: never
}

export interface NavigationRootItemWithItemsType
  extends NavigationRootItemBasicType {
  items: (
    | NavigationNestedItemWithHrefType
    | NavigationNestedItemWithItemsType
  )[]
  href?: never
}

export interface NavigationNestedItemBasicType {
  title: string
  label?: string
}

export interface NavigationNestedItemWithHrefType
  extends NavigationNestedItemBasicType {
  href: string
  items?: never
}

export interface NavigationNestedItemWithItemsType
  extends NavigationNestedItemBasicType {
  items: (
    | NavigationNestedItemWithHrefType
    | NavigationNestedItemWithItemsType
  )[]
  href?: never
}

export type NavigationNestedItem =
  | NavigationNestedItemWithHrefType
  | NavigationNestedItemWithItemsType

// Order Management Types
export type OrderStatus =
  | "PENDING" // قيد المراجعة
  | "APPROVED" // تم الموافقة
  | "PREPARING" // قيد التجهيز
  | "READY" // جاهز للتوصيل
  | "DELIVERED" // تم التسليم
  | "REJECTED" // مرفوض

export type OrderUnit = "piece" | "box" | "carton" | "kg" | "liter"

export interface OrderItem {
  id?: string
  name: string
  itemName?: string // For API responses that use itemName instead of name
  quantity: number
  unit: OrderUnit
  notes?: string // Optional notes for the item
}

export interface Order {
  id: string
  orderNumber: string
  departmentId: string
  departmentName: string
  warehouseId: string
  warehouseName: string
  warehouseCode?: string
  warehouseType?: WarehouseType
  items: OrderItem[]
  notes?: string
  status: OrderStatus
  createdBy: string
  createdByName: string
  createdAt: string
  updatedAt: string
  approvedBy?: string
  approvedAt?: string
  preparedBy?: string
  preparedAt?: string
  deliveredBy?: string
  deliveredAt?: string
  rejectionReason?: string
  preparationProgress?: {
    total: number
    logged: number
    hasPartialPreparation: boolean
  }
  preparationLogs?: PreparationLog[]
  history?: OrderHistory[]
}

export interface OrderHistory {
  id: string
  orderId: string
  status: OrderStatus
  changedBy: string
  changedByName?: string // Optional as it might come from the user object
  changedAt?: string // Backend uses timestamp
  timestamp?: string // Backend uses timestamp
  notes?: string
  user?: {
    id: string
    name: string
    role: UserRole
  }
}

export interface CreateOrderRequest {
  items: {
    itemName: string
    quantity: number
    unit?: string
    notes?: string
  }[]
  notes?: string
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus
  notes?: string
}

// Item Management Types
export interface Item {
  id: string
  name: string
  description?: string
  sku: string
  quantity: number
  category?: string
  unit?: string
  warehouseId: string
  warehouse?: {
    id: string
    name: string
    code: string
    type: WarehouseType
  }
  isActive: boolean
  createdBy?: string
  creator?: {
    name: string
  }
  createdAt: string
  updatedAt: string
}

export interface CreateItemRequest {
  name: string
  description?: string
  sku?: string // اختياري - يُولد تلقائياً
  quantity?: number // اختياري - يُعين إلى 0 تلقائياً
  category?: string
  unit?: string
  warehouseId: string // إجباري - المستودع الذي تنتمي إليه المادة
  isActive?: boolean
}

export interface UpdateItemRequest {
  name?: string
  description?: string
  quantity?: number
  category?: string
  unit?: string
  warehouseId?: string
  isActive?: boolean
}

// Department Management Types
export type WarehouseType =
  | "pharmaceutical"
  | "logistics"
  | "equipment"
  | "medical"
  | "general"

export interface Department {
  id: string
  name: string
  code: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Warehouse {
  id: string
  name: string
  code: string
  type: WarehouseType
  description?: string
  location?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateDepartmentRequest {
  name: string
  code: string
  description?: string
  warehouses?: {
    warehouseId: string
    priority: number
    isPrimary: boolean
  }[]
}

export interface UpdateDepartmentRequest {
  name?: string
  code?: string
  description?: string
  warehouses?: {
    warehouseId: string
    priority: number
    isPrimary: boolean
  }[]
}

// Department Warehouse Link
export interface DepartmentWarehouse {
  id: string
  departmentId: string
  warehouseId: string
  priority: number
  isPrimary: boolean
  warehouse: {
    id: string
    name: string
    code: string
    type: WarehouseType
    description?: string
    location?: string
    isActive: boolean
    createdAt: string
    updatedAt: string
  }
  createdAt: string
  updatedAt: string
}

export interface CreateWarehouseRequest {
  name: string
  code: string
  type: WarehouseType
  description?: string
  location?: string
}

export interface UpdateWarehouseRequest {
  name?: string
  code?: string
  type?: WarehouseType
  description?: string
  location?: string
}

// User Management Types
export type UserRole = "ADMIN" | "WAREHOUSE" | "DEPARTMENT" | "DRIVER"

export interface DepartmentSupervisor {
  id: string
  userId: string
  departmentId: string
  department: {
    id: string
    name: string
    code: string
  }
  createdAt: string
}

export interface WarehouseSupervisor {
  id: string
  userId: string
  warehouseId: string | null
  isGlobal: boolean
  warehouse: {
    id: string
    name: string
    code: string
    type: WarehouseType
  } | null
  createdAt: string
}

export interface User {
  id: string
  name: string
  phone: string
  role: UserRole
  departmentId?: string
  department?: {
    id: string
    name: string
    code: string
  }
  departmentSupervisors?: DepartmentSupervisor[]
  warehouseSupervisors?: WarehouseSupervisor[]
  createdAt: string
  updatedAt: string
}

export interface CreateUserRequest {
  name: string
  phone: string
  password: string
  role: UserRole
  departmentId?: string
  departmentIds?: string[]
  warehouseIds?: string[]
  isGlobalWarehouseSupervisor?: boolean
}

export interface UpdateUserRequest {
  name?: string
  phone?: string
  password?: string
  role?: UserRole
  departmentId?: string
  departmentIds?: string[]
  warehouseIds?: string[]
  isGlobalWarehouseSupervisor?: boolean
}

// Prepare Order Types
export interface PreparedItem {
  id?: string
  name: string
  itemName?: string
  requestedQuantity: number
  availableQuantity: number
  unit: OrderUnit
  isUnavailable: boolean
  notes?: string
}

export interface UpdatedItem {
  id?: string
  name?: string
  itemName?: string
  quantity: number
  unit?: OrderUnit
  isAvailable: boolean
  notes?: string
}

export interface PrepareOrderRequest {
  items: PreparedItem[]
  notes?: string
}

// Preparation Wizard Types
export type PreparationAction =
  | "ITEM_CHECKED"
  | "QUANTITY_ADJUSTED"
  | "ITEM_UNAVAILABLE"
  | "ITEM_AVAILABLE"
  | "ORDER_COMPLETED"

export interface PreparationLog {
  id: string
  orderId: string
  warehouseId: string
  preparedBy: string
  itemName?: string
  action: PreparationAction
  requestedQty?: number
  availableQty?: number
  notes?: string
  timestamp: string
  warehouse?: {
    id: string
    name: string
    code: string
  }
  user?: {
    id: string
    name: string
    role: UserRole
  }
}

export interface WizardStep {
  stepNumber: number
  totalSteps: number
  item: PreparedItem
  status: "pending" | "completed" | "current"
}

// User Restriction Types
export interface UserRestriction {
  id: string
  userId: string
  role: UserRole

  // قيود مسؤول القسم
  orderRateLimit?: number | null
  orderRatePeriodHours?: number | null
  canViewAllOrders: boolean
  canReceiveReadyOrders: boolean

  // قيود مسؤول المستودع
  canViewPendingOrders: boolean
  canApproveOrders: boolean
  canRejectOrders: boolean

  // قيود السائق
  maxDeliveriesPerDay?: number | null

  createdAt: string
  updatedAt: string

  user?: {
    id: string
    name: string
    phone: string
    role: UserRole
  }
}

export interface UpdateUserRestrictionRequest {
  orderRateLimit?: number | null
  orderRatePeriodHours?: number | null
  canViewAllOrders?: boolean
  canReceiveReadyOrders?: boolean
  canViewPendingOrders?: boolean
  canApproveOrders?: boolean
  canRejectOrders?: boolean
  maxDeliveriesPerDay?: number | null
}

export interface RateLimitCheckResult {
  allowed: boolean
  remaining: number
  resetAt?: string
  message?: string
}

