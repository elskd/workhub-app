import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { Kind, RecordData, WorkRecord } from './model';
import { backendConfigured, backend } from './supabase';
import { formatDate, KIND_LABEL, money, SECTION_KINDS, SECTIONS, todayISO } from './model';

type IconName = 'home' | 'check' | 'layers' | 'search' | 'wallet' | 'pen' | 'image' | 'folder' | 'calculator' | 'spark' | 'settings' | 'plus' | 'chevron' | 'calendar' | 'clock' | 'arrow' | 'more' | 'logout' | 'menu' | 'close' | 'filter' | 'list' | 'board' | 'file' | 'user' | 'target' | 'sun' | 'moon';

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const shapes: Record<IconName, React.ReactNode> = {
    home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-6h6v6"/></>,
    check: <><path d="M20 6 9 17l-5-5"/><path d="M21 12a9 9 0 1 1-5.2-8.2"/></>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></>,
    wallet: <><rect x="3" y="5" width="18" height="15" rx="3"/><path d="M3 9h18m-5 6h.01"/><path d="M6 5V3h12v2"/></>,
    pen: <><path d="m4 20 4.5-1 10.8-10.8a2.1 2.1 0 0 0-3-3L5.5 16 4 20Z"/><path d="m14.8 6.7 3 3"/></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></>,
    folder: <><path d="M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z"/></>,
    calculator: <><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h2m4 0h2m-8 4h2m4 0h2m-8 4h2m4 0h2"/></>,
    spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"/><path d="m19 14 1 2.5 2.5 1-2.5 1L19 21l-1-2.5-2.5-1 2.5-1 1-2.5Z"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.6.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.6-.9l-1.7.6-1.4-2.4 1.4-1.1a8 8 0 0 1 0-1.9l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.6-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.6.9l1.7-.6 1.4 2.4-1.4 1.1a8 8 0 0 1 0 1.8Z" transform="translate(-2 -2) scale(1.16)"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    arrow: <><path d="M5 12h14m-6-6 6 6-6 6"/></>,
    more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
    logout: <><path d="M10 17l5-5-5-5m5 5H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
    filter: <><path d="M4 6h16M7 12h10m-7 6h4"/></>,
    list: <><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/></>,
    board: <><rect x="3" y="4" width="8" height="16" rx="2"/><rect x="13" y="4" width="8" height="10" rx="2"/></>,
    file: <><path d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10Z"/><path d="M13 3v7h7M8 15h8m-8 3h8"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>,
    moon: <path d="M20.8 13A8.5 8.5 0 0 1 11 3.2 8.8 8.8 0 1 0 20.8 13Z"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[name]}</svg>;
}

const sectionIcon: Record<string, IconName> = {
  home: 'home', tasks: 'check', projects: 'layers', leads: 'search', money: 'wallet',
  content: 'pen', design: 'image', materials: 'folder', calculator: 'calculator', assistant: 'spark', settings: 'settings',
};

