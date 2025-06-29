// Tour de France Poule 2024 - Excel Handler

// Helper function to convert Excel date number to readable date
function excelDateToJSDate(excelDate) {
    if (typeof excelDate === 'string' && excelDate.includes('-')) {
        // Already a formatted date string
        return excelDate;
    }
    
    if (typeof excelDate === 'number') {
        // Excel date number - convert to JS date
        const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
        return jsDate.toLocaleDateString('nl-NL', { 
            day: 'numeric', 
            month: 'numeric', 
            year: 'numeric' 
        });
    }
    
    return excelDate; // Return as-is if not a number
}

// File handling functions
function handleExcelFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // IMMEDIATE CACHE BUST - clear everything before processing
    participants = [];
    allRiders = [];
    currentStage = 1;
    window.etappeInfoData = null;
    window.hasEindstandData = false;
    
    // Reset file input zodat hetzelfde bestand opnieuw kan worden geselecteerd
    event.target.value = '';
    
    // Toon loading feedback
    const loadingMsg = document.createElement('div');
    loadingMsg.id = 'loadingMsg';
    loadingMsg.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.8); color: white; padding: 20px; border-radius: 10px; z-index: 9999; font-size: 1.2em;';
    loadingMsg.innerHTML = '📊 Excel bestand wordt verwerkt...<br><div style="margin-top: 10px; font-size: 0.9em;">Even geduld alstublieft</div>';
    document.body.appendChild(loadingMsg);
    
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, {type: 'array'});
                
                
                // Verwachte tabs: Renners, Deelnemers, Etappe punten, Eindklassement punten, Etappe uitslagen
                if (!workbook.SheetNames.includes('Renners')) {
                    const loadingMsg = document.getElementById('loadingMsg');
                    if (loadingMsg) loadingMsg.remove();
                    alert('❌ Tab "Renners" niet gevonden in Excel bestand');
                    return;
                }
                if (!workbook.SheetNames.includes('Deelnemers')) {
                    const loadingMsg = document.getElementById('loadingMsg');
                    if (loadingMsg) loadingMsg.remove();
                    alert('❌ Tab "Deelnemers" niet gevonden in Excel bestand');
                    return;
                }
                // Check for at least one uitslagen tab
                const hasUitslagenTab = workbook.SheetNames.includes('Huidig') || 
                                      workbook.SheetNames.includes('Etappe uitslagen');
                if (!hasUitslagenTab) {
                    const loadingMsg = document.getElementById('loadingMsg');
                    if (loadingMsg) loadingMsg.remove();
                    alert('❌ Tab "Huidig" of "Etappe uitslagen" niet gevonden in Excel bestand');
                    return;
                }
                
                // Parse alle relevante tabs
                parseExcelData(workbook);
                
            } catch (error) {
                // Verwijder loading message
                const loadingMsg = document.getElementById('loadingMsg');
                if (loadingMsg) loadingMsg.remove();
                
                alert('❌ Fout bij het lezen van Excel bestand: ' + error.message);
                console.error('Excel parse error:', error);
            }
        };
        reader.readAsArrayBuffer(file);
    } else {
        // Verwijder loading message
        const loadingMsg = document.getElementById('loadingMsg');
        if (loadingMsg) loadingMsg.remove();
        
        alert('❌ Selecteer een geldig Excel bestand (.xlsx of .xls)');
    }
}

