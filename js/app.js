// Tour de France Poule 2024 - Main Application
// Global variables
let participants = [];
let allRiders = [];
let currentStage = 1;

// Utility function to calculate tied rankings
function calculateTiedRankings(items, scoreFunction) {
    const itemsWithScores = items.map(item => ({
        item: item,
        score: scoreFunction(item)
    }));
    
    // Sort by score (descending)
    itemsWithScores.sort((a, b) => b.score - a.score);
    
    // Calculate rankings with ties
    const rankings = [];
    let currentRank = 1;
    
    for (let i = 0; i < itemsWithScores.length; i++) {
        if (i > 0 && itemsWithScores[i].score !== itemsWithScores[i-1].score) {
            // Score changed, update rank to current position + 1
            currentRank = i + 1;
        }
        
        rankings.push({
            item: itemsWithScores[i].item,
            score: itemsWithScores[i].score,
            rank: currentRank
        });
    }
    
    return rankings;
}

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
    
    // Also handle mobile tabs
    document.querySelectorAll('.mobile-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    document.getElementById(tabName).classList.add('active');
    
    // Handle desktop nav tab activation
    if (event && event.target && event.target.classList.contains('nav-tab')) {
        event.target.classList.add('active');
    }
    
    // Handle mobile tab activation
    const activeMobileTab = document.querySelector(`.mobile-tab[data-tab="${tabName}"]`);
    if (activeMobileTab) {
        activeMobileTab.classList.add('active');
    }

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
            // Reset participant selector on mobile
            if (window.innerWidth <= 768) {
                const currentDisplay = document.getElementById('currentParticipantDisplay');
                if (currentDisplay) {
                    currentDisplay.textContent = 'Kies Equipe';
                }
            }
            break;
        case 'daily-prizes':
            loadDailyPrizesTable();
            break;
        case 'ranking':
            loadRankingTable();
            break;
        case 'etapes':
            loadEtapesTable();
            break;
        case 'historie':
            loadHistorieTab();
            break;
        case 'mytdf':
            loadMyTdfTab();
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
        
        // Calculate tied rankings based on total points
        const stageRankingsList = calculateTiedRankings(stageRankings, (p) => p.totalPoints);
        
        // Convert back to original format with tied positions
        const finalStageRankings = stageRankingsList.map(rankingEntry => ({
            ...rankingEntry.item,
            position: rankingEntry.rank
        }));
        
        rankingHistory[stageIndex] = finalStageRankings;
        
        ErrorHandler.log('RANKING', `Stage ${stageIndex + 1} rankings calculated`, {
            leader: finalStageRankings[0].name,
            points: finalStageRankings[0].totalPoints
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

// ============= MOBILE NAVIGATION FUNCTIONS =============

// Mobile navigation functions
function setActiveMobileTab(tabElement) {
    // Remove active from all mobile tabs
    document.querySelectorAll('.mobile-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Add active to clicked tab
    tabElement.classList.add('active');
}

function toggleMobileDrawer() {
    const drawer = document.getElementById('mobileDrawer');
    drawer.classList.toggle('active');
    
    // Prevent body scroll when drawer is open
    if (drawer.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}

function closeMobileDrawer() {
    const drawer = document.getElementById('mobileDrawer');
    drawer.classList.remove('active');
    document.body.style.overflow = '';
}


// ============= MOBILE GESTURES & INTERACTIONS =============

// Global gesture variables
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
let isPulling = false;
let pullDistance = 0;
let currentStageNum = 1;
let maxStageNum = 22;

// Initialize mobile gestures
function initMobileGestures() {
    // Only add gestures on mobile
    if (window.innerWidth > 768) return;
    
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    console.log('🎮 Mobile gestures initialized');
}

function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    
    // Check if we're at the top for pull-to-refresh
    if (window.scrollY === 0 && touchStartY < 100) {
        isPulling = true;
    }
}

function handleTouchMove(e) {
    if (!e.touches[0]) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    
    // Handle pull-to-refresh
    if (isPulling && window.scrollY === 0) {
        pullDistance = currentY - touchStartY;
        if (pullDistance > 0 && pullDistance < 120) {
            showPullToRefreshIndicator(pullDistance);
            e.preventDefault(); // Prevent scroll
        }
    }
}

function handleTouchEnd(e) {
    if (!e.changedTouches[0]) return;
    
    touchEndX = e.changedTouches[0].clientX;
    touchEndY = e.changedTouches[0].clientY;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    // Handle pull-to-refresh
    if (isPulling) {
        if (pullDistance > 60) {
            triggerRefresh();
        }
        hidePullToRefreshIndicator();
        isPulling = false;
        pullDistance = 0;
        return;
    }
    
    // Handle horizontal swipes (only in etapes tab)
    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab && activeTab.id === 'etapes') {
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
            if (deltaX > 0) {
                // Swipe right - previous stage
                navigateStagePrev();
            } else {
                // Swipe left - next stage  
                navigateStageNext();
            }
        }
    }
}

function showPullToRefreshIndicator(distance) {
    let indicator = document.getElementById('pullToRefreshIndicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'pullToRefreshIndicator';
        indicator.innerHTML = `
            <div class="pull-indicator">
                <div class="pull-icon">↓</div>
                <div class="pull-text">Trek om te vernieuwen</div>
            </div>
        `;
        document.body.insertBefore(indicator, document.body.firstChild);
    }
    
    const opacity = Math.min(distance / 60, 1);
    const rotation = distance * 2;
    
    indicator.style.display = 'block';
    indicator.style.opacity = opacity;
    indicator.querySelector('.pull-icon').style.transform = `rotate(${rotation}deg)`;
    
    if (distance > 60) {
        indicator.querySelector('.pull-text').textContent = 'Loslaten om te vernieuwen';
        indicator.querySelector('.pull-icon').textContent = '↻';
    }
}

function hidePullToRefreshIndicator() {
    const indicator = document.getElementById('pullToRefreshIndicator');
    if (indicator) {
        indicator.style.display = 'none';
    }
}

function triggerRefresh() {
    console.log('🔄 Pull-to-refresh triggered');
    
    // Show loading state
    const indicator = document.getElementById('pullToRefreshIndicator');
    if (indicator) {
        indicator.querySelector('.pull-text').textContent = 'Vernieuwen...';
        indicator.querySelector('.pull-icon').textContent = '⟳';
    }
    
    // Simulate refresh (reload current data)
    setTimeout(() => {
        // Trigger data reload based on current tab
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab) {
            showTab(activeTab.id);
        }
        
        hidePullToRefreshIndicator();
        console.log('✅ Refresh complete');
    }, 1000);
}

// Stage navigation functions
function navigateStageNext() {
    const maxAvailableStage = Math.min(currentStage, 21);
    const hasEindstand = window.hasEindstandData || currentStage >= 22;
    const maxStage = hasEindstand ? 22 : maxAvailableStage;
    
    if (currentStageNum < maxStage) {
        currentStageNum++;
        showSelectedStage(currentStageNum.toString());
        updateStageIndicators();
        console.log(`➡️ Next stage: ${currentStageNum}`);
    }
}

function navigateStagePrev() {
    if (currentStageNum > 1) {
        currentStageNum--;
        showSelectedStage(currentStageNum.toString());
        updateStageIndicators();
        console.log(`⬅️ Previous stage: ${currentStageNum}`);
    }
}

function updateStageIndicators() {
    // Update stage pills if they exist
    const pills = document.querySelectorAll('.stage-pill');
    pills.forEach(pill => {
        pill.classList.remove('active');
        if (parseInt(pill.dataset.stage) === currentStageNum) {
            pill.classList.add('active');
        }
    });
    
    // Update current stage display
    const currentStageDisplay = document.querySelector('.current-stage');
    if (currentStageDisplay) {
        if (currentStageNum === 22) {
            currentStageDisplay.textContent = 'Eindklassement';
        } else {
            currentStageDisplay.textContent = `Etappe ${currentStageNum}`;
        }
    }
}

// Initialize gestures when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initMobileGestures();
    initBottomNavSwipe();
});

