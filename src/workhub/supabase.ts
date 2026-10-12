import type { AuthSession, RecordInput, WorkRecord } from './model';

const API_URL = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
const PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SESSION_KEY = 'workhub.auth.session.v1';
const LOCAL_RECORDS_KEY = 'workhub.local.records.v1';

export const backendConfigured = Boolean(API_URL && PUBLISHABLE_KEY);

export class BackendError extends Error {
  constructor(message: string, public status?: number, public code?: string) {
    super(message);
    this.name = 'BackendError';
  }
}

function readSession(): AuthSession | null {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') as AuthSession | null;
    if (!session?.access_token || !session.refresh_token || !session.user?.id) return null;
    return session;
  } catch {
    return null;
  }
}

function storeSession(session: AuthSession | null) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
}

let session = readSession();
let refreshPromise: Promise<AuthSession | null> | null = null;

function localRecords(): WorkRecord[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_RECORDS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed as WorkRecord[] : [];
  } catch {
    return [];
  }
}

function saveLocalRecords(records: WorkRecord[]) {
  localStorage.setItem(LOCAL_RECORDS_KEY, JSON.stringify(records));
}

function localFileRequest<T>(operation: (store: IDBObjectStore) => IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    const opening = indexedDB.open('workhub.local.files.v1', 1);
    opening.onupgradeneeded = () => opening.result.createObjectStore('files');
    opening.onerror = () => reject(opening.error || new Error('Не удалось открыть локальное хранилище файлов.'));
    opening.onsuccess = () => {
      const database = opening.result;
      const transaction = database.transaction('files', 'readwrite');
      const request = operation(transaction.objectStore('files'));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Не удалось обработать файл.'));
      transaction.oncomplete = () => database.close();
      transaction.onerror = () => { database.close(); reject(transaction.error || new Error('Не удалось сохранить файл.')); };
    };
  });
}

async function authRequest(path: string, body: object) {
  if (!backendConfigured) throw new BackendError('Облачная база еще не подключена.');
  const response = await fetch(`${API_URL}/auth/v1/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: PUBLISHABLE_KEY! },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new BackendError(payload.msg || payload.message || payload.error_description || 'Не удалось выполнить вход.', response.status, payload.code);
  return payload;
}

async function refreshSession() {
  if (!session?.refresh_token) return null;
  if (refreshPromise) return refreshPromise;
  refreshPromise = authRequest('token?grant_type=refresh_token', { refresh_token: session.refresh_token })
    .then((value) => {
      session = { ...value, expires_at: Math.floor(Date.now() / 1000) + Number(value.expires_in || 3600) };
      storeSession(session);
      return session;
    })
    .catch(() => {
      session = null;
      storeSession(null);
      return null;
    })
    .finally(() => { refreshPromise = null; });
  return refreshPromise;
}

async function activeSession() {
  if (!session) return null;
  if (!session.expires_at || session.expires_at - Math.floor(Date.now() / 1000) < 45) return refreshSession();
  return session;
}

async function request(path: string, init: RequestInit = {}) {
  if (!backendConfigured) throw new BackendError('Облачная база еще не подключена.');
  const current = await activeSession();
  if (!current) throw new BackendError('Сеанс завершен. Войдите снова.', 401);
  const headers = new Headers(init.headers);
  headers.set('apikey', PUBLISHABLE_KEY!);
  headers.set('Authorization', `Bearer ${current.access_token}`);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${API_URL}/rest/v1/${path}`, { ...init, headers });
  if (response.status === 401) {
    session = null;
    storeSession(null);
  }
  const body = await response.text();
  const payload = body ? JSON.parse(body) : null;
  if (!response.ok) throw new BackendError(payload?.message || payload?.hint || 'Не удалось сохранить данные.', response.status, payload?.code);
  return payload;
}

