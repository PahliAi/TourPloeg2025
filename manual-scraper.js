// Manual trigger scraper for Tour de France data
// Usage: node manual-scraper.js <year> <stage>
// Examples: 
//   node manual-scraper.js 2024 15
//   node manual-scraper.js 2024 end (for final classification)

const axios = require('axios');
const cheerio = require('cheerio');

// Email configuration - UPDATE THESE WITH YOUR SETTINGS
const EMAIL_CONFIG = {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'your-email@gmail.com',  // UPDATE THIS
        pass: 'your-app-password'      // UPDATE THIS (use app password, not regular password)
    }
};

const RECIPIENT_EMAIL = 'your-email@gmail.com';  // UPDATE THIS

// Function to format stage data for Excel copy-paste
function formatStageDataForEmail(stageData) {
    let content = `STAGE ${stageData.stage} RESULTS - ${stageData.year}\n`;
    content += `Scraped: ${new Date(stageData.scrapedAt).toLocaleString()}\n\n`;
    
    content += `TOP 10 STAGE RESULTS:\n`;
    content += `Position\tRider\n`;
    stageData.top10.forEach(result => {
        content += `${result.position}\t${result.rider}\n`;
    });
    
    content += `\nJERSEY LEADERS AFTER STAGE ${stageData.stage}:\n`;
    content += `Jersey\tRider\n`;
    content += `🟡 Geel (GC)\t${stageData.jerseys.geel || 'Not found'}\n`;
    content += `🟢 Groen (Points)\t${stageData.jerseys.groen || 'Not found'}\n`;
    content += `🔴 Bolletjes (Mountains)\t${stageData.jerseys.bolletjes || 'Not found'}\n`;
    content += `⚪ Wit (Youth)\t${stageData.jerseys.wit || 'Not found'}\n`;
    
    return content;
}

// Function to format final classification data for Excel copy-paste
function formatFinalDataForEmail(finalData) {
    let content = `FINAL CLASSIFICATION - ${finalData.year}\n`;
    content += `Scraped: ${new Date(finalData.scrapedAt).toLocaleString()}\n\n`;
    
    content += `TOP 20 GENERAL CLASSIFICATION:\n`;
    content += `Position\tRider\n`;
    finalData.top20.forEach(result => {
        content += `${result.position}\t${result.rider}\n`;
    });
    
    content += `\nGREEN JERSEY (POINTS) - TOP 3:\n`;
    content += `Position\tRider\n`;
    finalData.jerseys.groen.forEach(result => {
        content += `${result.position}\t${result.rider}\n`;
    });
    
    content += `\nPOLKA DOT JERSEY (MOUNTAINS) - TOP 3:\n`;
    content += `Position\tRider\n`;
    finalData.jerseys.bolletjes.forEach(result => {
        content += `${result.position}\t${result.rider}\n`;
    });
    
    content += `\nWHITE JERSEY (YOUTH) - TOP 3:\n`;
    content += `Position\tRider\n`;
    finalData.jerseys.wit.forEach(result => {
        content += `${result.position}\t${result.rider}\n`;
    });
    
    return content;
}

// Function to display email content on screen
async function sendEmail(subject, content) {
    console.log('\n' + '='.repeat(80));
    console.log('📧 EMAIL CONTENT (Ready for copy-paste to Excel)');
    console.log('='.repeat(80));
    console.log('Subject:', subject);
    console.log('='.repeat(80));
    console.log(content);
    console.log('='.repeat(80));
    console.log('✅ Email content displayed above (copy the tab-separated data to Excel)');
}

// Import the scraping functions from precise-scraper.js
// (We'll copy the functions here to keep it self-contained)

