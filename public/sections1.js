import { api, apiPut, apiPost, apiDelete, StatCard, PageHeader, Table, TR, applyDiff, EditableInput, EditableSelect, EditableCheckbox, ActionButton, Modal, FormField, FormInput, FormSelect, getFormData } from './components.js';

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

export async function renderDashboard(el) {
  const stats = await api('/stats');
  if (!stats) { el.innerHTML = '<p class="text-red-400 p-6">Server offline. Start: python app_server.py</p>'; return; }
  applyDiff(el, h('div', {},
    PageHeader({ title: 'Dashboard', sub: 'Ark Community Overview' }),
    h('div', { class: 'grid grid-cols-2 lg:grid-cols-4 gap-4' },
      StatCard({ title: 'Total Residents', value: stats.total_residents, sub: `${stats.alive} alive` }),
      StatCard({ title: 'Voting Members', value: stats.voting, sub: 'eligible voters', color: 'orange' }),
      StatCard({ title: 'Properties', value: stats.properties, sub: `$${stats.total_property_value}K value` }),
      StatCard({ title: 'Bond Debt', value: `$${(stats.total_bond_debt/1000).toFixed(0)}K`, sub: `${stats.active_bonds} bonds`, color: 'orange' }),
      StatCard({ title: 'Male / Female', value: `${stats.male} / ${stats.female}`, sub: 'gender split' }),
      StatCard({ title: 'Charities', value: stats.charities, sub: `$${stats.total_charity_budget}/mo`, color: 'orange' }),
      StatCard({ title: 'Net Payments', value: `$${stats.total_payments}`, sub: 'monthly UBI net' }),
      StatCard({ title: 'Community Wealth', value: `$${stats.total_wealth}`, sub: 'aggregate', color: 'orange' })
    )
  ));
}

export async function renderResidents(el, q = '') {
  const url = q ? `/residents?q=${encodeURIComponent(q)}` : '/residents';
  const data = await api(url) || [];
  
  const updateResident = async (id, field, value) => {
    const resident = data.find(r => r.res_id === id);
    if (resident) {
      resident[field] = value;
      await apiPut(`/residents/${id}`, resident);
    }
  };
  
  const rows = data.map(r => TR([
    r.res_id,
    EditableInput(r.first_name, v => updateResident(r.res_id, 'first_name', v), 'First'),
    EditableInput(r.last_name, v => updateResident(r.res_id, 'last_name', v), 'Last'),
    EditableInput(r.email, v => updateResident(r.res_id, 'email', v), 'Email'),
    EditableSelect(r.gender, [{value:'M',label:'M'},{value:'W',label:'W'}], v => updateResident(r.res_id, 'gender', v)),
    EditableInput(r.age, v => updateResident(r.res_id, 'age', v), '', 'number'),
    EditableCheckbox(r.alive, v => updateResident(r.res_id, 'alive', v)),
    EditableCheckbox(r.voting, v => updateResident(r.res_id, 'voting', v)),
    EditableInput(r.payment, v => updateResident(r.res_id, 'payment', v), '$', 'number'),
    ActionButton('Del', () => window.delRes(r.res_id), 'red')
  ], r.res_id));
  
  applyDiff(el, h('div', {},
    PageHeader({ title: 'Residents', sub: `${data.length} records` }),
    h('div', { class: 'flex gap-3 mb-4' },
      h('input', { type: 'text', placeholder: 'Search name or email...', value: q,
        class: 'flex-1 px-4 py-2 rounded-lg text-sm focus:outline-none focus:border-purple-600',
        style: 'background:#12121a;border:1px solid #1e1030;color:#e2e8f0',
        oninput: (e) => window.searchRes(e.target.value) }),
      h('button', { class: 'btn-orange px-4 py-2 rounded-lg text-sm font-medium', onclick: () => window.addRes() }, '+ Add')
    ),
    Table({ headers: ['ID','First','Last','Email','Gender','Age','Alive','Voting','Payment',''], rows })
  ));
}

