"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Ban,
  RefreshCw,
  Monitor,
  Globe,
  User,
} from "lucide-react";
import { parseUserAgent, shortenId } from "@/lib/parseUserAgent";

const levelStyles = {
  LOW: "bg-amber-100 text-amber-800 border-amber-200",
  CRITICAL: "bg-red-100 text-red-800 border-red-200",
  MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-200",
  HIGH: "bg-green-100 text-green-800 border-green-200",
};

const statusLabels = {
  pending: "در انتظار",
  approved: "تأیید شده",
  denied: "رد شده",
  expired: "منقضی",
  blocked: "مسدود",
};

const typeLabels = {
  low_trust_login: "ورود کم‌اعتماد",
  admin_approval: "تأیید ادمین",
  security_review: "بازبینی امنیتی",
  critical_login: "ورود بحرانی",
};

export default function AdminApprovalsPage() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selected, setSelected] = useState(null);
  const [adminNote, setAdminNote] = useState("");
  const [processing, setProcessing] = useState(false);

  async function fetchApprovals(status = statusFilter) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/approvals?status=${status}`);
      const data = await res.json();
      if (res.ok) setApprovals(data.data.approvals || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchApprovals(statusFilter);
    const interval = setInterval(() => fetchApprovals(statusFilter), 15000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  async function handleAction(id, action) {
    const labels = { approve: "تأیید", deny: "رد", block: "رد و مسدودسازی" };
    if (!confirm(`آیا از ${labels[action]} این درخواست مطمئن هستید؟`)) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/approvals/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, adminNote }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setSelected(null);
        setAdminNote("");
        fetchApprovals(statusFilter);
      } else toast.error(data.message);
    } finally {
      setProcessing(false);
    }
  }

  const filters = [
    { id: "pending", label: "معلق" },
    { id: "approved", label: "تأیید شده" },
    { id: "denied", label: "رد شده" },
    { id: "all", label: "همه" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield size={22} className="text-purple-600" />
            تأییدها
          </h2>
          <p className="text-sm text-gray-500 mt-1">صف درخواست‌های ورود پرریسک</p>
        </div>
        <button
          onClick={() => fetchApprovals(statusFilter)}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw size={16} />
          بروزرسانی
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              statusFilter === f.id
                ? "bg-purple-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 text-center">
            <div className="w-10 h-10 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : approvals.length === 0 ? (
          <div className="p-16 text-center text-gray-500">
            <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
            <p className="font-medium">درخواستی یافت نشد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-right">
                  <th className="px-4 py-3 font-semibold text-gray-600">کاربر / شناسه</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">ریسک</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">دستگاه</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">شبکه</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">وضعیت</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {approvals.map((a) => {
                  const { browser, os } = parseUserAgent(a.userAgent);
                  const level = a.trustLevel || "LOW";
                  return (
                    <tr key={a._id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                            <User size={16} className="text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{a.userId?.name || "—"}</p>
                            <p className="text-xs text-gray-500">{a.identifier || a.userId?.email}</p>
                            <p className="text-xs text-gray-400">{a.userId?.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden sm:table-cell">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${levelStyles[level] || levelStyles.LOW}`}>
                          {level}
                        </span>
                        <p className="text-xs text-red-600 mt-1 font-medium">امتیاز: {a.trustScore}</p>
                        {a.riskFactors?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {a.riskFactors.map((f) => (
                              <span key={f} className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded">{f}</span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <p className="text-xs text-gray-500">دستگاه: {shortenId(a.deviceId, 10)}</p>
                        <div className="flex items-center gap-1.5 text-gray-600 mt-1">
                          <Monitor size={14} />
                          {browser} / {os}
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Globe size={14} />
                          {a.ip || "—"}
                        </div>
                        {a.location?.city && <p className="text-xs text-gray-400 mt-0.5">{a.location.city}</p>}
                        <p className="text-xs text-gray-400 mt-1">
                          <Clock size={10} className="inline ml-1" />
                          {new Date(a.requestedAt || a.createdAt).toLocaleString("fa-IR")}
                        </p>
                        <p className="text-xs text-amber-600">انقضا: {new Date(a.expiresAt).toLocaleString("fa-IR")}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                          {statusLabels[a.status] || a.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-2">
                          {a.status === "pending" && (
                            <button
                              onClick={() => handleAction(a._id, "approve")}
                              disabled={processing}
                              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium disabled:opacity-50"
                            >
                              تأیید
                            </button>
                          )}
                          <button
                            onClick={() => { setSelected(a); setAdminNote(a.adminNote || ""); }}
                            className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium"
                          >
                            جزئیات
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <ApprovalDetailModal
          selected={selected}
          adminNote={adminNote}
          setAdminNote={setAdminNote}
          processing={processing}
          onAction={handleAction}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function ApprovalDetailModal({ selected, adminNote, setAdminNote, processing, onAction, onClose }) {
  const { browser, os } = parseUserAgent(selected.userAgent);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Shield size={20} className="text-purple-600" />
          جزئیات درخواست تأیید
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5 text-sm">
          <DetailField label="کاربر" value={selected.userId?.name} />
          <DetailField label="شناسه ورود" value={selected.identifier} />
          <DetailField label="ایمیل" value={selected.userId?.email} />
          <DetailField label="تلفن" value={selected.userId?.phone} />
          <DetailField label="نوع درخواست" value={typeLabels[selected.type] || selected.type} />
          <DetailField label="وضعیت" value={statusLabels[selected.status] || selected.status} />
          <DetailField label="سطح اعتماد" value={`${selected.trustLevel} (${selected.trustScore})`} />
          <DetailField label="دستگاه" value={shortenId(selected.deviceId, 16)} />
          <DetailField label="IP" value={selected.ip || "—"} />
          <DetailField label="مرورگر / OS" value={`${browser} / ${os}`} />
          <DetailField label="User-Agent" value={selected.userAgent ? `${selected.userAgent.slice(0, 60)}…` : "—"} full />
          <DetailField label="مکان" value={selected.location?.city ? `${selected.location.city}, ${selected.location.country || ""}` : "—"} />
          <DetailField label="زمان درخواست" value={new Date(selected.requestedAt || selected.createdAt).toLocaleString("fa-IR")} />
          <DetailField label="انقضا" value={new Date(selected.expiresAt).toLocaleString("fa-IR")} />
          {selected.reviewedAt && (
            <DetailField label="زمان بررسی" value={new Date(selected.reviewedAt).toLocaleString("fa-IR")} />
          )}
          {selected.reviewedBy && (
            <DetailField label="بررسی‌کننده" value={selected.reviewedBy?.name || selected.reviewedBy?.email || "—"} />
          )}
          {selected.approvalTokenUsed != null && (
            <DetailField label="توکن مصرف‌شده" value={selected.approvalTokenUsed ? "بله" : "خیر"} />
          )}
          {selected.decisionReason && (
            <DetailField label="دلیل تصمیم" value={selected.decisionReason} full />
          )}
        </div>

        {selected.requestContext && (
          <div className="mb-4 p-3 bg-amber-50 rounded-lg text-sm border border-amber-100">
            <p className="text-xs text-amber-700 mb-1 font-medium">زمینه درخواست</p>
            <pre className="text-xs text-gray-700 whitespace-pre-wrap break-all">
              {JSON.stringify(selected.requestContext, null, 2)}
            </pre>
          </div>
        )}

        {selected.riskFactors?.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">عوامل ریسک</p>
            <div className="flex flex-wrap gap-1">
              {selected.riskFactors.map((f) => (
                <span key={f} className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">{f}</span>
              ))}
            </div>
          </div>
        )}

        {selected.adminNote && selected.status !== "pending" && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
            <p className="text-xs text-gray-500 mb-1">یادداشت ادمین (ثبت‌شده)</p>
            {selected.adminNote}
          </div>
        )}

        {selected.status === "pending" && (
          <>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="یادداشت ادمین (اختیاری)..."
              className="w-full border border-gray-200 rounded-lg p-3 text-sm mb-4 outline-none focus:ring-2 focus:ring-purple-100"
              rows={3}
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button disabled={processing} onClick={() => onAction(selected._id, "approve")} className="flex items-center justify-center gap-1 py-2.5 bg-green-600 text-white rounded-xl text-sm disabled:opacity-50">
                <CheckCircle size={16} /> تأیید
              </button>
              <button disabled={processing} onClick={() => onAction(selected._id, "deny")} className="flex items-center justify-center gap-1 py-2.5 bg-red-600 text-white rounded-xl text-sm disabled:opacity-50">
                <XCircle size={16} /> رد
              </button>
              <button disabled={processing} onClick={() => onAction(selected._id, "block")} className="flex items-center justify-center gap-1 py-2.5 bg-gray-900 text-white rounded-xl text-sm disabled:opacity-50">
                <Ban size={16} /> مسدود
              </button>
            </div>
          </>
        )}

        <button onClick={onClose} className="w-full mt-3 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-600 hover:bg-gray-200">
          بستن
        </button>
      </div>
    </div>
  );
}

function DetailField({ label, value, full }) {
  return (
    <div className={`bg-gray-50 rounded-lg p-3 ${full ? "sm:col-span-2" : ""}`}>
      <p className="text-gray-500 text-xs">{label}</p>
      <p className="font-medium text-gray-900 break-all">{value || "—"}</p>
    </div>
  );
}
