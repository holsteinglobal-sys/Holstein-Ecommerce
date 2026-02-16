import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell
} from 'recharts';
import { 
  MdTrendingUp, MdShowChart, MdShoppingBag, MdAttachMoney, 
  MdFilterList, MdCalendarToday, MdArrowUpward, MdArrowDownward,
  MdAccessTime, MdToday, MdDateRange, MdEventNote
} from 'react-icons/md';
import TableSkeleton from '../../Component/Skeletons/TableSkeleton';

const AdminStats = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('monthly'); // 'hourly', 'daily', 'monthly', 'yearly'
  const [metricMode, setMetricMode] = useState('revenue'); // 'revenue', 'orders'
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  useEffect(() => {
    const q = query(collection(db, "orders"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().createdAt?.toDate() || new Date()
      }));
      setOrders(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // --- Data Processing Engine ---

  const stats = useMemo(() => {
    // Revenue is usually calculated from delivered or paid orders. 
    // For this context, we'll count 'delivered' as earned revenue.
    const delivered = orders.filter(o => o.status === 'delivered');
    const totalRevenue = delivered.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const totalOrdersCount = orders.length; // Total traffic
    const totalProductsSold = delivered.reduce((sum, o) => 
      sum + (o.products?.reduce((pSum, p) => pSum + (Number(p.qty) || 0), 0) || 0), 0
    );
    const avgOrderValue = delivered.length > 0 ? totalRevenue / delivered.length : 0;
    
    return { totalRevenue, totalOrdersCount, totalProductsSold, avgOrderValue };
  }, [orders]);

  const chartData = useMemo(() => {
    const data = [];

    const getBucketData = (filtered) => {
      const deliveredOnly = filtered.filter(o => o.status === 'delivered');
      const canceledOnly = filtered.filter(o => o.status === 'cancelled');
      return {
        revenue: deliveredOnly.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0),
        orders: filtered.length,
        delivered: deliveredOnly.length,
        canceled: canceledOnly.length
      };
    };

    if (viewMode === 'hourly') {
      for (let hour = 0; hour < 24; hour++) {
        const filtered = orders.filter(o => 
          o.date.getFullYear() === selectedYear &&
          o.date.getMonth() === selectedMonth &&
          o.date.getDate() === selectedDay &&
          o.date.getHours() === hour
        );
        data.push({
          name: `${hour}:00`,
          ...getBucketData(filtered)
        });
      }
    } else if (viewMode === 'daily') {
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const filtered = orders.filter(o => 
          o.date.getFullYear() === selectedYear && 
          o.date.getMonth() === selectedMonth && 
          o.date.getDate() === i
        );
        data.push({
          name: i,
          ...getBucketData(filtered)
        });
      }
    } else if (viewMode === 'monthly') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      months.forEach((month, index) => {
        const filtered = orders.filter(o => 
          o.date.getFullYear() === selectedYear && o.date.getMonth() === index
        );
        data.push({
          name: month,
          ...getBucketData(filtered)
        });
      });
    } else if (viewMode === 'yearly') {
      const currentYear = new Date().getFullYear();
      for (let i = currentYear - 3; i <= currentYear; i++) {
        const filtered = orders.filter(o => o.date.getFullYear() === i);
        data.push({
          name: i,
          ...getBucketData(filtered)
        });
      }
    }
    return data;
  }, [orders, viewMode, selectedYear, selectedMonth, selectedDay]);

  if (loading) return <TableSkeleton rows={10} columns={5} />;

  const metricCards = [
    { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: MdAttachMoney, color: 'text-emerald-600', bgColor: 'bg-emerald-100', trend: '+12.5%', isUp: true },
    { label: 'Total Orders', value: stats.totalOrdersCount, icon: MdShoppingBag, color: 'text-blue-600', bgColor: 'bg-blue-100', trend: '+5.2%', isUp: true },
    { label: 'Products Sold', value: stats.totalProductsSold, icon: MdTrendingUp, color: 'text-purple-600', bgColor: 'bg-purple-100', trend: '+18.1%', isUp: true },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const isRevenue = metricMode === 'revenue';
      return (
        <div className="bg-white/80 backdrop-blur-md p-4 shadow-2xl border border-white/20 rounded-2xl animate-in zoom-in duration-200">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-2">{viewMode.toUpperCase()} VIEW: {label}</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                <p className="text-sm font-black text-slate-800">
                    {isRevenue ? `₹${payload[0].value.toLocaleString()}` : `${payload[0].value} ${payload[0].value === 1 ? 'Order' : 'Orders'}`}
                </p>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                <p className="text-[11px] font-bold text-slate-500">
                    {payload[1]?.value || 0} Delivered
                </p>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                <p className="text-[11px] font-bold text-slate-400 italic">
                    {payload[2]?.value || 0} Canceled
                </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Advanced Analytics</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Real-time performance monitoring across multiple dimensions</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Time Picker Controls */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
            {[
                { id: 'hourly', label: 'Hourly', icon: MdAccessTime },
                { id: 'daily', label: 'Daily', icon: MdToday },
                { id: 'monthly', label: 'Monthly', icon: MdDateRange },
                { id: 'yearly', label: 'Yearly', icon: MdEventNote }
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setViewMode(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all duration-300 ${
                        viewMode === tab.id 
                        ? 'bg-white text-indigo-600 shadow-md transform scale-105' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <tab.icon size={14} />
                    {tab.label}
                </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Year Selector (Always visible) */}
            <div className="group relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <MdCalendarToday className="text-indigo-400 group-hover:text-indigo-600 transition-colors" size={14} />
                </div>
                <select 
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="pl-9 pr-8 py-2.5 bg-white rounded-2xl border border-slate-200 shadow-sm text-[10px] font-black text-slate-700 outline-none hover:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none cursor-pointer min-w-[100px]"
                >
                    {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <MdArrowDownward className="text-slate-400 group-hover:text-slate-600 transition-colors" size={10} />
                </div>
            </div>

            {/* Month Selector (Visible for Hourly, Daily, Monthly) */}
            {viewMode !== 'yearly' && (
                <div className="group relative animate-in fade-in zoom-in duration-300">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <MdDateRange className="text-emerald-400 group-hover:text-emerald-600 transition-colors" size={14} />
                    </div>
                    <select 
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="pl-9 pr-8 py-2.5 bg-white rounded-2xl border border-slate-200 shadow-sm text-[10px] font-black text-slate-700 outline-none hover:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10 transition-all appearance-none cursor-pointer min-w-[100px]"
                    >
                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                            <option key={i} value={i}>{m}</option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                        <MdArrowDownward className="text-slate-400 group-hover:text-slate-600 transition-colors" size={10} />
                    </div>
                </div>
            )}

            {/* Day Selector (Visible ONLY for Hourly) */}
            {viewMode === 'hourly' && (
                <div className="group relative animate-in fade-in zoom-in duration-300">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <MdToday className="text-amber-400 group-hover:text-amber-600 transition-colors" size={14} />
                    </div>
                    <select 
                        value={selectedDay} 
                        onChange={(e) => setSelectedDay(Number(e.target.value))}
                        className="pl-9 pr-8 py-2.5 bg-white rounded-2xl border border-slate-200 shadow-sm text-[10px] font-black text-slate-700 outline-none hover:border-amber-300 focus:ring-4 focus:ring-amber-500/10 transition-all appearance-none cursor-pointer min-w-[90px]"
                    >
                        {Array.from({length: new Date(selectedYear, selectedMonth + 1, 0).getDate()}, (_, i) => i + 1).map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                        <MdArrowDownward className="text-slate-400 group-hover:text-slate-600 transition-colors" size={10} />
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metricCards.map((card, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-700"></div>
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                <div className={`p-4 rounded-2xl ${card.bgColor} ${card.color} group-hover:rotate-12 transition-transform duration-500 shadow-sm`}>
                    <card.icon size={28} />
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-black px-3 py-1.5 rounded-full ${card.isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600 shadow-rose-100/50'} shadow-sm`}>
                    {card.isUp ? <MdArrowUpward /> : <MdArrowDownward />}
                    {card.trend}
                </div>
                </div>
                <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{card.label}</p>
                <h3 className="text-3xl font-black text-slate-900 mt-2 tracking-tighter">{card.value}</h3>
                </div>
            </div>
          </div>
        ))}
      </div>

      {/* UNIFIED ADVANCED CHART */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-emerald-400 to-indigo-500"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
               Performance Matrix
               <span className="text-[10px] bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100 font-black uppercase tracking-widest">{viewMode}</span>
            </h3>
            <p className="text-slate-400 text-xs font-bold mt-1">Comparing revenue flows vs transaction volume</p>
          </div>
          
          <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
             <button 
                onClick={() => setMetricMode('revenue')}
                className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${metricMode === 'revenue' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:text-slate-600'}`}
             >
                Sales Revenue
             </button>
             <button 
                onClick={() => setMetricMode('orders')}
                className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${metricMode === 'orders' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:text-slate-600'}`}
             >
                Order Volume
             </button>
          </div>
        </div>

        <div className="h-[450px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 800 }}
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 800 }}
                  tickFormatter={(val) => metricMode === 'revenue' ? `₹${val >= 1000 ? (val/1000).toFixed(1)+'k' : val}` : val}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey={metricMode === 'revenue' ? 'revenue' : 'orders'} 
                  stroke="#6366f1" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorMain)" 
                  animationDuration={1500}
                />
                <Area 
                  type="monotone" 
                  dataKey="delivered" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fillOpacity={1} 
                  fill="url(#colorSec)" 
                  animationDuration={2000}
                />
                <Area 
                  type="monotone" 
                  dataKey="canceled" 
                  stroke="#f43f5e" 
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  fillOpacity={1} 
                  fill="url(#colorCan)" 
                  animationDuration={2500}
                />
              </AreaChart>
            </ResponsiveContainer>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-50 grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Period</span>
                <span className="text-sm font-black text-slate-900 border-l-4 border-indigo-500 pl-3 mt-1">
                    {viewMode === 'hourly' ? 'Last 24 Hours' : viewMode === 'daily' ? `Month of ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][selectedMonth]}` : viewMode === 'monthly' ? `Full Year ${selectedYear}` : 'All Time History'}
                </span>
             </div>
             <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Top Performance</span>
                <span className="text-sm font-black text-emerald-600 border-l-4 border-emerald-400 pl-3 mt-1">
                    ₹{Math.max(...chartData.map(d => d.revenue)).toLocaleString()}
                </span>
             </div>
             <div className="hidden md:flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conversion Health</span>
                <span className="text-sm font-black text-slate-900 border-l-4 border-slate-200 pl-3 mt-1">Stable (84%)</span>
             </div>
             <div className="hidden md:flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sync Efficiency</span>
                <span className="text-sm font-black text-slate-900 border-l-4 border-slate-200 pl-3 mt-1">Real-time (Active)</span>
             </div>
        </div>
      </div>

      {/* DETAILED MONTHLY TABLE PREVIEW - Kept for depth */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-1000 delay-300">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
             <div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Audit Trail</h3>
                <p className="text-xs text-slate-400 font-bold">Raw transactional breakdown for manual verification</p>
             </div>
             <select 
               value={selectedMonth}
               onChange={(e) => setSelectedMonth(Number(e.target.value))}
               className="bg-white px-5 py-2.5 rounded-2xl text-xs font-black text-slate-600 outline-none border border-slate-200 shadow-sm focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
             >
                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                    <option key={i} value={i}>{m}</option>
                ))}
             </select>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-slate-50/50">
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Day Segment</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Gross Revenue</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Count</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Performance</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {chartData.filter(d => d.revenue > 0 || d.orders > 0 || d.canceled > 0).slice(-15).map((day, i) => (
                        <tr key={i} className="hover:bg-indigo-50/30 transition-colors group">
                            <td className="px-8 py-5 font-black text-slate-700 text-sm">{day.name} {viewMode === 'daily' ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][selectedMonth] : ''}</td>
                            <td className="px-8 py-5 font-black text-sm group-hover:scale-105 transition-transform origin-left">
                                {day.revenue > 0 ? (
                                    <span className="text-indigo-600">₹{day.revenue.toLocaleString()}</span>
                                ) : day.canceled > 0 ? (
                                    <span className="text-rose-400 italic">CANCELLED</span>
                                ) : (
                                    <span className="text-slate-300">₹0</span>
                                )}
                            </td>
                            <td className="px-8 py-5 font-bold text-slate-500 text-sm">{day.orders} Units</td>
                            <td className="px-8 py-5">
                                {day.revenue > 0 ? (
                                    <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm shadow-emerald-50">Settled</span>
                                ) : day.canceled > 0 ? (
                                    <span className="px-4 py-1.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm shadow-rose-50">Loss / Void</span>
                                ) : (
                                    <span className="px-4 py-1.5 bg-slate-50 text-slate-400 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">No Traffic</span>
                                )}
                            </td>
                        </tr>
                    ))}
                    {chartData.filter(d => d.revenue > 0 || d.orders > 0 || d.canceled > 0).length === 0 && (
                        <tr>
                            <td colSpan="4" className="px-8 py-16 text-center text-slate-300 font-black uppercase tracking-[0.3em] italic text-xs">No Data In Range</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default AdminStats;
