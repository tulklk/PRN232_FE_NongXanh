# Nông Xanh - E-commerce Website

Website thương mại điện tử cho nông sản tươi ngon, đặc sản vùng miền được xây dựng với Next.js 14, TypeScript và Tailwind CSS.

## Tính năng hihui

- 🏠 **Trang chủ** - Hero banner, sản phẩm hot deals, đặc sản vùng miền, tin tức
- 🛍️ **Danh sách sản phẩm** - Lọc theo danh mục, thương hiệu, khoảng giá, sắp xếp
- 📦 **Chi tiết sản phẩm** - Thông tin đầy đủ, đánh giá, sản phẩm liên quan
- 🛒 **Giỏ hàng** - Quản lý sản phẩm, chọn địa chỉ giao hàng
- 💳 **Thanh toán** - Form đặt hàng, chọn phương thức thanh toán
- ✅ **Xác nhận thanh toán** - Trang thành công sau khi đặt hàng
- 🔐 **Đăng nhập/Đăng ký** - Modal và trang đăng nhập với OTP và social login

## Công nghệ sử dụng

- **Next.js 14** - React framework với App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **React Hook Form** - Form handling
- **date-fns** - Date formatting

## Cài đặt

1. Clone repository:
```bash
git clone <repository-url>
cd PRN222_FE_nongxanh
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Chạy development server:
```bash
npm run dev
```

4. Mở trình duyệt tại [http://localhost:3000](http://localhost:3000)

## Cấu trúc dự án

```
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Homepage
│   ├── products/          # Product pages
│   ├── cart/              # Shopping cart
│   ├── checkout/          # Checkout flow
│   └── login/             # Login page
├── components/            # React components
│   ├── layout/            # Header, Footer
│   ├── products/          # Product components
│   ├── common/            # Shared components
│   ├── auth/              # Authentication components
│   ├── news/               # News components
│   └── reviews/           # Review components
├── data/                  # Mock data
├── lib/                   # Utilities and constants
└── public/                # Static assets
```

## Scripts

- `npm run dev` - Chạy development server
- `npm run build` - Build production
- `npm run start` - Chạy production server
- `npm run lint` - Chạy ESLint

## Màu sắc chủ đạo

- Primary Green: `#22c55e`
- Dark Green: `#16a34a`
- Light Green: `#86efac`

## Ghi chú

- Dự án sử dụng mock data để demo
- Cần tích hợp với backend API để hoàn thiện chức năng
- Hình ảnh sản phẩm cần được thêm vào thư mục `public/images/`

## Deploy lên Vercel

1. Push code lên GitHub
2. Kết nối repository với Vercel
3. Vercel sẽ tự động detect Next.js và build
4. Đảm bảo các environment variables được cấu hình nếu cần

## License

MIT
