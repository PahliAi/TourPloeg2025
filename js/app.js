// Tour de France Poule 2024 - Main Application
// Global variables
let participants = [];
let allRiders = [];
let currentStage = 1;

// Ranking history tracking - stores rankings after each stage
let rankingHistory = []; // Array of arrays: [stage1Rankings, stage2Rankings, ...]

// Performance optimization - Templates are now defined in excel-config.js

// Centralized error handling
const ErrorHandler = {
    log: (category, message, data = null) => {
        const timestamp = new Date().toISOString().substring(11, 19);
        const prefix = `[${timestamp}] ${category}:`;
        
        if (data) {
            console.log(`${prefix} ${message}`, data);
        } else {
            console.log(`${prefix} ${message}`);
        }
    },
    
    warn: (category, message, data = null) => {
        const timestamp = new Date().toISOString().substring(11, 19);
        const prefix = `⚠️ [${timestamp}] ${category}:`;
        
        if (data) {
            console.warn(`${prefix} ${message}`, data);
        } else {
            console.warn(`${prefix} ${message}`);
        }
    },
    
    error: (category, message, error = null) => {
        const timestamp = new Date().toISOString().substring(11, 19);
        const prefix = `❌ [${timestamp}] ${category}:`;
        
        if (error) {
            console.error(`${prefix} ${message}`, error);
        } else {
            console.error(`${prefix} ${message}`);
        }
    },
    
    success: (category, message, data = null) => {
        const timestamp = new Date().toISOString().substring(11, 19);
        const prefix = `✅ [${timestamp}] ${category}:`;
        
        if (data) {
            console.log(`${prefix} ${message}`, data);
        } else {
            console.log(`${prefix} ${message}`);
        }
    }
};

// Memory management utilities
const MemoryManager = {
    clearGlobalCache: () => {
        const keysToDelete = [
            'allRidersFromExcel',
            'etappeInfoData', 
            'hasEindstandData',
            'etappesWithRiderData',
            'stagePointsBreakdown',
            'expectedTotalPoints',
            'actualPointsAllocated',
            'allRiderNamesFromExcel'
        ];
        
        keysToDelete.forEach(key => {
            if (window[key]) {
                delete window[key];
                ErrorHandler.log('MEMORY', `Cleared window.${key}`);
            }
        });
    },
    
    clearLocalStorage: () => {
        const keysToRemove = [
            'temp-excel-data',
            'cached-participants', 
            'cached-riders',
            'cached-stage',
            'excel-file-backup',
            'excel-file-name',
            'excel-file-date',
            'export-data',
            'last-export',
            'tourploeg-data',
            'participants-backup',
            'allRiders-backup',
            'app-cache',
            'data-cache',
            'stage-cache'
        ];
        
        keysToRemove.forEach(key => {
            try {
                localStorage.removeItem(key);
            } catch(e) {
                ErrorHandler.warn('MEMORY', `Could not remove localStorage key: ${key}`, e);
            }
        });
        
        ErrorHandler.success('MEMORY', 'localStorage cleared');
    },
    
    fullReset: () => {
        // Reset global variables
        participants = [];
        allRiders = [];
        currentStage = 1;
        
        // Clear all caches
        MemoryManager.clearGlobalCache();
        MemoryManager.clearLocalStorage();
        
        // Clear sessionStorage
        try {
            sessionStorage.clear();
            ErrorHandler.log('MEMORY', 'sessionStorage cleared');
        } catch(e) {
            ErrorHandler.warn('MEMORY', 'Could not clear sessionStorage', e);
        }
        
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
            ErrorHandler.log('MEMORY', 'Garbage collection triggered');
        }
        
        ErrorHandler.success('MEMORY', 'Full reset completed');
    }
};

// No admin authentication needed - simplified access

// Tab navigation
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');

    // Special animation for Home tab
    if (tabName === 'home') {
        triggerPodiumAnimation();
    }

    // Load appropriate data
    switch(tabName) {
        case 'participants':
            loadParticipantsTable();
            break;
        case 'riders':
            loadRidersTable();
            break;
        case 'matrix':
            loadMatrixTable();
            break;
        case 'daily-prizes':
            loadDailyPrizesTable();
            break;
        case 'ranking':
            loadRankingTable();
            break;
        case 'historie':
            loadHistorieTab();
            break;
        case 'upload':
            // Upload tab - no special loading needed
            break;
    }
    
    // Apply auto-sizing after tab content is loaded and visible
    setTimeout(() => {
        if (typeof autoSizeAllTables === 'function') {
            autoSizeAllTables();
        }
    }, 100);
}

