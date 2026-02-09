import React, { useState } from "react";
import { Card, Button, Input } from "../components/ui/Core";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { User, Lock, Save } from "lucide-react";

export const Profile: React.FC = () => {
    const { user, login } = useAuth();
    const [name, setName] = useState(user?.name || "");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMsg("");
        try {
            const payload: any = { name };
            if (password) payload.password = password;

            const res: any = await api.auth.updateProfile(payload);
            // Update local context
            if (user) {
                login({ ...user, name: res.user.name });
            }
            setMsg("Profile updated successfully!");
            setPassword("");
        } catch (err: any) {
            setMsg(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>

            <Card className="p-8">
                <form onSubmit={handleUpdate} className="space-y-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-2xl font-bold">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">{user?.email}</h2>
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded capitalize">{user?.role}</span>
                            {user?.company && <span className="ml-2 text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">{user.company}</span>}
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    <div className="space-y-4">
                        <Input
                            label="Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            icon={<User size={16} />}
                        />

                        <Input
                            label="New Password (optional)"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Leave blank to keep current"
                            icon={<Lock size={16} />}
                        />
                    </div>

                    {msg && (
                        <div className={`text-sm p-3 rounded ${msg.includes("Error") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                            {msg}
                        </div>
                    )}

                    <Button type="submit" isLoading={loading} className="w-full flex items-center justify-center gap-2">
                        <Save size={16} />
                        Save Changes
                    </Button>
                </form>
            </Card>
        </div>
    );
};
