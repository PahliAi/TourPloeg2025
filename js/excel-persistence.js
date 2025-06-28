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
        // Try different possible locations for the Excel file
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
            // Fallback - will need manual configuration
            console.log('💡 For GitHub auto-loading, deploy to GitHub Pages');
            return false;
        }
        
        for (const path of possiblePaths) {
            try {
                const response = await fetch(repoUrl + path);
                if (response.ok) {
                    console.log(`📊 Found Excel file at: ${path}`);
                    
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
    
    // First, try to load from GitHub
    const githubLoaded = await checkForGitHubExcel();
    
    if (!githubLoaded) {
        // Fallback to localStorage
        const localLoaded = await loadSavedExcel();
        if (!localLoaded) {
            console.log('🆕 No saved Excel file found - awaiting upload');
        }
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

// Export functions for global access
window.ExcelPersistence = {
    load: loadSavedExcel,
    checkGitHub: checkForGitHubExcel,
    initialize: initializeExcelPersistence
};