const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const token = () => localStorage.getItem("token");

async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token()) headers.Authorization = `Bearer ${token()}`;

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (response.status === 204) return null;

  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.detail || "Erro ao processar solicitação.");
  return body;
}

export const api = {
  login: (email, password) => request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  }),
  dashboard: () => request("/dashboard"),
  clients: (search = "") => request(`/clients${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  createClient: (data) => request("/clients", { method: "POST", body: JSON.stringify(data) }),
  updateClient: (id, data) => request(`/clients/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteClient: (id) => request(`/clients/${id}`, { method: "DELETE" }),
  services: () => request("/services"),
  appointments: (date = "", status = "") => {
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (status) params.set("status", status);
    return request(`/appointments${params.toString() ? `?${params}` : ""}`);
  },
  createAppointment: (data) => request("/appointments", { method: "POST", body: JSON.stringify(data) }),
  updateAppointment: (id, data) => request(`/appointments/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  updateStatus: (id, status) => request(`/appointments/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  }),
  deleteAppointment: (id) => request(`/appointments/${id}`, { method: "DELETE" }),
};
