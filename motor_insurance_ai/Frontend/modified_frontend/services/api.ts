import { Claim, ClaimStatus, User } from "../types";

const API_BASE = (import.meta as any).env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const text = await response.text();
        let message = text;
        try {
            const json = JSON.parse(text);
            if (json.detail) message = json.detail;
        } catch (e) {
            // ignore
        }
        throw new Error(message || `HTTP Error ${response.status}`);
    }
    return response.json();
}

function getHeaders() {
    // We will store token in localStorage for now
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
}

export const api = {
    auth: {
        login: async (email: string, password: string, role?: string) => {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, role }),
            });
            const data = await handleResponse<any>(res);
            // Store token
            localStorage.setItem("token", data.access_token);
            return data;
        },

        signup: async (data: any) => {
            const res = await fetch(`${API_BASE}/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const result = await handleResponse<any>(res);
            // Store token
            localStorage.setItem("token", result.access_token);
            return result;
        },

        logout: () => {
            localStorage.removeItem("token");
        },

        updateProfile: async (data: any) => {
            const res = await fetch(`${API_BASE}/auth/me`, {
                method: "PUT",
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            return handleResponse(res);
        },
    },

    claims: {
        list: async (company?: string) => {
            const url = company
                ? `${API_BASE}/claims?company=${encodeURIComponent(company)}`
                : `${API_BASE}/claims`;
            const res = await fetch(url, { headers: getHeaders() });
            return handleResponse(res);
        },

        get: async (id: string) => {
            const res = await fetch(`${API_BASE}/claims/${id}`, { headers: getHeaders() });
            return handleResponse(res);
        },

        create: async (data: any) => {
            const res = await fetch(`${API_BASE}/claims`, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            return handleResponse(res);
        },

        upload: async (file: File) => {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch(`${API_BASE}/claims/upload`, {
                method: "POST",
                headers: { "Authorization": getHeaders()["Authorization"] }, // No Content-Type for FormData
                body: formData,
            });

            return handleResponse(res);
        },

        process: async (formData: FormData) => {
            const res = await fetch(`${API_BASE}/claim/process`, {
                method: "POST",
                headers: { "Authorization": getHeaders()["Authorization"] }, // No Content-Type for FormData
                body: formData,
            });
            return handleResponse(res);
        },

        delete: async (id: string) => {
            const res = await fetch(`${API_BASE}/claims/${id}`, {
                method: "DELETE",
                headers: getHeaders(),
            });
            return handleResponse(res);
        },
    },

    ai: {
        predictSurvey: async (surveyData: any) => {
            const res = await fetch(`${API_BASE}/survey`, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify(surveyData),
            });
            return handleResponse(res);
        },

        predictDamage: async (files: File[]) => {
            const formData = new FormData();
            files.forEach(f => formData.append("files", f));

            const res = await fetch(`${API_BASE}/image/analyze`, {
                method: "POST",
                headers: { "Authorization": getHeaders()["Authorization"] },
                body: formData,
            });
            return handleResponse(res);
        },

        getDecision: async (surveyResult: any, imageResult: any) => {
            const res = await fetch(`${API_BASE}/decision`, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({
                    survey: surveyResult,
                    image: imageResult,
                }),
            });
            return handleResponse(res);
        },

        explain: async (payload: any) => {
            const res = await fetch(`${API_BASE}/explanation`, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify(payload),
            });
            return handleResponse(res);
        },

        ragQuery: async (query: string) => {
            const res = await fetch(`${API_BASE}/rag/query`, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({ query }),
            });
            return handleResponse(res);
        },
    },

    analytics: {
        getRanking: async () => {
            const res = await fetch(`${API_BASE}/analytics/ranking`, { headers: getHeaders() });
            return handleResponse<any[]>(res);
        },
        getSimilarity: async () => {
            const res = await fetch(`${API_BASE}/analytics/similarity`, { headers: getHeaders() });
            return handleResponse<any[]>(res);
        },
        getDistribution: async () => {
            const res = await fetch(`${API_BASE}/analytics/distribution`, { headers: getHeaders() });
            return handleResponse<any>(res);
        },
        getCategories: async () => {
            const res = await fetch(`${API_BASE}/analytics/categories`, { headers: getHeaders() });
            return handleResponse<any>(res);
        },
        getInsurers: async () => {
            const res = await fetch(`${API_BASE}/analytics/insurers`, { headers: getHeaders() });
            return handleResponse<string[]>(res);
        },
    },
};