// Data processing functions
function processTeamData(teamData) {
    participants = [];
    
    if (teamData.Deelnemers && Array.isArray(teamData.Deelnemers)) {
        teamData.Deelnemers.forEach(deelnemer => {
            const team = [];
            
            for (let i = 1; i <= 12; i++) {
                const riderName = deelnemer[`Renner_${i}`];
                const teamName = deelnemer[`Team_${i}`];
                
                if (riderName && teamName) {
                    team.push({
                        name: riderName,
                        team: teamName,
                        points: [...window.EMPTY_POINTS_TEMPLATE], // 22 stages max (21 etappes + eindstand)
                        status: "active"
                    });
                }
            }
            
            participants.push({
                name: deelnemer.Naam,
                totalPoints: 0,
                dailyWins: 0,
                stagePoints: [...window.EMPTY_STAGE_POINTS_TEMPLATE], // 22 stages max (21 etappes + eindstand)
                team: team
            });
        });
        
        createAllRidersArray();
        loadParticipantsTable();
        updatePodiums();
        
        // Trigger podium animation when new data is loaded
        setTimeout(() => {
            triggerPodiumAnimation();
        }, 500);
        
        ErrorHandler.success('PROCESSING', `Processed ${participants.length} participants`);
    }
}

function processStageData(stageData) {
    if (stageData.stage > currentStage) {
        currentStage = stageData.stage;
    }
    
    updateStageInfo(stageData);
    updateStoryContent(stageData);
    
    if (stageData.top10 && participants.length > 0) {
        updateRiderPointsFromStageResults(stageData);
    }
    
    if (stageData.jerseys) {
        updateJerseyPoints(stageData.jerseys, stageData.stage - 1);
    }
    
    if (stageData.dropouts && stageData.dropouts.length > 0) {
        processDropouts(stageData.dropouts);
    }
    
    recalculateAllData();
    loadParticipantsTable();
    loadRankingTable(); // Load ranking progression table
    updatePodiums();
    updateTableHeaders();
    
    // Trigger podium animation when stage data is updated
    setTimeout(() => {
        triggerPodiumAnimation();
    }, 500);
}

function updateStageInfo(stageData) {
    if (stageData.stageInfo) {
        document.getElementById('currentStageTitle').textContent = `🗓️ Vandaag - Etappe ${stageData.stage}`;
        document.getElementById('currentStageName').innerHTML = `<strong>${stageData.stageInfo.name}</strong>`;
        document.getElementById('currentStageDetails').textContent = `${stageData.stageInfo.distance} | ${stageData.stageInfo.type}`;
        document.getElementById('currentStageDescription').textContent = stageData.stageInfo.description || '';
        document.getElementById('stageInfoContainer').style.display = 'grid';
    }
    
    if (stageData.nextStage) {
        document.getElementById('nextStageTitle').textContent = `🗓️ Morgen - Etappe ${stageData.nextStage.stage}`;
        document.getElementById('nextStageName').innerHTML = `<strong>${stageData.nextStage.name}</strong>`;
        document.getElementById('nextStageDetails').textContent = `${stageData.nextStage.distance} | ${stageData.nextStage.type}`;
        document.getElementById('nextStageDescription').textContent = stageData.nextStage.description || '';
    }
    
    document.getElementById('dailyPodiumTitle').textContent = `🔵 Dagpodium - Etappe ${stageData.stage}`;
}

