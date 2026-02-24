export const API = '/api';

export async function api(path, opts = {}) {
  try {
    const r = await fetch(API + path, opts);
    return r.ok ? r.json() : null;
  } catch { return null; }
}

export async function apiPut(path, data) {
  return api(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

export async function apiPost(path, data) {
  return api(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

export async function apiDelete(path) {
  return api(path, { method: 'DELETE' });
}

function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') el.className = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'style' && typeof v === 'string') el.setAttribute('style', v);
    else el.setAttribute(k, v);
  }
  for (const c of children.flat(Infinity).filter(Boolean)) {
    if (c instanceof Node) el.appendChild(c);
    else el.appendChild(document.createTextNode(String(c)));
  }
  return el;
}

export function applyDiff(container, newContent) {
  if (typeof newContent === 'string') {
    container.innerHTML = newContent;
  } else if (newContent instanceof Node) {
    container.replaceChildren(newContent);
  } else if (Array.isArray(newContent)) {
    container.replaceChildren(...newContent.filter(Boolean));
  }
}

export function StatCard({ title, value, sub, color = 'purple' }) {
  const border = color === 'orange' ? '#f97316' : '#9333ea';
  const glow = color === 'orange' ? 'rgba(249,115,22,0.25)' : 'rgba(147,51,234,0.25)';
  return h('div', { class: 'stat-card rounded-xl p-5 flex flex-col gap-2', style: `border-color:${border};box-shadow:0 0 18px ${glow}` },
    h('p', { class: 'text-xs text-gray-400 uppercase tracking-widest' }, title),
    h('p', { class: 'text-3xl font-bold', style: `color:${border}` }, String(value)),
    sub ? h('p', { class: 'text-xs text-gray-500' }, sub) : null
  );
}

export function PageHeader({ title, sub }) {
  return h('div', { class: 'mb-6' },
    h('h2', { class: 'text-2xl font-bold grad-text' }, title),
    sub ? h('p', { class: 'text-sm text-gray-400 mt-1' }, sub) : null
  );
}

export function Table({ headers, rows }) {
  const thead = h('thead', {},
    h('tr', { class: 'border-b border-purple-900/50' },
      ...headers.map(hh => h('th', { class: 'px-4 py-3 text-left text-purple-300 font-medium text-xs uppercase tracking-wider' }, hh))
    )
  );
  const tbody = h('tbody', {},
    rows.length === 0
      ? h('tr', {}, h('td', { colspan: String(headers.length), class: 'px-4 py-8 text-center text-gray-500' }, 'No data'))
      : rows.filter(Boolean)
  );
  return h('div', { class: 'glass rounded-xl overflow-hidden glow-purple' },
    h('table', { class: 'w-full text-sm' }, thead, tbody)
  );
}

export function TR(cells, key = '') {
  return h('tr', { class: 'table-row border-b border-gray-800/30', key: key },
    ...cells.map(c => h('td', { class: 'px-4 py-2.5 text-gray-300' }, c ?? '-'))
  );
}

export function EditableInput(value, onSave, placeholder = '', type = 'text') {
  const input = h('input', {
    type,
    value: value ?? '',
    placeholder,
    class: 'px-2 py-1 rounded text-sm bg-black/30 border border-purple-900/30 focus:border-purple-500 focus:outline-none',
    style: 'color:#e2e8f0;min-width:60px'
  });
  input.addEventListener('blur', () => {
    const newVal = type === 'number' ? parseFloat(input.value) || 0 : input.value;
    if (newVal !== value) onSave(newVal);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') input.blur();
  });
  return input;
}

export function EditableSelect(value, options, onSave) {
  const select = h('select', {
    class: 'px-2 py-1 rounded text-sm bg-black/30 border border-purple-900/30 focus:border-purple-500 focus:outline-none',
    style: 'color:#e2e8f0'
  });
  options.forEach(opt => {
    const optEl = h('option', { value: opt.value }, opt.label);
    if (opt.value === value) optEl.selected = true;
    select.appendChild(optEl);
  });
  select.addEventListener('change', () => onSave(select.value));
  return select;
}

export function EditableCheckbox(checked, onSave) {
  const cb = h('input', { type: 'checkbox', checked, class: 'w-4 h-4 rounded' });
  cb.addEventListener('change', () => onSave(cb.checked));
  return cb;
}

export function ActionButton(text, onClick, color = 'orange') {
  return h('button', {
    class: `text-xs px-2 py-1 rounded border ${color === 'red' ? 'border-red-800/50 text-red-400 hover:text-red-300' : 'border-orange-800/50 text-orange-400 hover:text-orange-300'}`,
    onclick: onClick
  }, text);
}

export function Modal(title, content, onClose) {
  const overlay = h('div', {
    class: 'fixed inset-0 bg-black/70 flex items-center justify-center z-50',
    onclick: (e) => { if (e.target === overlay) onClose(); }
  },
    h('div', { class: 'glass rounded-xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto' },
      h('div', { class: 'flex justify-between items-center mb-4' },
        h('h3', { class: 'text-lg font-semibold grad-text' }, title),
        h('button', { class: 'text-gray-400 hover:text-white', onclick: onClose }, 'X')
      ),
      content
    )
  );
  return overlay;
}

export function FormField(label, input) {
  return h('div', { class: 'mb-4' },
    h('label', { class: 'block text-xs text-gray-400 mb-1' }, label),
    input
  );
}

export function FormInput(name, value, placeholder = '', type = 'text') {
  return h('input', {
    type,
    name,
    value: value ?? '',
    placeholder,
    class: 'w-full px-3 py-2 rounded-lg text-sm bg-black/30 border border-purple-900/30 focus:border-purple-500 focus:outline-none',
    style: 'color:#e2e8f0'
  });
}

export function FormSelect(name, options, value) {
  const select = h('select', {
    name,
    class: 'w-full px-3 py-2 rounded-lg text-sm bg-black/30 border border-purple-900/30 focus:border-purple-500 focus:outline-none',
    style: 'color:#e2e8f0'
  });
  options.forEach(opt => {
    const optEl = h('option', { value: opt.value }, opt.label);
    if (opt.value === value) optEl.selected = true;
    select.appendChild(optEl);
  });
  return select;
}

export function getFormData(form) {
  const data = {};
  new FormData(form).forEach((v, k) => {
    const num = parseFloat(v);
    data[k] = isNaN(num) || v === '' ? v : num;
  });
  return data;
}
