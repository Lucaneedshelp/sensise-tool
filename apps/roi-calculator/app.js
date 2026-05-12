const BUILDING_TYPES = [
  ['Einfamilienhaus', 0.15],
  ['Mehrfamilienhaus', 0.15],
  ['Wohnheim / Studentenwohnheim', 0.2],
  ['Alten- / Pflegeheim', 0.2],
  ['Bürogebäude', 0.025],
  ['Einzelhandel / Supermarkt', 0.05],
  ['Hotel / Gastronomie', 0.2],
  ['Schulen / Kindergärten', 0.05],
  ['Krankenhaus / Gesundheitsgebäude', 0.15],
  ['Sporthalle', 0.075],
  ['Fitness', 0.15],
  ['Sportheim', 0.1],
  ['Produktionshalle / Werkstatt', 0.025],
  ['Landwirtschaft (Ställe / Hallen)', 0.025]
];

const EFFICIENCY_CLASSES = [
  ['A+', 0, 30, 'Passivhaus, KfW-40-Haus', 0],
  ['A', 30, 50, 'Effizienzhaus 55', 0],
  ['B', 50, 75, 'Gut gedämmter Neubau', 0.025],
  ['C', 75, 100, 'Standard gemäß GEG', 0.05],
  ['D', 100, 130, 'Unsanierter Altbau, ca. 1980er', 0.1],
  ['E', 130, 160, 'Typischer Altbau mit einfacher Dämmung', 0.15],
  ['F', 160, 200, 'Schlecht saniertes Haus', 0.2],
  ['G', 200, 250, 'Unsaniertes Gebäude mit alter Heiztechnik', 0.25],
  ['H', 250, Infinity, 'Energetisch sehr schlechter Zustand', 0.3]
];

const CO2_FACTORS = [
  ['Heizöl', 310],
  ['Erdgas', 240],
  ['Flüssiggas', 270],
  ['Steinkohle', 400],
  ['Braunkohle', 430],
  ['Biogas', 140],
  ['Biogas, gebäudenah erzeugt', 75],
  ['Biogenes Flüssiggas', 180],
  ['Bioöl', 210],
  ['Bioöl, gebäudenah erzeugt', 105],
  ['Holz', 20],
  ['Strom, netzbezogen', 560],
  ['Strom, gebäudenah erzeugt', 0],
  ['Verdrängungsstrommix', 860],
  ['Erdwärme, Geothermie, Solarthermie, Umgebungswärme', 0],
  ['Erdkälte, Umgebungskälte', 0],
  ['Abwärme aus Prozessen', 40],
  ['Wärme aus Verbrennung von Siedlungsabfällen', 20],
  ['Nah-/Fernwärme KWK Stein-/Braunkohle', 300],
  ['Nah-/Fernwärme KWK gasförmige/flüssige Brennstoffe', 180],
  ['Nah-/Fernwärme KWK erneuerbarer Brennstoff', 40],
  ['Nah-/Fernwärme Heizwerke Stein-/Braunkohle', 400],
  ['Nah-/Fernwärme Heizwerke gasförmige/flüssige Brennstoffe', 300],
  ['Nah-/Fernwärme Heizwerke erneuerbarer Brennstoff', 60]
];

const euro = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const percent = new Intl.NumberFormat('de-DE', { style: 'percent', maximumFractionDigits: 1 });
const number = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 });

const ids = [
  'customer-name',
  'project-name',
  'building-type',
  'building-state',
  'area',
  'energy-carrier',
  'energy-consumption',
  'energy-price',
  'investment-devices',
  'investment-gateways',
  'investment-accessories',
  'investment-software',
  'investment-services'
];

const els = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
Object.assign(els, {
  paybackYears: document.getElementById('payback-years'),
  roi10: document.getElementById('roi-10'),
  savingYear: document.getElementById('saving-year'),
  energyCost: document.getElementById('energy-cost'),
  warmWaterShare: document.getElementById('warm-water-share'),
  heatingCost: document.getElementById('heating-cost'),
  kwhPerSqm: document.getElementById('kwh-per-sqm'),
  efficiencyClass: document.getElementById('efficiency-class'),
  savingRate: document.getElementById('saving-rate'),
  investmentTotal: document.getElementById('investment-total'),
  profit5: document.getElementById('profit-5'),
  co210: document.getElementById('co2-10'),
  roiChart: document.getElementById('roi-chart'),
  yearTable: document.getElementById('year-table')
});

function value(id) {
  return Number(els[id].value || 0);
}

