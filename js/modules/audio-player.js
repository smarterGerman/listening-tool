/**
 * Audio player for listening comprehension
 */
import { CONFIG } from '../config.js';
import { DOMHelpers } from '../utils/dom-helpers.js';

export class AudioPlayer {
    constructor(audioElement) {
        this.audio = audioElement;
        this.vttCues = [];
        this.currentCueIndex = 0;
        this.isPlaying = false;
        this.currentSpeed = 1.0;
        
        // DOM elements
        this.playBtn = null;
        this.prevBtn = null;
        this.nextBtn = null;
        this.speedBtn = null;
        this.progressBar = null;
        this.timeDisplay = null;
        
        // Callbacks
        this.onPlay = null;
        this.onPause = null;
        this.onSentenceChange = null;
        this.onSentenceEnd = null;
        this.onAutoPlayToggle = null;
        
        this.initializeAudioEvents();
    }
    
    /**
     * Initialize DOM elements
     */
    initializeElements() {
        this.playBtn = DOMHelpers.getElementById('playBtn');
        this.prevBtn = DOMHelpers.getElementById('prevBtn');
        this.nextBtn = DOMHelpers.getElementById('nextBtn');
        this.speedBtn = DOMHelpers.getElementById('speedBtn');
        this.progressBar = DOMHelpers.getElementById('progressBar');
        this.timeDisplay = DOMHelpers.getElementById('timeDisplay');
        
        this.setupEventListeners();
                this.initializeSlider(); 
    }

    /**
     * Initialize sliding play button
     */
    initializeSlider() {
        const playTrack = DOMHelpers.getElementById('playTrack');
        const playSlider = DOMHelpers.getElementById('playSlider');
        
        if (!this.playBtn || !playSlider || !playTrack) return;
        
        let isDragging = false;
        let startX = 0;
        let currentX = 0;
        const maxSlide = 60; // Maximum slide distance
        
        // Mouse events
        this.playBtn.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX - currentX;
            DOMHelpers.toggleClass(this.playBtn, 'dragging', true);
            DOMHelpers.toggleClass(playSlider, 'dragging', true);
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const x = e.clientX - startX;
            currentX = Math.max(0, Math.min(x, maxSlide));
            playSlider.style.transform = `translateX(${currentX}px)`;
            
            // Visual feedback when near lock position
            if (currentX > maxSlide * 0.8) {
                DOMHelpers.toggleClass(playTrack, 'auto-play-active', true);
            } else {
                DOMHelpers.toggleClass(playTrack, 'auto-play-active', false);
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            
            DOMHelpers.toggleClass(this.playBtn, 'dragging', false);
            DOMHelpers.toggleClass(playSlider, 'dragging', false);
            
            // Check if slid far enough to lock
            if (currentX > maxSlide * 0.8) {
                // Lock in auto-play position
                currentX = maxSlide;
                DOMHelpers.toggleClass(playSlider, 'locked', true);
                DOMHelpers.toggleClass(playTrack, 'auto-play-active', true);
                
                // Trigger auto-play
                if (this.onAutoPlayToggle) {
                    this.onAutoPlayToggle(true);
                }
            } else {
                // Snap back
                currentX = 0;
                playSlider.style.transform = 'translateX(0)';
                DOMHelpers.toggleClass(playSlider, 'locked', false);
                DOMHelpers.toggleClass(playTrack, 'auto-play-active', false);
                
                // Disable auto-play
                if (this.onAutoPlayToggle) {
                    this.onAutoPlayToggle(false);
                }
            }
        });
        
        // Touch events for mobile
        this.playBtn.addEventListener('touchstart', (e) => {
            isDragging = true;
            startX = e.touches[0].clientX - currentX;
            DOMHelpers.toggleClass(this.playBtn, 'dragging', true);
            DOMHelpers.toggleClass(playSlider, 'dragging', true);
            e.preventDefault();
        });
        
        document.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            
            const x = e.touches[0].clientX - startX;
            currentX = Math.max(0, Math.min(x, maxSlide));
            playSlider.style.transform = `translateX(${currentX}px)`;
            
