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
    
    console.log('📊 Excel file uploaded:', file.name);
    
    // IMMEDIATE CACHE BUST - clear everything before processing
    console.log('🧹 Pre-processing cache clear...');
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
                
                console.log('📋 Excel tabs gevonden:', workbook.SheetNames);
                
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
        console.log('🔍 PARSING EXCEL - ENTRY POINT');
        console.log('  workbook.SheetNames:', workbook.SheetNames);
        
        // Parse Renners tab
        const rennersSheet = workbook.Sheets['Renners'];
        const rennersData = XLSX.utils.sheet_to_json(rennersSheet, {header: 1});
        console.log('🚴 Renners data:', rennersData);
        
        // Parse Deelnemers tab
        const deelnemersSheet = workbook.Sheets['Deelnemers'];
        const deelnemersData = XLSX.utils.sheet_to_json(deelnemersSheet, {header: 1});
        console.log('👥 Deelnemers data:', deelnemersData);
        
        // Parse Etappe uitslagen tab - check for current data tab first
        let uitlagenSheetName = 'Etappe uitslagen';
        
        // Priority order: 'Huidig' > current year > 'Etappe uitslagen'
        if (workbook.SheetNames.includes('Huidig')) {
            uitlagenSheetName = 'Huidig';
            console.log(`🎯 Using current data tab: Huidig`);
        } else if (workbook.SheetNames.includes('Etappe uitslagen')) {
            uitlagenSheetName = 'Etappe uitslagen';
            console.log(`📋 Using default tab: Etappe uitslagen`);
        } else {
            console.log('❌ No suitable uitslagen tab found');
            throw new Error('Geen geschikte etappe uitslagen tab gevonden');
        }
        
        const uitlagenSheet = workbook.Sheets[uitlagenSheetName];
        const uitlagenData = XLSX.utils.sheet_to_json(uitlagenSheet, {header: 1});
        console.log(`🏆 Using tab '${uitlagenSheetName}' for etappe uitslagen:`, uitlagenData);
        console.log('🔍 DETAILED UITSLAGEN ANALYSIS:');
        console.log('  Sheet name used:', uitlagenSheetName);
        console.log('  Row 0 (header):', uitlagenData[0]);
        console.log('  Row 1 (pos 1):', uitlagenData[1]);
        console.log('  Row 2 (pos 2):', uitlagenData[2]);
        console.log('  Total rows:', uitlagenData.length);
        console.log('  Total columns in header:', uitlagenData[0] ? uitlagenData[0].length : 0);
        
        // Parse optionele punten tabs
        let etappePunten = null;
        let eindklassementPunten = null;
        
        if (workbook.SheetNames.includes('Etappe punten')) {
            const etappePuntenSheet = workbook.Sheets['Etappe punten'];
            etappePunten = XLSX.utils.sheet_to_json(etappePuntenSheet, {header: 1});
            console.log('📊 Etappe punten:', etappePunten);
        }
        
        if (workbook.SheetNames.includes('Eindklassement punten')) {
            const eindklassementPuntenSheet = workbook.Sheets['Eindklassement punten'];
            eindklassementPunten = XLSX.utils.sheet_to_json(eindklassementPuntenSheet, {header: 1});
            console.log('🏅 Eindklassement punten:', eindklassementPunten);
        }
        
        // Verwerk de data
        processExcelData(rennersData, deelnemersData, uitlagenData, etappePunten, eindklassementPunten);
        
    } catch (error) {
        // Verwijder loading message
        const loadingMsg = document.getElementById('loadingMsg');
        if (loadingMsg) loadingMsg.remove();
        
        alert('❌ Fout bij het verwerken van Excel data: ' + error.message);
        console.error('Excel processing error:', error);
    }
}

