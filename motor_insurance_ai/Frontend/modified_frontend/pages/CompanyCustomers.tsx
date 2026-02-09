import React, { useEffect, useState } from "react";
import { Card, Button, Badge } from "../components/ui/Core";
import { api } from "../services/api";
import { Claim } from "../types";
import { Search, UserCircle, Mail, Car, FileText, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface Customer {
  id: string;
  name: string;
  email: string;
  policies: Set<string>;
  totalClaims: number;
  activeClaims: number;
  vehicles: Set<string>;
  claimsHelpers: any[]; // Store minimal claim info for the modal
}

export const CompanyCustomers: React.FC = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const claims = await api.claims.list(user?.company);

        // Group by User ID to form a "Customer List"
        const customerMap = new Map();

        (claims as Claim[]).forEach(c => {
          // STRICT FILTER: Exclude any record with missing ID, Date, User ID, or "Unknown" name.
          // This effectively "deletes" them from the company view.
          if (!c.id || !c.userId || !c.createdAt || c.userName === "Unknown User") return;

          if (!customerMap.has(c.userId)) {
            customerMap.set(c.userId, {
              id: c.userId,
              name: c.userName || "Valued Customer",
              email: `user_${c.userId.substring(0, 6)}@example.com`,
              policies: new Set([c.policyNumber]),
              totalClaims: 0,
              activeClaims: 0,
              vehicles: new Set([c.vehicleDetails.registrationNumber]),
              claimsHelpers: []
            });
          }
          const cust = customerMap.get(c.userId);
          cust.totalClaims++;
          cust.policies.add(c.policyNumber);
          cust.vehicles.add(c.vehicleDetails.registrationNumber);
          cust.claimsHelpers.push({
            id: c.id,
            status: c.status,
            date: c.createdAt,
            vehicle: c.vehicleDetails.vehicleType
          });

          if (c.status === 'PENDING' || c.status === 'ANALYZING' || c.status === 'REQUIRES_REVIEW') {
            cust.activeClaims++;
          }
        });

        setCustomers(Array.from(customerMap.values()));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.id.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-12 text-center text-slate-500">Loading customers...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Customer Base</h2>
        <div className="text-sm text-slate-500">
          {customers.length} {customers.length === 1 ? 'Customer' : 'Customers'}
        </div>
      </div>

      <Card className="overflow-hidden min-h-[500px]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <h3 className="font-semibold text-slate-800">All Customers</h3>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Contact</th>
                <th className="px-6 py-3">Policies</th>
                <th className="px-6 py-3">Vehicles</th>
                <th className="px-6 py-3 text-center">Total Claims</th>
                <th className="px-6 py-3 text-center">Active</th>
                <th className="px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredCustomers.map((cust) => (
                <tr key={cust.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <UserCircle size={20} />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{cust.name}</div>
                        <div className="text-xs text-slate-400">ID: {cust.id.substring(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-slate-500">
                    <div className="flex items-center gap-2">
                      <Mail size={14} />
                      <span className="truncate max-w-[150px]">{cust.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className="bg-slate-100 px-2 py-1 rounded text-xs font-mono text-slate-600 border border-slate-200">{cust.policies.size} Active</span>
                  </td>
                  <td className="px-6 py-3 text-slate-600">
                    <div className="flex items-center gap-1">
                      <Car size={14} />
                      {cust.vehicles.size}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-center font-bold text-slate-700">{cust.totalClaims}</td>
                  <td className="px-6 py-3 text-center">
                    {cust.activeClaims > 0 ? (
                      <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-bold">{cust.activeClaims}</span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(cust)}>View Profile</Button>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    {search ? "No matches found." : "No customers found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* CUSTOMER PROFILE MODAL */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                  <UserCircle size={40} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedCustomer.name}</h3>
                  <p className="text-slate-500 text-sm flex items-center gap-2">
                    <Mail size={14} /> {selectedCustomer.email}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Badge variant="default" className="bg-white border border-slate-200 text-slate-600">
                      {selectedCustomer.vehicles.size} Vehicles
                    </Badge>
                    <Badge variant="default" className="bg-white border border-slate-200 text-slate-600">
                      {selectedCustomer.policies.size} Policies
                    </Badge>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <FileText size={18} className="text-slate-400" /> Claim History
              </h4>
              <div className="space-y-3">
                {selectedCustomer.claimsHelpers.map((c: any) => (
                  <div key={c.id || Math.random()} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <div>
                      <div className="font-medium text-slate-800">{c.vehicle || "Vehicle"} Claim</div>
                      <div className="text-xs text-slate-500">
                        {c.date ? new Date(c.date).toLocaleDateString() : 'N/A'} • ID: {String(c.id || "").substring(0, 8)}
                      </div>
                    </div>
                    <Badge variant={c.status === 'APPROVED' ? 'success' : c.status === 'REJECTED' ? 'danger' : 'warning'}>
                      {c.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <Button variant="secondary" onClick={() => setSelectedCustomer(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};