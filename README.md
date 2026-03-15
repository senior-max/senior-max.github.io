# 🎮 License To Bill
## Das IT Asset Management Berater-Abenteuer

> "Du hast einen Laptop, eine Lizenzliste mit 4.000 Zeilen und einen Kunden, der seit 2009 keine Software-Inventur gemacht hat. Viel Glück."

---

### Spielen

Das Spiel läuft direkt im Browser ohne Installation:

1. Repository klonen oder ZIP herunterladen
2. Einen lokalen HTTP-Server starten (wegen `fetch`-Aufrufen nötig):
   ```bash
   python3 -m http.server 8080
   ```
3. `http://localhost:8080` im Browser öffnen

> **Hinweis:** `index.html` direkt als Datei öffnen funktioniert nicht, da das Spiel JSON-Daten per `fetch` lädt.

**Online spielen:** [GitHub Pages Link einfügen]

---

### Über das Spiel

*License To Bill* ist ein satirisches Text-Adventure über das Leben als IT Asset Management Berater.  
Starte als Junior Consultant und arbeite dich durch 3 Projekte bis zum Manager — oder weiter, wenn du gut genug bist.

Triff Dieter (der die Excel von 2009 hütet), Kevin (der alles mit KI lösen will), und Ralf Steinbach von Microsoft (der niemals lächelt).

**Features:**
- 📖 3 vollständige Projekte mit je 6–8 Szenen und mehreren Enden
- 📊 5-Stats-System: Kompetenz, Bullshit, Kundenliebe, Burnout, Prestige
- 🏅 15 Achievements + Hall of Shame für Totaldesaster
- 🎮 2 Minispiele: Excel-Audit & Reisekostenabrechnung
- 📬 E-Mail-System mit 14 Mails zwischen Projekten
- 🎲 Meeting-Roulette: zufällige Meetings mit echten Konsequenzen
- 💬 7 NPCs mit eigenem Dialog und Stat-Einfluss
- 🔊 Synthetisierte Sound-Effekte (Web Audio API, keine externen Dateien)
- 📱 Vollständig responsiv — funktioniert auf Desktop und Mobile
- 💾 Auto-Save via localStorage
- 🔧 Debug-Modus: `greysuit` tippen (irgendwo auf dem Hauptmenü)

---

### Entwicklung

**Stack:** Vanilla JavaScript (ES2020), HTML5, CSS3  
**Keine Dependencies:** Kein npm, kein Framework, kein Build-Prozess

#### Dateistruktur

```
LicenseToBill/
├── index.html                  # Einzige HTML-Datei
├── css/
│   ├── tokens.css              # Design-Tokens (Farben, Abstände, Schriften)
│   ├── main.css                # Layout, Komponenten, Media Queries
│   └── animations.css          # @keyframes
├── js/
│   ├── main.js                 # Einstiegspunkt, Boot-Sequenz
│   ├── engine.js               # Game State Machine (zentrales Gehirn)
│   ├── renderer.js             # DOM-Ausgabe, Overlays, Szenenrendering
│   ├── storage.js              # localStorage-Wrapper
│   ├── stats.js                # Stat-Balken-Rendering
│   ├── career.js               # Karrieresystem, Level-Boni
│   ├── achievements.js         # Achievement-Trigger-System
│   ├── npcs.js                 # NPC-Dialog und Stat-Modifier
│   ├── email.js                # E-Mail-Posteingang zwischen Projekten
│   ├── sound.js                # Web Audio API Soundeffekte
│   ├── menu.js                 # Hauptmenü, Credits, Spielstart
│   ├── keyboard.js             # Tastaturnavigation, Focus-Trap
│   ├── ui.js                   # Projektauswahl, Hall of Shame, Game Complete
│   ├── debug.js                # Debug-Overlay (aktiviert durch "greysuit")
│   └── minigames/
│       ├── excel.js            # Excel-Minispiel
│       └── reisekosten.js      # Reisekostenabrechnung-Minispiel
└── data/
    ├── config.json             # Spielkonfiguration
    ├── npcs.json               # NPC-Definitionen
    ├── emails.json             # E-Mail-Pool (14 Mails)
    ├── achievements.json       # Achievement-Definitionen
    └── stories/
        ├── schema.json         # Story-JSON-Schema (Dokumentation)
        ├── projekt_dieter.json # Projekt 1: Operation Dieter
        ├── projekt_sap_zombies.json  # Projekt 2: Die SAP-Zombie-Lizenzen
        └── projekt_shadow_it.json   # Projekt 3: Shadow IT im Keller
```

#### Ein neues Projekt hinzufügen

1. Neue JSON-Datei nach `data/stories/schema.json` anlegen
2. `id` in `ALL_PROJECT_IDS` in `js/ui.js` eintragen
3. Fertig — das Spiel lädt sie automatisch

#### Neues Achievement hinzufügen

1. Eintrag in `data/achievements.json` hinzufügen
2. An der richtigen Stelle `window.Achievements.checkTrigger('mein_trigger')` aufrufen

---

### Tastaturkürzel

| Taste | Aktion |
|---|---|
| `1` – `4` | Option auswählen |
| `Enter` | Fokussiertes Element bestätigen |
| `Escape` | Overlay schließen |
| `Ctrl + S` | Spielstand speichern |
| `M` | Ton ein/ausschalten |
| `↑` `↓` | E-Mail-Liste navigieren |
| `greysuit` tippen | Debug-Modus |

---

### Credits

Entwickelt mit Vanilla JS, einem Hauch Wahnsinn, und zu viel Kaffee.

Inspiriert von echten IT-Projekten. Namen geändert. Dieter weiß Bescheid.

**Besonderer Dank:**
- Allen Dieters dieser Welt
- Kevin (es war nicht so gemeint)
- HAL 9000 (Toner wurde nie nachgekauft)
- Microsoft (ohne euch wären Audits nur halb so spannend)
- Ralf Steinbach (Ihr Protokoll war sehr vollständig)

> EASTER EGG: Wenn du diese README liest, hast du zu viel Zeit.  
> Dieter hat übrigens gerade wieder eine E-Mail geschickt.

---

*[ GREYSUIT & PARTNER CONSULTING — DELIVERING VALUE SINCE HEUTE ]*
