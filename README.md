# 🚴‍♂️ Tour de France Poule

Een professionele webapplicatie voor het beheren van Tour de France fantasy sports leagues. Volledig Excel-gedreven met geavanceerde scoring algoritmes en multi-jaar historie ondersteuning.

## ✨ Hoofdfeatures

- **📊 Excel-gedreven data management** met automatische parsing en validatie
- **🏆 Real-time scoring systeem** met dynamische punt berekeningen  
- **📚 Multi-jaar historie** voor voorgaande Tour de France seizoenen
- **🚫 Uitvallers tracking** met visuele status indicators
- **🎯 Automatische cache-busting** voor GitHub Pages deployment
- **📱 Volledig responsive** ontwerp voor alle apparaten
- **🔧 Robuuste error handling** met gedetailleerde console logging

## 🚀 Quick Start

### Live Demo
**🌐 [Tour de France Poule - Live](https://pahliai.github.io/Tourploeg/Claude/)**

### Lokaal Gebruik
1. **Clone repository**: `git clone <repo-url>`
2. **Open**: `index.html` in moderne browser
3. **Upload Excel**: Gebruik Upload tab of plaats `tdf-current.xlsx` in root

## 📁 Project Architectuur

```
/
├── index.html              # Single Page Application (301 lijnen)
├── css/styles.css          # Complete styling systeem (642 lijnen)  
├── js/
│   ├── app.js             # Core applicatie logica (940 lijnen)
│   ├── excel-handler.js   # Excel parsing & processing (864 lijnen)
│   ├── excel-persistence.js # Auto-loading & cache systeem (479 lijnen)
│   └── ui-components.js   # Tabel rendering & UI (424 lijnen)
├── tdf-current.xlsx       # Huidige jaar data
├── tdf-2024.xlsx         # Historische jaar data
└── *.png                 # UI theme assets
```

**Totaal**: 3,650+ lijnen hoogwaardige, gestructureerde code

## 📊 Excel Data Structuur

### Verplichte Werkbladen

#### 1. **Renners** (Master Registry)
```
Column A: Renner Namen    | Column B: Team Namen
Tadej Pogačar            | UAE Team Emirates  
Jonas Vingegaard         | Team Jumbo-Visma
Remco Evenepoel         | Soudal Quick-Step
...                     | ...
```

#### 2. **Deelnemers** (Participant Teams)
```
Row 1:    [Participant Namen als headers]
Row 2-13: [Elke participant selecteert 12 renners]
```

#### 3. **Huidig** (Stage Results) 
**Kritieke structuur**:
- **Rows 1**: Headers (Positie, Etappe-1, Etappe-2, ..., Eind)
- **Rows 2-5**: Etappe metadata (Datum, Route, Afstand, Type)
- **Rows 6-15**: Top 10 stage finishers (Positions 1-10)
- **Rows 16-19**: Jersey holders (Geel, Groen, Wit, Bolletjes)
- **Columns B:V**: Regular stages (21 etappes)
- **Columns W:X**: Final classification (W=posities, X=renner namen)

#### 4. **Uitvallers** (Dropouts) - Optioneel
```
Column A: Uitgevallen Renners
Fabio Jakobsen
Caleb Ewan
...
```

#### 5. **Etappe punten** (Custom Scoring) - Optioneel
Override default punt schema voor etappes

#### 6. **Eindklassement punten** (Final Classification) - Optioneel  
Custom punt schema voor eindstand

### Excel Vereisten
✅ **Data validatie**: Dropdown lists verwijzend naar Renners tab  
✅ **Consistente naming**: Exacte spelling across alle werkbladen  
✅ **Vaste row structuur**: Voor automatische parsing  
✅ **Nederlandse tab namen**: Exact zoals gespecificeerd  

## 🎯 Geavanceerd Scoring Systeem

### Stage Points (Per Etappe)
- **Top 10**: 30, 15, 12, 9, 8, 7, 6, 5, 4, 3 punten
- **Jersey bonussen**: Geel(10), Groen(5), Bolletjes(5), Wit(3)  
- **Totaal per stage**: 122 punten (99 + 23 jerseys)
- **Uitzondering**: Etappe 21 heeft geen jersey punten (99 punten)

### Eindklassement (Final Classification)
- **Top 20**: 150,75,50,40,35,30,28,26,24,22,20,18,17,16,15,14,13,12,11,10
- **Jersey winners**: Separate allocaties voor finale truien
- **Totaal**: ~801 punten (configureerbaar via Excel)

### Mathematische Validatie
**Verwacht totaal**: 3,340 punten  
`(122 × 21 etappes) + 801 eindstand - 23 (geen jerseys etappe 21) = 3,340`

## 🔧 Geavanceerde Features

### Automatic Rider Creation
```javascript
// Wanneer stage results renners bevatten die niet in Renners tab staan
if (!window.allRidersFromExcel[rennerNaam]) {
    window.allRidersFromExcel[rennerNaam] = {
        name: rennerNaam,
        team: 'Onbekend',
        points: new Array(22).fill(0),
        status: 'active',
        createdDynamically: true
    };
}
```

### Cache-Busting System
```javascript
// Alle GitHub requests bevatten timestamp parameters
const cacheBuster = `?v=${Date.now()}`;
const response = await fetch(repoUrl + path + cacheBuster);
```

### Multi-Year Historie
- **Huidig jaar**: `tdf-current.xlsx`
- **Historische jaren**: `tdf-{year}.xlsx` (bijv. `tdf-2024.xlsx`)
- **Automatische detectie**: Scant beschikbare jaren 2020-huidig

## 🎨 UI/UX Design Patterns

### Status Indicators
- **Actieve renners**: 🟢 Actief (groene cirkel)
- **Uitgevallen renners**: 🔴 Uitgevallen (rode cirkel + subtiele row highlighting)
- **Dynamisch gecreëerd**: Console logging voor missing riders

### Professional Styling
- **Tour de France kleuren**: Geel/blauw gradient themes
- **Responsive tables**: Sticky headers, optimized scrolling
- **Smooth animations**: Podium celebraties en transitions
- **Mobile-first**: Geoptimaliseerd voor alle screen sizes

## 🛠️ Development Guidelines

### Code Organizatie
1. **Separation of Concerns**: Duidelijke module boundaries
2. **Error Handling**: Comprehensive try-catch met user feedback
3. **Logging Strategy**: Console berichten voor Excel processing debugging
4. **Naming Conventions**: Nederlands voor domain termen, Engels voor technical

### Testing Checklist
- [ ] Excel upload functionaliteit
- [ ] Punt berekeningen (verifieer 3,340 totaal)
- [ ] Rider status updates (uitvallers)
- [ ] Historie navigatie  
- [ ] Responsive layout
- [ ] Console error monitoring

### Performance Optimalisaties
- **Efficiënte array operaties**: Minimale DOM updates
- **Strategic caching**: localStorage en garbage collection
- **GitHub Pages optimized**: CDN caching met proper invalidation

## 🚀 Deployment

### GitHub Pages Setup
1. **Auto-loading**: Plaats `tdf-current.xlsx` in repository root
2. **Historic data**: Voeg `tdf-{year}.xlsx` bestanden toe voor multi-jaar support
3. **Cache strategy**: Bestanden served met timestamp parameters
4. **Branch**: Deploy van `main` branch

### Production Ready
✅ **Mature codebase**: 3,650+ lijnen gestructureerde code  
✅ **Robust error handling**: Comprehensive Excel processing validation  
✅ **Professional UI**: Tour de France themed design patterns  
✅ **Browser compatibility**: Modern browsers, mobile optimized  
✅ **GitHub Pages ready**: Automatic deployment en cache management  

## 🔒 Security & Performance

### Security Features
- **Client-side only**: Geen server-side vulnerabilities
- **File validation**: Excel structuur verificatie voor processing
- **XSS Prevention**: Gesanitized data rendering
- **CORS Compliance**: GitHub raw file access patterns

### Browser Compatibiliteit
- ✅ **Chrome/Edge** (Recommended)
- ✅ **Firefox** 
- ✅ **Safari**
- ✅ **Mobile browsers** (iOS/Android)

## 🤝 Contributing

1. **Fork** het project
2. **Create feature branch**: `git checkout -b feature/nieuwe-functie`
3. **Test thoroughly**: Excel processing en UI updates
4. **Commit changes**: `git commit -m 'Add: nieuwe functie'`
5. **Push branch**: `git push origin feature/nieuwe-functie`
6. **Open Pull Request**: Met gedetailleerde beschrijving

## 📚 Documentation

- **[CLAUDE.md](CLAUDE.md)**: Comprehensive development guide voor Claude Code
- **Console Logging**: Gedetailleerde debug informatie tijdens Excel processing  
- **Code Comments**: Extensive inline documentation
- **Architecture Patterns**: Clear separation of concerns en modulaire design

## 📄 License

MIT License - Zie [LICENSE](LICENSE) voor details.

## 🙏 Acknowledgments

- **SheetJS**: Excel processing capabilities
- **Tour de France**: Inspiratie en data structuur
- **Fantasy Sports Community**: Feature requirements en feedback
- **Claude Code**: Development assistance en code optimization

---

**🚴‍♂️ Professional Fantasy Sports - Powered by Excel 🏆**