function App() {
  const [records, setRecords] = useState<WorkRecord[]>([]);
  const [session, setSession] = useState<Awaited<ReturnType<typeof backend.session>>>(null);
  const [localMode, setLocalMode] = useState(false);
  const [active, setActive] = useState('home');
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'saved' | 'syncing' | 'offline' | 'error' | 'local'>('saved');
  const [error, setError] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);
  const [modalKind, setModalKind] = useState<Kind | null>(null);
  const [editingRecord, setEditingRecord] = useState<WorkRecord | null>(null);
  const [search, setSearch] = useState('');
  const [mobileNav, setMobileNav] = useState(false);
  const [calendarDate, setCalendarDate] = useState(todayISO());
  const [monthlyGoal, setMonthlyGoal] = useState(() => localStorage.getItem('workhub.monthlyGoal.v1') || '150000');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      if (!backendConfigured) {
        setLocalMode(true);
        setSession(null);
        setRecords(await backend.list());
        setSyncStatus('local');
        setError('');
        return;
      }
      setLocalMode(false);
      const current = await backend.session();
      setSession(current);
      if (current) {
        const items = await backend.list();
        setRecords(items);
        setSyncStatus('saved');
        setError('');
      }
    } catch (reason) {
      setSyncStatus(navigator.onLine ? 'error' : 'offline');
      if (!quiet) setError(reason instanceof Error ? reason.message : 'Не удалось загрузить записи.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault(); searchInputRef.current?.focus();
      }
      if (event.key === 'Escape' && mobileNav) setMobileNav(false);
    }
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, [mobileNav]);
  useEffect(() => {
    if (!session || localMode) return;
    const timer = window.setInterval(() => { void load(true); }, 5000);
    const online = () => { setSyncStatus('syncing'); void load(true); };
    const offline = () => setSyncStatus('offline');
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => { window.clearInterval(timer); window.removeEventListener('online', online); window.removeEventListener('offline', offline); };
  }, [session, localMode, load]);

  useEffect(() => {
    const saved = localStorage.getItem('workhub.appearance.v1');
    if (saved) {
      try {
        const value = JSON.parse(saved) as { theme?: string; accent?: string };
        document.documentElement.dataset.theme = value.theme || 'light';
        if (value.accent) document.documentElement.style.setProperty('--accent', value.accent);
      } catch { /* ignore a malformed preference */ }
    }
  }, []);

  const byKind = useMemo(() => {
    const grouped = new Map<Kind, WorkRecord[]>();
    for (const record of records) grouped.set(record.kind, [...(grouped.get(record.kind) || []), record]);
    return grouped;
  }, [records]);
  const activeSection = SECTIONS.find((item) => item.id === active) || SECTIONS[0];

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setLoginBusy(true); setError('');
    try {
      const nextSession = await backend.signIn(loginEmail.trim(), loginPassword);
      setLocalMode(false);
      setSession(nextSession);
      setLoginPassword('');
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось войти.');
    } finally { setLoginBusy(false); }
  }

  async function addRecord(data: RecordData) {
    if (!modalKind) return;
    setSyncStatus(localMode ? 'local' : 'syncing'); setError('');
    try {
      const created = await backend.create({ kind: modalKind, data });
      setRecords((current) => [created, ...current]);
      setModalKind(null);
      setSyncStatus(localMode ? 'local' : 'saved');
    } catch (reason) {
      setSyncStatus(navigator.onLine ? 'error' : 'offline');
      setError(reason instanceof Error ? reason.message : 'Запись не сохранилась.');
      throw reason;
    }
  }

  async function saveRecord(data: RecordData) {
    if (editingRecord) {
      setSyncStatus(localMode ? 'local' : 'syncing'); setError('');
      try {
        const updated = await backend.update(editingRecord, data);
        setRecords((current) => current.map((item) => item.id === updated.id ? updated : item));
        setEditingRecord(null); setModalKind(null); setSyncStatus(localMode ? 'local' : 'saved');
      } catch (reason) {
        setSyncStatus('error');
        setError(reason instanceof Error ? reason.message : 'Изменение не сохранилось.');
        throw reason;
      }
      return;
    }
    await addRecord(data);
  }

  async function archiveRecord(record: WorkRecord) {
    const updated = await backend.update(record, { ...record.data, status: 'archived' });
    setRecords((current) => current.map((item) => item.id === updated.id ? updated : item));
    setSyncStatus(localMode ? 'local' : 'saved');
  }

  async function toggleTask(task: WorkRecord) {
    const next = { ...task.data, status: task.data.status === 'done' ? 'todo' : 'done' };
    setRecords((current) => current.map((item) => item.id === task.id ? { ...item, data: next } : item));
    setSyncStatus(localMode ? 'local' : 'syncing');
    try {
      const updated = await backend.update(task, next);
      setRecords((current) => current.map((item) => item.id === task.id ? updated : item));
      if (next.status === 'done' && typeof task.data.repeat_interval === 'string' && task.data.repeat_interval !== 'none') {
        const occurrenceDate = nextDate(String(task.data.due_date || task.data.planned_date || todayISO()), String(task.data.repeat_interval));
        const alreadyCreated = records.some((item) => item.kind === 'task' && item.data.source_task_id === task.id && item.data.due_date === occurrenceDate);
        if (!alreadyCreated) {
          const followup = await backend.create({ kind: 'task', data: { ...task.data, status: 'todo', due_date: occurrenceDate, planned_date: task.data.planned_date ? nextDate(String(task.data.planned_date), String(task.data.repeat_interval)) : '', source_task_id: task.id } });
          setRecords((current) => [followup, ...current]);
        }
      }
      setSyncStatus(localMode ? 'local' : 'saved'); setError('');
    } catch (reason) {
      setSyncStatus('error');
      setError(reason instanceof Error ? reason.message : 'Изменение не сохранилось.');
      await load(true);
    }
  }

  async function convertLead(lead: WorkRecord) {
    setSyncStatus(localMode ? 'local' : 'syncing'); setError('');
    try {
      let client = records.find((record) => record.kind === 'client' && record.data.source_lead_id === lead.id);
      if (!client) {
        client = await backend.create({ kind: 'client', data: { name: String(lead.data.name || ''), email: String(lead.data.email || ''), phone: String(lead.data.phone || ''), source_lead_id: lead.id, notes: String(lead.data.notes || '') } });
        setRecords((current) => [client!, ...current]);
      }
      const updated = await backend.update(lead, { ...lead.data, status: 'converted', converted_client_id: client.id });
      setRecords((current) => [client!, ...current.filter((item) => item.id !== client!.id).map((item) => item.id === updated.id ? updated : item)]);
      setSyncStatus(localMode ? 'local' : 'saved');
    } catch (reason) {
      setSyncStatus('error');
      setError(reason instanceof Error ? reason.message : 'Не удалось перенести контакт в клиенты.');
    }
  }

  async function receiveExpectedPayment(expected: WorkRecord) {
    setSyncStatus(localMode ? 'local' : 'syncing'); setError('');
    try {
      let payment = records.find((record) => record.kind === 'payment' && record.data.source_expected_id === expected.id);
      if (!payment) {
        payment = await backend.create({ kind: 'payment', data: { title: expected.data.title, amount: expected.data.amount, date: expected.data.due_date, project_id: expected.data.project_id, status: 'received', source_expected_id: expected.id, note: expected.data.note || '' } });
        setRecords((current) => [payment!, ...current]);
      }
      const updated = await backend.update(expected, { ...expected.data, status: 'received', converted_payment_id: payment.id });
      setRecords((current) => [payment!, ...current.filter((item) => item.id !== payment!.id).map((item) => item.id === updated.id ? updated : item)]);
      setSyncStatus(localMode ? 'local' : 'saved');
    } catch (reason) {
      setSyncStatus('error');
      setError(reason instanceof Error ? reason.message : 'Не удалось перенести оплату в поступления.');
    }
  }

  async function createEstimateRevision(estimate: WorkRecord) {
    try {
      const family = String(estimate.data.estimate_family_id || estimate.id);
      const familyVersions = records.filter((item) => item.kind === 'estimate' && (item.id === family || item.data.estimate_family_id === family));
      const nextRevision = Math.max(1, ...familyVersions.map((item) => Number(item.data.revision_number || 1))) + 1;
      const created = await backend.create({ kind: 'estimate', data: { ...estimate.data, estimate_family_id: family, revision_number: nextRevision, previous_revision_id: estimate.id, status: 'draft' } });
      setRecords((current) => [created, ...current]);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Не удалось создать новую версию сметы.'); }
  }

  async function openMaterial(record: WorkRecord) {
    if (typeof record.data.file_path !== 'string') return;
    const target = window.open('about:blank', '_blank', 'noopener,noreferrer');
    try {
      const url = await backend.signedFileUrl(record.data.file_path);
      if (target) target.location.href = url;
      else window.location.assign(url);
    } catch (reason) { target?.close(); setError(reason instanceof Error ? reason.message : 'Не удалось открыть файл.'); }
  }

  async function signOut() {
    await backend.signOut();
    setSession(null); setRecords([]); setActive('home');
  }

  const filteredSearch = search.trim().toLocaleLowerCase('ru');
  const globalResults = filteredSearch ? records.filter((record) => JSON.stringify(record.data).toLocaleLowerCase('ru').includes(filteredSearch)) : [];

  if (loading) return <div className="launch-screen"><div className="brand-mark">W</div><span>Открываем WorkHub</span></div>;
  if (!session && !localMode) return <LoginScreen email={loginEmail} password={loginPassword} setEmail={setLoginEmail} setPassword={setLoginPassword} submit={signIn} busy={loginBusy} error={error} configured={backendConfigured} />;

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <div className="sidebar-brand"><div className="brand-mark">W</div><span>workhub</span><button className="icon-button sidebar-collapse" aria-label="Свернуть меню" onClick={() => setMobileNav(false)}><Icon name="menu" /></button></div>
      <label className="search-box"><Icon name="search" size={16} /><input ref={searchInputRef} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Поиск" aria-label="Поиск по WorkHub" /><kbd>⌘ K</kbd></label>
      {filteredSearch ? <div className="nav-group"><div className="nav-label">Результаты поиска</div>{globalResults.length ? globalResults.slice(0, 8).map((record) => <button key={record.id} className="nav-item" onClick={() => { setActive(sectionForKind(record.kind)); setSearch(''); }}><Icon name={sectionIcon[sectionForKind(record.kind)] || 'file'} size={16} /><span>{String(record.data.title || record.data.name || KIND_LABEL[record.kind])}</span></button>) : <div className="search-empty">Ничего не найдено</div>}</div> : <>
        {(['Рабочее', 'Создание', 'Прочее'] as const).map((group) => <div className="nav-group" key={group}><div className="nav-label">{group}</div>{SECTIONS.filter((item) => item.group === group).map((item) => <button key={item.id} className={`nav-item ${active === item.id ? 'active' : ''}`} onClick={() => { setActive(item.id); setMobileNav(false); }}><Icon name={sectionIcon[item.id]} size={16} /><span>{item.label}</span>{item.id === 'tasks' && dueCount(byKind.get('task') || []) > 0 && <i className="nav-count">{dueCount(byKind.get('task') || [])}</i>}</button>)}</div>)}
      </>}
      <div className="sidebar-bottom"><div className={`sync-indicator ${syncStatus}`}><span className="sync-dot" />{syncLabel(syncStatus)}</div><div className="account-card"><div className="avatar">{session?.user.email?.slice(0, 1).toUpperCase() || 'Я'}</div><div className="account-info"><strong>Мое пространство</strong><span>{session?.user.email || (localMode ? 'Этот браузер' : '')}</span></div>{session && <button className="icon-button account-menu" aria-label="Выйти" onClick={() => void signOut()}><Icon name="logout" size={16} /></button>}</div></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><button className="icon-button mobile-menu" aria-label="Открыть меню" onClick={() => setMobileNav((value) => !value)}><Icon name="menu" /></button><div className="breadcrumbs"><span>Рабочее пространство</span><Icon name="chevron" size={14} /><strong>{activeSection.label}</strong></div><div className="topbar-actions"><button className="today-chip" onClick={() => setActive('home')}><Icon name="calendar" size={15} />{new Intl.DateTimeFormat('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date())}</button><button className="primary-button" onClick={() => setModalKind(defaultKindForSection(active))}><Icon name="plus" size={16} />{createLabel(active)}</button></div></header>
      <div className="page-wrap">
        {localMode && <div className="notice local-mode-notice" role="status"><span><strong>Данные сохранены в этом браузере.</strong> Сейчас они не синхронизируются между устройствами.</span><span className="local-mode-tag">Локальный режим</span></div>}
        {error && <div className="notice notice-error" role="status"><span>{error}</span><button className="icon-button" aria-label="Закрыть сообщение" onClick={() => setError('')}><Icon name="close" size={16} /></button></div>}
        {active === 'home' && <Dashboard records={records} byKind={byKind} setActive={setActive} toggleTask={toggleTask} month={calendarDate} setMonth={setCalendarDate} onCreate={setModalKind} monthlyGoal={Number(monthlyGoal) || 0} />}
        {active === 'assistant' && <AssistantPage />}
        {active === 'settings' && <SettingsPage onSignOut={() => void signOut()} monthlyGoal={monthlyGoal} setMonthlyGoal={(value) => { setMonthlyGoal(value); localStorage.setItem('workhub.monthlyGoal.v1', value); }} />}
        {active !== 'home' && active !== 'assistant' && active !== 'settings' && <RecordPage section={active} records={records.filter((record) => SECTION_KINDS[active]?.includes(record.kind) || (active === 'projects' && record.kind === 'client'))} allRecords={records} toggleTask={toggleTask} onCreate={(kind) => { setEditingRecord(null); setModalKind(kind); }} onEdit={(record) => { setEditingRecord(record); setModalKind(record.kind); }} onArchive={(record) => void archiveRecord(record).catch((reason) => setError(reason instanceof Error ? reason.message : 'Не удалось убрать запись в архив.'))} onConvert={convertLead} onReceive={receiveExpectedPayment} onNewRevision={createEstimateRevision} onOpenFile={openMaterial} />}
      </div>
    </main>
    {mobileNav && <button className="scrim" aria-label="Закрыть меню" onClick={() => setMobileNav(false)} />}
    {modalKind && <RecordModal key={`${modalKind}-${editingRecord?.id || 'new'}`} kind={modalKind} records={records} initialData={editingRecord?.data} editing={Boolean(editingRecord)} onClose={() => { setModalKind(null); setEditingRecord(null); }} onSave={saveRecord} />}
    <nav className="mobile-bottom-nav" aria-label="Быстрая навигация">{['home', 'tasks', 'projects', 'money', 'more'].map((id) => <button key={id} className={active === id || (id === 'more' && !['home', 'tasks', 'projects', 'money'].includes(active)) ? 'active' : ''} onClick={() => id === 'more' ? setMobileNav(true) : setActive(id)} aria-label={id === 'more' ? 'Еще разделы' : SECTIONS.find((section) => section.id === id)?.label}><Icon name={id === 'more' ? 'more' : sectionIcon[id]} size={20} /><span>{id === 'more' ? 'Еще' : SECTIONS.find((section) => section.id === id)?.label}</span></button>)}</nav>
  </div>;
}

function LoginScreen({ email, password, setEmail, setPassword, submit, busy, error, configured }: {
  email: string; password: string; setEmail: (value: string) => void; setPassword: (value: string) => void;
  submit: (event: FormEvent) => void; busy: boolean; error: string; configured: boolean;
}) {
  return <main className="login-shell"><section className="login-card"><div className="login-brand"><div className="brand-mark">W</div><span>workhub</span></div><div className="eyebrow">ЛИЧНОЕ РАБОЧЕЕ ПРОСТРАНСТВО</div><h1>Работа становится яснее.</h1><p className="login-copy">Задачи, проекты и деньги — в одном спокойном месте.</p>
    {!configured ? <div className="setup-note"><strong>Нужно подключить облачную базу</strong><p>Добавьте адрес и открытый ключ проекта Supabase в локальный файл окружения. Приватный ключ сервера в приложение добавлять нельзя.</p></div> : <form onSubmit={submit} className="login-form"><label className="field"><span>Электронная почта</span><input autoComplete="username" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="you@example.com" /></label><label className="field"><span>Пароль</span><input autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required placeholder="Введите пароль" /></label>{error && <div className="form-error" role="alert">{error}</div>}<button className="primary-button login-submit" disabled={busy}>{busy ? 'Входим…' : 'Войти в WorkHub'}<Icon name="arrow" size={16} /></button><p className="login-footnote">Вход предназначен для владельца пространства.</p></form>}
  </section><div className="login-aside"><div className="login-orbit orbit-one"/><div className="login-orbit orbit-two"/><span className="aside-kicker">ОДНО ПРОСТРАНСТВО ДЛЯ РАБОТЫ</span><div className="aside-note"><span className="aside-note-icon"><Icon name="target" size={20} /></span><div><strong>От первого контакта до оплаты</strong><p>Связанные задачи и проекты помогают видеть следующий шаг.</p></div></div><div className="aside-note"><span className="aside-note-icon"><Icon name="layers" size={20} /></span><div><strong>Все важное под рукой</strong><p>План дня, материалы и финансы синхронизированы между устройствами.</p></div></div><span className="aside-caption">Ваш рабочий ритм. Ваша система.</span></div></main>;
}

function Dashboard({ records, byKind, setActive, toggleTask, month, setMonth, onCreate, monthlyGoal }: {
  records: WorkRecord[]; byKind: Map<Kind, WorkRecord[]>; setActive: (id: string) => void;
  toggleTask: (task: WorkRecord) => void; month: string; setMonth: (value: string) => void; onCreate: (kind: Kind) => void; monthlyGoal: number;
}) {
  const today = todayISO();
  const tasks = byKind.get('task') || [];
  const todayTasks = tasks.filter((task) => !['done', 'archived'].includes(String(task.data.status)) && (task.data.planned_date === today || task.data.due_date === today));
  const overdue = tasks.filter((task) => !['done', 'archived'].includes(String(task.data.status)) && typeof task.data.due_date === 'string' && task.data.due_date < today);
  const upcoming = tasks.filter((task) => !['done', 'archived'].includes(String(task.data.status)) && typeof task.data.due_date === 'string' && task.data.due_date >= today && task.data.due_date <= addDays(today, 7)).sort((a, b) => String(a.data.due_date).localeCompare(String(b.data.due_date))).slice(0, 5);
  const projects = (byKind.get('project') || []).filter((project) => project.data.status !== 'done' && project.data.status !== 'archived').slice(0, 4);
  const scheduled = tasks.filter((task) => !['done', 'archived'].includes(String(task.data.status)) && task.data.planned_date === today && task.data.start_time).sort((a, b) => String(a.data.start_time).localeCompare(String(b.data.start_time)));
  const targetMonth = month.slice(0, 7);
  const income = (byKind.get('payment') || []).filter((payment) => ['received', 'paid'].includes(String(payment.data.status)) && String(payment.data.date || '').slice(0, 7) === targetMonth).reduce((sum, payment) => sum + Number(payment.data.amount || 0), 0);
  const progress = monthlyGoal > 0 ? Math.min(100, income / monthlyGoal * 100) : 0;
  const nextTask = overdue.sort((a, b) => priorityRank(b.data.priority) - priorityRank(a.data.priority))[0]
    || todayTasks.sort((a, b) => priorityRank(b.data.priority) - priorityRank(a.data.priority))[0]
    || upcoming.sort((a, b) => priorityRank(b.data.priority) - priorityRank(a.data.priority))[0];
  const monthDate = new Date(`${targetMonth}-01T12:00:00`);
  const completed = tasks.filter((task) => task.data.status === 'done').length;
  const counts = `${records.length} ${plural(records.length, 'запись', 'записи', 'записей')}`;

  return <>
    <div className="page-heading"><div><div className="eyebrow">{new Intl.DateTimeFormat('ru-RU', { weekday: 'long' }).format(new Date()).toLocaleUpperCase('ru')} · {new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(new Date())}</div><h1>Добро пожаловать в WorkHub</h1><p>Вот что происходит в работе сегодня.</p></div><button className="secondary-button" onClick={() => setActive('tasks')}><Icon name="list" size={16} />Открыть задачи</button></div>
    <div className="dashboard-grid">
      <section className="panel today-panel"><div className="panel-heading"><div><span className="panel-kicker">НА СЕГОДНЯ</span><h2>Задачи на сегодня <span className="count-badge">{todayTasks.length + overdue.length}</span></h2></div><button className="text-button" onClick={() => setActive('tasks')}>Все задачи <Icon name="arrow" size={14} /></button></div>
        {overdue.length > 0 && <div className="overdue-group"><div className="subsection-label danger-text">Просрочено · {overdue.length}</div>{overdue.slice(0, 3).map((task) => <TaskRow key={task.id} task={task} toggle={toggleTask} late />)}</div>}
        {todayTasks.length ? todayTasks.slice(0, 5).map((task) => <TaskRow key={task.id} task={task} toggle={toggleTask} />) : <EmptyInline text={overdue.length ? 'На сегодня задач нет' : 'Сегодня свободно. Добавьте задачу, чтобы запланировать день.'} onAction={() => onCreate('task')} action="Добавить задачу" />}
        <div className="panel-foot"><span>{completed} выполнено · {counts} в WorkHub</span><button className="icon-button" aria-label="Добавить задачу" onClick={() => onCreate('task')}><Icon name="plus" size={17} /></button></div>
      </section>
      <section className="panel plan-panel"><div className="panel-heading"><div><span className="panel-kicker">ВРЕМЕННАЯ ШКАЛА</span><h2>План дня</h2></div><button className="text-button" onClick={() => setActive('tasks')}>Изменить <Icon name="arrow" size={14} /></button></div>
        <div className="day-date-row"><strong>{new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}</strong><span>{scheduled.length} {plural(scheduled.length, 'слот', 'слота', 'слотов')}</span></div>
        {scheduled.length ? <div className="timeline">{scheduled.map((task) => <div className="timeline-item" key={task.id}><div className="timeline-time">{String(task.data.start_time)}<span>{String(task.data.end_time || '')}</span></div><div className="timeline-rail"><i /></div><div className="timeline-card"><strong>{String(task.data.title || 'Без названия')}</strong><span>{projectName(records, task.data.project_id) || 'Личная задача'}</span></div></div>)}</div> : <div className="timeline-empty"><div className="empty-clock"><Icon name="clock" size={20} /></div><div><strong>План пока пуст</strong><span>Назначьте задаче время — она появится здесь.</span></div><button className="icon-button" aria-label="Добавить задачу" onClick={() => onCreate('task')}><Icon name="plus" size={17} /></button></div>}
        <div className="time-free"><span>Свободное время</span><span>{scheduled.length ? `${Math.max(0, 8 - scheduled.length)} ч свободно` : 'Весь день'}</span></div>
      </section>
      <section className="panel deadlines-panel"><div className="panel-heading"><div><span className="panel-kicker">СЛЕДУЮЩИЕ 7 ДНЕЙ</span><h2>Ближайшие дедлайны</h2></div><button className="icon-button" aria-label="Все сроки" onClick={() => setActive('tasks')}><Icon name="arrow" size={16} /></button></div>
        {upcoming.length ? <div className="deadline-list">{upcoming.map((task) => <button className="deadline-row" key={task.id} onClick={() => setActive('tasks')}><span className="deadline-date"><b>{new Intl.DateTimeFormat('ru-RU', { day: '2-digit' }).format(new Date(`${String(task.data.due_date)}T12:00:00`))}</b><small>{new Intl.DateTimeFormat('ru-RU', { month: 'short' }).format(new Date(`${String(task.data.due_date)}T12:00:00`))}</small></span><span className="deadline-copy"><strong>{String(task.data.title || 'Без названия')}</strong><small>{projectName(records, task.data.project_id) || 'Личная задача'}</small></span><Icon name="chevron" size={15} /></button>)}</div> : <EmptyInline text="Ближайших дедлайнов пока нет." onAction={() => onCreate('task')} action="Добавить задачу" />}
      </section>
      <section className="panel projects-panel"><div className="panel-heading"><div><span className="panel-kicker">В РАБОТЕ</span><h2>Активные проекты</h2></div><button className="text-button" onClick={() => setActive('projects')}>Все проекты <Icon name="arrow" size={14} /></button></div>
        {projects.length ? <div className="project-list">{projects.map((project) => <button className="project-row" key={project.id} onClick={() => setActive('projects')}><span className="project-avatar">{String(project.data.name || 'П').slice(0, 1).toUpperCase()}</span><span className="project-copy"><strong>{String(project.data.name || 'Новый проект')}</strong><small>{clientName(records, project.data.client_id) || 'Без клиента'}</small></span><span className="stage-chip">{projectStageLabel(project.data.stage)}</span></button>)}</div> : <EmptyInline text="Здесь появятся проекты и их ближайшие этапы." onAction={() => onCreate('project')} action="Создать проект" />}
      </section>
      <section className="panel revenue-panel"><div className="panel-heading"><div><span className="panel-kicker">ФАКТИЧЕСКИЕ ПОСТУПЛЕНИЯ</span><h2>Цель на месяц</h2></div><button className="icon-button" aria-label="Открыть финансы" onClick={() => setActive('money')}><Icon name="arrow" size={16} /></button></div>
        <div className="revenue-month"><button className="month-change" aria-label="Предыдущий месяц" onClick={() => setMonth(addMonth(month, -1))}>‹</button><span>{new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(monthDate)}</span><button className="month-change" aria-label="Следующий месяц" onClick={() => setMonth(addMonth(month, 1))}>›</button></div>
        <div className="revenue-amount">{money(income)}<span> / {monthlyGoal ? `${money(monthlyGoal)}` : 'цель не задана'}</span></div><div className="revenue-track"><i style={{ width: `${progress}%` }} /></div><div className="revenue-foot"><span>{monthlyGoal ? income >= monthlyGoal ? 'Цель достигнута' : `Осталось ${money(Math.max(0, monthlyGoal - income))}` : 'Задайте цель в настройках'}</span><span>{Math.round(progress)}%</span></div><div className="revenue-note">Учитываются только поступления с фактической датой в выбранном месяце.</div>
      </section>
      <section className="next-step-card"><span className="next-icon"><Icon name="target" size={19} /></span><div className="next-step-copy"><span className="panel-kicker">СЛЕДУЮЩИЙ ШАГ</span>{nextTask ? <><strong>{String(nextTask.data.title || 'Задача без названия')}</strong><p>{nextTask.data.due_date && String(nextTask.data.due_date) < today ? `Срок прошел ${formatDate(nextTask.data.due_date)} — задача еще открыта.` : 'Ближайшая незавершенная задача по сроку и приоритету.'}</p></> : <><strong>Выберите, с чего начать</strong><p>Создайте первую задачу или добавьте потенциального клиента.</p></>}</div><button className="next-link" onClick={() => setActive(nextTask ? 'tasks' : 'leads')}>{nextTask ? 'К задаче' : 'К клиентам'}<Icon name="arrow" size={16} /></button></section>
    </div>
  </>;
}

function TaskRow({ task, toggle, late = false }: { task: WorkRecord; toggle: (task: WorkRecord) => void; late?: boolean }) {
  const subtasks = readSubtasks(task.data.subtasks);
  const done = subtasks.filter((item) => item.done).length;
  return <div className={`task-row ${late ? 'task-late' : ''}`}><button className={`task-check ${task.data.status === 'done' ? 'checked' : ''}`} aria-label={task.data.status === 'done' ? 'Вернуть задачу в работу' : 'Отметить выполненной'} onClick={() => void toggle(task)}>{task.data.status === 'done' && <Icon name="check" size={13} />}</button><div className="task-main"><strong className={task.data.status === 'done' ? 'task-done' : ''}>{String(task.data.title || 'Без названия')}</strong><span>{subtasks.length ? `${done}/${subtasks.length} подзадач` : String(task.data.project_name || (late ? `Просрочено · ${formatDate(task.data.due_date)}` : ''))}</span></div><div className="task-meta">{task.data.start_time && <span><Icon name="clock" size={13} />{String(task.data.start_time)}</span>}{task.data.priority && <span className={`priority-dot priority-${String(task.data.priority)}`} title={`Приоритет: ${String(task.data.priority)}`} />}</div></div>;
}

function RecordPage({ section, records, allRecords, toggleTask, onCreate, onEdit, onArchive, onConvert, onReceive, onNewRevision, onOpenFile }: { section: string; records: WorkRecord[]; allRecords: WorkRecord[]; toggleTask: (task: WorkRecord) => void; onCreate: (kind: Kind) => void; onEdit: (record: WorkRecord) => void; onArchive: (record: WorkRecord) => void; onConvert: (record: WorkRecord) => void; onReceive: (record: WorkRecord) => void; onNewRevision: (record: WorkRecord) => void; onOpenFile: (record: WorkRecord) => void }) {
  const [view, setView] = useState<'list' | 'board' | 'calendar'>('list');
  const [filter, setFilter] = useState('all');
  const [kindFilter, setKindFilter] = useState<Kind | 'all'>(section === 'projects' ? 'project' : section === 'calculator' ? 'estimate' : 'all');
  const sectionInfo = SECTIONS.find((item) => item.id === section)!;
  const activeRecords = records.filter((record) => record.data.status !== 'archived');
  const filteredRecords = section === 'projects' || section === 'calculator' || section === 'money' ? activeRecords.filter((record) => kindFilter === 'all' || record.kind === kindFilter) : activeRecords;
  const visible = filteredRecords.filter((record) => {
    if (filter === 'all') return true;
    if (filter === 'done') return record.data.status === 'done' || record.data.status === 'published';
    if (filter === 'open') return record.data.status !== 'done' && record.data.status !== 'archived';
    return String(record.data.status || 'new') === filter;
  }).sort((a, b) => String(a.data.due_date || a.data.date || a.created_at).localeCompare(String(b.data.due_date || b.data.date || b.created_at)));
  const addKind = kindFilter === 'all' ? defaultKindForSection(section) : kindFilter;
  const count = filteredRecords.length;
  return <>
    <div className="page-heading section-page-heading"><div><div className="eyebrow">РАБОЧЕЕ ПРОСТРАНСТВО</div><h1>{sectionInfo.label}</h1><p>{sectionDescription(section)} <span className="record-count">{count} {plural(count, 'запись', 'записи', 'записей')}</span></p></div><button className="primary-button" onClick={() => onCreate(addKind)}><Icon name="plus" size={16} />{kindFilter === 'client' ? 'Добавить клиента' : createLabel(section)}</button></div>
    {(section === 'projects' || section === 'money' || section === 'calculator') && <div className="kind-tabs" aria-label="Тип записей">{kindTabs(section).map(([kind, label]) => <button key={kind} className={kindFilter === kind ? 'selected' : ''} onClick={() => setKindFilter(kind)}>{label}{kind !== 'all' && <span>{activeRecords.filter((record) => record.kind === kind).length}</span>}</button>)}</div>}
    <div className="records-toolbar"><div className="segmented-control"><button className={filter === 'all' ? 'selected' : ''} onClick={() => setFilter('all')}>Все <span>{filteredRecords.length}</span></button><button className={filter === 'open' ? 'selected' : ''} onClick={() => setFilter('open')}>В работе</button><button className={filter === 'done' ? 'selected' : ''} onClick={() => setFilter('done')}>Завершено</button></div><div className="toolbar-right"><div className="view-switch"><button className={view === 'list' ? 'selected' : ''} aria-label="Список" onClick={() => setView('list')}><Icon name="list" size={16} /></button><button className={view === 'board' ? 'selected' : ''} aria-label="Доска" onClick={() => setView('board')}><Icon name="board" size={16} /></button>{section === 'content' || section === 'tasks' ? <button className={view === 'calendar' ? 'selected' : ''} aria-label="Календарь" onClick={() => setView('calendar')}><Icon name="calendar" size={16} /></button> : null}</div></div></div>
    {visible.length ? view === 'board' ? <RecordBoard records={visible} toggleTask={toggleTask} onEdit={onEdit} /> : view === 'calendar' ? <SimpleCalendar records={visible} onEdit={onEdit} /> : <div className="record-table"><div className="table-head"><span>НАЗВАНИЕ</span><span>СТАТУС</span><span>{section === 'money' ? 'СУММА' : 'СРОК'}</span><span>СВЯЗАНО С</span><span /></div>{visible.map((record) => <RecordLine key={record.id} record={record} records={allRecords} toggleTask={toggleTask} onEdit={onEdit} onArchive={onArchive} onConvert={onConvert} onReceive={onReceive} onNewRevision={onNewRevision} onOpenFile={onOpenFile} />)}</div> : <EmptyState section={section} onCreate={() => onCreate(addKind)} />}
  </>;
}

function RecordLine({ record, records, toggleTask, onEdit, onArchive, onConvert, onReceive, onNewRevision, onOpenFile }: { record: WorkRecord; records: WorkRecord[]; toggleTask: (task: WorkRecord) => void; onEdit: (record: WorkRecord) => void; onArchive: (record: WorkRecord) => void; onConvert: (record: WorkRecord) => void; onReceive: (record: WorkRecord) => void; onNewRevision: (record: WorkRecord) => void; onOpenFile: (record: WorkRecord) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const title = String(record.data.title || record.data.name || record.data.company || KIND_LABEL[record.kind]);
  return <div className="record-line"><div className="record-title-cell">{record.kind === 'task' && <button className={`task-check small ${record.data.status === 'done' ? 'checked' : ''}`} aria-label="Изменить выполнение" onClick={() => void toggleTask(record)}>{record.data.status === 'done' && <Icon name="check" size={12} />}</button>}<span className="record-kind-icon"><Icon name={sectionIcon[sectionForKind(record.kind)] || 'file'} size={16} /></span><div><strong>{title}{record.kind === 'estimate' && Number(record.data.revision_number || 1) > 1 ? ` · v${record.data.revision_number}` : ''}</strong><small>{String(record.data.description || record.data.service || record.data.format || record.data.file_name || KIND_LABEL[record.kind])}</small></div></div><span><StatusChip status={String(record.data.status || record.data.stage || 'new')} /></span><span className="record-date">{record.kind === 'payment' || record.kind === 'expense' || record.kind === 'expected_payment' || record.kind === 'tax' || record.kind === 'debt' ? money(record.data.amount) : record.kind === 'estimate' ? money(record.data.total) : formatDate(record.data.due_date || record.data.date)}</span><span className="record-related">{projectName(records, record.data.project_id) || clientName(records, record.data.client_id) || String(record.data.channel || '—')}</span><div className="row-action-wrap"><button className="icon-button row-more" aria-label={`Действия: ${title}`} aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}><Icon name="more" size={16} /></button>{menuOpen && <div className="row-menu">{record.kind === 'material' && typeof record.data.file_path === 'string' && <button onClick={() => onOpenFile(record)}>Открыть файл</button>}{record.kind === 'lead' && record.data.status !== 'converted' && <button onClick={() => onConvert(record)}>Перенести в клиенты</button>}{record.kind === 'expected_payment' && record.data.status === 'expected' && <button onClick={() => onReceive(record)}>Отметить как полученную</button>}{record.kind === 'estimate' && <button onClick={() => onNewRevision(record)}>Новая версия</button>}{(record.kind !== 'estimate' || !['sent', 'approved', 'superseded'].includes(String(record.data.status))) && <button onClick={() => onEdit(record)}>Изменить</button>}<button onClick={() => onArchive(record)}>В архив</button></div>}</div></div>;
}

function StatusChip({ status }: { status: string }) {
  const label: Record<string, string> = { todo: 'К выполнению', in_progress: 'В работе', done: 'Завершено', new: 'Новый', idea: 'Идея', prep: 'Подготовка', draft: 'Черновик', ready: 'Готово', planned: 'Запланировано', published: 'Опубликовано', first_contact: 'Первый контакт', discussion: 'Обсуждение', agreed: 'Договоренность', rejected: 'Отказ', paused: 'Отложено', no_reply: 'Нет ответа', review: 'Правки', active: 'Активен', archived: 'Архив', received: 'Получено', expected: 'Ожидается', paid: 'Оплачено', unpaid: 'Не оплачено', converted: 'Перенесен в клиенты', sent: 'Отправлена', approved: 'Согласована', superseded: 'Есть новая версия' };
  return <span className={`status-chip status-${status}`}>{label[status] || status.replaceAll('_', ' ')}</span>;
}

function RecordBoard({ records, toggleTask, onEdit }: { records: WorkRecord[]; toggleTask: (task: WorkRecord) => void; onEdit: (record: WorkRecord) => void }) {
  const columns = [{ id: 'todo', label: 'К выполнению' }, { id: 'in_progress', label: 'В работе' }, { id: 'done', label: 'Завершено' }];
  return <div className="board-columns">{columns.map((column) => { const list = records.filter((record) => String(record.data.status || 'todo') === column.id || (column.id === 'todo' && !['in_progress', 'done'].includes(String(record.data.status)))); return <section className="board-column" key={column.id}><div className="board-column-head"><strong>{column.label}</strong><span>{list.length}</span></div>{list.map((record) => { const title = String(record.data.title || record.data.name || KIND_LABEL[record.kind]); return <article className="board-card" key={record.id}><div className="board-card-top"><span className="board-card-kind">{KIND_LABEL[record.kind]}</span><button className="icon-button" aria-label={`Изменить: ${title}`} onClick={() => onEdit(record)}><Icon name="more" size={15} /></button></div><button className="board-card-title" onClick={() => onEdit(record)}>{title}</button><span className="board-description">{String(record.data.description || projectName(records, record.data.project_id) || '—')}</span><div className="board-card-foot"><span><Icon name="calendar" size={13} />{formatDate(record.data.due_date)}</span>{record.kind === 'task' && <button className={`task-check small ${record.data.status === 'done' ? 'checked' : ''}`} aria-label={record.data.status === 'done' ? 'Вернуть задачу в работу' : 'Отметить задачу выполненной'} onClick={() => void toggleTask(record)}>{record.data.status === 'done' && <Icon name="check" size={12} />}</button>}</div></article>; })}</section>; })}</div>;
}

function SimpleCalendar({ records, onEdit }: { records: WorkRecord[]; onEdit: (record: WorkRecord) => void }) {
  const [selectedMonth, setSelectedMonth] = useState(todayISO().slice(0, 7));
  const first = new Date(`${selectedMonth}-01T12:00:00`);
  const start = new Date(first); start.setDate(1 - ((first.getDay() + 6) % 7));
  return <section className="calendar-panel"><div className="calendar-head"><button className="month-change" aria-label="Предыдущий месяц" onClick={() => setSelectedMonth(addMonth(`${selectedMonth}-01`, -1))}>‹</button><strong>{new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(first)}</strong><button className="month-change" aria-label="Следующий месяц" onClick={() => setSelectedMonth(addMonth(`${selectedMonth}-01`, 1))}>›</button></div><div className="calendar-grid">{['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => <div className="calendar-weekday" key={day}>{day}</div>)}{Array.from({ length: 42 }, (_, index) => { const date = new Date(start); date.setDate(start.getDate() + index); const iso = date.toISOString().slice(0, 10); const dayRecords = records.filter((record) => record.data.planned_date === iso || record.data.due_date === iso || record.data.publish_date === iso); return <div className={`calendar-day ${date.getMonth() !== first.getMonth() ? 'outside-month' : ''} ${iso === todayISO() ? 'is-today' : ''}`} key={iso}><span>{date.getDate()}</span>{dayRecords.slice(0, 2).map((record) => { const title = String(record.data.title || record.data.name || KIND_LABEL[record.kind]); return <button className="calendar-event" key={record.id} title={title} onClick={() => onEdit(record)}>{title}</button>; })}</div>; })}</div></section>;
}

function RecordModal({ kind, records, initialData, editing, onClose, onSave }: { kind: Kind; records: WorkRecord[]; initialData?: RecordData; editing: boolean; onClose: () => void; onSave: (data: RecordData) => Promise<void> }) {
  const fields = fieldsForKind(kind);
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(fields.map((field) => [field.name, initialData?.[field.name] == null ? field.default || '' : String(initialData[field.name])] as const)));
  const [subtasks, setSubtasks] = useState<TaskSubtask[]>(() => readSubtasks(initialData?.subtasks));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const firstInput = document.querySelector<HTMLElement>('.modal-card input, .modal-card select, .modal-card textarea');
    firstInput?.focus();
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') { closeRef.current(); return; }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(document.querySelectorAll<HTMLElement>('.modal-card button:not(:disabled), .modal-card input:not(:disabled), .modal-card select:not(:disabled), .modal-card textarea:not(:disabled)'));
      if (!focusable.length) return;
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    window.addEventListener('keydown', handleKey);
    return () => { document.body.style.overflow = previousOverflow; previousFocus?.focus(); window.removeEventListener('keydown', handleKey); };
  }, []);
  const linkedProjects = records.filter((record) => record.kind === 'project');
  const clients = records.filter((record) => record.kind === 'client');
  function change(name: string, value: string) { setValues((current) => ({ ...current, [name]: value })); }
  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError('');
    const data: RecordData = editing && initialData ? { ...initialData } : {};
    for (const field of fields) {
      const value = values[field.name]?.trim() || '';
      if (!value) { delete data[field.name]; continue; }
      data[field.name] = field.type === 'number' ? Number(value) : value;
    }
    if (kind === 'estimate') {
      const lines = parseEstimateLines(values.items || '');
      data.line_items = lines;
      data.total = lines.reduce((sum, line) => sum + line.quantity * line.unit_price, 0);
      if (!editing) data.revision_number = 1;
    }
    if (kind === 'task') data.subtasks = subtasks.map((item) => ({ id: item.id, title: item.title.trim(), done: item.done })).filter((item) => item.title) as unknown as RecordData['subtasks'];
    if (kind === 'material' && file) {
      try {
        const path = await backend.upload(file);
        data.file_path = path;
        data.file_name = file.name;
        data.file_size = file.size;
      } catch (reason) { setError(reason instanceof Error ? reason.message : 'Не удалось загрузить файл.'); setSaving(false); return; }
    }
    try { await onSave(data); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Запись не сохранилась.'); } finally { setSaving(false); }
  }
  const estimateTotal = kind === 'estimate' ? parseEstimateLines(values.items || '').reduce((sum, line) => sum + line.quantity * line.unit_price, 0) : 0;
  return <div className="modal-scrim" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header className="modal-heading"><div><span className="eyebrow">{editing ? 'РЕДАКТИРОВАНИЕ' : 'НОВАЯ ЗАПИСЬ'}</span><h2 id="modal-title">{KIND_LABEL[kind]}</h2></div><button className="icon-button" aria-label="Закрыть" onClick={onClose}><Icon name="close" /></button></header><form onSubmit={(event) => void submit(event)}><div className="modal-fields">{fields.map((field) => <label key={field.name} className={`field ${field.wide ? 'field-wide' : ''}`}><span>{field.label}{field.required && <i> *</i>}</span>{field.type === 'select' ? <select value={values[field.name]} required={field.required} onChange={(event) => change(field.name, event.target.value)}><option value="">Выберите</option>{(field.options || []).map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select> : field.type === 'project' || field.type === 'client' ? <select value={values[field.name]} onChange={(event) => change(field.name, event.target.value)}><option value="">Не связывать</option>{(field.type === 'project' ? linkedProjects : clients).map((record) => <option key={record.id} value={record.id}>{String(record.data.name || record.data.title || 'Без названия')}</option>)}</select> : field.type === 'textarea' ? <textarea rows={3} value={values[field.name]} required={field.required} placeholder={field.placeholder} onChange={(event) => change(field.name, event.target.value)} /> : <input type={field.type === 'number' ? 'number' : field.type === 'time' ? 'time' : field.type === 'date' ? 'date' : field.type === 'email' ? 'email' : 'text'} min={field.type === 'number' ? '0' : undefined} step={field.type === 'number' ? '0.01' : undefined} value={values[field.name]} required={field.required} placeholder={field.placeholder} onChange={(event) => change(field.name, event.target.value)} />}</label>)}{kind === 'task' && <section className="subtasks-editor field-wide" aria-label="Подзадачи"><div className="subtasks-heading"><div><strong>Подзадачи</strong><span>{subtasks.filter((item) => item.done).length} из {subtasks.length} выполнено</span></div><button type="button" className="text-button" onClick={() => setSubtasks((current) => [...current, { id: crypto.randomUUID(), title: '', done: false }])}><Icon name="plus" size={14} />Добавить</button></div>{subtasks.map((subtask) => <div className="subtask-edit-row" key={subtask.id}><input type="checkbox" checked={subtask.done} aria-label={`Выполнена: ${subtask.title || 'новая подзадача'}`} onChange={(event) => setSubtasks((current) => current.map((item) => item.id === subtask.id ? { ...item, done: event.target.checked } : item))} /><input type="text" value={subtask.title} aria-label="Название подзадачи" placeholder="Например, подготовить текст" onChange={(event) => setSubtasks((current) => current.map((item) => item.id === subtask.id ? { ...item, title: event.target.value } : item))} /><button type="button" className="icon-button" aria-label="Удалить подзадачу" onClick={() => setSubtasks((current) => current.filter((item) => item.id !== subtask.id))}><Icon name="close" size={15} /></button></div>)}</section>}{kind === 'material' && <label className="field field-wide"><span>Файл (необязательно, до 20 МБ)</span><input type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} /><small>{file?.name || (typeof initialData?.file_name === 'string' ? `Текущий файл: ${initialData.file_name}` : 'PDF, изображения и другие рабочие файлы')}</small></label>}</div>{kind === 'estimate' && <div className="estimate-total"><span>Итого по смете</span><strong>{money(estimateTotal)}</strong></div>}{error && <div className="form-error" role="alert">{error}</div>}<div className="modal-actions"><p>Данные сохраняются в вашем личном пространстве.</p><button type="button" className="secondary-button" onClick={onClose}>Отмена</button><button className="primary-button" disabled={saving}>{saving ? 'Сохраняем…' : 'Сохранить'}</button></div></form></section></div>;
}

type Field = { name: string; label: string; type: 'text' | 'email' | 'date' | 'time' | 'number' | 'textarea' | 'select' | 'project' | 'client'; required?: boolean; wide?: boolean; placeholder?: string; default?: string; options?: { value: string; label: string }[] };
type TaskSubtask = { id: string; title: string; done: boolean };
function readSubtasks(value: unknown): TaskSubtask[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
    const data = item as Record<string, unknown>;
    if (typeof data.title !== 'string') return [];
    return [{ id: typeof data.id === 'string' ? data.id : `subtask-${index}`, title: data.title, done: data.done === true }];
  });
}
const statusOptions: Field['options'] = [
  { value: 'todo', label: 'К выполнению' }, { value: 'in_progress', label: 'В работе' }, { value: 'done', label: 'Завершено' },
];
function fieldsForKind(kind: Kind): Field[] {
  const commonTitle: Field = { name: 'title', label: 'Название', type: 'text', required: true, wide: true, placeholder: 'Например, подготовить структуру сайта' };
  const taskFields: Field[] = [commonTitle, { name: 'description', label: 'Описание', type: 'textarea', wide: true }, { name: 'project_id', label: 'Проект', type: 'project' }, { name: 'priority', label: 'Приоритет', type: 'select', options: [{ value: 'low', label: 'Низкий' }, { value: 'normal', label: 'Обычный' }, { value: 'high', label: 'Высокий' }] }, { name: 'due_date', label: 'Дедлайн', type: 'date' }, { name: 'planned_date', label: 'Запланировать на', type: 'date', default: todayISO() }, { name: 'start_time', label: 'Начало', type: 'time' }, { name: 'end_time', label: 'Окончание', type: 'time' }, { name: 'repeat_interval', label: 'Повторять', type: 'select', default: 'none', options: [{ value: 'none', label: 'Не повторять' }, { value: 'daily', label: 'Каждый день' }, { value: 'weekly', label: 'Каждую неделю' }, { value: 'monthly', label: 'Каждый месяц' }] }, { name: 'status', label: 'Состояние', type: 'select', options: statusOptions, default: 'todo' }];
  if (kind === 'task') return taskFields;
  if (kind === 'client') return [{ name: 'name', label: 'Имя или название компании', type: 'text', required: true, wide: true }, { name: 'email', label: 'Электронная почта', type: 'email' }, { name: 'phone', label: 'Телефон', type: 'text' }, { name: 'messenger', label: 'Мессенджер', type: 'text' }, { name: 'website', label: 'Сайт', type: 'text', wide: true }];
  if (kind === 'lead') return [{ name: 'name', label: 'Имя или компания', type: 'text', required: true, wide: true }, { name: 'email', label: 'Электронная почта', type: 'email' }, { name: 'phone', label: 'Телефон', type: 'text' }, { name: 'service', label: 'Интересующая услуга', type: 'select', options: serviceOptions }, { name: 'source', label: 'Ссылка или источник', type: 'text', wide: true }, { name: 'next_action_date', label: 'Следующее действие', type: 'date' }, { name: 'status', label: 'Состояние', type: 'select', default: 'new', options: [{ value: 'new', label: 'Новый' }, { value: 'first_contact', label: 'Первый контакт' }, { value: 'discussion', label: 'Обсуждение' }, { value: 'agreed', label: 'Договоренность' }, { value: 'rejected', label: 'Отказ' }, { value: 'paused', label: 'Отложено' }, { value: 'no_reply', label: 'Нет ответа' }] }];
  if (kind === 'project') return [{ name: 'name', label: 'Название проекта', type: 'text', required: true, wide: true }, { name: 'client_id', label: 'Клиент', type: 'client' }, { name: 'service', label: 'Услуга', type: 'select', options: serviceOptions }, { name: 'stage', label: 'Текущий этап', type: 'select', options: projectStageOptions, default: 'first_contact' }, { name: 'due_date', label: 'Срок проекта', type: 'date' }, { name: 'status', label: 'Состояние', type: 'select', default: 'active', options: [{ value: 'active', label: 'В работе' }, { value: 'paused', label: 'Отложено' }, { value: 'done', label: 'Завершен' }] }];
  if (kind === 'payment' || kind === 'expected_payment' || kind === 'expense' || kind === 'tax' || kind === 'debt') return [{ name: 'title', label: 'Описание', type: 'text', required: true, wide: true }, { name: 'amount', label: 'Сумма, ₽', type: 'number', required: true }, { name: kind === 'expected_payment' || kind === 'tax' || kind === 'debt' ? 'due_date' : 'date', label: kind === 'expected_payment' || kind === 'tax' || kind === 'debt' ? 'Ожидаемая дата / срок' : 'Фактическая дата', type: 'date', required: true }, { name: 'project_id', label: 'Проект', type: 'project' }, { name: 'status', label: 'Состояние', type: 'select', default: kind === 'payment' ? 'received' : kind === 'expected_payment' ? 'expected' : kind === 'tax' ? 'unpaid' : 'open', options: [{ value: 'received', label: 'Получено' }, { value: 'expected', label: 'Ожидается' }, { value: 'paid', label: 'Оплачено' }, { value: 'unpaid', label: 'Не оплачено' }, { value: 'open', label: 'Открыто' }] }, { name: 'note', label: 'Комментарий', type: 'textarea', wide: true }];
  if (kind === 'content') return [{ name: 'title', label: 'Тема публикации', type: 'text', required: true, wide: true }, { name: 'channel', label: 'Площадка', type: 'text' }, { name: 'format', label: 'Формат', type: 'text' }, { name: 'publish_date', label: 'Плановая дата', type: 'date' }, { name: 'publish_time', label: 'Время', type: 'time' }, { name: 'status', label: 'Этап подготовки', type: 'select', default: 'idea', options: [{ value: 'idea', label: 'Идея' }, { value: 'prep', label: 'Подготовка' }, { value: 'draft', label: 'Черновик' }, { value: 'ready', label: 'Готово' }, { value: 'planned', label: 'Запланировано' }, { value: 'published', label: 'Опубликовано' }, { value: 'paused', label: 'Отложено' }] }, { name: 'body', label: 'Текст или заметка', type: 'textarea', wide: true }];
  if (kind === 'reference') return [{ name: 'title', label: 'Название референса', type: 'text', required: true, wide: true }, { name: 'url', label: 'Ссылка на источник', type: 'text', wide: true }, { name: 'categories', label: 'Категории через запятую', type: 'text', wide: true }, { name: 'note', label: 'Примечание', type: 'textarea', wide: true }];
  if (kind === 'material') return [{ name: 'title', label: 'Название материала', type: 'text', required: true, wide: true }, { name: 'url', label: 'Ссылка на файл', type: 'text', wide: true }, { name: 'category', label: 'Категория', type: 'select', options: [{ value: 'brief', label: 'Брифы' }, { value: 'proposal', label: 'Коммерческие предложения' }, { value: 'template', label: 'Шаблоны' }, { value: 'document', label: 'Документы' }] }, { name: 'project_id', label: 'Проект', type: 'project' }, { name: 'note', label: 'Описание', type: 'textarea', wide: true }];
  if (kind === 'estimate') return [{ name: 'title', label: 'Название сметы', type: 'text', required: true, wide: true }, { name: 'project_id', label: 'Проект', type: 'project' }, { name: 'status', label: 'Состояние', type: 'select', default: 'draft', options: [{ value: 'draft', label: 'Черновик' }, { value: 'sent', label: 'Отправлена клиенту' }, { value: 'approved', label: 'Согласована' }] }, { name: 'items', label: 'Работы — услуга; количество; цена за единицу', type: 'textarea', wide: true, placeholder: 'Дизайн главной страницы; 1; 25000\nАдаптивная версия; 2; 5000' }];
  return [{ name: 'name', label: 'Название услуги или работы', type: 'text', required: true, wide: true }, { name: 'unit', label: 'Единица измерения', type: 'text', placeholder: 'час / страница / блок' }, { name: 'rate', label: 'Ставка, ₽', type: 'number' }];
}
const serviceOptions: Field['options'] = [{ value: 'landing', label: 'Лендинг' }, { value: 'multi_page', label: 'Многостраничный сайт' }, { value: 'ecommerce', label: 'Интернет-магазин' }, { value: 'design_only', label: 'Только дизайн' }];
const projectStageOptions: NonNullable<Field['options']> = ['Первый контакт', 'Бриф', 'КП', 'Анализ', 'Прототип', 'Мудборд', 'Дизайн-концепции', 'Дизайн-макет', 'Верстка', 'Завершен'].map((label, index) => ({ value: `stage_${index}`, label }));

