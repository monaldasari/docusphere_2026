// API client for DocuSphere

export interface Document {
  id: string;
  title: string;
  emoji: string;
  excerpt: string | null;
  content: string | null;
  ownerId: string;
  updatedAt: string;
  updatedBy: string | null;
  starred: boolean;
  shared: boolean;
  inviteToken: string | null;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  streak: number;
  role: string;
  avatarUrl?: string | null;
}

export const api = {
  auth: {
    me: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) return null;
      return res.json().then((data) => data.user) as Promise<User | null>;
    },
    login: async (credentials: { email: string; password: string }) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Login failed");
      }
      return res.json();
    },
    register: async (data: { email: string; password: string; name?: string }) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Registration failed");
      }
      return res.json();
    },
    logout: async () => {
      await fetch("/api/auth/logout", { method: "POST" });
    },
    forgotPassword: async (contact: string) => {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send OTP");
      }
      return res.json();
    },
    verifyOtp: async (contact: string, otp: string) => {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact, otp }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Invalid OTP");
      }
      return res.json();
    },
    resetPassword: async (data: any) => {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to reset password");
      }
      return res.json();
    },
  },
  documents: {
    list: async () => {
      const res = await fetch("/api/documents");
      if (!res.ok) return [];
      return res.json() as Promise<Document[]>;
    },
    get: async (id: string) => {
      const res = await fetch(`/api/documents/${id}`);
      if (!res.ok) throw new Error("Document not found");
      return res.json() as Promise<Document>;
    },
    create: async (data: Partial<Document>) => {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create document");
      return res.json() as Promise<Document>;
    },
    update: async (id: string, data: Partial<Document>) => {
      const res = await fetch(`/api/documents/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update document");
      return res.json() as Promise<Document>;
    },
    delete: async (id: string) => {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete document");
      return res.json();
    },
    getByToken: async (token: string) => {
      const res = await fetch(`/api/documents/share/${token}`);
      if (!res.ok) throw new Error("Shared document not found");
      return res.json() as Promise<Document & { owner: { name: string } }>;
    },
    addCollaborator: async (id: string, email: string) => {
      const res = await fetch(`/api/documents/${id}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to add collaborator");
      }
      return res.json();
    },
  },
};
