import type {
    UserRestriction,
    UpdateUserRestrictionRequest,
    RateLimitCheckResult,
    UserRole,
} from "@/types"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

/**
 * خدمة إدارة قيود المستخدمين
 */
class UserRestrictionService {
    /**
     * جلب قيود مستخدم معين
     */
    async getRestrictions(userId: string): Promise<UserRestriction | null> {
        const response = await fetch(`${API_URL}/user-restrictions/${userId}`)

        if (!response.ok) {
            if (response.status === 404) {
                return null
            }
            const error = await response.json()
            throw new Error(error.error || "حدث خطأ أثناء جلب القيود")
        }

        return response.json()
    }

    /**
     * جلب جميع القيود حسب الدور
     */
    async getRestrictionsByRole(role: UserRole): Promise<UserRestriction[]> {
        const response = await fetch(`${API_URL}/user-restrictions/role/${role}`)

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || "حدث خطأ أثناء جلب القيود")
        }

        return response.json()
    }

    /**
     * تحديث أو إنشاء قيود المستخدم
     */
    async updateRestrictions(
        userId: string,
        data: UpdateUserRestrictionRequest
    ): Promise<UserRestriction> {
        const response = await fetch(`${API_URL}/user-restrictions/${userId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || "حدث خطأ أثناء تحديث القيود")
        }

        return response.json()
    }

    /**
     * حذف قيود المستخدم
     */
    async deleteRestrictions(userId: string): Promise<{ message: string }> {
        const response = await fetch(`${API_URL}/user-restrictions/${userId}`, {
            method: "DELETE",
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || "حدث خطأ أثناء حذف القيود")
        }

        return response.json()
    }

    /**
     * التحقق من معدل الطلبات
     */
    async checkRateLimit(userId: string): Promise<RateLimitCheckResult> {
        const response = await fetch(
            `${API_URL}/user-restrictions/${userId}/check-rate-limit`,
            {
                method: "POST",
            }
        )

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || "حدث خطأ أثناء التحقق من معدل الطلبات")
        }

        return response.json()
    }

    /**
     * التحقق من إمكانية رؤية جميع طلبيات القسم
     */
    async canViewAllOrders(userId: string): Promise<boolean> {
        const response = await fetch(
            `${API_URL}/user-restrictions/${userId}/can-view-all-orders`
        )

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || "حدث خطأ أثناء التحقق")
        }

        const data = await response.json()
        return data.canViewAllOrders
    }

    /**
     * التحقق من إمكانية استلام الطلبيات الجاهزة
     */
    async canReceiveReadyOrders(userId: string): Promise<boolean> {
        const response = await fetch(
            `${API_URL}/user-restrictions/${userId}/can-receive-ready-orders`
        )

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || "حدث خطأ أثناء التحقق")
        }

        const data = await response.json()
        return data.canReceiveReadyOrders
    }

    /**
     * التحقق من إمكانية رؤية الطلبات قيد المراجعة (لمسؤول المستودع)
     */
    async canViewPendingOrders(userId: string): Promise<boolean> {
        const response = await fetch(
            `${API_URL}/user-restrictions/${userId}/can-view-pending-orders`
        )

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || "حدث خطأ أثناء التحقق")
        }

        const data = await response.json()
        return data.canViewPendingOrders
    }

    /**
     * التحقق من إمكانية قبول الطلبات (لمسؤول المستودع)
     */
    async canApproveOrders(userId: string): Promise<boolean> {
        const response = await fetch(
            `${API_URL}/user-restrictions/${userId}/can-approve-orders`
        )

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || "حدث خطأ أثناء التحقق")
        }

        const data = await response.json()
        return data.canApproveOrders
    }

    /**
     * التحقق من إمكانية رفض الطلبات (لمسؤول المستودع)
     */
    async canRejectOrders(userId: string): Promise<boolean> {
        const response = await fetch(
            `${API_URL}/user-restrictions/${userId}/can-reject-orders`
        )

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || "حدث خطأ أثناء التحقق")
        }

        const data = await response.json()
        return data.canRejectOrders
    }
}

export const userRestrictionService = new UserRestrictionService()
