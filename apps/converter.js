const ConverterApp = {
  render(container, winId) {
    container.innerHTML = `
      <div class="calc-app" style="max-width:420px;">
        <h2 style="font-size:18px;margin-bottom:12px;">Einheitenumrechner</h2>
        <select id="${winId}_type" class="form-input">
          <option value="length">Länge</option>
          <option value="weight">Gewicht</option>
          <option value="temp">Temperatur</option>
          <option value="data">Daten</option>
        </select>
        <div style="display:flex;gap:8px;align-items:center;margin-top:8px;">
          <input type="number" id="${winId}_from" class="form-input" value="1" style="margin:0;">
          <select id="${winId}_fu" class="form-input" style="margin:0;width:100px;"></select>
        </div>
        <div style="text-align:center;margin:8px 0;opacity:0.5;">↓</div>
        <div style="display:flex;gap:8px;align-items:center;">
          <input type="number" id="${winId}_to" class="form-input" readonly style="margin:0;">
          <select id="${winId}_tu" class="form-input" style="margin:0;width:100px;"></select>
        </div>
      </div>
    `;
    const units = {
      length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.34, ft: 0.3048, in: 0.0254 },
      weight: { kg: 1, g: 0.001, mg: 0.000001, lb: 0.453592, oz: 0.0283495 },
      data: { B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776 },
      temp: { C: 'C', F: 'F', K: 'K' }
    };
    const typeEl = document.getElementById(winId + '_type');
    const fu = document.getElementById(winId + '_fu');
    const tu = document.getElementById(winId + '_tu');
    const from = document.getElementById(winId + '_from');
    const to = document.getElementById(winId + '_to');

    const fillUnits = () => {
      const u = units[typeEl.value];
      const keys = Object.keys(u);
      fu.innerHTML = keys.map(k => `<option value="${k}">${k}</option>`).join('');
      tu.innerHTML = keys.map(k => `<option value="${k}">${k}</option>`).join('');
      if (keys[1]) tu.value = keys[1];
      calc();
    };
    const calc = () => {
      const t = typeEl.value;
      const v = parseFloat(from.value);
      if (isNaN(v)) { to.value = ''; return; }
      if (t === 'temp') {
        let c = v;
        if (fu.value === 'F') c = (v - 32) * 5/9;
        if (fu.value === 'K') c = v - 273.15;
        let out = c;
        if (tu.value === 'F') out = c * 9/5 + 32;
        if (tu.value === 'K') out = c + 273.15;
        to.value = Math.round(out * 1000) / 1000;
      } else {
        const base = v * units[t][fu.value];
        to.value = Math.round((base / units[t][tu.value]) * 1e6) / 1e6;
      }
    };
    typeEl.addEventListener('change', fillUnits);
    fu.addEventListener('change', calc);
    tu.addEventListener('change', calc);
    from.addEventListener('input', calc);
    fillUnits();
  }
};
window.ConverterApp = ConverterApp;