function getEfficiencyClass(kwhPerSqm) {
  if (!Number.isFinite(kwhPerSqm) || kwhPerSqm <= 0) return null;
  return EFFICIENCY_CLASSES.find(item => kwhPerSqm <= item[2]) || EFFICIENCY_CLASSES.at(-1);
}

function calculate() {
  const buildingType = BUILDING_TYPES.find(item => item[0] === els['building-type'].value) || null;
  const co2 = CO2_FACTORS.find(item => item[0] === els['energy-carrier'].value) || null;
  const area = value('area');
  const consumption = value('energy-consumption');
  const energyPrice = value('energy-price');
  const warmWaterShare = buildingType ? buildingType[1] : 0;
  const energyCosts = consumption * energyPrice;
  const heatingCosts = energyCosts * (1 - warmWaterShare);
  const kwhPerSqm = area > 0 ? consumption / area : 0;
  const efficiency = getEfficiencyClass(kwhPerSqm);
  const savingRate = efficiency ? efficiency[4] : 0;
  const annualSaving = heatingCosts * savingRate;
  const oneTimeInvestment = value('investment-devices') + value('investment-gateways') + value('investment-accessories') + value('investment-services');
  const annualSoftware = value('investment-software');
  const totalInvestment = oneTimeInvestment + annualSoftware;

  const years = [];
  let cumulative = 0;
  let payback = null;
  for (let year = 0; year <= 10; year += 1) {
    const oneTimeCost = year === 0 ? -oneTimeInvestment : 0;
    const runningCost = year === 0 ? 0 : -annualSoftware;
    const saving = year === 0 ? 0 : annualSaving;
    const profit = oneTimeCost + runningCost + saving;
    const previous = cumulative;
    cumulative += profit;
    const costsUntilYear = oneTimeInvestment + annualSoftware * year;
    const roi = costsUntilYear > 0 ? cumulative / costsUntilYear : 0;
    if (payback === null && year > 0 && previous < 0 && cumulative >= 0) {
      const fraction = Math.abs(previous) / (cumulative - previous);
      payback = year - 1 + fraction;
    }
    years.push({ year, oneTimeCost, runningCost, saving, profit, cumulative, roi });
  }

  const co2TonsPerYear = co2 ? co2[1] / 1000000 * consumption : 0;
  const co2Saving10 = co2TonsPerYear * savingRate * 10;

  return {
    buildingType,
    co2,
    warmWaterShare,
    energyCosts,
    heatingCosts,
    kwhPerSqm,
    efficiency,
    savingRate,
    annualSaving,
    oneTimeInvestment,
    annualSoftware,
    totalInvestment,
    years,
    payback,
    co2Saving10
  };
}

function render() {
  const result = calculate();
  els.paybackYears.textContent = result.oneTimeInvestment === 0 || result.annualSaving === 0
    ? '-'
    : (result.payback === null ? '> 10 Jahre' : `${number.format(result.payback)} Jahre`);
  els.roi10.textContent = percent.format(result.years[10].roi);
  els.savingYear.textContent = euro.format(result.annualSaving);
  els.energyCost.textContent = euro.format(result.energyCosts);
  els.warmWaterShare.textContent = result.buildingType ? percent.format(result.warmWaterShare) : '-';
  els.heatingCost.textContent = euro.format(result.heatingCosts);
  els.kwhPerSqm.textContent = result.kwhPerSqm > 0 ? number.format(result.kwhPerSqm) : '-';
  els.efficiencyClass.textContent = result.efficiency ? result.efficiency[0] : '-';
  els.savingRate.textContent = percent.format(result.savingRate);
  els.investmentTotal.textContent = euro.format(result.totalInvestment);
  els.profit5.textContent = euro.format(result.years[5].cumulative);
  els.co210.textContent = `${number.format(result.co2Saving10)} t`;
  renderChart(result.years);
  els.yearTable.innerHTML = result.years.map(row => `
    <tr>
      <td>${row.year}</td>
      <td class="num">${euro.format(row.oneTimeCost)}</td>
      <td class="num">${euro.format(row.runningCost)}</td>
      <td class="num">${euro.format(row.saving)}</td>
      <td class="num">${euro.format(row.profit)}</td>
      <td class="num">${euro.format(row.cumulative)}</td>
      <td class="num">${percent.format(row.roi)}</td>
    </tr>
  `).join('');
}

