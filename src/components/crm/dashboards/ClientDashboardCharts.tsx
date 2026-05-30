'use client'
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
  ArcElement,
} from 'chart.js'
import { Line, Bar, Pie } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
)

export default function ClientDashboardCharts({
  dailyCollections,
  agreementsKept,
  agreementsBroken,
  statusCounts,
}: any) {
  const lineData = {
    labels: dailyCollections.map((d: any) => d.date),
    datasets: [
      {
        label: 'Collections ($)',
        data: dailyCollections.map((d: any) => d.amount),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.3,
      },
    ],
  }

  const barData = {
    labels: ['Kept', 'Broken'],
    datasets: [
      {
        label: 'Agreements',
        data: [agreementsKept, agreementsBroken],
        backgroundColor: ['rgba(34, 197, 94, 0.7)', 'rgba(239, 68, 68, 0.7)'],
      },
    ],
  }

  const pieData = {
    labels: Object.keys(statusCounts),
    datasets: [
      {
        data: Object.values(statusCounts),
        backgroundColor: ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'],
      },
    ],
  }

  const options = { responsive: true, maintainAspectRatio: false }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
        <h3 className="font-semibold mb-2">Collections (Last 7 Days)</h3>
        <div style={{ height: 300 }}>
          <Line data={lineData} options={options} />
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
        <h3 className="font-semibold mb-2">Agreement Performance</h3>
        <div style={{ height: 300 }}>
          <Bar data={barData} options={options} />
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
        <h3 className="font-semibold mb-2">Account Status Distribution</h3>
        <div style={{ height: 300 }}>
          <Pie data={pieData} options={options} />
        </div>
      </div>
    </div>
  )
}