function EmptyState({ section, onCreate }: { section: string; onCreate: () => void }) {
  const text: Record<string, [string, string]> = { tasks: ['Задачи пока не добавлены', 'Добавьте задачу — она появится в общем списке и плане дня.'], projects: ['Проекты появятся здесь', 'Создайте проект и свяжите его с клиентом, этапами и задачами.'], clients: ['Клиентская база пока пуста', 'Добавьте клиента или создайте его из карточки потенциального заказа.'], leads: ['Пока нет потенциальных клиентов', 'Сохраните контакт и запланируйте следующее действие.'], money: ['Финансовых записей пока нет', 'Добавьте фактический платеж, расход или ожидаемую оплату.'], content: ['Контент-план пока пуст', 'Сохраните идею и проведите ее по этапам до публикации.'], design: ['Библиотека референсов пуста', 'Добавьте ссылку на пример интерфейса и присвойте категории.'], materials: ['Материалов пока нет', 'Сохраните документ, ссылку или рабочую заметку.'], calculator: ['Расчетов пока нет', 'Создайте смету или добавьте позицию в прайс.'] };
  const [title, description] = text[section] || ['Пока пусто', 'Добавьте первую запись.'];
  return <div className="empty-state"><div className="empty-illustration"><span /><span /><span /><Icon name={sectionIcon[section] || 'layers'} size={24} /></div><h2>{title}</h2><p>{description}</p><button className="primary-button" onClick={onCreate}><Icon name="plus" size={16} />{createLabel(section)}</button></div>;
}

