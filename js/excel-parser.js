// Tour de France Poule 2024 - Excel Parsing Utilities

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

// Excel parsing utilities
const ExcelParser = {
    // Validate Excel workbook structure
    validateWorkbook: (workbook) => {
        const errors = [];
        
        // Check required sheets
        if (!workbook.SheetNames.includes(ExcelConfig.REQUIRED_SHEETS.RIDERS)) {
            errors.push(`Tab "${ExcelConfig.REQUIRED_SHEETS.RIDERS}" niet gevonden`);
        }
        
        if (!workbook.SheetNames.includes(ExcelConfig.REQUIRED_SHEETS.PARTICIPANTS)) {
            errors.push(`Tab "${ExcelConfig.REQUIRED_SHEETS.PARTICIPANTS}" niet gevonden`);
        }
        
        // Check for at least one results tab
        const hasResultsTab = ExcelConfig.REQUIRED_SHEETS.RESULTS.some(sheetName => 
            workbook.SheetNames.includes(sheetName)
        );
        
        if (!hasResultsTab) {
            errors.push(`Een van deze tabs is vereist: ${ExcelConfig.REQUIRED_SHEETS.RESULTS.join(', ')}`);
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    },
    
    // Parse riders sheet
    parseRiders: (workbook) => {
        const rennersSheet = workbook.Sheets[ExcelConfig.REQUIRED_SHEETS.RIDERS];
        const rennersData = XLSX.utils.sheet_to_json(rennersSheet, {header: 1});
        
        const riders = {};
        let validRiders = 0;
        let emptyRows = 0;
        
        if (rennersData && rennersData.length > 1) {
            for (let i = 1; i < rennersData.length; i++) { // Skip header
                if (rennersData[i][0] && rennersData[i][0].toString().trim() !== '') {
                    const riderName = rennersData[i][0].toString().trim();
                    const teamName = rennersData[i][1] || 'Onbekend';
                    
                    riders[riderName] = {
                        name: riderName,
                        team: teamName,
                        points: [...window.EMPTY_POINTS_TEMPLATE],
                        status: 'active',
                        inTeam: false
                    };
                    validRiders++;
                } else {
                    emptyRows++;
                }
            }
        }
        
        ErrorHandler.success('PARSER', `Parsed ${validRiders} riders, ${emptyRows} empty rows`);
        return riders;
    },
    
    // Parse participants sheet  
    parseParticipants: (workbook, availableRiders) => {
        const deelnemersSheet = workbook.Sheets[ExcelConfig.REQUIRED_SHEETS.PARTICIPANTS];
        const deelnemersData = XLSX.utils.sheet_to_json(deelnemersSheet, {header: 1});
        
        const participants = [];
        
        if (deelnemersData && deelnemersData.length > 0) {
            const headerRow = deelnemersData[0];
            
            // Loop through all columns (participants)
            for (let col = 0; col < headerRow.length; col++) {
                const participantName = headerRow[col];
                if (participantName && participantName.trim() !== '') {
                    
                    // Collect 12 riders for this participant (rows 1-12)
                    const team = [];
                    for (let row = 1; row <= ExcelConfig.VALIDATION.RIDERS_PER_PARTICIPANT; row++) {
                        if (deelnemersData[row] && deelnemersData[row][col]) {
                            const riderName = deelnemersData[row][col];
                            team.push({
                                name: riderName,
                                points: [...window.EMPTY_POINTS_TEMPLATE],
                                status: "active"
                            });
                        }
                    }
                    
                    if (team.length > 0) {
                        participants.push({
                            name: participantName,
                            totalPoints: 0,
                            dailyWins: 0,
                            stagePoints: [...window.EMPTY_STAGE_POINTS_TEMPLATE],
                            team: team
                        });
                    }
                }
            }
        }
        
        ErrorHandler.success('PARSER', `Parsed ${participants.length} participants`);
        return participants;
    },
    
    // Parse dropouts sheet
    parseDropouts: (workbook) => {
        if (!workbook.SheetNames.includes(ExcelConfig.OPTIONAL_SHEETS.DROPOUTS)) {
            return [];
        }
        
        const uitvallersSheet = workbook.Sheets[ExcelConfig.OPTIONAL_SHEETS.DROPOUTS];
        const uitvallersData = XLSX.utils.sheet_to_json(uitvallersSheet, {header: 1});
        
        const dropouts = [];
        
        if (uitvallersData && uitvallersData.length > 1) {
            for (let row = 1; row < uitvallersData.length; row++) {
                if (uitvallersData[row] && uitvallersData[row][0]) {
                    const riderName = uitvallersData[row][0].toString().trim();
                    if (riderName && riderName !== '') {
                        dropouts.push(riderName);
                    }
                }
            }
        }
        
        ErrorHandler.log('PARSER', `Found ${dropouts.length} dropouts`);
        return dropouts;
    },
    
    // Get results sheet name
    getResultsSheetName: (workbook) => {
        // Priority order: 'Huidig' > 'Etappe uitslagen'
        for (const sheetName of ExcelConfig.REQUIRED_SHEETS.RESULTS) {
            if (workbook.SheetNames.includes(sheetName)) {
                return sheetName;
            }
        }
        throw new Error('Geen geschikte etappe uitslagen tab gevonden');
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ExcelParser, excelDateToJSDate };
}