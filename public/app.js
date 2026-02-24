import { renderDashboard, renderResidents, renderProperties, renderBonds } from './sections1.js';
import { renderTransactions, renderBudget, renderCouncils, renderElections, renderJury, renderCrimes, renderCharity } from './sections2.js';
import { API } from './components.js';
import { render_tax, render_calendar, render_crime_desc } from './sections3.js';

const $ = id => document.getElementById(id);

window.searchRes = q => renderResidents($('residents'), q);
window.delRes = async id => {
  if (!confirm('Delete resident ' + id + '?')) return;
  await fetch(API + '/residents/' + id, { method: 'DELETE' });
  renderResidents($('residents'));
};
window.addRes = () => {
  const first = prompt('First name:');
  if (!first) return;
  const last = prompt('Last name:') || '';
  fetch(API + '/residents', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ first_name: first, last_name: last, age: 0, alive: true, voting: false, gender: 'M', payment: 0 })
  }).then(() => renderResidents($('residents')));
};

const renderers = {
  dashboard: el => renderDashboard(el),
  residents: el => renderResidents(el),
  properties: el => renderProperties(el),
  bonds: el => renderBonds(el),
  transactions: el => renderTransactions(el),
  budget: el => renderBudget(el),
  councils: el => renderCouncils(el),
  elections: el => renderElections(el),
  jury: el => renderJury(el),
  crimes: el => renderCrimes(el),
  charity: el => renderCharity(el),
  tax: el => render_tax().then(html => el.innerHTML = html),
  calendar: el => render_calendar().then(html => el.innerHTML = html),
  'crime-descriptions': el => render_crime_desc().then(html => el.innerHTML = html)
};

function navigate(section) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('#nav a').forEach(a => a.classList.remove('active'));
  $(section)?.classList.add('active');
  document.querySelector(`[data-section="${section}"]`)?.classList.add('active');
  renderers[section]?.($(`${section}`));
}

document.querySelectorAll('#nav a').forEach(a =>
  a.addEventListener('click', () => navigate(a.dataset.section))
);

navigate('dashboard');
