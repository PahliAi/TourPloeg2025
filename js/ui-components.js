// Tour de France Poule 2024 - UI Components

// Table loading functions
function loadParticipantsTable() {
    // Functie is uitgeschakeld - Deelnemers Score tabel wordt niet meer gebruikt
    // De tabel is vervangen door Classement général die meer detail bevat
    return;
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

function loadRankingTable() {
    const tbody = document.getElementById('rankingTable');
    
    if (participants.length === 0 || currentStage === 1) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 40px; color: #666;">📁 Rankings zijn beschikbaar na etappe 2</td></tr>';
        return;
    }
    
    const rankingProgression = getRankingChanges();
    tbody.innerHTML = '';
    
    // Update table header dynamically based on current stage
    const thead = document.getElementById('rankingTableHeader');
    let headerHtml = `
        <tr>
            <th>Deelnemer</th>
            <th style="background: #ffe4b5;">Et 1</th>`;
    
    // Add relative change columns for stages 2 onwards
    for (let stage = 2; stage <= currentStage; stage++) {
        headerHtml += `<th>Et ${stage}</th>`;
    }
    
    // Add current ranking column if we have more than 1 stage
    if (currentStage > 1) {
        headerHtml += `<th style="background: #e8f4fd; font-weight: bold;">Huidig</th>`;
    }
    
    headerHtml += '</tr>';
    thead.innerHTML = headerHtml;
    
    // Build table rows
    rankingProgression.forEach(participant => {
        const row = document.createElement('tr');
        
        let cellsHtml = `<td><strong>${participant.name}</strong></td>`;
        
        participant.stages.forEach((stageData, index) => {
            if (index === 0) {
                // First stage - show position number
                cellsHtml += `<td class="points-cell" style="background: #ffe4b5;"><strong>${stageData.position}</strong></td>`;
            } else {
                // Subsequent stages - show relative change
                let changeText = '';
                let changeClass = '';
                
                if (stageData.positionChange < 0) {
                    // Moved up (negative change - better position)
                    changeText = `${stageData.positionChange}`;
                    changeClass = 'ranking-up';
                } else if (stageData.positionChange > 0) {
                    // Moved down (positive change - worse position)
                    changeText = `+${stageData.positionChange}`;
                    changeClass = 'ranking-down';
                } else {
                    // No change
                    changeText = '0';
                    changeClass = 'ranking-same';
                }
                
                cellsHtml += `<td class="points-cell ${changeClass}" title="Positie ${stageData.position} (${changeText})">${changeText}</td>`;
            }
        });
        
        // Add current ranking column
        if (currentStage > 1) {
            cellsHtml += `<td class="points-cell" style="background: #e8f4fd; font-weight: bold;"><strong>${participant.currentRanking}</strong></td>`;
        }
        
        row.innerHTML = cellsHtml;
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
        
        // Bereken totaal van alle etappes (exclusief eindstand)
        const totalEtappes = participant.stagePoints.slice(0, 21).reduce((sum, p) => sum + (p || 0), 0);
        
        // Voeg kolom voor totaal etappes toe
        stagePointsHtml += `<td class="points-cell" style="background: #e8f4fd; font-weight: bold;">${totalEtappes}</td>`;
        
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
        
        // Voeg totaal kolom alleen toe als er eindstand data is
        let totalColumnHtml = '';
        if (window.hasEindstandData) {
            totalColumnHtml = `<td class="points-cell"><strong>${participant.totalPoints}</strong></td>`;
        }
        
        row.innerHTML = `
            <td><strong>${index + 1}</strong></td>
            <td>${participant.name}</td>
            ${stagePointsHtml}
            ${totalColumnHtml}
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
    
    // Update overview block
    updateOverviewBlock(dailyRanking, generalRanking, dailyWinsRanking, lastStageIndex);
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
    let positionCount = 0;
    
    for (let groupIndex = 0; groupIndex < scoreGroups.length && positionCount < 3; groupIndex++) {
        const group = scoreGroups[groupIndex];
        
        // Create ONE shared podium place for all tied participants
        let points, subtitle;
        const firstParticipant = group.participants[0];
        
        if (scoreType === 'total') {
            points = `${firstParticipant.totalPoints} punten`;
            subtitle = position === 1 ? '🥇 Gele Trui!' : (position === 2 ? '🥈 Tweede plaats' : '🥉 Derde plaats');
        } else if (scoreType === 'wins') {
            points = `${firstParticipant.dailyWins} dagoverwinning${firstParticipant.dailyWins !== 1 ? 'en' : ''}`;
            subtitle = position === 1 ? '🥇 Dagkoning!' : (position === 2 ? '🥈 Tweede plaats' : '🥉 Derde plaats');
        } else {
            points = `${firstParticipant.stagePoints[scoreType] || 0} punten`;
            subtitle = position === 1 ? '🥇 Dagwinnaar!' : (position === 2 ? '🥈 Tweede plaats' : '🥉 Derde plaats');
        }

        // If there are ties, show shared position
        if (group.participants.length > 1) {
            subtitle = `${subtitle} (gedeeld)`;
        }

        const positionClass = position === 1 ? 'first' : (position === 2 ? 'second' : 'third');
        
        // Create names list with line breaks (max 3 names)
        const limitedParticipants = group.participants.slice(0, 3);
        const namesHtml = limitedParticipants.map(p => p.name).join('<br>');
        
        podiumHtml += `
            <div class="podium-place ${positionClass}">
                <div class="podium-number">${position}</div>
                <div class="podium-name">${namesHtml}</div>
                <div class="podium-points">${points}</div>
                <div style="font-size: 0.8em; margin-top: 5px;">${subtitle}</div>
            </div>
        `;
        
        // Update position based on how many participants were in this score group (Dutch/European style)
        position += group.participants.length;
        positionCount++;
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
            <div class="table-scroll">
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
    
    teamHtml += '</tbody></table></div></div>';
    
    document.getElementById('detailContent').innerHTML = teamHtml;
    
    // Mobile-friendly modal opening
    const detailView = document.getElementById('detailView');
    detailView.style.display = 'flex';
    
    // Prevent body scroll on mobile when modal is open
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    
    // Scroll to top of modal content on mobile
    setTimeout(() => {
        const detailContent = document.querySelector('.detail-content');
        if (detailContent) {
            detailContent.scrollTop = 0;
        }
        // Also scroll the main modal container to top
        detailView.scrollTop = 0;
    }, 100);
}

function closeDetailView() {
    document.getElementById('detailView').style.display = 'none';
    
    // Restore body scroll
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
}

function getTopScorers(ranking, scoreType, stageIndex = null) {
    if (ranking.length === 0) return [];
    
    // Use same logic as podiums - group by score and show 1st place winners only
    const scoreGroups = [];
    let currentScore = null;
    let currentGroup = [];
    
    ranking.forEach(participant => {
        let score;
        if (scoreType === 'total') {
            score = participant.totalPoints;
        } else if (scoreType === 'wins') {
            score = participant.dailyWins;
        } else if (scoreType === 'stage') {
            score = participant.stagePoints[stageIndex] || 0;
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
    
    // Return 1st place participants (all tied for 1st), limited to max 3
    if (scoreGroups.length > 0) {
        return scoreGroups[0].participants.slice(0, 3);
    }
    
    return [];
}

function updateOverviewBlock(dailyRanking, generalRanking, dailyWinsRanking, lastStageIndex) {
    // Update title with current stage
    const stageLabel = currentStage === 22 ? 'Eindstand' : `Etappe ${currentStage}`;
    document.getElementById('overviewTitle').textContent = `📊 Overzicht - ${stageLabel}`;
    
    // Get all tied winners for each category
    const dailyWinners = getTopScorers(dailyRanking, 'stage', lastStageIndex);
    const generalLeaders = getTopScorers(generalRanking, 'total');
    const dailyWinsLeaders = getTopScorers(dailyWinsRanking, 'wins');
    
    // Update daily winners (blue jersey)
    const dailyNamesHtml = dailyWinners.map(p => p.name).join('<br>');
    document.getElementById('overviewDailyWinner').innerHTML = dailyNamesHtml || '-';
    const dailyPoints = dailyWinners.length > 0 ? (dailyWinners[0].stagePoints[lastStageIndex] || 0) : 0;
    document.getElementById('overviewDailyStats').textContent = `${dailyPoints} punten`;
    
    // Update general leaders (yellow jersey)
    const generalNamesHtml = generalLeaders.map(p => p.name).join('<br>');
    document.getElementById('overviewGeneralWinner').innerHTML = generalNamesHtml || '-';
    const totalPoints = generalLeaders.length > 0 ? generalLeaders[0].totalPoints : 0;
    document.getElementById('overviewGeneralStats').textContent = `${totalPoints} punten totaal`;
    
    // Update most daily wins (milka bar)
    const dailyWinsNamesHtml = dailyWinsLeaders.map(p => p.name).join('<br>');
    document.getElementById('overviewDailyWinsWinner').innerHTML = dailyWinsNamesHtml || '-';
    const dailyWins = dailyWinsLeaders.length > 0 ? dailyWinsLeaders[0].dailyWins : 0;
    document.getElementById('overviewDailyWinsStats').textContent = `${dailyWins} dagoverwinning${dailyWins !== 1 ? 'en' : ''}`;
    
    // No need for separate stage winners - the 4th jersey is biggest improver, not stage winner
    
    // Calculate biggest daily improvement (green arrow) - could also have multiple tied improvers
    const biggestImprover = calculateBiggestImprovement();
    const improverElement = document.getElementById('biggestImproverName');
    const improverStatsElement = document.getElementById('overviewImproverStats');
    
    if (biggestImprover) {
        improverElement.innerHTML = biggestImprover.name; // Already contains line breaks from calculateBiggestImprovement
        const improvementText = biggestImprover.improvement > 0 ? 
            `Gestegen ${biggestImprover.improvement} positie${biggestImprover.improvement !== 1 ? 's' : ''}` :
            'Geen stijging';
        improverStatsElement.textContent = improvementText;
    } else {
        improverElement.textContent = '-';
        improverStatsElement.textContent = 'Geen data';
    }
}

function calculateBiggestImprovement() {
    if (!participants || participants.length === 0 || currentStage < 2) {
        return null;
    }
    
    // Use the EXISTING ranking data instead of recalculating!
    const rankingData = getRankingChanges();
    
    let biggestImprovement = 0;
    let improvers = [];
    
    // Find ALL participants with the biggest improvement
    rankingData.forEach(participant => {
        const latestStage = participant.stages[participant.stages.length - 1];
        if (latestStage && latestStage.positionChange !== undefined) {
            const improvement = -latestStage.positionChange; // Convert to positive for "moved up"
            if (improvement > biggestImprovement) {
                biggestImprovement = improvement;
                improvers = [participant.name];
            } else if (improvement === biggestImprovement && improvement > 0) {
                improvers.push(participant.name);
            }
        }
    });
    
    if (biggestImprovement > 0) {
        const limitedImprovers = improvers.slice(0, 3); // Max 3 names
        const improverNames = limitedImprovers.join('<br>');
        return { name: improverNames, improvement: biggestImprovement };
    }
    
    return null;
}

// Excel View functies verwijderd