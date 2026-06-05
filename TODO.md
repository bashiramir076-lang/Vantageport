// Admin API Routes
import express, { Request, Response } from "express";
import { verifyAdminAuth, updateAdminAuth, getAdminSettings, updateWhatsAppNumber } from "../services/adminService";

const router = express.Router();

/**
 * Verify admin password
 * POST /api/admin/verify-password
 */
router.post("/verify-password", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "اسم المستخدم وكلمة المرور مطلوبان" });
    }

    const isValid = await verifyAdminAuth(username, password);
    res.json({ valid: isValid });
  } catch (error) {
    console.error("Error verifying auth:", error);
    res.status(500).json({ error: "حدث خطأ في التحقق من البيانات" });
  }
});

/**
 * Change admin password
 * POST /api/admin/change-password
 */
router.post("/change-auth", async (req: Request, res: Response) => {
  try {
    const { currentPassword, newUsername, newPassword } = req.body;

    if (!currentPassword || !newUsername) {
      return res.status(400).json({ error: "كلمة المرور الحالية واسم المستخدم الجديد مطلوبان" });
    }

    const result = await updateAdminAuth(currentPassword, newUsername, newPassword);
    
    if (!result.success) {
      return res.status(400).json({ error: (result as any).error || "حدث خطأ غير معروف" });
    }

    res.json({ success: true, message: "تم تحديث بيانات الدخول بنجاح" });
  } catch (error) {
    console.error("Error changing auth:", error);
    res.status(500).json({ error: "حدث خطأ في تحديث بيانات الدخول" });
  }
});

/**
 * Get admin settings (public info only)
 * GET /api/admin/settings
 */
router.get("/settings", async (req: Request, res: Response) => {
  try {
    const settings = await getAdminSettings();
    if (!settings) {
      return res.status(404).json({ error: "لم يتم العثور على إعدادات المسؤول" });
    }

    // Return only safe data (no password hash)
    res.json({
      username: settings.username,
      whatsappNumber: settings.whatsappNumber,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    });
  } catch (error) {
    console.error("Error getting admin settings:", error);
    res.status(500).json({ error: "حدث خطأ في الحصول على الإعدادات" });
  }
});

/**
 * Update WhatsApp number
 * POST /api/admin/update-whatsapp
 */
router.post("/update-whatsapp", async (req: Request, res: Response) => {
  try {
    const { password, whatsappNumber } = req.body;

    if (!password) {
      return res.status(400).json({ error: "كلمة المرور مطلوبة" });
    }

    const isValid = await verifyAdminAuth(req.body.username || "Ali", password);
    if (!isValid) {
      return res.status(401).json({ error: "كلمة المرور غير صحيحة" });
    }

    if (!whatsappNumber) {
      return res.status(400).json({ error: "رقم الواتساب مطلوب" });
    }

    const result = await updateWhatsAppNumber(whatsappNumber);
    if (!result.success) {
      return res.status(400).json({ error: result.error || "حدث خطأ في تحديث الرقم" });
    }

    res.json({ success: true, message: "تم تحديث رقم الواتساب بنجاح" });
  } catch (error) {
    console.error("Error updating WhatsApp number:", error);
    res.status(500).json({ error: "حدث خطأ في تحديث رقم الواتساب" });
  }
});

export { router as default };
export { router as adminRouter };
