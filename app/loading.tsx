export default function Loading() {
  return (
    <div className="bg-[#F5F5F5] min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#0A923C] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-600 text-sm">Đang tải...</p>
      </div>
    </div>
  )
}