// Nieuwe functie om etappe info van Excel data te tonen
function updateStageInfoFromExcel() {
    if (!window.etappeInfoData || !currentStage) {
        return;
    }
    
    const etappeInfo = window.etappeInfoData;
    
    // Smart homepage logic:
    // - "Vandaag" = laatste etappe met renner data
    // - "Morgen" = volgende etappe (die mogelijk nog geen data heeft)
    
    const etappesWithData = window.etappesWithRiderData || [];
    const laatsteVoltooideEtappe = Math.max(...etappesWithData); // Highest stage with actual rider data
    const volgendeEtappe = laatsteVoltooideEtappe < 21 ? laatsteVoltooideEtappe + 1 : null;
    
    console.log(`🏠 Homepage logic: laatste voltooide = ${laatsteVoltooideEtappe}, volgende = ${volgendeEtappe}`);
    console.log(`🏠 currentStage = ${currentStage}, etappeInfo keys:`, Object.keys(etappeInfo));
    console.log(`🏠 etappesWithRiderData:`, window.etappesWithRiderData);
    
    // Update "Vandaag" section - laatste voltooide etappe
    if (laatsteVoltooideEtappe && etappeInfo[laatsteVoltooideEtappe]) {
        const info = etappeInfo[laatsteVoltooideEtappe];
        const stageLabel = laatsteVoltooideEtappe === 22 ? 'Eindstand' : `Etappe ${laatsteVoltooideEtappe}`;
        
        console.log(`🏁 Setting "Vandaag" to: ${stageLabel}`, info);
        
        document.getElementById('currentStageTitle').textContent = `🗓️ Vandaag - ${stageLabel}`;
        document.getElementById('currentStageName').innerHTML = `<strong>${info.route || 'Route onbekend'}</strong>`;
        document.getElementById('currentStageDetails').textContent = `${info.afstand || '-'} | ${info.type || '-'}`;
        document.getElementById('currentStageDescription').textContent = info.datum ? `Datum: ${info.datum}` : '';
        document.getElementById('stageInfoContainer').style.display = 'grid';
    } else {
        console.log(`❌ No data for laatste voltooide etappe ${laatsteVoltooideEtappe}`);
    }
    
    // Update "Morgen" section - volgende etappe preview
    if (volgendeEtappe && etappeInfo[volgendeEtappe]) {
        const info = etappeInfo[volgendeEtappe];
        const stageLabel = volgendeEtappe === 22 ? 'Eindstand' : `Etappe ${volgendeEtappe}`;
        
        console.log(`🔜 Setting "Volgende" to: ${stageLabel}`, info);
        
        document.getElementById('nextStageTitle').textContent = `🔜 Volgende - ${stageLabel}`;
        document.getElementById('nextStageName').innerHTML = `<strong>${info.route || 'Route onbekend'}</strong>`;
        document.getElementById('nextStageDetails').textContent = `${info.afstand || '-'} | ${info.type || '-'}`;
        document.getElementById('nextStageDescription').textContent = info.datum ? `Datum: ${info.datum}` : '';
    } else if (!volgendeEtappe) {
        console.log(`🏁 No volgendeEtappe - showing "Tour Voltooid"`);
        // No next stage - hide or show "Tour completed"
        document.getElementById('nextStageTitle').textContent = `🏁 Tour Voltooid`;
        document.getElementById('nextStageName').innerHTML = `<strong>Alle etappes afgerond</strong>`;
        document.getElementById('nextStageDetails').textContent = `Eindstand definitief`;
        document.getElementById('nextStageDescription').textContent = '';
    } else {
        console.log(`❌ volgendeEtappe = ${volgendeEtappe} but no data in etappeInfo`);
        // Next stage exists but no data - show preview anyway
        const stageLabel = volgendeEtappe === 22 ? 'Eindstand' : `Etappe ${volgendeEtappe}`;
        document.getElementById('nextStageTitle').textContent = `🔜 Volgende - ${stageLabel}`;
        document.getElementById('nextStageName').innerHTML = `<strong>Nog niet bekend</strong>`;
        document.getElementById('nextStageDetails').textContent = `Info volgt later`;
        document.getElementById('nextStageDescription').textContent = '';
    }
    
    // Update podium title - toon laatste etappe resultaten
    const podiumStageLabel = laatsteVoltooideEtappe === 22 ? 'Eindstand' : `Etappe ${laatsteVoltooideEtappe}`;
    document.getElementById('dailyPodiumTitle').textContent = `🔵 Dagpodium - ${podiumStageLabel}`;
}

function updateStoryContent(stageData) {
    if (stageData.todayStory) {
        document.getElementById('todayStory').innerHTML = stageData.todayStory;
        document.getElementById('todayStorySection').style.display = 'block';
    }
    
    if (stageData.tomorrowStory) {
        document.getElementById('tomorrowStory').innerHTML = stageData.tomorrowStory;
        document.getElementById('tomorrowStorySection').style.display = 'block';
    }
}

function updateRiderPointsFromStageResults(stageData) {
    const stageIndex = stageData.stage - 1;
    
    participants.forEach(participant => {
        participant.team.forEach(rider => {
            if (rider.points[stageIndex] !== undefined) {
                rider.points[stageIndex] = 0;
            }
        });
    });
    
    stageData.top10.forEach(result => {
        participants.forEach(participant => {
            const rider = participant.team.find(r => r.name === result.rider);
            if (rider) {
                rider.points[stageIndex] = result.points;
            }
        });
    });
}

function updateJerseyPoints(jerseys, stageIndex) {
    Object.entries(jerseys).forEach(([jersey, data]) => {
        const points = jersey === 'yellow' ? 10 : (jersey === 'green' || jersey === 'polka' ? 5 : 3);
        
        participants.forEach(participant => {
            const rider = participant.team.find(r => r.name === data.rider);
            if (rider && rider.points[stageIndex] !== undefined) {
                rider.points[stageIndex] += points;
            }
        });
    });
}

