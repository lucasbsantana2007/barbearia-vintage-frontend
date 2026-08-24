import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays, LayoutDashboard, LogOut, Plus, Scissors, Search,
  Trash2, Users, Pencil, CheckCircle2, XCircle, Inbox, TriangleAlert, DollarSign
} from "lucide-react";
import { api, token } from "./api";

const STATUS = {
  scheduled: "Agendado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

const PRICE_TABLE = [
  { key: "corte", label: "Corte", price: 80 },
  { key: "barba", label: "Barba", price: 50 },
  { key: "combo", label: "Corte + Barba", price: 120 },
];

const currency = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

function servicePrice(name = "") {
  const normalized = name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const hasCorte = normalized.includes("corte");
  const hasBarba = normalized.includes("barba");
  if (hasCorte && hasBarba) return PRICE_TABLE[2].price;
  if (hasCorte) return PRICE_TABLE[0].price;
  if (hasBarba) return PRICE_TABLE[1].price;
  return 0;
}

const todayISO = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type) => parts.find(p => p.type === type).value;
  return `${get("year")}-${get("month")}-${get("day")}`;
};

function Login({ onLogin }) {
  const [email, setEmail] = useState("barbeariavintageadm@gmail.com");
  const [password, setPassword] = useState("Insperjr2026*");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.login(email, password);
      localStorage.setItem("token", data.access_token);
      onLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return <div className="login-shell">
    <div className="login-card">
      <img className="brand-mark" src="/logo.png" alt="Barbearia Vintage" />
      <p className="eyebrow">BARBEARIA VINTAGE</p>
      <h1>Gestão simples. Atendimento impecável.</h1>
      <p className="muted">Acesso interno para organização de clientes e agendamentos.</p>
      <form onSubmit={submit} className="stack">
        <label>E-mail<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></label>
        <label>Senha<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required /></label>
        {error && <div className="alert error">{error}</div>}
        <button className="primary" disabled={loading}>{loading ? "Entrando..." : "Entrar"}</button>
      </form>
    </div>
  </div>
}

function Sidebar({ page, setPage, onLogout }) {
  const items = [
    ["dashboard", LayoutDashboard, "Dashboard"],
    ["clientes", Users, "Clientes"],
    ["agenda", CalendarDays, "Agenda"],
    ["financeiro", DollarSign, "Financeiro"],
  ];
  return <aside className="sidebar">
    <div className="brew" aria-hidden="true">
      <span className="blob b1"></span>
      <span className="blob b2"></span>
      <span className="blob b3"></span>
      <span className="blob b4"></span>
      <span className="blob b5"></span>
      <span className="blob b6"></span>
      <span className="blob b7"></span>
    </div>
    <div className="sidebar-brand"><img src="/logo.png" alt="Barbearia Vintage" /></div>
    <nav>
      {items.map(([id, Icon, label]) =>
        <button key={id} className={page===id ? "active" : ""} onClick={()=>setPage(id)}>
          <Icon size={18}/><span>{label}</span>
        </button>
      )}
    </nav>
    <button className="logout" onClick={onLogout}><LogOut size={18}/><span>Sair</span></button>
  </aside>
}

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    if (typeof value !== "number") return;
    const from = prevRef.current;
    const to = value;
    const start = performance.now();
    const duration = 600;
    let raf;
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else prevRef.current = to;
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return typeof value === "number" ? display : (value ?? "—");
}

function StatCard({ label, value, detail, icon: Icon }) {
  return <div className="stat-card">
    <div className="stat-head"><span>{label}</span>{Icon && <Icon size={17}/>}</div>
    <strong><AnimatedNumber value={value}/></strong>
    {detail && <small>{detail}</small>}
  </div>
}

