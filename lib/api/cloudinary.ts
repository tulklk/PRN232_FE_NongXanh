'use client'

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

export async function uploadImageToCloudinary(file: File): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Thiếu cấu hình Cloudinary. Vui lòng kiểm tra biến môi trường.')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  )

  if (!res.ok) {
    let message = 'Không thể upload ảnh lên Cloudinary'
    try {
      const err = (await res.json()) as {
        error?: { message?: string }
        message?: string
      }
      message = err?.error?.message || err?.message || message
    } catch {
      // ignore parse error, use default message
    }
    throw new Error(message)
  }

  const json = (await res.json()) as { secure_url?: string; url?: string }
  const url = json.secure_url || json.url
  if (!url) {
    throw new Error('Cloudinary không trả về URL ảnh hợp lệ')
  }
  return url
}

export async function uploadMultipleImages(files: File[]): Promise<string[]> {
  if (!files || files.length === 0) return []

  // Giới hạn số lượng ảnh để tránh upload nhầm quá nhiều
  const MAX_FILES = 8
  if (files.length > MAX_FILES) {
    throw new Error(`Vui lòng chọn tối đa ${MAX_FILES} ảnh cho mỗi sản phẩm.`)
  }

  const uploads = files.map((file) => uploadImageToCloudinary(file))
  return Promise.all(uploads)
}


