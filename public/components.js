import { webjsx } from 'https://webjsx.org/dist/webjsx.js';

export const API = 'http://localhost:5000/api';

export async function api(path) {
  try {
    const r = await fetch(API + path);
    return r.ok ? r.json() : null;
  } catch { return null; }
}

export function StatCard({ title, value, sub, color = 'purple' }) {
  const border = color === 'orange' ? '#f97316' : '#9333ea';
  const glow = color === 'orange' ? 'rgba(249,115,22,0.25)' : 'rgba(147,51,234,0.25)';
  return webjsx.html`
    <div class="stat-card rounded-xl p-5 flex flex-col gap-2" style="border-color:${border};box-shadow:0 0 18px ${glow}">
      <p class="text-xs text-gray-400 uppercase tracking-widest">${title}</p>
      <p class="text-3xl font-bold" style="color:${border}">${value}</p>
      ${sub ? webjsx.html`<p class="text-xs text-gray-500">${sub}</p>` : ''}
    </div>
  `;
}

export function PageHeader({ title, sub }) {
  return webjsx.html`
    <div class="mb-6">
      <h2 class="text-2xl font-bold grad-text">${title}</h2>
      ${sub ? webjsx.html`<p class="text-sm text-gray-400 mt-1">${sub}</p>` : ''}
    </div>
  `;
}

export function Table({ headers, rows }) {
  return webjsx.html`
    <div class="glass rounded-xl overflow-hidden glow-purple">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-purple-900/50">
            ${headers.map(h => webjsx.html`<th class="px-4 py-3 text-left text-purple-300 font-medium text-xs uppercase tracking-wider">${h}</th>`)}
          </tr>
        </thead>
        <tbody>
          ${rows.length === 0 ? webjsx.html`<tr><td colspan="${headers.length}" class="px-4 py-8 text-center text-gray-500">No data</td></tr>` : rows}
        </tbody>
      </table>
    </div>
  `;
}

export function TR(cells, key = '') {
  return webjsx.html`
    <tr class="table-row border-b border-gray-800/30" key="${key}">
      ${cells.map(c => webjsx.html`<td class="px-4 py-2.5 text-gray-300">${c ?? '-'}</td>`)}
    </tr>
  `;
}
