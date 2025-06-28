// Tour de France Poule 2024 - Main Application
// Global variables
let participants = [];
let allRiders = [];
let currentStage = 1;

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
        case 'excel-view':
            loadHoofdprijsExcelView();
            loadMatrixExcelView();
            break;
        case 'upload':
            // Upload tab - no special loading needed
            break;
    }
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
                        points: Array(21).fill(0), // 21 stages max
                        status: "active"
                    });
                }
            }
            
            participants.push({
                name: deelnemer.Naam,
                totalPoints: 0,
                dailyWins: 0,
                stagePoints: Array(21).fill(0),
                team: team
            });
        });
        
        createAllRidersArray();
        loadParticipantsTable();
        updatePodiums();
        
        console.log(`✅ Processed ${participants.length} participants`);
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
    updatePodiums();
    updateTableHeaders();
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
                stageTotal += rider.points[stageIndex] || 0;
            });
            participant.stagePoints[stageIndex] = stageTotal;
        }
        
        participant.totalPoints = participant.stagePoints.slice(0, currentStage).reduce((sum, p) => sum + p, 0);
    });
    
    calculateAllDailyWins();
    createAllRidersArray();
    participants.sort((a, b) => b.totalPoints - a.totalPoints);
}

function calculateAllDailyWins() {
    participants.forEach(p => p.dailyWins = 0);
    
    for (let stage = 0; stage < currentStage; stage++) {
        let maxPoints = 0;
        let winner = null;
        
        participants.forEach(participant => {
            const stagePoints = participant.stagePoints[stage] || 0;
            if (stagePoints > maxPoints) {
                maxPoints = stagePoints;
                winner = participant;
            }
        });
        
        if (winner && maxPoints > 0) {
            winner.dailyWins++;
        }
    }
}

function createAllRidersArray() {
    const riderStats = {};
    
    participants.forEach(participant => {
        participant.team.forEach(rider => {
            if (!riderStats[rider.name]) {
                riderStats[rider.name] = {
                    name: rider.name,
                    team: rider.team,
                    points: Array(currentStage).fill(0),
                    status: rider.status,
                    totalPoints: 0
                };
            }
            
            rider.points.slice(0, currentStage).forEach((points, stageIndex) => {
                riderStats[rider.name].points[stageIndex] += points;
            });
            
            if (rider.status === 'dropped') {
                riderStats[rider.name].status = 'dropped';
            }
        });
    });
    
    allRiders = Object.values(riderStats).map(rider => {
        rider.totalPoints = rider.points.reduce((sum, p) => sum + p, 0);
        return rider;
    });
    
    allRiders.sort((a, b) => b.totalPoints - a.totalPoints);
}

function updateTableHeaders() {
    // Update riders table header
    let ridersHeaderHtml = '<th>Pos</th><th>Renner</th><th>Totaal</th>';
    for (let i = 1; i <= currentStage; i++) {
        ridersHeaderHtml += `<th>Et ${i}</th>`;
    }
    ridersHeaderHtml += '<th>Status</th>';
    document.getElementById('ridersTableHeader').innerHTML = ridersHeaderHtml;
    
    // Update daily prizes header
    let dailyPrizesHeaderHtml = '<th>Rang</th><th>Deelnemer</th><th>Totaal</th>';
    for (let i = 1; i <= currentStage; i++) {
        dailyPrizesHeaderHtml += `<th>Etappe ${i}</th>`;
    }
    dailyPrizesHeaderHtml += '<th class="dagoverwinningen-column">Dagoverwinningen</th>';
    document.getElementById('dailyPrizesHeader').innerHTML = dailyPrizesHeaderHtml;
}

// Utility functions
function exportData() {
    const data = {
        participants: participants,
        allRiders: allRiders,
        currentStage: currentStage,
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tourploeg-export-stage-${currentStage}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function resetData() {
    if (confirm('Weet je zeker dat je alle data wilt resetten?')) {
        participants = [];
        allRiders = [];
        currentStage = 1;
        
        const gettingStarted = document.getElementById('gettingStarted');
        if (gettingStarted) gettingStarted.style.display = 'block';
        
        document.getElementById('stageInfoContainer').style.display = 'none';
        document.getElementById('todayStorySection').style.display = 'none';
        document.getElementById('tomorrowStorySection').style.display = 'none';
        
        loadParticipantsTable();
        updatePodiums();
        
        alert('✅ Alle data gereset!');
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚴‍♂️ Tour de France App Loading...');
    
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
    
    console.log('✅ App initialized!');
});

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