function EmptyInline({ text, action, onAction }: { text: string; action: string; onAction: () => void }) { return <div className="empty-inline"><p>{text}</p><button className="text-button" onClick={onAction}><Icon name="plus" size={14} />{action}</button></div>; }

function AssistantPage() { return <div className="page-heading"><div><div className="eyebrow">ПОМОЩЬ И ИДЕИ</div><h1>Ассистент</h1><p>Интеллектуальные функции можно подключить отдельно позже.</p></div><section className="assistant-state"><div className="assistant-icon"><Icon name="spark" size={24} /></div><span className="panel-kicker">СЕЙЧАС</span><h2>ИИ пока не подключен</h2><p>Здесь появится помощник по веб-дизайну. Сейчас WorkHub не отправляет ваши записи внешним ИИ-сервисам.</p></section></div>; }

function SettingsPage({ onSignOut, monthlyGoal, setMonthlyGoal }: { onSignOut: () => void; monthlyGoal: string; setMonthlyGoal: (value: string) => void }) {
  const [theme, setTheme] = useState(localStorage.getItem('workhub.theme') || 'light');
  const [accent, setAccent] = useState(localStorage.getItem('workhub.accent') || '#252628');
  function applyTheme(next: string) { setTheme(next); localStorage.setItem('workhub.theme', next); document.documentElement.dataset.theme = next; save(); }
  function applyAccent(next: string) { setAccent(next); localStorage.setItem('workhub.accent', next); document.documentElement.style.setProperty('--accent', next); save(); }
  function save() { localStorage.setItem('workhub.appearance.v1', JSON.stringify({ theme: document.documentElement.dataset.theme || 'light', accent: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() })); }
  return <><div className="page-heading"><div><div className="eyebrow">ВАШЕ ПРОСТРАНСТВО</div><h1>Настройки</h1><p>Настройте WorkHub под свой рабочий ритм.</p></div></div><div className="settings-grid"><section className="panel settings-panel"><div className="settings-icon"><Icon name="sun" size={18} /></div><div><h2>Внешний вид</h2><p>Тема интерфейса и основной цвет действий.</p></div><div className="settings-controls"><div className="setting-label">Тема</div><div className="segmented-control"><button className={theme === 'light' ? 'selected' : ''} onClick={() => applyTheme('light')}><Icon name="sun" size={14} />Светлая</button><button className={theme === 'dark' ? 'selected' : ''} onClick={() => applyTheme('dark')}><Icon name="moon" size={14} />Темная</button><button className={theme === 'system' ? 'selected' : ''} onClick={() => applyTheme('system')}>Системная</button></div><div className="setting-label accent-label">Акцент</div><div className="accent-options">{[['#252628', 'Графитовый'], ['#8d2439', 'Бордовый'], ['#465a78', 'Синий'], ['#477263', 'Зеленый']].map(([value, name]) => <button key={value} className={`accent-choice ${accent === value ? 'chosen' : ''}`} style={{ '--swatch': value } as React.CSSProperties} aria-label={name} title={name} onClick={() => applyAccent(value)}><span /></button>)}</div></div></section><section className="panel settings-panel"><div className="settings-icon"><Icon name="target" size={18} /></div><div><h2>Цель на месяц</h2><p>Главная считает только фактические проектные оплаты.</p></div><label className="goal-input"><input type="number" min="0" step="1000" inputMode="numeric" value={monthlyGoal} onChange={(event) => setMonthlyGoal(event.target.value)} aria-label="Целевая сумма на месяц" /><span>₽</span></label></section><section className="panel settings-panel account-settings"><div className="settings-icon"><Icon name="user" size={18} /></div><div><h2>Доступ к аккаунту</h2><p>Вы вошли как владелец WorkHub.</p></div><button className="secondary-button" onClick={onSignOut}><Icon name="logout" size={15} />Выйти</button></section><div className="settings-caption">Настройки темы и цели сохраняются в этом браузере. Данные WorkHub хранятся в защищенной облачной базе.</div></div></>;
}

