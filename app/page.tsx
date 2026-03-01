import { getProducts } from '@/lib/api/products'
import HomePageClient from '@/components/home/HomePageClient'

export const revalidate = 60

export default async function HomePage() {
  let products: Awaited<ReturnType<typeof getProducts>>['items'] = []
  try {
    const res = await getProducts({ pageNumber: 1, pageSize: 20 })
    products = res.items
  } catch {
    products = []
  }

  return <HomePageClient products={products} />
}
