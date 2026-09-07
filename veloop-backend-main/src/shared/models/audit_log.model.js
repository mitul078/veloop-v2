import mongoose from "mongoose"

const audit_log_schema = new mongoose.Schema({
    actor_id: { type: mongoose.Schema.Types.ObjectId, ref: "Auth", default: null },
    action: { type: String, required: true },
    target_user_id: { type: mongoose.Schema.Types.ObjectId, ref: "Auth", default: null },
    target_type: { type: String, default: null },
    reference_id: { type: mongoose.Schema.Types.ObjectId, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, default: null }
}, { timestamps: true })

audit_log_schema.index({ target_user_id: 1, createdAt: -1 })
audit_log_schema.index({ action: 1 })

export const AuditLog = mongoose.model("AuditLog", audit_log_schema)