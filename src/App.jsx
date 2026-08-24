import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays, LayoutDashboard, LogOut, Plus, Search,
  Trash2, Users, Pencil, CheckCircle2, XCircle, Inbox, TriangleAlert, DollarSign,
  TrendingDown, TrendingUp, ChevronDown, Lock
} from "lucide-react";
import { api, token } from "./api";

const STATUS = {
  scheduled: "Agendado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

const BUSINESS_START_MINUTES = 8 * 60;
const BUSINESS_END_MINUTES = 19 * 60;
const SLOT_STEP_MINUTES = 30;

const DAY_SLOTS = (() => {
  const slots = [];
  for (let m = BUSINESS_START_MINUTES; m < BUSINESS_END_MINUTES; m += SLOT_STEP_MINUTES) {
    slots.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return slots;
})();

const timeToMinutes = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
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

const EXPENSE_CATEGORIES = ["Insumos", "Funcionários", "Aluguel do espaço", "Impostos", "Manutenção", "Outros"];

function formatMonthLabel(monthStr) {
  const [year, month] = monthStr.split("-").map(Number);
  const label = new Date(year, month - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const MONTH_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
function formatMonthShort(monthStr) {
  const [year, month] = monthStr.split("-").map(Number);
  return `${MONTH_SHORT[month - 1]} ${year}`;
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

const parseISODate = (dateStr) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
};
const toISODate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

function formatDayShort(dateStr) {
  const [, month, day] = dateStr.split("-").map(Number);
  return `${day} ${MONTH_SHORT[month - 1]}`;
}

const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
function weekdayShort(dateStr) {
  return WEEKDAY_SHORT[parseISODate(dateStr).getDay()];
}

function currentWeekRange() {
  const today = parseISODate(todayISO());
  const isoWeekday = (today.getDay() + 6) % 7; // Monday = 0 ... Sunday = 6
  const start = new Date(today);
  start.setDate(today.getDate() - isoWeekday);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: toISODate(start), end: toISODate(end) };
}

function lastNDaysISO(n) {
  const today = parseISODate(todayISO());
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(toISODate(d));
  }
  return days;
}

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
    <div className="brew" aria-hidden="true">
      <span className="blob b1"></span>
      <span className="blob b2"></span>
      <span className="blob b3"></span>
      <span className="blob b4"></span>
      <span className="blob b5"></span>
      <span className="blob b6"></span>
      <span className="blob b7"></span>
    </div>
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

function ServicePopularityChart({ data }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const max = Math.max(1, ...data.map(d => d.count));

  return <div className="chart-bars">
    {data.map((d, i) => <div className="chart-bar-row" key={d.name} style={{"--i": i}}>
      <span className="chart-bar-label">{d.name}</span>
      <div className="chart-bar-track">
        <div className="chart-bar-fill" style={{ width: mounted ? `${(d.count / max) * 100}%` : "0%" }}/>
      </div>
      <span className="chart-bar-value">{d.count}</span>
    </div>)}
  </div>;
}

const axisCurrency = (value) => `R$ ${Math.round(value).toLocaleString("pt-BR")}`;

function RevenueTrendChart({ data }) {
  const [hover, setHover] = useState(null);

  const width = 600, height = 170;
  const padLeft = 50, padRight = 10, padTop = 16, padBottom = 26;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;
  const colWidth = chartW / data.length;
  const max = Math.max(1, ...data.map(d => d.total));

  const points = data.map((d, i) => ({
    ...d,
    x: padLeft + colWidth * i + colWidth / 2,
    y: padTop + chartH - (d.total / max) * chartH,
  }));

  const yTicks = [0, max / 2, max].map(value => ({
    value,
    y: padTop + chartH - (value / max) * chartH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(padTop + chartH).toFixed(1)} `
    + `L ${points[0].x.toFixed(1)} ${(padTop + chartH).toFixed(1)} Z`;

  return <div className="chart-line-wrap">
    <svg viewBox={`0 0 ${width} ${height}`} className="chart-line-svg" preserveAspectRatio="none" role="img" aria-label="Faturamento dos últimos 7 dias">
      <defs>
        <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22"/>
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {yTicks.map(t => <g key={t.value}>
        <line x1={padLeft} y1={t.y} x2={width - padRight} y2={t.y} className={t.value === 0 ? "chart-axis-line" : "chart-grid-line"}/>
        <text x={padLeft - 8} y={t.y} textAnchor="end" dominantBaseline="middle" className="chart-axis-label">{axisCurrency(t.value)}</text>
      </g>)}
      <path d={areaPath} className="chart-area-fill"/>
      <path d={linePath} className="chart-line-path"/>
      <g onMouseLeave={()=>setHover(null)}>
        {points.map((p, i) => <g key={p.date}>
          <rect x={padLeft + colWidth * i} y={0} width={colWidth} height={height} fill="transparent" onMouseEnter={()=>setHover(i)}/>
          {hover === i && <line x1={p.x} y1={padTop} x2={p.x} y2={padTop + chartH} className="chart-crosshair"/>}
          <circle cx={p.x} cy={p.y} r={hover === i ? 5 : 3} className={`chart-dot ${hover === i ? "active" : ""}`}/>
          <text x={p.x} y={height - 8} textAnchor="middle" className="chart-axis-label">{weekdayShort(p.date)}</text>
        </g>)}
      </g>
    </svg>
    {hover !== null && <div className="chart-tooltip" style={{ left: `${(points[hover].x / width) * 100}%` }}>
      <strong>{currency(points[hover].total)}</strong>
      <span>{formatDayShort(points[hover].date)}</span>
    </div>}
  </div>;
}

function Dashboard({ goAgenda }) {
  const [data, setData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [allAppointments, setAllAppointments] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.dashboard(), api.appointments(todayISO()), api.appointments()])
      .then(([d, a, all]) => { setData(d); setAppointments(a); setAllAppointments(all); })
      .catch(e => setError(e.message));
  }, []);

  const weekPopularity = useMemo(() => {
    const { start, end } = currentWeekRange();
    const counts = new Map(PRICE_TABLE.map(s => [s.label, 0]));
    for (const a of allAppointments || []) {
      if (a.status === "cancelled") continue;
      if (a.date < start || a.date > end) continue;
      const name = a.service.name;
      counts.set(name, (counts.get(name) || 0) + 1);
    }
    return [...counts.entries()].map(([name, count]) => ({ name, count })).sort((x, y) => y.count - x.count);
  }, [allAppointments]);

  const revenueLast7Days = useMemo(() => {
    const days = lastNDaysISO(7);
    const totals = new Map(days.map(d => [d, 0]));
    for (const a of allAppointments || []) {
      if (a.status !== "completed" || !totals.has(a.date)) continue;
      totals.set(a.date, totals.get(a.date) + servicePrice(a.service.name));
    }
    return days.map(date => ({ date, total: totals.get(date) }));
  }, [allAppointments]);

  const totalRevenue7d = revenueLast7Days.reduce((sum, d) => sum + d.total, 0);
  const hasWeekPopularity = weekPopularity.some(s => s.count > 0);

  return <div className="page-fade">
    <Header title="Dashboard" subtitle="Visão rápida da operação de hoje." action={<button className="primary inline" onClick={goAgenda}><Plus size={18}/>Novo agendamento</button>} />
    {error && <div className="alert error">{error}</div>}
    <div className="stats-grid">
      <StatCard label="Agendamentos hoje" value={data?.appointments_today} icon={CalendarDays}/>
      <StatCard label="Concluídos" value={data?.completed_today} icon={CheckCircle2}/>
      <StatCard label="Cancelados" value={data?.cancelled_today} icon={XCircle}/>
      <StatCard label="Não compareceu" value={data?.no_show_today} icon={TriangleAlert}/>
    </div>
    <section className="panel">
      <div className="section-title"><div><h2>Agenda</h2><p>Próximos atendimentos</p></div></div>
      <AppointmentTable appointments={appointments} compact />
    </section>
    <div className="dashboard-charts">
      <section className="panel chart-panel">
        <div className="section-title"><div><h2>Demanda de serviços</h2><p>Agendamentos desta semana, por serviço.</p></div></div>
        {allAppointments === null ? null : hasWeekPopularity
          ? <ServicePopularityChart data={weekPopularity}/>
          : <Empty text="Nenhum agendamento registrado nesta semana."/>}
      </section>
      <section className="panel chart-panel">
        <div className="section-title"><div><h2>Faturamento — últimos 7 dias</h2><p>Total de {currency(totalRevenue7d)} em agendamentos concluídos.</p></div></div>
        {allAppointments === null ? null : <RevenueTrendChart data={revenueLast7Days}/>}
      </section>
    </div>
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
      <label>Observações<textarea rows="4" placeholder="(+55 [DDD] 9XXXX-XXXX)" value={form.notes || ""} onChange={e=>setForm({...form,notes:e.target.value})}/></label>
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

function DaySchedule({ dayAppointments, excludeId, selected, onSelect }) {
  const occupied = (dayAppointments || [])
    .filter(a => a.status !== "cancelled" && a.id !== excludeId)
    .map(a => {
      const start = timeToMinutes(a.start_time.slice(0, 5));
      return { start, end: start + (a.service?.duration_minutes || SLOT_STEP_MINUTES), client: a.client?.name, service: a.service?.name };
    });

  return <div className="day-schedule">
    <div className="day-schedule-legend">
      <span><i className="day-dot-legend free"></i>Livre</span>
      <span><i className="day-dot-legend busy"></i>Ocupado</span>
    </div>
    <div className="day-schedule-grid">
      {DAY_SLOTS.map(slot => {
        const slotStart = timeToMinutes(slot);
        const slotEnd = slotStart + SLOT_STEP_MINUTES;
        const conflict = occupied.find(o => slotStart < o.end && o.start < slotEnd);
        const isSelected = slot === selected;
        return <button
          type="button"
          key={slot}
          disabled={!!conflict}
          className={`day-slot ${conflict ? "busy" : "free"} ${isSelected ? "selected" : ""}`}
          title={conflict ? `Ocupado — ${conflict.client} (${conflict.service})` : "Horário disponível"}
          onClick={()=>onSelect(slot)}
        >{slot}</button>;
      })}
    </div>
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
  const [scheduleAppointments, setScheduleAppointments] = useState([]);

  useEffect(()=>{ Promise.all([api.clients(), api.services()]).then(([c,s])=>{setClients(c); setServices(s);}); },[]);

  useEffect(() => {
    if (!form.date) { setScheduleAppointments([]); return; }
    api.appointments(form.date).then(setScheduleAppointments).catch(()=>setScheduleAppointments([]));
  }, [form.date]);

  function save(payload) {
    return initial ? api.updateAppointment(initial.id, payload) : api.createAppointment(payload);
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!form.start_time) { setError("Selecione um horário disponível na agenda do dia."); return; }
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
      <label>Data<input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value, start_time:""})} required/></label>
      <label>Horário
        <DaySchedule
          dayAppointments={scheduleAppointments}
          excludeId={initial?.id}
          selected={form.start_time}
          onSelect={(slot)=>setForm({...form,start_time:slot})}
        />
      </label>
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
  const [showPast, setShowPast] = useState(false);
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
  const today = todayISO();
  const pastDates = dates.filter(d => d < today);
  const upcomingDates = dates.filter(d => d >= today);

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

  const renderDayGroup = (date, i) => <section className={`day-group ${date === today ? "today" : ""}`} key={date} style={{"--i": Math.min(i,10)}}>
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
  </section>;

  return <div className="page-fade">
    <Header title="Agenda" subtitle="Acompanhe hoje e os próximos atendimentos agendados." action={<button className="primary inline" onClick={()=>setModal({type:"new"})}><Plus size={18}/>Novo agendamento</button>}/>
    <div className="toolbar agenda-toolbar">
      <div className="agenda-hint"><CalendarDays size={18}/><span>Precisa consultar o histórico? Os dias anteriores ficam a um clique.</span></div>
      <label className="filter">Status<select value={status} onChange={e=>setStatus(e.target.value)}>
        <option value="">Todos</option>{Object.entries(STATUS).map(([v,l])=><option key={v} value={v}>{l}</option>)}
      </select></label>
    </div>
    {error && <div className="alert error">{error}</div>}

    <div className="agenda-scroll-list">
      {pastDates.length > 0 &&
        <button type="button" className="agenda-past-toggle" onClick={()=>setShowPast(s=>!s)}>
          <ChevronDown size={16} className={showPast ? "rotated" : ""}/>
          {showPast ? "Ocultar dias anteriores" : `Ver dias anteriores (${pastDates.length})`}
        </button>
      }
      {showPast && pastDates.map(renderDayGroup)}
      {upcomingDates.map(renderDayGroup)}
      {dates.length > 0 && !upcomingDates.length &&
        <section className="panel"><Empty text="Nenhum agendamento a partir de hoje."/></section>
      }
      {!dates.length && <section className="panel"><Empty text="Nenhum agendamento encontrado."/></section>}
    </div>

    {modal && <AppointmentModal initial={modal.appointment} onClose={()=>setModal(null)} onSaved={()=>{setModal(null);load();}}/>}
  </div>;
}

function ExpenseModal({ initial, onClose, onSaved }) {
  const [form, setForm] = useState(initial
    ? { category: initial.category, amount: String(initial.amount), month: initial.month }
    : { category: "", amount: "", month: todayISO().slice(0, 7) });
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    const amount = Number(form.amount);
    if (!form.category.trim()) { setError("Informe uma categoria."); return; }
    if (!(amount > 0)) { setError("Informe um valor válido."); return; }
    const payload = { category: form.category.trim(), amount, month: form.month };
    try {
      if (initial) await api.updateExpense(initial.id, payload);
      else await api.createExpense(payload);
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  }

  return <Modal title={initial ? "Editar despesa" : "Nova despesa"} onClose={onClose}>
    <form className="stack" onSubmit={submit}>
      <label>Categoria
        <input list="expense-categories" value={form.category} onChange={e=>setForm({...form,category:e.target.value})} placeholder="Ex.: Insumos" required/>
        <datalist id="expense-categories">
          {EXPENSE_CATEGORIES.map(c => <option value={c} key={c}/>)}
        </datalist>
      </label>
      <div className="two-col">
        <label>Valor<input type="number" min="0" step="0.01" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} required/></label>
        <label>Mês<input type="month" value={form.month} onChange={e=>setForm({...form,month:e.target.value})} required/></label>
      </div>
      {error && <div className="alert error">{error}</div>}
      <div className="actions"><button type="button" className="ghost" onClick={onClose}>Cancelar</button><button className="primary">Salvar despesa</button></div>
    </form>
  </Modal>
}

function MonthPicker({ months, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return <div className="month-picker" ref={ref}>
    <button type="button" className="month-picker-trigger" onClick={()=>setOpen(o=>!o)}>
      <CalendarDays size={16}/>
      <span>{formatMonthLabel(value)}</span>
      <ChevronDown size={16} className={open ? "rotated" : ""}/>
    </button>
    {open && <div className="month-picker-menu">
      {months.map(m =>
        <button type="button" key={m} className={`month-picker-option ${m === value ? "active" : ""}`}
          onClick={()=>{ onChange(m); setOpen(false); }}>
          {formatMonthLabel(m)}
        </button>
      )}
    </div>}
  </div>;
}

function FinanceiroLock({ onUnlock }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.unlockFinance(password);
      onUnlock();
    } catch (err) {
      setError(err.status === 401 ? "Chave de acesso incorreta." : err.message);
    } finally {
      setLoading(false);
    }
  }

  return <div className="page-fade">
    <Header title="Financeiro" subtitle="Área restrita. Informe a chave de acesso para continuar." />
    <div className="lock-shell">
      <div className="lock-card">
        <div className="conflict-icon"><Lock size={22}/></div>
        <h2>Acesso restrito</h2>
        <p className="muted">Esta área contém informações sensíveis de faturamento e despesas da barbearia.</p>
        <form className="stack" onSubmit={submit}>
          <label>Chave de acesso
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoFocus required/>
          </label>
          {error && <div className="alert error">{error}</div>}
          <button className="primary" disabled={loading}>{loading ? "Verificando..." : "Entrar"}</button>
        </form>
      </div>
    </div>
  </div>;
}

function Financeiro() {
  const currentMonth = todayISO().slice(0, 7);
  const [appointments, setAppointments] = useState(null);
  const [scheduled, setScheduled] = useState(null);
  const [expenses, setExpenses] = useState(null);
  const [modal, setModal] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [error, setError] = useState("");

  const loadExpenses = () => api.expenses()
    .then(list => setExpenses(list.map(e => ({ ...e, amount: Number(e.amount) }))))
    .catch(e => setError(e.message));

  useEffect(() => {
    api.appointments("", "completed").then(setAppointments).catch(e => setError(e.message));
    api.appointments("", "scheduled").then(setScheduled).catch(e => setError(e.message));
    loadExpenses();
  }, []);

  const availableMonths = useMemo(() => {
    const months = new Set([currentMonth]);
    for (const a of appointments || []) months.add(a.date.slice(0, 7));
    for (const a of scheduled || []) months.add(a.date.slice(0, 7));
    for (const e of expenses || []) months.add(e.month);
    const dataEarliest = [...months].sort()[0];

    const [curYear, curMonthNum] = currentMonth.split("-").map(Number);
    let fallbackYear = curYear, fallbackMonthNum = curMonthNum - 11;
    while (fallbackMonthNum <= 0) { fallbackMonthNum += 12; fallbackYear -= 1; }
    const fallbackEarliest = `${fallbackYear}-${String(fallbackMonthNum).padStart(2, "0")}`;
    const earliest = dataEarliest < fallbackEarliest ? dataEarliest : fallbackEarliest;

    const full = [];
    let [year, month] = earliest.split("-").map(Number);
    while (year < curYear || (year === curYear && month <= curMonthNum)) {
      full.push(`${year}-${String(month).padStart(2, "0")}`);
      month += 1;
      if (month > 12) { month = 1; year += 1; }
    }
    return full.reverse();
  }, [appointments, scheduled, expenses, currentMonth]);

  const monthlyAppointments = useMemo(
    () => (appointments || []).filter(a => a.date.startsWith(selectedMonth)),
    [appointments, selectedMonth]
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
  const monthlyScheduled = (scheduled || []).filter(a => a.date.startsWith(selectedMonth));
  const pendingCount = monthlyScheduled.length;
  const pendingRevenue = monthlyScheduled.reduce((sum, a) => sum + servicePrice(a.service.name), 0);

  const sortedExpenses = useMemo(
    () => [...(expenses || [])].sort((a, b) => b.month.localeCompare(a.month) || a.category.localeCompare(b.category)),
    [expenses]
  );
  const monthlyExpenseTotal = (expenses || [])
    .filter(e => e.month === selectedMonth)
    .reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - monthlyExpenseTotal;

  async function removeExpense(id) {
    if (!confirm("Remover esta despesa?")) return;
    try { await api.deleteExpense(id); loadExpenses(); } catch (e) { setError(e.message); }
  }

  return <div className="page-fade">
    <Header title="Financeiro" subtitle={`Faturamento, a receber e despesas de ${formatMonthLabel(selectedMonth)}.`} />
    {error && <div className="alert error">{error}</div>}

    <MonthPicker months={availableMonths} value={selectedMonth} onChange={setSelectedMonth}/>

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
      <StatCard label="Faturamento" value={currency(totalRevenue)} detail={`${totalCompleted} ${totalCompleted === 1 ? "atendimento" : "atendimentos"} em ${formatMonthShort(selectedMonth)}`} icon={DollarSign}/>
      <StatCard label="A receber" value={currency(pendingRevenue)} detail={`${pendingCount} ${pendingCount === 1 ? "agendamento" : "agendamentos"} em ${formatMonthShort(selectedMonth)}`} icon={CalendarDays}/>
      <StatCard label="Despesas" value={currency(monthlyExpenseTotal)} detail={`Em ${formatMonthShort(selectedMonth)}`} icon={TrendingDown}/>
      <StatCard label="Lucro" value={currency(netProfit)} detail="Faturamento − despesas" icon={TrendingUp}/>
    </div>

    <section className="panel">
      <div className="section-title"><div><h2>Faturamento por serviço</h2><p>Agendamentos concluídos em {formatMonthLabel(selectedMonth)}.</p></div></div>
      {appointments === null ? null : breakdown.length
        ? <div className="table-wrap"><table>
            <thead><tr><th>Serviço</th><th>Atendimentos</th><th>Subtotal</th></tr></thead>
            <tbody>{breakdown.map((s, i) => <tr key={s.name} style={{"--i": i}}>
              <td><strong>{s.name}</strong></td>
              <td>{s.count}</td>
              <td>{currency(s.total)}</td>
            </tr>)}</tbody>
          </table></div>
        : <Empty text="Nenhum agendamento concluído neste mês."/>}
    </section>

    <section className="panel">
      <div className="section-title">
        <div><h2>Despesas</h2><p>Custos fixos e variáveis da barbearia, por mês.</p></div>
        <button className="primary inline" onClick={()=>setModal({type:"new"})}><Plus size={18}/>Nova despesa</button>
      </div>
      {expenses === null ? null : sortedExpenses.length
        ? <div className="table-wrap"><table>
            <thead><tr><th>Mês</th><th>Categoria</th><th>Valor</th><th></th></tr></thead>
            <tbody>{sortedExpenses.map((e, i) => <tr key={e.id} style={{"--i": i}}>
              <td>{formatMonthLabel(e.month)}</td>
              <td><strong>{e.category}</strong></td>
              <td>{currency(e.amount)}</td>
              <td className="row-actions">
                <button className="icon-btn" onClick={()=>setModal({type:"edit", expense:e})}><Pencil size={16}/></button>
                <button className="icon-btn danger" onClick={()=>removeExpense(e.id)}><Trash2 size={16}/></button>
              </td>
            </tr>)}</tbody>
          </table></div>
        : <Empty text="Nenhuma despesa cadastrada ainda."/>}
    </section>

    {modal && <ExpenseModal initial={modal.expense} onClose={()=>setModal(null)} onSaved={()=>{setModal(null); loadExpenses();}}/>}
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
  const [financeUnlocked, setFinanceUnlocked] = useState(false);

  if (!authenticated) return <Login onLogin={()=>setAuthenticated(true)} />;

  const logout = () => { localStorage.removeItem("token"); setAuthenticated(false); setFinanceUnlocked(false); };

  return <div className="app-shell">
    <Sidebar page={page} setPage={setPage} onLogout={logout}/>
    <main className="content">
      {page==="dashboard" && <Dashboard goAgenda={()=>setPage("agenda")}/>}
      {page==="agenda" && <Agenda/>}
      {page==="clientes" && <Clients/>}
      {page==="financeiro" && (financeUnlocked
        ? <Financeiro/>
        : <FinanceiroLock onUnlock={()=>setFinanceUnlocked(true)}/>)}
    </main>
  </div>;
}
