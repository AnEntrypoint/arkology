import { api, apiPut, apiPost, apiDelete, StatCard, PageHeader, Table, TR, applyDiff, EditableInput, EditableSelect, EditableCheckbox, ActionButton } from './components.js';

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

export async function renderTransactions(el) {
  const data = await api('/transactions') || [];
  
  const updateTx = async (id, field, value) => {
    const tx = data.find(t => t.id === id);
    if (tx) {
      tx[field] = value;
      await apiPut(`/transactions/${id}`, tx);
    }
  };
  
  const dirOpts = [{value:1,label:'In'},{value:-1,label:'Out'}];
  
  const rows = data.map(t => TR([
    t.id,
    EditableSelect(t.direction, dirOpts, v => updateTx(t.id, 'direction', parseInt(v))),
    EditableInput(t.resident_id, v => updateTx(t.id, 'resident_id', v), '', 'number'),
    EditableInput(t.amount, v => updateTx(t.id, 'amount', v), '', 'number'),
    EditableInput(t.date, v => updateTx(t.id, 'date', v), 'Date'),
    EditableInput(t.purpose, v => updateTx(t.id, 'purpose', v), 'Purpose'),
    ActionButton('Del', async () => {
      if (!confirm('Delete transaction ' + t.id + '?')) return;
      await apiDelete('/transactions/' + t.id);
      renderTransactions(el);
    }, 'red')
  ], t.id));
  
  applyDiff(el, h('div', {},
    PageHeader({ title:'Transactions', sub:'Financial ledger' }),
    h('div', { class: 'mb-4' },
      h('button', { class: 'btn-orange px-4 py-2 rounded-lg text-sm font-medium', onclick: async () => {
        await apiPost('/transactions', { direction: 1, resident_id: null, amount: 0, date: '', purpose: '' });
        renderTransactions(el);
      }}, '+ Add Transaction')
    ),
    Table({ headers:['ID','Dir','Resident','Amount','Date','Purpose',''], rows })
  ));
}