// Helper function to extract clean rider name from contaminated string
function extractRiderName(contaminatedName) {
    if (!contaminatedName) return null;
    
    // Pattern: "Pogačar TadejUAE Team Emirates" -> "Pogačar Tadej"
    // Strategy: Find where the team name starts (usually after a capital letter followed by more capitals)
    
    // First, try to find common team name patterns
    const teamPatterns = [
        /UAE Team Emirates/,
        /Team Visma \\| Lease a Bike/,
        /Soudal Quick-Step/,
        /INEOS Grenadiers/,
        /Alpecin - Deceuninck/,
        /Bahrain - Victorious/,
        /EF Education - EasyPost/,
        /Intermarché - Wanty/,
        /Red Bull - BORA - hansgrohe/,
        /Lidl - Trek/,
        /Lotto Dstny/,
        /Cofidis/,
        /Movistar Team/,
        /TotalEnergies/,
        /Groupama - FDJ/,
        /Uno-X Mobility/,
        /Decathlon AG2R La Mondiale Team/,
        /Team Jayco AlUla/,
        /Israel - Premier Tech/
    ];
    
    // Try to remove known team names
    for (let pattern of teamPatterns) {
        if (pattern.test(contaminatedName)) {
            const cleanName = contaminatedName.replace(pattern, '').trim();
            if (cleanName.length > 0) {
                return cleanName;
            }
        }
    }
    
    // Fallback: try to detect where team name starts
    // Look for pattern where a lowercase letter is followed by an uppercase letter (likely start of team)
    const match = contaminatedName.match(/^(.+?)([a-z])([A-Z].*)$/);
    if (match) {
        return (match[1] + match[2]).trim();
    }
    
    // If all else fails, return as-is
    return contaminatedName.trim();
}

// Function to scrape jersey leader from classification page
async function scrapeJerseyLeader(year, stage, classification) {
    const url = `https://www.procyclingstats.com/race/tour-de-france/${year}/stage-${stage}-${classification}`;
    
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const $ = cheerio.load(response.data);
        
        // Different table targeting strategy for each classification
        let leader = null;
        
        // Map classification to expected table characteristics
        const tableTargets = {
            'gc': { rows: 152, nameColumn: 5 },      // GC classification (Table 2)
            'points': { rows: 119, nameColumn: 5 },  // Points classification
            'kom': { rows: 47, nameColumn: 5 },      // Mountains classification
            'youth': { rows: 33, nameColumn: 5 }     // Youth classification
        };
        
        const target = tableTargets[classification];
        if (!target) {
            console.error(`Unknown classification: ${classification}`);
            return null;
        }
        
        // Find the right table based on row count  
        let gcTableFound = false; // Special handling for GC to skip first table
        $('table').each((tableIndex, table) => {
            if (leader) return; // Already found
            
            const $table = $(table);
            const rows = $table.find('tbody tr');
            
            // Special handling for GC - skip the first matching table (154 rows) and use second (152 rows)
            if (classification === 'gc' && Math.abs(rows.length - target.rows) <= 5) {
                if (!gcTableFound && rows.length > 152) {
                    gcTableFound = true;
                    return; // Skip this table and continue to next
                }
            }
            
            // Look for table with expected row count (±2 tolerance for GC, ±5 for others)
            const tolerance = classification === 'gc' ? 2 : 5;
            if (Math.abs(rows.length - target.rows) <= tolerance) {
                const firstRow = rows.first();
                const cells = firstRow.find('td');
                
                if (cells.length > target.nameColumn) {
                    const position = cells.eq(0).text().trim();
                    if (position === '1') {
                        const contaminatedName = cells.eq(target.nameColumn).text().trim();
                        if (contaminatedName && contaminatedName.length > 3 && !contaminatedName.match(/^\\d+$/)) {
                            leader = extractRiderName(contaminatedName);
                            console.log(`    ${classification} leader: ${leader}`);
                        }
                    }
                }
            }
        });
        
        return leader;
        
    } catch (error) {
        console.error(`❌ Jersey ${classification} scraping failed:`, error.message);
        return null;
    }
}

