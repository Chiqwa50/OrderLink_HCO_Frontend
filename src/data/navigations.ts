import type { NavigationType } from "@/types"

// القائمة الجانبية لمشرف القسم (DEPARTMENT)
export const departmentNavigations: NavigationType[] = [
  {
    title: "الطلبيات",
    items: [
      {
        title: "طلب جديد",
        href: "/orders/new",
        iconName: "Plus",
      },
      {
        title: "طلبياتي",
        href: "/orders/my-orders",
        iconName: "Package",
      },
    ],
  },
  {
    title: "الإعدادات",
    items: [
      {
        title: "الملف الشخصي",
        href: "/settings/profile",
        iconName: "User",
      },
    ],
  },
]

// القائمة الجانبية لموظف المستودع (WAREHOUSE)
export const warehouseNavigations: NavigationType[] = [
  {
    title: "إدارة الطلبيات",
    items: [
      {
        title: "الطلبيات الواردة",
        href: "/orders/manage",
        iconName: "PackageCheck",
      },
      {
        title: "سجل الطلبيات",
        href: "/orders/history",
        iconName: "History",
      },
    ],
  },
  {
    title: "الإعدادات",
    items: [
      {
        title: "الملف الشخصي",
        href: "/settings/profile",
        iconName: "User",
      },
    ],
  },
]

// القائمة الجانبية للسائقين (DRIVER)
export const driverNavigations: NavigationType[] = [
  {
    title: "التوصيلات",
    items: [
      {
        title: "الطلبيات الجاهزة",
        href: "/deliveries/pending",
        iconName: "Truck",
      },
      {
        title: "سجل التوصيلات",
        href: "/deliveries/completed",
        iconName: "History",
      },
    ],
  },
  {
    title: "الإعدادات",
    items: [
      {
        title: "الملف الشخصي",
        href: "/settings/profile",
        iconName: "User",
      },
    ],
  },
]

// القائمة الجانبية للمسؤول (ADMIN)
export const adminNavigations: NavigationType[] = [
  {
    title: "الرئيسية",
    items: [
      {
        title: "لوحة التحكم",
        href: "/dashboard",
        iconName: "LayoutDashboard",
      },
    ],
  },
  {
    title: "إدارة الطلبيات",
    items: [
      {
        title: "جميع الطلبيات",
        href: "/orders/manage",
        iconName: "PackageCheck",
      },
      {
        title: "سجل الطلبيات",
        href: "/orders/history",
        iconName: "History",
      },
    ],
  },
  {
    title: "التوصيلات",
    items: [
      {
        title: "الطلبيات الجاهزة",
        href: "/deliveries/pending",
        iconName: "Truck",
      },
      {
        title: "سجل التوصيلات",
        href: "/deliveries/completed",
        iconName: "History",
      },
    ],
  },
  {
    title: "إدارة المواد",
    items: [
      {
        title: "قائمة المواد",
        href: "/items/manage",
        iconName: "Package",
      },
      {
        title: "إضافة مادة",
        href: "/items/add",
        iconName: "PackagePlus",
      },
    ],
  },
  {
    title: "إدارة النظام",
    items: [
      {
        title: "الأقسام",
        iconName: "Building2",
        items: [
          { title: "قائمة الأقسام", href: "/departments/manage" },
          { title: "إضافة قسم", href: "/departments/add" },
        ],
      },
      {
        title: "المستودعات",
        iconName: "Warehouse",
        items: [
          { title: "قائمة المستودعات", href: "/warehouses/manage" },
          { title: "إضافة مستودع", href: "/warehouses/add" },
        ],
      },
    ],
  },
  {
    title: "إدارة المستخدمين",
    items: [
      {
        title: "قائمة المستخدمين",
        href: "/users/manage",
        iconName: "Users",
      },
      {
        title: "إضافة مستخدم",
        href: "/users/add",
        iconName: "UserPlus",
      },
      {
        title: "قيود",
        href: "/users/restrictions",
        iconName: "Shield",
      },
    ],
  },
  {
    title: "الإعدادات",
    items: [
      {
        title: "الملف الشخصي",
        href: "/settings/profile",
        iconName: "User",
      },
    ],
  },
]

// دالة للحصول على القائمة المناسبة حسب الدور
export function getNavigationsByRole(role: string): NavigationType[] {
  switch (role?.toUpperCase()) {
    case "DEPARTMENT":
      return departmentNavigations
    case "WAREHOUSE":
      return warehouseNavigations
    case "DRIVER":
      return driverNavigations
    case "ADMIN":
      return adminNavigations
    default:
      return departmentNavigations
  }
}

// للتوافق مع الكود القديم
export const navigationsData = departmentNavigations
