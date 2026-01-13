import StaffLayout from '@/components/staff/StaffLayout'

export default function StaffLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return <StaffLayout>{children}</StaffLayout>
}