function parseExcelData(workbook) {
    try {
        // Parse Renners tab
        const rennersSheet = workbook.Sheets['Renners'];
        const rennersData = XLSX.utils.sheet_to_json(rennersSheet, {header: 1});
        
        // Parse Deelnemers tab
        const deelnemersSheet = workbook.Sheets['Deelnemers'];
        const deelnemersData = XLSX.utils.sheet_to_json(deelnemersSheet, {header: 1});
        
        // Parse Etappe uitslagen tab - check for current data tab first
        let uitlagenSheetName = 'Etappe uitslagen';
        
        // Priority order: 'Huidig' > 'Etappe uitslagen'
        if (workbook.SheetNames.includes('Huidig')) {
            uitlagenSheetName = 'Huidig';
        } else if (workbook.SheetNames.includes('Etappe uitslagen')) {
            uitlagenSheetName = 'Etappe uitslagen';
        } else {
            throw new Error('Geen geschikte etappe uitslagen tab gevonden');
        }
        
        const uitlagenSheet = workbook.Sheets[uitlagenSheetName];
        const uitlagenData = XLSX.utils.sheet_to_json(uitlagenSheet, {header: 1});
        // Parse optionele punten tabs
        let etappePunten = null;
        let eindklassementPunten = null;
        
        if (workbook.SheetNames.includes('Etappe punten')) {
            const etappePuntenSheet = workbook.Sheets['Etappe punten'];
            etappePunten = XLSX.utils.sheet_to_json(etappePuntenSheet, {header: 1});
        }
        
        if (workbook.SheetNames.includes('Eindklassement punten')) {
            const eindklassementPuntenSheet = workbook.Sheets['Eindklassement punten'];
            eindklassementPunten = XLSX.utils.sheet_to_json(eindklassementPuntenSheet, {header: 1});
        }
        
        // Verwerk de data
        processExcelData(rennersData, deelnemersData, uitlagenData, etappePunten, eindklassementPunten);
        
    } catch (error) {
        // Verwijder loading message
        const loadingMsg = document.getElementById('loadingMsg');
        if (loadingMsg) loadingMsg.remove();
        
        alert('❌ Fout bij het verwerken van Excel data: ' + error.message);
    }
}

