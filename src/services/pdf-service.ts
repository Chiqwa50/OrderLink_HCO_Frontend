import type { Order } from "@/types"

/**
 * خدمة توليد ملفات PDF للطلبيات
 */
class PDFService {
  /**
   * توليد PDF لطلبية محددة
   */
  async generateOrderPDF(order: Order): Promise<Blob> {
    // سيتم استخدام مكتبة jsPDF أو مكتبة مشابهة
    // هنا نقوم بإنشاء محتوى HTML ثم تحويله لـ PDF

    const htmlContent = this.generateOrderHTML(order)

    // في الوقت الحالي، سنقوم بإرجاع HTML كـ Blob
    // يمكن تطويره لاحقاً لاستخدام مكتبة PDF حقيقية
    const blob = new Blob([htmlContent], { type: "text/html" })

    return blob
  }

  /**
   * توليد محتوى HTML للطلبية
   */
  private generateOrderHTML(order: Order): string {
    const statusLabels: Record<string, string> = {
      PENDING: "قيد المراجعة",
      APPROVED: "تم الموافقة",
      PREPARING: "قيد التجهيز",
      READY: "جاهز للتوصيل",
      DELIVERED: "تم التسليم",
      REJECTED: "مرفوض",
    }

    const unitLabels: Record<string, string> = {
      piece: "قطعة",
      box: "علبة",
      carton: "كرتون",
      kg: "كيلوغرام",
      liter: "لتر",
    }

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>طلبية رقم ${order.orderNumber}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Arial', sans-serif;
            padding: 40px;
            background: white;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #1E88E5;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #1E88E5;
            font-size: 28px;
            margin-bottom: 10px;
          }
          .info-section {
            margin-bottom: 30px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 10px;
            border-bottom: 1px solid #eee;
          }
          .info-label {
            font-weight: bold;
            color: #555;
          }
          .info-value {
            color: #333;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .items-table th {
            background: #1E88E5;
            color: white;
            padding: 12px;
            text-align: right;
          }
          .items-table td {
            padding: 10px;
            border-bottom: 1px solid #ddd;
            text-align: right;
          }
          .items-table tr:nth-child(even) {
            background: #f9f9f9;
          }
          .status-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 14px;
          }
          .status-PENDING { background: #FFB300; color: white; }
          .status-APPROVED { background: #43A047; color: white; }
          .status-PREPARING { background: #1E88E5; color: white; }
          .status-READY { background: #00ACC1; color: white; }
          .status-DELIVERED { background: #66BB6A; color: white; }
          .status-REJECTED { background: #E53935; color: white; }
          .notes {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            color: #888;
            font-size: 12px;
            border-top: 1px solid #ddd;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>نظام إدارة الطلبيات - OrderLink</h1>
          <p>طلبية رقم: ${order.orderNumber}</p>
        </div>

        <div class="info-section">
          <div class="info-row">
            <span class="info-label">القسم الطالب:</span>
            <span class="info-value">${order.departmentName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">مقدم الطلب:</span>
            <span class="info-value">${order.createdByName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">تاريخ الطلب:</span>
            <span class="info-value">${new Date(order.createdAt).toLocaleString("ar-EG")}</span>
          </div>
          <div class="info-row">
            <span class="info-label">الحالة:</span>
            <span class="info-value">
              <span class="status-badge status-${order.status}">
                ${statusLabels[order.status] || order.status}
              </span>
            </span>
          </div>
        </div>

        <h2 style="margin-bottom: 15px; color: #1E88E5;">قائمة المواد المطلوبة</h2>
        <table class="items-table">
          <thead>
            <tr>
              <th>#</th>
              <th>اسم المادة</th>
              <th>الكمية</th>
              <th>الوحدة</th>
            </tr>
          </thead>
          <tbody>
            ${order.items
              .map(
                (item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>${unitLabels[item.unit] || item.unit}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        ${
          order.notes
            ? `
          <div class="notes">
            <h3 style="margin-bottom: 10px; color: #555;">ملاحظات:</h3>
            <p>${order.notes}</p>
          </div>
        `
            : ""
        }

        <div class="footer">
          <p>تم إنشاء هذا المستند بواسطة نظام OrderLink</p>
          <p>تاريخ الطباعة: ${new Date().toLocaleString("ar-EG")}</p>
        </div>
      </body>
      </html>
    `
  }

  /**
   * تحميل PDF للطلبية
   */
  async downloadOrderPDF(order: Order): Promise<void> {
    const blob = await this.generateOrderPDF(order)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `order-${order.orderNumber}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  /**
   * طباعة PDF للطلبية
   */
  async printOrderPDF(order: Order): Promise<void> {
    const htmlContent = this.generateOrderHTML(order)
    const printWindow = window.open("", "_blank")

    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.focus()

      // الانتظار قليلاً حتى يتم تحميل المحتوى
      setTimeout(() => {
        printWindow.print()
      }, 250)
    }
  }
}

// تصدير instance واحد من الخدمة (Singleton Pattern)
export const pdfService = new PDFService()
export default PDFService
