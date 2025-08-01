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
    
    // Calculate tied rankings for riders based on points
    const riderScoreFunction = (rider) => {
        // If final classification data exists and rider has actual race position, use that for sorting
        if (window.hasEindstandData && window.racePositions && window.racePositions[rider.name]) {
            // For final positions, lower number = better, so we negate to make it work with our descending sort
            return 1000 - window.racePositions[rider.name];
        }
        // Otherwise use total points (higher = better)
        return rider.totalPoints || 0;
    };
    
    const riderRankings = calculateTiedRankings(allRiders, riderScoreFunction);
    
    riderRankings.forEach((rankingEntry) => {
        const rider = rankingEntry.item;
        const position = rankingEntry.rank;
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
        
        const displayPosition = position;
        
        row.className = rowClass;
        row.innerHTML = `
            <td><strong>${displayPosition}</strong></td>
            <td class="${statusClass}">${rider.name}</td>
            <td class="points-cell ${statusClass}"><strong>${rider.totalPoints}</strong></td>
            ${stagePointsHtml}
            <td class="${statusClass}">${statusIcon}</td>
        `;
        tbody.appendChild(row);
    });
    
    // Apply auto-sizing after riders table is populated - multiple attempts for reliability
    [50, 150, 300].forEach(delay => {
        setTimeout(() => {
            const table = document.querySelector('#ridersTable')?.closest('table');
            if (table && table.offsetHeight > 0) {
                autoSizeTable(table, { nameColumns: [0, 1], statusColumns: 'auto' }); // Position(0) + Renner(1) both sticky
            }
        }, delay);
    });
}