// Initialize bottom navigation swipe
function initBottomNavSwipe() {
    if (window.innerWidth > 768) return;
    
    const navContainer = document.getElementById('navContainer');
    const bottomNav = document.getElementById('mobileBottomNav');
    
    if (!navContainer || !bottomNav) return;
    
    // Enable smooth scrolling
    bottomNav.style.scrollBehavior = 'smooth';
    
    // Add scroll snap for better UX
    navContainer.style.scrollSnapType = 'x mandatory';
    
    // Make each tab a snap point
    document.querySelectorAll('.mobile-tab').forEach(tab => {
        tab.style.scrollSnapAlign = 'start';
    });
    
    console.log('📱 Bottom navigation swipe initialized with native scroll');
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
    
    // Check for daily ties
    const dailyMaxPoints = dailyRanking[0]?.stagePoints[lastStageIndex] || 0;
    const dailyTiedWinners = dailyRanking.filter(p => (p.stagePoints[lastStageIndex] || 0) === dailyMaxPoints && dailyMaxPoints > 0);
    
    // General classification leader
    const generalRanking = [...participants].sort((a, b) => b.totalPoints - a.totalPoints);
    
    // Check for general ties
    const generalMaxPoints = generalRanking[0]?.totalPoints || 0;
    const generalTiedLeaders = generalRanking.filter(p => p.totalPoints === generalMaxPoints && generalMaxPoints > 0);
    
    // Most daily wins leader
    const dailyWinsRanking = [...participants].sort((a, b) => b.dailyWins - a.dailyWins);
    
    // Check for daily wins ties
    const maxDailyWins = dailyWinsRanking[0]?.dailyWins || 0;
    const dailyWinsTiedLeaders = dailyWinsRanking.filter(p => p.dailyWins === maxDailyWins && maxDailyWins > 0);
    
    // Store tie information globally for modal access
    window.currentTies = {
        daily: dailyTiedWinners,
        general: generalTiedLeaders,
        dailyWins: dailyWinsTiedLeaders
    };
    
    return {
        daily: dailyTiedWinners.length > 1 ? 'Klik voor alle winnaars' : (dailyTiedWinners[0]?.name || 'Geen winnaar'),
        general: generalTiedLeaders.length > 1 ? 'Klik voor alle winnaars' : (generalTiedLeaders[0]?.name || 'Geen winnaar'), 
        dailyWins: dailyWinsTiedLeaders.length > 1 ? 'Klik voor alle winnaars' : (dailyWinsTiedLeaders[0]?.name || 'Geen winnaar')
    };
}