function processDropouts(dropouts) {
    dropouts.forEach(riderName => {
        participants.forEach(participant => {
            const rider = participant.team.find(r => r.name === riderName);
            if (rider) {
                rider.status = 'dropped';
            }
        });
    });
}

function recalculateAllData() {
    participants.forEach(participant => {
        for (let stageIndex = 0; stageIndex < currentStage; stageIndex++) {
            let stageTotal = 0;
            participant.team.forEach(rider => {
                const riderPoints = rider.points[stageIndex] || 0;
                stageTotal += riderPoints;
                
                // Debug Marc Soler specifically
                if (rider.name === 'Marc Soler' && riderPoints > 0) {
                    console.log(`📊 RECALC: ${rider.name} stage ${stageIndex + 1}: ${riderPoints} punten`);
                }
            });
            participant.stagePoints[stageIndex] = stageTotal;
        }
        
        participant.totalPoints = participant.stagePoints.slice(0, currentStage).reduce((sum, p) => sum + p, 0);
    });
    
    calculateAllDailyWins();
    calculateRankingHistory(); // Calculate ranking history after all calculations
    createAllRidersArray();
    participants.sort((a, b) => b.totalPoints - a.totalPoints);
}

function calculateAllDailyWins() {
    participants.forEach(p => p.dailyWins = 0);
    
    for (let stage = 0; stage < currentStage; stage++) {
        let maxPoints = 0;
        
        // First pass: find the maximum points for this stage
        participants.forEach(participant => {
            const stagePoints = participant.stagePoints[stage] || 0;
            if (stagePoints > maxPoints) {
                maxPoints = stagePoints;
            }
        });
        
        // Second pass: give daily win to ALL participants with max points
        if (maxPoints > 0) {
            participants.forEach(participant => {
                const stagePoints = participant.stagePoints[stage] || 0;
                if (stagePoints === maxPoints) {
                    participant.dailyWins++;
                }
            });
        }
    }
}

// Ranking History Functions
function calculateRankingHistory() {
    ErrorHandler.log('RANKING', 'Calculating ranking history...');
    rankingHistory = [];
    
    // Calculate rankings stage by stage
    for (let stageIndex = 0; stageIndex < currentStage; stageIndex++) {
        const stageRankings = [];
        
        // Calculate total points up to this stage for each participant
        participants.forEach(participant => {
            const totalPointsUpToStage = participant.stagePoints
                .slice(0, stageIndex + 1)
                .reduce((sum, points) => sum + points, 0);
            
            stageRankings.push({
                name: participant.name,
                totalPoints: totalPointsUpToStage,
                stagePoints: participant.stagePoints[stageIndex] || 0
            });
        });
        
        // Sort by total points (descending) to get rankings
        stageRankings.sort((a, b) => b.totalPoints - a.totalPoints);
        
        // Add position to each participant
        stageRankings.forEach((participant, index) => {
            participant.position = index + 1;
        });
        
        rankingHistory[stageIndex] = stageRankings;
        
        ErrorHandler.log('RANKING', `Stage ${stageIndex + 1} rankings calculated`, {
            leader: stageRankings[0].name,
            points: stageRankings[0].totalPoints
        });
    }
    
    ErrorHandler.success('RANKING', `Ranking history calculated for ${currentStage} stages`);
}

function getRankingChanges() {
    if (rankingHistory.length === 0) {
        calculateRankingHistory();
    }
    
    const rankingProgression = [];
    
    participants.forEach(participant => {
        const progression = {
            name: participant.name,
            stages: [],
            currentRanking: 0
        };
        
        // Get ranking for each stage
        rankingHistory.forEach((stageRankings, stageIndex) => {
            const participantRanking = stageRankings.find(p => p.name === participant.name);
            if (participantRanking) {
                const stageData = {
                    stage: stageIndex + 1,
                    position: participantRanking.position,
                    totalPoints: participantRanking.totalPoints,
                    stagePoints: participantRanking.stagePoints
                };
                
                // Calculate relative change from previous stage
                if (stageIndex > 0) {
                    const previousRanking = rankingHistory[stageIndex - 1].find(p => p.name === participant.name);
                    if (previousRanking) {
                        stageData.positionChange = participantRanking.position - previousRanking.position; // Negative = moved up, Positive = moved down
                    }
                }
                
                progression.stages.push(stageData);
            }
        });
        
        // Set current ranking
        if (progression.stages.length > 0) {
            progression.currentRanking = progression.stages[progression.stages.length - 1].position;
        }
        
        rankingProgression.push(progression);
    });
    
    // Sort by current ranking
    rankingProgression.sort((a, b) => a.currentRanking - b.currentRanking);
    
    ErrorHandler.log('RANKING', 'Ranking progression calculated', rankingProgression);
    return rankingProgression;
}

