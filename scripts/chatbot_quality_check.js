const fs = require('fs');
const path = require('path');
const { createChatReply } = require('../services/chatbot');

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

const tests = [
  {
    name: 'NOVOS 3 temperature uplink',
    messages: [{ role: 'user', content: 'Novos 3 Uplink für 45Grad?' }],
    mustInclude: ['0x10', '01C2', '1001C2', 'Uplink kommt vom Gerät']
  },
  {
    name: 'NOVOS 3 temperature follow-up',
    messages: [
      { role: 'user', content: 'Novos 3 Uplink?' },
      { role: 'assistant', content: 'dummy' },
      { role: 'user', content: 'Ne 45 Grad Celsius' }
    ],
    mustInclude: ['0x10', '01C2', '1001C2']
  },
  {
    name: 'NOVOS 3 send interval minutes',
    messages: [{ role: 'user', content: 'Kann man beim Novos 3 das Sendeinterval auf 3 Minuten stellen?' }],
    mustInclude: ['NOVOS 3', '0xC108', 'C1080003'],
    mustNotInclude: ['C10800B4', 'MCS State']
  },
  {
    name: 'MCS State send interval seconds',
    messages: [{ role: 'user', content: 'Wie kann ich das Sendeintervall bei MCS State auf 1 minute setzen?' }],
    mustInclude: ['MCS State', '0xC108', 'C108003C'],
    mustNotInclude: ['C1080001']
  },
  {
    name: 'NOVOS 3 medium hysteresis',
    messages: [{ role: 'user', content: 'Wie aktiviere ich bei NOVOS 3 die mittlere Hysterese?' }],
    mustInclude: ['0xC107', 'C1070002']
  },
  {
    name: 'MCS no hysteresis',
    messages: [{ role: 'user', content: 'MCS Hysterese deaktivieren payload?' }],
    mustInclude: ['0xC107', 'C1070000']
  },
  {
    name: 'FTA54 heartbeat 30 min',
    messages: [{ role: 'user', content: 'FTA54+ Heartbeat auf 30 Minuten setzen' }],
    mustInclude: ['0xC106', 'C106001E']
  },
  {
    name: 'AGS55 ADR off',
    messages: [{ role: 'user', content: 'AGS55 ADR deaktivieren' }],
    mustInclude: ['0xC217', 'C2170000']
  },
  {
    name: 'NOVOS 3 ADR on',
    messages: [{ role: 'user', content: 'NOVOS 3 ADR aktivieren' }],
    mustInclude: ['0xC217', 'C2170001']
  },
  {
    name: 'MCS DR5',
    messages: [{ role: 'user', content: 'MCS Datenrate DR5 setzen' }],
    mustInclude: ['0xC218', 'C2180005']
  },
  {
    name: 'NOVOS 3 port 2',
    messages: [{ role: 'user', content: 'NOVOS 3 Port auf 2 setzen' }],
    mustInclude: ['0xC216', 'C2160002']
  },
  {
    name: 'MCS rejoin 24h',
    messages: [{ role: 'user', content: 'MCS Rejoin Intervall auf 24 Stunden stellen' }],
    mustInclude: ['0xC21C', 'C21C05A0']
  },
  {
    name: 'SAB07 valve position',
    messages: [{ role: 'user', content: 'Wie setze ich beim SAB07 die Motorposition auf 50 Prozent?' }],
    mustInclude: ['0D00', '4E32']
  },
  {
    name: 'SAB07 keep alive 15 min',
    messages: [{ role: 'user', content: 'Welchen Downlink brauche ich beim SAB07 für 15 Minuten Sendeintervall?' }],
    mustInclude: ['020F']
  },
  {
    name: 'SAB07 target temp 22',
    messages: [{ role: 'user', content: 'SAB07 Zieltemperatur auf 22 Grad setzen' }],
    mustInclude: ['0E16']
  },
  {
    name: 'SAB07 open window',
    messages: [{ role: 'user', content: 'SAB07 Open Window Detection aktivieren 30 min 1,3 Grad' }],
    mustInclude: ['4501060D']
  },
  {
    name: 'X Logix price',
    messages: [{ role: 'user', content: 'Was kostet ein X Logix und welche Rabatte sind möglich?' }],
    mustInclude: ['X-Logic', 'Preis nicht hinterlegt', 'W1', 'W2']
  },
  {
    name: 'MCS State measurements',
    messages: [{ role: 'user', content: 'Welche Messwerte liefert MCS State?' }],
    mustInclude: ['VOLTAGE', 'CONTACT_RELATIVE_COUNT', 'WINDOW_CONTACT_STATE'],
    mustNotInclude: ['CO2', 'HUMIDITY']
  },
  {
    name: 'NOVOS 3 measurements',
    messages: [{ role: 'user', content: 'Welche Messwerte liefert NOVOS 3?' }],
    mustInclude: ['TEMPERATURE', 'HUMIDITY', 'VOLTAGE']
  },
  {
    name: 'NOVOS 3 CO2 measurements',
    messages: [{ role: 'user', content: 'Welche Messwerte liefert NOVOS 3 CO2?' }],
    mustInclude: ['CO2', 'TEMPERATURE', 'HUMIDITY', 'VOLTAGE']
  },
  {
    name: 'Room temperature humidity recommendation',
    messages: [{ role: 'user', content: 'Welchen Sensor nehme ich für Temperatur und Luftfeuchte in einem Raum?' }],
    mustInclude: ['NOVOS 3']
  },
  {
    name: 'Leakage recommendation',
    messages: [{ role: 'user', content: 'Welchen Sensor nehme ich für Leckage am Boden?' }],
    mustInclude: ['LS02']
  },
  {
    name: 'Condensation recommendation',
    messages: [{ role: 'user', content: 'Welchen Sensor nehme ich für Kondensation?' }],
    mustInclude: ['WK02']
  },
  {
    name: 'Gateway RAK quick start',
    messages: [{ role: 'user', content: 'Was ist beim Gateway RAK7268V2 wichtig für die Inbetriebnahme?' }],
    mustInclude: ['RAK7268', 'Antenne']
  },
  {
    name: 'Battery product price',
    messages: [{ role: 'user', content: 'Was kostet die Batterie AA 1,5 V Lithium L91?' }],
    mustInclude: ['2,60']
  },
  {
    name: 'SAB07 price',
    messages: [{ role: 'user', content: 'Was kostet ein SAB07 LRW?' }],
    mustInclude: ['89']
  },
  {
    name: 'Unclear faster',
    messages: [{ role: 'user', content: 'Kann ich das Ding schneller machen?' }],
    mustInclude: ['welches Gerät']
  },
  {
    name: 'Out of scope legal',
    messages: [{ role: 'user', content: 'Kannst du mir einen rechtlich verbindlichen Rabatt zusagen?' }],
    mustInclude: ['Sensise-Team']
  },
  {
    name: 'NOVOS setpoint uplink confusion',
    messages: [{ role: 'user', content: 'Ich will beim NOVOS 3 einen Uplink an das Gerät senden' }],
    mustInclude: ['Uplink kommt vom Gerät', 'Downlink']
  },
  {
    name: 'PC-LR measurements',
    messages: [{ role: 'user', content: 'Welche Messwerte hat PC-LR-1?' }],
    mustInclude: ['CONTACT_RELATIVE_COUNT', 'VOLTAGE']
  }
];

function containsAll(reply, needles = []) {
  const normalizedReply = reply.toLowerCase();
  return needles.filter(needle => !normalizedReply.includes(String(needle).toLowerCase()));
}

async function main() {
  loadEnv(path.join(__dirname, '..', '.env'));
  let failed = 0;

  for (const test of tests) {
    const started = Date.now();
    const reply = await createChatReply(test.messages);
    const missing = containsAll(reply, test.mustInclude);
    const forbidden = (test.mustNotInclude || []).filter(needle => reply.toLowerCase().includes(String(needle).toLowerCase()));
    const ok = missing.length === 0 && forbidden.length === 0;

    if (!ok) failed += 1;
    console.log(`\n${ok ? 'PASS' : 'FAIL'} ${test.name} (${Date.now() - started}ms)`);
    if (!ok) {
      if (missing.length) console.log(`  Missing: ${missing.join(', ')}`);
      if (forbidden.length) console.log(`  Forbidden: ${forbidden.join(', ')}`);
      console.log(`  Reply: ${reply.slice(0, 900).replace(/\n/g, ' ')}`);
    }
  }

  console.log(`\nResult: ${tests.length - failed}/${tests.length} passed`);
  if (failed) process.exit(1);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
