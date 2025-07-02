# CLAUDE.md

**Tour de France Poule** is a web-based fantasy sports application for Tour de France betting pool with a grand prize of a 270 grams Milka bar.
The webapp is built as a single-page application using pure HTML, CSS, and JavaScript with Excel integration.

### Core Functionality
- **Excel-driven data management** with automatic parsing and validation
- **Multi-year historie system** supporting historical Tour data
- **Real-time scoring** with dynamic point calculations
- **Responsive UI** with professional styling and animations
- **Automatic cache-busting** for GitHub Pages deployment
- **Robust error handling** with detailed console logging

## Architecture Overview

### File Structure
```
/
├── index.html              # Main SPA container (301 lines)
├── css/styles.css          # Complete styling system (642 lines)
├── js/
│   ├── app.js             # Core application logic (940 lines)
│   ├── excel-handler.js   # Excel parsing & processing (864 lines)
│   ├── excel-persistence.js # Auto-loading & cache system (479 lines)
│   └── ui-components.js   # Table rendering & UI (424 lines)
├── tdf-current.xlsx       # Current year data
├── tdf-2024.xlsx         # Historic year data (example)
└── *.png                 # UI theme assets
```

### Technology Stack
- **Frontend**: Pure HTML5, CSS3, JavaScript (ES6+)
- **Excel Processing**: SheetJS (XLSX library)
- **Deployment**: GitHub Pages with automatic loading
- **No build process**: Direct browser execution

## Excel Data Structure

### Required Worksheets

#### 1. Renners (Riders)
- **Column A**: Rider names (exact spelling critical)
- **Purpose**: Master rider registry for point allocation

#### 2. Deelnemers (Participants)  
- **Row 1**: Participant names as headers
- **Rows 2-13**: Each participant's 12 selected riders
- **Data validation**: Must reference Renners tab names

#### 3. Huidig (Current Results)
**Structure**:
- **Row 1**: Headers (Positie, Etappe-1, Etappe-2, ..., Eind)
- **Rows 2-5**: Stage metadata (Date, Route, Distance, Type)
- **Rows 6-15**: Top 10 stage results (positions 1-10)
- **Rows 16-19**: Jersey holders (Yellow, Green, White, Polka)
- **Columns B:V**: Regular stages (rows 6-15 for riders, 16-19 for jerseys)
- **Columns W:X**: Final classification (rows 2-30, W=positions, X=riders)

#### 4. Uitvallers (Dropouts) - Optional
- **Column A**: Names of riders who have dropped out
- **Purpose**: Automatic status updates with visual indicators

#### 5. Etappe punten (Stage Points) - Optional
- **Custom point schema**: Override default 30,15,12,9,8,7,6,5,4,3 + jersey points

#### 6. Eindklassement punten (Final Classification Points) - Optional  
- **Categories**: Eindklassement, Trui Groen, Trui Bolletjes, Trui Wit
- **Positions**: 1,2,3... with corresponding point values

### Critical Excel Requirements
1. **Data validation**: Use dropdown lists referencing Renners tab
2. **Consistent naming**: Exact spelling across all worksheets
3. **Row structure**: Fixed layout for automatic parsing
4. **Tab naming**: Use exact Dutch names as specified

## Core Application Logic

### Data Flow
1. **Excel Upload/Auto-load** → `excel-handler.js`
2. **Parse & Validate** → `processExcelData()`
3. **Point Allocation** → `processRegularStageData()` + `processEindklassementData()`
4. **Rider Management** → Dynamic rider creation for missing names
5. **UI Updates** → Real-time table rendering via `ui-components.js`

### Scoring System

#### Stage Points (Per Stage)
- **Positions 1-10**: 30, 15, 12, 9, 8, 7, 6, 5, 4, 3 points
- **Jersey Bonuses**: Yellow(10), Green(5), Polka(5), White(3)
- **Total per stage**: 122 points (99 + 23 jerseys)
- **Exception**: Stage 21 has no jersey points (99 points total)

#### Final Classification (Eindstand)
- **Default**: 150,75,50,40,35,30,28,26,24,22,20,18,17,16,15,14,13,12,11,10 for top 20
- **Jersey Winners**: Separate point allocations for final jersey holders
- **Total**: ~801 points (configurable via Excel)

