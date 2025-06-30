// Excel File Persistence Module
// Auto-loads Excel files from GitHub and saves to localStorage for offline use

// Auto-save Excel to localStorage after processing
function saveExcelLocally(file) {
    try {
        console.log('💾 Saving Excel to localStorage...');
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64Data = btoa(String.fromCharCode(...new Uint8Array(e.target.result)));
            localStorage.setItem('excel-file-backup', base64Data);
            localStorage.setItem('excel-file-name', file.name);
            localStorage.setItem('excel-file-date', new Date().toISOString());
            console.log('✅ Excel saved locally');
        };
        reader.readAsArrayBuffer(file);
        
    } catch (error) {
        console.warn('⚠️ Could not save Excel locally:', error);
    }
}

// Load Excel file from localStorage
async function loadSavedExcel() {
    try {
        const savedExcelData = localStorage.getItem('excel-file-backup');
        const savedFileName = localStorage.getItem('excel-file-name');
        const savedDate = localStorage.getItem('excel-file-date');
        
        if (savedExcelData && savedFileName) {
            console.log(`📊 Found saved Excel: ${savedFileName} (${savedDate})`);
            
            // Convert base64 back to Blob
            const binaryString = atob(savedExcelData);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
            const file = new File([blob], savedFileName, {type: blob.type});
            
            // Show loading message
            const loadingMsg = document.createElement('div');
            loadingMsg.style.cssText = 'position: fixed; top: 20px; right: 20px; background: rgba(40, 167, 69, 0.9); color: white; padding: 15px; border-radius: 8px; z-index: 9999;';
            loadingMsg.innerHTML = `📊 Auto-loading: ${savedFileName}`;
            document.body.appendChild(loadingMsg);
            
            // Process Excel data
            const fakeEvent = { target: { files: [file], value: '' } };
            setTimeout(() => {
                if (typeof handleExcelFile === 'function') {
                    handleExcelFile(fakeEvent);
                }
                setTimeout(() => loadingMsg.remove(), 3000);
            }, 500);
            
            return true;
        } else {
            console.log('📭 No saved Excel file found');
            return false;
        }
        
    } catch (error) {
        console.error('⚠️ Error loading saved Excel:', error);
        return false;
    }
}

// Check for Excel file in GitHub repository
async function checkForGitHubExcel() {
    try {
        // Detect year from URL path (e.g., /2024/, /2023/)
        const currentYear = detectYearFromUrl();
        console.log('🗓️ Detected year:', currentYear);
        
        // Only load current year data - no year-specific files
        const possiblePaths = [
            'tdf-current.xlsx',
            'data/tdf-current.xlsx'
        ];
        
        // Auto-detect repository info from current URL
        let repoUrl = '';
        const currentUrl = window.location.href;
        if (currentUrl.includes('github.io')) {
            const parts = currentUrl.split('.github.io')[0].split('//')[1];
            const repoName = currentUrl.split('/')[3] || 'Tourploeg';
            repoUrl = `https://raw.githubusercontent.com/${parts}/${repoName}/main/`;
        } else {
            // Local testing fallback - try relative path
            console.log('🏠 Local testing detected - trying relative path');
            console.log('🏠 Current URL:', currentUrl);
            repoUrl = './';
        }
        
        for (const path of possiblePaths) {
            try {
                // Add cache busting parameter
                const cacheBuster = `?v=${Date.now()}`;
                const fullUrl = repoUrl + path + cacheBuster;
                console.log(`🔍 Trying to fetch: ${fullUrl}`);
                
                const response = await fetch(fullUrl);
                console.log(`📡 Response status: ${response.status} for ${path}`);
                
                if (response.ok) {
                    console.log(`📊 Found Excel file at: ${path} (cache-busted)`);
                    
                    const arrayBuffer = await response.arrayBuffer();
                    const workbook = XLSX.read(arrayBuffer, {type: 'array'});
                    
                    // Show loading message
                    const loadingMsg = document.createElement('div');
                    loadingMsg.style.cssText = 'position: fixed; top: 20px; right: 20px; background: rgba(40, 167, 69, 0.9); color: white; padding: 15px; border-radius: 8px; z-index: 9999;';
                    loadingMsg.innerHTML = `🌐 Auto-loading: ${path}`;
                    document.body.appendChild(loadingMsg);
                    
                    // Process Excel data
                    parseExcelData(workbook);
                    
                    // Save to localStorage for offline access
                    const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
                    localStorage.setItem('excel-file-backup', base64Data);
                    localStorage.setItem('excel-file-name', path);
                    localStorage.setItem('excel-file-date', new Date().toISOString());
                    
                    setTimeout(() => loadingMsg.remove(), 3000);
                    return true;
                }
            } catch (error) {
                continue; // Try next path
            }
        }
        
        console.log('📭 No Excel file found in GitHub repository');
        return false;
        
    } catch (error) {
        console.log('⚠️ Could not check GitHub:', error.message);
        return false;
    }
}

