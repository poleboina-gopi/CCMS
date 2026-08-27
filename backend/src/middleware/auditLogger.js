const { AuditLog } = require('../db');

async function logAuditEvent({
  userId = null,
  userEmail = null,
  action,
  entityType = null,
  entityId = null,
  ipAddress = null,
  details = null
}) {
  try {
    await AuditLog.create({
      user_id: userId || null,
      user_email: userEmail,
      action,
      entity_type: entityType,
      entity_id: entityId ? entityId.toString() : null,
      ip_address: ipAddress,
      details
    });
  } catch (err) {
    console.error('Audit logging error:', err);
  }
}

module.exports = {
  logAuditEvent
};