function processExcelData(rennersData, deelnemersData, uitlagenData, etappePunten, eindklassementPunten) {
    // NUCLEAR RESET - clear ALL possible cache sources
    console.log('🔄 NUCLEAR CACHE RESET - CLEARING EVERYTHING...');
    
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
        console.log('🗑️ sessionStorage cleared');
    } catch(e) {
        console.log('⚠️ Could not clear sessionStorage:', e);
    }
    
    // Clear all window variables that might exist
    const windowKeys = Object.keys(window);
    windowKeys.forEach(key => {
        if (key.includes('tourploeg') || key.includes('excel') || key.includes('cache') || key.includes('data')) {
            try {
                delete window[key];
                console.log('🗑️ Deleted window.' + key);
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
        
        console.log('🗑️ ALL cache completely cleared');
    } catch(e) {
        console.log('⚠️ Could not clear some cache:', e);
    }
    
    // Force garbage collection if possible
    if (window.gc) {
        window.gc();
    }
    
    console.log('✅ Complete reset done - starting fresh processing...');
    
    // Verwerk renners lijst
    const availableRiders = [];
    if (rennersData && rennersData.length > 1) {
        for (let i = 1; i < rennersData.length; i++) { // Skip header row
            if (rennersData[i][0]) { // Als er een naam is in kolom A
                availableRiders.push(rennersData[i][0]);
            }
        }
    }
    console.log('✅ Beschikbare renners:', availableRiders);
    
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
    
    console.log('✅ Deelnemers verwerkt:', participants.length);
    
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
    
    // Final debug check
    console.log('📊 FINAL PROCESSING COMPLETE:');
    console.log('  currentStage:', currentStage);
    console.log('  participants:', participants.length);
    console.log('  allRiders:', allRiders.length);
    console.log('  hasEindstandData:', window.hasEindstandData);
    
    // Verwijder loading message
    const loadingMsg = document.getElementById('loadingMsg');
    if (loadingMsg) loadingMsg.remove();
    
    alert(`✅ Excel bestand succesvol geladen!\n${participants.length} deelnemers\n${availableRiders.length} renners\nCurrentStage: ${currentStage}\nEtappe uitslagen verwerkt`);
}

function processEtappeUitslagen(uitlagenData, etappePunten, eindklassementPunten) {
    // DEBUG: Log RAW Excel data to see what's actually in there
    console.log('🔍 RAW EXCEL DEBUG:');
    console.log('  uitlagenData.length:', uitlagenData.length);
    console.log('  uitlagenData[0] (header):', uitlagenData[0]);
    console.log('  uitlagenData[1] (first data row):', uitlagenData[1]);
    
    // Bepaal aantal etappes gebaseerd op kolommen in uitslagen
    const headerRow = uitlagenData[0];
    const etappeColumns = [];
    
    console.log('🔍 HEADER ROW ANALYSIS:');
    for (let col = 1; col < headerRow.length; col++) { // Skip eerste kolom (positie)
        const colValue = headerRow[col] ? headerRow[col].toString().trim() : '';
        console.log(`  Column ${col}: "${colValue}" (type: ${typeof headerRow[col]})`);
        
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
            console.log(`    ✅ FOUND ETAPPE: ${colValue} -> Stage ${stage} (kolom ${col}) ${isEindstand ? '(EINDSTAND!)' : ''}`);
        } else {
            console.log(`    ❌ SKIPPED: "${colValue}" - not etappe/eind`);
        }
    }
    
    console.log('🔍 FOUND ETAPPE COLUMNS:', etappeColumns.map(col => `${col.name} (${col.stage})`));
    
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
            
            console.log(`📅 Etappe ${stageNum} info parsed:`, {
                datum: uitlagenData[1] ? uitlagenData[1][etappeCol.col] : 'missing',
                route: uitlagenData[2] ? uitlagenData[2][etappeCol.col] : 'missing', 
                afstand: uitlagenData[3] ? uitlagenData[3][etappeCol.col] : 'missing',
                type: uitlagenData[4] ? uitlagenData[4][etappeCol.col] : 'missing',
                result: etappeInfo[stageNum]
            });
        } else if (stageNum === 22) {
            // Eindstand heeft geen specifieke etappe info
            etappeInfo[stageNum].route = 'Algemeen Klassement';
            etappeInfo[stageNum].type = 'Eindstand';
        }
    });
    
    // Sla etappe info op voor homepage gebruik
    window.etappeInfoData = etappeInfo;
    window.etappesWithRiderData = []; // Track which stages have actual rider data
    console.log('📅 Etappe info parsed:', etappeInfo);
    
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
            // Regular stage data: columns B:V, renner data starts at row 6
            const riderStartRow = 6;
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
            console.log(`🔍 Stage ${etappeCol.stage} validation: ${dataCount} riders found in column ${etappeCol.col}, rows 6-15, hasData = ${hasData}`);
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
    console.log(`🏁 Processing REGULAR stage ${etappeInfo.stage} (column ${etappeInfo.col})`);
    
    const stageIndex = etappeInfo.stage - 1;
    const riderStartRow = 6; // HARD-CODED: rider data starts at row 6 for columns B:V
    
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
            console.log(`🏆 Position ${position}: ${rennerNaam} gets ${punten} points (row ${row})`);
            
            // Award points to participants who have this rider
            participants.forEach(participant => {
                const rider = participant.team.find(r => r.name === rennerNaam);
                if (rider) {
                    const oldPoints = rider.points[stageIndex];
                    rider.points[stageIndex] += punten;
                    console.log(`  → ${participant.name}: ${rennerNaam} gets +${punten} points (${oldPoints} → ${rider.points[stageIndex]})`);
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
                    
                    // Award jersey points to participants who have this rider
                    participants.forEach(participant => {
                        const rider = participant.team.find(r => r.name === rennerNaam);
                        if (rider) {
                            const oldPoints = rider.points[stageIndex];
                            rider.points[stageIndex] += punten;
                            console.log(`🏆 ${rennerNaam} (${trui.name} jersey): +${punten} points → ${oldPoints} → ${rider.points[stageIndex]}`);
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
            
            console.log(`🎯 PROCESSING: Row ${row}, Rider: "${rennerNaam}", Position in Excel: "${positieCell}"`);
            
            let punten = 0;
            if (row <= 20) {
                // Top 20 riders - DIRECT position from Excel column W  
                const position = uitlagenData[row][positionCol]; // Use actual position from Excel
                punten = eindstandPunten[position] || 0;
                console.log(`🥇 ${rennerNaam} (row ${row}, Excel pos ${position}): ${punten} points from eindstand table (${eindstandPunten[position]})`);
            } else {
                // Jersey winners - use exact position string from Excel
                punten = eindstandPunten[positieCell] || 0;
                console.log(`🏆 ${rennerNaam} (jersey: ${positieCell}): ${punten} points`);
            }
            
            // Award points to participants who have this rider
            participants.forEach(participant => {
                const rider = participant.team.find(r => r.name === rennerNaam);
                if (rider) {
                    const oldPoints = rider.points[stageIndex];
                    rider.points[stageIndex] += punten;
                    console.log(`  → ${participant.name}: ${rennerNaam} gets +${punten} points (${oldPoints} → ${rider.points[stageIndex]}) for stage index ${stageIndex}`);
                    
                    // Extra debug for Tadej and Jonas
                    if (rennerNaam === 'Tadej Pogacar' || rennerNaam === 'Jonas Vingegaard') {
                        console.log(`🚨 CRITICAL: ${rennerNaam} eindstand points: ${punten} (old: ${oldPoints}, new: ${rider.points[stageIndex]}) at stage index ${stageIndex}`);
                    }
                }
            });
            
            processedRiders++;
        }
    }
    
    console.log(`✅ Eindstand completed: ${processedRiders} riders processed`);
    console.log(`🚨 CRITICAL: currentStage after eindstand processing = ${currentStage}`);
}