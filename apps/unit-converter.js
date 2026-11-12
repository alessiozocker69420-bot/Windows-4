/** Einheitenumrechner – voll funktionsfähig */
const UnitConverterApp = {
  render(container, winId) {
    const cats = {
      Länge: { m: 1, km: 0.001, cm: 100, mm: 1000, mi: 0.000621371, yd: 1.09361, ft: 3.28084, in: 39.3701 },
      Gewicht: { kg: 1, g: 1000, mg: 1e6, t: 0.001, lb: 2.20462, oz: 35.274 },
      Temperatur: null, // special
      Daten: { B: 1, KB: 1/1024, MB: 1/(1024**2), GB: 1/(1024**3), TB: 1/(1024**4), bit: 8 }
    };

    container.innerHTML = `
      <div class="app-content" style="padding:16px;gap:12px;background:#1a1a1a;">
        <h2 style="font-size:18px;margin-bottom:8px;">Einheitenumrechner</h2>
        <select id="${winId}_cat" class="form-input">
          ${Object.keys(cats).map(c => `<option>${c}</option>`).join('')}
        </select>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <input type="number" id="${winId}_from" class="form-input" value="1" style="flex:1;margin:0;" step="any">
          <select id="${winId}_u1" class="form-input" style="width:100px;margin:0;"></select>
        </div>
        <div style="text-align:center;opacity:0.5;">↓</div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <input type="number" id="${winId}_to" class="form-input" readonly style="flex:1;margin:0;background:#111;">
          <select id="${winId}_u2" class="form-input" style="width:100px;margin:0;"></select>
        </div>
        <p id="${winId}_hint" style="font-size:12px;opacity:0.5;margin-top:8px;"></p>
      </div>
    `;

    const catEl = document.getElementById(winId + '_cat');
    const u1 = document.getElementById(winId + '_u1');
    const u2 = document.getElementById(winId + '_u2');
    const from = document.getElementById(winId + '_from');
    const to = document.getElementById(winId + '_to');

    const fillUnits = () => {
      const cat = catEl.value;
      if (cat === 'Temperatur') {
        u1.innerHTML = '<option>°C</option><option>°F</option><option>K</option>';
        u2.innerHTML = u1.innerHTML;
        u2.value = '°F';
      } else {
        const units = Object.keys(cats[cat]);
        u1.innerHTML = units.map(u => `<option>${u}</option>`).join('');
        u2.innerHTML = u1.innerHTML;
        if (units[1]) u2.value = units[1];
      }
      convert();
    };

    const convert = () => {
      const cat = catEl.value;
      const v = parseFloat(from.value);
      if (isNaN(v)) { to.value = ''; return; }
      if (cat === 'Temperatur') {
        let c = v;
        if (u1.value === '°F') c = (v - 32) * 5/9;
        if (u1.value === 'K') c = v - 273.15;
        let out = c;
        if (u2.value === '°F') out = c * 9/5 + 32;
        if (u2.value === 'K') out = c + 273.15;
        to.value = Math.round(out * 1e6) / 1e6;
        return;
      }
      const table = cats[cat];
      const base = v / table[u1.value]; // to base unit factor inverted: actually table is "how many unit per base"
      // table[unit] = unit per 1 base → value_in_base = v / table[u1]
      const inBase = v / table[u1.value];
      const result = inBase * table[u2.value];
      to.value = Math.round(result * 1e8) / 1e8;
    };

    catEl.addEventListener('change', fillUnits);
    u1.addEventListener('change', convert);
    u2.addEventListener('change', convert);
    from.addEventListener('input', convert);
    fillUnits();
  }
};
window.UnitConverterApp = UnitConverterApp;