function showPodiumOverlay(overlayId, nameId, winnerName) {
    const overlay = document.getElementById(overlayId);
    const nameElement = document.getElementById(nameId);
    
    if (overlay && nameElement) {
        nameElement.textContent = winnerName;
        
        // Make clickable if multiple winners
        if (winnerName === 'Klik voor alle winnaars') {
            overlay.style.cursor = 'pointer';
            nameElement.style.cursor = 'pointer';
            
            // Add click handler based on overlay type
            overlay.onclick = function() {
                if (overlayId === 'dailyOverlay' && window.currentTies?.daily?.length > 1) {
                    showJerseyWinnersModal(window.currentTies.daily, 'blauw-nb.png', '🔵 Blauwe Trui Winnaars', `Etappe ${currentStage}`, 'dagwinnaar');
                } else if (overlayId === 'generalOverlay' && window.currentTies?.general?.length > 1) {
                    showJerseyWinnersModal(window.currentTies.general, 'geel-nb.png', '🟡 Gele Trui Dragers', `na Etappe ${currentStage}`, 'klassementsleider');
                } else if (overlayId === 'dailyWinsOverlay' && window.currentTies?.dailyWins?.length > 1) {
                    showJerseyWinnersModal(window.currentTies.dailyWins, 'milka-nb.png', '🏆 Meeste Dagoverwinningen', `na Etappe ${currentStage}`, 'dagwinnenkoning');
                }
            };
        } else {
            // Remove click functionality for single winners
            overlay.style.cursor = 'default';
            nameElement.style.cursor = 'default';
            overlay.onclick = null;
        }
        
        overlay.classList.add('show');
    }
}

function hidePodiumOverlay(overlayId) {
    const overlay = document.getElementById(overlayId);
    if (overlay) {
        overlay.classList.remove('show');
    }
}

// ============= MY TDF FUNCTIONALITY =============

// Cookie utility functions for storing/retrieving selected team
const CookieUtils = {
    set: function(name, value, days = 30) {
        const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
        document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
    },
    
    get: function(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            return decodeURIComponent(parts.pop().split(';').shift());
        }
        return null;
    },
    
    remove: function(name) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
    }
};

// Load My TdF tab and populate team selector
function loadMyTdfTab() {
    const selector = document.getElementById('myTdfTeamSelector');
    if (!selector) return;
    
    // Clear existing options except the first one
    selector.innerHTML = '<option value="">Kies je equipe...</option>';
    
    // Add participants to dropdown
    participants.forEach(participant => {
        const option = document.createElement('option');
        option.value = participant.name;
        option.textContent = participant.name;
        selector.appendChild(option);
    });
    
    // Auto-select saved team
    const currentYear = window.historieMode ? currentHistorieYear : new Date().getFullYear().toString();
    const cookieKey = `myTdfSelectedTeam_${currentYear}`;
    const savedTeam = CookieUtils.get(cookieKey);
    
    if (savedTeam && participants.find(p => p.name === savedTeam)) {
        selector.value = savedTeam;
        selectMyTdfTeam(savedTeam);
    }
}

// Handle team selection
function selectMyTdfTeam(teamName) {
    if (!teamName) {
        // Clear tables when no team selected
        clearMyTdfTables();
        return;
    }
    
    // Save selection in year-specific cookie
    const currentYear = window.historieMode ? currentHistorieYear : new Date().getFullYear().toString();
    const cookieKey = `myTdfSelectedTeam_${currentYear}`;
    CookieUtils.set(cookieKey, teamName);
    
    // Update all three tables
    updateMyTdfTeamDetail(teamName);
    updateMyTdfSelectionMatrix(teamName);
    updateMyTdfExtendedProgress(teamName);
}