// Enhanced Excel file handler with auto-save
function handleExcelFileWithAutoSave(event) {
    console.log('📁 Processing Excel with auto-save...');
    const file = event.target.files[0];
    if (!file) return;
    
    // Process the file first
    handleExcelFile(event);
    
    // Save to localStorage after processing
    setTimeout(() => {
        if (participants && participants.length > 0) {
            saveExcelLocally(file);
        }
    }, 1000);
}

// Initialize Excel persistence on page load
async function initializeExcelPersistence() {
    console.log('🔄 Initializing Excel persistence...');
    
    // ALWAYS start with complete fresh reset
    console.log('🧹 Complete fresh start - clearing all data...');
    participants = [];
    allRiders = [];
    currentStage = 1;
    window.etappeInfoData = null;
    window.hasEindstandData = false;
    
    // Clear ALL localStorage completely
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
        
        console.log('🗑️ Persistence: ALL cache cleared');
    } catch(e) {
        console.log('⚠️ Could not clear localStorage:', e);
    }
    
    // Try to auto-load tdf-current.xlsx from GitHub with cache busting
    console.log('🔍 Checking for tdf-current.xlsx...');
    const githubLoaded = await checkForGitHubExcel();
    
    if (!githubLoaded) {
        console.log('📭 No tdf-current.xlsx found - manual upload required');
    }
    
    // Set up enhanced file input handler
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
        console.log('🔧 Setting up enhanced file handler');
        const newFileInput = fileInput.cloneNode(true);
        fileInput.parentNode.replaceChild(newFileInput, fileInput);
        newFileInput.addEventListener('change', handleExcelFileWithAutoSave);
    }
    
    console.log('✅ Excel persistence initialized');
}