export async function renderBudget(el) {
  const data = await api('/budget') || [];
  
  const updateBudget = async (idx, field, value) => {
    const b = data[idx];
    if (b) {
      b[field] = value;
      await apiPut(`/budget/${idx}`, b);
    }
  };
  
  const monthOpts = ['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => ({value:m,label:m}));
  
  const rows = data.map((b, idx) => TR([
    EditableSelect(b.month, monthOpts, v => updateBudget(idx, 'month', v)),
    EditableInput(b.year, v => updateBudget(idx, 'year', v), '', 'number'),
    EditableInput(b.total, v => updateBudget(idx, 'total', v), '', 'number'),
    EditableInput(b.elec_revenue, v => updateBudget(idx, 'elec_revenue', v), '', 'number'),
    EditableInput(b.sin_revenue, v => updateBudget(idx, 'sin_revenue', v), '', 'number'),
    EditableInput(b.residents, v => updateBudget(idx, 'residents', v), '', 'number'),
    EditableInput(b.council_salary, v => updateBudget(idx, 'council_salary', v), '', 'number'),
    ActionButton('Del', async () => {
      if (!confirm('Delete budget entry?')) return;
      await apiDelete('/budget/' + idx);
      renderBudget(el);
    }, 'red')
  ]));
  
  applyDiff(el, h('div', {},
    PageHeader({ title:'Budget History', sub:'Monthly financial records' }),
    h('div', { class: 'mb-4' },
      h('button', { class: 'btn-orange px-4 py-2 rounded-lg text-sm font-medium', onclick: async () => {
        await apiPost('/budget', { month: 'January', year: 2024, total: 0, elec_revenue: 0, sin_revenue: 0, residents: 0, council_salary: 0 });
        renderBudget(el);
      }}, '+ Add Budget Entry')
    ),
    Table({ headers:['Month','Year','Net','Elec Rev','Sin Rev','Residents','Council Salary',''], rows })
  ));
}

export async function renderCouncils(el) {
  const res = await api('/councils') || { members: [], by_council: {} };
  const entries = Object.entries(res.by_council);
  const members = res.members;
  
  const updateMember = async (idx, field, value) => {
    const m = members[idx];
    if (m) {
      m[field] = value;
      await apiPut(`/councils/${idx}`, m);
    }
  };
  
  const councilOpts = [...new Set(members.map(m => m.council))].map(c => ({value:c,label:c}));
  
  const sections = entries.map(([name, mems]) => 
    h('div', { class: 'glass rounded-xl p-5 mb-4 glow-purple' },
      h('h3', { class: 'text-lg font-semibold mb-3', style: 'color:#f97316' }, name + ' Council'),
      h('div', { class: 'grid grid-cols-2 lg:grid-cols-3 gap-3' },
        ...mems.map(m => {
          const idx = members.findIndex(x => x === m);
          return h('div', { class: 'bg-black/30 rounded-lg p-3 border border-purple-900/30' },
            EditableInput(m.first_name, v => updateMember(idx, 'first_name', v), 'Name'),
            h('div', { class: 'mt-2' }, EditableInput(m.resident_id, v => updateMember(idx, 'resident_id', v), 'Res ID', 'number')),
            h('div', { class: 'mt-2' }, EditableInput(m.reason, v => updateMember(idx, 'reason', v), 'Reason')),
            h('div', { class: 'mt-2' }, EditableInput(m.salary, v => updateMember(idx, 'salary', v), '$/mo', 'number'))
          );
        })
      )
    )
  );
  
  applyDiff(el, h('div', {},
    PageHeader({ title:'Councils', sub:'Governance structure' }),
    h('div', { class: 'mb-4' },
      h('button', { class: 'btn-orange px-4 py-2 rounded-lg text-sm font-medium', onclick: async () => {
        await apiPost('/councils', { council: 'New Council', seat: 1, first_name: '', resident_id: null, date: '', reason: '', salary: 30 });
        renderCouncils(el);
      }}, '+ Add Council Member')
    ),
    ...sections
  ));
}

export async function renderElections(el) {
  const data = await api('/elections') || [];
  
  const updateElection = async (id, field, value) => {
    const e = data.find(x => x.id === id);
    if (e) {
      e[field] = value;
      await apiPut(`/elections/${id}`, e);
    }
  };
  
  const items = data.map(e => 
    h('div', { class: 'glass rounded-xl p-5 mb-4 glow-purple' },
      h('div', { class: 'flex justify-between items-start mb-3' },
        h('div', { class: 'flex-1' },
          EditableInput(e.proposal, v => updateElection(e.id, 'proposal', v), 'Proposal'),
          h('div', { class: 'flex gap-2 mt-2' },
            EditableInput(e.date, v => updateElection(e.id, 'date', v), 'Date'),
            EditableInput(e.type, v => updateElection(e.id, 'type', v), 'Type')
          )
        ),
        h('div', { class: 'flex gap-2 items-center' },
          EditableCheckbox(e.passed, v => updateElection(e.id, 'passed', v)),
          e.passed ? h('span', { class: 'text-green-400 text-xs' }, 'Passed') : h('span', { class: 'text-red-400 text-xs' }, 'Failed'),
          ActionButton('Del', async () => {
            if (!confirm('Delete election ' + e.id + '?')) return;
            await apiDelete('/elections/' + e.id);
            renderElections(el);
          }, 'red')
        )
      ),
      h('div', { class: 'grid grid-cols-2 gap-3 mt-3' },
        EditableInput(e.option1, v => updateElection(e.id, 'option1', v), 'Option 1'),
        EditableInput(e.votes1, v => updateElection(e.id, 'votes1', v), 'Votes', 'number'),
        EditableInput(e.option2, v => updateElection(e.id, 'option2', v), 'Option 2'),
        EditableInput(e.votes2, v => updateElection(e.id, 'votes2', v), 'Votes', 'number')
      )
    )
  );
  
  applyDiff(el, h('div', {},
    PageHeader({ title:'Elections', sub:'Voting history & results' }),
    h('div', { class: 'mb-4' },
      h('button', { class: 'btn-orange px-4 py-2 rounded-lg text-sm font-medium', onclick: async () => {
        await apiPost('/elections', { proposal: 'New Election', date: '', type: '', option1: 'Yes', votes1: 0, option2: 'No', votes2: 0, passed: false });
        renderElections(el);
      }}, '+ Add Election')
    ),
    ...items
  ));
}

export async function renderJury(el) {
  const data = await api('/jury') || [];
  const eligible = data.filter(j => j.jury_duty).length;
  
  const updateJury = async (resId, field, value) => {
    const j = data.find(x => x.resident_id === resId);
    if (j) {
      j[field] = value;
      await apiPut(`/jury/${resId}`, j);
    }
  };
  
  const rows = data.map(j => TR([
    EditableInput(j.resident_id, v => updateJury(j.resident_id, 'resident_id', v), '', 'number'),
    EditableInput(j.first_name, v => updateJury(j.resident_id, 'first_name', v), 'First'),
    EditableInput(j.last_name, v => updateJury(j.resident_id, 'last_name', v), 'Last'),
    EditableCheckbox(j.jury_duty, v => updateJury(j.resident_id, 'jury_duty', v)),
    EditableInput(j.payment, v => updateJury(j.resident_id, 'payment', v), '$', 'number'),
    ActionButton('Del', async () => {
      if (!confirm('Delete jury member ' + j.resident_id + '?')) return;
      await apiDelete('/jury/' + j.resident_id);
      renderJury(el);
    }, 'red')
  ], j.resident_id));
  
  applyDiff(el, h('div', {},
    PageHeader({ title:'Jury Pool', sub:`${eligible} eligible of ${data.length}` }),
    h('div', { class: 'mb-4' },
      h('button', { class: 'btn-orange px-4 py-2 rounded-lg text-sm font-medium', onclick: async () => {
        const maxId = Math.max(...data.map(j => j.resident_id), 0);
        await apiPost('/jury', { resident_id: maxId + 1, first_name: '', last_name: '', jury_duty: true, payment: 0 });
        renderJury(el);
      }}, '+ Add Jury Member')
    ),
    Table({ headers:['ID','First','Last','Eligible','Pay',''], rows })
  ));
}

export async function renderCrimes(el) {
  const data = await api('/crimes') || [];
  
  const updateCrime = async (id, field, value) => {
    const c = data.find(x => x.id === id);
    if (c) {
      c[field] = value;
      await apiPut(`/crimes/${id}`, c);
    }
  };
  
  const rows = data.map(c => TR([
    c.id,
    EditableCheckbox(c.not_guilty, v => updateCrime(c.id, 'not_guilty', v)),
    EditableInput(c.months, v => updateCrime(c.id, 'months', v), '', 'number'),
    EditableInput(c.final_months, v => updateCrime(c.id, 'final_months', v), '', 'number'),
    EditableInput(c.note, v => updateCrime(c.id, 'note', v), 'Note'),
    ActionButton('Del', async () => {
      if (!confirm('Delete crime ' + c.id + '?')) return;
      await apiDelete('/crimes/' + c.id);
      renderCrimes(el);
    }, 'red')
  ], c.id));
  
  applyDiff(el, h('div', {},
    PageHeader({ title:'Criminal Records', sub:`${data.length} records` }),
    h('div', { class: 'mb-4' },
      h('button', { class: 'btn-orange px-4 py-2 rounded-lg text-sm font-medium', onclick: async () => {
        await apiPost('/crimes', { not_guilty: false, months: null, final_months: null, note: '' });
        renderCrimes(el);
      }}, '+ Add Crime Record')
    ),
    Table({ headers:['#','Not Guilty','Months','Final','Note',''], rows })
  ));
}

export async function renderCharity(el) {
  const data = await api('/charity') || [];
  const total = data.reduce((s,c) => s + (c.budget || 0), 0);
  
  const updateCharity = async (id, field, value) => {
    const c = data.find(x => x.id === id);
    if (c) {
      c[field] = value;
      await apiPut(`/charity/${id}`, c);
    }
  };
  
  const cards = data.map(c => 
    h('div', { class: 'stat-card rounded-xl p-5' },
      h('div', { class: 'flex justify-between items-start mb-3' },
        EditableInput(c.name, v => updateCharity(c.id, 'name', v), 'Name'),
        h('div', { class: 'flex gap-2 items-center' },
          h('span', { class: 'text-xs bg-orange-900/30 text-orange-400 px-2 py-1 rounded' }, `ID:${c.id}`),
          ActionButton('Del', async () => {
            if (!confirm('Delete charity ' + c.id + '?')) return;
            await apiDelete('/charity/' + c.id);
            renderCharity(el);
          }, 'red')
        )
      ),
      h('div', { class: 'space-y-2 text-sm' },
        h('div', { class: 'flex justify-between' }, h('span', { class: 'text-gray-400' }, 'Employees'), EditableInput(c.employees, v => updateCharity(c.id, 'employees', v), '', 'number')),
        h('div', { class: 'flex justify-between' }, h('span', { class: 'text-gray-400' }, 'Budget/mo'), EditableInput(c.budget, v => updateCharity(c.id, 'budget', v), '$', 'number')),
        h('div', { class: 'flex justify-between' }, h('span', { class: 'text-gray-400' }, 'Per Employee'), h('span', {}, `$${c.per_employee || 0}`)),
        h('div', { class: 'flex justify-between' }, h('span', { class: 'text-gray-400' }, 'Rating'), EditableInput(c.rating_2025, v => updateCharity(c.id, 'rating_2025', v), '', 'number'))
      ),
      h('div', { class: 'mt-3 h-1.5 rounded-full bg-gray-800' },
        h('div', { class: 'h-1.5 rounded-full', style: `width:${Math.min(100,(c.budget/total)*100*3)}%;background:linear-gradient(90deg,#6b21a8,#f97316)` })
      )
    )
  );
  
  applyDiff(el, h('div', {},
    PageHeader({ title:'Charity Market', sub:'Community charitable organizations' }),
    h('div', { class: 'glass rounded-xl p-4 mb-6 glow-orange' },
      h('p', { class: 'text-xs text-gray-400 uppercase tracking-widest mb-1' }, 'Total Monthly Budget'),
      h('p', { class: 'text-3xl font-bold text-orange-400' }, `$${total}`)
    ),
    h('div', { class: 'mb-4' },
      h('button', { class: 'btn-orange px-4 py-2 rounded-lg text-sm font-medium', onclick: async () => {
        await apiPost('/charity', { name: 'New Charity', employees: 1, budget: 0, per_employee: 0, rating_2025: 0 });
        renderCharity(el);
      }}, '+ Add Charity')
    ),
    h('div', { class: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' }, ...cards)
  ));
}