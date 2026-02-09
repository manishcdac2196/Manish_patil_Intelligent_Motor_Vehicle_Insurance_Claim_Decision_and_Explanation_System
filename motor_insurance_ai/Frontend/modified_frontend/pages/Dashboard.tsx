import React, { useEffect, useState } from "react";
import { Card, Button, Badge } from "../components/ui/Core";
import { api } from "../services/api";
import { Claim, ClaimStatus } from "../types";
import { Plus, Search, FileText } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

export const Dashboard: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.claims.list();
        setClaims(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = {
    total: claims.length,
    approved: claims.filter((c) => c.status === ClaimStatus.APPROVED).length,
    avgDamage: Math.round(
      claims.reduce((acc, c) => acc + (c.aiAnalysis?.damagePercent || 0), 0) / (claims.length || 1),
    ),
  };

  if (loading) return <div className="p-12 text-center text-slate-500">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Claims */}
        <Card className="p-6 bg-gradient-to-br from-primary-600 to-primary-800 text-white border-none">
          <h3 className="text-primary-100 font-medium text-sm mb-1">Total Claims</h3>
          <span className="text-4xl font-bold">{stats.total}</span>
        </Card>

        {/* Approved Review */}
        <Card className="p-6">
          <h3 className="text-slate-500 font-medium text-sm mb-1">Approved Claims</h3>
          <span className="text-4xl font-bold text-slate-900">{stats.approved}</span>
        </Card>

        {/* Quick Action – Compact */}
        <Card className="p-6 flex items-center justify-between bg-primary-50 border-primary-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-600/10 rounded-lg flex items-center justify-center">
              <FileText className="text-primary-600 w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">New Claim</h3>
            </div>
          </div>

          <NavLink to="/dashboard/claims/new">
            <Button size="sm" className="w-full">
              <Plus size={14} className="mr-1" />
              Create
            </Button>
          </NavLink>
        </Card>
      </div>

      {/* Recent Claims Table */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="text-lg font-semibold text-slate-800">Recent Claims</h3>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search claim ID or policy..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-3">Claim ID</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Vehicle</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">AI Confidence</th>
                <th className="px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {claims.map((claim) => (
                <tr key={claim.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 font-medium text-slate-900">{claim.id}</td>
                  <td className="px-6 py-3 text-slate-500">{new Date(claim.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-3 text-slate-900">{claim.vehicleDetails.registrationNumber}</td>
                  <td className="px-6 py-3">
                    <Badge variant={claim.status === ClaimStatus.APPROVED ? "success" : "danger"}>{claim.status}</Badge>
                  </td>
                  <td className="px-6 py-3 text-slate-600">
                    {claim.aiAnalysis ? `${Math.round(claim.aiAnalysis.confidence * 100)}%` : "-"}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center space-x-2">
                      <Button variant="primary" size="sm" onClick={() => navigate(`/dashboard/claims/${claim.id}`)}>
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="!text-red-600 hover:!bg-red-50 hover:!border-red-200"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (confirm('Are you sure you want to delete this claim?')) {
                            try {
                              await api.claims.delete(claim.id.toString());
                              setClaims(prev => prev.filter(c => c.id !== claim.id));
                            } catch (err) {
                              alert("Failed to delete claim");
                            }
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