function processExcelData(rennersData, deelnemersData, uitlagenData, etappePunten, eindklassementPunten) {
    // NUCLEAR RESET - clear ALL possible cache sources
    
    // Initialize from Renners tab - ALLE renners krijgen een entry
    window.allRidersFromExcel = {};
    let validRiders = 0;
    let emptyRows = 0;
    
    if (rennersData && rennersData.length > 1) {
        for (let i = 1; i < rennersData.length; i++) { // Skip header
            if (rennersData[i][0] && rennersData[i][0].toString().trim() !== '') { // Als er een naam is
                const riderName = rennersData[i][0].toString().trim();
                const teamName = rennersData[i][1] || 'Onbekend';
                window.allRidersFromExcel[riderName] = {
                    name: riderName,
                    team: teamName,
                    points: new Array(22).fill(0),
                    status: 'active',
                    inTeam: false // Default, wordt later geupdate
                };
                validRiders++;
            } else {
                emptyRows++;
            }
        }
    }
    
    console.log(`📊 Renners tab processing: ${validRiders} valid riders, ${emptyRows} empty rows, total processed: ${validRiders + emptyRows}`);
    console.log(`📊 First 5 riders from Excel:`, Object.keys(window.allRidersFromExcel).slice(0, 5));
    console.log(`📊 Total riders in window.allRidersFromExcel:`, Object.keys(window.allRidersFromExcel).length);
    
    // Store all rider names for debugging
    window.allRiderNamesFromExcel = Object.keys(window.allRidersFromExcel);
    console.log('📊 Sample rider names from Renners tab:');
    window.allRiderNamesFromExcel.slice(0, 10).forEach(name => {
        console.log(`   "${name}" (length: ${name.length})`);
    });
    
    // Track total points that should be allocated
    window.expectedTotalPoints = 0;
    window.actualPointsAllocated = 0;
    window.stagePointsBreakdown = {};
    
    // Reset all global arrays and variables
    participants = [];
    allRiders = [];
    currentStage = 1;
    
    // Reset ALL window variables and cache
    window.etappeInfoData = null;
    window.hasEindstandData = false;
    
    // Clear ALL window object properties that might contain cache
    delete window.cachedParticipants;
    delete window.cachedRiders;
    delete window.cachedStageData;
    delete window.excelData;
    delete window.processedData;
    delete window.tempData;
    
    // Clear sessionStorage
    try {
        sessionStorage.clear();
    } catch(e) {
    }
    
    // Clear all window variables that might exist
    const windowKeys = Object.keys(window);
    windowKeys.forEach(key => {
        if (key.includes('tourploeg') || key.includes('excel') || key.includes('cache') || key.includes('data')) {
            try {
                delete window[key];
            } catch(e) {
                // Some properties can't be deleted
            }
        }
    });
    
    // Clear ALL potential cache that might be interfering
    try {
        // Excel-related cache
        localStorage.removeItem('temp-excel-data');
        localStorage.removeItem('cached-participants');
        localStorage.removeItem('cached-riders');
        localStorage.removeItem('cached-stage');
        localStorage.removeItem('excel-file-backup');
        localStorage.removeItem('excel-file-name');
        localStorage.removeItem('excel-file-date');
        
        // Export-related cache
        localStorage.removeItem('export-data');
        localStorage.removeItem('last-export');
        localStorage.removeItem('tourploeg-data');
        localStorage.removeItem('participants-backup');
        localStorage.removeItem('allRiders-backup');
        
        // Browser cache busting
        localStorage.removeItem('app-cache');
        localStorage.removeItem('data-cache');
        localStorage.removeItem('stage-cache');
        
    } catch(e) {
    }
    
    // Force garbage collection if possible
    if (window.gc) {
        window.gc();
    }
    
    // Verwerk renners lijst
    const availableRiders = [];
    if (rennersData && rennersData.length > 1) {
        for (let i = 1; i < rennersData.length; i++) { // Skip header row
            if (rennersData[i][0]) { // Als er een naam is in kolom A
                availableRiders.push(rennersData[i][0]);
            }
        }
    }
    
    // Verwerk deelnemers en hun ploegen
    if (deelnemersData && deelnemersData.length > 0) {
        const headerRow = deelnemersData[0];
        
        // Loop door alle kolommen (deelnemers)
        for (let col = 0; col < headerRow.length; col++) {
            const deelnemerNaam = headerRow[col];
            if (deelnemerNaam && deelnemerNaam.trim() !== '') {
                
                // Verzamel de 12 renners voor deze deelnemer (rij 1-12)
                const team = [];
                for (let row = 1; row <= 12; row++) {
                    if (deelnemersData[row] && deelnemersData[row][col]) {
                        const rennerNaam = deelnemersData[row][col];
                        team.push({
                            name: rennerNaam,
                            points: Array(22).fill(0), // 22 stages max (21 etappes + eindstand)
                            status: "active"
                        });
                    }
                }
                
                if (team.length > 0) {
                    participants.push({
                        name: deelnemerNaam,
                        totalPoints: 0,
                        dailyWins: 0,
                        stagePoints: Array(22).fill(0), // 22 stages max (21 etappes + eindstand)
                        team: team
                    });
                }
            }
        }
    }
    
    
    // Verwerk etappe uitslagen
    if (uitlagenData && uitlagenData.length > 1) {
        processEtappeUitslagen(uitlagenData, etappePunten, eindklassementPunten);
    }
    
    // Update alle tabellen
    createAllRidersArray();
    recalculateAllData();
    loadParticipantsTable();
    loadRidersTable();
    loadMatrixTable();
    loadDailyPrizesTable();
    updatePodiums();
    updateTableHeaders();
    
    // Update homepage etappe info
    if (typeof updateStageInfoFromExcel === 'function') {
        updateStageInfoFromExcel();
    }
    
    
    // Verwijder loading message
    const loadingMsg = document.getElementById('loadingMsg');
    if (loadingMsg) loadingMsg.remove();
    
    // Final comprehensive summary
    console.log('🔍 === FINAL PROCESSING SUMMARY ===');
    
    const originalRiders = Object.values(window.allRidersFromExcel).filter(r => !r.createdDynamically).length;
    const createdRiders = Object.values(window.allRidersFromExcel).filter(r => r.createdDynamically).length;
    
    console.log(`📊 Riders: ${originalRiders} from Excel Renners tab + ${createdRiders} created dynamically = ${Object.keys(window.allRidersFromExcel).length} total`);
    
    // Calculate expected vs actual points
    window.expectedTotalPoints = 0;
    Object.values(window.stagePointsBreakdown).forEach(stage => {
        window.expectedTotalPoints += stage.expectedStagePoints;
    });
    
    console.log(`💰 Points summary:`);
    console.log(`   Expected total: ${window.expectedTotalPoints}`);
    console.log(`   Actual allocated: ${window.actualPointsAllocated}`);
    console.log(`   Missing: ${window.expectedTotalPoints - window.actualPointsAllocated}`);
    
    // Show breakdown by stage
    Object.entries(window.stagePointsBreakdown).forEach(([stage, data]) => {
        const stageLabel = stage == 22 ? 'Eindstand' : `Stage ${stage}`;
        console.log(`   ${stageLabel}: ${data.actualPointsAllocated}/${data.expectedStagePoints} points, ${data.ridersNotFound.length} missing riders`);
        if (data.ridersNotFound.length > 0) {
            console.log(`     Missing riders:`, data.ridersNotFound);
        }
    });
    
    alert(`✅ Excel bestand succesvol geladen!\n${participants.length} deelnemers\n${availableRiders.length} renners\nCurrentStage: ${currentStage}\nCheck console voor details`);
}

