// Tour de France Poule 2024 - Excel Configuration & Constants

// Performance optimization - Reusable templates (global access)
window.EMPTY_POINTS_TEMPLATE = new Array(22).fill(0);
window.EMPTY_STAGE_POINTS_TEMPLATE = new Array(22).fill(0);

// Excel parsing configuration
const ExcelConfig = {
    // Required worksheet names
    REQUIRED_SHEETS: {
        RIDERS: 'Renners',
        PARTICIPANTS: 'Deelnemers', 
        RESULTS: ['Huidig', 'Etappe uitslagen']
    },
    
    // Optional worksheet names  
    OPTIONAL_SHEETS: {
        DROPOUTS: 'Uitvallers',
        STAGE_POINTS: 'Etappe punten',
        FINAL_POINTS: 'Eindklassement punten'
    },
    
    // Excel structure constants
    STRUCTURE: {
        // Regular stages: columns B:V, rider data starts at Excel row 6 (index 5)
        REGULAR_STAGES: {
            RIDER_START_ROW: 5,
            JERSEY_ROWS: {
                YELLOW: 15,
                GREEN: 16, 
                WHITE: 17,
                POLKA: 18
            }
        },
        
        // Final classification: columns W:X, data starts at Excel row 2 (index 1)
        FINAL_CLASSIFICATION: {
            RIDER_START_ROW: 1,
            MAX_ROWS: 30
        },
        
        // Stage metadata rows (Excel rows 2-5)
        METADATA_ROWS: {
            DATE: 1,
            ROUTE: 2, 
            DISTANCE: 3,
            TYPE: 4
        }
    },
    
    // Default scoring system
    SCORING: {
        STAGE_POINTS: {
            1: 30, 2: 15, 3: 12, 4: 9, 5: 8,
            6: 7, 7: 6, 8: 5, 9: 4, 10: 3
        },
        
        JERSEY_POINTS: {
            'geel': 10,
            'groen': 5, 
            'bolletjes': 5,
            'wit': 3
        },
        
        // Default final classification points
        FINAL_POINTS: {
            1: 150, 2: 75, 3: 50, 4: 40, 5: 35,
            6: 30, 7: 28, 8: 26, 9: 24, 10: 22,
            11: 20, 12: 18, 13: 17, 14: 16, 15: 15,
            16: 14, 17: 13, 18: 12, 19: 11, 20: 10,
            'groen 1': 40, 'groen 2': 20, 'groen 3': 10,
            'bolletjes 1': 40, 'bolletjes 2': 20, 'bolletjes 3': 10,
            'wit 1': 20, 'wit 2': 10, 'wit 3': 5
        }
    },
    
    // Validation rules
    VALIDATION: {
        MIN_PARTICIPANTS: 1,
        MAX_PARTICIPANTS: 50,
        RIDERS_PER_PARTICIPANT: 12,
        MAX_STAGES: 22,
        MIN_RIDER_NAME_LENGTH: 2
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ExcelConfig, EMPTY_POINTS_TEMPLATE, EMPTY_STAGE_POINTS_TEMPLATE };
}