export async function renderProperties(el) {
  const data = await api('/properties') || [];
  const clr = { Res:'#9333ea', Com:'#f97316', Indus:'#06b6d4', Church:'#eab308', Public:'#22c55e', Charity:'#ec4899', School:'#8b5cf6' };
  const typeOpts = Object.keys(clr).map(k => ({value:k,label:k}));
  
  const updateProperty = async (id, field, value) => {
    const prop = data.find(p => p.id === id);
    if (prop) {
      prop[field] = value;
      await apiPut(`/properties/${id}`, prop);
    }
  };
  
  const rows = data.map(p => TR([
    p.id,
    EditableInput(p.address, v => updateProperty(p.id, 'address', v), 'Address'),
    EditableSelect(p.used_for, typeOpts, v => updateProperty(p.id, 'used_for', v)),
    EditableInput(p.sqft, v => updateProperty(p.id, 'sqft', v), '', 'number'),
    EditableInput(p.value_k, v => updateProperty(p.id, 'value_k', v), '', 'number'),
    EditableInput(p.prop_tax, v => updateProperty(p.id, 'prop_tax', v), '', 'number'),
    EditableInput(p.owner_id, v => updateProperty(p.id, 'owner_id', v), '', 'number'),
    EditableInput(p.date, v => updateProperty(p.id, 'date', v), 'Date'),
    ActionButton('Del', async () => {
      if (!confirm('Delete property ' + p.id + '?')) return;
      await apiDelete('/properties/' + p.id);
      renderProperties(el);
    }, 'red')
  ], p.id));
  
  applyDiff(el, h('div', {},
    PageHeader({ title: 'Properties', sub: `${data.length} properties` }),
    h('div', { class: 'mb-4' },
      h('button', { class: 'btn-orange px-4 py-2 rounded-lg text-sm font-medium', onclick: async () => {
        await apiPost('/properties', { address: 'New Property', used_for: 'Res', sqft: 0, value_k: 0, owner_id: null, date: '' });
        renderProperties(el);
      }}, '+ Add Property')
    ),
    Table({ headers: ['ID','Address','Type','Size','Value','Tax','Owner','Date',''], rows })
  ));
}

export async function renderBonds(el) {
  const res = await api('/bonds') || { bonds: [], summary: {} };
  const { bonds, summary } = res;
  
  const updateBond = async (serial, field, value) => {
    const bond = bonds.find(b => b.serial === serial);
    if (bond) {
      bond[field] = value;
      await apiPut(`/bonds/${serial}`, bond);
    }
  };
  
  const rows = bonds.map(b => TR([
    b.serial,
    EditableInput(b.amount_k, v => updateBond(b.serial, 'amount_k', v), '', 'number'),
    EditableInput(b.interest_pct, v => updateBond(b.serial, 'interest_pct', v), '', 'number'),
    EditableInput(b.years, v => updateBond(b.serial, 'years', v), '', 'number'),
    EditableInput(b.payment, v => updateBond(b.serial, 'payment', v), '', 'number'),
    EditableInput(b.date_issued, v => updateBond(b.serial, 'date_issued', v), 'Issued'),
    EditableInput(b.date_maturity, v => updateBond(b.serial, 'date_maturity', v), 'Maturity'),
    EditableCheckbox(b.outstanding, v => updateBond(b.serial, 'outstanding', v)),
    ActionButton('Del', async () => {
      if (!confirm('Delete bond ' + b.serial + '?')) return;
      await apiDelete('/bonds/' + b.serial);
      renderBonds(el);
    }, 'red')
  ], b.serial));
  
  applyDiff(el, h('div', {},
    PageHeader({ title: 'Bond Ledger', sub: 'Community debt instruments' }),
    h('div', { class: 'grid grid-cols-3 gap-4 mb-6' },
      StatCard({ title: 'Total Debt', value: `$${(summary.total_debt/1000).toFixed(0)}K`, color:'orange' }),
      StatCard({ title: 'Monthly Payment', value: `$${summary.monthly_payment}` }),
      StatCard({ title: 'Avg Interest', value: summary.avg_interest+'%', color:'orange' })
    ),
    h('div', { class: 'mb-4' },
      h('button', { class: 'btn-orange px-4 py-2 rounded-lg text-sm font-medium', onclick: async () => {
        await apiPost('/bonds', { amount_k: 0, interest_pct: 0, years: 10, payment: 0, outstanding: true, date_issued: '', date_maturity: '' });
        renderBonds(el);
      }}, '+ Add Bond')
    ),
    Table({ headers: ['Serial','Amount','Rate','Term','Payment','Issued','Maturity','Active',''], rows })
  ));
}