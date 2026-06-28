import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { ArrowUpRight, TrendingUp, AlertOctagon, BarChart4 } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Reports = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/api/reports/dashboard');
        setStats(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-900 rounded-xl w-48"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-900 rounded-3xl"></div>
          <div className="h-80 bg-slate-900 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  // Sample or formatted data for charts
  const barData = {
    labels: ['Electronics', 'Accessories', 'Offices', 'Furniture'],
    datasets: [
      {
        label: 'Stock Value ($)',
        data: [150000, 45000, 12000, 28000],
        backgroundColor: 'rgba(14, 160, 234, 0.65)',
        borderColor: '#0ea0ea',
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  };

  const doughnutData = {
    labels: ['Central Hub', 'West Coast Annex', 'Euro Distribution'],
    datasets: [
      {
        label: 'Stock Distribution',
        data: [450, 180, 320],
        backgroundColor: [
          'rgba(14, 160, 234, 0.7)',
          'rgba(99, 102, 241, 0.7)',
          'rgba(16, 185, 129, 0.7)',
        ],
        borderColor: [
          '#0ea0ea',
          '#6366f1',
          '#10b981',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#94a3b8',
          font: { family: 'Outfit' }
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8' }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8' }
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Analytics & Reports</h2>
        <p className="text-slate-400 text-sm mt-1">Review visual summaries of catalog worth and inventory mapping.</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-3xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Estimated Inventory Worth</span>
            <span className="text-2xl font-bold text-white block mt-2">$235,000.00</span>
          </div>
          <div className="p-3 bg-brand-500/10 rounded-2xl text-brand-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Fulfillment Precision</span>
            <span className="text-2xl font-bold text-white block mt-2">98.4%</span>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Turnover Cycles</span>
            <span className="text-2xl font-bold text-white block mt-2">12.5 days</span>
          </div>
          <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
            <BarChart4 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Graph Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-3xl border border-slate-800/80 shadow-xl space-y-6">
          <h3 className="font-bold text-white tracking-tight">Catalog Value by Category</h3>
          <div className="p-2">
            <Bar data={barData} options={options} />
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-slate-800/80 shadow-xl space-y-6">
          <h3 className="font-bold text-white tracking-tight">Stock Distribution by Site</h3>
          <div className="max-w-[320px] mx-auto p-2">
            <Doughnut data={doughnutData} options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: { color: '#94a3b8', font: { family: 'Outfit' } }
                }
              }
            }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
