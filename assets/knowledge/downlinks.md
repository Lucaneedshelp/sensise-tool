# LoRaWAN Downlink- und Payload-Wissensbasis

## Grundregel fuer den Bot

Der Bot darf konkrete Downlink-Payloads nur nennen, wenn die passende Schnittstellenbeschreibung fuer das konkrete Geraet vorhanden ist. Wenn Geraet, Firmware/Codec, FPort, Parameter oder Wertebereich unklar sind, soll der Bot rueckfragen und keine Payload erfinden.

Bei Downlinks immer nennen:

- Geraet / Artikel
- Zielparameter
- FPort / Port, wenn bekannt
- Payload in Hex
- Einheit und Umrechnung
- Hinweis auf LoRaWAN Duty Cycle, Batterielaufzeit und bestaetigte Downlinks bei kritischen Einstellungen

## Thermokon LoRaWAN Schnittstelle allgemein

Quelle: Thermokon LoRaWAN Schnittstellenbeschreibung fuer AF25+ LRW, AGS55+ LRW, AKF10+ LRW, DPA(x)+ LRW, FTA54+ LRW, FTK+ LRW, LA+ LRW, Li65+ LRW, LK+ LRW, LS02+ LRW, MCS(x) LRW, MWF+ LRW, NOVOS 3 LRW, OF14+ LRW, TF25+ LRW, WK02+ LRW, WSA LRW.

Ein Thermokon LoRaWAN-Telegramm besteht aus:

1. Identifier fuer die nachfolgenden Datenbytes
2. Datenwert

Beispiel Uplink: `10 00A6 12 1688 13 000B`

### Uplink-Messwerte Thermokon

| Identifier | Datentyp | Bedeutung | Einheit / Teiler |
|---|---|---|---|
| `0x10` | INT16 | Temperatur 1 | Grad Celsius / 10 |
| `0x11` | INT8 | relative Feuchte | Prozent rH |
| `0x12` | UINT16 | CO2 | ppm |
| `0x13` | UINT16 | VOC | Prozent |
| `0x30` | UINT16 | Absoluter Druck | mBar / hPa |
| `0x31` | INT16 | Differenzdruck | Pa |
| `0x32` | UINT16 | Volumenstrom | m3/h, Einheit geraeteabhaengig |
| `0x40` | UINT16 | Beleuchtungsstaerke | lux |
| `0x41` | UINT8 | Raumbelegung | Bit 0 Zustand; Bit 1-7 Bewegungsanzahl seit letztem Senden |
| `0x50` | UINT8 | Reedkontakt 1 | Bit 0 Zustand; Bit 1-7 Schaltvorgaenge seit letztem Senden |
| `0x51` | INT16 | Leckage / Kondensation | Bit 15 Relaiszustand; Bit 0-14 Rohwert |
| `0x54` | INT8 | Energielevel | mV / 0,05 |
| `0x55` | INT8 | Taster 1 | Bit 0 kurz/lang; Bit 1-7 je nach Modus |
| `0x63` | INT8 | Sollwert | Prozent |
| `0x9100` | INT16 | Temperatur 2 | Grad Celsius / 10 |
| `0x9500` | UINT8 | Reedkontakt 2 | Bit 0 Zustand; Bit 1-7 Schaltvorgaenge |
| `0x9550` | INT8 | Taster 2 | Bit 0 kurz/lang; Bit 1-7 je nach Modus |
| `0x9630` | INT16 | Sollwert 2 | Grad Celsius / 10, konfigurierbar |
| `0xA100` | INT16 | Temperatur 2 | Grad Celsius / 10 |

### Thermokon Downlink-Konfiguration allgemein

Downlink-Konfiguration besteht ebenfalls aus Identifier und Datenwert. Wenn eine Geraetesoftware die Einheit als geraeteabhaengig beschreibt, darf der Bot ohne zusaetzliche Geraetedoku keinen exakten Wert behaupten.

