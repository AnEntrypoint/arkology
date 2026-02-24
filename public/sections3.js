const render_tax = async () => {
  const tax = await api('/tax') || {};
  const electric = tax.electric || {};
  const sin = tax.sin || {};
  
  const elec_rows = Object.entries(electric).map(([prop, months]) => 
    webjsx.html\`<tr class="border-b border-purple-500/30">
      <td class="px-4 py-2">\${prop}</td>
      <td class="px-4 py-2">\${Object.values(months).reduce((a,b) => a+b, 0).toFixed(2)}</td>
    </tr>\`
  );
  
  return webjsx.html\`<div class="p-6">
    <h2 class="text-3xl font-bold text-orange-500 mb-6">Tax Tracking</h2>
    <div class="grid grid-cols-2 gap-4 mb-8">
      <div class="p-4 rounded-lg bg-gradient-to-br from-purple-900/30 to-orange-900/20 border border-purple-500/30">
        <h3 class="text-lg font-semibold text-purple-300 mb-3">Electric Tax</h3>
        <table class="w-full text-sm text-gray-300">
          <thead><tr class="border-b border-orange-500/30"><th class="text-left px-4 py-2">Property</th><th class="text-left px-4 py-2">Total</th></tr></thead>
          <tbody>\${elec_rows}</tbody>
        </table>
      </div>
      <div class="p-4 rounded-lg bg-gradient-to-br from-purple-900/30 to-orange-900/20 border border-purple-500/30">
        <h3 class="text-lg font-semibold text-orange-300 mb-3">Sin Tax Revenue</h3>
        <p class="text-2xl font-bold text-orange-400">\$\${tax.total_sin_revenue || 0}</p>
        <p class="text-xs text-gray-400 mt-2">Monthly collection</p>
      </div>
    </div>
  </div>\`;
};

const render_calendar = async () => {
  const cal = await api('/calendar') || {};
  const events = cal.events || [];
  
  const event_cards = events.map(day => 
    webjsx.html\`<div class="p-4 rounded-lg bg-gradient-to-br from-purple-900/20 to-orange-900/20 border border-purple-500/30 hover:border-orange-500/50 transition">
      <h3 class="font-bold text-lg text-purple-300 mb-2">\${day.day}</h3>
      <ul class="text-sm text-gray-300 space-y-1">
        \${day.events.map(e => webjsx.html\`<li class="flex items-center"><span class="text-orange-500 mr-2">▸</span>\${e}</li>\`)}
      </ul>
    </div>\`
  );
  
  return webjsx.html\`<div class="p-6">
    <h2 class="text-3xl font-bold text-orange-500 mb-6">Community Calendar</h2>
    <div class="grid grid-cols-7 gap-3 mb-6">
      \${event_cards}
    </div>
    <div class="p-4 rounded-lg bg-gradient-to-br from-purple-900/30 to-orange-900/20 border border-purple-500/30">
      <h3 class="font-bold text-purple-300 mb-3">Special Events</h3>
      <p class="text-gray-400 text-sm">Weekly recurring events, councils, parties, sports</p>
    </div>
  </div>\`;
};

const render_crime_desc = async () => {
  const crimes = await api('/crime-descriptions') || {};
  
  const crime_cards = Object.entries(crimes).map(([id, crime]) => 
    webjsx.html\`<div class="p-3 rounded-lg bg-gradient-to-br from-purple-900/20 to-orange-900/20 border border-purple-500/30">
      <div class="flex justify-between items-start">
        <div>
          <h4 class="font-semibold text-purple-300">\${crime.name}</h4>
          <p class="text-xs text-gray-400">Max: \${crime.max_months} months</p>
        </div>
        <span class="text-xs px-2 py-1 rounded bg-\${crime.severity === 'Critical' ? 'red' : crime.severity === 'High' ? 'orange' : 'purple'}-500/30 text-\${crime.severity === 'Critical' ? 'red' : crime.severity === 'High' ? 'orange' : 'purple'}-300">\${crime.severity}</span>
      </div>
    </div>\`
  );
  
  return webjsx.html\`<div class="p-6">
    <h2 class="text-3xl font-bold text-orange-500 mb-6">Crime Classification</h2>
    <div class="grid grid-cols-4 gap-3">
      \${crime_cards}
    </div>
  </div>\`;
};

export { render_tax, render_calendar, render_crime_desc };
