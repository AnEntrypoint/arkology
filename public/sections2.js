import { webjsx } from 'https://webjsx.org/dist/webjsx.js';
import { api, StatCard, PageHeader, Table, TR } from './components.js';

export async function renderTransactions(el) {
  const data = await api('/transactions') || [];
  const rows = data.map(t => TR([
    t.id,
    webjsx.html`<span class="${t.direction===1?'text-green-400':'text-red-400'}">${t.direction===1?'+ In':'- Out'}</span>`,
    t.resident_id||'-', t.amount?`$${t.amount}`:'-', t.date||'-', t.purpose||'-'
  ], t.id));
  webjsx.applyDiff(el, webjsx.html`<div>
    ${PageHeader({ title:'Transactions', sub:'Financial ledger' })}
    ${Table({ headers:['ID','Dir','Resident','Amount','Date','Purpose'], rows })}
  </div>`);
}

export async function renderBudget(el) {
  const data = await api('/budget') || [];
  const rows = data.map(b => TR([
    b.month+' '+b.year,
    webjsx.html`<span class="${b.total<0?'text-red-400':'text-green-400'}">$${b.total}</span>`,
    b.elec_revenue?`$${b.elec_revenue}`:'-',
    b.sin_revenue?`$${b.sin_revenue}`:'-',
    b.residents||'-', b.council_salary?`$${b.council_salary}`:'-'
  ]));
  webjsx.applyDiff(el, webjsx.html`<div>
    ${PageHeader({ title:'Budget History', sub:'Monthly financial records' })}
    ${Table({ headers:['Period','Net','Elec Rev','Sin Rev','Residents','Council Salary'], rows })}
  </div>`);
}

export async function renderCouncils(el) {
  const res = await api('/councils') || { by_council:{} };
  const entries = Object.entries(res.by_council);
  const sections = entries.map(([name, members]) => webjsx.html`
    <div class="glass rounded-xl p-5 mb-4 glow-purple">
      <h3 class="text-lg font-semibold mb-3" style="color:#f97316">${name} Council</h3>
      <div class="grid grid-cols-2 lg:grid-cols-3 gap-3">
        ${members.map(m => webjsx.html`
          <div class="bg-black/30 rounded-lg p-3 border border-purple-900/30">
            <p class="font-medium text-sm text-purple-200">${m.first_name||'Resident #'+m.resident_id}</p>
            <p class="text-xs text-gray-500 mt-1">${m.reason||''}</p>
            <p class="text-xs text-orange-400 mt-1">$${m.salary}/mo</p>
          </div>`)}
      </div>
    </div>`);
  webjsx.applyDiff(el, webjsx.html`<div>
    ${PageHeader({ title:'Councils', sub:'Governance structure' })}
    ${sections}
  </div>`);
}

export async function renderElections(el) {
  const data = await api('/elections') || [];
  webjsx.applyDiff(el, webjsx.html`<div>
    ${PageHeader({ title:'Elections', sub:'Voting history & results' })}
    ${data.map(e => webjsx.html`
      <div class="glass rounded-xl p-5 mb-4 glow-purple">
        <div class="flex justify-between items-start mb-3">
          <div>
            <h3 class="font-semibold text-purple-200">${e.proposal||e.type}</h3>
            <p class="text-xs text-gray-500">${e.date} · ${e.type||''}</p>
          </div>
          ${e.passed!==undefined ? webjsx.html`<span class="px-3 py-1 rounded-full text-xs ${e.passed?'bg-green-900/40 text-green-400':'bg-red-900/40 text-red-400'}">${e.passed?'Passed':'Failed'}</span>` : ''}
        </div>
        ${e.candidates ? webjsx.html`
          <div class="grid grid-cols-3 gap-2 mt-3">
            ${e.candidates.map(c => webjsx.html`
              <div class="bg-black/30 rounded p-2 border border-purple-900/20">
                <p class="text-sm font-medium">${c.name}</p>
                <p class="text-xs text-orange-400">${c.votes} votes · ${c.rank}</p>
              </div>`)}
          </div>`
        : webjsx.html`<p class="text-sm text-gray-400">${e.option1}: ${e.votes1} | ${e.option2}: ${e.votes2}</p>`}
      </div>`)}
  </div>`);
}

