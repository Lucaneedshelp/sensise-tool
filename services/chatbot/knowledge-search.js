async function searchKnowledge(query) {
  const endpoint = String(process.env.AZURE_SEARCH_ENDPOINT || '').trim().replace(/\/+$/, '');
  const indexName = String(process.env.AZURE_SEARCH_INDEX || '').trim();
  const apiKey = String(process.env.AZURE_SEARCH_API_KEY || '').trim();

  if (!endpoint || !indexName || !apiKey || !String(query || '').trim()) {
    return '';
  }

  const url = `${endpoint}/indexes/${encodeURIComponent(indexName)}/docs/search?api-version=2024-07-01`;
  const payload = JSON.stringify({
    search: expandSearchQuery(query),
    searchFields: 'title,content,product',
    select: 'title,content,source,type,product',
    top: 8
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: payload
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Azure AI Search error:', data.error?.message || response.status);
      return '';
    }

    return (data.value || [])
      .map((item, index) => [
        `Treffer ${index + 1}: ${item.title || 'Ohne Titel'}`,
        item.product ? `Produkt: ${item.product}` : '',
        item.type ? `Typ: ${item.type}` : '',
        item.source ? `Quelle: ${item.source}` : '',
        String(item.content || '').trim()
      ].filter(Boolean).join('\n'))
      .join('\n\n---\n\n')
      .slice(0, 14000);
  } catch (error) {
    console.error('Azure AI Search request failed:', error.message);
    return '';
  }
}

function expandSearchQuery(query) {
  const normalized = String(query || '').toLowerCase();
  const additions = [];

  if (/(sab\s?07|motor|ventil|stellantrieb|stellung|position|oeffnung|öffnung)/i.test(normalized)) {
    additions.push('SAB07 Ventiloeffnung Ventilöffnung Ventilposition Ventilstellung Motorposition Motorstellung manuell Manual Mode 0D00 4E Prozent');
  }

  if (/(x[\s-]?logi[xc]|pc[\s-]?lr|wasserz|wasserzähler|wasserzaehler)/i.test(normalized)) {
    additions.push('X-Logic X Logic X Logix PC-LR-1 Wasserzaehler Wasserzähler Preis Messwerte VOLTAGE CONTACT_RELATIVE_COUNT');
  }

  if (/(rabatt|discount|w1|w2|nachlass|preis)/i.test(normalized)) {
    additions.push('Rabattgruppen W1 W2 Software SIM Karte Schulung Batterien maximale Rabatte Projektkalkulator');
  }

  if (/(uplink|payload|telegramm|decoder|temperatur|temperature|messwert)/i.test(normalized)) {
    additions.push('Thermokon Uplink-Messwerte LoRaWAN Payload Decoder Identifier 0x10 INT16 Temperatur Grad Celsius Teiler 10 TEMP_0 TEMP');
  }

  if (/(sendeintervall|sendeinterval|messintervall|intervall|c108|heartbeat|mcs\s*state)/i.test(normalized)) {
    additions.push('Thermokon Downlink Messintervall Sendeintervall Uplink-Intervall MCS State Identifier 0xC108 UINT16 Sekunden Minuten C108');
  }

  return [query, ...additions].filter(Boolean).join(' ');
}

module.exports = {
  expandSearchQuery,
  searchKnowledge
};
