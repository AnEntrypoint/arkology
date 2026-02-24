import { api, apiPut, StatCard, PageHeader, Table, TR, applyDiff, EditableInput, ActionButton } from './components.js';

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

export async function renderTax(el) {
  const tax = await api('/tax') || {};
  const elec = (tax.electric || {}).properties || [];
  const sin = (tax.sin || {}).properties || [];
  const months = (tax.electric || {}).months || [];
  
  const updateTax = async (type, propIdx, monthIdx, value) => {
    const taxData = await api('/tax') || {};
    const props = type === 'electric' ? (taxData.electric || {}).properties : (taxData.sin || {}).properties;
    if (props && props[propIdx]) {
      props[propIdx].values[monthIdx] = value;
      await apiPut('/tax', taxData);
    }
  };
  
  const elecRows = elec.map((p, pi) => TR([
    'P'+p.property_id,
    ...p.values.map((v, mi) => EditableInput(v, val => updateTax('electric', pi, mi, val), '$', 'number'))
  ], p.property_id));
  
  const sinRows = sin.map((p, pi) => TR([
    'P'+p.property_id,
    ...p.values.map((v, mi) => EditableInput(v, val => updateTax('sin', pi, mi, val), '$', 'number'))
  ], p.property_id));
  
  applyDiff(el, h('div', {},
    PageHeader({ title:'Tax Ledger', sub:'Electric + Sin tax per property by month' }),
    h('div', { class: 'mb-8' },
      h('h3', { class: 'text-lg font-semibold mb-3', style: 'color:#f97316' }, 'Electric Tax'),
      Table({ headers:['Property',...months], rows:elecRows })
    ),
    h('div', {},
      h('h3', { class: 'text-lg font-semibold mb-3', style: 'color:#9333ea' }, 'Sin Tax'),
      Table({ headers:['Property',...months], rows:sinRows })
    )
  ));
}

export async function renderCalendar(el) {
  const cal = await api('/calendar') || {};
  const weeks = cal.weekly || [];
  const rec = cal.recurring || {};
  const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const dayLabels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  
  const updateCalendar = async (type, weekIdx, day, value) => {
    const calData = await api('/calendar') || {};
    if (type === 'recurring') {
      calData.recurring = calData.recurring || {};
      calData.recurring[day] = value;
    } else if (type === 'weekly' && calData.weekly && calData.weekly[weekIdx]) {
      calData.weekly[weekIdx][day] = value;
    }
    await apiPut('/calendar', calData);
  };
  
  const recurringGrid = h('div', { class: 'grid grid-cols-7 gap-2' },
    ...dayLabels.map((lbl, i) => 
      h('div', { class: 'bg-black/30 rounded-lg p-3 border border-purple-900/30' },
        h('p', { class: 'text-xs text-orange-400 font-bold mb-1' }, lbl),
        EditableInput(rec[days[i]] || '', v => updateCalendar('recurring', null, days[i], v), 'Event')
      )
    )
  );
  
  const weekCards = weeks.map((w, wi) => 
    h('div', { class: 'glass rounded-xl p-5 mb-4 glow-orange' },
      h('div', { class: 'flex justify-between items-center mb-3' },
        h('h3', { class: 'text-lg font-semibold', style: 'color:#9333ea' }, `Week ${w.week}`),
        ActionButton('Del', async () => {
          if (!confirm('Delete week ' + w.week + '?')) return;
          const calData = await api('/calendar') || {};
          calData.weekly.splice(wi, 1);
          await apiPut('/calendar', calData);
          renderCalendar(el);
        }, 'red')
      ),
      h('div', { class: 'grid grid-cols-7 gap-2' },
        ...dayLabels.map((lbl, i) => 
          h('div', { class: 'bg-black/30 rounded-lg p-3 border border-orange-900/20' },
            h('p', { class: 'text-xs text-purple-400 font-bold mb-1' }, lbl),
            EditableInput(w[days[i]] || '', v => updateCalendar('weekly', wi, days[i], v), '')
          )
        )
      )
    )
  );
  
  applyDiff(el, h('div', {},
    PageHeader({ title:'Community Calendar', sub:'Weekly recurring schedule' }),
    h('div', { class: 'glass rounded-xl p-5 mb-6 glow-purple' },
      h('h3', { class: 'text-lg font-semibold mb-3', style: 'color:#f97316' }, 'Every Week'),
      recurringGrid
    ),
    h('div', { class: 'mb-4' },
      h('button', { class: 'btn-orange px-4 py-2 rounded-lg text-sm font-medium', onclick: async () => {
        const calData = await api('/calendar') || {};
        calData.weekly = calData.weekly || [];
        const maxWeek = Math.max(...calData.weekly.map(w => w.week || 0), 0);
        calData.weekly.push({
          week: maxWeek + 1,
          sunday: '', monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: ''
        });
        await apiPut('/calendar', calData);
        renderCalendar(el);
      }}, '+ Add Week')
    ),
    ...weekCards
  ));
}