function createAllRidersArray() {
    // Start met ALLE renners uit Excel Renners tab
    const riderStats = {};
    
    console.log('🔄 === CREATING ALL RIDERS ARRAY ===');
    console.log(`📊 Starting with ${window.allRidersFromExcel ? Object.keys(window.allRidersFromExcel).length : 0} riders from Excel`);
    
    // Kopieer alle renners uit Excel
    if (window.allRidersFromExcel) {
        Object.keys(window.allRidersFromExcel).forEach(riderName => {
            riderStats[riderName] = {
                ...window.allRidersFromExcel[riderName],
                points: [...window.allRidersFromExcel[riderName].points],
                inTeam: false
            };
        });
    }
    
    console.log(`📊 After copying from Excel: ${Object.keys(riderStats).length} riders`);
    
    // Update status en team info voor renners die WEL in participant teams zitten
    participants.forEach(participant => {
        participant.team.forEach(rider => {
            if (riderStats[rider.name]) {
                // Update team info en status
                riderStats[rider.name].inTeam = true;
                riderStats[rider.name].status = rider.status;
                // Team blijft zoals het in Excel staat, niet van participant
            }
        });
    });
    
    allRiders = Object.values(riderStats).map(rider => {
        rider.totalPoints = rider.points.reduce((sum, p) => sum + p, 0);
        return rider;
    });
    
    console.log(`📊 Final allRiders array: ${allRiders.length} riders`);
    console.log(`📊 Total points in system: ${allRiders.reduce((sum, rider) => sum + rider.totalPoints, 0)}`);
    
    // Sorteer op punten
    allRiders.sort((a, b) => b.totalPoints - a.totalPoints);
    
    console.log('🔄 === ALL RIDERS ARRAY CREATED ===');
}

function updateTableHeaders() {
    // Update riders table header
    let ridersHeaderHtml = '<th>Pos</th><th>Renner</th><th>Totaal</th>';
    for (let i = 1; i <= currentStage; i++) {
        if (i <= 21) {
            ridersHeaderHtml += `<th>Et ${i}</th>`;
        }
    }
    // Voeg Eindstand kolom toe als er eindstand data is
    if (window.hasEindstandData) {
        ridersHeaderHtml += `<th>Eind</th>`;
    }
    ridersHeaderHtml += '<th>Status</th>';
    document.getElementById('ridersTableHeader').innerHTML = ridersHeaderHtml;
    
    // Update daily prizes header - nieuwe volgorde: Rang, Deelnemer, Etappes 1-21, Totaal t/m 21, Eind, Totaal, Dagoverwinningen
    let dailyPrizesHeaderHtml = '<th>Rang</th><th>Deelnemer</th>';
    for (let i = 1; i <= currentStage; i++) {
        if (i <= 21) {
            dailyPrizesHeaderHtml += `<th>Etappe ${i}</th>`;
        }
    }
    // Voeg totaal etappes kolom toe
    dailyPrizesHeaderHtml += '<th style="background: #e8f4fd;">Totaal Etappes</th>';
    // Voeg Eindstand kolom toe als er eindstand data is
    if (window.hasEindstandData) {
        dailyPrizesHeaderHtml += `<th style="background: #ffe4b5;">Eind</th>`;
        dailyPrizesHeaderHtml += '<th>Totaal</th>'; // Alleen totaal kolom als er eindstand data is
    }
    dailyPrizesHeaderHtml += '<th><img src="blauw-nb.png" alt="Blauwe Truien" style="width: 20px; height: 20px; vertical-align: middle;"></th>';
    dailyPrizesHeaderHtml += '<th><img src="geel-nb.png" alt="Gele Truien" style="width: 20px; height: 20px; vertical-align: middle;"></th>';
    document.getElementById('dailyPrizesHeader').innerHTML = dailyPrizesHeaderHtml;
}