function processEtappeUitslagen(uitlagenData, etappePunten, eindklassementPunten) {
    // Bepaal aantal etappes gebaseerd op kolommen in uitslagen
    const headerRow = uitlagenData[0];
    const etappeColumns = [];
    
    for (let col = 1; col < headerRow.length; col++) { // Skip eerste kolom (positie)
        const colValue = headerRow[col] ? headerRow[col].toString().trim() : '';
        
        // Robuuste detectie: trimmed lowercase check voor eindstand
        const isEtappe = colValue.startsWith('Etappe-');
        const isEindstand = colValue.toLowerCase().includes('eind'); // Meer flexibel dan exacte match
        
        if (headerRow[col] && (isEtappe || isEindstand)) {
            let stage = 22; // Default eindstand
            if (isEtappe) {
                stage = parseInt(colValue.split('-')[1]);
            }
            etappeColumns.push({
                col: col,
                name: colValue,
                stage: stage,
                isEindstand: isEindstand
            });
        }
    }
    
    // Parse etappe info (datum, route, afstand, type) - HARD-CODED uit rijen 2-5
    const etappeInfo = {};
    etappeColumns.forEach(etappeCol => {
        const stageNum = etappeCol.stage;
        etappeInfo[stageNum] = {
            stage: stageNum,
            datum: null,
            route: null,
            afstand: null,
            type: null
        };
        
        // HARD-CODED info uit vaste rijen voor etappes 1-21
        if (stageNum <= 21) {
            // Array indices: Rij 1 = index 1, Rij 2 = index 2, etc.
            // Rij 2 = Datum, Rij 3 = Route, Rij 4 = Afstand, Rij 5 = Type
            if (uitlagenData[1] && uitlagenData[1][etappeCol.col]) {
                etappeInfo[stageNum].datum = excelDateToJSDate(uitlagenData[1][etappeCol.col]);
            }
            if (uitlagenData[2] && uitlagenData[2][etappeCol.col]) {
                etappeInfo[stageNum].route = uitlagenData[2][etappeCol.col];
            }
            if (uitlagenData[3] && uitlagenData[3][etappeCol.col]) {
                etappeInfo[stageNum].afstand = uitlagenData[3][etappeCol.col];
            }
            if (uitlagenData[4] && uitlagenData[4][etappeCol.col]) {
                etappeInfo[stageNum].type = uitlagenData[4][etappeCol.col];
            }
            
        } else if (stageNum === 22) {
            // Eindstand heeft geen specifieke etappe info
            etappeInfo[stageNum].route = 'Algemeen Klassement';
            etappeInfo[stageNum].type = 'Eindstand';
        }
    });
    
    // Sla etappe info op voor homepage gebruik
    window.etappeInfoData = etappeInfo;
    window.etappesWithRiderData = []; // Track which stages have actual rider data
    
    // Bepaal currentStage gebaseerd op etappes met data
    let maxStageWithData = 1;
    etappeColumns.forEach(etappeCol => {
        let hasData = false;
        
        if (etappeCol.isEindstand) {
            // Eindstand data: kolom W heeft posities, kolom X heeft renner namen (start rij 1)
            const rennersKolom = etappeCol.col + 1; // Kolom X = renner namen
            let dataCount = 0;
            for (let row = 1; row <= 20; row++) { // Rij 1-20 = top 20 renners eindstand
                if (uitlagenData[row] && 
                    uitlagenData[row][rennersKolom] && 
                    uitlagenData[row][rennersKolom].toString().trim() !== '' &&
                    uitlagenData[row][rennersKolom].toString().trim() !== '0' &&
                    uitlagenData[row][rennersKolom].toString().trim().length >= 3 &&
                    !uitlagenData[row][rennersKolom].toString().includes('groen') &&
                    !uitlagenData[row][rennersKolom].toString().includes('bolletjes') &&
                    !uitlagenData[row][rennersKolom].toString().includes('wit')) {
                    dataCount++;
                }
            }
            hasData = dataCount >= 3;
            console.log(`🔍 Eindstand validation: ${dataCount} riders found in column X (${rennersKolom}), rows 1-20, hasData = ${hasData}`);
        } else {
            // Regular stage data: columns B:V, renner data starts at Excel row 6 (index 5)
            const riderStartRow = 5;
            let dataCount = 0;
            for (let row = riderStartRow; row < riderStartRow + 10; row++) {
                if (uitlagenData[row] && 
                    uitlagenData[row][etappeCol.col] && 
                    uitlagenData[row][etappeCol.col].toString().trim() !== '' &&
                    uitlagenData[row][etappeCol.col].toString().trim() !== '0' &&
                    uitlagenData[row][etappeCol.col].toString().trim().length >= 3) {
                    dataCount++;
                }
            }
            hasData = dataCount >= 3;
            console.log(`🔍 Stage ${etappeCol.stage} validation: ${dataCount} riders found in column ${etappeCol.col}, Excel rows 6-15 (indices 5-14), hasData = ${hasData}`);
        }
        
        console.log(`🔍 Stage ${etappeCol.stage} (${etappeCol.name}): hasData = ${hasData} (dataCount: ${etappeCol.isEindstand ? 'eindstand check' : 'normal check'})`);
        
        if (hasData) {
            maxStageWithData = Math.max(maxStageWithData, etappeCol.stage);
            window.etappesWithRiderData.push(etappeCol.stage); // Track stages with actual rider data
            console.log(`📈 maxStageWithData updated to: ${maxStageWithData}`);
        }
    });
    
    currentStage = maxStageWithData;
    console.log('🏁 FINAL currentStage set to:', currentStage);
    
    // Extra validation: ensure currentStage is reasonable
    if (currentStage > 22) {
        console.log('⚠️ currentStage too high, capping at 22');
        currentStage = 22;
    }
    if (currentStage < 1) {
        console.log('⚠️ currentStage too low, setting to 1');
        currentStage = 1;
    }
    
    console.log('🔒 VALIDATED currentStage:', currentStage);
    
    // Sla info op over of Eindstand data beschikbaar is
    window.hasEindstandData = etappeColumns.some(col => col.isEindstand && window.etappesWithRiderData.includes(22));
    console.log('🔍 hasEindstandData check:', {
        etappeColumns: etappeColumns.filter(col => col.isEindstand),
        etappesWithRiderData: window.etappesWithRiderData,
        hasEindstand: window.hasEindstandData
    });
    
    // Punten schema (default als geen aparte tab)
    const puntenSchema = {
        1: 30, 2: 15, 3: 12, 4: 9, 5: 8,
        6: 7, 7: 6, 8: 5, 9: 4, 10: 3,
        'geel': 10, 'groen': 5, 'bolletjes': 5, 'wit': 3
    };
    
    // Parse eindklassement punten tab voor 'Eindstand' kolom
    let eindstandPunten = {};
    if (typeof eindklassementPunten !== 'undefined' && eindklassementPunten && eindklassementPunten.length > 0) {
        console.log('📊 Loading Eindklassement punten tab for Eindstand scoring');
        
        // Parse eindklassement punten tab en map naar eindstand posities
        for (let row = 1; row < eindklassementPunten.length; row++) { // Skip header row
            if (eindklassementPunten[row] && eindklassementPunten[row][0] && eindklassementPunten[row][1] && eindklassementPunten[row][2]) {
                const categorie = eindklassementPunten[row][0]; // Eindklassement, Trui Groen, etc.
                const positie = eindklassementPunten[row][1]; // 1, 2, 3, etc.
                const punten = eindklassementPunten[row][2]; // 150, 75, 50, etc.
                
                if (categorie === 'Eindklassement') {
                    // Map numerieke posities: 1→1, 2→2, etc.
                    eindstandPunten[positie] = punten;
                } else if (categorie === 'Trui Groen') {
                    // Map jersey posities: groen 1, groen 2, groen 3
                    eindstandPunten[`groen ${positie}`] = punten;
                } else if (categorie === 'Trui Bolletjes') {
                    // Map jersey posities: bolletjes 1, bolletjes 2, bolletjes 3  
                    eindstandPunten[`bolletjes ${positie}`] = punten;
                } else if (categorie === 'Trui Wit') {
                    // Map jersey posities: wit 1, wit 2, wit 3
                    eindstandPunten[`wit ${positie}`] = punten;
                }
            }
        }
        
        console.log('✅ Eindklassement punten loaded for Eindstand:', eindstandPunten);
    } else {
        console.log('📊 No Eindklassement punten tab - using default for Eindstand');
        // Default fallback voor eindstand
        eindstandPunten = {
            1: 150, 2: 75, 3: 50, 4: 40, 5: 35,
            6: 30, 7: 28, 8: 26, 9: 24, 10: 22,
            11: 20, 12: 18, 13: 17, 14: 16, 15: 15,
            16: 14, 17: 13, 18: 12, 19: 11, 20: 10,
            'groen 1': 40, 'groen 2': 20, 'groen 3': 10,
            'bolletjes 1': 40, 'bolletjes 2': 20, 'bolletjes 3': 10,
            'wit 1': 20, 'wit 2': 10, 'wit 3': 5
        };
    }
    
    // Verwerk elke etappe met de juiste functie
    etappeColumns.forEach(etappeInfo => {
        if (etappeInfo.isEindstand) {
            processEindklassementData(uitlagenData, etappeInfo, eindstandPunten);
        } else {
            processRegularStageData(uitlagenData, etappeInfo, puntenSchema);
        }
    });
}

