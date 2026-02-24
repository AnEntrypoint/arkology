import { webjsx } from 'https://webjsx.org/dist/webjsx.js';
import { api, PageHeader, Table, TR } from './components.js';

export async function renderTax(el) {
  const tax = await api('/tax') || {};
  const elec = (tax.electric || {}).properties || [];
  const sin = (tax.sin || {}).properties || [];
  const months = (tax.electric || {}).months || [];
  const elecRows = elec.map(p => TR([
    'P'+p.property_id,
    ...p.values.map(v => v > 0 ? '$'+v : '-')
  ], p.property_id));
  const sinRows = sin.map(p => TR([
    'P'+p.property_id,
    ...p.values.map(v => v > 0 ? '$'+v : '-')
  ], p.property_id));
  webjsx.applyDiff(el, webjsx.html`<div>
    ${PageHeader({ title:'Tax Ledger', sub:'Electric + Sin tax per property by month' })}
    <div class="mb-8">
      <h3 class="text-lg font-semibold mb-3" style="color:#f97316">Electric Tax</h3>
      ${Table({ headers:['Property',...months], rows:elecRows })}
    </div>
    <div>
      <h3 class="text-lg font-semibold mb-3" style="color:#9333ea">Sin Tax</h3>
      ${Table({ headers:['Property',...months], rows:sinRows })}
    </div>
  </div>`);
}

export async function renderCalendar(el) {
  const cal = await api('/calendar') || {};
  const weeks = cal.weekly || [];
  const rec = cal.recurring || {};
  const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const dayLabels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  webjsx.applyDiff(el, webjsx.html`<div>
    ${PageHeader({ title:'Community Calendar', sub:'Weekly recurring schedule' })}
    <div class="glass rounded-xl p-5 mb-6 glow-purple">
      <h3 class="text-lg font-semibold mb-3" style="color:#f97316">Every Week</h3>
      <div class="grid grid-cols-7 gap-2">
        ${dayLabels.map((lbl,i) => webjsx.html`
          <div class="bg-black/30 rounded-lg p-3 border border-purple-900/30">
            <p class="text-xs text-orange-400 font-bold mb-1">${lbl}</p>
            <p class="text-xs text-gray-300">${rec[days[i]]||''}</p>
          </div>`)}
      </div>
    </div>
    ${weeks.map(w => webjsx.html`
      <div class="glass rounded-xl p-5 mb-4 glow-orange">
        <h3 class="text-lg font-semibold mb-3" style="color:#9333ea">Week ${w.week}</h3>
        <div class="grid grid-cols-7 gap-2">
          ${dayLabels.map((lbl,i) => webjsx.html`
            <div class="bg-black/30 rounded-lg p-3 border border-orange-900/20">
              <p class="text-xs text-purple-400 font-bold mb-1">${lbl}</p>
              <p class="text-xs text-gray-300">${w[days[i]]||''}</p>
            </div>`)}
        </div>
      </div>`)}
  </div>`);
}

export async function renderCrimeDescriptions(el) {
  const data = await api('/crime-descriptions') || {};
  const crimes = Object.entries(data).filter(([k]) => k !== 'total_crime_types' && k !== 'note' && k !== 'crimes');
  const list = data.crimes || crimes.map(([id, c]) => ({ id, ...c }));
  const sevColor = s => s==='Critical'?'text-red-400':s==='High'?'text-orange-400':s==='Medium'?'text-yellow-400':'text-green-400';
  webjsx.applyDiff(el, webjsx.html`<div>
    ${PageHeader({ title:'Crime Classification', sub:`${data.total_crime_types||list.length} crime types defined` })}
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      ${list.map(c => webjsx.html`
        <div class="stat-card rounded-xl p-4">
          <div class="flex justify-between items-start mb-2">
            <span class="text-xs text-gray-500">Crime #${c.id}</span>
            ${c.severity ? webjsx.html`<span class="text-xs px-2 py-0.5 rounded bg-black/40 ${sevColor(c.severity)}">${c.severity}</span>` : ''}
          </div>
          <p class="font-semibold text-purple-200 text-sm">${c.name||'Unnamed'}</p>
          ${c.max_months ? webjsx.html`<p class="text-xs text-gray-500 mt-1">Max: ${c.max_months} months</p>` : ''}
          ${c.victim_id ? webjsx.html`<p class="text-xs text-orange-400 mt-1">Victim: #${c.victim_id} / Def: #${c.defendant_id}</p>` : ''}
        </div>`)}
    </div>
  </div>`);
}
