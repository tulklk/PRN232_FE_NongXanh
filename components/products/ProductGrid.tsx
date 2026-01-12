import ProductCard from './ProductCard'
import { Product } from '@/data/products'

interface ProductGridProps {
  products: Product[]
  columns?: number
}

export default function ProductGrid({ products, columns = 4 }: ProductGridProps) {
  const gridColsClass = {
    1: 'lg:grid-cols-1',
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
    5: 'lg:grid-cols-5',
  }[columns] || 'lg:grid-cols-4'

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 ${gridColsClass} gap-4`}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