function loadMatrixTable() {
    // First, ensure the matrix container has the proper structure
    const matrixContainer = document.querySelector('.matrix-container');
    if (matrixContainer && !matrixContainer.querySelector('.matrix-scroll')) {
        matrixContainer.innerHTML = `
            <div class="matrix-scroll">
                <table class="matrix-table">
                    <thead id="matrixHeader">
                        <!-- Filled by JavaScript -->
                    </thead>
                    <tbody id="matrixTable">
                        <!-- Filled by JavaScript -->
                    </tbody>
                </table>
            </div>
        `;
    }
    
    const thead = document.getElementById('matrixHeader');
    const tbody = document.getElementById('matrixTable');
    
    // Update participant selector dropdown
    updateParticipantSelector();
    
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
    
    // Apply auto-sizing after matrix table is populated - multiple attempts for reliability
    [50, 150, 300].forEach(delay => {
        setTimeout(() => {
            const table = document.querySelector('#matrixTable')?.closest('table');
            if (table && table.offsetHeight > 0) {
                autoSizeTable(table, { nameColumns: [0], statusColumns: [1] }); // Renner name is column 0, Status is column 1
            }
        }, delay);
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
    
    // Count risers, droppers, and same-position participants from latest stage data
    let risers = 0, droppers = 0, same = 0;
    if (rankingProgression.length > 0 && currentStage > 1) {
        rankingProgression.forEach(participant => {
            const latestStage = participant.stages[participant.stages.length - 1];
            if (latestStage.positionChange < 0) {
                risers++; // Negative change = moved up (better position)
            } else if (latestStage.positionChange > 0) {
                droppers++; // Positive change = moved down (worse position)
            } else {
                same++; // No change
            }
        });
    }
    
    // Update dynamic legend
    updateRankingLegenda(risers, droppers, same);
    
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
                    changeText = `▲${Math.abs(stageData.positionChange)}`;
                    changeClass = 'ranking-up';
                } else if (stageData.positionChange > 0) {
                    // Moved down (positive change - worse position)
                    changeText = `▼${stageData.positionChange}`;
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
    
    // Apply auto-sizing after ranking table is populated - multiple attempts for reliability
    [50, 150, 300].forEach(delay => {
        setTimeout(() => {
            const table = document.querySelector('#rankingTable')?.closest('table');
            if (table && table.offsetHeight > 0) {
                autoSizeTable(table, { nameColumns: [0], pointColumns: [] }); // Deelnemer name is column 0, no specific point columns
            }
        }, delay);
    });
}

function loadDailyPrizesTable() {
    const tbody = document.getElementById('dailyPrizesTable');
    
    if (participants.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #666;">📁 Upload eerst een ploegen bestand</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    
    // Calculate tied rankings for participants based on total points
    const participantRankings = calculateTiedRankings(participants, (p) => p.totalPoints);
    
    const dailyWinners = [];
    const generalLeaders = [];
    
    for (let stage = 0; stage < currentStage; stage++) {
        // Calculate daily winners (all tied winners)
        let maxPoints = 0;
        let winners = [];
        
        participants.forEach(participant => {
            const stagePoints = participant.stagePoints[stage] || 0;
            if (stagePoints > maxPoints) {
                maxPoints = stagePoints;
                winners = [participant.name];
            } else if (stagePoints === maxPoints && stagePoints > 0) {
                winners.push(participant.name);
            }
        });
        
        dailyWinners[stage] = winners;
        
        // Calculate general classification leaders (all tied leaders)
        let maxLeaderPoints = 0;
        let leaders = [];
        
        participants.forEach(participant => {
            const totalUpToStage = participant.stagePoints.slice(0, stage + 1).reduce((sum, p) => sum + p, 0);
            if (totalUpToStage > maxLeaderPoints) {
                maxLeaderPoints = totalUpToStage;
                leaders = [participant.name];
            } else if (totalUpToStage === maxLeaderPoints && totalUpToStage > 0) {
                leaders.push(participant.name);
            }
        });
        
        generalLeaders[stage] = leaders;
    }
    
    participantRankings.forEach((rankingEntry) => {
        const participant = rankingEntry.item;
        const position = rankingEntry.rank;
        const row = document.createElement('tr');
        
        // Tel blauwe en gele truien voor deze participant
        let blueJerseys = 0;
        let yellowJerseys = 0;
        
        let stagePointsHtml = '';
        for (let i = 0; i < currentStage; i++) {
            if (i < 21) { // Alleen etappes 1-21
                const points = participant.stagePoints[i] || 0;
                const isWinner = dailyWinners[i] && dailyWinners[i].includes(participant.name) && points > 0;
                const isLeader = generalLeaders[i] && generalLeaders[i].includes(participant.name) && points > 0;
                
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
        
        // Voeg totaal kolom alleen toe als er eindstand data is
        let totalColumnHtml = '';
        if (window.hasEindstandData) {
            totalColumnHtml = `<td class="points-cell"><strong>${participant.totalPoints}</strong></td>`;
        }
        
        row.innerHTML = `
            <td><strong>${position}</strong></td>
            <td>${participant.name}</td>
            ${stagePointsHtml}
            ${totalColumnHtml}
            <td class="points-cell">${blueJerseys}</td>
            <td class="points-cell">${yellowJerseys}</td>
        `;
        tbody.appendChild(row);
    });
    
    // Skip auto-sizing for daily prizes table to prevent card expansion - use simple scroll approach
    setTimeout(() => {
        const table = document.querySelector('#dailyPrizesTable')?.closest('table');
        const tableContainer = table?.closest('.table-container');
        const card = table?.closest('.card');
        
        if (table && tableContainer && card) {
            // Force the card to stay within normal width
            card.style.setProperty('width', 'auto', 'important');
            card.style.setProperty('max-width', '100%', 'important');
            card.classList.remove('auto-sized-card'); // Remove any auto-sizing class
            
            // Enable horizontal scrolling in the table container
            tableContainer.style.setProperty('overflow-x', 'auto', 'important');
            tableContainer.style.setProperty('width', '100%', 'important');
            
            // Let table size naturally but ensure it can scroll
            table.style.setProperty('width', 'max-content', 'important');
            table.style.setProperty('min-width', '100%', 'important');
            
            console.log('🔧 Daily prizes table: disabled auto-sizing, enabled horizontal scroll');
        }
    }, 200);
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
    
    // Only show podium positions that actually exist (1st, 2nd, 3rd)
    // If everyone is tied for 1st, only show 1st place
    // If 1st and 2nd are tied, only show 1st and 3rd places, etc.
    let position = 1;
    
    for (let groupIndex = 0; groupIndex < scoreGroups.length && position <= 3; groupIndex++) {
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
        
        // Determine max participants and create names list
        let maxParticipants, limitedParticipants, namesHtml, isClickable = false;
        
        if (position === 1) {
            // Gold: show all tied participants (no limit)
            limitedParticipants = group.participants;
            namesHtml = limitedParticipants.map(p => p.name).join('<br>');
        } else if (position === 2) {
            // Silver: show max 6, make clickable if more
            maxParticipants = 6;
            limitedParticipants = group.participants.slice(0, maxParticipants);
            if (group.participants.length > maxParticipants) {
                namesHtml = `${limitedParticipants.map(p => p.name).join('<br>')}<br><span style="color: #007bff; text-decoration: underline; cursor: pointer;">+${group.participants.length - maxParticipants} meer...</span>`;
                isClickable = true;
            } else {
                namesHtml = limitedParticipants.map(p => p.name).join('<br>');
            }
        } else {
            // Bronze: show max 3, make clickable if more
            maxParticipants = 3;
            limitedParticipants = group.participants.slice(0, maxParticipants);
            if (group.participants.length > maxParticipants) {
                namesHtml = `${limitedParticipants.map(p => p.name).join('<br>')}<br><span style="color: #007bff; text-decoration: underline; cursor: pointer;">+${group.participants.length - maxParticipants} meer...</span>`;
                isClickable = true;
            } else {
                namesHtml = limitedParticipants.map(p => p.name).join('<br>');
            }
        }
        
        const clickableClass = isClickable ? 'podium-clickable' : '';
        const clickHandler = isClickable ? `onclick="showPodiumModal('${positionClass}', '${position}', '${scoreType}', '${JSON.stringify(group.participants).replace(/"/g, '&quot;')}', '${points}', '${subtitle.replace(/'/g, '\\\'')}')"` : '';
        
        podiumHtml += `
            <div class="podium-place ${positionClass} ${clickableClass}" ${clickHandler}>
                <div class="podium-number">${position}</div>
                <div class="podium-name">${namesHtml}</div>
                <div class="podium-points">${points}</div>
                <div style="font-size: 0.8em; margin-top: 5px;">${subtitle}</div>
            </div>
        `;
        
        // Update position based on how many participants were in this score group (Dutch/European style)
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
            <div class="table-scroll">
                <table>
                    <thead>
                        <tr>
                            <th style="width: auto;">Renner</th>`;
    
    // Add stage columns
    for (let i = 1; i <= currentStage; i++) {
        if (i <= 21) {
            teamHtml += `<th>Et ${i}</th>`;
        }
    }
    
    // Add Totaal Etappes column
    teamHtml += `<th style="background: #e8f4fd;">Totaal Etappes</th>`;
    
    // Add Eindstand column if data exists
    if (window.hasEindstandData) {
        teamHtml += `<th style="background: #ffe4b5;">Eind</th>`;
        teamHtml += `<th>Totaal</th>`;
    }
    
    teamHtml += `<th>Status</th></tr></thead><tbody>`;
    
    participant.team.forEach(rider => {
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
        
        teamHtml += `
            <tr>
                <td class="${statusClass}" style="white-space: nowrap;">${rider.name}</td>
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
    
    // Apply auto-sizing to the modal table and adjust modal width
    setTimeout(() => {
        const table = document.querySelector('#detailContent table');
        if (table) {
            autoSizeTable(table, { nameColumns: [0], statusColumns: 'auto' });
        }
        
        // Scroll to top of modal content on mobile
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
    const dailyNamesHtml = dailyWinners.length > 3 ? 'Klik voor alle winnaars' : dailyWinners.map(p => p.name).join('<br>');
    document.getElementById('overviewDailyWinner').innerHTML = dailyNamesHtml || '-';
    const dailyPoints = dailyWinners.length > 0 ? (dailyWinners[0].stagePoints[lastStageIndex] || 0) : 0;
    document.getElementById('overviewDailyStats').textContent = `${dailyPoints} punten`;
    
    // Update general leaders (yellow jersey)
    const generalNamesHtml = generalLeaders.length > 3 ? 'Klik voor alle winnaars' : generalLeaders.map(p => p.name).join('<br>');
    document.getElementById('overviewGeneralWinner').innerHTML = generalNamesHtml || '-';
    const totalPoints = generalLeaders.length > 0 ? generalLeaders[0].totalPoints : 0;
    document.getElementById('overviewGeneralStats').textContent = `${totalPoints} punten totaal`;
    
    // Update most daily wins (milka bar)
    const dailyWinsNamesHtml = dailyWinsLeaders.length > 3 ? 'Klik voor alle winnaars' : dailyWinsLeaders.map(p => p.name).join('<br>');
    const dailyWinsElement = document.getElementById('overviewDailyWinsWinner');
    dailyWinsElement.innerHTML = dailyWinsNamesHtml || '-';
    
    // Make Milka bar card clickable when there are ties
    const dailyWinsCard = dailyWinsElement.closest('.overview-item');
    if (dailyWinsCard) {
        if (dailyWinsLeaders.length > 3) {
            dailyWinsCard.style.cursor = 'pointer';
            dailyWinsCard.onclick = () => {
                // Switch to Classement Général tab
                const tabs = document.querySelectorAll('.tab-button');
                const classementTab = Array.from(tabs).find(tab => tab.textContent.includes('Classement'));
                if (classementTab) classementTab.click();
            };
        } else {
            dailyWinsCard.style.cursor = 'default';
            dailyWinsCard.onclick = null;
        }
    }
    
    const dailyWins = dailyWinsLeaders.length > 0 ? dailyWinsLeaders[0].dailyWins : 0;
    document.getElementById('overviewDailyWinsStats').textContent = `${dailyWins} dagoverwinning${dailyWins !== 1 ? 'en' : ''}`;
    
    // No need for separate stage winners - the 4th jersey is biggest improver, not stage winner
    
    // Calculate biggest daily improvement (green arrow) - could also have multiple tied improvers
    const biggestImprover = calculateBiggestImprovement();
    const improverElement = document.getElementById('biggestImproverName');
    const improverStatsElement = document.getElementById('overviewImproverStats');
    
    if (biggestImprover) {
        // Show names or "Klik voor alle winnaars" based on count
        const improverNames = biggestImprover.totalCount > 3 ? 'Klik voor alle winnaars' : biggestImprover.name;
        improverElement.innerHTML = improverNames;
        
        // Make green arrow card clickable when there are ties
        const improverCard = improverElement.closest('.overview-item');
        if (improverCard) {
            if (biggestImprover.totalCount > 3) {
                improverCard.style.cursor = 'pointer';
                improverCard.onclick = () => {
                    // Switch to Ranking tab
                    const tabs = document.querySelectorAll('.tab-button');
                    const rankingTab = Array.from(tabs).find(tab => tab.textContent.includes('Ranking'));
                    if (rankingTab) rankingTab.click();
                };
            } else {
                improverCard.style.cursor = 'default';
                improverCard.onclick = null;
            }
        }
        
        const improvementText = biggestImprover.improvement > 0 ? 
            `Gestegen ${biggestImprover.improvement} positie${biggestImprover.improvement !== 1 ? 's' : ''}` :
            'Geen stijging';
        improverStatsElement.textContent = improvementText;
    } else {
        improverElement.textContent = '-';
        improverStatsElement.textContent = 'Geen data';
        
        // Remove any click handlers when no data
        const improverCard = improverElement.closest('.overview-item');
        if (improverCard) {
            improverCard.style.cursor = 'default';
            improverCard.onclick = null;
        }
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
        return { 
            name: improverNames, 
            improvement: biggestImprovement, 
            totalCount: improvers.length 
        };
    }
    
    return null;
}

// Excel View functies verwijderd

// Participant selector functions
function updateParticipantSelector() {
    const selector = document.getElementById('participantSelector');
    if (selector) {
        // Clear existing options except the first one
        selector.innerHTML = '<option value="">Selecteer een deelnemer...</option>';
        
        // Add participants to dropdown
        participants.forEach(participant => {
            const option = document.createElement('option');
            option.value = participant.name;
            option.textContent = participant.name;
            selector.appendChild(option);
        });
    }
    
    // Also initialize mobile elements
    if (window.innerWidth <= 768) {
        initParticipantDropdown();
        initParticipantPills();
    }
}

function showSelectedParticipantTeam(participantName) {
    if (!participantName) {
        // Show dropdown again if nothing selected
        document.getElementById('participantSelector').style.display = 'block';
        return;
    }
    
    // Use the existing showParticipantDetail function to show in modal
    showParticipantDetail(participantName);
    
    // Reset the dropdown to default after a delay
    setTimeout(() => {
        const selector = document.getElementById('participantSelector');
        selector.value = '';
        selector.style.display = 'block';
    }, 2000);
}

// Universal table auto-sizing system
function autoSizeTable(tableElement, options = {}) {
    if (!tableElement) return;
    
    // Prevent duplicate processing
    const lastProcessed = tableElement.getAttribute('data-autosized-timestamp');
    const now = Date.now();
    if (lastProcessed && (now - parseInt(lastProcessed)) < 1000) {
        // Skip if processed within last second
        return;
    }
    tableElement.setAttribute('data-autosized-timestamp', now.toString());
    
    // Debug logging to help troubleshoot
    const tableInfo = {
        id: tableElement.id,
        className: tableElement.className,
        parentId: tableElement.parentElement?.id,
        tbody: tableElement.querySelector('tbody')?.id,
        headers: Array.from(tableElement.querySelectorAll('thead th')).map(th => th.textContent.trim()),
        visible: tableElement.offsetHeight > 0,
        width: tableElement.offsetWidth,
        height: tableElement.offsetHeight
    };
    console.log('🔧 AutoSizing table:', tableInfo, 'with options:', options);
    
    const {
        nameColumns = [0, 1], // Which columns contain names (0-indexed)
        pointColumns = 'auto', // 'auto' to detect .points-cell, or array of indices
        statusColumns = 'auto', // 'auto' to detect last column, or array of indices
        maxModalWidth = '90vw',
        minColumnWidth = '30px'
    } = options;
    
    // Step 1: Reset any existing inline styles and FORCE auto-sizing
    tableElement.classList.add('auto-sized-table');
    tableElement.style.setProperty('table-layout', 'auto', 'important');
    tableElement.style.setProperty('width', 'auto', 'important');
    tableElement.style.setProperty('max-width', 'none', 'important');
    
    // Also force the table container to not be 100% width
    const tableContainer = tableElement.closest('.table-container, .table-scroll');
    if (tableContainer) {
        tableContainer.classList.add('auto-sized-container');
        tableContainer.style.setProperty('width', 'auto', 'important');
        tableContainer.style.setProperty('max-width', 'none', 'important');
        tableContainer.style.setProperty('overflow-x', 'auto', 'important');
    }
    
    // Step 2: Identify column types
    const headers = tableElement.querySelectorAll('thead th');
    const rows = tableElement.querySelectorAll('tbody tr');
    
    if (headers.length === 0 || rows.length === 0) return;
    
    // Step 3: Apply column-specific styles - ALL columns should show full text
    const stickyColumnNames = nameColumns.map(i => headers[i]?.textContent?.trim()).filter(Boolean);
    console.log(`🎯 Processing ${headers.length} columns, making sticky: [${stickyColumnNames.join(', ')}]`);
    
    headers.forEach((header, index) => {
        const cells = tableElement.querySelectorAll(`td:nth-child(${index + 1})`);
        const headerText = header.textContent?.trim() || '';
        
        // ALL columns: auto-size to content, ensure full text is visible (FORCE with !important)
        header.style.setProperty('width', 'auto', 'important');
        header.style.setProperty('min-width', 'fit-content', 'important');
        header.style.setProperty('white-space', 'nowrap', 'important');
        header.style.setProperty('max-width', 'none', 'important');
        
        cells.forEach(cell => {
            cell.style.setProperty('width', 'auto', 'important');
            cell.style.setProperty('min-width', 'fit-content', 'important');
            cell.style.setProperty('white-space', 'nowrap', 'important');
            cell.style.setProperty('max-width', 'none', 'important');
        });
        
        // Point columns: just center alignment, but keep auto width
        if (pointColumns === 'auto' ? header.classList.contains('points-cell') || cells[0]?.classList.contains('points-cell') : pointColumns.includes(index)) {
            header.style.textAlign = 'center';
            cells.forEach(cell => {
                cell.style.textAlign = 'center';
            });
        }
        
        // Apply sticky positioning to name columns for better UX
        if (nameColumns.includes(index)) {
            // Remove any existing sticky classes first
            header.classList.remove('sticky-column');
            cells.forEach(cell => cell.classList.remove('sticky-column'));
            
            // Add sticky class for CSS to handle
            header.classList.add('sticky-column');
            cells.forEach(cell => cell.classList.add('sticky-column'));
            
            // Calculate left position - delay this to allow table to render first
            setTimeout(() => {
                let leftPosition = 0;
                for (let i = 0; i < index; i++) {
                    if (nameColumns.includes(i)) {
                        const prevHeader = headers[i];
                        if (prevHeader && prevHeader.offsetWidth) {
                            leftPosition += prevHeader.offsetWidth;
                        }
                    }
                }
                
                console.log(`📌 Sticky "${headerText}" at ${leftPosition}px`);
                
                // Apply inline styles for immediate effect
                header.style.position = 'sticky';
                header.style.left = `${leftPosition}px`;
                header.style.zIndex = '25';
                header.style.background = 'linear-gradient(135deg, #e8e8e8, #d8d8d8)';
                header.style.borderRight = '2px solid #a0a0a0';
                
                cells.forEach(cell => {
                    cell.style.position = 'sticky';
                    cell.style.left = `${leftPosition}px`;
                    cell.style.zIndex = '15';
                    cell.style.background = 'linear-gradient(135deg, #f8f8f8, #f0f0f0)';
                    cell.style.borderRight = '2px solid #a0a0a0';
                });
            }, 50);
        }
    });
    
    // Step 4: Adjust container width (modal or main card)
    setTimeout(() => {
        const tableWidth = tableElement.scrollWidth;
        
        // Handle modal containers
        const modal = tableElement.closest('.detail-view, .modal');
        if (modal) {
            const modalContent = modal.querySelector('.detail-content, .modal-content');
            if (modalContent && tableWidth > 0) {
                const optimalWidth = Math.min(tableWidth + 100, window.innerWidth * 0.9);
                modalContent.style.width = `${optimalWidth}px`;
                modalContent.style.maxWidth = maxModalWidth;
            }
        }
        
        // Handle main page cards
        const card = tableElement.closest('.card');
        if (card && tableWidth > 0 && !modal) {
            const extraSpace = 80; // Extra space to prevent horizontal scrollbar
            const minWidth = 300; // Minimum card width
            const maxWidth = window.innerWidth * 0.95; // Max 95% of screen
            const isMatrixTable = tableElement.querySelector('tbody#matrixTable') !== null;
            
            let optimalWidth;
            
            if (isMatrixTable && tableWidth > maxWidth) {
                // For very wide matrix tables: use max screen width and allow horizontal scroll within table
                optimalWidth = maxWidth;
                console.log(`🎨 Matrix table too wide (${tableWidth}px), using max width ${optimalWidth}px with internal scroll`);
                
                // Ensure table container allows horizontal scrolling
                if (tableContainer) {
                    tableContainer.style.setProperty('overflow-x', 'auto', 'important');
                    tableContainer.style.setProperty('overflow-y', 'auto', 'important');
                }
            } else {
                // For normal tables: size card to table width + extra space
                optimalWidth = Math.max(minWidth, Math.min(tableWidth + extraSpace, maxWidth));
                console.log(`🎨 Resizing card to ${optimalWidth}px (table: ${tableWidth}px + ${extraSpace}px extra)`);
                
                // Ensure table container doesn't cause horizontal scroll
                if (tableContainer) {
                    tableContainer.style.setProperty('overflow-x', 'visible', 'important');
                }
            }
            
            // Apply card sizing and centering
            card.style.setProperty('width', `${optimalWidth}px`, 'important');
            card.style.setProperty('max-width', `${maxWidth}px`, 'important');
            card.style.setProperty('margin', '0 auto', 'important');
            card.classList.add('auto-sized-card');
        }
    }, 100); // Slightly longer delay to ensure table is fully rendered
}

// Update ranking legend with dynamic counts
function updateRankingLegenda(risers, droppers, same) {
    const legendaElement = document.getElementById('rankingLegenda');
    if (!legendaElement) return;
    
    if (currentStage <= 1) {
        // For stage 1, show the default explanation
        legendaElement.innerHTML = `
            <strong>Legenda:</strong> Eerste etappe toont positie, daarna positieverandering: 
            <span style="color: #28a745; font-weight: bold;">▲4 Gestegen</span>, 
            <span style="color: #dc3545; font-weight: bold;">▼7 Gedaald</span>, 
            <span style="color: #6c757d; font-weight: bold;">0 Gelijk</span>
        `;
    } else {
        // For stage 2+, show dynamic counts
        legendaElement.innerHTML = `
            <strong>Legenda:</strong> Etappe ${currentStage} positieveranderingen: 
            <span style="color: #28a745; font-weight: bold;">${risers} Gestegen</span>, 
            <span style="color: #dc3545; font-weight: bold;">${droppers} Gedaald</span>, 
            <span style="color: #6c757d; font-weight: bold;">${same} Gelijk</span>
        `;
    }
}

// Apply auto-sizing to all tables after they're loaded
function autoSizeAllTables() {
    // Wait a bit longer to ensure tables are fully rendered
    setTimeout(() => {
        // Popup modal tables
        const modalTables = document.querySelectorAll('.detail-view table');
        modalTables.forEach(table => {
            if (table.offsetHeight > 0) { // Only process visible tables
                autoSizeTable(table, { nameColumns: [0], statusColumns: 'auto' });
            }
        });
        
        // Find all table containers and their tables (excluding dailyPrizesTable to prevent card expansion)
        const tableConfigs = [
            { selector: '#ridersTable', parentTable: true, config: { nameColumns: [0, 1], statusColumns: 'auto' } },
            { selector: '#matrixTable', parentTable: true, config: { nameColumns: [0], statusColumns: [1] } },
            { selector: '#rankingTable', parentTable: true, config: { nameColumns: [0], pointColumns: [] } }
        ];
        
        tableConfigs.forEach(({ selector, parentTable, config }) => {
            const tbody = document.querySelector(selector);
            if (tbody) {
                const table = parentTable ? tbody.closest('table') : tbody;
                if (table && table.offsetHeight > 0) { // Only process visible tables
                    autoSizeTable(table, config);
                }
            }
        });
        
        // Also try to find any other tables that might have been missed
        const allTables = document.querySelectorAll('table');
        allTables.forEach(table => {
            if (table.offsetHeight > 0 && !table.hasAttribute('data-auto-sized')) {
                // Mark as processed to avoid duplicate processing
                table.setAttribute('data-auto-sized', 'true');
                
                // Default config for unknown tables
                autoSizeTable(table, { nameColumns: [0, 1], statusColumns: 'auto' });
            }
        });
    }, 150); // Longer delay to ensure DOM is fully updated
}

// Etapes functions
function loadEtapesTable() {
    console.log('🗓️ Loading etapes table...');
    
    // Populate the etapes dropdown
    populateEtapesDropdown();
    
    // Clear the selected stage info and tables
    document.getElementById('selectedStageInfo').style.display = 'none';
    document.getElementById('selectedStagePodiums').style.display = 'none';
    document.getElementById('stageResultsContainer').style.display = 'none';
}

function populateEtapesDropdown() {
    const selector = document.getElementById('etapeSelector');
    const mobileSelector = document.getElementById('mobileStageDropdown');
    
    // Populate desktop dropdown
    if (selector) {
        // Clear existing options except the first one
        selector.innerHTML = '<option value="">Kies een etappe...</option>';
        
        // Check if we have stage data
        if (!window.etappeInfoData || !window.etappesWithRiderData) {
            selector.innerHTML = '<option value="">Geen etappe data beschikbaar</option>';
        } else {
            // Add regular stages that have rider data
            window.etappesWithRiderData.forEach(stageNum => {
                if (stageNum <= 21) { // Regular stages 1-21
                    const stageInfo = window.etappeInfoData[stageNum];
                    const option = document.createElement('option');
                    option.value = stageNum;
                    option.textContent = `Etappe ${stageNum}${stageInfo ? ` - ${stageInfo.route}` : ''}`;
                    selector.appendChild(option);
                }
            });
            
            // Add final classification if available
            if (window.hasEindstandData) {
                const option = document.createElement('option');
                option.value = '22';
                option.textContent = 'Eindklassement';
                selector.appendChild(option);
            }
        }
    }
    
    // Populate mobile dropdown
    if (mobileSelector && window.innerWidth <= 768) {
        // Clear existing options
        mobileSelector.innerHTML = '<option value="">Kies Etappe...</option>';
        
        // Check if we have stage data
        if (!window.etappeInfoData || !window.etappesWithRiderData) {
            mobileSelector.innerHTML = '<option value="">Geen etappe data beschikbaar</option>';
        } else {
            // Add regular stages that have rider data
            window.etappesWithRiderData.forEach(stageNum => {
                if (stageNum <= 21) { // Regular stages 1-21
                    const stageInfo = window.etappeInfoData[stageNum];
                    const option = document.createElement('option');
                    option.value = stageNum;
                    option.textContent = `Etappe ${stageNum}`;
                    mobileSelector.appendChild(option);
                }
            });
            
            // Add final classification if available
            if (window.hasEindstandData) {
                const option = document.createElement('option');
                option.value = '22';
                option.textContent = 'Eindstand';
                mobileSelector.appendChild(option);
            }
        }
    }
}

function showSelectedStage(stageValue) {
    if (!stageValue) {
        // Hide all stage-specific content and show dropdown again
        document.getElementById('selectedStageInfo').style.display = 'none';
        document.getElementById('selectedStagePodiums').style.display = 'none';
        document.getElementById('stageResultsContainer').style.display = 'none';
        document.getElementById('etapeSelector').style.display = 'block';
        return;
    }
    
    const stageNum = parseInt(stageValue);
    
    // Sync with arrow navigation state
    if (typeof currentStageNum !== 'undefined') {
        currentStageNum = stageNum;
    }
    
    // Update mobile arrow navigation indicators
    if (window.innerWidth <= 768) {
        updateStageIndicators();
        updateStageNavigationButtons();
    }
    
    console.log(`🗓️ Showing stage ${stageNum} details`);
    
    // Check if stage has data available
    const maxAvailableStage = Math.min(currentStage, 21);
    const hasEindstand = window.hasEindstandData || currentStage >= 22;
    const stageHasData = stageNum <= maxAvailableStage || (stageNum === 22 && hasEindstand);
    
    // Show stage info
    displayStageInfo(stageNum);
    
    if (stageHasData) {
        // Show stage podiums (three podiums like homepage)
        displayStagePodiums(stageNum);
        
        // Show stage results tables
        displayStageResults(stageNum);
    } else {
        // Hide podiums and results for incomplete stages
        document.getElementById('selectedStagePodiums').style.display = 'none';
        document.getElementById('stageResultsContainer').style.display = 'none';
        
        // Show a message instead
        showIncompleteStageMessage(stageNum);
    }
    
    // Reset the dropdown to default after a delay
    setTimeout(() => {
        const selector = document.getElementById('etapeSelector');
        selector.value = '';
        selector.style.display = 'block';
    }, 3000);
}

// Show message for incomplete stages
function showIncompleteStageMessage(stageNum) {
    const podiumsContainer = document.getElementById('selectedStagePodiums');
    const resultsContainer = document.getElementById('stageResultsContainer');
    
    if (podiumsContainer) {
        podiumsContainer.innerHTML = `
            <div class="incomplete-stage-message">
                <div class="card" style="text-align: center; padding: 40px; margin: 20px 0;">
                    <h3>🚧 Etappe ${stageNum}</h3>
                    <p style="color: #666; margin: 15px 0;">Deze etappe is nog niet gereden.</p>
                    <p style="color: #999; font-size: 0.9em;">Resultaten en podiums worden beschikbaar na afloop van de etappe.</p>
                </div>
            </div>
        `;
        podiumsContainer.style.display = 'block';
    }
    
    if (resultsContainer) {
        resultsContainer.style.display = 'none';
    }
}

function displayStageInfo(stageNum) {
    const stageInfo = window.etappeInfoData[stageNum];
    const infoContainer = document.getElementById('selectedStageInfo');
    
    if (!stageInfo) {
        infoContainer.style.display = 'none';
        return;
    }
    
    // Update stage info elements
    const isEindstand = stageNum === 22;
    document.getElementById('selectedStageTitle').textContent = 
        isEindstand ? '🏆 Eindklassement' : `🗓️ Etappe ${stageNum}`;
    
    document.getElementById('selectedStageName').innerHTML = 
        `<strong>${stageInfo.route || '-'}</strong>`;
    
    if (isEindstand) {
        document.getElementById('selectedStageDetails').textContent = 'Definitieve uitslag';
        document.getElementById('selectedStageDescription').textContent = 'Tour de France 2025';
    } else {
        document.getElementById('selectedStageDetails').textContent = 
            `${stageInfo.afstand || '-'} | ${stageInfo.type || '-'}`;
        document.getElementById('selectedStageDescription').textContent = 
            stageInfo.datum || '-';
    }
    
    infoContainer.style.display = 'block';
}

function displayStagePodiums(stageNum) {
    const podiumsContainer = document.getElementById('selectedStagePodiums');
    
    if (!participants || participants.length === 0) {
        podiumsContainer.style.display = 'none';
        return;
    }
    
    const stageIndex = stageNum - 1; // Convert to 0-based index
    
    // Calculate rankings for this stage (cumulative up to this stage)
    let dailyRanking, generalRanking, dailyWinsRanking;
    
    if (stageNum === 22) {
        // Final classification rankings
        dailyRanking = [...participants].sort((a, b) => b.totalPoints - a.totalPoints);
        generalRanking = [...participants].sort((a, b) => b.totalPoints - a.totalPoints);
        dailyWinsRanking = [...participants].sort((a, b) => b.dailyWins - a.dailyWins);
    } else {
        // Regular stage rankings
        dailyRanking = [...participants].sort((a, b) => 
            (b.stagePoints[stageIndex] || 0) - (a.stagePoints[stageIndex] || 0)
        );
        
        // General classification up to this stage (cumulative points)
        generalRanking = [...participants].sort((a, b) => {
            const aCumulative = a.stagePoints.slice(0, stageIndex + 1).reduce((sum, p) => sum + (p || 0), 0);
            const bCumulative = b.stagePoints.slice(0, stageIndex + 1).reduce((sum, p) => sum + (p || 0), 0);
            return bCumulative - aCumulative;
        });
        
        // Daily wins up to this stage
        dailyWinsRanking = [...participants].sort((a, b) => {
            const aDailyWins = calculateDailyWinsUpToStage(a, stageIndex);
            const bDailyWins = calculateDailyWinsUpToStage(b, stageIndex);
            return bDailyWins - aDailyWins;
        });
    }
    
    // Update podium titles
    const stageLabel = stageNum === 22 ? 'Eindstand' : `Etappe ${stageNum}`;
    document.getElementById('selectedDailyPodiumTitle').textContent = 
        stageNum === 22 ? '🔵 Eindstand Winnaar' : `🔵 ${stageLabel} Winnaar`;
    document.getElementById('selectedGeneralPodiumTitle').textContent = 
        `🟡 Algemeen na ${stageLabel}`;
    document.getElementById('selectedDailyWinsPodiumTitle').textContent = 
        `🏆 Dagoverwinningen na ${stageLabel}`;
    
    // Create podium content for each podium
    updateSelectedPodiumContent('selectedDailyPodiumPlaces', dailyRanking, stageNum === 22 ? 'total' : stageIndex);
    updateSelectedPodiumContent('selectedGeneralPodiumPlaces', generalRanking, stageNum === 22 ? 'total' : 'cumulative-' + stageIndex);
    updateSelectedPodiumContent('selectedDailyWinsPodiumPlaces', dailyWinsRanking, stageNum === 22 ? 'dailywins' : `dailywins-${stageIndex}`);
    
    podiumsContainer.style.display = 'block';
}

function calculateDailyWinsUpToStage(participant, stageIndex) {
    let dailyWins = 0;
    for (let i = 0; i <= stageIndex; i++) {
        // Check if this participant was the stage winner (or tied for first)
        const stagePoints = participant.stagePoints[i] || 0;
        if (stagePoints > 0) {
            // Find the highest points for this stage
            const maxPointsForStage = Math.max(...participants.map(p => p.stagePoints[i] || 0));
            if (stagePoints === maxPointsForStage) {
                dailyWins++;
            }
        }
    }
    return dailyWins;
}

function updateSelectedPodiumContent(podiumPlacesId, ranking, scoreType) {
    const podiumPlaces = document.getElementById(podiumPlacesId);
    if (!podiumPlaces) return;
    
    // Group participants by their scores to handle ties
    const scoreGroups = [];
    let currentScore = null;
    let currentGroup = [];
    
    ranking.forEach(participant => {
        let score;
        if (scoreType === 'total') {
            score = participant.totalPoints;
        } else if (scoreType === 'dailywins') {
            score = participant.dailyWins; // This should be calculated up to the stage
        } else if (typeof scoreType === 'string' && scoreType.startsWith('dailywins-')) {
            // Calculate daily wins up to specific stage
            const stageIndex = parseInt(scoreType.split('-')[1]);
            score = calculateDailyWinsUpToStage(participant, stageIndex);
        } else if (typeof scoreType === 'string' && scoreType.startsWith('cumulative-')) {
            // Extract stage index from 'cumulative-X' format
            const stageIndex = parseInt(scoreType.split('-')[1]);
            score = participant.stagePoints.slice(0, stageIndex + 1).reduce((sum, p) => sum + (p || 0), 0);
        } else if (typeof scoreType === 'number') {
            // For numeric scoreType, use just that stage's points (for daily winner)
            score = participant.stagePoints[scoreType] || 0;
        } else {
            score = participant.totalPoints;
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
    
    // Only show podium positions that actually exist (1st, 2nd, 3rd)
    // If everyone is tied for 1st, only show 1st place
    // If 1st and 2nd are tied, only show 1st and 3rd places, etc.
    let podiumHtml = '';
    let position = 1;
    
    for (let groupIndex = 0; groupIndex < scoreGroups.length && position <= 3; groupIndex++) {
        const group = scoreGroups[groupIndex];
        let points, subtitle;
        
        if (scoreType === 'dailywins') {
            points = `${group.score} dagoverwinning${group.score !== 1 ? 'en' : ''}`;
            subtitle = position === 1 ? '🥇 Dagkoning!' : (position === 2 ? '🥈 Tweede plaats' : '🥉 Derde plaats');
        } else {
            points = `${group.score} punten`;
            subtitle = position === 1 ? '🥇 Winnaar!' : (position === 2 ? '🥈 Tweede plaats' : '🥉 Derde plaats');
        }
        
        const positionClass = position === 1 ? 'first' : (position === 2 ? 'second' : 'third');
        
        // Determine max participants and create names list
        let maxParticipants, limitedParticipants, namesHtml, isClickable = false;
        
        if (position === 1) {
            // Gold: show all tied participants (no limit)
            limitedParticipants = group.participants;
            namesHtml = limitedParticipants.map(p => p.name).join('<br>');
        } else if (position === 2) {
            // Silver: show max 6, make clickable if more
            maxParticipants = 6;
            limitedParticipants = group.participants.slice(0, maxParticipants);
            if (group.participants.length > maxParticipants) {
                namesHtml = `${limitedParticipants.map(p => p.name).join('<br>')}<br><span style="color: #007bff; text-decoration: underline; cursor: pointer;">+${group.participants.length - maxParticipants} meer...</span>`;
                isClickable = true;
            } else {
                namesHtml = limitedParticipants.map(p => p.name).join('<br>');
            }
        } else {
            // Bronze: show max 3, make clickable if more
            maxParticipants = 3;
            limitedParticipants = group.participants.slice(0, maxParticipants);
            if (group.participants.length > maxParticipants) {
                namesHtml = `${limitedParticipants.map(p => p.name).join('<br>')}<br><span style="color: #007bff; text-decoration: underline; cursor: pointer;">+${group.participants.length - maxParticipants} meer...</span>`;
                isClickable = true;
            } else {
                namesHtml = limitedParticipants.map(p => p.name).join('<br>');
            }
        }
        
        if (group.participants.length > 1) {
            subtitle = `${subtitle} (gedeeld)`;
        }
        
        const clickableClass = isClickable ? 'podium-clickable' : '';
        const clickHandler = isClickable ? `onclick="showPodiumModal('${positionClass}', '${position}', '${scoreType}', '${JSON.stringify(group.participants).replace(/"/g, '&quot;')}', '${points}', '${subtitle.replace(/'/g, '\\\'')}')"` : '';
        
        podiumHtml += `
            <div class="podium-place ${positionClass} ${clickableClass}" ${clickHandler}>
                <div class="podium-number">${position}</div>
                <div class="podium-name">${namesHtml}</div>
                <div class="podium-points">${points}</div>
                <div style="font-size: 0.8em; margin-top: 5px;">${subtitle}</div>
            </div>
        `;
        
        position += group.participants.length;
    }
    
    podiumPlaces.innerHTML = podiumHtml;
}

function displayStageResults(stageNum) {
    const resultsContainer = document.getElementById('stageResultsContainer');
    
    // Display riders points table
    displayStageRidersTable(stageNum);
    
    // Display participants points table
    displayStageParticipantsTable(stageNum);
    
    resultsContainer.style.display = 'block';
}

function displayStageRidersTable(stageNum) {
    const tbody = document.getElementById('stageRidersTable');
    
    if (!allRiders || allRiders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px; color: #666;">Geen renner data beschikbaar</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    
    const stageIndex = stageNum - 1; // Convert to 0-based index
    
    // For final classification, show actual race positions
    if (stageNum === 22 && window.hasEindstandData) {
        displayFinalClassificationRiders(tbody);
        return;
    }
    
    // For regular stages, show stage results in proper order (1-10, then jerseys)
    displayRegularStageRiders(tbody, stageIndex);
}

function displayFinalClassificationRiders(tbody) {
    // Get riders with final classification points and sort by actual race position
    const ridersWithEindstandPoints = allRiders
        .filter(rider => (rider.points[21] || 0) > 0) // Index 21 = stage 22 (Eindstand)
        .sort((a, b) => (b.points[21] || 0) - (a.points[21] || 0));
    
    if (ridersWithEindstandPoints.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px; color: #666;">Geen eindklassement data</td></tr>';
        return;
    }
    
    // For final classification, try to determine actual positions based on points
    // Higher points typically mean better position
    ridersWithEindstandPoints.forEach((rider, index) => {
        const eindstandPoints = rider.points[21] || 0;
        const row = document.createElement('tr');
        const statusClass = rider.status === 'dropped' ? 'rider-dropped' : '';
        
        // Try to determine position based on points (rough estimate)
        let position = index + 1;
        if (eindstandPoints >= 150) position = 1; // Winner gets 150 points
        else if (eindstandPoints >= 75) position = 2; // 2nd place gets 75 points
        else if (eindstandPoints >= 50) position = 3; // 3rd place gets 50 points
        
        row.innerHTML = `
            <td><strong>${position}</strong></td>
            <td class="${statusClass}">${rider.name}</td>
            <td class="points-cell ${statusClass}"><strong>${eindstandPoints}</strong></td>
        `;
        
        tbody.appendChild(row);
    });
}

function displayRegularStageRiders(tbody, stageIndex) {
    const stageNum = stageIndex + 1; // Convert to 1-based stage number
    
    // Get stage data from processedTourData
    const stageData = window.processedTourData?.stages[stageNum];
    if (!stageData) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px; color: #666;">Geen stage data beschikbaar</td></tr>';
        return;
    }
    
    const stageResults = [];
    
    // Add positions 1-10 from exact Excel data
    for (let pos = 1; pos <= 10; pos++) {
        const riderName = stageData.results.positions[pos];
        if (riderName && stageData.riders[riderName]) {
            stageResults.push({
                position: pos.toString(),
                riderName: riderName,
                points: stageData.riders[riderName].stagePoints,
                status: stageData.riders[riderName].status,
                type: 'stage'
            });
        }
    }
    
    // Add jersey holders from exact Excel data
    const jerseyOrder = ['geel', 'groen', 'bolletjes', 'wit'];
    const jerseyLabels = ['Geel', 'Groen', 'Bolletjes', 'Wit'];
    
    jerseyOrder.forEach((jerseyType, index) => {
        const riderName = stageData.results.jerseys[jerseyType];
        if (riderName && stageData.riders[riderName]) {
            // Check if rider is not already in positions 1-10
            const alreadyListed = stageResults.some(r => r.riderName === riderName);
            if (!alreadyListed) {
                stageResults.push({
                    position: jerseyLabels[index],
                    riderName: riderName,
                    points: stageData.riders[riderName].stagePoints,
                    status: stageData.riders[riderName].status,
                    type: 'jersey'
                });
            }
        }
    });
    
    if (stageResults.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px; color: #666;">Geen resultaten voor deze etappe</td></tr>';
        return;
    }
    
    // Render the table
    stageResults.forEach(result => {
        const row = document.createElement('tr');
        const statusClass = result.status === 'dropped' ? 'rider-dropped' : '';
        const jerseyClass = result.type === 'jersey' ? 'jersey-row' : '';
        
        row.className = `${statusClass} ${jerseyClass}`;
        row.innerHTML = `
            <td><strong>${result.position}</strong></td>
            <td class="${statusClass}">${result.riderName}</td>
            <td class="points-cell ${statusClass}"><strong>${result.points}</strong></td>
        `;
        
        tbody.appendChild(row);
    });
}

function displayStageParticipantsTable(stageNum) {
    const tbody = document.getElementById('stageParticipantsTable');
    
    if (!participants || participants.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #666;">Geen deelnemer data beschikbaar</td></tr>';
        return;
    }
    
    // Update the stage-specific header
    const stageHeader = document.getElementById('stagePointsHeader');
    if (stageHeader) {
        stageHeader.textContent = stageNum === 22 ? 'Eindstand' : `Etappe ${stageNum}`;
    }
    
    tbody.innerHTML = '';
    
    const stageIndex = stageNum - 1; // Convert to 0-based index
    
    // Calculate tied rankings for this stage
    const scoreFunction = (participant) => {
        if (stageNum === 22) {
            return participant.totalPoints; // Final classification
        } else {
            // Calculate cumulative points up to this stage
            return participant.stagePoints.slice(0, stageIndex + 1).reduce((sum, p) => sum + (p || 0), 0);
        }
    };
    
    const stageRankings = calculateTiedRankings(participants, scoreFunction);
    
    // Calculate position changes from previous stage (only for regular stages)
    let previousRankings = null;
    if (stageNum > 1 && stageNum <= 21) {
        const prevStageIndex = stageIndex - 1;
        const prevScoreFunction = (participant) => {
            return participant.stagePoints.slice(0, prevStageIndex + 1).reduce((sum, p) => sum + (p || 0), 0);
        };
        previousRankings = calculateTiedRankings(participants, prevScoreFunction);
    }
    
    // Add participants to table
    stageRankings.forEach((rankingEntry) => {
        const participant = rankingEntry.item;
        const position = rankingEntry.rank;
        
        // Calculate stage-specific points and cumulative total
        let stageSpecificPoints, cumulativePoints;
        
        if (stageNum === 22) {
            // Final classification
            stageSpecificPoints = participant.totalPoints;
            cumulativePoints = participant.totalPoints;
        } else {
            // Regular stage: points earned in just this stage
            stageSpecificPoints = participant.stagePoints[stageIndex] || 0;
            // Cumulative points up to this stage
            cumulativePoints = participant.stagePoints.slice(0, stageIndex + 1).reduce((sum, p) => sum + (p || 0), 0);
        }
        
        // Calculate position change
        let positionChange = '';
        if (previousRankings && stageNum > 1) {
            const prevRankingEntry = previousRankings.find(r => r.item.name === participant.name);
            const prevPosition = prevRankingEntry ? prevRankingEntry.rank : 0;
            const change = prevPosition - position;
            
            if (change > 0) {
                positionChange = `<span style="color: #28a745; font-weight: bold;">▲${change}</span>`;
            } else if (change < 0) {
                positionChange = `<span style="color: #dc3545; font-weight: bold;">▼${Math.abs(change)}</span>`;
            } else {
                positionChange = `<span style="color: #6c757d;">0</span>`;
            }
        } else {
            positionChange = '-';
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${position}</strong></td>
            <td>${participant.name}</td>
            <td class="points-cell"><strong>${stageSpecificPoints}</strong></td>
            <td class="points-cell"><strong>${cumulativePoints}</strong></td>
            <td class="points-cell">${positionChange}</td>
        `;
        
        tbody.appendChild(row);
    });
}

// ============= MOBILE CARDS SYSTEM =============

// Load mobile participant cards
function loadMobileParticipantCards() {
    const container = document.getElementById('mobileParticipantCards');
    if (!container) return;
    
    if (participants.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                📁 Upload eerst een ploegen bestand
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    // Sort participants by total points
    const sortedParticipants = [...participants].sort((a, b) => b.totalPoints - a.totalPoints);
    
    // Calculate daily winners for jersey counts
    const dailyWinners = [];
    const generalLeaders = [];
    
    for (let stage = 0; stage < currentStage; stage++) {
        // Calculate daily winners (all tied winners)
        let maxPoints = 0;
        let winners = [];
        
        participants.forEach(participant => {
            const stagePoints = participant.stagePoints[stage] || 0;
            if (stagePoints > maxPoints) {
                maxPoints = stagePoints;
                winners = [participant.name];
            } else if (stagePoints === maxPoints && stagePoints > 0) {
                winners.push(participant.name);
            }
        });
        
        dailyWinners[stage] = winners;
        
        // Calculate general classification leaders (all tied leaders)
        let maxLeaderPoints = 0;
        let leaders = [];
        
        participants.forEach(participant => {
            const totalUpToStage = participant.stagePoints.slice(0, stage + 1).reduce((sum, p) => sum + p, 0);
            if (totalUpToStage > maxLeaderPoints) {
                maxLeaderPoints = totalUpToStage;
                leaders = [participant.name];
            } else if (totalUpToStage === maxLeaderPoints && totalUpToStage > 0) {
                leaders.push(participant.name);
            }
        });
        
        generalLeaders[stage] = leaders;
    }
    
    sortedParticipants.forEach((participant, index) => {
        // Count jerseys
        let blueJerseys = 0;
        let yellowJerseys = 0;
        
        for (let stage = 0; stage < currentStage; stage++) {
            if (dailyWinners[stage] && dailyWinners[stage].includes(participant.name)) blueJerseys++;
            if (generalLeaders[stage] && generalLeaders[stage].includes(participant.name)) yellowJerseys++;
        }
        
        const position = index + 1;
        const isTopThree = position <= 3;
        
        const card = document.createElement('div');
        card.className = 'participant-card';
        card.onclick = () => showParticipantDetail(participant.name);
        
        card.innerHTML = `
            <div class="card-header">
                <h3>${participant.name}</h3>
                <span class="position-badge ${isTopThree ? 'top-3' : ''}">#${position}</span>
            </div>
            <div class="card-stats">
                <div class="stat">
                    <span class="stat-label">Total</span>
                    <span class="stat-value">${participant.totalPoints}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">🔵 Blauw</span>
                    <span class="stat-value">${blueJerseys}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">🟡 Geel</span>
                    <span class="stat-value">${yellowJerseys}</span>
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });
    
    console.log(`📱 Loaded ${sortedParticipants.length} participant cards`);
}

// Load mobile rider cards
function loadMobileRiderCards() {
    const container = document.getElementById('mobileRiderCards');
    if (!container) return;
    
    if (allRiders.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                📁 Upload eerst een ploegen bestand
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    // Get race positions from Excel data for proper ordering
    const ridersWithPositions = allRiders.map(rider => {
        let racePosition = null;
        
        // Get position from final classification if available
        if (window.hasEindstandData && window.racePositions && window.racePositions[rider.name]) {
            racePosition = window.racePositions[rider.name];
        }
        
        return {
            ...rider,
            racePosition: racePosition
        };
    });
    
    // Sort by race position if available, otherwise by points (which represents current GC)
    ridersWithPositions.sort((a, b) => {
        if (a.racePosition !== null && b.racePosition !== null) {
            return a.racePosition - b.racePosition;
        }
        if (a.racePosition !== null) return -1;
        if (b.racePosition !== null) return 1;
        return (b.totalPoints || 0) - (a.totalPoints || 0);
    });
    
    ridersWithPositions.forEach((rider, index) => {
        const position = index + 1;
        const isTopThree = position <= 3;
        const isDropped = rider.status === 'dropped';
        
        // Get last few stage points for trend
        const recentStages = rider.points.slice(-3).filter(p => p > 0);
        const recentPoints = recentStages.length > 0 ? Math.max(...recentStages) : 0;
        
        const card = document.createElement('div');
        card.className = 'rider-card';
        
        card.innerHTML = `
            <div class="card-header">
                <h3>${rider.name}</h3>
                <span class="position-badge ${isTopThree ? 'top-3' : ''}">#${position}</span>
            </div>
            <div class="card-stats-compact">
                <div class="stat">
                    <span class="stat-label">Total</span>
                    <span class="stat-value">${rider.totalPoints || 0}</span>
                </div>
                <div class="stat">
                    <span class="rider-status ${isDropped ? 'dropped' : 'active'}">
                        ${isDropped ? '🔴 Uit' : '🟢 Actief'}
                    </span>
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });
    
    console.log(`📱 Loaded ${ridersWithPositions.length} rider cards`);
}

// Enhance existing table loading functions to also load mobile cards
const originalLoadDailyPrizesTable = loadDailyPrizesTable;
loadDailyPrizesTable = function() {
    originalLoadDailyPrizesTable();
    if (window.innerWidth <= 768) {
        loadMobileParticipantCards();
    }
};

const originalLoadRidersTable = loadRidersTable;
loadRidersTable = function() {
    originalLoadRidersTable();
    if (window.innerWidth <= 768) {
        loadMobileRiderCards();
    }
};

// ============= MOBILE SELECTORS =============

// Initialize mobile selectors (dropdowns + pills)
function initMobilePillSelectors() {
    if (window.innerWidth > 768) return;
    
    // Initialize mobile dropdowns
    initMobileDropdowns();
    
    // Initialize stage pills (hidden but still needed for desktop)
    initStagePills();
    
    // Initialize participant pills (hidden but still needed for desktop)
    initParticipantPills();
}

// Initialize mobile dropdowns
function initMobileDropdowns() {
    // Initialize participant dropdown
    initParticipantDropdown();
    
    // Initialize stage dropdown
    initStageDropdown();
}

// Initialize participant dropdown
function initParticipantDropdown() {
    const dropdown = document.getElementById('mobileParticipantDropdown');
    if (!dropdown) return;
    
    dropdown.innerHTML = '<option value="">Kies Equipe...</option>';
    
    participants.forEach(participant => {
        const option = document.createElement('option');
        option.value = participant.name;
        option.textContent = participant.name;
        dropdown.appendChild(option);
    });
}

// Initialize stage dropdown
function initStageDropdown() {
    const dropdown = document.getElementById('mobileStageDropdown');
    if (!dropdown) return;
    
    dropdown.innerHTML = '<option value="">Kies Etappe...</option>';
    
    const maxAvailableStage = Math.min(currentStage, 21);
    const hasEindstand = window.hasEindstandData || currentStage >= 22;
    
    // Regular stages
    for (let i = 1; i <= maxAvailableStage; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `Etappe ${i}`;
        dropdown.appendChild(option);
    }
    
    // Final classification if available
    if (hasEindstand) {
        const option = document.createElement('option');
        option.value = 22;
        option.textContent = 'Eindstand';
        dropdown.appendChild(option);
    }
}

// Initialize stage pills
function initStagePills() {
    const container = document.getElementById('stagePills');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Only show stages up to currentStage
    const maxStage = Math.min(currentStage, 21);
    
    // Add stage pills 1 to current stage
    for (let i = 1; i <= maxStage; i++) {
        const pill = document.createElement('button');
        pill.className = 'stage-pill';
        pill.dataset.stage = i;
        pill.textContent = `Et ${i}`;
        pill.onclick = () => selectStagePill(i);
        container.appendChild(pill);
    }
    
    // Add final classification pill only if we have final results
    if (window.hasEindstandData || currentStage >= 22) {
        const finalPill = document.createElement('button');
        finalPill.className = 'stage-pill final';
        finalPill.dataset.stage = '22';
        finalPill.textContent = 'Eind';
        finalPill.onclick = () => selectStagePill(22);
        container.appendChild(finalPill);
    }
    
    console.log(`📱 Stage pills initialized (showing ${maxStage} stages)`);
}

// Initialize participant pills
function initParticipantPills() {
    const container = document.getElementById('participantPills');
    if (!container || participants.length === 0) return;
    
    container.innerHTML = '';
    
    participants.forEach(participant => {
        const pill = document.createElement('button');
        pill.className = 'participant-pill';
        pill.dataset.participant = participant.name;
        pill.textContent = participant.name;
        pill.onclick = () => selectParticipantPill(participant.name);
        container.appendChild(pill);
    });
    
    console.log('📱 Participant pills initialized');
}

// Handle stage pill selection
function selectStagePill(stageNum) {
    // Update active states
    document.querySelectorAll('.stage-pill').forEach(pill => {
        pill.classList.remove('active');
    });
    
    const selectedPill = document.querySelector(`.stage-pill[data-stage="${stageNum}"]`);
    if (selectedPill) {
        selectedPill.classList.add('active');
        
        // Scroll to active pill
        selectedPill.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
        });
    }
    
    // Update current stage display
    currentStageNum = stageNum;
    updateStageIndicators();
    
    // Update navigation buttons
    updateStageNavigationButtons();
    
    // Show stage content
    showSelectedStage(stageNum.toString());
    
    console.log(`📱 Selected stage ${stageNum}`);
}

// Handle participant pill selection
function selectParticipantPill(participantName) {
    // Update active states
    document.querySelectorAll('.participant-pill').forEach(pill => {
        pill.classList.remove('active');
    });
    
    const selectedPill = document.querySelector(`.participant-pill[data-participant="${participantName}"]`);
    if (selectedPill) {
        selectedPill.classList.add('active');
        
        // Scroll to active pill
        selectedPill.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
        });
    }
    
    // Update current selection display
    const display = document.getElementById('currentParticipantDisplay');
    if (display) {
        display.textContent = participantName;
    }
    
    // Show participant team
    showSelectedParticipantTeam(participantName);
    
    // For mobile, also show inline team data
    if (window.innerWidth <= 768) {
        showMobileParticipantTeam(participantName);
    }
    
    console.log(`📱 Selected participant ${participantName}`);
}

// Show participant team inline for mobile
function showMobileParticipantTeam(participantName) {
    const participant = participants.find(p => p.name === participantName);
    if (!participant) return;
    
    const matrixContainer = document.querySelector('.matrix-container');
    if (!matrixContainer) return;
    
    // Clear existing content
    matrixContainer.innerHTML = '';
    
    // Create mobile team display
    const teamDisplay = document.createElement('div');
    teamDisplay.className = 'mobile-team-display';
    teamDisplay.innerHTML = `
        <h3>${participant.name}'s Equipe</h3>
        <div class="mobile-team-grid">
            ${participant.team.map((rider, index) => {
                // Safely get rider data from global allRiders array to prevent data corruption
                const globalRider = allRiders.find(r => r.name === rider.name);
                const riderData = globalRider || rider;
                const totalPoints = riderData.totalPoints || 0;
                const status = riderData.status || 'active';
                
                return `
                    <div class="mobile-team-rider">
                        <span class="rider-name">${rider.name}</span>
                        <span class="rider-points">${totalPoints} pts</span>
                        <span class="rider-status ${status === 'dropped' ? 'dropped' : 'active'}">
                            ${status === 'dropped' ? '🔴' : '🟢'}
                        </span>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    matrixContainer.appendChild(teamDisplay);
    
    console.log(`📱 Showing team for ${participantName}`);
}

// Update stage navigation buttons
function updateStageNavigationButtons() {
    const prevBtn = document.getElementById('prevStageBtn');
    const nextBtn = document.getElementById('nextStageBtn');
    
    const maxAvailableStage = Math.min(currentStage, 21);
    const hasEindstand = window.hasEindstandData || currentStage >= 22;
    const maxStage = hasEindstand ? 22 : maxAvailableStage;
    
    if (prevBtn) {
        prevBtn.disabled = currentStageNum <= 1;
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentStageNum >= maxStage;
    }
}

// Enhance existing functions to initialize pills
const originalPopulateEtapeSelector = populateEtapeSelector;
populateEtapeSelector = function() {
    originalPopulateEtapeSelector();
    if (window.innerWidth <= 768) {
        initStagePills();
    }
};

// populateParticipantSelector doesn't exist, using updateParticipantSelector instead

// Initialize pills when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (window.innerWidth <= 768) {
        setTimeout(() => {
            initMobilePillSelectors();
        }, 1000); // Wait for data to load
    }
});

// ============= PODIUM MODAL =============

function showPodiumModal(positionClass, position, scoreType, participantsJson, points, subtitle) {
    const participants = JSON.parse(participantsJson.replace(/&quot;/g, '"'));
    
    // Create modal HTML
    const modalHtml = `
        <div id="podiumModal" class="podium-modal">
            <div class="podium-modal-content">
                <div class="podium-modal-header">
                    <h2 class="podium-modal-title">
                        ${parseInt(position) === 2 ? '🥈 Zilveren Medaille' : '🥉 Bronzen Medaille'}
                    </h2>
                    <button class="podium-modal-close" onclick="closePodiumModal()">&times;</button>
                </div>
                
                <div class="podium-modal-body">
                    <div class="festive-podium ${positionClass}">
                        <div class="confetti-container">
                            <div class="confetti"></div>
                            <div class="confetti"></div>
                            <div class="confetti"></div>
                            <div class="confetti"></div>
                            <div class="confetti"></div>
                        </div>
                        
                        <div class="podium-modal-card">
                            <div class="podium-modal-points">${points}</div>
                            
                            <div class="podium-modal-participants">
                                <div class="participants-grid">
                                    ${participants.map((p, index) => `
                                        <div class="participant-item">
                                            <span class="participant-number">${position}</span>
                                            <span class="participant-name">${p.name}</span>
                                            <span class="participant-medal">${parseInt(position) === 2 ? '🥈' : '🥉'}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Show modal with animation
    const modal = document.getElementById('podiumModal');
    setTimeout(() => modal.classList.add('show'), 10);
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
}

function closePodiumModal() {
    const modal = document.getElementById('podiumModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
            document.body.style.overflow = '';
        }, 300);
    }
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('podium-modal')) {
        closePodiumModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closePodiumModal();
    }
});