| Identifier | Datentyp | Bedeutung | Default / Hinweis |
|---|---|---|---|
| `0xC100` | UINT16 | Steuerbefehle | 1 Reset Configuration, 2 Save Configuration, 3 Reboot |
| `0xC106` | UINT16 | Heartbeatintervall | Minuten, Default 1440 |
| `0xC107` | UINT16 | Hysterese Sendeverhalten | 0 keine, 1 gross, 2 mittel, 3 klein |
| `0xC108` | UINT16 | Messintervall / Uplink-Intervall | Einheit s/min geraeteabhaengig, Default 60/5 je nach Geraet |
| `0xC10B` | UINT16 | Latenzzeit digitale Eingaenge | Sekunden, Default 10 |
| `0x8413` | UINT16 | Deaktivierungszeit Bewegungssensor | Sekunden, Default 10 |
| `0x8414` | UINT16 | Nachlaufzeit Bewegungssensor | Sekunden, Default 600 |
| `0xC216` | UINT16 | Uplink-/Downlink-Port | Default 2, gueltig 1-223 |
| `0xC217` | UINT16 | Adaptive Data Rate ADR | 0 deaktiviert, 1 aktiviert |
| `0xC218` | UINT16 | Datenrate DR | 0=DR0/SF12 bis 5=DR5/SF7 |
| `0xC21C` | UINT16 | Re-Join Intervall | Minuten, 0 deaktiviert, `0x05A0` = 1440 min |
| `0xC21D` | UINT16 | Confirmation Activation fuer Heartbeat | 0 deaktiviert, 1 aktiviert |

Antwortregel: Bei Thermokon Standardgeraeten kann der Bot erklaeren, dass z. B. das Heartbeatintervall ueber `0xC106` und das Uplink-/Messintervall ueber `0xC108` konfiguriert wird. Eine konkrete Hex-Payload fuer `0xC108` soll er nur bilden, wenn fuer das konkrete Geraet klar ist, ob Sekunden oder Minuten genutzt werden und wie die Plattform den Identifier/Datenwert erwartet.

### Thermokon Standardgeraete: gemeinsame Downlink-Regeln

Die folgenden Geraete/Familien sind in der Thermokon LoRaWAN Schnittstellenbeschreibung enthalten und koennen fuer allgemeine Thermokon-Konfigurationsparameter nach demselben Schema beantwortet werden:

- AF25+ LRW
- AGS55+ LRW
- AKF10+ LRW
- DPA(x)+ LRW / DPA2500+ LRW
- FTA54+ LRW
- FTK+ LRW
- LA+ LRW
- Li65+ LRW
- LK+ LRW
- LS02+ LRW
- MCS(x) LRW / MCS Temp_rH / MCS Lum / MCS Occ / MCS State
- MWF+ LRW
- NOVOS 3 LRW / NOVOS 3 EPD / NOVOS 3 INC
- OF14+ LRW
- TF25+ LRW
- WK02+ LRW
- WSA LRW

Fuer allgemeine Thermokon-Konfigurationsparameter wie Hysterese Sendeverhalten, Heartbeatintervall, Port, ADR, Datenrate und Re-Join darf der Bot die Thermokon-Parameter aus der Tabelle verwenden. Der Bot soll also nicht sagen, dass die Information fehlt, nur weil der Nutzer ein konkretes Geraet wie MCS, FTA54 oder AGS55 nennt, solange es in dieser Liste/Familie enthalten ist.

Wichtiger Hinweis zur Byte-Codierung: Die Schnittstellenbeschreibung beschreibt den Aufbau als Identifier plus Datenwert. Fuer UINT16-Werte soll der Bot den Wert als 2-Byte-Hexwert in Big-Endian darstellen, aber er soll dazusagen, dass die finale Eingabe vom verwendeten LNS/Codec bzw. der Plattform abhaengen kann.

#### Thermokon Hysterese Sendeverhalten

Parameter:

