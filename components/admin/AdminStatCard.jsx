export default function AdminStatCard({ icon: Icon, label, value, color = "blue" }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    orange: "bg-orange-50 text-orange-600",
    indigo: "bg-indigo-50 text-indigo-600",
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-gray-500 truncate">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value ?? "—"}</p>
        </div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colors[color]}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}