// Year detection and multi-year support
function detectYearFromUrl() {
    const path = window.location.pathname;
    const yearMatch = path.match(/\/(\d{4})\//);
    return yearMatch ? yearMatch[1] : new Date().getFullYear().toString();
}

// Load historic data from tdf-${year}.xlsx
async function loadHistoricData(year) {
    try {
        console.log(`📚 Loading historic data for year ${year}...`);
        
        // Try to load tdf-${year}.xlsx
        const possiblePaths = [
            `tdf-${year}.xlsx`,
            `data/tdf-${year}.xlsx`
        ];
        
        // Auto-detect repository info from current URL
        let repoUrl = '';
        const currentUrl = window.location.href;
        if (currentUrl.includes('github.io')) {
            const parts = currentUrl.split('.github.io')[0].split('//')[1];
            const repoName = currentUrl.split('/')[3] || 'Tourploeg';
            repoUrl = `https://raw.githubusercontent.com/${parts}/${repoName}/main/`;
        } else {
            // Local testing - try relative path
            repoUrl = './';
        }
        
        for (const path of possiblePaths) {
            try {
                // Add cache busting parameter for historic files too
                const cacheBuster = `?v=${Date.now()}`;
                const response = await fetch(repoUrl + path + cacheBuster);
                if (response.ok) {
                    console.log(`📊 Found historic file at: ${path} (cache-busted)`);
                    
                    const arrayBuffer = await response.arrayBuffer();
                    const workbook = XLSX.read(arrayBuffer, {type: 'array'});
                    
                    // Show loading message
                    const loadingMsg = document.createElement('div');
                    loadingMsg.style.cssText = 'position: fixed; top: 20px; right: 20px; background: rgba(40, 167, 69, 0.9); color: white; padding: 15px; border-radius: 8px; z-index: 9999;';
                    loadingMsg.innerHTML = `🕰️ Loading historic data: ${year}`;
                    document.body.appendChild(loadingMsg);
                    
                    // Process using standard Excel parsing (same as current file)
                    parseExcelData(workbook);
                    
                    // Update page title to show historic year
                    const headerTitle = document.querySelector('.header h1');
                    if (headerTitle) {
                        headerTitle.textContent = `🚴‍♂️ Tour de France Poule ${year}`;
                    }
                    
                    // Hide upload tab for historic data
                    const uploadTab = document.querySelector('[onclick="showTab(\'upload\')"]');
                    if (uploadTab) {
                        uploadTab.style.display = 'none';
                    }
                    
                    setTimeout(() => loadingMsg.remove(), 3000);
                    return true;
                }
            } catch (error) {
                continue; // Try next path
            }
        }
        
        console.log(`📭 No historic data found for year ${year}`);
        return false;
        
    } catch (error) {
        console.log('⚠️ Could not load historic data:', error.message);
        return false;
    }
}

// Process historic data using the same structure as current Excel
function processHistoricData(data, year) {
    console.log(`🏆 Processing historic data for ${year}:`, data);
    
    // Update page title to show year
    const headerTitle = document.querySelector('.header h1');
    if (headerTitle) {
        headerTitle.textContent = `🚴‍♂️ Tour de France Poule ${year}`;
    }
    
    // Parse historic data assuming same structure as current Excel with sheets:
    // Row structure: Deelnemers, Renners, Etappe uitslagen etc.
    try {
        // The data is already in array format from the year tab
        // We need to simulate the multi-sheet structure for processExcelData
        
        // Extract sections from the single sheet:
        // Assume structure: Deelnemers (rows 1-13), Renners (rows 15+), Etappe uitslagen (separate section)
        
        const deelnemersData = [];
        const rennersData = [];
        const uitlagenData = [];
        
        // Find section headers to split the data
        let currentSection = 'unknown';
        let deelnemersStart = -1;
        let rennersStart = -1;
        let uitlagenStart = -1;
        
        for (let i = 0; i < data.length; i++) {
            const firstCell = data[i] && data[i][0] ? data[i][0].toString().toLowerCase() : '';
            
            if (firstCell.includes('deelnemer') || firstCell.includes('naam')) {
                deelnemersStart = i;
                currentSection = 'deelnemers';
            } else if (firstCell.includes('renner') && !firstCell.includes('deelnemer')) {
                rennersStart = i;
                currentSection = 'renners';
            } else if (firstCell.includes('uitslag') || firstCell.includes('etappe') || firstCell === 'positie') {
                uitlagenStart = i;
                currentSection = 'uitslagen';
            }
        }
        
        // Extract deelnemers data (typically first 13 rows after header)
        if (deelnemersStart >= 0) {
            for (let i = deelnemersStart; i < Math.min(data.length, deelnemersStart + 15); i++) {
                if (data[i]) deelnemersData.push(data[i]);
            }
        }
        
        // Extract uitslagen data (large section)
        if (uitlagenStart >= 0) {
            for (let i = uitlagenStart; i < data.length; i++) {
                if (data[i]) uitlagenData.push(data[i]);
            }
        }
        
        console.log(`📊 Historic data sections found:`, {
            deelnemers: deelnemersData.length,
            uitslagen: uitlagenData.length
        });
        
        // Process using existing Excel processing logic
        if (deelnemersData.length > 0 && uitlagenData.length > 0) {
            processExcelData(rennersData, deelnemersData, uitlagenData, null, null);
            
            // Hide upload tab for historic data
            const uploadTab = document.querySelector('[onclick="showTab(\'upload\')"]');
            if (uploadTab) {
                uploadTab.style.display = 'none';
            }
            
            // Show historic notice instead of getting started
            const gettingStarted = document.getElementById('gettingStarted');
            if (gettingStarted) {
                gettingStarted.innerHTML = `
                    <h2>📚 Historische Data - ${year}</h2>
                    <p style="font-size: 1.1em; margin: 20px 0;">Je bekijkt de eindresultaten van Tour de France ${year}</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <div style="background: rgba(255,255,255,0.2); padding: 20px; border-radius: 10px; max-width: 400px; margin: 0 auto;">
                            <h3>🏆 ${year} Eindstand</h3>
                            <p>Alle resultaten en statistieken<br>van het ${year} seizoen</p>
                            <a href="../" class="btn" style="margin-top: 10px; text-decoration: none; display: inline-block;">🔙 Terug naar Huidig Jaar</a>
                        </div>
                    </div>
                `;
                gettingStarted.style.display = 'block';
            }
        } else {
            throw new Error('Incomplete historic data structure');
        }
        
    } catch (error) {
        console.error('❌ Error processing historic data:', error);
        
        // Fallback: show basic historic notice
        const gettingStarted = document.getElementById('gettingStarted');
        if (gettingStarted) {
            gettingStarted.innerHTML = `
                <h2>📚 Historische Data - ${year}</h2>
                <p style="color: #ff6b35;">Data structuur niet ondersteund voor jaar ${year}</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="../" class="btn">🔙 Terug naar Huidig Jaar</a>
                </div>
            `;
            gettingStarted.style.display = 'block';
        }
    }
}

// Enhanced initialization with year detection
async function initializeMultiYearExcelPersistence() {
    console.log('🔄 Initializing multi-year Excel persistence...');
    
    const currentYear = detectYearFromUrl();
    
    if (currentYear !== new Date().getFullYear().toString()) {
        // Historic year - try to load from historie file
        const historicLoaded = await loadHistoricData(currentYear);
        if (historicLoaded) {
            console.log(`✅ Historic data loaded for ${currentYear}`);
            return;
        }
    }
    
    // Current year or fallback - use normal initialization
    await initializeExcelPersistence();
}

// Scan for available historic years (tdf-*.xlsx files)
async function scanAvailableYears() {
    const currentYear = new Date().getFullYear();
    const availableYears = [];
    
    // Auto-detect repository info from current URL
    let repoUrl = '';
    const currentUrl = window.location.href;
    if (currentUrl.includes('github.io')) {
        const parts = currentUrl.split('.github.io')[0].split('//')[1];
        const repoName = currentUrl.split('/')[3] || 'Tourploeg';
        repoUrl = `https://raw.githubusercontent.com/${parts}/${repoName}/main/`;
    } else {
        // Local testing - try relative path
        repoUrl = './';
    }
    
    // Try years from 2020 to current year
    for (let year = 2020; year <= currentYear; year++) {
        if (year === currentYear) continue; // Skip current year (use tdf-current.xlsx)
        
        const possiblePaths = [
            `tdf-${year}.xlsx`,
            `data/tdf-${year}.xlsx`
        ];
        
        for (const path of possiblePaths) {
            try {
                // Add cache busting for availability check too
                const cacheBuster = `?v=${Date.now()}`;
                const response = await fetch(repoUrl + path + cacheBuster, { method: 'HEAD' }); // Only check if file exists
                if (response.ok) {
                    availableYears.push(year);
                    console.log(`✅ Found historic file: ${path}`);
                    break; // Found this year, move to next
                }
            } catch (error) {
                continue; // Try next path
            }
        }
    }
    
    console.log(`📅 Available historic years:`, availableYears);
    return availableYears.sort((a, b) => b - a); // Sort descending (newest first)
}

// Export functions for global access
window.ExcelPersistence = {
    load: loadSavedExcel,
    checkGitHub: checkForGitHubExcel,
    initialize: initializeExcelPersistence,
    initializeMultiYear: initializeMultiYearExcelPersistence,
    loadHistoric: loadHistoricData,
    detectYear: detectYearFromUrl,
    scanYears: scanAvailableYears
};