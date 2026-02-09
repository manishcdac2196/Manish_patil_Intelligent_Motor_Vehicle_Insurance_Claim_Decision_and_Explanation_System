import React, { useEffect, useState } from "react";
import { Card, Button, Badge } from "../components/ui/Core";
import { api } from "../services/api";
import { Claim, ClaimStatus } from "../types";
import { Plus, Search, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const ClaimsList: React.FC = () => {
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

  if (loading) return <div className="p-12 text-center text-slate-500">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      {/* Recent Claims Table */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="text-lg font-semibold text-slate-800">All Claims</h3>
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
                    <Button variant="primary" size="sm" onClick={() => navigate(`/dashboard/claims/${claim.id}`)}>
                      View
                    </Button>
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
