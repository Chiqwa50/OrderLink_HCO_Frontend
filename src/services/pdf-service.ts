import type { Order } from "@/types"

/**
 * خدمة توليد ملفات PDF للطلبيات
 */
class PDFService {
  /**
   * تحميل PDF للطلبية من الخادم
   */
  async downloadOrderPDF(order: Order): Promise<void> {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
      const token = localStorage.getItem("token")
      const response = await fetch(`${apiUrl}/orders/${order.id}/pdf`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("فشل تحميل PDF")
      }

      const blob = await response.blob()
      // Create blob with explicit type for better mobile support
      const pdfBlob = new Blob([blob], { type: "application/pdf" })
      const url = window.URL.createObjectURL(pdfBlob)

      const link = document.createElement("a")
      link.href = url
      link.download = `order-${order.orderNumber}.pdf`
      link.target = "_blank" // Required for some mobile browsers
      document.body.appendChild(link)
      link.click()

      // Small delay to ensure download starts on mobile before cleaning up
      setTimeout(() => {
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }, 100)
    } catch (error) {
      console.error("Error downloading PDF:", error)
      throw error
    }
  }

  /**
   * طباعة PDF للطلبية
   * (يمكن تحديثها لاحقاً لتفتح ملف PDF مباشرة للطباعة)
   */
  async printOrderPDF(order: Order): Promise<void> {
    // حالياً سنستخدم نفس آلية التحميل، أو يمكن فتحها في نافذة جديدة
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
      const token = localStorage.getItem("token")
      const response = await fetch(`${apiUrl}/orders/${order.id}/pdf`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("فشل تحميل PDF")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const printWindow = window.open(url, "_blank")

      if (printWindow) {
        printWindow.focus()
        // ملاحظة: قد لا تعمل الطباعة التلقائية مع PDF في جميع المتصفحات
      }
    } catch (error) {
      console.error("Error printing PDF:", error)
      throw error
    }
  }
}

// تصدير instance واحد من الخدمة (Singleton Pattern)
export const pdfService = new PDFService()
export default PDFService
