export default function Button({ children, className = "", ...props }) {
    return (
      <button
        className={`w-full bg-black text-white py-3 rounded-xl font-medium hover:opacity-90 transition ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
  