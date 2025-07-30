# German Listening Comprehension Tool - Setup

## Projekt-Status

Das Basis-Framework ist jetzt bereit. Die folgenden Dateien müssen im GitHub Repository erstellt werden:

## Dateistruktur

```
listening-tool/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   ├── config.js
│   ├── modules/
│   │   ├── audio-player.js
│   │   ├── lesson-loader.js
│   │   ├── quiz-controller.js
│   │   └── keyboard-shortcuts.js
│   └── utils/
│       └── dom-helpers.js
├── audio/
│   └── A1L01-test.vtt
└── lessons/
    └── lessons.json
```

## Nächste Schritte

### 1. Dateien hochladen
Alle oben erstellten Dateien in die entsprechenden Verzeichnisse im Repository kopieren.

### 2. Audio-Datei erstellen
Für die Test-Lektion wird eine MP3-Datei benötigt:
- Dateiname: `A1L01-test.mp3`
- Inhalt: Die 7 Sätze aus der VTT-Datei eingesprochen
- Upload in den `audio/` Ordner

### 3. Testen
Nach dem Upload sollte die Seite unter https://smartergerman.github.io/listening-tool/?lesson=A1L01 funktionieren.

## Test-Sätze für Audio-Aufnahme

1. "Guten Tag! Wie geht es Ihnen?" (0-3 Sekunden)
2. "Mir geht es gut, danke. Und Ihnen?" (3.5-7 Sekunden)
3. "Die Kinder spielten gestern im Garten." (7.5-11 Sekunden)
4. "Können Sie mir bitte helfen?" (11.5-15 Sekunden)
5. "Es regnet schon wieder. Na toll!" (15.5-19 Sekunden)
6. "Ich gehe heute Abend ins Kino." (19.5-23 Sekunden)
7. "Der Zug fährt um acht Uhr ab." (23.5-27 Sekunden)

## Fehlende Features (für Phase 2)

- Auto-resize für iframe-Einbettung
- Erweiterte VTT-Parser-Fehlerbehandlung
- Mode-Switching UI-Verbesserung
- Statistik-Export
- Mehr Übungsmodi implementieren

## Debugging

Öffne die Browser-Konsole (F12) für Fehlermeldungen. Die App ist unter `window.listeningApp` verfügbar.

## Bekannte Einschränkungen

- Momentan nur ein Übungsmodus pro Satz
- Keine Speicherung des Fortschritts
- Keine Animation beim Antwort-Feedback