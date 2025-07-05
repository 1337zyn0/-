Abschlussarbeit von Jan Heine an der Carl von Ossietzky Universität Oldenburg
Sie beschäftigt sich mit der Erweiterung des untenstehenden Microgrid-Demonstrator´s 

# Interaktiver Industrie-Microgrid-Demonstrator
Der interaktive Microgrid-Demonstrator zeigt ein Szenario um ein typisches mittelständisches Industrieareal mit diversen Energieanlagen --
im Sinne von Verbrauchern und Erzeugern. Er soll dabei unterstützen den Transfer vom klassischen zum transparenten Energienetz greifbar zu machen, der
hier mithilfe einer modernen GRÄPER D3-Trafostation realisiert wird. Aufbauend darauf soll ein Energiemanagementsystem dabei helfen, Energieflüsse
zu steuern, um bspw. den CO2-Fußabdruck zu senken.

Besucher:innen interagieren allein mithilfe der vorhandenen 3D-Modelle, auf die der Tisch reagiert. Der Interactive Scape Tisch sendet daraufhin
TUIO-Signale, die von einer Javascript-Software ausgewertet werden um die grafische Oberfläche anzupassen.  

<img src="https://gitlab.offis.de/official/fbe-p_graeper-kooperation/microgrid-demonstrator/-/raw/main/docs/demonstrator1.jpg" height="200px"> <img src="https://gitlab.offis.de/official/fbe-p_graeper-kooperation/microgrid-demonstrator/-/raw/main/docs/demonstrator2.jpg" height="200px">

## Überblick
- **Problem:** Erneuerbare Energien machen verlässliche Stromversorgung komplexer, ob privat oder industriell. Im Niederspannungsnetz gibt es derzeit wenig Messequipment und folglich kaum Energietransparenz, dadurch fällt es uns schwer automatisierte Entscheidungen zu treffen.
- **Lösung:** Wir müssen Energie entweder dann verbrauchen, wenn sie verfügbar ist, oder Energie zwischenspeichern, um die Netze zu entlasten, die durch regenerative Energie stärker belastet wird.
- **How-To:** Energietransparenz herstellen, verstehen was im Netz passiert. Energiemanagement mit Sektorenkopplung anstreben. Spitzenlastglättung durch Lastenverschiebung oder Speicherung.
- **Call-to-action:** Jetzt informieren und ausprobieren, bevor die Zeit durch neue Regulierungen knapp wird.

## Zielgruppen und Zweck
- Fachpublikum (Messen)
  - Allgemein Unterschiede zwischen klassischem Netz, transparentem Netz und Energiemanagement erklären
  - Erfahrungen aus dem Umfeld der Besucher:innen diskutieren
  - Interesse einfangen
- Laien (öffentliche Veranstaltungen)
  - An das Thema heranführen, was auch im öffentlichen Netz durch §14a EnWG wichtig wird
  - Allgemein Unterschiede zwischen klassischem Netz, transparentem Netz und Energiemanagement erklären
  - Ggf. auf Beispiele aus dem privaten Bereich übertragen

## Möglicher Ablauf
- Bei neuem Besuch direkt 3D-Modelle auf den Tisch stellen, um Leute zu animieren mitzumachen
- Erklären, dass hier ein typisches Industrieareal aufgebaut wird, welches ähnliche Ansprüche hat wie Wohnquartiere. Statische Verbraucher, flexible Verbraucher, Bedarf an Wärmeenergie und Elektromobilität 
- In klassischen Netzen wissen wir oft nicht, wann und wo, wie viel Energie verbraucht wird.
  - Kurzzeitige Einblicke funktionieren i.d.R. nur, wenn Betriebselektriker aktiv recherchieren, Ableseprotokolle führen oder Rechnungen ausgewertet werden (Dafür das Lupen-Tangible nutzen)
  - Manuelle Recherche kostet Zeit und Geld. Ein Live-Monitoring ist nicht möglich
