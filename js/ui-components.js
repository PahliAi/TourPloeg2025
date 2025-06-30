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
        
        // Count yellow jerseys (gele truien) - count stages where this participant was #1
        let yellowJerseys = 0;
        for (let stage = 0; stage < currentStage; stage++) {
            let maxPoints = 0;
            let leader = null;
            participants.forEach(p => {
                const stagePoints = p.stagePoints[stage] || 0;
                if (stagePoints > maxPoints) {
                    maxPoints = stagePoints;
                    leader = p;
                }
            });
            if (leader === participant && maxPoints > 0) {
                yellowJerseys++;
            }
        }
        
        row.innerHTML = `
            <td><strong>${index + 1}</strong></td>
            <td>${participant.name}</td>
            <td class="points-cell">${participant.totalPoints}</td>
            <td class="points-cell">${participant.dailyWins} 🔵</td>
            <td class="points-cell">${yellowJerseys} 🟡</td>
            <td><button class="btn" style="padding: 2px 6px; font-size: 0.7em;" onclick="showParticipantDetail('${participant.name}')">Bekijk</button></td>
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
            if (i < 21) { // Alleen etappes 1-21
                stagePointsHtml += `<td class="points-cell ${statusClass}">${rider.points[i] || 0}</td>`;
            }
        }
        
        // Voeg Eindstand kolom toe als er data is
        if (window.hasEindstandData) {
            const eindstandPoints = rider.points[21] || 0; // Index 21 = etappe 22 (Eindstand)
            stagePointsHtml += `<td class="points-cell ${statusClass}" style="background: #ffe4b5; font-weight: bold;">${eindstandPoints}</td>`;
        }
        
        // Better status indicators
        const statusIcon = rider.status === 'dropped' ? '🔴 Uitgevallen' : '🟢 Actief';
        const rowClass = rider.status === 'dropped' ? 'rider-dropped-row' : '';
        
        row.className = rowClass;
        row.innerHTML = `
            <td><strong>${index + 1}</strong></td>
            <td class="${statusClass}">${rider.name}</td>
            <td class="points-cell ${statusClass}"><strong>${rider.totalPoints}</strong></td>
            ${stagePointsHtml}
            <td class="${statusClass}">${statusIcon}</td>
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
            const cellContent = isSelected ? '🟢' : '';
            participantCells += `<td>${cellContent}</td>`;
        });
        
        // Better status indicators for matrix
        const matrixStatusIcon = rider.status === 'dropped' ? '🔴' : '🟢';
        const matrixRowClass = rider.status === 'dropped' ? 'rider-dropped-row' : '';
        
        row.className = matrixRowClass;
        row.innerHTML = `
            <td class="${statusClass}">${rider.name}</td>
            <td class="${statusClass}">${matrixStatusIcon}</td>
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
        
        // Tel blauwe en gele truien voor deze participant
        let blueJerseys = 0;
        let yellowJerseys = 0;
        
        let stagePointsHtml = '';
        for (let i = 0; i < currentStage; i++) {
            if (i < 21) { // Alleen etappes 1-21
                const points = participant.stagePoints[i] || 0;
                const isWinner = dailyWinners[i] === participant.name && points > 0;
                const isLeader = generalLeaders[i] === participant.name && points > 0;
                
                if (isWinner) blueJerseys++;
                if (isLeader) yellowJerseys++;
                
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
        }
        
        // Voeg Eindstand kolom toe als er data is
        if (window.hasEindstandData) {
            const eindstandPoints = participant.stagePoints[21] || 0; // Index 21 = etappe 22 (Eindstand)
            stagePointsHtml += `<td class="points-cell" style="background: #ffe4b5; font-weight: bold;">${eindstandPoints}</td>`;
        }
        
        // Maak truien tekst
        let truienText = '';
        if (blueJerseys > 0) truienText += `${blueJerseys}🔵`;
        if (yellowJerseys > 0) {
            if (truienText) truienText += ' ';
            truienText += `${yellowJerseys}🟡`;
        }
        if (!truienText) truienText = '0';
        
        row.innerHTML = `
            <td><strong>${index + 1}</strong></td>
            <td>${participant.name}</td>
            <td class="points-cell"><strong>${participant.totalPoints}</strong></td>
            ${stagePointsHtml}
            <td class="points-cell dagoverwinningen-column">${truienText}</td>
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
                <td class="${statusClass}">${rider.status === 'dropped' ? '🔴 Uitgevallen' : '🟢 Actief'}</td>
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

// Excel View functies verwijderd