// Function to scrape stage results
async function scrapeStageResults(year, stage) {
    const url = `https://www.procyclingstats.com/race/tour-de-france/${year}/stage-${stage}`;
    console.log(`🕵️ Scraping stage ${stage}: ${url}`);
    
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const $ = cheerio.load(response.data);
        
        const stageData = {
            stage: stage,
            year: year,
            scrapedAt: new Date().toISOString(),
            top10: [],
            jerseys: {
                geel: null,
                groen: null,
                bolletjes: null,
                wit: null
            }
        };
        
        // Extract stage results
        let tableFound = false;
        $('table').each((tableIndex, table) => {
            if (tableFound) return;
            
            const $table = $(table);
            const rows = $table.find('tbody tr');
            
            if (rows.length >= 150) {
                console.log(`📊 Found stage results table (${rows.length} rows)`);
                tableFound = true;
                
                rows.slice(0, 10).each((rowIndex, row) => {
                    const $row = $(row);
                    const cells = $row.find('td');
                    
                    if (cells.length >= 8) {
                        const position = cells.eq(0).text().trim();
                        const contaminatedName = cells.eq(7).text().trim();
                        
                        if (position.match(/^\d+$/) && contaminatedName) {
                            const cleanName = extractRiderName(contaminatedName);
                            
                            stageData.top10.push({
                                position: parseInt(position),
                                rider: cleanName
                            });
                            
                            console.log(`  ${position}. ${cleanName}`);
                        }
                    }
                });
            }
        });
        
        // Scrape jersey leaders
        console.log(`🏆 Scraping jersey leaders after stage ${stage}...`);
        
        const [geelLeader, groenLeader, bolletjesLeader, witLeader] = await Promise.all([
            scrapeJerseyLeader(year, stage, 'gc'),
            scrapeJerseyLeader(year, stage, 'points'),
            scrapeJerseyLeader(year, stage, 'kom'),
            scrapeJerseyLeader(year, stage, 'youth')
        ]);
        
        stageData.jerseys = {
            geel: geelLeader,
            groen: groenLeader,
            bolletjes: bolletjesLeader,
            wit: witLeader
        };
        
        console.log(`  🟡 Geel: ${geelLeader || 'Not found'}`);
        console.log(`  🟢 Groen: ${groenLeader || 'Not found'}`);
        console.log(`  🔴 Bolletjes: ${bolletjesLeader || 'Not found'}`);
        console.log(`  ⚪ Wit: ${witLeader || 'Not found'}`);
        
        return stageData;
        
    } catch (error) {
        console.error(`❌ Stage ${stage} scraping failed:`, error.message);
        return null;
    }
}