- Identifier: `0xC107`
- Datentyp: `UINT16`
- Bedeutung: Hysterese Sendeverhalten
- Werte:
  - `0` = keine Hysterese
  - `1` = grosse Hysterese
  - `2` = mittlere Hysterese
  - `3` = kleine Hysterese

Beispielpayloads, wenn der LNS/Codec Identifier + UINT16 Big-Endian erwartet:

| Ziel | Wert | Payload |
|---|---:|---|
| Hysterese deaktivieren | `0` | `C1070000` |
| grosse Hysterese aktivieren | `1` | `C1070001` |
| mittlere Hysterese aktivieren | `2` | `C1070002` |
| kleine Hysterese aktivieren | `3` | `C1070003` |

Antwortregel fuer Nutzerfragen wie "Wie aktiviere ich bei [Thermokon-Geraet] die Hysterese?":

Der Bot soll antworten: "Bei Thermokon LRW-Geraeten aus der Schnittstellenbeschreibung wird das Sendeverhalten ueber den Parameter `0xC107` konfiguriert. `0` bedeutet keine Hysterese, `1` grosse, `2` mittlere, `3` kleine Hysterese. Wenn dein LNS/Codec Identifier + UINT16 Big-Endian erwartet, waere z. B. fuer mittlere Hysterese die Payload `C1070002`. Bitte pruefe den Downlink-Port bzw. die Codec-Eingabe in deiner Plattform."

Wenn der Nutzer nur "aktivieren" sagt, soll der Bot nachfragen, ob grosse, mittlere oder kleine Hysterese gewuenscht ist. Er darf als typischen Vorschlag "mittlere Hysterese" nennen, aber nicht behaupten, dass dies immer richtig ist.

#### Thermokon Heartbeatintervall

Parameter:

- Identifier: `0xC106`
- Datentyp: `UINT16`
- Bedeutung: Heartbeatintervall
- Einheit: Minuten
- Default: 1440 Minuten

Beispielpayloads, wenn Identifier + UINT16 Big-Endian erwartet wird:

| Ziel | Wert | Payload |
|---|---:|---|
| 60 Minuten | `60` / `0x003C` | `C106003C` |
| 12 Stunden | `720` / `0x02D0` | `C10602D0` |
| 24 Stunden | `1440` / `0x05A0` | `C10605A0` |

#### Thermokon Messintervall / Uplink-Intervall

Parameter:

- Identifier: `0xC108`
- Datentyp: `UINT16`
- Bedeutung: Messintervall / Uplink-Intervall
- Einheit: Sekunden oder Minuten, abhaengig vom Geraetetyp bzw. Softwarebeschreibung
- Default: 60/5, geraeteabhaengig

Antwortregel: Der Bot darf `0xC108` als richtigen Parameter nennen, soll aber bei konkreten Minuten-/Sekundenwerten nach dem Geraet bzw. der Softwarebeschreibung fragen, wenn die Einheit nicht eindeutig ist. Er darf keine konkrete `C108....` Payload behaupten, wenn unklar ist, ob Sekunden oder Minuten gelten.

#### Thermokon Port / ADR / Re-Join

| Ziel | Identifier | Werte / Hinweis |
|---|---|---|
| Uplink-/Downlink-Port | `0xC216` | UINT16, gueltige Ports 1-223, Default 2 |
| ADR | `0xC217` | `0` deaktiviert, `1` aktiviert |
| Datenrate DR | `0xC218` | `0` DR0/SF12 bis `5` DR5/SF7 |
| Re-Join Intervall | `0xC21C` | Minuten, `0` deaktiviert, `0x05A0` = 1440 min |
| Confirmation Activation fuer Heartbeat | `0xC21D` | `0` deaktiviert, `1` aktiviert |

Antwortregel: Bei diesen Standardparametern soll der Bot die Identifier und Werte nennen und bei konkreter Payload die UINT16-Big-Endian-Variante als Beispiel formulieren, mit Hinweis auf LNS/Codec-Pruefung.

## SAB07 LRW Downlinks

