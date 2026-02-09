import React, { useEffect, useState } from "react";
import { Card, Badge } from "../components/ui/Core";
import { api } from "../services/api";
import { Claim, ClaimStatus } from "../types";
import { ArrowUpRight, Building2, Users, FileCheck, AlertTriangle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

import { useNavigate } from "react-router-dom";

export const CompanyDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Pass strictly the company name (though backend now enforces it)
        const data = await api.claims.list(user?.company);

        // Backend now handles filtering, so we can trust the data
        setClaims(data as Claim[]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const stats = {
    total: claims.length,
    approved: claims.filter((c) => c.status === ClaimStatus.APPROVED).length,
    rejected: claims.filter((c) => c.status === ClaimStatus.REJECTED).length,
    avgPayout: 12500, // Mock
  };

  if (loading) return <div className="p-12 text-center text-slate-500">Loading company data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">{user?.company || "Company"} Overview</h2>
        <span className="text-sm text-slate-500">Last updated: Just now</span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 border-l-4 border-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase">Total Claims</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.total}</h3>
            </div>
            <FileCheck className="text-blue-500 opacity-50" />
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-green-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase">Approved</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.approved}</h3>
            </div>
            <ArrowUpRight className="text-green-500 opacity-50" />
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-red-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase">Rejected</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.rejected}</h3>
            </div>
            <AlertTriangle className="text-red-500 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Company Claims Table */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800">Claim Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-3">Claim ID</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Policy No.</th>
                <th className="px-6 py-3">Vehicle Type</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Damage Est.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {claims.map((claim) => (
                <tr
                  key={claim.id}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/dashboard/claims/${claim.id}`)}
                >
                  <td className="px-6 py-3 font-medium text-slate-900">{claim.id}</td>
                  <td className="px-6 py-3 text-slate-700">{claim.userName || claim.userId}</td>
                  <td className="px-6 py-3 text-slate-500 font-mono">{claim.policyNumber}</td>
                  <td className="px-6 py-3 text-slate-700">{claim.vehicleDetails.vehicleType}</td>
                  <td className="px-6 py-3">
                    <Badge
                      variant={
                        claim.status === ClaimStatus.APPROVED
                          ? "success"
                          : claim.status === ClaimStatus.REJECTED
                            ? "danger"
                            : "warning"
                      }
                    >
                      {claim.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-3 font-medium">
                    {claim.aiAnalysis ? `${claim.aiAnalysis.damagePercent}%` : "N/A"}
                  </td>
                </tr>
              ))}
              {claims.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No claims found for {user?.company}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