// Clear all MyTdF tables
function clearMyTdfTables() {
    // Clear team detail table
    const teamDetailHeader = document.getElementById('myTdfTeamDetailHeader');
    const teamDetailTable = document.getElementById('myTdfTeamDetailTable');
    if (teamDetailHeader && teamDetailTable) {
        teamDetailHeader.innerHTML = '<tr><th colspan="5" style="text-align: center; color: #666;">Selecteer eerst je equipe</th></tr>';
        teamDetailTable.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #666;">👆 Kies je equipe uit de dropdown</td></tr>';
    }
    
    // Clear selection matrix table
    const matrixHeader = document.getElementById('myTdfSelectionMatrixHeader');
    const matrixTable = document.getElementById('myTdfSelectionMatrixTable');
    if (matrixHeader && matrixTable) {
        matrixHeader.innerHTML = '<tr><th colspan="3" style="text-align: center; color: #666;">Selecteer eerst je equipe</th></tr>';
        matrixTable.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 40px; color: #666;">👆 Kies je equipe uit de dropdown</td></tr>';
    }
    
    // Clear extended progress table
    const progressHeader = document.getElementById('myTdfExtendedProgressHeader');
    const progressTable = document.getElementById('myTdfExtendedProgressTable');
    if (progressHeader && progressTable) {
        progressHeader.innerHTML = '<tr><th colspan="5" style="text-align: center; color: #666;">Selecteer eerst je equipe</th></tr>';
        progressTable.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #666;">👆 Kies je equipe uit de dropdown</td></tr>';
    }
}

