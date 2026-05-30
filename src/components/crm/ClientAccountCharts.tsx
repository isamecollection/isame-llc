'use client'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

export default function ClientAccountCharts({ dailyData }: any) {
  const data = {
    labels: dailyData.map((d: any) => d.date),
    datasets: [
      {
        label: 'Collections ($)',
        data: dailyData.map((d: any) => d.amount),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.3,
      },
    ],
  }
  return <Line data={data} options={{ responsive: true, maintainAspectRatio: false }} />
}