function renderChart(years) {
  const width = 900;
  const height = 280;
  const padding = { top: 24, right: 34, bottom: 42, left: 72 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const values = years.flatMap(row => [row.cumulative, row.roi * 100]);
  let min = Math.min(0, ...values);
  let max = Math.max(0, ...values);
  if (min === max) {
    min = -1;
    max = 1;
  }
  const range = max - min;
  min -= range * 0.12;
  max += range * 0.12;

  const x = index => padding.left + (index / (years.length - 1)) * innerWidth;
  const y = value => padding.top + (1 - ((value - min) / (max - min))) * innerHeight;
  const linePath = key => years.map((row, index) => `${index === 0 ? 'M' : 'L'} ${x(index).toFixed(2)} ${y(key(row)).toFixed(2)}`).join(' ');
  const zeroY = y(0);
  const ticks = 4;
  const grid = Array.from({ length: ticks + 1 }, (_, index) => {
    const value = min + ((max - min) / ticks) * index;
    const yy = y(value);
    return `<line x1="${padding.left}" y1="${yy}" x2="${width - padding.right}" y2="${yy}" class="chart-grid"/><text x="${padding.left - 12}" y="${yy + 4}" class="chart-label" text-anchor="end">${formatChartValue(value)}</text>`;
  }).join('');
  const labels = years.map((row, index) => `<text x="${x(index)}" y="${height - 15}" class="chart-label" text-anchor="middle">${row.year}</text>`).join('');
  const points = years.map((row, index) => `<circle cx="${x(index)}" cy="${y(row.cumulative)}" r="3.5" class="chart-point"/>`).join('');

  els.roiChart.innerHTML = `
    <rect x="0" y="0" width="${width}" height="${height}" class="chart-bg"/>
    ${grid}
    <line x1="${padding.left}" y1="${zeroY}" x2="${width - padding.right}" y2="${zeroY}" class="chart-zero"/>
    <path d="${linePath(row => row.cumulative)}" class="chart-line chart-line-profit"/>
    <path d="${linePath(row => row.roi * 100)}" class="chart-line chart-line-roi"/>
    ${points}
    ${labels}
  `;
}

function formatChartValue(value) {
  if (Math.abs(value) >= 1000) return `${number.format(value / 1000)}k`;
  return number.format(value);
}

function csvEscape(value) {
  const text = String(value ?? '');
  return /[;"\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function exportCsv() {
  const result = calculate();
  const rows = [
    ['Kunde', els['customer-name'].value],
    ['Projekt', els['project-name'].value],
    ['Gebäudeart', result.buildingType?.[0] || ''],
    ['Warmwasseranteil', result.warmWaterShare],
    ['Energieträger', result.co2?.[0] || ''],
    ['Energieverbrauch p.a. kWh', value('energy-consumption')],
    ['Heizkosten p.a.', result.heatingCosts.toFixed(2)],
    ['Effizienzklasse', result.efficiency?.[0] || ''],
    ['Einsparannahme', result.savingRate],
    ['Einsparung p.a.', result.annualSaving.toFixed(2)],
    ['Amortisation', result.payback === null ? '>10' : result.payback.toFixed(2)],
    [],
    ['Jahr', 'Einmalkosten', 'Laufende Kosten', 'Einsparung', 'Gewinn/Jahr', 'Kumuliert', 'ROI'],
    ...result.years.map(row => [
      row.year,
      row.oneTimeCost.toFixed(2),
      row.runningCost.toFixed(2),
      row.saving.toFixed(2),
      row.profit.toFixed(2),
      row.cumulative.toFixed(2),
      row.roi
    ])
  ];
  const csv = rows.map(row => row.map(csvEscape).join(';')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${sanitizeFilename(els['project-name'].value || 'sensise-roi')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

function sanitizeFilename(value) {
  return value.trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '_') || 'sensise-roi';
}

function init() {
  els['building-type'].innerHTML = '<option value="">Bitte wählen</option>' + BUILDING_TYPES.map(([name]) => `<option>${name}</option>`).join('');
  els['energy-carrier'].innerHTML = '<option value="">Bitte wählen</option>' + CO2_FACTORS.map(([name]) => `<option>${name}</option>`).join('');

  document.querySelectorAll('input, select').forEach(input => {
    input.addEventListener('input', render);
    input.addEventListener('change', render);
  });
  document.getElementById('csv-btn').addEventListener('click', exportCsv);
  document.getElementById('print-btn').addEventListener('click', () => {
    document.title = sanitizeFilename(els['project-name'].value || 'Sensise ROI-Rechner');
    window.print();
  });
  render();
}

init();
