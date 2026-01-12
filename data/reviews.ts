export interface Review {
  id: string
  productId: string
  userName: string
  rating: number
  comment: string
  date: string
}

export const reviews: Review[] = [
  {
    id: '1',
    productId: '1',
    userName: 'Thôi Hì',
    rating: 5,
    comment: 'Giao hàng nhanh, nước đậu quả ngọt ngon. Lớp lạnh khi giao vớt tươi mát. Nói chung đó mua nhiều lần vớt hài lòng về chất lượng.',
    date: '2022-01-15',
  },
  {
    id: '2',
    productId: '1',
    userName: 'Chi Trung',
    rating: 5,
    comment: 'Giao ngon, ngọt lắm. Mua đợt sale nên giá rất ok. Shop lại hỗ trợ giao hàng free ship. Trái cây ngon miên man ủng hộ',
    date: '2022-01-10',
  },
  {
    id: '3',
    productId: '1',
    userName: 'Nhật Quan',
    rating: 5,
    comment: 'Mua của shop rất nhiều lần rồi nhưng mà lần này là ưng nhất từ chất lượng cho tới khối lượng. vote 5 sao',
    date: '2022-01-05',
  },
  {
    id: '4',
    productId: '1',
    userName: 'Mạnh Hùng',
    rating: 5,
    comment: 'Giao hàng siêu tốc chưa đến 2 giờ đã nhận được rồi. Cần đủ. Dừa size M nhỏ có trái cam. Dừa tiện lợi chỉ cần cầm ống hút là uống được.',
    date: '2022-01-01',
  },
  {
    id: '5',
    productId: '1',
    userName: 'Phương Uyên',
    rating: 5,
    comment: 'Giao hàng nhanh, đậu quả ngọt nước luôn. Nước nhiều uống nước đậu hồng ngày rất tốt da đẹp, đậu giao bọc chắc chắn có mát rượi.',
    date: '2021-12-25',
  },
]
