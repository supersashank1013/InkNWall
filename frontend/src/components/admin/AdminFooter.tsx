export default function AdminFooter() {
  return (
    <div className="border-t border-white/10 text-center text-xs text-gray-500 py-6 mt-20">
      © {new Date().getFullYear()} InkNWall Admin Panel
    </div>
  );
}