            if (currentX > maxSlide * 0.8) {
                DOMHelpers.toggleClass(playTrack, 'auto-play-active', true);
            } else {
                DOMHelpers.toggleClass(playTrack, 'auto-play-active', false);
            }
        });
        
        document.addEventListener('touchend', () => {
            if (!isDragging) return;
            isDragging = false;
            
            DOMHelpers.toggleClass(this.playBtn, 'dragging', false);
            DOMHelpers.toggleClass(playSlider, 'dragging', false);
            
            if (currentX > maxSlide * 0.8) {
                currentX = maxSlide;
                DOMHelpers.toggleClass(playSlider, 'locked', true);
                DOMHelpers.toggleClass(playTrack, 'auto-play-active', true);
                
                if (this.onAutoPlayToggle) {
                    this.onAutoPlayToggle(true);
                }
            } else {
                currentX = 0;
                playSlider.style.transform = 'translateX(0)';
                DOMHelpers.toggleClass(playSlider, 'locked', false);
                DOMHelpers.toggleClass(playTrack, 'auto-play-active', false);
                
                if (this.onAutoPlayToggle) {
                    this.onAutoPlayToggle(false);
                }
            }
        });
        
        // Click on play button still works for play/pause
        this.playBtn.addEventListener('click', (e) => {
            // Only toggle playback if not dragging
            if (currentX < 10) {
                this.togglePlayback();
            }
        });
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Comment out the play button click handler - it's now handled in initializeSlider
        // DOMHelpers.addEventListener(this.playBtn, 'click', () => this.togglePlayback());
        DOMHelpers.addEventListener(this.prevBtn, 'click', () => this.goToPreviousSentence());
        DOMHelpers.addEventListener(this.nextBtn, 'click', () => this.goToNextSentence());
        DOMHelpers.addEventListener(this.speedBtn, 'click', () => this.toggleSpeed());
    }
    
    /**
     * Initialize audio events
     */
    initializeAudioEvents() {
        if (!this.audio) return;
        
        DOMHelpers.addEventListener(this.audio, 'play', () => {
            this.isPlaying = true;
            this.updatePlayButton();
            if (this.onPlay) this.onPlay();
        });
        
        DOMHelpers.addEventListener(this.audio, 'pause', () => {
            this.isPlaying = false;
            this.updatePlayButton();
            if (this.onPause) this.onPause();
        });
        
        DOMHelpers.addEventListener(this.audio, 'timeupdate', () => {
            this.handleTimeUpdate();
        });
        
        DOMHelpers.addEventListener(this.audio, 'loadedmetadata', () => {
            this.updatePlayButton();
            this.audio.playbackRate = this.currentSpeed;
            this.updateProgress();
        });
    }
    
    /**
     * Load audio source
     */
    loadAudio(audioUrl) {
        if (!this.audio) return;
        this.audio.src = audioUrl;
    }
    
    /**
     * Set VTT cues
     */
    setVTTCues(cues) {
        this.vttCues = cues || [];
        this.currentCueIndex = 0;
        this.updateNavigationButtons();
    }
    
    /**
     * Toggle playback
     */
    togglePlayback() {
        if (!this.audio) return;
        
        if (this.audio.paused) {
            this.playCurrentSentence();
        } else {
            this.audio.pause();
        }
    }
    
    /**
     * Play current sentence
     */
    playCurrentSentence() {
        if (this.currentCueIndex >= 0 && this.currentCueIndex < this.vttCues.length) {
            const cue = this.vttCues[this.currentCueIndex];
            this.audio.currentTime = cue.start;
            this.audio.play().catch(error => {
                console.error('Playback failed:', error);
            });
        }
    }
    
    /**
     * Go to previous sentence
     */
    goToPreviousSentence() {
        if (this.currentCueIndex > 0) {
            this.currentCueIndex--;
            this.updateCurrentSentence();
            if (this.onSentenceChange) {
                this.onSentenceChange(this.currentCueIndex, this.getCurrentCue());
            }
        }
    }
    
    /**
     * Go to next sentence
     */
    goToNextSentence() {
        if (this.currentCueIndex < this.vttCues.length - 1) {
            this.currentCueIndex++;
            this.updateCurrentSentence();
            if (this.onSentenceChange) {
                this.onSentenceChange(this.currentCueIndex, this.getCurrentCue());
            }
        }
    }
    
    /**
     * Get current cue
     */
    getCurrentCue() {
        return this.vttCues[this.currentCueIndex] || null;
    }
    
    /**
     * Update current sentence
     */
    updateCurrentSentence() {
        this.updateNavigationButtons();
        if (this.audio) {
            const cue = this.getCurrentCue();
            if (cue) {
                this.audio.currentTime = cue.start;
            }
        }
    }
    
    /**
     * Toggle speed
     */
    toggleSpeed() {
        const speedIndex = CONFIG.speeds.indexOf(this.currentSpeed);
        const nextIndex = (speedIndex + 1) % CONFIG.speeds.length;
        
        this.currentSpeed = CONFIG.speeds[nextIndex];
        
        if (this.speedBtn) {
            // Remove all speed classes
            CONFIG.speedClasses.forEach(cls => {
                DOMHelpers.toggleClass(this.speedBtn, cls, false);
            });
            
            // Add current speed class
            DOMHelpers.toggleClass(this.speedBtn, CONFIG.speedClasses[nextIndex], true);
            this.speedBtn.textContent = CONFIG.speedLabels[nextIndex];
        }
        
        if (this.audio) {
            this.audio.playbackRate = this.currentSpeed;
        }
    }
    
    /**
     * Update play button
     */
    updatePlayButton() {
        if (!this.playBtn) return;
        
        const isDisabled = !this.audio || this.audio.networkState === HTMLMediaElement.NETWORK_NO_SOURCE;
        this.playBtn.disabled = isDisabled;
        DOMHelpers.toggleClass(this.playBtn, 'playing', this.isPlaying);
    }
    
    /**
     * Update navigation buttons
     */
    updateNavigationButtons() {
        if (this.prevBtn) {
            this.prevBtn.disabled = (this.currentCueIndex <= 0);
        }
        if (this.nextBtn) {
            this.nextBtn.disabled = (this.currentCueIndex >= this.vttCues.length - 1);
        }
    }
    
    /**
     * Handle time update
     */
    handleTimeUpdate() {
        this.updateProgress();
        
        // Check if current sentence ended
        if (this.vttCues.length > 0 && this.isPlaying) {
            const currentTime = this.audio.currentTime;
            const currentCue = this.vttCues[this.currentCueIndex];
            
            if (currentCue && currentTime >= currentCue.end) {
                this.audio.pause();
                if (this.onSentenceEnd) {
                    this.onSentenceEnd();
                }
            }
        }
    }
    
    /**
     * Update progress display
     */
    updateProgress() {
        if (!this.audio || !this.timeDisplay || !this.progressBar) return;
        
        const currentTime = this.audio.currentTime;
        const duration = this.audio.duration;
        
        if (duration && !isNaN(duration)) {
            const progress = (currentTime / duration) * 100;
            this.progressBar.style.width = progress + '%';
            
            const formatTime = (time) => {
                const minutes = Math.floor(time / 60);
                const seconds = Math.floor(time % 60);
                return `${minutes}:${seconds.toString().padStart(2, '0')}`;
            };
            
            DOMHelpers.setContent(
                this.timeDisplay,
                `${formatTime(currentTime)} / ${formatTime(duration)}`
            );
        }
    }
    
    /**
     * Reset player
     */
    reset() {
        this.currentCueIndex = 0;
        this.pause();
        if (this.audio) {
            this.audio.currentTime = 0;
        }
        this.updateCurrentSentence();
    }
    
    /**
     * Pause audio
     */
    pause() {
        if (this.audio && !this.audio.paused) {
            this.audio.pause();
        }
    }
    
    /**
     * Set callbacks
     */
    setCallbacks(callbacks) {
        Object.assign(this, callbacks);
    }
}