function Dashboard({ goAgenda }) {
  const [data, setData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.dashboard(), api.appointments(todayISO())])
      .then(([d, a]) => { setData(d); setAppointments(a); })
      .catch(e => setError(e.message));
  }, []);

  return <div className="page-fade">
    <Header title="Dashboard" subtitle="Visão rápida da operação de hoje." action={<button className="primary inline" onClick={goAgenda}><Plus size={18}/>Novo agendamento</button>} />
    {error && <div className="alert error">{error}</div>}
    <div className="stats-grid">
      <StatCard label="Agendamentos hoje" value={data?.appointments_today} icon={CalendarDays}/>
      <StatCard label="Concluídos" value={data?.completed_today} icon={CheckCircle2}/>
      <StatCard label="Cancelados" value={data?.cancelled_today} icon={XCircle}/>
      <StatCard label="Mais procurado" value={data?.most_popular_service || "—"} detail={`${data?.appointments_this_week ?? 0} atendimentos na semana`} icon={Scissors}/>
    </div>
    <section className="panel">
      <div className="section-title"><div><h2>Próximos atendimentos</h2><p>Agenda do dia</p></div></div>
      <AppointmentTable appointments={appointments} compact />
    </section>
  </div>;
}

function Header({ title, subtitle, action }) {
  return <header className="page-header"><div><p className="eyebrow">BARBEARIA VINTAGE</p><h1>{title}</h1><p className="muted">{subtitle}</p></div>{action}</header>
}

function ClientModal({ initial, onClose, onSaved }) {
  const [form, setForm] = useState(initial || {name:"", email:"", notes:""});
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    try {
      if (initial) await api.updateClient(initial.id, form);
      else await api.createClient(form);
      onSaved();
    } catch(e) { setError(e.message); }
  }

  return <Modal title={initial ? "Editar cliente" : "Novo cliente"} onClose={onClose}>
    <form className="stack" onSubmit={submit}>
      <label>Nome<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required minLength={2}/></label>
      <label>E-mail<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/></label>
      <label>Observações<textarea rows="4" value={form.notes || ""} onChange={e=>setForm({...form,notes:e.target.value})}/></label>
      {error && <div className="alert error">{error}</div>}
      <div className="actions"><button type="button" className="ghost" onClick={onClose}>Cancelar</button><button className="primary">Salvar</button></div>
    </form>
  </Modal>
}

function Clients() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    try { setClients(await api.clients(search)); } catch(e) { setError(e.message); }
  };
  useEffect(() => { load(); }, [search]);

  async function remove(id) {
    if (!confirm("Remover este cliente?")) return;
    try { await api.deleteClient(id); load(); } catch(e) { setError(e.message); }
  }

  return <div className="page-fade">
    <Header title="Clientes" subtitle="Cadastro centralizado da sua base." action={<button className="primary inline" onClick={()=>setModal({type:"new"})}><Plus size={18}/>Novo cliente</button>}/>
    <div className="toolbar">
      <div className="search"><Search size={18}/><input placeholder="Pesquisar cliente..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
    </div>
    {error && <div className="alert error">{error}</div>}
    <section className="panel">
      <div className="section-title">
        <div><h2>Todos os clientes</h2><p>Base cadastrada na barbearia.</p></div>
        <span className="count-pill">{clients.length} {clients.length === 1 ? "cliente" : "clientes"}</span>
      </div>
      <div className="client-list">
        {clients.map((c,i) => <div className="client-row" key={c.id} style={{"--i": Math.min(i,10)}}>
          <div><strong>{c.name}</strong><span>{c.email}</span>{c.notes && <small>{c.notes}</small>}</div>
          <div className="row-actions">
            <button className="icon-btn" title="Editar" onClick={()=>setModal({type:"edit", client:c})}><Pencil size={17}/></button>
            <button className="icon-btn danger" title="Excluir" onClick={()=>remove(c.id)}><Trash2 size={17}/></button>
          </div>
        </div>)}
        {!clients.length && <Empty text="Nenhum cliente encontrado."/>}
      </div>
    </section>
    {modal && <ClientModal initial={modal.client} onClose={()=>setModal(null)} onSaved={()=>{setModal(null); load();}}/>}
  </div>;
}