// Utility functions
function exportData() {
    // Debug: check current values
    console.log('📤 EXPORT DEBUG:');
    console.log('  currentStage:', currentStage);
    console.log('  participants.length:', participants.length);
    console.log('  allRiders.length:', allRiders.length);
    
    // Ensure currentStage is valid
    const actualCurrentStage = currentStage || 1;
    
    const data = {
        participants: participants,
        allRiders: allRiders,
        currentStage: actualCurrentStage,
        exportDate: new Date().toISOString(),
        debugInfo: {
            participantsCount: participants.length,
            ridersCount: allRiders.length,
            actualStage: actualCurrentStage
        }
    };
    
    console.log('📤 Exporting stage:', actualCurrentStage);
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tourploeg-export-stage-${actualCurrentStage}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('✅ Export complete:', `tourploeg-export-stage-${actualCurrentStage}.json`);
}

function resetData() {
    if (confirm('Weet je zeker dat je alle data wilt resetten?')) {
        ErrorHandler.log('RESET', 'Manual reset initiated');
        
        // Use centralized memory management
        MemoryManager.fullReset();
        
        // Clear service worker cache
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
                for(let registration of registrations) {
                    registration.unregister();
                    ErrorHandler.log('RESET', 'ServiceWorker unregistered');
                }
            });
        }
        
        // Clear all caches
        if ('caches' in window) {
            caches.keys().then(function(names) {
                for (let name of names) {
                    caches.delete(name);
                    ErrorHandler.log('RESET', `Cache deleted: ${name}`);
                }
            });
        }
        
        // Update UI
        const gettingStarted = document.getElementById('gettingStarted');
        if (gettingStarted) gettingStarted.style.display = 'block';
        
        document.getElementById('stageInfoContainer').style.display = 'none';
        document.getElementById('todayStorySection').style.display = 'none';
        document.getElementById('tomorrowStorySection').style.display = 'none';
        
        loadParticipantsTable();
        updatePodiums();
        updateTableHeaders();
        
        ErrorHandler.success('RESET', 'Manual reset completed');
        
        // Force hard page reload to clear any remaining cache
        if (confirm('Wil je de pagina volledig herladen om alle cache te wissen?')) {
            window.location.reload(true); // Hard reload
        } else {
            alert('✅ Alle data gereset! Upload nieuwe Excel voor fresh start.');
        }
    }
}

// Debug function to inspect all cache
function inspectAllCache() {
    console.log('🔍 CACHE INSPECTION:');
    
    // Check localStorage
    console.log('📦 localStorage:');
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        console.log(`  ${key}: ${localStorage.getItem(key)?.substring(0, 100)}...`);
    }
    
    // Check sessionStorage
    console.log('📦 sessionStorage:');
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        console.log(`  ${key}: ${sessionStorage.getItem(key)?.substring(0, 100)}...`);
    }
    
    // Check window properties
    console.log('📦 window properties:');
    Object.keys(window).forEach(key => {
        if (key.includes('tourploeg') || key.includes('excel') || key.includes('cache') || key.includes('data')) {
            console.log(`  window.${key}:`, window[key]);
        }
    });
    
    // Check global variables
    console.log('📦 Global variables:');
    console.log('  participants:', participants);
    console.log('  allRiders:', allRiders);
    console.log('  currentStage:', currentStage);
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚴‍♂️ Tour de France App Loading...');
    
    // COMPLETE FRESH START - clear any cached data on page load
    console.log('🧹 Clearing any cached data on fresh page load...');
    participants = [];
    allRiders = [];
    currentStage = 1;
    window.etappeInfoData = null;
    window.hasEindstandData = false;
    
    // Clear ALL localStorage data that might interfere
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
        
        console.log('🗑️ Init: ALL cache cleared');
    } catch(e) {
        console.log('⚠️ Could not clear localStorage on init:', e);
    }
    
    loadParticipantsTable();
    updatePodiums();
    
    document.getElementById('detailView').addEventListener('click', function(e) {
        if (e.target === this) {
            closeDetailView();
        }
    });
    
    // Initialize Excel persistence (auto-load saved data)
    if (typeof ExcelPersistence !== 'undefined') {
        await ExcelPersistence.initialize();
    }
    
    // Trigger podium animation on initial load (after a short delay to ensure data is loaded)
    setTimeout(() => {
        triggerPodiumAnimation();
    }, 1000);
    
    // Initialize with current year
    updateTitleForYear(new Date().getFullYear().toString());
    
    console.log('✅ App initialized!');
});

// Historie functionaliteit
let historieMode = false;
let currentHistorieYear = null;
let originalData = null; // Backup van originele data

function loadHistorieTab() {
    console.log('📚 Loading historie tab...');
    loadAvailableYears();
}

