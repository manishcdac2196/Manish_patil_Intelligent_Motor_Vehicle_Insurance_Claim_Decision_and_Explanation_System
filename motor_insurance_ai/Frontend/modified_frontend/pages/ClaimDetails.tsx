import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { Claim } from "../types";
import { Card, Button, Badge, cn } from "../components/ui/Core";
import { ArrowLeft, CheckCircle, FileText, Search, ChevronDown, ChevronRight } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

export const ClaimDetails: React.FC = () => {
  const { claimId } = useParams<{ claimId: string }>();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "visuals">("overview");
  const [ragQuery, setRagQuery] = useState("");
  const [ragResults, setRagResults] = useState<any[]>([]);
  const [queryLoading, setQueryLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    api.claims
      .get(claimId)
      .then(setClaim)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [claimId]);

  const handleRagQuery = async () => {
    if (!ragQuery.trim()) return;
    setQueryLoading(true);
    const res = await api.ai.ragQuery(ragQuery);
    setRagResults((res as any).matches);
    setQueryLoading(false);
  };

  if (loading || !claim) return <div className="p-12 text-center">Loading claim details...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              {claim.id}
              <Badge variant={claim.status === "APPROVED" ? "success" : "danger"}>{claim.status}</Badge>
            </h1>
            <p className="text-slate-500 text-sm">
              Created on {new Date(claim.createdAt).toLocaleString()} by {claim.userId}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Images & Incident */}
        <div className="space-y-6">
          <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b font-medium">Evidence Gallery</div>
            <div className="grid grid-cols-2 gap-1 p-2 bg-slate-100">
              {claim.images.length > 0 ? (
                claim.images.map((img, i) => (
                  <img key={i} src={img.url} className="w-full h-32 object-cover rounded border border-slate-300" />
                ))
              ) : (
                <div className="p-4 text-sm text-slate-400">No images</div>
              )}
            </div>
          </Card>

          <Card className="p-6 text-sm space-y-3">
            <h3 className="font-semibold text-slate-900">Incident Context</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-slate-500">Date:</div>
              <div>{claim.incidentDetails.accidentDate}</div>
              <div className="text-slate-500">Type:</div>
              <div>{claim.accidentSpecifics.accidentType}</div>
              <div className="text-slate-500">Policy:</div>
              <div>{claim.policyNumber}</div>
              <div className="text-slate-500">Car Age:</div>
              <div>{claim.vehicleDetails.carAge} yrs</div>
              <div className="text-slate-500">Location:</div>
              <div>{claim.incidentDetails.locationType}</div>
            </div>
          </Card>
        </div>

        {/* Center/Right: AI Analysis */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Damage Card */}
          {claim.aiAnalysis && (
            <Card className="p-6 border-primary-200 bg-gradient-to-r from-white to-primary-50/30">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                <span className="text-2xl">🤖</span>
                AI Damage Assessment
              </h2>

              {/* Tabs Header */}
              <div className="flex border-b border-slate-100 mb-6">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={cn("px-4 py-2 text-sm font-medium border-b-2 transition-colors", activeTab === "overview" ? "border-primary-500 text-primary-700" : "border-transparent text-slate-500 hover:text-slate-700")}
                >
                  Overview & Decision
                </button>
                <button
                  onClick={() => setActiveTab("visuals")}
                  className={cn("px-4 py-2 text-sm font-medium border-b-2 transition-colors", activeTab === "visuals" ? "border-primary-500 text-primary-700" : "border-transparent text-slate-500 hover:text-slate-700")}
                >
                  Visual Evidence ({claim.aiAnalysis.annotated_images ? claim.aiAnalysis.annotated_images.length : 0})
                </button>
              </div>

              {/* TAB CONTENT: OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-left-1 duration-200">
                  {/* Key Metrics - Cleaner Row */}
                  <div className="flex flex-wrap gap-8 items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <div className="text-xs text-slate-400 uppercase font-medium mb-1">Severity</div>
                      <div className="font-semibold text-slate-900">{claim.aiAnalysis.severity || "N/A"}</div>
                    </div>
                    <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>
                    <div>
                      <div className="text-xs text-slate-400 uppercase font-medium mb-1">Evidence</div>
                      <div className="font-semibold text-slate-900">{claim.aiAnalysis.evidence_strength || "N/A"}</div>
                    </div>
                    <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>
                    <div>
                      <div className="text-xs text-slate-400 uppercase font-medium mb-1">Confidence</div>
                      <div className="font-semibold text-slate-900">{claim.aiAnalysis.damagePercent}%</div>
                    </div>
                    <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>
                    <div>
                      <div className="text-xs text-slate-400 uppercase font-medium mb-1">Status</div>
                      <div className={cn("px-2 py-0.5 rounded text-xs font-bold inline-block", (claim.aiAnalysis.claimability === "Claimable") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                        {claim.aiAnalysis.claimability || "Unknown"}
                      </div>
                    </div>
                  </div>

                  {/* Decision & Evidence Columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-slate-900 font-medium mb-3 flex items-center gap-2 text-sm">
                        Decision Rationale
                      </h3>
                      <div className="text-slate-600 text-sm leading-relaxed">
                        {claim.aiAnalysis.explanation ||
                          (claim.aiAnalysis.explanations && claim.aiAnalysis.explanations.join("\n")) ||
                          "No detailed explanation available."}
                      </div>
                    </div>

                    <div className="border-l border-slate-100 pl-8 hidden md:block">
                      <h3 className="text-slate-900 font-medium mb-3 flex items-center gap-2 text-sm">
                        Matched Policy Rules
                      </h3>
                      <ul className="space-y-2">
                        {claim.aiAnalysis.evidence_list && claim.aiAnalysis.evidence_list.length > 0 ? (
                          claim.aiAnalysis.evidence_list.map((item, i) => (
                            <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                              <span className="text-primary-400 mt-1.5">•</span>
                              <span>{item}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-slate-400 text-sm italic">No specific clauses cited.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: VISUALS */}
              {activeTab === "visuals" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-1 duration-200">
                  {/* Vision Insight Card */}
                  {claim.aiAnalysis.visual_analysis && (
                    <div className="bg-slate-900 rounded-lg p-5 text-slate-300 text-sm leading-relaxed border border-slate-800 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" /></svg>
                      </div>
                      <h4 className="text-primary-300 font-medium mb-2 uppercase tracking-wider text-xs">AI Vision Analysis</h4>
                      "{claim.aiAnalysis.visual_analysis}"
                    </div>
                  )}

                  {/* Gallery */}
                  {claim.aiAnalysis.annotated_images && claim.aiAnalysis.annotated_images.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {claim.aiAnalysis.annotated_images.map((path: string, idx: number) => (
                        <div key={idx} className="group relative rounded-lg overflow-hidden bg-slate-100 cursor-zoom-in border border-slate-200">
                          <img
                            src={`http://127.0.0.1:8000${path}`}
                            alt={`Evidence ${idx + 1}`}
                            className="w-full h-40 object-contain hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-slate-400">No annotated images available.</div>
                  )}
                </div>
              )}


            </Card>
          )}

          {/* RAG Policy Evidence */}
          <Card className="p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-500" />
              Policy Evidence (RAG)
            </h2>

            {/* Auto-populated matches from backend if any */}
            {claim.aiAnalysis?.ragMatches && claim.aiAnalysis.ragMatches.length > 0 && (
              <div className="mb-6 space-y-3">
                <p className="text-xs text-slate-500 font-medium uppercase">Automatically retrieved Clauses:</p>
                {claim.aiAnalysis.ragMatches.map((match, i) => (
                  <div key={i} className="bg-amber-50 border border-amber-100 p-3 rounded-lg text-sm">
                    <p className="text-slate-800 mb-1">"{match.text}"</p>
                    <div className="flex items-center gap-2 text-xs text-amber-700">
                      <span className="font-semibold">
                        Source: {match.source} (pg {match.page})
                      </span>
                      <span className="bg-white px-1 rounded border border-amber-200">Confidence: {match.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Interactive Query */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="flex gap-2 mb-3">
                <input
                  className="flex-1 text-sm border-slate-300 rounded-md px-3 py-2"
                  placeholder="Ask a specific policy question (e.g. 'Is flood damage covered?')"
                  value={ragQuery}
                  onChange={(e) => setRagQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRagQuery()}
                />
                <Button size="sm" onClick={handleRagQuery} isLoading={queryLoading}>
                  <Search size={16} />
                </Button>
              </div>

              <div className="space-y-2">
                {ragResults.map((r, i) => (
                  <div
                    key={i}
                    className="bg-white border p-3 rounded text-sm shadow-sm animate-in fade-in slide-in-from-top-1"
                  >
                    <p className="text-slate-800 mb-1">
                      <span className="bg-yellow-100">{r.text}</span>
                    </p>
                    <p className="text-xs text-slate-400">
                      Source: {r.source} - Score: {r.score}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
