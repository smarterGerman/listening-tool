/**
 * Lesson loader with extended VTT parsing for questions
 */
import { CONFIG } from '../config.js';

export class LessonLoader {
    constructor() {
        this.allLessons = {};
        this.isLoading = false;
    }
    
    /**
     * Load all lessons from JSON
     */
    async loadAllLessons() {
        if (this.isLoading) {
            console.warn('Lessons are already being loaded');
            return this.allLessons;
        }
        
        this.isLoading = true;
        
        try {
            const response = await fetch(CONFIG.lessonsUrl);
            
            if (!response.ok) {
                throw new Error(`Failed to load lessons: ${response.status} ${response.statusText}`);
            }
            
            this.allLessons = await response.json();
            return this.allLessons;
            
        } catch (error) {
            console.error('Failed to load lessons:', error);
            throw error;
        } finally {
            this.isLoading = false;
        }
    }
    
    /**
     * Load and parse VTT file with embedded questions
     */
    async loadVTTFromUrl(vttUrl) {
        try {
            const response = await fetch(vttUrl);
            
            if (!response.ok) {
                throw new Error(`VTT file not found: ${response.status} ${response.statusText}`);
            }
            
            const vttText = await response.text();
            const cues = this.parseVTTWithQuestions(vttText);
            
            return cues;
        } catch (error) {
            console.error('Failed to load VTT file:', error);
            throw error;
        }
    }
    
    /**
     * Parse VTT content with embedded JSON questions
     */
    parseVTTWithQuestions(vttText) {
        if (!vttText || typeof vttText !== 'string') {
            console.error('Invalid VTT text provided');
            return [];
        }
        
        const lines = vttText.split('\n');
        const cues = [];
        let i = 0;
        
        // Skip headers
        while (i < lines.length) {
            const line = lines[i].trim();
            if (line.includes('-->')) {
                break;
            }
            i++;
        }
        
        // Parse cues with questions
        while (i < lines.length) {
            const line = lines[i].trim();
            
            if (line.includes('-->')) {
                const cue = this.parseCueWithQuestions(line, lines, i);
                if (cue) {
                    cues.push(cue);
                }
            }
            i++;
        }
        
        return cues;
    }
    
    /**
     * Parse a single VTT cue with questions
     */
    parseCueWithQuestions(timeLine, allLines, lineIndex) {
        try {
            // Parse time
            const timeParts = timeLine.split('-->');
            if (timeParts.length < 2) {
                console.warn('Invalid cue line format:', timeLine);
                return null;
            }
            
            const startTime = this.parseTimeToSeconds(timeParts[0].trim());
            const endTime = this.parseTimeToSeconds(timeParts[1].trim().split(' ')[0]);
            
            if (isNaN(startTime) || isNaN(endTime)) {
                console.warn('Invalid time format in cue:', timeLine);
                return null;
            }
            
            // Get the content line
            let text = '';
            let questions = [];
            let textLineIndex = lineIndex + 1;
            
            if (textLineIndex < allLines.length) {
                const contentLine = allLines[textLineIndex].trim();
                
                if (contentLine) {
                    // Check if the line contains JSON data
                    if (contentLine.includes('{"questions"')) {
                        // Extract the sentence text (everything before the JSON)
                        const jsonStart = contentLine.indexOf('{"questions"');
                        text = contentLine.substring(0, jsonStart).trim();
                        
                        // Parse the JSON part
                        try {
                            const jsonString = contentLine.substring(jsonStart);
                            const data = JSON.parse(jsonString);
                            questions = data.questions || [];
                        } catch (e) {
                            console.error('Failed to parse questions JSON:', e);
                        }
                    } else {
                        // No JSON, just text
                        text = contentLine;
                    }
                }
            }
            
            if (!text) {
                console.warn('No text found for cue:', timeLine);
                return null;
            }
            
            return {
                start: startTime,
                end: endTime,
                text: text.trim(),
                questions: questions
            };
            
        } catch (error) {
            console.error('Error parsing cue line:', timeLine, error);
            return null;
        }
    }
    
    /**
     * Parse time string to seconds
     */
    parseTimeToSeconds(timeStr) {
        try {
            const parts = timeStr.split(':');
            const seconds = parts[parts.length - 1].split(/[.,]/);
            const sec = parseInt(seconds[0]) || 0;
            const ms = parseInt(seconds[1] || 0);
            
            if (parts.length === 3) {
                const hours = parseInt(parts[0]) || 0;
                const minutes = parseInt(parts[1]) || 0;
                return hours * 3600 + minutes * 60 + sec + ms / 1000;
            } else if (parts.length === 2) {
                const minutes = parseInt(parts[0]) || 0;
                return minutes * 60 + sec + ms / 1000;
            } else {
                return sec + ms / 1000;
            }
        } catch (error) {
            console.error('Error parsing time:', timeStr, error);
            return 0;
        }
    }
}