export const backend = {
  session: () => activeSession(),
  signIn: async (email: string, password: string) => {
    const value = await authRequest('token?grant_type=password', { email, password });
    session = { ...value, expires_at: Math.floor(Date.now() / 1000) + Number(value.expires_in || 3600) };
    storeSession(session);
    return session;
  },
  signOut: async () => {
    const current = await activeSession();
    if (current && backendConfigured) {
      try {
        await fetch(`${API_URL}/auth/v1/logout`, {
          method: 'POST',
          headers: { apikey: PUBLISHABLE_KEY!, Authorization: `Bearer ${current.access_token}` },
        });
      } catch { /* local session is cleared regardless */ }
    }
    session = null;
    storeSession(null);
  },
  list: () => backendConfigured
    ? request('workhub_records?select=id,owner_id,kind,data,revision,created_at,updated_at&order=updated_at.desc') as Promise<WorkRecord[]>
    : Promise.resolve(localRecords().sort((a, b) => b.updated_at.localeCompare(a.updated_at))),
  create: async (input: RecordInput) => {
    if (!backendConfigured) {
      const now = new Date().toISOString();
      const created: WorkRecord = { id: crypto.randomUUID(), owner_id: 'local', kind: input.kind, data: input.data, revision: 1, created_at: now, updated_at: now };
      saveLocalRecords([created, ...localRecords()]);
      return created;
    }
    const current = await activeSession();
    if (!current) throw new BackendError('Войдите, чтобы сохранить запись.', 401);
    const rows = await request('workhub_records?select=id,owner_id,kind,data,revision,created_at,updated_at', {
      method: 'POST', headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ owner_id: current.user.id, kind: input.kind, data: input.data }),
    }) as WorkRecord[];
    return rows[0];
  },
  update: async (record: WorkRecord, data: RecordInput['data']) => {
    if (!backendConfigured) {
      const records = localRecords();
      const current = records.find((item) => item.id === record.id);
      if (!current || current.revision !== record.revision) throw new BackendError('Запись уже изменилась. Обновите список и повторите действие.', 409);
      const updated = { ...current, data, revision: current.revision + 1, updated_at: new Date().toISOString() };
      saveLocalRecords(records.map((item) => item.id === updated.id ? updated : item));
      return updated;
    }
    const rows = await request(`workhub_records?id=eq.${encodeURIComponent(record.id)}&revision=eq.${record.revision}&select=id,owner_id,kind,data,revision,created_at,updated_at`, {
      method: 'PATCH', headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ data, revision: record.revision + 1, updated_at: new Date().toISOString() }),
    }) as WorkRecord[];
    if (!rows.length) throw new BackendError('Эту запись изменили на другом устройстве. Обновите список и выберите актуальную версию.', 409);
    return rows[0];
  },
  upload: async (file: File) => {
    if (!backendConfigured) {
      if (file.size > 20 * 1024 * 1024) throw new BackendError('Размер файла не должен превышать 20 МБ.');
      const path = `local/${crypto.randomUUID()}`;
      await localFileRequest((store) => store.put(file, path));
      return path;
    }
    const current = await activeSession();
    if (!current) throw new BackendError('Войдите, чтобы загрузить файл.', 401);
    if (file.size > 20 * 1024 * 1024) throw new BackendError('Размер файла не должен превышать 20 МБ.');
    const cleanName = file.name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(-100) || 'file';
    const path = `${current.user.id}/${crypto.randomUUID()}-${cleanName}`;
    const response = await fetch(`${API_URL}/storage/v1/object/workhub-files/${path.split('/').map(encodeURIComponent).join('/')}`, {
      method: 'POST',
      headers: { apikey: PUBLISHABLE_KEY!, Authorization: `Bearer ${current.access_token}`, 'Content-Type': file.type || 'application/octet-stream', 'x-upsert': 'false' },
      body: file,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new BackendError(payload.message || payload.error || 'Не удалось загрузить файл.', response.status, payload.statusCode);
    return path;
  },
  signedFileUrl: async (path: string) => {
    if (!backendConfigured) {
      const file = await localFileRequest<File | undefined>((store) => store.get(path));
      if (!file) throw new BackendError('Локальный файл не найден в этом браузере.');
      const url = URL.createObjectURL(file);
      window.setTimeout(() => URL.revokeObjectURL(url), 5 * 60 * 1000);
      return url;
    }
    const current = await activeSession();
    if (!current) throw new BackendError('Войдите, чтобы открыть файл.', 401);
    const response = await fetch(`${API_URL}/storage/v1/object/sign/workhub-files/${path.split('/').map(encodeURIComponent).join('/')}`, {
      method: 'POST', headers: { apikey: PUBLISHABLE_KEY!, Authorization: `Bearer ${current.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ expiresIn: 300 }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new BackendError(payload.message || 'Не удалось открыть файл.', response.status, payload.statusCode);
    return new URL(payload.signedURL, API_URL).toString();
  },
};