function AppointmentModal({ initial, onClose, onSaved }) {
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [form, setForm] = useState(initial ? {
    client_id: initial.client_id, service_id: initial.service_id, date: initial.date,
    start_time: initial.start_time.slice(0,5), status: initial.status
  } : {client_id:"", service_id:"", date:todayISO(), start_time:"09:00", status:"scheduled"});
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(()=>{ Promise.all([api.clients(), api.services()]).then(([c,s])=>{setClients(c); setServices(s);}); },[]);

  function save(payload) {
    return initial ? api.updateAppointment(initial.id, payload) : api.createAppointment(payload);
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    const payload = {...form, client_id:Number(form.client_id), service_id:Number(form.service_id), start_time:`${form.start_time}:00`};
    try {
      await save(payload);
      onSaved();
    } catch(e) {
      if (e.status === 409) {
        const dayAppointments = await api.appointments(payload.date).catch(()=>[]);
        const taken = dayAppointments.find(a => a.start_time === payload.start_time && a.status !== "cancelled" && a.id !== initial?.id);
        setConflict({ payload, appointment: taken });
      } else {
        setError(e.message);
      }
    }
  }

  async function replaceConflict() {
    setSaving(true);
    try {
      if (conflict.appointment) await api.deleteAppointment(conflict.appointment.id);
      await save(conflict.payload);
      onSaved();
    } catch(e) {
      setConflict(null);
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return <Modal title={initial ? "Editar agendamento" : "Novo agendamento"} onClose={onClose}>
    <form className="stack" onSubmit={submit}>
      <label>Cliente<select value={form.client_id} onChange={e=>setForm({...form,client_id:e.target.value})} required>
        <option value="">Selecione...</option>{clients.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}
      </select></label>
      <label>Serviço<select value={form.service_id} onChange={e=>setForm({...form,service_id:e.target.value})} required>
        <option value="">Selecione...</option>{services.map(s=><option value={s.id} key={s.id}>{s.name} · {s.duration_minutes} min</option>)}
      </select></label>
      <div className="two-col">
        <label>Data<input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} required/></label>
        <label>Horário<input type="time" value={form.start_time} onChange={e=>setForm({...form,start_time:e.target.value})} required/></label>
      </div>
      <label>Status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
        {Object.entries(STATUS).map(([v,l])=><option value={v} key={v}>{l}</option>)}
      </select></label>
      {error && <div className="alert error">{error}</div>}
      <div className="actions"><button type="button" className="ghost" onClick={onClose}>Cancelar</button><button className="primary">Salvar agendamento</button></div>
    </form>
    {conflict && <ConflictDialog
      appointment={conflict.appointment}
      saving={saving}
      onCancel={()=>setConflict(null)}
      onReplace={replaceConflict}
    />}
  </Modal>
}

function ConflictDialog({ appointment, saving, onCancel, onReplace }) {
  return <div className="modal-backdrop conflict-backdrop">
    <div className="modal conflict-modal">
      <div className="conflict-icon"><TriangleAlert size={22}/></div>
      <h2>Horário já ocupado</h2>
      <p className="muted">
        {appointment
          ? <>Este horário já possui um agendamento de <strong>{appointment.client?.name}</strong> ({appointment.service?.name}). Deseja substituir?</>
          : "Este horário já possui um agendamento. Deseja substituir?"}
      </p>
      <div className="actions">
        <button type="button" className="ghost" onClick={onCancel} disabled={saving}>Voltar</button>
        <button type="button" className="primary" onClick={onReplace} disabled={saving}>{saving ? "Substituindo..." : "Substituir"}</button>
      </div>
    </div>
  </div>;
}

function AppointmentTable({ appointments, onEdit, onDelete, onStatus, compact=false }) {
  if (!appointments.length) return <Empty text="Nenhum agendamento para este período." />;
  return <div className="table-wrap"><table className="appt-table">
    <thead><tr><th>Horário</th><th>Cliente</th><th>Serviço</th><th>Status</th>{!compact && <th></th>}</tr></thead>
    <tbody>{appointments.map((a,i)=><tr key={a.id} style={{"--i": Math.min(i,10)}}>
      <td className="time-cell">{a.start_time.slice(0,5)}</td>
      <td><strong>{a.client.name}</strong><small>{a.client.email}</small></td>
      <td>{a.service.name}</td>
      <td>{compact ? <StatusBadge status={a.status}/> :
        <select className={`status-select ${a.status}`} value={a.status} onChange={e=>onStatus(a.id,e.target.value)}>
          {Object.entries(STATUS).map(([v,l])=><option key={v} value={v}>{l}</option>)}
        </select>}</td>
      {!compact && <td className="row-actions">
        <button className="icon-btn" onClick={()=>onEdit(a)}><Pencil size={16}/></button>
        <button className="icon-btn danger" onClick={()=>onDelete(a.id)}><Trash2 size={16}/></button>
      </td>}
    </tr>)}</tbody>
  </table></div>;
}

function StatusBadge({status}) { return <span className={`badge ${status}`}>{STATUS[status]}</span>; }

function Agenda() {
  const [status, setStatus] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [modal, setModal] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    try { setAppointments(await api.appointments("", status)); setError(""); }
    catch(e){ setError(e.message); }
  };
  useEffect(()=>{ load(); },[status]);

  const groupedAppointments = useMemo(() => {
    return appointments.reduce((groups, appointment) => {
      if (!groups[appointment.date]) groups[appointment.date] = [];
      groups[appointment.date].push(appointment);
      return groups;
    }, {});
  }, [appointments]);

  const dates = Object.keys(groupedAppointments).sort();

  const formatDayHeading = (dateString) => {
    const [year, month, day] = dateString.split("-").map(Number);
    const value = new Date(year, month - 1, day);
    const label = value.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const today = todayISO();
    if (dateString === today) return `Hoje · ${label}`;
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  async function remove(id) {
    if (!confirm("Remover este agendamento?")) return;
    try { await api.deleteAppointment(id); load(); } catch(e){setError(e.message);}
  }
  async function changeStatus(id, newStatus) {
    try { await api.updateStatus(id,newStatus); load(); } catch(e){setError(e.message);}
  }

  return <div className="page-fade">
    <Header title="Agenda" subtitle="Role a página para visualizar os agendamentos de todos os dias." action={<button className="primary inline" onClick={()=>setModal({type:"new"})}><Plus size={18}/>Novo agendamento</button>}/>
    <div className="toolbar agenda-toolbar">
      <div className="agenda-hint"><CalendarDays size={18}/><span>Todos os dias aparecem em sequência, organizados por data e horário.</span></div>
      <label className="filter">Status<select value={status} onChange={e=>setStatus(e.target.value)}>
        <option value="">Todos</option>{Object.entries(STATUS).map(([v,l])=><option key={v} value={v}>{l}</option>)}
      </select></label>
    </div>
    {error && <div className="alert error">{error}</div>}

    <div className="agenda-scroll-list">
      {dates.map((date,i) => <section className="day-group" key={date} style={{"--i": Math.min(i,10)}}>
        <div className="day-heading">
          <div><span className="day-dot"></span><h2>{formatDayHeading(date)}</h2></div>
          <span>{groupedAppointments[date].length} {groupedAppointments[date].length === 1 ? "agendamento" : "agendamentos"}</span>
        </div>
        <div className="panel day-panel">
          <AppointmentTable
            appointments={groupedAppointments[date]}
            onEdit={a=>setModal({type:"edit", appointment:a})}
            onDelete={remove}
            onStatus={changeStatus}
          />
        </div>
      </section>)}
      {!dates.length && <section className="panel"><Empty text="Nenhum agendamento encontrado."/></section>}
    </div>

    {modal && <AppointmentModal initial={modal.appointment} onClose={()=>setModal(null)} onSaved={()=>{setModal(null);load();}}/>}
  </div>;
}

function Financeiro() {
  const [appointments, setAppointments] = useState(null);
  const [scheduled, setScheduled] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.appointments("", "completed").then(setAppointments).catch(e => setError(e.message));
    api.appointments("", "scheduled").then(setScheduled).catch(e => setError(e.message));
  }, []);

  const currentMonth = todayISO().slice(0, 7);
  const monthlyAppointments = useMemo(
    () => (appointments || []).filter(a => a.date.startsWith(currentMonth)),
    [appointments, currentMonth]
  );

  const breakdown = useMemo(() => {
    const byService = new Map();
    for (const a of monthlyAppointments) {
      const name = a.service.name;
      const entry = byService.get(name) || { name, count: 0, total: 0 };
      entry.count += 1;
      entry.total += servicePrice(name);
      byService.set(name, entry);
    }
    return [...byService.values()].sort((x, y) => y.total - x.total);
  }, [monthlyAppointments]);

  const totalRevenue = breakdown.reduce((sum, s) => sum + s.total, 0);
  const totalCompleted = breakdown.reduce((sum, s) => sum + s.count, 0);
  const pendingCount = (scheduled || []).length;
  const pendingRevenue = (scheduled || []).reduce((sum, a) => sum + servicePrice(a.service.name), 0);

  return <div className="page-fade">
    <Header title="Financeiro" subtitle="Preços praticados e faturamento do mês atual." />
    {error && <div className="alert error">{error}</div>}

    <section className="panel">
      <div className="section-title"><div><h2>Tabela de preços</h2><p>Valores cobrados por serviço.</p></div></div>
      <div className="table-wrap"><table>
        <thead><tr><th>Serviço</th><th>Valor</th></tr></thead>
        <tbody>{PRICE_TABLE.map((s, i) => <tr key={s.key} style={{"--i": i}}>
          <td><strong>{s.label}</strong></td>
          <td>{currency(s.price)}</td>
        </tr>)}</tbody>
      </table></div>
    </section>

    <div className="stats-grid compact">
      <StatCard label="Faturamento mensal" value={currency(totalRevenue)} detail={`${totalCompleted} ${totalCompleted === 1 ? "atendimento" : "atendimentos"} neste mês`} icon={DollarSign}/>
      <StatCard label="A receber" value={currency(pendingRevenue)} detail={`${pendingCount} ${pendingCount === 1 ? "agendamento" : "agendamentos"}`} icon={CalendarDays}/>
    </div>

    <section className="panel">
      <div className="section-title"><div><h2>Faturamento por serviço</h2><p>Agendamentos concluídos neste mês.</p></div></div>
      {appointments === null ? null : breakdown.length
        ? <div className="table-wrap"><table>
            <thead><tr><th>Serviço</th><th>Atendimentos</th><th>Subtotal</th></tr></thead>
            <tbody>{breakdown.map((s, i) => <tr key={s.name} style={{"--i": i}}>
              <td><strong>{s.name}</strong></td>
              <td>{s.count}</td>
              <td>{currency(s.total)}</td>
            </tr>)}</tbody>
          </table></div>
        : <Empty text="Nenhum agendamento concluído neste mês ainda."/>}
    </section>
  </div>;
}

function Modal({title,onClose,children}) {
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div className="modal"><div className="modal-head"><h2>{title}</h2><button className="close" onClick={onClose}>×</button></div>{children}</div>
  </div>;
}

function Empty({text}) { return <div className="empty"><Inbox size={26}/><p>{text}</p></div>; }

export default function App() {
  const [authenticated, setAuthenticated] = useState(Boolean(token()));
  const [page, setPage] = useState("dashboard");

  if (!authenticated) return <Login onLogin={()=>setAuthenticated(true)} />;

  const logout = () => { localStorage.removeItem("token"); setAuthenticated(false); };

  return <div className="app-shell">
    <Sidebar page={page} setPage={setPage} onLogout={logout}/>
    <main className="content">
      {page==="dashboard" && <Dashboard goAgenda={()=>setPage("agenda")}/>}
      {page==="agenda" && <Agenda/>}
      {page==="clientes" && <Clients/>}
      {page==="financeiro" && <Financeiro/>}
    </main>
  </div>;
}