export async function renderCrimeDescriptions(el) {
  const data = await api('/crime-descriptions') || {};
  const crimes = data.crimes || [];
  const totalTypes = data.total_crime_types || crimes.length;
  const sevColor = s => s==='Critical'?'text-red-400':s==='High'?'text-orange-400':s==='Medium'?'text-yellow-400':'text-green-400';
  
  const updateCrimeDesc = async (idx, field, value) => {
    const crimeData = await api('/crime-descriptions') || {};
    crimeData.crimes = crimeData.crimes || [];
    if (crimeData.crimes[idx]) {
      crimeData.crimes[idx][field] = value;
      await apiPut('/crime-descriptions', crimeData);
    }
  };
  
  const cards = crimes.map((c, idx) => 
    h('div', { class: 'stat-card rounded-xl p-4' },
      h('div', { class: 'flex justify-between items-start mb-2' },
        h('span', { class: 'text-xs text-gray-500' }, `Crime #${c.id || idx + 1}`),
        h('div', { class: 'flex gap-2' },
          c.severity ? h('span', { class: `text-xs px-2 py-0.5 rounded bg-black/40 ${sevColor(c.severity)}` }, c.severity) : null,
          ActionButton('Del', async () => {
            if (!confirm('Delete crime description?')) return;
            const crimeData = await api('/crime-descriptions') || {};
            crimeData.crimes.splice(idx, 1);
            await apiPut('/crime-descriptions', crimeData);
            renderCrimeDescriptions(el);
          }, 'red')
        )
      ),
      EditableInput(c.name || '', v => updateCrimeDesc(idx, 'name', v), 'Name'),
      c.max_months ? h('p', { class: 'text-xs text-gray-500 mt-1' }, `Max: ${c.max_months} months`) : null,
      c.victim_id !== undefined ? h('div', { class: 'text-xs text-orange-400 mt-1 flex gap-2' },
        h('span', {}, `Victim: #${c.victim_id}`),
        h('span', {}, `Def: #${c.defendant_id}`)
      ) : null
    )
  );
  
  applyDiff(el, h('div', {},
    PageHeader({ title:'Crime Classification', sub:`${totalTypes} crime types defined` }),
    h('div', { class: 'mb-4' },
      h('button', { class: 'btn-orange px-4 py-2 rounded-lg text-sm font-medium', onclick: async () => {
        const crimeData = await api('/crime-descriptions') || {};
        crimeData.crimes = crimeData.crimes || [];
        const maxId = Math.max(...crimeData.crimes.map(c => c.id || 0), 0);
        crimeData.crimes.push({ id: maxId + 1, name: '', victim_id: null, defendant_id: null });
        await apiPut('/crime-descriptions', crimeData);
        renderCrimeDescriptions(el);
      }}, '+ Add Crime Type')
    ),
    h('div', { class: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3' }, ...cards)
  ));
}