// Tour de France Poule 2024 - UI Components

// Table loading functions
function loadParticipantsTable() {
    const tbody = document.getElementById('participantsTable');
    
    if (participants.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #666;">📁 Upload een ploegen bestand om te beginnen</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    participants.sort((a, b) => b.totalPoints - a.totalPoints);
    
    participants.forEach((participant, index) => {
        const row = document.createElement('tr');
        const lastStagePoints = participant.stagePoints[currentStage - 1] || 0;
        
        row.innerHTML = `
            <td><strong>${index + 1}</strong></td>
            <td><span class="clickable" onclick="showParticipantDetail('${participant.name}')">${participant.name}</span></td>
            <td class="points-cell">${participant.totalPoints}</td>
            <td class="points-cell">${participant.dailyWins} 🔵</td>
            <td class="points-cell">${lastStagePoints}</td>
            <td><button class="btn" style="padding: 5px 10px; font-size: 0.8em;" onclick="showParticipantDetail('${participant.name}')">Bekijk Ploeg</button></td>
        `;
        tbody.appendChild(row);
    });
}

function loadRidersTable() {
    const tbody = document.getElementById('ridersTable');
    
    if (allRiders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 40px; color: #666;">📁 Upload eerst een ploegen bestand</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    
    allRiders.forEach((rider, index) => {
        const row = document.createElement('tr');
        const statusClass = rider.status === 'dropped' ? 'rider-dropped' : '';
        
        let stagePointsHtml = '';
        for (let i = 0; i < currentStage; i++) {
            stagePointsHtml += `<td class="points-cell ${statusClass}">${rider.points[i] || 0}</td>`;
        }
        
        row.innerHTML = `
            <td><strong>${index + 1}</strong></td>
            <td class="${statusClass}">${rider.name}</td>
            <td class="points-cell ${statusClass}"><strong>${rider.totalPoints}</strong></td>
            ${stagePointsHtml}
            <td class="${statusClass}">${rider.status === 'dropped' ? '❌ Uitgevallen' : '✅ Actief'}</td>
        `;
        tbody.appendChild(row);
    });
}

function loadMatrixTable() {
    const thead = document.getElementById('matrixHeader');
    const tbody = document.getElementById('matrixTable');
    
    if (participants.length === 0) {
        thead.innerHTML = '<tr><th colspan="4">Geen data</th></tr>';
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px; color: #666;">📁 Upload eerst een ploegen bestand</td></tr>';
        return;
    }
    
    const riderStats = {};
    
    participants.forEach(participant => {
        participant.team.forEach(rider => {
            if (!riderStats[rider.name]) {
                riderStats[rider.name] = {
                    name: rider.name,
                    status: rider.status,
                    selectedBy: [],
                    totalSelections: 0
                };
            }
            riderStats[rider.name].selectedBy.push(participant.name);
            riderStats[rider.name].totalSelections++;
        });
    });

    const riders = Object.values(riderStats).sort((a, b) => b.totalSelections - a.totalSelections);
    
    let headerHtml = '<tr><th style="writing-mode: initial; text-orientation: initial;">Renner</th><th style="writing-mode: initial; text-orientation: initial;">Status</th><th style="writing-mode: initial; text-orientation: initial;">Totaal</th>';
    participants.forEach(participant => {
        headerHtml += `<th style="writing-mode: vertical-lr; text-orientation: mixed;" title="${participant.name}">${participant.name}</th>`;
    });
    headerHtml += '</tr>';
    thead.innerHTML = headerHtml;
    
    tbody.innerHTML = '';
    
    riders.forEach(rider => {
        const row = document.createElement('tr');
        const statusClass = rider.status === 'dropped' ? 'rider-dropped' : '';
        
        let participantCells = '';
        participants.forEach(participant => {
            const isSelected = rider.selectedBy.includes(participant.name);
            const cellContent = isSelected ? '<span class="rider-selected">●</span>' : '';
            participantCells += `<td>${cellContent}</td>`;
        });
        
        row.innerHTML = `
            <td class="${statusClass}">${rider.name}</td>
            <td class="${statusClass}">${rider.status === 'dropped' ? '❌' : '✅'}</td>
            <td class="points-cell"><strong>${rider.totalSelections}</strong></td>
            ${participantCells}
        `;
        tbody.appendChild(row);
    });
}

function loadDailyPrizesTable() {
    const tbody = document.getElementById('dailyPrizesTable');
    
    if (participants.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #666;">📁 Upload eerst een ploegen bestand</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    participants.sort((a, b) => b.totalPoints - a.totalPoints);
    
    const dailyWinners = [];
    const generalLeaders = [];
    
    for (let stage = 0; stage < currentStage; stage++) {
        // Calculate daily winner
        let maxPoints = 0;
        let winner = null;
        
        participants.forEach(participant => {
            const stagePoints = participant.stagePoints[stage] || 0;
            if (stagePoints > maxPoints) {
                maxPoints = stagePoints;
                winner = participant.name;
            }
        });
        
        dailyWinners[stage] = winner;
        
        // Calculate general classification leader up to this stage
        let leaderPoints = 0;
        let leader = null;
        
        participants.forEach(participant => {
            const totalUpToStage = participant.stagePoints.slice(0, stage + 1).reduce((sum, p) => sum + p, 0);
            if (totalUpToStage > leaderPoints) {
                leaderPoints = totalUpToStage;
                leader = participant.name;
            }
        });
        
        generalLeaders[stage] = leader;
    }
    
    participants.forEach((participant, index) => {
        const row = document.createElement('tr');
        
        let stagePointsHtml = '';
        for (let i = 0; i < currentStage; i++) {
            const points = participant.stagePoints[i] || 0;
            const isWinner = dailyWinners[i] === participant.name && points > 0;
            const isLeader = generalLeaders[i] === participant.name && points > 0;
            
            let displayText = points.toString();
            if (isWinner && isLeader) {
                displayText += ' 🔵🟡';
            } else if (isWinner) {
                displayText += ' 🔵';
            } else if (isLeader) {
                displayText += ' 🟡';
            }
            
            stagePointsHtml += `<td class="points-cell">${displayText}</td>`;
        }
        
        row.innerHTML = `
            <td><strong>${index + 1}</strong></td>
            <td>${participant.name}</td>
            <td class="points-cell"><strong>${participant.totalPoints}</strong></td>
            ${stagePointsHtml}
            <td class="points-cell dagoverwinningen-column">${participant.dailyWins}</td>
        `;
        tbody.appendChild(row);
    });
}

// Podium functions
function updatePodiums() {
    const gettingStarted = document.getElementById('gettingStarted');
    
    if (participants.length === 0) {
        if (gettingStarted) gettingStarted.style.display = 'block';
        
        const podiums = document.querySelectorAll('.podium .podium-places');
        podiums.forEach(podium => {
            podium.innerHTML = '<div style="padding: 40px; color: #666; text-align: center;">📁 Upload data om podiums te zien</div>';
        });
        return;
    }
    
    if (gettingStarted) gettingStarted.style.display = 'none';
    
    const lastStageIndex = currentStage - 1;
    const dailyRanking = [...participants].sort((a, b) => 
        (b.stagePoints[lastStageIndex] || 0) - (a.stagePoints[lastStageIndex] || 0)
    );

    const generalRanking = [...participants].sort((a, b) => b.totalPoints - a.totalPoints);
    const dailyWinsRanking = [...participants].sort((a, b) => b.dailyWins - a.dailyWins);

    updatePodiumContent('daily', dailyRanking, lastStageIndex);
    updatePodiumContent('general', generalRanking, 'total');
    updatePodiumContent('dailywins', dailyWinsRanking, 'wins');
}

function updatePodiumContent(type, ranking, scoreType) {
    let podiumHtml = '';
    
    // Group participants by their scores to handle ties
    const scoreGroups = [];
    let currentScore = null;
    let currentGroup = [];
    
    ranking.forEach(participant => {
        let score;
        if (scoreType === 'total') {
            score = participant.totalPoints;
        } else if (scoreType === 'wins') {
            score = participant.dailyWins;
        } else {
            score = participant.stagePoints[scoreType] || 0;
        }
        
        if (score !== currentScore) {
            if (currentGroup.length > 0) {
                scoreGroups.push({score: currentScore, participants: currentGroup});
            }
            currentScore = score;
            currentGroup = [participant];
        } else {
            currentGroup.push(participant);
        }
    });
    
    if (currentGroup.length > 0) {
        scoreGroups.push({score: currentScore, participants: currentGroup});
    }
    
    // Display top 3 positions (accounting for ties)
    let position = 1;
    let podiumCount = 0;
    
    for (let groupIndex = 0; groupIndex < scoreGroups.length && podiumCount < 3; groupIndex++) {
        const group = scoreGroups[groupIndex];
        
        for (let participantIndex = 0; participantIndex < group.participants.length && podiumCount < 3; participantIndex++) {
            const participant = group.participants[participantIndex];
            let points, subtitle;
            
            if (scoreType === 'total') {
                points = `${participant.totalPoints} punten`;
                subtitle = position === 1 ? '🥇 Gele Trui!' : (position === 2 ? '🥈 Tweede plaats' : '🥉 Derde plaats');
            } else if (scoreType === 'wins') {
                points = `${participant.dailyWins} dagoverwinning${participant.dailyWins !== 1 ? 'en' : ''}`;
                subtitle = position === 1 ? '🥇 Dagkoning!' : (position === 2 ? '🥈 Tweede plaats' : '🥉 Derde plaats');
            } else {
                points = `${participant.stagePoints[scoreType] || 0} punten`;
                subtitle = position === 1 ? '🥇 Dagwinnaar!' : (position === 2 ? '🥈 Tweede plaats' : '🥉 Derde plaats');
            }

            // If there are ties, show shared position
            let displayPosition = position;
            if (group.participants.length > 1) {
                subtitle = `${subtitle} (gedeeld)`;
            }

            const positionClass = position === 1 ? 'first' : (position === 2 ? 'second' : 'third');
            
            podiumHtml += `
                <div class="podium-place ${positionClass}">
                    <div class="podium-number">${displayPosition}</div>
                    <div class="podium-name">${participant.name}</div>
                    <div class="podium-points">${points}</div>
                    <div style="font-size: 0.8em; margin-top: 5px;">${subtitle}</div>
                </div>
            `;
            
            podiumCount++;
        }
        
        // Update position based on how many participants were in this score group
        position += group.participants.length;
    }
    
    const podiums = document.querySelectorAll('.podium .podium-places');
    let podiumIndex;
    if (type === 'daily') podiumIndex = 0;
    else if (type === 'general') podiumIndex = 1;
    else if (type === 'dailywins') podiumIndex = 2;
    
    if (podiums[podiumIndex]) {
        podiums[podiumIndex].innerHTML = podiumHtml;
    }
}

// Detail view functions
function showParticipantDetail(participantName) {
    const participant = participants.find(p => p.name === participantName);
    if (!participant) return;
    
    let teamHtml = `
        <h2>🚴‍♂️ Ploeg van ${participantName}</h2>
        <p><strong>Totaal: ${participant.totalPoints} punten | Dagoverwinningen: ${participant.dailyWins}</strong></p>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Renner</th>
                        <th>Team</th>
                        <th>Totaal</th>`;
    
    for (let i = 1; i <= currentStage; i++) {
        teamHtml += `<th>Et ${i}</th>`;
    }
    
    teamHtml += `<th>Status</th></tr></thead><tbody>`;
    
    participant.team.forEach(rider => {
        const statusClass = rider.status === 'dropped' ? 'rider-dropped' : '';
        const totalPoints = rider.points.slice(0, currentStage).reduce((sum, points) => sum + points, 0);
        
        let stagePointsHtml = '';
        for (let i = 0; i < currentStage; i++) {
            stagePointsHtml += `<td class="points-cell ${statusClass}">${rider.points[i] || 0}</td>`;
        }
        
        teamHtml += `
            <tr>
                <td class="${statusClass}">${rider.name}</td>
                <td class="${statusClass}">${rider.team || '-'}</td>
                <td class="points-cell ${statusClass}"><strong>${totalPoints}</strong></td>
                ${stagePointsHtml}
                <td class="${statusClass}">${rider.status === 'dropped' ? '❌ Uitgevallen' : '✅ Actief'}</td>
            </tr>
        `;
    });
    
    teamHtml += '</tbody></table></div>';
    
    document.getElementById('detailContent').innerHTML = teamHtml;
    document.getElementById('detailView').style.display = 'flex';
}

function closeDetailView() {
    document.getElementById('detailView').style.display = 'none';
}

// Excel View Functions
function showExcelTab(tabName) {
    // Remove active class from all tab buttons
    document.querySelectorAll('.excel-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Remove active class from all tab contents
    document.querySelectorAll('.excel-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Add active class to clicked button and corresponding content
    event.target.classList.add('active');
    document.getElementById(`excel-${tabName}`).classList.add('active');
    
    // Load appropriate Excel view
    if (tabName === 'hoofdprijs') {
        loadHoofdprijsExcelView();
    } else if (tabName === 'matrix') {
        loadMatrixExcelView();
    }
}

function loadHoofdprijsExcelView() {
    const container = document.getElementById('hoofdprijsGrid');
    
    if (participants.length === 0) {
        container.innerHTML = '<div style="padding: 40px; text-align: center; color: #666;">Upload eerst Excel data om de hoofdprijs weergave te zien</div>';
        return;
    }
    
    // Sort participants by total points for ranking
    const sortedParticipants = [...participants].sort((a, b) => b.totalPoints - a.totalPoints);
    
    // Calculate daily winners and general classification leaders for each stage
    const dailyWinners = [];
    const generalLeaders = [];
    
    for (let stage = 0; stage < currentStage; stage++) {
        // Daily winners (can be multiple with same score)
        let maxStagePoints = Math.max(...participants.map(p => p.stagePoints[stage] || 0));
        dailyWinners[stage] = participants.filter(p => (p.stagePoints[stage] || 0) === maxStagePoints && maxStagePoints > 0);
        
        // General classification leaders up to this stage (can be multiple with same total)
        let maxTotalPoints = 0;
        participants.forEach(p => {
            const totalUpToStage = p.stagePoints.slice(0, stage + 1).reduce((sum, pts) => sum + pts, 0);
            if (totalUpToStage > maxTotalPoints) {
                maxTotalPoints = totalUpToStage;
            }
        });
        
        generalLeaders[stage] = participants.filter(p => {
            const totalUpToStage = p.stagePoints.slice(0, stage + 1).reduce((sum, pts) => sum + pts, 0);
            return totalUpToStage === maxTotalPoints && maxTotalPoints > 0;
        });
    }
    
    // Create Excel-like table structure
    let html = '<table style="border-collapse: collapse; width: 100%; font-size: 9px;">';
    
    // Header row 1: Stage numbers
    html += '<tr>';
    html += '<td class="excel-cell excel-header-cell" rowspan="2" style="min-width: 30px;">Rang</td>';
    html += '<td class="excel-cell excel-header-cell" rowspan="2" style="min-width: 120px;">Deelnemer</td>';
    
    // Stage headers (3 columns per stage)
    for (let stage = 1; stage <= currentStage; stage++) {
        html += `<td class="excel-cell excel-header-cell" colspan="3" style="font-size: 8px;">Etappe ${stage}</td>`;
    }
    
    // Total columns
    html += '<td class="excel-cell excel-header-cell" rowspan="2" style="min-width: 40px;">Totaal</td>';
    html += '<td class="excel-cell excel-header-cell" rowspan="2" style="min-width: 40px;">Rang</td>';
    html += '<td class="excel-cell excel-header-cell" rowspan="2" style="min-width: 30px;">🔵</td>';
    html += '<td class="excel-cell excel-header-cell" rowspan="2" style="min-width: 30px;">🟡</td>';
    html += '</tr>';
    
    // Header row 2: Column types (Punten, Blauw, Geel)
    html += '<tr>';
    for (let stage = 1; stage <= currentStage; stage++) {
        html += '<td class="excel-cell excel-header-cell" style="font-size: 7px;">Pnt</td>';
        html += '<td class="excel-cell excel-header-cell excel-jersey-blauw" style="font-size: 7px;">🔵</td>';
        html += '<td class="excel-cell excel-header-cell excel-jersey-geel" style="font-size: 7px;">🟡</td>';
    }
    html += '</tr>';
    
    // Participant rows
    sortedParticipants.forEach((participant, index) => {
        html += '<tr class="excel-rider-row">';
        
        // Ranking and name
        html += `<td class="excel-cell">${index + 1}</td>`;
        html += `<td class="excel-cell excel-name-cell">${participant.name}</td>`;
        
        // Stage data (3 columns per stage)
        let totalBlueJerseys = 0;
        let totalYellowJerseys = 0;
        
        for (let stage = 0; stage < currentStage; stage++) {
            const stagePoints = participant.stagePoints[stage] || 0;
            
            // Points column
            html += `<td class="excel-cell excel-points-cell">${stagePoints}</td>`;
            
            // Blue jersey column (daily winner)
            const isDailyWinner = dailyWinners[stage] && dailyWinners[stage].some(p => p.name === participant.name);
            if (isDailyWinner) {
                html += '<td class="excel-cell excel-jersey-blauw">🔵</td>';
                totalBlueJerseys++;
            } else {
                html += '<td class="excel-cell"></td>';
            }
            
            // Yellow jersey column (general classification leader)
            const isGeneralLeader = generalLeaders[stage] && generalLeaders[stage].some(p => p.name === participant.name);
            if (isGeneralLeader) {
                html += '<td class="excel-cell excel-jersey-geel">🟡</td>';
                totalYellowJerseys++;
            } else {
                html += '<td class="excel-cell"></td>';
            }
        }
        
        // Total columns
        html += `<td class="excel-cell excel-points-cell"><strong>${participant.totalPoints}</strong></td>`;
        html += `<td class="excel-cell"><strong>${index + 1}</strong></td>`;
        html += `<td class="excel-cell excel-jersey-blauw">${totalBlueJerseys}</td>`;
        html += `<td class="excel-cell excel-jersey-geel">${totalYellowJerseys}</td>`;
        
        html += '</tr>';
    });
    
    html += '</table>';
    container.innerHTML = html;
}

function loadMatrixExcelView() {
    const container = document.getElementById('matrixGrid');
    
    if (participants.length === 0) {
        container.innerHTML = '<div style="padding: 40px; text-align: center; color: #666;">Upload eerst Excel data om de matrix weergave te zien</div>';
        return;
    }
    
    // Create rider statistics
    const riderStats = {};
    participants.forEach(participant => {
        participant.team.forEach(rider => {
            if (!riderStats[rider.name]) {
                riderStats[rider.name] = {
                    name: rider.name,
                    selectedBy: [],
                    totalSelections: 0
                };
            }
            riderStats[rider.name].selectedBy.push(participant.name);
            riderStats[rider.name].totalSelections++;
        });
    });
    
    const riders = Object.values(riderStats).sort((a, b) => b.totalSelections - a.totalSelections);
    
    // Create Excel-like table
    let html = '<table style="border-collapse: collapse; width: 100%; font-size: 10px;">';
    
    // Header row
    html += '<tr>';
    html += '<td class="excel-cell excel-header-cell excel-name-cell">Renner</td>';
    html += '<td class="excel-cell excel-header-cell" style="min-width: 40px;">Totaal</td>';
    
    participants.forEach(participant => {
        html += `<td class="excel-cell excel-header-cell" style="min-width: 25px; font-size: 8px; writing-mode: vertical-lr; text-orientation: mixed;" title="${participant.name}">${participant.name}</td>`;
    });
    
    html += '</tr>';
    
    // Rider rows
    riders.forEach(rider => {
        html += '<tr class="excel-rider-row">';
        html += `<td class="excel-cell excel-name-cell">${rider.name}</td>`;
        html += `<td class="excel-cell excel-points-cell">${rider.totalSelections}</td>`;
        
        participants.forEach(participant => {
            const isSelected = rider.selectedBy.includes(participant.name);
            if (isSelected) {
                html += '<td class="excel-cell excel-selected-cell">●</td>';
            } else {
                html += '<td class="excel-cell" style="background: #f5f5f5;"></td>';
            }
        });
        
        html += '</tr>';
    });
    
    html += '</table>';
    container.innerHTML = html;
}