// Separate function for regular stages (columns B:V, data starts at row 6)
function processRegularStageData(uitlagenData, etappeInfo, puntenSchema) {
    
    const stageIndex = etappeInfo.stage - 1;
    const riderStartRow = 5; // HARD-CODED: rider data starts at Excel row 6 (index 5) for columns B:V
    
    // Initialize stage tracking
    window.stagePointsBreakdown[etappeInfo.stage] = {
        expectedStagePoints: 122, // 30+15+12+9+8+7+6+5+4+3 = 99 + 23 jersey points = 122
        actualPointsAllocated: 0,
        ridersFound: 0,
        ridersNotFound: [],
        jerseyPoints: etappeInfo.stage !== 21 ? 23 : 0 // Skip jerseys for stage 21
    };
    
    // Pre-validation: check if stage has meaningful data
    let validCount = 0;
    for (let row = riderStartRow; row < riderStartRow + 10; row++) {
        if (uitlagenData[row] && 
            uitlagenData[row][etappeInfo.col] && 
            uitlagenData[row][etappeInfo.col].toString().trim().length >= 3 &&
            uitlagenData[row][etappeInfo.col].toString().trim() !== '0') {
            validCount++;
        }
    }
    
    if (validCount < 3) {
        console.log(`❌ SKIPPING STAGE ${etappeInfo.stage} - insufficient data (${validCount} riders)`);
        return;
    }
    
    console.log(`✅ PROCESSING STAGE ${etappeInfo.stage} - validation passed (${validCount} riders)`);
    
    // Reset points for this stage
    participants.forEach(participant => {
        participant.team.forEach(rider => {
            rider.points[stageIndex] = 0;
        });
    });
    
    // Process top 10 results (rows 6-15 = positions 1-10)
    let validRiders = 0;
    for (let row = riderStartRow; row < riderStartRow + 10; row++) {
        if (uitlagenData[row] && 
            uitlagenData[row][etappeInfo.col] && 
            uitlagenData[row][etappeInfo.col].toString().trim() !== '' &&
            uitlagenData[row][etappeInfo.col].toString().trim() !== '0' &&
            uitlagenData[row][etappeInfo.col].toString().trim().length >= 3) {
            
            const rennerNaam = uitlagenData[row][etappeInfo.col].toString().trim();
            const position = row - riderStartRow + 1; // Row 6 = position 1, row 7 = position 2, etc.
            const punten = puntenSchema[position] || 0;
            
            validRiders++;
            
            // Track points for ALL riders - CREATE MISSING RIDERS DYNAMICALLY
            if (!window.allRidersFromExcel[rennerNaam]) {
                // Find similar names for debugging
                const similarNames = window.allRiderNamesFromExcel.filter(name => 
                    name.toLowerCase().includes(rennerNaam.toLowerCase().split(' ')[0]) ||
                    rennerNaam.toLowerCase().includes(name.toLowerCase().split(' ')[0])
                );
                console.log(`🆕 CREATING MISSING RIDER: "${rennerNaam}" (length: ${rennerNaam.length}) for stage ${etappeInfo.stage}`);
                if (similarNames.length > 0) {
                    console.log(`   💡 Similar names in Renners tab: ${similarNames.slice(0, 3).map(n => `"${n}"`).join(', ')}`);
                }
                
                // Create the missing rider dynamically
                window.allRidersFromExcel[rennerNaam] = {
                    name: rennerNaam,
                    team: 'Onbekend', // Unknown team
                    points: new Array(22).fill(0),
                    status: 'active',
                    inTeam: false,
                    createdDynamically: true
                };
                window.allRiderNamesFromExcel.push(rennerNaam);
            }
            
            // Now allocate points (rider is guaranteed to exist)
            window.allRidersFromExcel[rennerNaam].points[stageIndex] += punten;
            window.stagePointsBreakdown[etappeInfo.stage].actualPointsAllocated += punten;
            window.actualPointsAllocated += punten;
            
            // Award points to participants who have this rider
            participants.forEach(participant => {
                const rider = participant.team.find(r => r.name === rennerNaam);
                if (rider) {
                    const oldPoints = rider.points[stageIndex];
                    rider.points[stageIndex] += punten;
                }
            });
        }
    }
    
    // Process jerseys (yellow, green, white, polka dots) - skip for stage 21
    if (etappeInfo.stage !== 21) {
        const truienPosities = [
            { name: 'geel', row: 15 },
            { name: 'groen', row: 16 }, 
            { name: 'wit', row: 17 },
            { name: 'bolletjes', row: 18 }
        ];
        
        truienPosities.forEach(trui => {
            if (uitlagenData[trui.row] && uitlagenData[trui.row][etappeInfo.col]) {
                const rennerNaam = uitlagenData[trui.row][etappeInfo.col];
                if (rennerNaam && rennerNaam.toString().trim() !== '') {
                    const punten = puntenSchema[trui.name] || 0;
                    
                    // Track points for ALL riders - CREATE MISSING RIDERS DYNAMICALLY
                    if (!window.allRidersFromExcel[rennerNaam]) {
                        console.log(`🆕 CREATING MISSING RIDER FOR JERSEY: "${rennerNaam}" for ${trui.name} jersey stage ${etappeInfo.stage}`);
                        window.allRidersFromExcel[rennerNaam] = {
                            name: rennerNaam,
                            team: 'Onbekend',
                            points: new Array(22).fill(0),
                            status: 'active',
                            inTeam: false,
                            createdDynamically: true
                        };
                        window.allRiderNamesFromExcel.push(rennerNaam);
                    }
                    
                    // Allocate jersey points
                    window.allRidersFromExcel[rennerNaam].points[stageIndex] += punten;
                    window.stagePointsBreakdown[etappeInfo.stage].actualPointsAllocated += punten;
                    window.actualPointsAllocated += punten;
                    
                    // Award jersey points to participants who have this rider
                    participants.forEach(participant => {
                        const rider = participant.team.find(r => r.name === rennerNaam);
                        if (rider) {
                            const oldPoints = rider.points[stageIndex];
                            rider.points[stageIndex] += punten;
                        }
                    });
                }
            }
        });
    } else {
        console.log(`⏭️ Skipping jerseys for stage 21`);
    }
    
    console.log(`✅ Stage ${etappeInfo.stage} completed: ${validRiders} riders processed`);
}