export async function renderJury(el) {
  const data = await api('/jury') || [];
  const eligible = data.filter(j => j.jury_duty).length;
  const rows = data.map(j => TR([
    j.resident_id, j.first_name||'-', j.last_name||'-',
    webjsx.html`<span class="${j.jury_duty?'text-green-400':'text-gray-500'}">${j.jury_duty?'Eligible':'Exempt'}</span>`,
    j.payment?`$${j.payment}`:'$0'
  ], j.resident_id));
  webjsx.applyDiff(el, webjsx.html`<div>
    ${PageHeader({ title:'Jury Pool', sub:`${eligible} eligible of ${data.length}` })}
    ${Table({ headers:['ID','First','Last','Status','Pay'], rows })}
  </div>`);
}

export async function renderCrimes(el) {
  const data = await api('/crimes') || [];
  const rows = data.map(c => TR([
    c.id, c.date||'-', c.resident_id||'-', c.crime||'Unknown',
    webjsx.html`<span class="${c.guilty?'text-red-400':'text-gray-400'}">${c.guilty?'Guilty':'Not Guilty'}</span>`,
    c.sentence_months?c.sentence_months+' mo':'-',
    c.fine?`$${c.fine}`:'-',
    c.fine_paid?webjsx.html`<span class="text-green-400">Paid</span>`:webjsx.html`<span class="text-orange-400">Owed: $${c.fine_owed||0}</span>`,
    c.description||'-'
  ], c.id));
  webjsx.applyDiff(el, webjsx.html`<div>
    ${PageHeader({ title:'Criminal Records', sub:`${data.length} records` })}
    ${Table({ headers:['#','Date','Resident','Crime','Verdict','Sentence','Fine','Status','Description'], rows })}
  </div>`);
}

export async function renderCharity(el) {
  const data = await api('/charity') || [];
  const total = data.reduce((s,c) => s+c.budget, 0);
  webjsx.applyDiff(el, webjsx.html`<div>
    ${PageHeader({ title:'Charity Market', sub:'Community charitable organizations' })}
    <div class="glass rounded-xl p-4 mb-6 glow-orange">
      <p class="text-xs text-gray-400 uppercase tracking-widest mb-1">Total Monthly Budget</p>
      <p class="text-3xl font-bold text-orange-400">$${total}</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      ${data.map(c => webjsx.html`
        <div class="stat-card rounded-xl p-5">
          <div class="flex justify-between items-start mb-3">
            <h3 class="font-semibold text-purple-200">${c.name}</h3>
            <span class="text-xs bg-orange-900/30 text-orange-400 px-2 py-1 rounded">ID:${c.id}</span>
          </div>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between"><span class="text-gray-400">Employees</span><span>${c.employees}</span></div>
            <div class="flex justify-between"><span class="text-gray-400">Budget/mo</span><span class="text-orange-400 font-medium">$${c.budget}</span></div>
            <div class="flex justify-between"><span class="text-gray-400">Per Employee</span><span>$${c.per_employee}</span></div>
            <div class="flex justify-between"><span class="text-gray-400">2025 Rating</span><span class="text-purple-400">${c.rating_2025} pts</span></div>
          </div>
          <div class="mt-3 h-1.5 rounded-full bg-gray-800">
            <div class="h-1.5 rounded-full" style="width:${Math.min(100,(c.budget/total)*100*3)}%;background:linear-gradient(90deg,#6b21a8,#f97316)"></div>
          </div>
        </div>`)}
    </div>
  </div>`);
}
