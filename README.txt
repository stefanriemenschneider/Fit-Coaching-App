Fit Coaching — Daily Mindset (Web App / PWA)

Was ist das?
- Eine kleine Web-App, die jeden Tag ein Bild + einen Spruch zeigt (50 Tage ab 20.02.2026).
- Läuft auf Android & iOS im Browser und kann wie eine App "installiert" werden (PWA).

So testest du es schnell:
1) Ordner irgendwo entpacken
2) Öffne "index.html" im Browser (für PWA/Offline am besten über Hosting)

Am einfachsten online stellen (ohne Technik):
- Netlify (Drag & Drop des Ordners) oder Vercel / GitHub Pages.

Auf Handy als App hinzufügen:
- iPhone (Safari): Teilen-Icon → "Zum Home-Bildschirm"
- Android (Chrome): Menü → "App installieren" oder "Zum Startbildschirm"

Bilder austauschen (deine 123RF/Stock-Bilder):
- Lege deine 50 Bilder in /assets/
- Benenne sie exakt so:
  day01.jpg, day02.jpg, ... day50.jpg
- Fertig. (Die App nutzt automatisch diese Dateien.)

Sprüche ändern/erweitern:
- Datei: /data/entries.json
- Dort steht Datum, Titel, Spruch, Bildpfad.

Hinweis zu Stock-Lizenzen:
- Prüfe, ob deine Lizenz die Nutzung in einer App/Web-App erlaubt (meist ja).
- Wichtig ist oft: keine "Weitergabe als reines Download-Paket". In der App sind sie eingebettet, nicht als Roh-Download angeboten.