#### Daily Competition
- **Daily Winners**: Highest points per stage
- **General Classification**: Cumulative point leaders  
- **Most Stage Wins**: Count of daily victories

### Advanced Features

#### Automatic Rider Creation
When stage results contain riders not in the Renners tab:
```javascript
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

#### Cache-Busting System
All GitHub file requests include timestamp parameters:
```javascript
const cacheBuster = `?v=${Date.now()}`;
const response = await fetch(repoUrl + path + cacheBuster);
```

#### Multi-Year Historie
- **Current Year**: `tdf-current.xlsx`
- **Historic Years**: `tdf-{year}.xlsx` (e.g., `tdf-2024.xlsx`)
- **Automatic Detection**: Scans for available years 2020-current

## UI/UX Design Patterns

### Status Indicators
- **Active Riders**: 🟢 Actief (green circle)
- **Dropped Riders**: 🔴 Uitgevallen (red circle + subtle row highlighting)
- **Dynamic Creation**: Console logging for missing riders

### Responsive Design
- **Mobile-first**: Optimized table scrolling and font sizing
- **Color Scheme**: Tour de France inspired (yellow/blue gradients)
- **Animations**: Podium celebrations and smooth transitions

### Table Features
- **Sticky Headers**: Always visible column names
- **Smart Columns**: Dynamic stage columns based on current progress
- **Point Highlighting**: Eindstand column with special styling
- **Interactive Details**: Click participant names for team breakdowns

## Development Guidelines

### Code Organization
1. **Separation of Concerns**: Clear module boundaries
2. **Error Handling**: Comprehensive try-catch with user feedback
3. **Logging Strategy**: Console messages for debugging Excel processing
4. **Naming Conventions**: Dutch for domain terms, English for technical terms

### Testing Approach
1. **Excel Validation**: Upload various Excel formats and structures
2. **Point Verification**: Mathematical validation (expected: 3340 total points)
3. **Browser Testing**: Chrome, Firefox, Safari compatibility
4. **Responsive Testing**: Mobile and tablet layouts

### Debugging Tools
- **Console Logging**: Detailed point allocation and rider processing
- **Point Auditing**: Automatic calculation of expected vs actual points
- **Cache Inspection**: localStorage and window object monitoring

## Common Issues & Solutions

### Excel Processing
- **Name Mismatches**: Automatic rider creation prevents point loss
- **Row Offsets**: Separate functions for regular stages vs eindstand
- **Cache Problems**: Timestamp-based cache busting

### Performance
- **Large Datasets**: Efficient array operations and minimal DOM updates
- **Memory Management**: Strategic cache clearing and garbage collection
- **GitHub Pages**: CDN caching with proper invalidation

### Browser Compatibility
- **File Reading**: Modern FileReader API with fallbacks
- **Local Storage**: Graceful degradation for storage limits
- **ES6 Features**: Transpilation not required (modern browser target)

## Deployment

### GitHub Pages Setup
1. **Auto-loading**: Place `tdf-current.xlsx` in repository root
2. **Historic Data**: Add `tdf-{year}.xlsx` files for multi-year support
3. **Cache Strategy**: Files served with timestamp parameters
4. **Branch**: Deploy from `main` branch

### Manual Testing Checklist
- [ ] Excel upload functionality
- [ ] Point calculations (verify 3340 total)
- [ ] Rider status updates (dropouts)
- [ ] Historie navigation
- [ ] Responsive layout
- [ ] Console error monitoring

## File Modification Guidelines

### When editing Excel processing (`excel-handler.js`):
- Always test with real Excel files containing edge cases
- Verify point totals match expected values
- Check console for missing rider warnings
- Test both regular stages and eindstand processing

### When updating UI (`ui-components.js`):
- Maintain consistent styling with `styles.css`
- Preserve responsive behavior
- Test table rendering with large datasets
- Verify status indicators display correctly

### When modifying app logic (`app.js`):
- Ensure data flow consistency
- Test historie mode switching
- Verify podium calculations
- Check daily winner algorithms

## Security Considerations
- **Client-side only**: No server-side vulnerabilities
- **File validation**: Excel structure verification before processing
- **XSS Prevention**: Sanitized data rendering
- **CORS Compliance**: GitHub raw file access patterns

## Development Notes
- Do not commit to git. User wants to do it himself