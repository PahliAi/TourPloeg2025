// Tour de France Poule 2024 - Excel Handler

// File handling functions
function handleExcelFile(event) {
    // Check admin authentication
    if (!isAdminAuthenticated) {
        alert("❌ Geen toegang. Admin authenticatie vereist.");
        event.target.value = ''; // Clear file input
        return;
    }

    const file = event.target.files[0];
    if (!file) return;
    
    console.log('📊 Excel file uploaded:', file.name);
    
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
                if (!workbook.SheetNames.includes('Etappe uitslagen')) {
                    const loadingMsg = document.getElementById('loadingMsg');
                    if (loadingMsg) loadingMsg.remove();
                    alert('❌ Tab "Etappe uitslagen" niet gevonden in Excel bestand');
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
        console.log('🚴 Renners data:', rennersData);
        
        // Parse Deelnemers tab
        const deelnemersSheet = workbook.Sheets['Deelnemers'];
        const deelnemersData = XLSX.utils.sheet_to_json(deelnemersSheet, {header: 1});
        console.log('👥 Deelnemers data:', deelnemersData);
        
        // Parse Etappe uitslagen tab
        const uitlagenSheet = workbook.Sheets['Etappe uitslagen'];
        const uitlagenData = XLSX.utils.sheet_to_json(uitlagenSheet, {header: 1});
        console.log('🏆 Etappe uitslagen data:', uitlagenData);
        
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
    // Reset huidige data
    participants = [];
    allRiders = [];
    currentStage = 1;
    
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
                            points: Array(21).fill(0), // 21 stages max
                            status: "active"
                        });
                    }
                }
                
                if (team.length > 0) {
                    participants.push({
                        name: deelnemerNaam,
                        totalPoints: 0,
                        dailyWins: 0,
                        stagePoints: Array(21).fill(0),
                        team: team
                    });
                }
            }
        }
    }
    
    console.log('✅ Deelnemers verwerkt:', participants.length);
    
    // Verwerk etappe uitslagen
    if (uitlagenData && uitlagenData.length > 1) {
        processEtappeUitslagen(uitlagenData, etappePunten);
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
    
    // Verwijder loading message
    const loadingMsg = document.getElementById('loadingMsg');
    if (loadingMsg) loadingMsg.remove();
    
    alert(`✅ Excel bestand succesvol geladen!\n${participants.length} deelnemers\n${availableRiders.length} renners\nEtappe uitslagen verwerkt`);
}

function processEtappeUitslagen(uitlagenData, etappePunten) {
    // Bepaal aantal etappes gebaseerd op kolommen in uitslagen
    const headerRow = uitlagenData[0];
    const etappeColumns = [];
    
    for (let col = 1; col < headerRow.length; col++) { // Skip eerste kolom (positie)
        if (headerRow[col] && headerRow[col].toString().startsWith('Etappe-')) {
            etappeColumns.push({
                col: col,
                name: headerRow[col],
                stage: parseInt(headerRow[col].split('-')[1])
            });
        }
    }
    
    currentStage = Math.max(...etappeColumns.map(e => e.stage), 1);
    console.log('🏁 Aantal etappes gevonden:', currentStage);
    
    // Punten schema (default als geen aparte tab)
    const puntenSchema = {
        1: 30, 2: 15, 3: 12, 4: 9, 5: 8,
        6: 7, 7: 6, 8: 5, 9: 4, 10: 3,
        'geel': 10, 'groen': 5, 'bolletjes': 5, 'wit': 3
    };
    
    // Verwerk elke etappe
    etappeColumns.forEach(etappeInfo => {
        const stageIndex = etappeInfo.stage - 1;
        
        // Reset punten voor deze etappe
        participants.forEach(participant => {
            participant.team.forEach(rider => {
                rider.points[stageIndex] = 0;
            });
        });
        
        // Verwerk top 10 uitslagen
        for (let row = 1; row <= 10; row++) {
            if (uitlagenData[row] && uitlagenData[row][etappeInfo.col]) {
                const rennerNaam = uitlagenData[row][etappeInfo.col];
                const punten = puntenSchema[row] || 0;
                
                // Geef punten aan alle deelnemers die deze renner hebben
                participants.forEach(participant => {
                    const rider = participant.team.find(r => r.name === rennerNaam);
                    if (rider) {
                        rider.points[stageIndex] += punten;
                    }
                });
            }
        }
        
        // Verwerk truien (geel, groen, bolletjes, wit)
        const truienPosities = ['geel', 'groen', 'bolletjes', 'wit'];
        truienPosities.forEach(trui => {
            // Zoek de rij voor deze trui
            for (let row = 11; row < uitlagenData.length; row++) {
                if (uitlagenData[row] && uitlagenData[row][0] && 
                    uitlagenData[row][0].toString().toLowerCase() === trui) {
                    
                    const rennerNaam = uitlagenData[row][etappeInfo.col];
                    if (rennerNaam) {
                        const punten = puntenSchema[trui] || 0;
                        
                        // Geef punten aan alle deelnemers die deze renner hebben
                        participants.forEach(participant => {
                            const rider = participant.team.find(r => r.name === rennerNaam);
                            if (rider) {
                                rider.points[stageIndex] += punten;
                            }
                        });
                    }
                    break;
                }
            }
        });
    });
}