import AuditLog from '../models/AuditLog.js';

/**
 * Log collaborator or business action asynchronously for accountability (FR-17.3)
 */
export const logAuditAction = async ({
  businessId,
  user,
  action,
  details = '',
  targetResource = '',
  ipAddress = '',
}) => {
  try {
    if (!businessId || !user) return;

    await AuditLog.create({
      businessId,
      performedBy: user._id,
      performerName: user.name,
      performerRole: user.role,
      action,
      details,
      targetResource,
      ipAddress,
    });
  } catch (err) {
    console.error('AuditLog error:', err.message);
  }
};