// Update team detail table (identical to Equipes modal)
function updateMyTdfTeamDetail(teamName) {
    const participant = participants.find(p => p.name === teamName);
    if (!participant) return;
    
    const header = document.getElementById('myTdfTeamDetailHeader');
    const tbody = document.getElementById('myTdfTeamDetailTable');
    if (!header || !tbody) return;
    
    // Create header - same as showParticipantDetail
    let headerHtml = '<tr><th style="width: auto;">Renner</th>';
    
    // Add stage columns
    for (let i = 1; i <= currentStage; i++) {
        if (i <= 21) {
            headerHtml += `<th>Et ${i}</th>`;
        }
    }
    
    // Add Totaal Etappes column
    headerHtml += `<th style="background: #e8f4fd;">Totaal Etappes</th>`;
    
    // Add Eindstand column if data exists
    if (window.hasEindstandData) {
        headerHtml += `<th style="background: #ffe4b5;">Eind</th>`;
        headerHtml += `<th>Totaal</th>`;
    }
    
    headerHtml += `<th>Status</th></tr>`;
    header.innerHTML = headerHtml;
    
    // Create table body
    tbody.innerHTML = '';
    
    // Sort riders by total points (highest first)
    const sortedRiders = [...participant.team].sort((a, b) => {
        const aTotalPoints = a.points.reduce((sum, p) => sum + (p || 0), 0);
        const bTotalPoints = b.points.reduce((sum, p) => sum + (p || 0), 0);
        return bTotalPoints - aTotalPoints;
    });
    
    sortedRiders.forEach(rider => {
        const statusClass = rider.status === 'dropped' ? 'rider-dropped' : '';
        
        let stagePointsHtml = '';
        for (let i = 0; i < currentStage; i++) {
            if (i < 21) { // Only stages 1-21
                stagePointsHtml += `<td class="points-cell ${statusClass}">${rider.points[i] || 0}</td>`;
            }
        }
        
        // Calculate total of regular stages (1-21)
        const totalEtappes = rider.points.slice(0, 21).reduce((sum, p) => sum + (p || 0), 0);
        stagePointsHtml += `<td class="points-cell ${statusClass}" style="background: #e8f4fd; font-weight: bold;">${totalEtappes}</td>`;
        
        // Add Eindstand column if data exists
        if (window.hasEindstandData) {
            const eindstandPoints = rider.points[21] || 0; // Index 21 = stage 22 (Eindstand)
            stagePointsHtml += `<td class="points-cell ${statusClass}" style="background: #ffe4b5; font-weight: bold;">${eindstandPoints}</td>`;
            
            // Total of everything
            const totalPoints = rider.points.reduce((sum, p) => sum + (p || 0), 0);
            stagePointsHtml += `<td class="points-cell ${statusClass}"><strong>${totalPoints}</strong></td>`;
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="${statusClass}" style="white-space: nowrap;">${rider.name}</td>
            ${stagePointsHtml}
            <td class="${statusClass}">${rider.status === 'dropped' ? '🔴 Uitgevallen' : '🟢 Actief'}</td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Apply auto-sizing after table is populated
    setTimeout(() => {
        const table = document.querySelector('#myTdfTeamDetailTable')?.closest('table');
        if (table && table.offsetHeight > 0) {
            autoSizeTable(table, { nameColumns: [0], statusColumns: 'auto' });
        }
    }, 100);
}

// Update selection matrix table (identical to Equipes matrix but filtered to selected team)
function updateMyTdfSelectionMatrix(teamName) {
    const participant = participants.find(p => p.name === teamName);
    if (!participant) return;
    
    const header = document.getElementById('myTdfSelectionMatrixHeader');
    const tbody = document.getElementById('myTdfSelectionMatrixTable');
    if (!header || !tbody) return;
    
    // Create full matrix header like in loadMatrixTable
    let headerHtml = '<tr><th style="writing-mode: initial; text-orientation: initial;">Renner</th><th style="writing-mode: initial; text-orientation: initial;">Status</th><th style="writing-mode: initial; text-orientation: initial;">Totaal</th>';
    participants.forEach(p => {
        headerHtml += `<th style="writing-mode: vertical-lr; text-orientation: mixed;" title="${p.name}">${p.name}</th>`;
    });
    headerHtml += '</tr>';
    header.innerHTML = headerHtml;
    
    // Clear table
    tbody.innerHTML = '';
    
    // Create rider stats for selected team riders only
    const riderStats = {};
    participant.team.forEach(rider => {
        riderStats[rider.name] = {
            name: rider.name,
            status: rider.status,
            selectedBy: [],
            totalSelections: 0
        };
        
        // Check all participants for this rider
        participants.forEach(p => {
            const hasRider = p.team.some(r => r.name === rider.name);
            if (hasRider) {
                riderStats[rider.name].selectedBy.push(p.name);
                riderStats[rider.name].totalSelections++;
            }
        });
    });
    
    // Sort by total selections (most popular first)
    const sortedRiders = Object.values(riderStats).sort((a, b) => b.totalSelections - a.totalSelections);
    
    sortedRiders.forEach(rider => {
        const statusClass = rider.status === 'dropped' ? 'rider-dropped' : '';
        
        let participantCells = '';
        participants.forEach(p => {
            const isSelected = rider.selectedBy.includes(p.name);
            const cellContent = isSelected ? '🟢' : '';
            participantCells += `<td>${cellContent}</td>`;
        });
        
        // Status icon for matrix
        const matrixStatusIcon = rider.status === 'dropped' ? '🔴' : '🟢';
        const matrixRowClass = rider.status === 'dropped' ? 'rider-dropped-row' : '';
        
        const row = document.createElement('tr');
        row.className = matrixRowClass;
        row.innerHTML = `
            <td class="${statusClass}">${rider.name}</td>
            <td class="${statusClass}">${matrixStatusIcon}</td>
            <td class="points-cell"><strong>${rider.totalSelections}</strong></td>
            ${participantCells}
        `;
        tbody.appendChild(row);
    });
    
    // Apply auto-sizing after matrix table is populated
    setTimeout(() => {
        const table = document.querySelector('#myTdfSelectionMatrixTable')?.closest('table');
        if (table && table.offsetHeight > 0) {
            autoSizeTable(table, { nameColumns: [0], statusColumns: [1] });
        }
    }, 100);
}

// Update extended progress table
function updateMyTdfExtendedProgress(teamName) {
    const participant = participants.find(p => p.name === teamName);
    if (!participant) return;
    
    const header = document.getElementById('myTdfExtendedProgressHeader');
    const tbody = document.getElementById('myTdfExtendedProgressTable');
    if (!header || !tbody) return;
    
    // Create header
    let headerHtml = '<tr><th>Etappe</th><th>Punten</th><th>Totaal</th><th>Rank</th><th>Jerseys</th></tr>';
    header.innerHTML = headerHtml;
    
    // Clear table
    tbody.innerHTML = '';
    
    // Calculate daily winners for jersey tracking (fixed blue jersey logic)
    const dailyWinners = [];
    for (let stage = 0; stage < currentStage; stage++) {
        let maxPoints = 0;
        let winners = [];
        
        participants.forEach(p => {
            const stagePoints = p.stagePoints[stage] || 0;
            if (stagePoints > maxPoints) {
                maxPoints = stagePoints;
                winners = [p.name];
            } else if (stagePoints === maxPoints && stagePoints > 0) {
                winners.push(p.name);
            }
        });
        
        dailyWinners[stage] = winners;
    }
    
    // Calculate general classification leaders for each stage
    const generalLeaders = [];
    for (let stage = 0; stage < currentStage; stage++) {
        // Calculate cumulative points up to this stage for all participants
        const stageRankings = participants.map(p => ({
            name: p.name,
            totalPoints: p.stagePoints.slice(0, stage + 1).reduce((sum, points) => sum + (points || 0), 0)
        }));
        
        // Sort by total points to get leader
        stageRankings.sort((a, b) => b.totalPoints - a.totalPoints);
        
        // Get all tied leaders
        const maxPoints = stageRankings[0].totalPoints;
        const leaders = stageRankings.filter(p => p.totalPoints === maxPoints).map(p => p.name);
        
        generalLeaders[stage] = leaders;
    }
    
    // Create rows for each stage
    for (let stage = 0; stage < currentStage; stage++) {
        const stagePoints = participant.stagePoints[stage] || 0;
        const cumulativePoints = participant.stagePoints.slice(0, stage + 1).reduce((sum, p) => sum + (p || 0), 0);
        
        // Calculate ranking after this stage
        const stageRankings = participants.map(p => ({
            name: p.name,
            totalPoints: p.stagePoints.slice(0, stage + 1).reduce((sum, points) => sum + (points || 0), 0)
        }));
        stageRankings.sort((a, b) => b.totalPoints - a.totalPoints);
        const currentRank = stageRankings.findIndex(p => p.name === teamName) + 1;
        
        // Calculate ranking delta
        let rankDelta = '';
        if (stage > 0) {
            const prevStageRankings = participants.map(p => ({
                name: p.name,
                totalPoints: p.stagePoints.slice(0, stage).reduce((sum, points) => sum + (points || 0), 0)
            }));
            prevStageRankings.sort((a, b) => b.totalPoints - a.totalPoints);
            const prevRank = prevStageRankings.findIndex(p => p.name === teamName) + 1;
            
            const change = prevRank - currentRank;
            if (change > 0) {
                rankDelta = ` (<span style="color: #28a745;">▲${change}</span>)`;
            } else if (change < 0) {
                rankDelta = ` (<span style="color: #dc3545;">▼${Math.abs(change)}</span>)`;
            } else {
                rankDelta = ` (<span style="color: #6c757d;">0</span>)`;
            }
        }
        
        // Check for jerseys
        let jerseys = '';
        if (dailyWinners[stage] && dailyWinners[stage].includes(teamName)) {
            jerseys += '🔵 ';
        }
        if (generalLeaders[stage] && generalLeaders[stage].includes(teamName)) {
            jerseys += '🟡 ';
        }
        if (!jerseys) {
            jerseys = '-';
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${stage + 1}</strong></td>
            <td class="points-cell">${stagePoints}</td>
            <td class="points-cell"><strong>${cumulativePoints}</strong></td>
            <td class="points-cell">${currentRank}${rankDelta}</td>
            <td>${jerseys}</td>
        `;
        
        tbody.appendChild(row);
    }
    
    // Add final classification row if available
    if (window.hasEindstandData) {
        const eindstandPoints = participant.stagePoints[21] || 0;
        const finalTotal = participant.totalPoints;
        const finalRank = participants.findIndex(p => p.name === teamName) + 1;
        
        const row = document.createElement('tr');
        row.style.background = '#ffe4b5';
        row.style.fontWeight = 'bold';
        row.innerHTML = `
            <td><strong>Eind</strong></td>
            <td class="points-cell">${eindstandPoints}</td>
            <td class="points-cell"><strong>${finalTotal}</strong></td>
            <td class="points-cell">${finalRank}</td>
            <td>🏆</td>
        `;
        
        tbody.appendChild(row);
    }
    
    // Apply auto-sizing after extended progress table is populated
    setTimeout(() => {
        const table = document.querySelector('#myTdfExtendedProgressTable')?.closest('table');
        if (table && table.offsetHeight > 0) {
            autoSizeTable(table, { nameColumns: [0], statusColumns: [] });
        }
    }, 100);
}

// ============= JERSEY WINNERS MODAL =============

// Show all daily winners for current stage
function showAllDailyWinners() {
    const lastStageIndex = currentStage - 1;
    if (lastStageIndex < 0) return;
    
    // Get daily winners for the last completed stage
    const dailyRanking = [...participants].sort((a, b) => 
        (b.stagePoints[lastStageIndex] || 0) - (a.stagePoints[lastStageIndex] || 0)
    );
    
    // Find all tied winners
    const maxPoints = dailyRanking[0]?.stagePoints[lastStageIndex] || 0;
    const winners = dailyRanking.filter(p => (p.stagePoints[lastStageIndex] || 0) === maxPoints && maxPoints > 0);
    
    showJerseyWinnersModal(winners, 'blauw-nb.png', '🔵 Blauwe Trui Winnaars', `Etappe ${currentStage}`, 'dagwinnaar');
}

// Show all general classification leaders for current stage
function showAllGeneralLeaders() {
    const lastStageIndex = currentStage - 1;
    if (lastStageIndex < 0) return;
    
    // Calculate cumulative points up to current stage
    const generalRanking = [...participants].map(p => ({
        ...p,
        cumulativePoints: p.stagePoints.slice(0, currentStage).reduce((sum, points) => sum + (points || 0), 0)
    })).sort((a, b) => b.cumulativePoints - a.cumulativePoints);
    
    // Find all tied leaders
    const maxPoints = generalRanking[0]?.cumulativePoints || 0;
    const leaders = generalRanking.filter(p => p.cumulativePoints === maxPoints && maxPoints > 0);
    
    showJerseyWinnersModal(leaders, 'geel-nb.png', '🟡 Gele Trui Dragers', `na Etappe ${currentStage}`, 'klassementsleider');
}

// Generic function to show jersey winners modal
// Global variables for jersey carousel
let currentJerseyIndex = 0;
let jerseyWinners = [];

function showJerseyWinnersModal(winners, jerseyImage, title, subtitle, winnerType) {
    if (!winners || winners.length === 0) return;
    
    // Store winners for carousel navigation
    jerseyWinners = winners;
    currentJerseyIndex = 0;
    
    const modal = document.getElementById('jerseyWinnersModal');
    const content = document.getElementById('jerseyWinnersContent');
    
    // Create carousel-style modal content
    let modalHtml = `
        <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: white; text-shadow: 0 4px 15px rgba(0, 0, 0, 0.7);">${title}</h2>
            <p style="color: rgba(255,255,255,0.8); font-size: 1.1em; text-shadow: 0 2px 10px rgba(0, 0, 0, 0.7);">${subtitle}</p>
            <p style="color: rgba(255,255,255,0.6); font-size: 0.9em; text-shadow: 0 2px 10px rgba(0, 0, 0, 0.7);">${winners.length} ${winnerType}${winners.length > 1 ? 's' : ''}</p>
        </div>
        
        <div class="jersey-carousel-container">
            <!-- Navigation buttons (desktop) -->
            <button class="carousel-nav-btn carousel-prev desktop-nav" onclick="navigateJerseyCarousel(-1)" ${winners.length <= 1 ? 'style="display: none;"' : ''}>
                <span>‹</span>
            </button>
            
            <!-- Jersey display frame -->
            <div class="jersey-carousel-frame">
                <div class="jersey-winner-item podium-overlay-style">
                    <img src="${jerseyImage}" alt="Jersey" class="podium-image jersey-winner-image">
                    <div class="podium-winner-name jersey-winner-name">${winners[0].name}</div>
                </div>
            </div>
            
            <button class="carousel-nav-btn carousel-next desktop-nav" onclick="navigateJerseyCarousel(1)" ${winners.length <= 1 ? 'style="display: none;"' : ''}>
                <span>›</span>
            </button>
            
            <!-- Mobile navigation row -->
            <div class="mobile-nav-row" ${winners.length <= 1 ? 'style="display: none;"' : ''}>
                <button class="carousel-nav-btn carousel-prev mobile-nav" onclick="navigateJerseyCarousel(-1)">
                    <span>‹</span>
                </button>
                <button class="carousel-nav-btn carousel-next mobile-nav" onclick="navigateJerseyCarousel(1)">
                    <span>›</span>
                </button>
            </div>
        </div>
        
        <!-- Position indicator -->
        <div class="carousel-indicator" ${winners.length <= 1 ? 'style="display: none;"' : ''}>
            <span style="color: rgba(255,255,255,0.8); font-size: 1.1em; text-shadow: 0 2px 10px rgba(0, 0, 0, 0.7);">
                1 van ${winners.length}
            </span>
        </div>
    `;
    
    // Add CSS for carousel styling
    modalHtml += `
        <style>
        /* Override white background to match 5-second overlay */
        #jerseyWinnersModal .detail-content {
            background: rgba(0, 0, 0, 0.9) !important;
            color: white !important;
            border: none !important;
        }
        
        #jerseyWinnersModal .close-btn {
            color: white !important;
            background: rgba(255, 255, 255, 0.2) !important;
            border: 2px solid rgba(255, 255, 255, 0.3) !important;
            backdrop-filter: blur(10px);
        }
        
        #jerseyWinnersModal .close-btn:hover {
            background: rgba(255, 255, 255, 0.3) !important;
            border-color: rgba(255, 255, 255, 0.5) !important;
        }
        
        .jersey-carousel-container {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 30px;
            background: rgba(0, 0, 0, 0.9);
            border-radius: 20px;
            padding: 40px;
            position: relative;
        }
        
        .jersey-carousel-frame {
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 350px;
            min-height: 400px;
        }
        
        .jersey-winner-item.podium-overlay-style {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            width: 100%;
            height: 100%;
            padding: 30px;
        }
        
        .jersey-winner-image.podium-image {
            max-width: 80%;
            max-height: 60%;
            object-fit: contain;
            filter: drop-shadow(0 10px 30px rgba(255, 255, 255, 0.3));
            animation: float 3s ease-in-out infinite;
            margin-bottom: 0;
        }
        
        .jersey-winner-name.podium-winner-name {
            color: white;
            font-size: 2.3em;
            font-weight: bold;
            text-shadow: 0 4px 15px rgba(0, 0, 0, 0.7);
            margin-top: 25px;
            text-align: center;
            animation: glow 2s ease-in-out infinite alternate;
            word-wrap: break-word;
            max-width: 300px;
        }
        
        .carousel-nav-btn {
            background: rgba(255, 255, 255, 0.2);
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            width: 60px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
        }
        
        .carousel-nav-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            border-color: rgba(255, 255, 255, 0.5);
            transform: scale(1.1);
        }
        
        .carousel-nav-btn span {
            color: white;
            font-size: 2em;
            font-weight: bold;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.7);
            line-height: 1;
        }
        
        .carousel-indicator {
            text-align: center;
            margin-top: 20px;
        }
        
        /* Floating animation from 5-second overlay */
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
        }
        
        /* Glow animation from 5-second overlay */
        @keyframes glow {
            from { text-shadow: 0 4px 15px rgba(0, 0, 0, 0.7), 0 0 20px rgba(255, 215, 0, 0.3); }
            to { text-shadow: 0 4px 15px rgba(0, 0, 0, 0.7), 0 0 30px rgba(255, 215, 0, 0.6); }
        }
        
        /* Hide mobile navigation on desktop */
        @media (min-width: 769px) {
            .mobile-nav-row {
                display: none;
            }
            .mobile-nav {
                display: none;
            }
        }
        
        /* Mobile adjustments */
        @media (max-width: 768px) {
            .jersey-carousel-container {
                flex-direction: column;
                gap: 20px;
                padding: 20px 10px;
                align-items: center;
            }
            
            .jersey-carousel-frame {
                width: 100%;
                max-width: 300px;
                min-height: 350px;
                order: 1;
            }
            
            /* Hide desktop navigation on mobile */
            .desktop-nav {
                display: none !important;
            }
            
            /* Show mobile navigation */
            .mobile-nav-row {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 40px;
                order: 2;
                width: 100%;
                margin-top: 20px;
            }
            
            .mobile-nav {
                width: 70px;
                height: 70px;
                flex-shrink: 0;
                display: flex !important;
                background: rgba(255, 255, 255, 0.3);
                border: 3px solid rgba(255, 255, 255, 0.5);
            }
            
            .mobile-nav span {
                font-size: 2.2em;
                font-weight: bold;
            }
            
            .jersey-winner-name.podium-winner-name {
                font-size: 1.8em;
                max-width: 260px;
            }
        }
        </style>
    `;
    
    content.innerHTML = modalHtml;
    
    // Store jersey image for navigation
    window.currentJerseyImage = jerseyImage;
    
    // Show modal with same transition as 5-second overlay
    modal.style.display = 'flex';
    modal.style.opacity = '0';
    modal.style.transform = 'scale(0.8)';
    modal.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
    
    // Force reflow and apply transition
    modal.offsetHeight;
    modal.style.opacity = '1';
    modal.style.transform = 'scale(1)';
    
    // Prevent body scroll on mobile when modal is open
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
}

// Navigate through jersey carousel
function navigateJerseyCarousel(direction) {
    if (jerseyWinners.length <= 1) return;
    
    currentJerseyIndex += direction;
    
    // Wrap around
    if (currentJerseyIndex < 0) {
        currentJerseyIndex = jerseyWinners.length - 1;
    } else if (currentJerseyIndex >= jerseyWinners.length) {
        currentJerseyIndex = 0;
    }
    
    // Update the displayed winner
    const jerseyImage = document.querySelector('.jersey-winner-image');
    const jerseyName = document.querySelector('.jersey-winner-name');
    const indicator = document.querySelector('.carousel-indicator span');
    
    if (jerseyImage && jerseyName && indicator) {
        // Fade out
        jerseyImage.style.transition = 'opacity 0.2s ease';
        jerseyName.style.transition = 'opacity 0.2s ease';
        jerseyImage.style.opacity = '0';
        jerseyName.style.opacity = '0';
        
        setTimeout(() => {
            // Update content
            jerseyName.textContent = jerseyWinners[currentJerseyIndex].name;
            indicator.innerHTML = `${currentJerseyIndex + 1} van ${jerseyWinners.length}`;
            
            // Fade in
            jerseyImage.style.opacity = '1';
            jerseyName.style.opacity = '1';
        }, 200);
    }
}

// Close jersey winners modal
function closeJerseyWinnersModal() {
    const modal = document.getElementById('jerseyWinnersModal');
    modal.style.display = 'none';
    
    // Restore body scroll
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
}