Quelle: SAB07_LRW_Manual_en, Issue date 29.09.2023.

SAB07 ist LoRaWAN Class A. Downlinks koennen nur in Empfangsfenstern nach Uplinks empfangen werden. Fuer kritische Einstellungen empfiehlt die Doku confirmed Downlinks. Ein Downlink-Paket kann mehrere Kommandos kombinieren.

LoRaWAN MAC:

- Uplink-Port: `2`
- Downlink-Port: `1`, `2`, `4-223`
- Wenn der Nutzer keinen Port nennt, beim SAB07 als Standard erst nach dem verwendeten LNS/Port fragen; haeufig wird Port `2` genutzt, aber die Doku erlaubt mehrere Downlink-Ports.

### SAB07 haeufige Kommandos

| Ziel | Set Payload | Get Payload | Einheit / Regel | Beispiel |
|---|---|---|---|---|
| Keep-alive / Sendeintervall | `02 XX` | `12` | `XX` = Minuten, `00` nicht erlaubt. Default `0A` = 10 min. Meist min. 3 min, empfohlen >= 10 min. | 10 min: `020A`; 15 min: `020F`; 30 min: `021E` |
| Uplink-Typ | `11 XX` | `1B` | `00` unconfirmed, `01` confirmed | confirmed Uplinks: `1101` |
| Online-Betriebsmodus | `0D XX` | `18` | `00` Manual, `01` Automatic, `02` Automatic mit externer Temperatur | Automatic: `0D01` |
| PI Run Period | `41 XX` | `40` | `XX` = Minuten, Default 10 | 15 min: `410F` |
| Temperatur-Hysterese | `43 XX` | `42` | Wert mal 10, min. 0,2 Grad C | 0,3 Grad C: `4303` |
| Zieltemperatur 1,0 Grad | `0E XX` | - | `XX` = Grad Celsius, nur in Online Automatic Modes | 22 Grad C: `0E16` |
| Zieltemperatur 0,1 Grad | `51 XXXX` | `52` Antwort automatisch bei nicht-ganzzahliger Zieltemperatur | Wert = Temperatur * 10 als UINT16 | 25,8 Grad C: `510102` |
| Ventiloeffnung manuell | `4E XX` | - | Nur Manual Mode, `XX` = Prozent | 10 Prozent: `4E0A` |
| Ventiloeffnungsbereich | `4F XX YY` | `50` | `XX` = 100 - max Prozent, `YY` = 100 - min Prozent | min 20 %, max 60 %: `4F2850` |
| Externe Temperatur 1,0 Grad | `0F XX` | - | Nur Modus externe Temperatur, `XX` = Grad Celsius | 20 Grad C: `0F14` |
| Externe Temperatur 0,1 Grad | `3C XXXX` | `44` | Wert = Temperatur * 10 als UINT16 | 25,8 Grad C: `3C0102` |
| Interner Temperatur-Offset | `53 XX` | `54` | Offset -5 bis +5 Grad mit Tabelle unten | 0 Grad: `531C`; +2 Grad: `5327` |
| Temperaturbereich | `08 XX YY` | `15` | `XX` untere Grenze, `YY` obere Grenze in Grad C | 16-24 Grad C: `081018` |
| Open Window Detection | `45 AA BB CC` | `46` | `AA` Bit0 enable, `BB` Dauer in 5-min-Schritten, `CC` Delta * 10 | aktiv, 30 min, 1,3 Grad: `4501060D` |
| Network Join Retry Period | `10 XX` | `19` | Sekunden = `XX * 5`, `00` nicht erlaubt, empfohlen eher hohe Werte | 20 min = 1200 s -> `F0`: `10F0` |
| Recalibrate Motor | `03` | - | Nutzung vermeiden; kalibriert Motor und schliesst Ventil | `03` |
| Force Close | `0B` | - | Nutzung vermeiden; schliesst bis Over-Voltage erkannt wird | `0B` |
| Reset Device | `30` | - | Geraet resetten, nicht Werkseinstellungen | `30` |
| Hardware-/Software-Version lesen | `04` | Antwort folgt im naechsten Uplink | Nur Get/Read | `04` |

