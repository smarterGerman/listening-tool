/**
 * Keyboard shortcuts handler for listening tool
 */
import { CONFIG } from '../config.js';

export class KeyboardShortcuts {
    constructor() {
        this.isEnabled = true;
        
        // Handler callbacks
        this.onPlayPause = null;
        this.onPreviousSentence = null;
        this.onNextSentence = null;
        this.onRepeatSentence = null;
        this.onToggleSpeed = null;
        this.onShowHint = null;
        this.onAnswer = null;
        this.onSubmit = null;
    }
    
    /**
     * Initialize keyboard event listeners
     */
    initialize() {
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }
    
    /**
     * Handle keydown events
     */
    handleKeyDown(e) {
        if (!this.isEnabled) return;
        
        const keyCombo = this.getKeyCombo(e);
        
        // Check play/pause
        if (CONFIG.shortcuts.playPause.includes(keyCombo)) {
            e.preventDefault();
            if (this.onPlayPause) this.onPlayPause();
            return;
        }
        
        // Check navigation
        if (CONFIG.shortcuts.previousSentence.includes(keyCombo)) {
            e.preventDefault();
            if (this.onPreviousSentence) this.onPreviousSentence();
            return;
        }
        
        if (CONFIG.shortcuts.nextSentence.includes(keyCombo)) {
            e.preventDefault();
            if (this.onNextSentence) this.onNextSentence();
            return;
        }
        
        if (CONFIG.shortcuts.repeatSentence.includes(keyCombo)) {
            e.preventDefault();
            if (this.onRepeatSentence) this.onRepeatSentence();
            return;
        }
        
        // Check speed toggle
        if (CONFIG.shortcuts.toggleSpeed.includes(keyCombo)) {
            e.preventDefault();
            if (this.onToggleSpeed) this.onToggleSpeed();
            return;
        }
        
        // Check hint
        if (CONFIG.shortcuts.showHint.includes(keyCombo)) {
            e.preventDefault();
            if (this.onShowHint) this.onShowHint();
            return;
        }
        
        // Check answer selection (1-4 or A-D)
        const key = e.key.toLowerCase();
        if (CONFIG.shortcuts.answer1.includes(key)) {
            e.preventDefault();
            if (this.onAnswer) this.onAnswer(0);
            return;
        }
        if (CONFIG.shortcuts.answer2.includes(key)) {
            e.preventDefault();
            if (this.onAnswer) this.onAnswer(1);
            return;
        }
        if (CONFIG.shortcuts.answer3.includes(key)) {
            e.preventDefault();
            if (this.onAnswer) this.onAnswer(2);
            return;
        }
        if (CONFIG.shortcuts.answer4.includes(key)) {
            e.preventDefault();
            if (this.onAnswer) this.onAnswer(3);
            return;
        }
        
        // Check submit
        if (CONFIG.shortcuts.submitAnswer.includes(key) && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            if (this.onSubmit) this.onSubmit();
            return;
        }
    }
    
    /**
     * Generate key combination string
     */
    getKeyCombo(e) {
        const parts = [];
        
        if (e.shiftKey) parts.push('shift');
        if (e.ctrlKey) parts.push('ctrl');
        if (e.metaKey) parts.push('meta');
        if (e.altKey) parts.push('alt');
        
        let key = e.key.toLowerCase();
        
        // Normalize key names
        switch (key) {
            case ' ':
                key = 'space';
                break;
            case 'escape':
                key = 'esc';
                break;
        }
        
        parts.push(key);
        
        return parts.join('+');
    }
    
    /**
     * Set handler callbacks
     */
    setHandlers(handlers) {
        Object.assign(this, handlers);
    }
    
    /**
     * Enable/disable shortcuts
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
    }
}