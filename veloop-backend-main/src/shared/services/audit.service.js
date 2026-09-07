import { AuditLog } from "../models/audit_log.model.js"

async function log_action({ actor_id, action, target_user_id, target_type, reference_id, metadata, ip }) {
    return AuditLog.create({
        actor_id: actor_id || null,
        action,
        target_user_id: target_user_id || null,
        target_type: target_type || null,
        reference_id: reference_id || null,
        metadata: metadata || {},
        ip: ip || null
    })
}

export default {
    log_action
}