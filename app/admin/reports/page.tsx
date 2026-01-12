'use client'

import { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format } from 'date-fns'
import { mockRevenueData } from '@/data/admin'
import { formatCurrency } from '@/lib/utils'

export default function ReportsPage() {
  const [startDate, setStartDate] = useState<Date>(new Date('2026-01-02'))
  const [endDate, setEndDate] = useState<Date>(new Date('2026-01-12'))

  const chartData = mockRevenueData.map((item) => ({
    date: format(new Date(item.date), 'dd-MM'),
    revenue: item.revenue / 1000000, // Convert to millions
    fullDate: item.date,
    fullRevenue: item.revenue,
  }))

  const handleApply = () => {
    // Filter logic would go here
    console.log('Apply filter:', startDate, endDate)
  }

  const handleReset = () => {
    setStartDate(new Date('2026-01-02'))
    setEndDate(new Date('2026-01-12'))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">DASHBOARD / ADMIN</h1>
        <p className="text-gray-600">Admin - Báo cáo & Thống kê</p>
      </div>

      {/* Date Filter Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Lọc theo thời gian</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Từ ngày</label>
            <DatePicker
              selected={startDate}
              onChange={(date: Date) => setStartDate(date)}
              dateFormat="dd/MM/yyyy"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Đến ngày</label>
            <DatePicker
              selected={endDate}
              onChange={(date: Date) => setEndDate(date)}
              dateFormat="dd/MM/yyyy"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleApply}
            className="bg-primary-green text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-green-dark transition-colors"
          >
            Áp dụng
          </button>
          <button
            onClick={handleReset}
            className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Đặt lại
          </button>
        </div>
      </div>

      {/* Revenue Chart Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Doanh thu theo ngày</h2>
          <p className="text-sm text-gray-600">
            Biểu đồ thể hiện doanh thu theo thời gian.
          </p>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                tick={{ fill: '#6b7280' }}
              />
              <YAxis
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                tick={{ fill: '#6b7280' }}
                label={{ value: 'Triệu VNĐ', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                        <p className="text-sm font-semibold text-gray-900">
                          {format(new Date(data.fullDate), 'dd/MM/yyyy')}
                        </p>
                        <p className="text-sm text-primary-green font-semibold">
                          Doanh thu: {formatCurrency(data.fullRevenue)}
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#22c55e"
                strokeWidth={3}
                dot={{ fill: '#22c55e', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
