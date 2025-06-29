# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Tour de France betting pool website - a single-page application built with pure HTML, CSS, and JavaScript. The application allows users to:

- Upload team/participant data (JSON or Excel format)
- Track stage results and daily points
- View participant rankings and rider performance
- Display podiums for general classification, daily winners, and most stage wins
- Show rider selection matrix and daily prize tables

## Architecture

**Single File Application**: The entire application is contained in `tour-poule-website.html` - a self-contained HTML file with embedded CSS and JavaScript.

**Key Components**:
- Tab-based navigation system (Home, Participants, Riders, Matrix, Daily Prizes, Admin)
- File upload system for team data and stage results
- Real-time data processing and scoring calculations
- Responsive tables with sticky headers
- Modal detail views for participant teams

**Data Structure**:
- Participants: Each has a name, 12 selected riders, total points, and daily wins
- Riders: Track points per stage, team affiliation, and dropout status
- Stages: Process top-10 results, jersey holders, and story content
- Eindstand: Final classification with separate point system (rows 2-30 in Excel)

**Scoring System**:
- Stage results: 30, 15, 12, 9, 8, 7, 6, 5, 4, 3 points for top 10
- Jersey bonuses: Yellow (10), Green/Polka (5), White (3)
- Daily wins calculated per stage for highest-scoring participant
- Final classification: Uses "Eindklassement punten" tab with positions 1-20 + jersey winners

**Excel Structure for Eindstand**:
- Column with "Eind" header: Contains positions (1, 2, 3, ..., groen 1, groen 2, etc.)
- Next column "Uitslag": Contains rider names (Tadej Pogacar, Jonas Vingegaard, etc.)
- Rows 2-21: Top 20 riders in final classification
- Rows 22-30: Jersey winners (groen 1-3, bolletjes 1-3, wit 1-3)

## Development Workflow

Since this is a pure HTML/CSS/JavaScript application:

1. **No build process required** - directly open `tour-poule-website.html` in a browser
2. **No dependencies** - everything is self-contained
3. **Testing**: Open the file in multiple browsers to verify compatibility
4. **Data format**: Supports JSON uploads and Excel files (Excel parsing not fully implemented)

## File Structure

- `tour-poule-website.html` - Main application file
- `*.png` - UI theme color images (blue/yellow)
- `*.jpg` - Screenshot/reference images
- `tdf.xlsx` - Tour de France data file
- Images are referenced but not critical for core functionality

## Key Features to Understand

**Data Upload System**: 
- Team file: Contains all participants and their 12 selected riders
- Stage file: Daily results with top-10 finishers, jersey holders, and stories

**Calculation Engine**:
- Real-time recalculation of all scores when new stage data is uploaded
- Automatic daily winner determination
- Jersey bonus point assignment

**Responsive Design**: 
- Mobile-friendly with collapsible navigation
- Scrollable tables for large datasets
- Touch-friendly interface elements

## Testing the Application

Open `tour-poule-website.html` directly in a web browser. Use the Admin tab to download sample data files to understand the expected JSON structure for team and stage data uploads.