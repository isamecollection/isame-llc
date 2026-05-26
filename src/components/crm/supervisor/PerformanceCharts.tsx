'use client'
import { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
)

export function PerformanceCharts({ supervisorId }: { supervisorId: string }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/reports/supervisor-performance?supervisorId=${supervisorId}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
  }, [supervisorId])

  if (loading) return <p className="text-gray-500">Loading charts…</p>
  if (!data) return <p className="text-gray-500">No data available.</p>

  // Daily collections line chart
  const dailyData = {
    labels: data.dailyCollections.map((d: any) => d.date),
    datasets: [
      {
        label: 'Collections ($)',
        data: data.dailyCollections.map((d: any) => d.amount),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.3,
      },
    ],
  }

  // Promises bar chart
  const promiseData = {
    labels: data.promisesPerCollector.map((p: any) => p.name),
    datasets: [
      {
        label: 'Kept',
        data: data.promisesPerCollector.map((p: any) => p.kept),
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
      },
      {
        label: 'Broken',
        data: data.promisesPerCollector.map((p: any) => p.broken),
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
      },
    ],
  }

  // Calls bar chart
  const callsData = {
    labels: data.callsPerCollector.map((c: any) => c.name),
    datasets: [
      {
        label: 'Calls',
        data: data.callsPerCollector.map((c: any) => c.calls),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
    },
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
        <h3 className="text-lg font-semibold mb-2">Daily Collections (Last 7 Days)</h3>
        <div style={{ height: '300px' }}>
          <Line data={dailyData} options={chartOptions} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <h3 className="text-lg font-semibold mb-2">Promises Kept vs. Broken (This Month)</h3>
          <div style={{ height: '300px' }}>
            <Bar data={promiseData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <h3 className="text-lg font-semibold mb-2">Calls per Collector (This Month)</h3>
          <div style={{ height: '300px' }}>
            <Bar data={callsData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  )
}