function sectionForKind(kind: Kind) { return Object.entries(SECTION_KINDS).find(([, values]) => values.includes(kind))?.[0] || 'home'; }
function kindTabs(section: string): [Kind | 'all', string][] { if (section === 'projects') return [['project', 'Проекты'], ['client', 'Клиенты']]; if (section === 'calculator') return [['estimate', 'Сметы'], ['price_item', 'Прайс']]; return [['all', 'Все операции'], ['payment', 'Поступления'], ['expected_payment', 'Ожидаются'], ['expense', 'Расходы'], ['tax', 'Налоги'], ['debt', 'Долги']]; }
function defaultKindForSection(section: string): Kind { return section === 'projects' ? 'project' : section === 'leads' ? 'lead' : section === 'money' ? 'payment' : section === 'content' ? 'content' : section === 'design' ? 'reference' : section === 'materials' ? 'material' : section === 'calculator' ? 'estimate' : 'task'; }
function createLabel(section: string) { return section === 'home' || section === 'tasks' ? 'Добавить задачу' : section === 'projects' ? 'Создать проект' : section === 'leads' ? 'Добавить клиента' : section === 'money' ? 'Добавить запись' : section === 'content' ? 'Добавить публикацию' : section === 'design' ? 'Добавить референс' : section === 'materials' ? 'Добавить материал' : section === 'calculator' ? 'Новый расчет' : 'Создать'; }
function sectionDescription(section: string) { return ({ tasks: 'Планируйте работу и держите сроки под контролем.', projects: 'Заказы, клиенты и этапы работы в одном месте.', leads: 'Потенциальные заказчики и следующие действия.', money: 'Поступления, ожидания, расходы, налоги и долги.', content: 'Идеи, черновики и календарь ручных публикаций.', design: 'Референсы по типам блоков и проектам.', materials: 'Документы, ссылки и рабочие заметки.', calculator: 'Сметы проектов и редактируемый прайс.' } as Record<string, string>)[section] || ''; }
function syncLabel(status: string) { return ({ saved: 'Синхронизировано', syncing: 'Синхронизация…', offline: 'Нет соединения', error: 'Не удалось сохранить', local: 'Локально сохранено' } as Record<string, string>)[status] || 'Сохранено'; }
function dueCount(tasks: WorkRecord[]) { return tasks.filter((task) => !['done', 'archived'].includes(String(task.data.status))).length; }
function priorityRank(value: unknown) { return value === 'high' ? 3 : value === 'normal' ? 2 : value === 'low' ? 1 : 0; }
function projectName(records: WorkRecord[], id: unknown) { return records.find((record) => record.kind === 'project' && record.id === id)?.data.name as string | undefined; }
function clientName(records: WorkRecord[], id: unknown) { return records.find((record) => record.kind === 'client' && record.id === id)?.data.name as string | undefined; }
function addDays(value: string, count: number) { const date = new Date(`${value}T12:00:00`); date.setDate(date.getDate() + count); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function parseEstimateLines(value: string) { return value.split(/\n+/).map((line) => line.split(/[;\t|]/).map((part) => part.trim())).filter((parts) => parts[0] && Number(parts[1]) > 0 && Number(parts[2]) >= 0).map(([name, quantity, unit_price]) => ({ name, quantity: Number(quantity), unit_price: Number(unit_price) })); }
function nextDate(value: string, interval: string) { const date = new Date(`${value}T12:00:00`); if (interval === 'daily') date.setDate(date.getDate() + 1); else if (interval === 'weekly') date.setDate(date.getDate() + 7); else if (interval === 'monthly') { const day = date.getDate(); date.setDate(1); date.setMonth(date.getMonth() + 1); date.setDate(Math.min(day, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate())); } return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function addMonth(value: string, delta: number) { const date = new Date(`${value.slice(0, 7)}-01T12:00:00`); date.setMonth(date.getMonth() + delta); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`; }
function plural(value: number, one: string, few: string, many: string) { const ten = value % 10; const hundred = value % 100; return hundred >= 11 && hundred <= 14 ? many : ten === 1 ? one : ten >= 2 && ten <= 4 ? few : many; }
function projectStageLabel(value: unknown) { const index = typeof value === 'string' ? Number(value.replace('stage_', '')) : -1; return Number.isInteger(index) && index >= 0 && projectStageOptions[index] ? projectStageOptions[index].label : typeof value === 'string' && value ? value : 'Первый контакт'; }

export default App;