async function loadAvailableYears() {
    try {
        console.log('📅 Scanning for available tdf-*.xlsx files...');
        
        // Use new scanning function to find tdf-*.xlsx files
        const availableYears = await window.ExcelPersistence.scanYears();
        
        const yearSelector = document.getElementById('historieYearSelector');
        yearSelector.innerHTML = '<option value="">Kies een jaar...</option>';
        
        // Add years from found files
        availableYears.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = `${year}`;
            yearSelector.appendChild(option);
        });
        
        console.log('✅ Historic years loaded:', availableYears);
        
        if (availableYears.length === 0) {
            yearSelector.innerHTML = '<option value="">Geen historie beschikbaar</option>';
        }
        
    } catch (error) {
        console.error('❌ Error loading available years:', error);
        const yearSelector = document.getElementById('historieYearSelector');
        yearSelector.innerHTML = '<option value="">Geen historie beschikbaar</option>';
    }
}

async function loadHistorieYear(year) {
    if (!year) return;
    
    console.log(`🕰️ Loading historie for year: ${year}`);
    
    // Show loading status
    const statusDiv = document.getElementById('historieStatus');
    const statusTitle = document.getElementById('historieStatusTitle');
    const statusText = document.getElementById('historieStatusText');
    
    statusDiv.style.display = 'block';
    statusTitle.textContent = `📊 ${year} wordt geladen...`;
    statusText.textContent = 'Even geduld alstublieft...';
    
    try {
        // Backup current data if not already backed up
        if (!historieMode && !originalData) {
            originalData = {
                participants: [...participants],
                allRiders: [...allRiders],
                currentStage: currentStage,
                etappeInfoData: window.etappeInfoData ? {...window.etappeInfoData} : null
            };
        }
        
        // Use new loadHistoricData function to load tdf-${year}.xlsx
        const historicLoaded = await window.ExcelPersistence.loadHistoric(year);
        if (!historicLoaded) {
            throw new Error(`Bestand tdf-${year}.xlsx niet gevonden`);
        }
        
        console.log(`📊 Historie year ${year} loaded successfully`);
        
        if (historicLoaded) {
            // Switch to historie mode
            historieMode = true;
            currentHistorieYear = year;
            
            // Update title and show historic indicator
            updateTitleForYear(year);
            showHistoricIndicator();
            
            // Hide upload tab in historie mode
            const uploadTab = document.querySelector('[onclick="showTab(\'upload\')"]');
            if (uploadTab) uploadTab.style.display = 'none';
            
            // Update status
            statusTitle.textContent = `🏆 ${year} Geladen!`;
            statusText.textContent = `Bekijk de resultaten in de andere tabbladen`;
            
            // Auto-navigate to home to show results
            setTimeout(() => {
                showTab('home');
                statusDiv.style.display = 'none';
            }, 2000);
            
        } else {
            throw new Error(`Geen data gevonden voor jaar ${year}`);
        }
        
    } catch (error) {
        console.error('❌ Error loading historie year:', error);
        statusTitle.textContent = `❌ Fout bij laden ${year}`;
        statusText.textContent = error.message;
        
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
    }
}

async function returnToCurrentYear() {
    console.log('🔙 Returning to current year...');
    
    try {
        // Reload current Excel file completely
        const response = await fetch('./tdf-current.xlsx');
        if (!response.ok) {
            throw new Error('Current Excel niet gevonden');
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, {type: 'array'});
        
        console.log('📊 Reloading current year completely...');
        
        // Use existing parseExcelData function with current workbook
        parseExcelData(workbook);
        
    } catch (error) {
        console.error('❌ Error reloading current year:', error);
        // Fallback to original data if available
        if (originalData) {
            participants = [...originalData.participants];
            allRiders = [...originalData.allRiders];
            currentStage = originalData.currentStage;
            window.etappeInfoData = originalData.etappeInfoData;
            
            // Update all tables
            loadParticipantsTable();
            loadRidersTable();
            loadMatrixTable();
            loadDailyPrizesTable();
            loadRankingTable();
            updatePodiums();
            updateTableHeaders();
            if (typeof updateStageInfoFromExcel === 'function') {
                updateStageInfoFromExcel();
            }
        }
    }
    
    // Reset historie mode
    historieMode = false;
    currentHistorieYear = null;
    
    // Update title and hide historic indicator
    updateTitleForYear(new Date().getFullYear().toString());
    hideHistoricIndicator();
    
    // Show upload tab again
    const uploadTab = document.querySelector('[onclick="showTab(\'upload\')"]');
    if (uploadTab) uploadTab.style.display = 'inline-block';
    
    // Reset year selector
    const yearSelector = document.getElementById('historieYearSelector');
    if (yearSelector) yearSelector.value = '';
    
    // Navigate to home
    showTab('home');
}

