import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Select, Card, cn } from "../components/ui/Core";
import { ArrowRight, ArrowLeft, Upload, X, AlertCircle } from "lucide-react";
import { api } from "../services/api";
import { LocationType, AccidentType, VehicleType } from "../types";
import { useNavigate } from "react-router-dom";

// Zod Schema
const incidentSchema = z.object({
  accidentDate: z.string().refine((val) => new Date(val) <= new Date(), "Accident date cannot be in the future."),
  accidentTime: z.string().min(1, "Please enter the time of the accident."),
  locationType: z.nativeEnum(LocationType),
  description: z.string().max(1000, "Description is too long (max 1000 characters).").optional(),
});

const vehicleSchema = z.object({
  policyNumber: z.string().min(5, "Policy number must be at least 5 characters long."),
  policyExpiryDate: z.string().min(1, "Please select the policy expiry date."),
  carAge: z.number().min(0, "Car age cannot be negative.").max(20, "Car age must be 20 years or less."),
  registrationNumber: z.string().min(4, "Please enter a valid vehicle registration number."),
  insurerName: z.string().min(2, "Please enter the Insurance Company name."),
  vehicleType: z.nativeEnum(VehicleType),
});

const specificsSchema = z.object({
  accidentType: z.nativeEnum(AccidentType),
  damageParts: z.array(z.string()).min(1, "Please select at least one damaged part."),
  previousClaims: z.number().min(0, "Previous claims must be 0 or more."),
  policeReport: z.enum(["yes", "no"]),
  driverAtFault: z.enum(["yes", "no"]),
  driverAge: z.number().min(18, "Driver must be at least 18 years old."),
  driverLicenseValid: z.enum(["yes", "no"]),
  alcoholIntoxicated: z.enum(["yes", "no"]),
});

// Merged for final submit
type WizardData = z.infer<typeof incidentSchema> &
  z.infer<typeof vehicleSchema> &
  z.infer<typeof specificsSchema> & { images: File[] };

