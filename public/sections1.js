import { webjsx } from 'https://webjsx.org/dist/webjsx.js';
import { api, StatCard, PageHeader, Table, TR } from './components.js';

export async function renderDashboard(el) {
  const stats = await api('/stats');
  if (!stats) { el.innerHTML = '<p class="text-red-400 p-6">Server offline. Start: python app_server.py</p>'; return; }
  webjsx.applyDiff(el, webjsx.html`<div>
    ${PageHeader({ title: 'Dashboard', sub: 'Ark Community Overview' })}
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      ${StatCard({ title: 'Total Residents', value: stats.total_residents, sub: `${stats.alive} alive` })}
      ${StatCard({ title: 'Voting Members', value: stats.voting, sub: 'eligible voters', color: 'orange' })}
      ${StatCard({ title: 'Properties', value: stats.properties, sub: `$${stats.total_property_value}K value` })}
      ${StatCard({ title: 'Bond Debt', value: `$${(stats.total_bond_debt/1000).toFixed(0)}K`, sub: `${stats.active_bonds} bonds`, color: 'orange' })}
      ${StatCard({ title: 'Male / Female', value: `${stats.male} / ${stats.female}`, sub: 'gender split' })}
      ${StatCard({ title: 'Charities', value: stats.charities, sub: `$${stats.total_charity_budget}/mo`, color: 'orange' })}
      ${StatCard({ title: 'Net Payments', value: `$${stats.total_payments}`, sub: 'monthly UBI net' })}
      ${StatCard({ title: 'Community Wealth', value: `$${stats.total_wealth}`, sub: 'aggregate', color: 'orange' })}
    </div>
  </div>`);
}

export async function renderResidents(el, q = '') {
  const url = q ? `/residents?q=${encodeURIComponent(q)}` : '/residents';
  const data = await api(url) || [];
  const rows = data.map(r => TR([
    r.res_id, `${r.first_name} ${r.last_name}`.trim() || '-',
    r.email || '-', r.gender, r.age,
    r.alive ? '✓' : '✗', r.voting ? '✓' : '✗',
    r.payment !== undefined ? `$${r.payment}` : '-',
    webjsx.html`<button onclick="window.delRes(${r.res_id})" class="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded border border-red-800/50">Del</button>`
  ], r.res_id));
  webjsx.applyDiff(el, webjsx.html`<div>
    ${PageHeader({ title: 'Residents', sub: `${data.length} records` })}
    <div class="flex gap-3 mb-4">
      <input type="text" placeholder="Search name or email..." value="${q}"
        class="flex-1 px-4 py-2 rounded-lg text-sm focus:outline-none focus:border-purple-600"
        style="background:#12121a;border:1px solid #1e1030;color:#e2e8f0"
        oninput="window.searchRes(this.value)" />
      <button onclick="window.addRes()" class="btn-orange px-4 py-2 rounded-lg text-sm font-medium">+ Add</button>
    </div>
    ${Table({ headers: ['ID','Name','Email','Gender','Age','Alive','Voting','Payment',''], rows })}
  </div>`);
}

export async function renderProperties(el) {
  const data = await api('/properties') || [];
  const clr = { Res:'#9333ea', Com:'#f97316', Indus:'#06b6d4', Church:'#eab308', Public:'#22c55e', Charity:'#ec4899', School:'#8b5cf6' };
  const rows = data.map(p => TR([
    p.id, p.address,
    webjsx.html`<span class="px-2 py-0.5 rounded text-xs" style="background:${(clr[p.used_for]||'#6b7280')}22;color:${clr[p.used_for]||'#6b7280'}">${p.used_for}</span>`,
    p.sqft ? p.sqft.toLocaleString()+' sqft' : '-',
    p.value_k ? `$${p.value_k}K` : '-',
    p.prop_tax ? `$${p.prop_tax}/mo` : '-',
    p.owner_id || '-', p.date || '-'
  ], p.id));
  webjsx.applyDiff(el, webjsx.html`<div>
    ${PageHeader({ title: 'Properties', sub: `${data.length} properties` })}
    ${Table({ headers: ['ID','Address','Type','Size','Value','Tax','Owner','Date'], rows })}
  </div>`);
}

export async function renderBonds(el) {
  const res = await api('/bonds') || { bonds: [], summary: {} };
  const { bonds, summary } = res;
  const rows = bonds.map(b => TR([
    b.serial, b.amount_k ? `$${b.amount_k}K` : '-',
    b.interest_pct ? b.interest_pct+'%' : '-',
    b.years ? b.years+'yr' : '-',
    b.payment ? `$${b.payment}/mo` : '-',
    b.date_issued || '-', b.date_maturity || '-',
    webjsx.html`<span class="${b.outstanding ? 'text-green-400' : 'text-gray-500'}">${b.outstanding ? 'Active' : 'Closed'}</span>`
  ], b.serial));
  webjsx.applyDiff(el, webjsx.html`<div>
    ${PageHeader({ title: 'Bond Ledger', sub: 'Community debt instruments' })}
    <div class="grid grid-cols-3 gap-4 mb-6">
      ${StatCard({ title: 'Total Debt', value: `$${(summary.total_debt/1000).toFixed(0)}K`, color:'orange' })}
      ${StatCard({ title: 'Monthly Payment', value: `$${summary.monthly_payment}` })}
      ${StatCard({ title: 'Avg Interest', value: summary.avg_interest+'%', color:'orange' })}
    </div>
    ${Table({ headers: ['Serial','Amount','Rate','Term','Payment','Issued','Maturity','Status'], rows })}
  </div>`);
}
