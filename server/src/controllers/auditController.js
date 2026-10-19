import AuditLog from '../models/AuditLog.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// GET /api/audit-logs?entityType=&action=&limit=
export const listAuditLogs = asyncHandler(async (req, res) => {
  const { entityType, action, limit } = req.query;
  const filter = { tenantId: req.tenantId };

  if (entityType) filter.entityType = entityType;
  if (action) filter.action = action;

  const logs = await AuditLog.find(filter)
    .sort({ createdAt: -1 })
    .limit(Number(limit) || 150)
    .lean();

  res.json(logs);
});