function updateTitleForYear(year) {
    const title = document.getElementById('mainTitle');
    if (title) {
        title.textContent = `🚴‍♂️ Tour de France Poule ${year}`;
    }
}

function showHistoricIndicator() {
    const indicator = document.getElementById('historicIndicator');
    if (indicator) {
        indicator.style.display = 'block';
        
        // Set historic bike image with fallback to emoji
        const bikeImg = document.getElementById('historicBike');
        const bikeDisplay = document.getElementById('historicBikeDisplay');
        
        // Try to use historic bike image, fallback to emoji
        const historicBikePath = './historic-bike.png';
        
        if (bikeImg) {
            bikeImg.src = historicBikePath;
            bikeImg.style.display = 'block';
            bikeImg.onerror = function() {
                // Fallback: replace with emoji if image not found
                bikeImg.style.display = 'none';
                if (!bikeImg.parentNode.querySelector('.bike-emoji')) {
                    const emojiSpan = document.createElement('span');
                    emojiSpan.className = 'bike-emoji';
                    emojiSpan.innerHTML = '🚲';
                    emojiSpan.style.fontSize = '40px';
                    emojiSpan.style.marginRight = '10px';
                    bikeImg.parentNode.insertBefore(emojiSpan, bikeImg);
                }
            };
        }
        
        if (bikeDisplay) {
            bikeDisplay.src = historicBikePath;
            bikeDisplay.style.display = 'block';
            bikeDisplay.onerror = function() {
                // Fallback: replace with emoji
                bikeDisplay.style.display = 'none';
                if (!bikeDisplay.parentNode.querySelector('.bike-emoji-display')) {
                    const emojiSpan = document.createElement('span');
                    emojiSpan.className = 'bike-emoji-display';
                    emojiSpan.innerHTML = '🚲';
                    emojiSpan.style.fontSize = '80px';
                    emojiSpan.style.marginBottom = '20px';
                    emojiSpan.style.display = 'block';
                    bikeDisplay.parentNode.insertBefore(emojiSpan, bikeDisplay);
                }
            };
        }
    }
}

function hideHistoricIndicator() {
    const indicator = document.getElementById('historicIndicator');
    if (indicator) {
        indicator.style.display = 'none';
    }
}

// Podium Animation Challenge Function
function triggerPodiumAnimation() {
    console.log('🎨 Triggering podium animation...');
    
    // Only show animation if we have participants data
    if (participants.length === 0) {
        console.log('⏭️ No data yet - skipping animation');
        return;
    }
    
    // Get current winners for each category
    const winners = getCurrentWinners();
    
    // Show overlays with winner names
    showPodiumOverlay('dailyOverlay', 'dailyWinnerName', winners.daily);
    showPodiumOverlay('generalOverlay', 'generalWinnerName', winners.general);
    showPodiumOverlay('dailyWinsOverlay', 'dailyWinsWinnerName', winners.dailyWins);
    
    // Hide overlays after 5 seconds
    setTimeout(() => {
        hidePodiumOverlay('dailyOverlay');
        hidePodiumOverlay('generalOverlay');
        hidePodiumOverlay('dailyWinsOverlay');
    }, 5000);
}

function getCurrentWinners() {
    if (participants.length === 0) {
        return { daily: 'Geen data', general: 'Geen data', dailyWins: 'Geen data' };
    }
    
    // Daily winner (last stage)
    const lastStageIndex = currentStage - 1;
    const dailyRanking = [...participants].sort((a, b) => 
        (b.stagePoints[lastStageIndex] || 0) - (a.stagePoints[lastStageIndex] || 0)
    );
    
    // General classification leader
    const generalRanking = [...participants].sort((a, b) => b.totalPoints - a.totalPoints);
    
    // Most daily wins leader
    const dailyWinsRanking = [...participants].sort((a, b) => b.dailyWins - a.dailyWins);
    
    return {
        daily: dailyRanking[0]?.name || 'Geen winnaar',
        general: generalRanking[0]?.name || 'Geen winnaar', 
        dailyWins: dailyWinsRanking[0]?.name || 'Geen winnaar'
    };
}

function showPodiumOverlay(overlayId, nameId, winnerName) {
    const overlay = document.getElementById(overlayId);
    const nameElement = document.getElementById(nameId);
    
    if (overlay && nameElement) {
        nameElement.textContent = winnerName;
        overlay.classList.add('show');
    }
}

function hidePodiumOverlay(overlayId) {
    const overlay = document.getElementById(overlayId);
    if (overlay) {
        overlay.classList.remove('show');
    }
}