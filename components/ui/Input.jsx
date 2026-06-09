export default function Input({ label, error, ...props }) {
    return (
      <div className="space-y-1">
        <label className="text-sm text-gray-600">{label}</label>
  
        <input
          className="w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-black"
          {...props}
        />
  
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
  