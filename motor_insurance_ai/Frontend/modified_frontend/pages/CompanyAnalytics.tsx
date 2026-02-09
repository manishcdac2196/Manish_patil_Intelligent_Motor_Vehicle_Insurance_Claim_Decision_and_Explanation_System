import React, { useEffect, useState } from "react";
import { Card } from "../components/ui/Core";
import { api } from "../services/api";
import { Claim, ClaimStatus } from "../types";
import { useAuth } from "../context/AuthContext";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
} from "recharts";
import { TrendingUp, Users, AlertCircle, CheckCircle2 } from "lucide-react";

import { MarketBenchmarks } from "../components/MarketBenchmarks";

export const CompanyAnalytics: React.FC = () => {
    const { user } = useAuth();
    const [claims, setClaims] = useState<Claim[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'benchmarks'>('overview');

    useEffect(() => {
        // ... (existing fetchData logic) ...
        const fetchData = async () => {
            try {
                const data = await api.claims.list(user?.company);
                // STRICT FILTER: Only keep valid claims for analytics
                const validClaims = (data as Claim[]).filter(c => c.id && c.userId && c.createdAt && c.userName !== "Unknown User");
                setClaims(validClaims);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    if (loading) return <div className="p-12 text-center text-slate-500">Loading analytics...</div>;

    // ... (existing Data Processing) ...
    // 1. Status Distribution
    const statusCounts = claims.reduce((acc, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const statusData = Object.keys(statusCounts).map((key) => ({
        name: key,
        value: statusCounts[key],
    }));

    const STATUS_COLORS: Record<string, string> = {
        [ClaimStatus.APPROVED]: "#10B981", // Green
        [ClaimStatus.REJECTED]: "#EF4444", // Red
        [ClaimStatus.PENDING]: "#F59E0B", // Amber
        [ClaimStatus.ANALYZING]: "#3B82F6", // Blue
        [ClaimStatus.REQUIRES_REVIEW]: "#8B5CF6", // Purple
        [ClaimStatus.DRAFT]: "#94A3B8", // Slate
    };

    // 2. Monthly Trend (using createdAt)
    const monthlyCounts = claims.reduce((acc, curr) => {
        const date = new Date(curr.createdAt);
        const key = `${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`; // e.g., "Feb 2026"
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Sort chronologically (simple version: assuming data is relatively recent)
    const monthlyData = Object.keys(monthlyCounts).map(key => ({
        name: key,
        claims: monthlyCounts[key]
    }));

    // 3. Vehicle Type Distribution
    const vehicleCounts = claims.reduce((acc, curr) => {
        const type = curr.vehicleDetails.vehicleType;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const vehicleData = Object.keys(vehicleCounts).map(key => ({
        name: key,
        value: vehicleCounts[key]
    }));
    const VEHICLE_COLORS = ["#0EA5E9", "#6366F1", "#8B5CF6", "#EC4899"];


    // 4. KPI Stats
    const totalClaims = claims.length;
    const approvedClaims = claims.filter(c => c.status === ClaimStatus.APPROVED).length;
    const rejectedClaims = claims.filter(c => c.status === ClaimStatus.REJECTED).length;
    const approvalRate = totalClaims > 0 ? ((approvedClaims / totalClaims) * 100).toFixed(1) : "0";
    const totalEstimatedPayout = claims
        .filter(c => c.status === ClaimStatus.APPROVED)
        .reduce((acc, curr) => acc + 12500, 0); // Mock payout avg 12500

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h2>
                    <span className="text-sm text-slate-500">Real-time insights for {user?.company || "Global"}</span>
                </div>

                {/* TABS */}
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'overview'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Performance
                    </button>
                    <button
                        onClick={() => setActiveTab('benchmarks')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'benchmarks'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Market Benchmarks
                    </button>
                </div>
            </div>

            {activeTab === 'benchmarks' ? (
                <MarketBenchmarks />
            ) : (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="p-5 border-l-4 border-slate-700 bg-white shadow-sm">
                            <div className="flex justify-between">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Claims</p>
                                    <h3 className="text-3xl font-extrabold text-slate-800 mt-1">{totalClaims}</h3>
                                </div>
                                <div className="p-3 bg-slate-100 rounded-full h-fit">
                                    <TrendingUp size={20} className="text-slate-600" />
                                </div>
                            </div>
                        </Card>

                        <Card className="p-5 border-l-4 border-green-500 bg-white shadow-sm">
                            <div className="flex justify-between">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Approval Rate</p>
                                    <h3 className="text-3xl font-extrabold text-slate-800 mt-1">{approvalRate}%</h3>
                                </div>
                                <div className="p-3 bg-green-50 rounded-full h-fit">
                                    <CheckCircle2 size={20} className="text-green-600" />
                                </div>
                            </div>
                        </Card>

                        <Card className="p-5 border-l-4 border-blue-500 bg-white shadow-sm">
                            <div className="flex justify-between">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Customers</p>
                                    <h3 className="text-3xl font-extrabold text-slate-800 mt-1">
                                        {new Set(claims.map(c => c.userId)).size}
                                    </h3>
                                </div>
                                <div className="p-3 bg-blue-50 rounded-full h-fit">
                                    <Users size={20} className="text-blue-600" />
                                </div>
                            </div>
                        </Card>

                        <Card className="p-5 border-l-4 border-amber-500 bg-white shadow-sm">
                            <div className="flex justify-between">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Est. Payout</p>
                                    <h3 className="text-3xl font-extrabold text-slate-800 mt-1">
                                        ${(totalEstimatedPayout / 1000).toFixed(1)}k
                                    </h3>
                                </div>
                                <div className="p-3 bg-amber-50 rounded-full h-fit">
                                    <AlertCircle size={20} className="text-amber-600" />
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Row 1: Monthly Trend & Status Pie */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Monthly Trend */}
                        <Card className="lg:col-span-2 p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-6">Claims Volume Over Time</h3>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={monthlyData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                        <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="claims"
                                            stroke="#3B82F6"
                                            strokeWidth={3}
                                            dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4, stroke: '#fff' }}
                                            activeDot={{ r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        {/* Status Distribution */}
                        <Card className="p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-6">Claim Outcome</h3>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statusData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {statusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || "#CBD5E1"} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </div>

                    {/* Row 2: Vehicle Types */}
                    <Card className="p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-6">Claims by Vehicle Category</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={vehicleData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E8F0" />
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="name" width={100} stroke="#475569" fontSize={13} tickLine={false} axisLine={false} />
                                    <Tooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                                    <Bar dataKey="value" fill="#6366F1" radius={[0, 4, 4, 0]} barSize={20}>
                                        {vehicleData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={VEHICLE_COLORS[index % VEHICLE_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </>
            )}
        </div>
    );
};