- Moderne D3-Trafostation
  - Ausgestattet mit Messequipment an den Niederspannungsabgängen
  - Messen aller Leistungsströme im Niederspannungsbereich, Daten fließen in ein Energiedashboard. Jederzeit Überblick behalten.
  - Spannungsspitzen sichtbar
- Optimierung per EMS möglich
  - Energieflüsse geschickt lenken, verschiebbare Lasten zu besseren Zeiten laufen lassen oder Energie per Batterie sinnvoll ein- und ausgespeisen.
  - Mit Prognosen für Verbraucher und Erzeuger können wir besser planen als nur reagieren

## Bedienung
- Ein Klick oder Touch-Event auf das OFFIS-Logo öffnet die **DevArea**, in der Nodes per Mausklick hinzugefügt werden können.

## Software
Die Software besteht nur aus einem Javascript-Frontend (Verzeichnis [`frontend`](./frontend)), welches über einen Webserver, wie einem nginx, gestartet werden muss. Dabei erfüllt die Anwendung folgende Aufgaben
- TUIO-Signale des Tisches auswerten
- Szenario berechnen
- Diagramm zeichnen und ausgeben

### Dockerbuild
Per `docker build` kann ein Docker Image angelegt werden. Es stellt einen `nginx` Webserver bereit, kopiert den Projektinhalt in das Image und installiert die Abhängigkeiten per `npm`.

```bash
$ cd /microgrid-demonstrator.git
$ docker build -t registry-gitlab.offis.de/official/fbe-p_graeper-kooperation/microgrid-demonstrator:latest .
```

### Docker-Compose
Der Microgrid-Demonstrator kann via Docker gestartet werden, welches den Service unter `http://127.0.0.1:8080` zur Verfügung stellt.

```bash
$ cd /microgrid-demonstrator.git
$ docker login registry-gitlab.offis.de
$ docker-compose up -d
```

### Dev-Umgebung
- Bei Bedarf Gitlab-Token für Zielsystem erstellen: siehe Project Access Token
  - Role: Developer
  - Name: Bspw. `interactive_scape_movable`
  - Permission: `read_api`
- Repository herunterladen
  ```bash
  $ git clone https://gitlab.offis.de/official/fbe-p_graeper-kooperation/microgrid-demonstrator.git microgrid-demonstrator.git
  $ cd src/
  $ npm install d3
  $ npm install -D tailwindcss@3
  ```
- In `Visual Studio Code`
  - Projekt öffnen (`File` -> `Open Folder` -> `microgrid-demonstrator.git/src` auswählen)
  - "Live Server" installieren, welches als Webserver dient (`File` -> `Preferences` -> `Extensions` -> `Live Server` installieren
  - Unten rechts "Go Live" anklicken, welches die Testumgebung startet 
- tailwindcss watcher starten, sodass benötigte CSS Klassen direkt kompiliert und bereitgestellt werden `$ npx tailwindcss -i ./src/customStyles.css -o ./src/output.css --watch`

### Softare Abhängigkeiten
- [D3js](https://d3js.org/) zum Generieren der Grafik
- [tailwindcss](https://tailwindcss.com/docs/installation), welches vordefinierte CSS Klassen bereitstellt

## Bekannte Eigenheiten
- Es ist ein Vanilla JS Projekt, kein echtes NodeJS Paket
- Die Abhängigkeiten `d3` und `tailwind` werden zwar per NPM installiert, aber nur *quick-and-dirty* importiert

## Credits
- [Christian Pieper](mailto:christian.pieper@offis.de) (Development)
- [Marina Tcai](mailto:marina.tcai@offis.de) (Design optimization)
- [Sven Rosinger](mailto:sven.rosinger@offis.de) (3D models and prints)
- [Maxim Erden](mailto:maxim.erden@offis.de) (Development)
- [Timo Schwolow](mailto:tschwolow@graeper.de) (Use Case)