// Function to scrape final classifications
async function scrapeFinalClassifications(year) {
    const url = `https://www.procyclingstats.com/race/tour-de-france/${year}/gc`;
    console.log(`🕵️ Scraping final classifications: ${url}`);
    
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const $ = cheerio.load(response.data);
        
        const finalData = {
            year: year,
            type: 'final_classification',
            scrapedAt: new Date().toISOString(),
            top20: [],
            jerseys: {
                groen: [],
                bolletjes: [],
                wit: []
            }
        };
        
        let tablesProcessed = 0;
        
        $('table').each((tableIndex, table) => {
            const $table = $(table);
            const rows = $table.find('tbody tr');
            
            // Main GC (141 rows) - for top 20 overall (use first occurrence)
            if (rows.length >= 140 && rows.length <= 145 && finalData.top20.length === 0 && tableIndex === 0) {
                console.log(`📊 Found GC table (${rows.length} rows)`);
                
                rows.slice(0, 20).each((rowIndex, row) => {
                    const $row = $(row);
                    const cells = $row.find('td');
                    
                    if (cells.length >= 8) {
                        const position = cells.eq(0).text().trim();
                        const contaminatedName = cells.eq(7).text().trim();
                        
                        if (position.match(/^\d+$/) && contaminatedName) {
                            const cleanName = extractRiderName(contaminatedName);
                            
                            finalData.top20.push({
                                position: parseInt(position),
                                rider: cleanName
                            });
                            
                            console.log(`  GC ${position}. ${cleanName}`);
                        }
                    }
                });
                tablesProcessed++;
            }
            
            // Points classification - for Green jersey top 3
            else if (rows.length >= 120 && rows.length <= 130 && finalData.jerseys.groen.length === 0) {
                console.log(`📊 Found Points classification table (${rows.length} rows)`);
                
                rows.slice(0, 3).each((rowIndex, row) => {
                    const $row = $(row);
                    const cells = $row.find('td');
                    
                    if (cells.length >= 6) {
                        const position = cells.eq(0).text().trim();
                        const contaminatedName = cells.eq(5).text().trim();
                        
                        if (position.match(/^\d+$/) && contaminatedName) {
                            const cleanName = extractRiderName(contaminatedName);
                            
                            finalData.jerseys.groen.push({
                                position: parseInt(position),
                                rider: cleanName
                            });
                            
                            console.log(`  Groen ${position}. ${cleanName}`);
                        }
                    }
                });
                tablesProcessed++;
            }
            
            // Mountains classification - for Polka dot jersey top 3
            else if (rows.length >= 55 && rows.length <= 65 && finalData.jerseys.bolletjes.length === 0) {
                console.log(`📊 Found Mountains classification table (${rows.length} rows)`);
                
                rows.slice(0, 3).each((rowIndex, row) => {
                    const $row = $(row);
                    const cells = $row.find('td');
                    
                    if (cells.length >= 6) {
                        const position = cells.eq(0).text().trim();
                        const contaminatedName = cells.eq(5).text().trim();
                        
                        if (position.match(/^\d+$/) && contaminatedName) {
                            const cleanName = extractRiderName(contaminatedName);
                            
                            finalData.jerseys.bolletjes.push({
                                position: parseInt(position),
                                rider: cleanName
                            });
                            
                            console.log(`  Bolletjes ${position}. ${cleanName}`);
                        }
                    }
                });
                tablesProcessed++;
            }
            
            // Young rider classification - for White jersey top 3
            else if (rows.length >= 30 && rows.length <= 35 && finalData.jerseys.wit.length === 0) {
                console.log(`📊 Found Young rider classification table (${rows.length} rows)`);
                
                rows.slice(0, 3).each((rowIndex, row) => {
                    const $row = $(row);
                    const cells = $row.find('td');
                    
                    if (cells.length >= 6) {
                        const position = cells.eq(0).text().trim();
                        const contaminatedName = cells.eq(5).text().trim();
                        
                        if (position.match(/^\d+$/) && contaminatedName) {
                            const cleanName = extractRiderName(contaminatedName);
                            
                            finalData.jerseys.wit.push({
                                position: parseInt(position),
                                rider: cleanName
                            });
                            
                            console.log(`  Wit ${position}. ${cleanName}`);
                        }
                    }
                });
                tablesProcessed++;
            }
        });
        
        console.log(`✅ Final classifications complete: ${tablesProcessed} tables processed`);
        return finalData;
        
    } catch (error) {
        console.error(`❌ Final classification scraping failed:`, error.message);
        return null;
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length !== 2) {
        console.log('Usage: node manual-scraper.js <year> <stage>');
        console.log('Examples:');
        console.log('  node manual-scraper.js 2024 15    # Stage 15 results + jerseys');
        console.log('  node manual-scraper.js 2024 end   # Final classification only');
        process.exit(1);
    }
    
    const year = parseInt(args[0]);
    const stage = args[1];
    
    if (!year || year < 2020 || year > 2030) {
        console.error('❌ Invalid year. Use a year between 2020-2030.');
        process.exit(1);
    }
    
    console.log(`🕵️ Starting manual scrape: ${year} - ${stage}`);
    
    if (stage === 'end') {
        // Scrape final classification and send email
        const finalData = await scrapeFinalClassifications(year);
        if (finalData) {
            const subject = `TDF ${year} - Final Classification`;
            const content = formatFinalDataForEmail(finalData);
            await sendEmail(subject, content);
        }
    } else {
        // Scrape stage results + jerseys and send email
        const stageNum = parseInt(stage);
        if (!stageNum || stageNum < 1 || stageNum > 21) {
            console.error('❌ Invalid stage. Use 1-21 or "end".');
            process.exit(1);
        }
        
        const stageData = await scrapeStageResults(year, stageNum);
        if (stageData) {
            const subject = `TDF ${year} - Stage ${stageNum} Results`;
            const content = formatStageDataForEmail(stageData);
            await sendEmail(subject, content);
        }
    }
    
    console.log('🕵️ Manual scrape complete!');
}

main().catch(console.error);