// Separate function for eindklassement (columns W:X, data starts at row 2)
function processEindklassementData(uitlagenData, etappeInfo, eindstandPunten) {
    console.log(`🏆 Processing EINDKLASSEMENT (columns W:X)`);
    
    // Calculate expected eindstand points
    const expectedEindstandPoints = Object.values(eindstandPunten).reduce((sum, points) => sum + points, 0);
    window.stagePointsBreakdown[22] = {
        expectedStagePoints: expectedEindstandPoints,
        actualPointsAllocated: 0,
        ridersFound: 0,
        ridersNotFound: []
    };
    
    // DEBUG: Show first 5 rows of uitlagenData
    console.log('🔍 FIRST 5 ROWS OF UITLAGEN DATA:');
    for (let i = 0; i < Math.min(5, uitlagenData.length); i++) {
        console.log(`Row ${i}:`, uitlagenData[i]);
    }
    
    const stageIndex = 21; // Eindstand is always stage 22 (index 21)
    const positionCol = etappeInfo.col;     // Column W = positions (1, 2, 3, etc.)
    const riderCol = etappeInfo.col + 1;   // Column X = rider names
    const riderStartRow = 1; // HARD-CODED: rider data starts at row 1 for column X
    
    console.log(`🎯 Column mapping: positionCol=${positionCol} (W), riderCol=${riderCol} (X)`);
    
    // Pre-validation: check if eindstand has meaningful data
    let validCount = 0;
    for (let row = riderStartRow; row <= 20; row++) { // Rows 1-20 = top 20 positions
        if (uitlagenData[row] && 
            uitlagenData[row][riderCol] && 
            uitlagenData[row][riderCol].toString().trim().length >= 3 &&
            uitlagenData[row][riderCol].toString().trim() !== '0' &&
            !uitlagenData[row][riderCol].toString().includes('groen') &&
            !uitlagenData[row][riderCol].toString().includes('bolletjes') &&
            !uitlagenData[row][riderCol].toString().includes('wit')) {
            validCount++;
        }
    }
    
    if (validCount < 3) {
        console.log(`❌ SKIPPING EINDSTAND - insufficient data (${validCount} riders)`);
        return;
    }
    
    console.log(`✅ PROCESSING EINDSTAND - validation passed (${validCount} riders)`);
    window.hasEindstandData = true;
    window.etappesWithRiderData.push(22);
    
    // Reset points for eindstand
    participants.forEach(participant => {
        participant.team.forEach(rider => {
            rider.points[stageIndex] = 0;
        });
    });
    
    console.log('🔍 Eindstand punten tabel:', eindstandPunten);
    
    // Process top 20 + jersey winners (rows 1-30)
    let processedRiders = 0;
    for (let row = riderStartRow; row <= 30; row++) {
        console.log(`🔍 ROW ${row} DEBUG: posCol=${uitlagenData[row] ? uitlagenData[row][positionCol] : 'undefined'}, riderCol=${uitlagenData[row] ? uitlagenData[row][riderCol] : 'undefined'}`);
        
        if (uitlagenData[row] && 
            uitlagenData[row][riderCol] && 
            uitlagenData[row][riderCol].toString().trim() !== '' &&
            uitlagenData[row][riderCol].toString().trim().length >= 3) {
            
            const rennerNaam = uitlagenData[row][riderCol].toString().trim();
            const positieCell = uitlagenData[row][positionCol]; // Position from column W
            
            let punten = 0;
            if (row <= 20) {
                // Top 20 riders - DIRECT position from Excel column W  
                const position = uitlagenData[row][positionCol]; // Use actual position from Excel
                punten = eindstandPunten[position] || 0;
            } else {
                // Jersey winners - use exact position string from Excel
                punten = eindstandPunten[positieCell] || 0;
            }
            
            // Track points for ALL riders - CREATE MISSING RIDERS DYNAMICALLY
            if (!window.allRidersFromExcel[rennerNaam]) {
                console.log(`🆕 CREATING MISSING RIDER FOR EINDSTAND: "${rennerNaam}" for position ${positieCell}`);
                window.allRidersFromExcel[rennerNaam] = {
                    name: rennerNaam,
                    team: 'Onbekend',
                    points: new Array(22).fill(0),
                    status: 'active',
                    inTeam: false,
                    createdDynamically: true
                };
                window.allRiderNamesFromExcel.push(rennerNaam);
            }
            
            // Allocate eindstand points
            window.allRidersFromExcel[rennerNaam].points[stageIndex] += punten;
            window.stagePointsBreakdown[22].actualPointsAllocated += punten;
            window.actualPointsAllocated += punten;
            
            // Award points to participants who have this rider
            participants.forEach(participant => {
                const rider = participant.team.find(r => r.name === rennerNaam);
                if (rider) {
                    const oldPoints = rider.points[stageIndex];
                    rider.points[stageIndex] += punten;
                }
            });
            
            processedRiders++;
        }
    }
    
    console.log(`✅ Eindstand completed: ${processedRiders} riders processed`);
    console.log(`🚨 CRITICAL: currentStage after eindstand processing = ${currentStage}`);
}