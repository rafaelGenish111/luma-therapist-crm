const Appointment = require('../models/Appointment');

/**
 * מחיקה רכה של פגישות שעבר זמנן
 * @param {number} hoursAfter - כמה שעות לאחר סיום הפגישה למחוק אותה (ברירת מחדל: 2 שעות)
 */
async function deleteExpiredAppointments(hoursAfter = 2) {
    try {
        const cutoffTime = new Date();
        cutoffTime.setHours(cutoffTime.getHours() - hoursAfter);

        console.log(`Starting appointment cleanup - deleting appointments that ended before: ${cutoffTime}`);

        // מצא פגישות שסיימו לפני הזמן הקצוב ועדיין לא מחוקות
        const expiredAppointments = await Appointment.find({
            deletedAt: { $exists: false }, // לא מחוקות כבר
            $expr: {
                $lt: [
                    { $add: ["$date", { $multiply: ["$duration", 60000] }] }, // date + duration in milliseconds
                    cutoffTime
                ]
            }
        });

        if (expiredAppointments.length === 0) {
            console.log('No expired appointments found');
            return { deleted: 0, message: 'No expired appointments found' };
        }

        // סמן את הפגישות כמחוקות
        const result = await Appointment.updateMany(
            {
                _id: { $in: expiredAppointments.map(app => app._id) }
            },
            {
                $set: {
                    deletedAt: new Date(),
                    autoDeleted: true
                }
            }
        );

        console.log(`Successfully marked ${result.modifiedCount} expired appointments as deleted`);

        return {
            deleted: result.modifiedCount,
            message: `Successfully deleted ${result.modifiedCount} expired appointments`,
            appointmentIds: expiredAppointments.map(app => app._id)
        };

    } catch (error) {
        console.error('Error in deleteExpiredAppointments:', error);
        throw error;
    }
}

/**
 * מחיקה מלאה של פגישות שמחוקות כבר מעל זמן מסוים
 * @param {number} daysAfter - כמה ימים לאחר המחיקה הרכה למחוק לגמרי (ברירת מחדל: 30 ימים)
 */
async function permanentlyDeleteOldAppointments(daysAfter = 30) {
    try {
        const cutoffTime = new Date();
        cutoffTime.setDate(cutoffTime.getDate() - daysAfter);

        console.log(`Starting permanent cleanup - permanently deleting appointments soft-deleted before: ${cutoffTime}`);

        const result = await Appointment.deleteMany({
            deletedAt: { $lt: cutoffTime }
        });

        console.log(`Permanently deleted ${result.deletedCount} old appointments`);

        return {
            deleted: result.deletedCount,
            message: `Permanently deleted ${result.deletedCount} old appointments`
        };

    } catch (error) {
        console.error('Error in permanentlyDeleteOldAppointments:', error);
        throw error;
    }
}

/**
 * ניקוי מלא - מחיקה רכה של פגישות שעבר זמנן ומחיקה מלאה של פגישות ישנות
 */
async function fullCleanup(expiredHours = 2, permanentDays = 30) {
    try {
        console.log('Starting full appointment cleanup...');

        const softDeleteResult = await deleteExpiredAppointments(expiredHours);
        const permanentDeleteResult = await permanentlyDeleteOldAppointments(permanentDays);

        return {
            softDeleted: softDeleteResult.deleted,
            permanentlyDeleted: permanentDeleteResult.deleted,
            message: `Cleanup completed: ${softDeleteResult.deleted} appointments soft-deleted, ${permanentDeleteResult.deleted} appointments permanently deleted`
        };

    } catch (error) {
        console.error('Error in fullCleanup:', error);
        throw error;
    }
}

/**
 * שחזור פגישה מחוקה (במקרה של טעות)
 */
async function restoreAppointment(appointmentId) {
    try {
        const result = await Appointment.findByIdAndUpdate(
            appointmentId,
            {
                $unset: {
                    deletedAt: 1,
                    autoDeleted: 1
                }
            },
            { new: true }
        );

        if (result) {
            console.log(`Appointment ${appointmentId} restored successfully`);
            return { success: true, appointment: result };
        } else {
            console.log(`Appointment ${appointmentId} not found`);
            return { success: false, message: 'Appointment not found' };
        }

    } catch (error) {
        console.error('Error in restoreAppointment:', error);
        throw error;
    }
}

module.exports = {
    deleteExpiredAppointments,
    permanentlyDeleteOldAppointments,
    fullCleanup,
    restoreAppointment
};
