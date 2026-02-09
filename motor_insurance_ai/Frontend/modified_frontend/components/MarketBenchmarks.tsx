import React, { useEffect, useState } from "react";
import { Card, Badge, Button } from "../components/ui/Core";
import { api } from "../services/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Trophy, AlertTriangle, Scale, Network } from "lucide-react";

export const MarketBenchmarks: React.FC = () => {
    const [ranking, setRanking] = useState<any[]>([]);
    const [similarity, setSimilarity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                const [rankData, simData] = await Promise.all([
                    api.analytics.getRanking(),
                    api.analytics.getSimilarity()
                ]);
                setRanking(rankData);
                setSimilarity(simData.slice(0, 5)); // Top 5 pairs
            } catch (e) {
                console.error("Failed to load benchmarks", e);
            } finally {
                setLoading(false);
            }
        };
        fetchInsights();
    }, []);

    if (loading) return <div className="p-12 text-center text-slate-500">Loading market insights...</div>;

    // Prepare data for Strictness Chart
    const chartData = ranking.map(r => ({
        name: r.insurer,
        score: (r.strictness_score * 100).toFixed(1)
    })).slice(0, 10); // Top 10

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* STRICTNESS LEADERBOARD */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Scale className="text-blue-600" size={20} /> Strictness Index
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">Normalized exclusion count (Lower is better)</p>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-slate-100">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-4 py-3">Rank</th>
                                    <th className="px-4 py-3">Insurer</th>
                                    <th className="px-4 py-3 text-right">Strictness Score</th>
                                    <th className="px-4 py-3 text-right">Risk Level</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {ranking.map((r, index) => (
                                    <tr key={r.insurer} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-mono text-slate-400">#{index + 1}</td>
                                        <td className="px-4 py-3 font-medium text-slate-900">{r.insurer}</td>
                                        <td className="px-4 py-3 text-right font-bold text-slate-700">
                                            {(r.strictness_score * 100).toFixed(1)}%
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Badge variant={r.risk_score > 50 ? "danger" : r.risk_score > 20 ? "warning" : "success"}>
                                                {r.risk_score > 50 ? "High" : r.risk_score > 20 ? "Medium" : "Low"}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* VISUALIZATIONS & SIMILARITY */}
                <div className="space-y-6">
                    {/* CHART */}
                    <Card className="p-6">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Market Comparison</h3>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis dataKey="name" hide />
                                    <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                                    <Bar dataKey="score" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* SIMILARITY LIST */}
                    <Card className="p-6">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                            <Network className="text-purple-600" size={20} /> Coverage Similarity
                        </h3>
                        <div className="space-y-3">
                            {similarity.map((sim, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-slate-700">{sim.insurer_a}</span>
                                        <span className="text-slate-400">vs</span>
                                        <span className="font-medium text-slate-700">{sim.insurer_b}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-purple-500"
                                                style={{ width: `${sim.similarity_score * 100}%` }}
                                            />
                                        </div>
                                        <span className="font-mono text-xs text-slate-500">{(sim.similarity_score * 100).toFixed(0)}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
