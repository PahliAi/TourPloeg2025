# 🚴‍♂️ Tour de France Poule 2024

Een moderne webapplicatie voor het beheren van je Tour de France wedpools. Upload één Excel bestand en de applicatie berekent automatisch alle scores, dagwinnaars en klassementen.

## ✨ Features

- **📊 Excel Import**: Upload één Excel bestand met alle data
- **🏆 Live Scoring**: Automatische berekening van alle punten en klassementen
- **🔵🟡 Jersey Tracking**: Dagwinnaars (blauw) en klassement leiders (geel)
- **📱 Responsive Design**: Werkt perfect op desktop, tablet en mobile
- **📈 Realtime Updates**: Instant updates bij nieuwe etappe uitslagen
- **🎯 Multiple Views**: Deelnemers, renners, matrix en Excel-style weergave

## 🚀 Quick Start

1. **Open de applicatie**: [Live Demo](https://your-username.github.io/tour-poule)
2. **Download voorbeeld**: Ga naar Admin tab → Download Voorbeeld Excel
3. **Upload je data**: Vul het Excel bestand in en upload

## 📁 Project Structuur

```
tour-poule/
├── index.html          # Hoofdpagina
├── css/
│   └── styles.css      # Alle styling
├── js/
│   ├── app.js          # Hoofd applicatie logica
│   ├── excel-handler.js # Excel import/export
│   └── ui-components.js # UI tabellen en componenten
└── README.md
```

## 📊 Excel Bestand Structuur

Het Excel bestand moet de volgende tabs bevatten:

### 1. **Renners** (Tab 1)
```
Renners
Tadej Pogačar
Jonas Vingegaard
Remco Evenepoel
...
```

### 2. **Deelnemers** (Tab 2)
```
Adriaan Mutter    | Jan de Vries      | Peter Janssen
Tadej Pogačar     | Jonas Vingegaard  | Remco Evenepoel
Jonas Vingegaard  | Tadej Pogačar     | Wout van Aert
...               | ...               | ...
(12 renners)      | (12 renners)      | (12 renners)
```

### 3. **Etappe uitslagen** (Tab 3)
```
        | Etappe-1       | Etappe-2
1       | Mark Cavendish | Jasper Philipsen
2       | Jasper Philipsen | Mark Cavendish
...     | ...            | ...
10      | Jonas Vingegaard | Adam Yates
geel    | Tadej Pogačar  | Tadej Pogačar
groen   | Mark Cavendish | Mark Cavendish
wit     | Remco Evenepoel | Remco Evenepoel
bolletjes | Richard Carapaz | Richard Carapaz
```

### 4. **Etappe punten** (Optioneel)
```
Categorie | Positie | Punten
Etappe    | 1       | 30
Etappe    | 2       | 15
...       | ...     | ...
Trui      | Geel    | 10
Trui      | Groen   | 5
```

## 🎯 Scoring Systeem

### Etappe Punten
- **1e plaats**: 30 punten
- **2e plaats**: 15 punten  
- **3e plaats**: 12 punten
- **4e-10e plaats**: 9, 8, 7, 6, 5, 4, 3 punten

### Jersey Bonussen (per dag)
- **🟡 Gele trui**: 10 punten
- **🟢 Groene trui**: 5 punten
- **🔴 Bolletjestrui**: 5 punten
- **⚪ Witte trui**: 3 punten

### Dagprijzen
- **🔵 Dagwinnaar**: Deelnemer met hoogste score die etappe
- **🟡 Gele trui**: Deelnemer die leidt in algemeen klassement

## 🔧 Development

### Local Development
```bash
# Clone repository
git clone https://github.com/your-username/tour-poule.git
cd tour-poule

# Open in browser (geen build process nodig)
open index.html
```

### GitHub Pages Deployment
1. Push naar main branch
2. Settings → Pages → Deploy from branch → main
3. Je app is live op: `https://your-username.github.io/tour-poule`

## 🛠️ Tech Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Excel Processing**: SheetJS (xlsx library)
- **Styling**: Modern CSS met gradients en animations
- **Responsive**: CSS Grid en Flexbox
- **Icons**: Emoji's voor platform compatibility

## 📱 Browser Support

- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

## 🤝 Contributing

1. Fork het project
2. Maak een feature branch (`git checkout -b feature/nieuwe-functie`)
3. Commit je changes (`git commit -m 'Voeg nieuwe functie toe'`)
4. Push naar branch (`git push origin feature/nieuwe-functie`)
5. Open een Pull Request

## 📄 License

Dit project is gelicenseerd onder de MIT License - zie [LICENSE](LICENSE) voor details.

## 🙏 Acknowledgments

- SheetJS voor Excel processing
- Tour de France voor de inspiratie
- Alle fietsliefhebbers die wedpools organiseren

---

**Happy cycling! 🚴‍♂️🏆**