export type Kind =
  | 'task' | 'client' | 'lead' | 'project' | 'payment' | 'expected_payment'
  | 'expense' | 'tax' | 'debt' | 'content' | 'reference' | 'material'
  | 'estimate' | 'price_item';

export type RecordValue = string | number | boolean | null | string[] | RecordValue[] | { [key: string]: RecordValue };
export type RecordData = Record<string, RecordValue>;

export interface WorkRecord {
  id: string;
  owner_id: string;
  kind: Kind;
  data: RecordData;
  revision: number;
  created_at: string;
  updated_at: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  expires_at?: number;
  user: { id: string; email?: string };
}

export interface RecordInput {
  kind: Kind;
  data: RecordData;
}

export const SECTION_KINDS: Record<string, Kind[]> = {
  tasks: ['task'],
  projects: ['project'],
  clients: ['client'],
  leads: ['lead'],
  money: ['payment', 'expected_payment', 'expense', 'tax', 'debt'],
  content: ['content'],
  design: ['reference'],
  materials: ['material'],
  calculator: ['estimate', 'price_item'],
};

export const KIND_LABEL: Record<Kind, string> = {
  task: 'Задача', client: 'Клиент', lead: 'Потенциальный клиент', project: 'Проект',
  payment: 'Поступление', expected_payment: 'Ожидаемая оплата', expense: 'Расход',
  tax: 'Налог', debt: 'Долг', content: 'Публикация', reference: 'Референс',
  material: 'Материал', estimate: 'Смета', price_item: 'Позиция прайса',
};

export const SECTIONS = [
  { id: 'home', label: 'Главная', group: 'Рабочее' },
  { id: 'tasks', label: 'Задачи', group: 'Рабочее' },
  { id: 'projects', label: 'Клиенты и проекты', group: 'Рабочее' },
  { id: 'leads', label: 'Поиск клиентов', group: 'Рабочее' },
  { id: 'money', label: 'Деньги', group: 'Рабочее' },
  { id: 'content', label: 'Контент', group: 'Создание' },
  { id: 'design', label: 'Дизайн', group: 'Создание' },
  { id: 'materials', label: 'Материалы', group: 'Создание' },
  { id: 'calculator', label: 'Калькулятор', group: 'Создание' },
  { id: 'assistant', label: 'Ассистент', group: 'Прочее' },
  { id: 'settings', label: 'Настройки', group: 'Прочее' },
] as const;

export function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function formatDate(value: unknown, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) {
  if (typeof value !== 'string' || !value) return 'Без срока';
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return 'Без срока';
  return new Intl.DateTimeFormat('ru-RU', options).format(date);
}

export function money(value: unknown) {
  const amount = Number(value);
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Number.isFinite(amount) ? amount : 0) + ' ₽';
}
