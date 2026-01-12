export interface NewsArticle {
  id: string
  title: string
  image: string
  date: string
  category: string
  excerpt?: string
}

export const newsArticles: NewsArticle[] = [
  {
    id: '1',
    title: 'Tuyển sỉ quà Tết 2025 cùng Foodmap - Đồng hành cùng doanh nghiệp trong hành trình trọn gói trị ân và giới thiệu Việt',
    image: '/images/news/tet-gifts.jpg',
    date: '2025-10-22',
    category: 'Nông Nghiệp 360',
  },
  {
    id: '2',
    title: 'Foodmap Tuyển Sỉ Bán Trung Thu 2025 - Gia Khúc Khóa Siêu Hấp Dẫn',
    image: '/images/news/mid-autumn.jpg',
    date: '2025-09-15',
    category: 'Nông Nghiệp 360',
  },
  {
    id: '3',
    title: 'Mùa Hồng Treo Gió Đà Lạt vào thời điểm nào?',
    image: '/images/news/persimmon-season.jpg',
    date: '2025-08-20',
    category: 'Trải Nghiệm Nông Nghiệp',
  },
  {
    id: '4',
    title: 'Cà phê Giảng - Cà phê nổi tiếng thế giới',
    image: '/images/news/coffee.jpg',
    date: '2025-07-10',
    category: 'Câu Chuyện Và Nhân Vật',
  },
  {
    id: '5',
    title: 'MEGALIVE "VIỆT NAM CẤT CÁNH" - Điểm nhấn tại Viet Nam International Sourcing Expo 2025',
    image: '/images/news/expo.jpg',
    date: '2025-06-05',
    category: 'Xuất Nhập Khẩu',
  },
  {
    id: '6',
    title: 'Hướng dẫn đăng ký Affiliate Foodmap',
    image: '/images/news/affiliate.jpg',
    date: '2025-05-20',
    category: 'Nông Nghiệp 360',
  },
  {
    id: '7',
    title: 'Triển khai chương trình tiếp thị liên kết - Affiliate Foodmap',
    image: '/images/news/marketing.jpg',
    date: '2025-05-15',
    category: 'Nông Nghiệp 360',
  },
  {
    id: '8',
    title: 'So sánh sầu riêng Black Thon và Musang King: Giống và khác nhau',
    image: '/images/news/durian.jpg',
    date: '2025-04-10',
    category: 'Trải Nghiệm Nông Nghiệp',
  },
  {
    id: '9',
    title: 'Cấp độ rang cà phê - Chọn đúng để có tách cà phê đậm vị, thơm ngon',
    image: '/images/news/coffee-roast.jpg',
    date: '2025-03-25',
    category: 'Trải Nghiệm Nông Nghiệp',
  },
  {
    id: '10',
    title: 'Ăn chay rằm tháng 6: Gợi ý món chay tiện lợi - Mì chay rong biển Mikuri',
    image: '/images/news/vegetarian.jpg',
    date: '2025-03-15',
    category: 'Trải Nghiệm Nông Nghiệp',
  },
  {
    id: '11',
    title: 'Viết Kinh Phật trên lá thốt nốt',
    image: '/images/news/palm-leaf.jpg',
    date: '2025-02-20',
    category: 'Câu Chuyện Và Nhân Vật',
  },
]

export const newsCategories = [
  'Nông Nghiệp 360',
  'Câu Chuyện Và Nhân Vật',
  'Podcast - Agrishow',
  'Trải Nghiệm Nông Nghiệp',
  'Agritech',
  'Nông Nghiệp Bền Vững',
  'Xuất Nhập Khẩu',
  'Trồng Cây Nuôi Con',
]
