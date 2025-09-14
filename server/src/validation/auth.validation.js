// server/src/validation/auth.validation.js
const { z } = require('zod');

// רגקסים לוולידציה
const phoneRegex = /^(?:\+972|0)(?:[23489]|5[0248]|77)[0-9]{7}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const hebrewNameRegex = /^[\u0590-\u05FF\u0020a-zA-Z]+$/;

// Emergency Contact Schema
const emergencyContactSchema = z.object({
  name: z.string()
    .min(2, 'שם איש קשר חייב להכיל לפחות 2 תווים')
    .max(50, 'שם איש קשר לא יכול להכיל יותר מ-50 תווים')
    .regex(hebrewNameRegex, 'שם איש קשר יכול להכיל רק אותיות עבריות או אנגליות'),
  phone: z.string()
    .regex(phoneRegex, 'מספר טלפון לא תקין'),
  relationship: z.string()
    .min(2, 'קרבה משפחתית חייבת להכיל לפחות 2 תווים')
    .max(30, 'קרבה משפחתית לא יכולה להכיל יותר מ-30 תווים')
});

// Register Schema
const registerSchema = z.object({
  // שדות בסיסיים חובה
  email: z.string()
    .email('כתובת אימייל לא תקינה')
    .min(5, 'אימייל חייב להכיל לפחות 5 תווים')
    .max(255, 'אימייל לא יכול להכיל יותר מ-255 תווים')
    .toLowerCase()
    .transform(val => val.trim()),
  
  password: z.string()
    .min(8, 'סיסמה חייבת להכיל לפחות 8 תווים')
    .max(128, 'סיסמה לא יכולה להכיל יותר מ-128 תווים')
    .regex(passwordRegex, 'סיסמה חייבת להכיל לפחות: אות גדולה, אות קטנה, מספר וסימן מיוחד'),
  
  firstName: z.string()
    .min(2, 'שם פרטי חייב להכיל לפחות 2 תווים')
    .max(50, 'שם פרטי לא יכול להכיל יותר מ-50 תווים')
    .regex(hebrewNameRegex, 'שם פרטי יכול להכיל רק אותיות עבריות או אנגליות')
    .transform(val => val.trim()),
  
  lastName: z.string()
    .min(2, 'שם משפחה חייב להכיל לפחות 2 תווים')
    .max(50, 'שם משפחה לא יכול להכיל יותר מ-50 תווים')
    .regex(hebrewNameRegex, 'שם משפחה יכול להכיל רק אותיות עבריות או אנגליות')
    .transform(val => val.trim()),
  
  phone: z.string()
    .regex(phoneRegex, 'מספר טלפון לא תקין (פורמט ישראלי)')
    .transform(val => val.replace(/\s+/g, '')), // הסרת רווחים
  
  userType: z.enum(['therapist', 'client'], {
    errorMap: () => ({ message: 'סוג משתמש חייב להיות therapist או client' })
  }),
  
  // שדות אופציונליים
  dateOfBirth: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'תאריך לידה חייב להיות בפורמט YYYY-MM-DD')
    .refine(date => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 16 && age <= 120;
    }, 'גיל חייב להיות בין 16 ל-120')
    .optional(),
  
  gender: z.enum(['male', 'female', 'other'], {
    errorMap: () => ({ message: 'מגדר חייב להיות male, female או other' })
  }).optional(),
  
  // שדות ספציפיים למטפלות
  specialization: z.array(z.string().min(2).max(50))
    .max(10, 'לא יותר מ-10 התמחויות')
    .optional(),
  
  licenseNumber: z.string()
    .min(3, 'מספר רישיון חייב להכיל לפחות 3 תווים')
    .max(20, 'מספר רישיון לא יכול להכיל יותר מ-20 תווים')
    .regex(/^[A-Za-z0-9\-]+$/, 'מספר רישיון יכול להכיל רק אותיות, מספרים ומקפים')
    .optional(),
  
  experience: z.number()
    .int('שנות ניסיון חייבות להיות מספר שלם')
    .min(0, 'שנות ניסיון לא יכולות להיות שליליות')
    .max(50, 'שנות ניסיון לא יכולות להיות יותר מ-50')
    .optional(),
  
  // שדות ספציפיים ללקוחות
  medicalHistory: z.array(z.string().min(2).max(100))
    .max(20, 'לא יותר מ-20 פריטים בהיסטוריה רפואית')
    .optional(),
  
  emergencyContact: emergencyContactSchema.optional()
}).refine(data => {
  // ולידציה מותנית: אם זה מטפל, רישיון נדרש
  if (data.userType === 'therapist' && !data.licenseNumber) {
    return false;
  }
  return true;
}, {
  message: 'מטפלות חייבות לספק מספר רישיון',
  path: ['licenseNumber']
}).refine(data => {
  // ולידציה מותנית: אם זה לקוח, איש קשר נדרש
  if (data.userType === 'client' && !data.emergencyContact) {
    return false;
  }
  return true;
}, {
  message: 'לקוחות חייבים לספק פרטי איש קשר לחירום',
  path: ['emergencyContact']
});

// Login Schema
const loginSchema = z.object({
  email: z.string()
    .email('כתובת אימייל לא תקינה')
    .min(5, 'אימייל חייב להכיל לפחות 5 תווים')
    .max(255, 'אימייל לא יכול להכיל יותר מ-255 תווים')
    .toLowerCase()
    .transform(val => val.trim()),
  
  password: z.string()
    .min(1, 'סיסמה נדרשת')
    .max(128, 'סיסמה לא יכולה להכיל יותר מ-128 תווים')
});

// Forgot Password Schema
const forgotPasswordSchema = z.object({
  email: z.string()
    .email('כתובת אימייל לא תקינה')
    .min(5, 'אימייל חייב להכיל לפחות 5 תווים')
    .max(255, 'אימייל לא יכול להכיל יותר מ-255 תווים')
    .toLowerCase()
    .transform(val => val.trim())
});

// Reset Password Schema
const resetPasswordSchema = z.object({
  token: z.string()
    .min(10, 'טוקן לא תקין')
    .max(500, 'טוקן לא תקין'),
  
  password: z.string()
    .min(8, 'סיסמה חייבת להכיל לפחות 8 תווים')
    .max(128, 'סיסמה לא יכולה להכיל יותר מ-128 תווים')
    .regex(passwordRegex, 'סיסמה חייבת להכיל לפחות: אות גדולה, אות קטנה, מספר וסימן מיוחד')
});

// Change Password Schema
const changePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, 'סיסמה נוכחית נדרשת')
    .max(128, 'סיסמה לא יכולה להכיל יותר מ-128 תווים'),
  
  newPassword: z.string()
    .min(8, 'סיסמה חדשה חייבת להכיל לפחות 8 תווים')
    .max(128, 'סיסמה לא יכולה להכיל יותר מ-128 תווים')
    .regex(passwordRegex, 'סיסמה חייבת להכיל לפחות: אות גדולה, אות קטנה, מספר וסימן מיוחד')
}).refine(data => data.currentPassword !== data.newPassword, {
  message: 'סיסמה חדשה חייבת להיות שונה מהסיסמה הנוכחית',
  path: ['newPassword']
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema
};