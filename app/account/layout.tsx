import AccountSidebar from '@/components/account/AccountSidebar'

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-gray-100 min-h-screen py-6">
      <div className="max-w-[1400px] mx-auto px-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-600 mb-6">
          <span className="hover:text-[#0A923C] cursor-pointer">Trang chủ</span>
          <span className="mx-2.5">&gt;</span>
          <span className="hover:text-[#0A923C] cursor-pointer">Tài khoản của tôi</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <AccountSidebar />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