### SAB07 Formeln

Keep-alive / Sendeintervall:

- Minuten in Hex umrechnen.
- Payload = `02` + Minuten als 1 Byte.
- 10 Minuten = dezimal 10 = `0A` -> `020A`.
- 15 Minuten = dezimal 15 = `0F` -> `020F`.
- 30 Minuten = dezimal 30 = `1E` -> `021E`.

PI Run Period:

- Minuten in Hex umrechnen.
- Payload = `41` + Minuten als 1 Byte.
- 15 Minuten = `410F`.

Zieltemperatur 1,0 Grad:

- Payload = `0E` + Temperatur in Grad Celsius als 1 Byte.
- 22 Grad C = `16` -> `0E16`.
- Nur in Online Automatic Mode oder Automatic Mode mit externer Temperatur verwenden.

Zieltemperatur 0,1 Grad:

- Wert = Zieltemperatur * 10.
- Wert als UINT16 hex codieren.
- Payload = `51` + UINT16.
- 25,8 Grad C -> 258 dezimal -> `0102` -> `510102`.

Ventiloeffnung:

- Nur Manual Mode.
- Payload = `4E` + Prozent als 1 Byte.
- 10 Prozent = `0A` -> `4E0A`.

Ventiloeffnungsbereich:

- Payload = `4F` + `100 - max` + `100 - min`.
- min 20 %, max 60 %: max Byte = 40 dezimal = `28`, min Byte = 80 dezimal = `50`, Payload `4F2850`.

Open Window Detection:

- Payload = `45` + Enable + Dauer + Temperaturdelta.
- Enable: `01` aktiv, `00` deaktiviert.
- Dauer: 5-Minuten-Schritte. 30 min = 6 = `06`.
- Delta: Grad C * 10. 1,3 Grad = 13 = `0D`.
- Beispiel: aktiv, 30 min, 1,3 Grad -> `4501060D`.

Network Join Retry Period:

- Wert `XX` = Sekunden / 5.
- 20 Minuten = 1200 Sekunden; 1200 / 5 = 240 dezimal = `F0`.
- Payload: `10F0`.

Interner Temperatur-Offset SAB07:

| Offset | Payload |
|---:|---|
| -5 Grad C | `5300` |
| -4 Grad C | `5305` |
| -3 Grad C | `530B` |
| -2 Grad C | `5311` |
| -1 Grad C | `5316` |
| 0 Grad C | `531C` |
| +1 Grad C | `5322` |
| +2 Grad C | `5327` |
| +3 Grad C | `532D` |
| +4 Grad C | `5333` |
| +5 Grad C | `5338` |

### SAB07 Antwortregeln

- Bei "Sendeintervall" oder "Keep-alive" fuer SAB07: Payload `02 XX` verwenden, `XX` in Minuten. Zusaetzlich auf Duty Cycle und Batterie hinweisen.
- Bei "PI-Intervall" / "Regelalgorithmus-Intervall": Payload `41 XX` verwenden, `XX` in Minuten. Nicht mit Keep-alive verwechseln.
- Bei "Zieltemperatur" fragen, ob 1,0-Grad- oder 0,1-Grad-Aufloesung gewuenscht ist. Bei Dezimaltemperatur `51` verwenden.
- Bei "Ventil oeffnen x Prozent" darauf hinweisen, dass `4E XX` nur im Manual Mode funktioniert.
- Bei "Open Window" Dauer in 5-Minuten-Schritte und Delta in 0,1 Grad umrechnen.
- Recalibrate Motor `03` und Force Close `0B` nur mit Warnhinweis nennen, weil die Doku die Nutzung vermeiden soll.
- Wenn ein Nutzer Downlinks fuer ein anderes Geraet als SAB07 oder Thermokon-Standardgeraete will, nach der konkreten Schnittstellenbeschreibung fragen.