export const NewClaimWizard: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<WizardData>>({});
  const [previewImages, setPreviewImages] = useState<{ file: File; url: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [daysToExpiry, setDaysToExpiry] = useState<number | null>(null);
  const [aiResult, setAiResult] = useState<any>(null);
  const [claimId, setClaimId] = useState<any>(null);
  const [insurers, setInsurers] = useState<string[]>([]);

  useEffect(() => {
    // Fetch available insurers on mount
    api.analytics.getInsurers()
      .then(list => setInsurers(list))
      .catch(err => console.error("Failed to load insurers", err));
  }, []);

  // ... (existing form definitions) ...


  const {
    register: reg1,
    handleSubmit: sub1,
    formState: { errors: err1 },
    watch: watch1,
  } = useForm<z.infer<typeof incidentSchema>>({
    resolver: zodResolver(incidentSchema),
    defaultValues: formData as any,
  });

  const {
    register: reg2,
    handleSubmit: sub2,
    formState: { errors: err2 },
    watch: watch2,
  } = useForm<z.infer<typeof vehicleSchema>>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: formData as any,
  });

  const {
    register: reg3,
    handleSubmit: sub3,
    formState: { errors: err3 },
    control: con3,
    setValue: setVal3,
    watch: watch3,
  } = useForm<z.infer<typeof specificsSchema>>({
    resolver: zodResolver(specificsSchema),
    defaultValues: {
      previousClaims: 0,
      policeReport: "",
      driverAtFault: "",
      driverLicenseValid: "",
      alcoholIntoxicated: "",
      damageParts: [],
      ...formData,
    } as any,
  });

  // Computed field logic
  const accDate = watch1("accidentDate") || formData.accidentDate;
  const expDate = watch2("policyExpiryDate") || formData.policyExpiryDate;

  useEffect(() => {
    if (accDate && expDate) {
      const start = new Date(accDate).getTime();
      const end = new Date(expDate).getTime();
      const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      setDaysToExpiry(diffDays);
    }
  }, [accDate, expDate]);

  const handleNext = (data: any) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep((prev) => prev + 1);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (previewImages.length + files.length > 10) {
        alert("You can upload a maximum of 10 images.");
        return;
      }
      const newPreviews = files.map((file: any) => ({ file: file as File, url: URL.createObjectURL(file as Blob) }));
      setPreviewImages((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const submitFinal = async () => {
    if (previewImages.length < 2) {
      alert("Please upload at least 2 images.");
      return;
    }
    setIsSubmitting(true);
    try {
      // 1. Prepare FormData for Unified Pipeline
      const payload = new FormData();
      payload.append("description", formData.description || "No description provided");
      payload.append("company", formData.insurerName!);
      payload.append("policy_type", formData.vehicleType!);

      // Construct survey result structure expected by backend
      const surveyData = {
        incidentDetails: {
          accidentDate: formData.accidentDate,
          accidentTime: formData.accidentTime,
          locationType: formData.locationType,
        },
        vehicleDetails: {
          registrationNumber: formData.registrationNumber,
          insurerName: formData.insurerName,
          vehicleType: formData.vehicleType,
          carAge: formData.carAge,
          driverAge: formData.driverAge,
          policyNumber: formData.policyNumber, // Added
        },
        accidentSpecifics: {
          accidentType: formData.accidentType,
          damageParts: formData.damageParts,
          previousClaims: formData.previousClaims,
          policeReport: formData.policeReport === "yes",
          driverAtFault: formData.driverAtFault === "yes",
          driverLicenseValid: formData.driverLicenseValid === "yes",
          alcoholIntoxicated: formData.alcoholIntoxicated === "yes",
        },
        computed: {
          days_to_expiry: daysToExpiry,
          claimable_policy: (daysToExpiry || 0) > 0,
        }
      };

      payload.append("survey_result", JSON.stringify(surveyData));

      // Append images
      previewImages.forEach((p) => {
        payload.append("files", p.file);
      });

      // 2. Call Unified Process Endpoint
      const result = await api.claims.process(payload);

      // Redirect using returned claim_id
      // navigate(`/dashboard/claims/${(result as any).claim_id}`);
      setClaimId((result as any).claim_id);
      setAiResult((result as any).ml_result);
    } catch (e) {
      console.error(e);
      alert("Error submitting claim");
    } finally {
      setIsSubmitting(false);
    }
  };

  const Steps = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4, 5].map((s) => (
        <React.Fragment key={s}>
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
              step === s
                ? "bg-primary-600 text-white"
                : step > s
                  ? "bg-green-500 text-white"
                  : "bg-slate-200 text-slate-500",
            )}
          >
            {s}
          </div>
          {s < 5 && <div className={cn("w-12 h-1 bg-slate-200 mx-2", step > s && "bg-green-500")} />}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <Steps />
      <Card className="p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">
          {step === 1 && "Incident Details"}
          {step === 2 && "Vehicle & Policy"}
          {step === 3 && "Accident Specifics"}
          {step === 4 && "Damage Evidence"}
          {step === 5 && "Review & Submit"}
        </h2>

        {/* Step 1: Incident */}
        {step === 1 && (
          <form onSubmit={sub1(handleNext)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input type="date" label="Accident Date" {...reg1("accidentDate")} error={err1.accidentDate?.message} />
              <Input type="time" label="Accident Time" {...reg1("accidentTime")} error={err1.accidentTime?.message} />
            </div>
            <Select
              label="Location Environment"
              options={[
                { label: "City / Urban", value: LocationType.CITY },
                { label: "Highway", value: LocationType.HIGHWAY },
                { label: "Rural", value: LocationType.RURAL },
              ]}
              {...reg1("locationType")}
              error={err1.locationType?.message}
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
              <textarea
                className="w-full border border-slate-300 rounded-lg p-3 text-sm"
                rows={4}
                {...reg1("description")}
              ></textarea>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit">
                Continue <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          </form>
        )}

        {/* Step 2: Policy */}
        {step === 2 && (
          <form onSubmit={sub2(handleNext)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Vehicle Type"
                options={[
                  { label: "Two Wheeler", value: VehicleType.TWO_WHEELER },
                  { label: "Four Wheeler", value: VehicleType.FOUR_WHEELER },
                  { label: "Truck", value: VehicleType.TRUCK },
                  { label: "Bus", value: VehicleType.BUS },
                  { label: "Other", value: VehicleType.OTHER },
                ]}
                {...reg2("vehicleType")}
                error={err2.vehicleType?.message}
              />
              <Input
                label="Policy Number"
                placeholder="PN-XXXX-XXXX"
                {...reg2("policyNumber")}
                error={err2.policyNumber?.message}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="date"
                label="Policy Expiry Date"
                {...reg2("policyExpiryDate")}
                error={err2.policyExpiryDate?.message}
              />
              <Input
                type="number"
                label="Vehicle Age (Years)"
                {...reg2("carAge", { valueAsNumber: true })}
                error={err2.carAge?.message}
              />
            </div>
            <Input
              label="Registration Number"
              {...reg2("registrationNumber")}
              error={err2.registrationNumber?.message}
            />
            <Select
              label="Insurance Company of Claim"
              placeholder="Select Insurer"
              options={insurers.map(i => ({ label: i.replace(/_/g, " "), value: i }))}
              {...reg2("insurerName")}
              error={err2.insurerName?.message}
            />

            {/* Computed Read-Only */}
            {daysToExpiry !== null && (
              <div
                className={cn(
                  "p-4 rounded-lg border",
                  daysToExpiry > 0
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-red-50 border-red-200 text-red-800",
                )}
              >
                <p className="font-semibold">Policy Status Check:</p>
                <div className="flex justify-between mt-1 text-sm">
                  <span>Days to Expiry: {daysToExpiry}</span>
                  <span>{daysToExpiry > 0 ? "Active Coverage" : "Expired Policy"}</span>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                <ArrowLeft size={16} className="mr-2" /> Back
              </Button>
              <Button type="submit">
                Continue <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          </form>
        )}

        {/* Step 3: Specifics */}
        {step === 3 && (
          <form onSubmit={sub3(handleNext)} className="space-y-6">
            <Select
              label="Accident Type"
              options={[
                { label: "Collision", value: AccidentType.COLLISION },
                { label: "Theft", value: AccidentType.THEFT },
                { label: "Fire", value: AccidentType.FIRE },
                { label: "Natural Disaster", value: AccidentType.NATURAL_DISASTER },
                { label: "Flood / Spill", value: AccidentType.FLOOD_SPILL },
                { label: "Slip", value: AccidentType.SLIP },
                { label: "Vehicle Fire", value: AccidentType.VEHICLE_FIRE },
                { label: "Weather Conditions", value: AccidentType.WEATHER_CONDITIONS },
              ]}
              {...reg3("accidentType")}
              error={err3.accidentType?.message}
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Damaged Parts</label>
              <div className="flex flex-wrap gap-2">
                {["Damage Front", "Damage Rear", "Damage Left", "Damage Right"].map((part) => (
                  <button
                    key={part}
                    type="button"
                    onClick={() => {
                      const current = watch3("damageParts") || [];
                      const newParts = current.includes(part) ? current.filter((p) => p !== part) : [...current, part];
                      setVal3("damageParts", newParts);
                    }}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs border transition-colors",
                      (watch3("damageParts") || []).includes(part)
                        ? "bg-primary-600 text-white border-primary-600"
                        : "bg-white text-slate-600 border-slate-300",
                    )}
                  >
                    {part.replace("_", " ")}
                  </button>
                ))}
              </div>
              {err3.damageParts && <p className="text-red-500 text-xs mt-1">{err3.damageParts.message}</p>}
            </div>

            <div className="flex flex-col md:flex-row md:flex-wrap gap-6">
              <div className="w-full md:w-1/2">
                <Controller
                  name="policeReport"
                  control={con3}
                  render={({ field }) => (
                    <Select
                      label="Was a FIR/Police Report filed?"
                      options={[
                        { label: "Yes", value: "yes" },
                        { label: "No", value: "no" },
                      ]}
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      error={err3.policeReport?.message}
                    />
                  )}
                />
              </div>

              <div className="w-full md:w-1/2">
                <Controller
                  name="driverAtFault"
                  control={con3}
                  render={({ field }) => (
                    <Select
                      label="Was the driver at fault?"
                      options={[
                        { label: "Yes", value: "yes" },
                        { label: "No", value: "no" },
                      ]}
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      error={err3.driverAtFault?.message}
                    />
                  )}
                />
              </div>

              <div className="w-full md:w-1/2">
                <Controller
                  name="driverLicenseValid"
                  control={con3}
                  render={({ field }) => (
                    <Select
                      label="Was the driver's license valid?"
                      options={[
                        { label: "Yes", value: "yes" },
                        { label: "No", value: "no" },
                      ]}
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      error={err3.driverLicenseValid?.message}
                    />
                  )}
                />
              </div>

              <div className="w-full md:w-1/2">
                <Controller
                  name="alcoholIntoxicated"
                  control={con3}
                  render={({ field }) => (
                    <Select
                      label="Was alcohol involved in the accident?"
                      options={[
                        { label: "Yes", value: "yes" },
                        { label: "No", value: "no" },
                      ]}
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      error={err3.alcoholIntoxicated?.message}
                    />
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                label="Driver Age"
                {...reg3("driverAge", { valueAsNumber: true })}
                error={err3.driverAge?.message}
              />
              <Input
                type="number"
                label="Previous Claims"
                {...reg3("previousClaims", { valueAsNumber: true })}
                error={err3.previousClaims?.message}
              />
            </div>

            <div className="flex justify-between pt-4">
              <Button type="button" variant="ghost" onClick={() => setStep(2)}>
                <ArrowLeft size={16} className="mr-2" /> Back
              </Button>
              <Button type="submit">
                Continue <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          </form>
        )}

        {/* Step 4: Images */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors relative">
              <input
                type="file"
                multiple
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleImageUpload}
              />
              <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <p className="text-sm font-medium text-slate-900">Click or drag images to upload</p>
              <p className="text-xs text-slate-500 mt-1">Supports JPG, PNG, HEIC (Max 5MB) • Min 2, Max 10 images</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {previewImages.map((img, idx) => (
                <div
                  key={idx}
                  className="relative group aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200"
                >
                  <img src={img.url} alt="preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                  {/* Annotation Mock Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 pointer-events-none">
                    <div className="bg-white/80 px-2 py-1 rounded text-xs backdrop-blur-sm">Drag to annotate</div>
                  </div>
                </div>
              ))}
              {previewImages.length < 2 && (
                <div className="col-span-full text-center py-4 text-slate-400 text-sm italic">
                  {previewImages.length === 0
                    ? "No images uploaded yet. Please upload at least 2 images."
                    : `Please upload ${2 - previewImages.length} more image(s) to proceed.`}
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <Button type="button" variant="ghost" onClick={() => setStep(3)}>
                <ArrowLeft size={16} className="mr-2" /> Back
              </Button>
              <Button onClick={() => setStep(5)} disabled={previewImages.length < 2}>
                Review & Submit <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {step === 5 && (
          <div className="space-y-6">
            {!aiResult ? (
              // Initial Review State
              <>
                <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm border border-slate-200">
                  <h3 className="font-semibold text-slate-900 border-b pb-2 mb-2">Summary</h3>
                  <div className="grid grid-cols-2 gap-y-2">
                    <span className="text-slate-500">Incident Date:</span>
                    <span className="font-medium">{formData.accidentDate}</span>
                    <span className="text-slate-500">Policy No:</span>
                    <span className="font-medium">{formData.policyNumber}</span>
                    <span className="text-slate-500">Company:</span>
                    <span className="font-medium">{formData.insurerName}</span>
                    <span className="text-slate-500">Vehicle:</span>
                    <span className="font-medium">{formData.vehicleType}</span>
                    <span className="text-slate-500">Images:</span>
                    <span className="font-medium">{previewImages.length} attached</span>
                    <span className="text-slate-500">Computed Status:</span>
                    <span
                      className={cn("font-medium", daysToExpiry && daysToExpiry > 0 ? "text-green-600" : "text-red-600")}
                    >
                      {daysToExpiry && daysToExpiry > 0 ? "Policy Active" : "Policy Expired"}
                    </span>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg flex items-start space-x-3 text-blue-800 text-sm">
                  <AlertCircle className="shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="font-semibold">AI Pre-Analysis Ready</p>
                    <p>
                      Submitting will trigger our ML Damage Estimator and RAG Policy Checker. This may take 3-5 seconds.
                    </p>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button type="button" variant="ghost" onClick={() => setStep(4)}>
                    <ArrowLeft size={16} className="mr-2" /> Back
                  </Button>
                  <Button onClick={submitFinal} isLoading={isSubmitting} className="w-48">
                    Submit Claim
                  </Button>
                </div>
              </>
            ) : (
              // AI Result View
              <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                <div className="bg-amber-50 p-6 rounded-lg border border-amber-200 shadow-sm">
                  <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="text-2xl">🤖</span> AI Damage Assessment
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between border-b border-amber-200 pb-2">
                        <span className="text-amber-800 font-medium">Damage Detected</span>
                        <span className={cn("font-bold", aiResult.damage_detected ? "text-red-600" : "text-green-600")}>
                          {aiResult.damage_detected ? "YES" : "NO"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-amber-200 pb-2">
                        <span className="text-amber-800 font-medium">Severity</span>
                        <span className="font-bold text-slate-900">{aiResult.severity?.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between border-b border-amber-200 pb-2">
                        <span className="text-amber-800 font-medium">Evidence Strength</span>
                        <span className="font-bold text-slate-900">{aiResult.evidence_strength}</span>
                      </div>
                      <div className="flex justify-between border-b border-amber-200 pb-2">
                        <span className="text-amber-800 font-medium">AI Confidence</span>
                        <span className="font-bold text-slate-900">{(aiResult.confidence * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between pt-2">
                        <span className="text-amber-800 font-medium">Claimability</span>
                        <span className={cn("font-bold px-2 py-0.5 rounded", aiResult.claimability_bool ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                          {aiResult.claimability}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white/50 p-4 rounded border border-amber-100">
                      <p className="font-semibold text-sm text-slate-700 mb-2">Analysis Reasoning:</p>
                      <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                        {aiResult.reasoning?.map((r: string, i: number) => (
                          <li key={i}>{r}</li>
                        ))}
                        <li className="font-medium text-amber-900 mt-2">
                          Conclusion: {aiResult.final_insurance_reason}
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Annotated Images */}
                  {aiResult.annotated_images && aiResult.annotated_images.length > 0 && (
                    <div className="mt-6">
                      <p className="font-semibold text-sm text-slate-700 mb-3">Visual Evidence (AI Annotated):</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {aiResult.annotated_images.map((path: string, idx: number) => (
                          <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-black">
                            {/* Construct Full URL - Assuming standard Vite proxy or CORS. If path starts with /uploads, prepend BASE */}
                            <img
                              src={`http://127.0.0.1:8000${path}`}
                              alt={`Evidence ${idx + 1}`}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-4 gap-4">
                  {/* Option to create another or go to dashboard */}
                  <Button variant="outline" onClick={() => navigate("/dashboard")}>
                    Dashboard
                  </Button>
                  <Button onClick={() => navigate(`/dashboard/claims/${claimId}`)}>
                    View Full Claim Details <ArrowRight size={16} className="ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
