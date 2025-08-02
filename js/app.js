/**
 * Main application controller for the German Listening Comprehension Tool
 */
import { CONFIG } from './config.js';
import { AudioPlayer } from './modules/audio-player.js';
import { LessonLoader } from './modules/lesson-loader.js';
import { QuizController } from './modules/quiz-controller.js';
import { KeyboardShortcuts } from './modules/keyboard-shortcuts.js';
import { DOMHelpers } from './utils/dom-helpers.js';

export class ListeningApp {
    constructor() {
        // Core modules
        this.audioPlayer = null;
        this.lessonLoader = new LessonLoader();
        this.quizController = new QuizController();
        this.keyboard = new KeyboardShortcuts();
        
        // State
        this.currentLesson = null;
        this.currentCueIndex = 0;
        this.vttCues = [];
        this.currentMode = CONFIG.defaultMode;
        this.results = [];
        this.currentQuestions = [];
        this.currentQuestionIndex = 0;
        
        // Add these new properties
        this.currentQuestions = [];
        this.currentQuestionIndex = 0;
        
// Auto-play state
        this.autoPlayEnabled = false;
        
        // Score tracking
        this.sessionScore = {
            correct: 0,
            total: 0,
            byMode: {}
        };
        
        // DOM elements
        this.loadingOverlay = null;
        this.modeIndicator = null;
        this.progressText = null;
    }
    
    /**
     * Initialize the application
     */
    async initialize() {
        try {
            console.log('Initializing Listening Tool...');
            
            // Initialize DOM elements
            this.initializeDOMElements();
            
            // Show loading
            this.updateLoadingText('Initialisiere...');
            
            // Initialize audio player
            const audioElement = DOMHelpers.getElementById('audioPlayer', true);
            this.audioPlayer = new AudioPlayer(audioElement);
            this.audioPlayer.initializeElements();
            
            // Initialize quiz controller
            this.quizController.initialize();
            
            // Initialize keyboard shortcuts
            this.keyboard.initialize();
            
            // Setup callbacks
            this.setupCallbacks();
            
            // Load initial lesson
            this.updateLoadingText('Lade Lektion...');
            const lessonId = this.getLessonIdFromUrl() || CONFIG.defaultLesson;
            await this.loadLesson(lessonId);
            
            // Hide loading
            setTimeout(() => {
                this.hideLoadingOverlay();
            }, 500);
            
            console.log('Initialization complete');
            
        } catch (error) {
            console.error('Failed to initialize:', error);
            this.showError(`Fehler beim Laden: ${error.message}`);
        }
    }
    
    /**
     * Initialize DOM elements
     */
    initializeDOMElements() {
        this.loadingOverlay = DOMHelpers.getElementById('loadingOverlay');
        this.progressText = DOMHelpers.getElementById('progressText');
        
        // Mode dropdown
        const modeSelect = DOMHelpers.getElementById('modeSelect');
        if (modeSelect) {
            // Set initial value
            modeSelect.value = this.currentMode;
            
            // Add change event listener
            DOMHelpers.addEventListener(modeSelect, 'change', (e) => {
                this.currentMode = e.target.value;
                this.currentQuestionIndex = 0;
                this.handleSentenceChange(this.currentCueIndex, this.vttCues[this.currentCueIndex]);
            });
        }
        
        // Hint button
        const hintBtn = DOMHelpers.getElementById('hintBtn');
        if (hintBtn) {
            DOMHelpers.addEventListener(hintBtn, 'click', () => this.showHint());
        }
        
        // Hint close button
        const hintCloseBtn = DOMHelpers.getElementById('hintCloseBtn');
        if (hintCloseBtn) {
            DOMHelpers.addEventListener(hintCloseBtn, 'click', () => this.hideHint());
        }
        
        // Restart button
        const restartBtn = DOMHelpers.getElementById('restartBtn');
        if (restartBtn) {
            DOMHelpers.addEventListener(restartBtn, 'click', () => this.restart());
        }
        
        // Feedback is always enabled
        this.feedbackEnabled = true;
    }
    
    /**
     * Setup callbacks between modules
     */
    setupCallbacks() {
        // Audio player callbacks
        this.audioPlayer.setCallbacks({
            onPlay: () => {
                console.log('Audio playing');
            },
            onPause: () => {
                console.log('Audio paused');
            },
            onSentenceChange: (index, cue) => {
                this.handleSentenceChange(index, cue);
            },
            onNext: () => {
            
                // If question is answered, skip to next sentence
                if (this.quizController.isAnswered) {
                    return true; // Allow skip
                }
                return false; // Don't skip if not answered
            },
            onSentenceEnd: () => {
                this.quizController.enableAnswers();
            },
            onAutoPlayToggle: (enabled) => {
                this.autoPlayEnabled = enabled;
                console.log('Auto-play:', enabled ? 'enabled' : 'disabled');
            }
        });
        
        // Quiz controller callbacks
        this.quizController.setCallbacks({
            onAnswer: (answer) => {
                this.handleAnswer(answer);
            },
            onNext: () => {
                this.nextSentence();
            },
            onPrevQuestion: () => {
                this.previousQuestion();
            },
            onNextQuestion: () => {
                this.nextQuestion();
            }
        });
        
        // Keyboard shortcuts
        this.keyboard.setHandlers({
            onPlayPause: () => this.audioPlayer.togglePlayback(),
            onPreviousSentence: () => this.previousSentence(),
            onNextSentence: () => this.nextSentence(),
            onRepeatSentence: () => this.audioPlayer.playCurrentSentence(),
            onToggleSpeed: () => this.audioPlayer.toggleSpeed(),
            onShowHint: () => this.showHint(),
            onAnswer: (index) => this.quizController.selectAnswer(index),
            onSubmit: () => this.quizController.submitAnswer()
        });
    }
    
    /**
     * Load a lesson
     */
    async loadLesson(lessonId) {
        try {
            console.log(`Loading lesson: ${lessonId}`);
            
            // Load lesson data
            const lessons = await this.lessonLoader.loadAllLessons();
            const lessonData = lessons[lessonId];
            
            if (!lessonData) {
                throw new Error(`Lesson ${lessonId} not found`);
            }
            
            this.currentLesson = lessonData;
            
            // Load VTT with questions
            const cues = await this.lessonLoader.loadVTTFromUrl(lessonData.vttUrl);
            this.vttCues = cues;
            this.currentCueIndex = 0;
            
            // Setup audio
            this.audioPlayer.loadAudio(lessonData.audioUrl);
            this.audioPlayer.setVTTCues(cues);
            
            // Update UI
            this.updateProgress();
            this.handleSentenceChange(0, cues[0]);
            
            console.log(`Loaded ${cues.length} sentences`);
            
        } catch (error) {
            console.error('Failed to load lesson:', error);
            throw error;
        }
    }
    /**
     
    /**
     * Handle sentence change
     */
    handleSentenceChange(index, cue) {
        this.currentCueIndex = index;
        this.updateProgress();
        
        // Hide hint when changing sentences
        this.hideHint();

        // Hide feedback when changing sentences
        if (this.quizController.feedbackArea) {
            DOMHelpers.toggleClass(this.quizController.feedbackArea, 'show', false);
        }

        console.log('handleSentenceChange - cue:', cue);
        console.log('cue.questions:', cue ? cue.questions : 'no cue');
        console.log('Current mode:', this.currentMode);

        // Load questions for this sentence
        if (cue && cue.questions && cue.questions.length > 0) {
            console.log('Raw questions:', cue.questions);
            const questions = this.filterQuestionsByMode(cue.questions);
            console.log('Filtered questions:', questions);

            if (questions.length > 0) {
                this.currentQuestions = questions;
                this.currentQuestionIndex = 0;
                this.quizController.loadQuestion(questions[0]);
                this.updateQuizNavigation();
            } else {
                this.currentQuestions = [];
                this.quizController.showMessage(`Keine ${CONFIG.modeNames[this.currentMode]} Fragen für diesen Satz.`);
                this.updateQuizNavigation();
            }
        } else {
            this.currentQuestions = [];
            this.quizController.showMessage(CONFIG.messages.noQuestions);
            this.updateQuizNavigation();
        }
    }
    
    /**
     * Filter questions by current mode
     */
    filterQuestionsByMode(questions) {
        if (!questions || !Array.isArray(questions)) {
            return [];
        }
        
        return questions.filter(q => q.type === this.currentMode);
    }
    
    /**
     * Handle answer submission
     */
    handleAnswer(answer) {
        console.log('Answer submitted:', answer);
        
        // Update score
        this.sessionScore.total++;
        if (answer.correct) {
            this.sessionScore.correct++;
        }
        
        // Track by mode
        if (!this.sessionScore.byMode[this.currentMode]) {
            this.sessionScore.byMode[this.currentMode] = { correct: 0, total: 0 };
        }
        this.sessionScore.byMode[this.currentMode].total++;
        if (answer.correct) {
            this.sessionScore.byMode[this.currentMode].correct++;
        }
        
        // Record result
        this.results.push({
            sentenceIndex: this.currentCueIndex,
            question: answer.question,
            selectedAnswer: answer.selected,
            correct: answer.correct,
            time: Date.now()
        });
        
        // Hide feedback after delay
        setTimeout(() => {
            if (this.quizController.feedbackArea) {
                DOMHelpers.toggleClass(this.quizController.feedbackArea, 'show', false);
                // Also hide the element completely
                DOMHelpers.toggleDisplay(this.quizController.feedbackArea, false);
            }
        }, CONFIG.feedbackDelay);

        // Auto-advance after feedback
        setTimeout(() => {
            // Check if there are more questions for this sentence
            if (this.currentQuestionIndex < this.currentQuestions.length - 1) {
                this.nextQuestion();
            } else {
                // Move to next sentence only if autoplay is enabled
            this.nextSentenceWithAutoPlay();
            }
        }, CONFIG.feedbackDelay);
    }
    
    /**
     * Navigate to next sentence
     */
    nextSentence() {
        if (this.currentCueIndex < this.vttCues.length - 1) {
            this.audioPlayer.goToNextSentence();
        } else {
            this.showResults();
        }
    }
    
    /**
     * Navigate to next sentence with auto-play support
     */
    nextSentenceWithAutoPlay() {
        if (this.currentCueIndex < this.vttCues.length - 1) {
            // Use the audio player's navigation method
            this.audioPlayer.goToNextSentence();
            
            // Handle auto-play
            if (this.autoPlayEnabled) {
                // Small delay before playing
                setTimeout(() => {
                    this.audioPlayer.playCurrentSentence();
                }, 300);
            }
        } else {
            // End of lesson
            this.showResults();
        }
    }
    
    /**
     * Navigate to previous sentence
     */
    previousSentence() {
        if (this.currentCueIndex > 0) {
            this.audioPlayer.goToPreviousSentence();
        }
    }
    
    /**
     * Show transcript hint
     */
    showHint() {
        const hintDisplay = DOMHelpers.getElementById('hintDisplay');
        const hintContent = DOMHelpers.getElementById('hintContent');
        
        if (hintDisplay && hintContent && this.vttCues[this.currentCueIndex]) {
            const text = this.vttCues[this.currentCueIndex].text;
            DOMHelpers.setContent(hintContent, text);
            
            // Use class instead of display property for smooth animation
            DOMHelpers.toggleClass(hintDisplay, 'show', true);
            
            // Auto-hide
            setTimeout(() => {
                DOMHelpers.toggleClass(hintDisplay, 'show', false);
            }, CONFIG.hintAutoHideDelay);
        }
    }

    /**
     * Hide transcript hint
     */
    hideHint() {
        const hintDisplay = DOMHelpers.getElementById('hintDisplay');
        if (hintDisplay) {
            DOMHelpers.toggleClass(hintDisplay, 'show', false);
        }
    }

    /**
     * Update quiz navigation buttons
     */
    updateQuizNavigation() {
        const prevBtn = DOMHelpers.getElementById('prevQuizBtn');
        const nextBtn = DOMHelpers.getElementById('nextQuizBtn');
        
        if (prevBtn) {
            prevBtn.disabled = this.currentQuestionIndex <= 0 || this.currentQuestions.length === 0;
        }
        if (nextBtn) {
            nextBtn.disabled = this.currentQuestionIndex >= this.currentQuestions.length - 1 || this.currentQuestions.length === 0;
        }
    }
    
    /**
     * Navigate to previous question
     */
    previousQuestion() {
        if (this.currentQuestionIndex > 0 && this.currentQuestions.length > 0) {
            this.currentQuestionIndex--;
            this.quizController.loadQuestion(this.currentQuestions[this.currentQuestionIndex]);
            this.updateQuizNavigation();
        }
    }
    
    /**
     * Navigate to next question
     */
    nextQuestion() {
        if (this.currentQuestionIndex < this.currentQuestions.length - 1) {
            this.currentQuestionIndex++;
            this.quizController.loadQuestion(this.currentQuestions[this.currentQuestionIndex]);
            this.updateQuizNavigation();
        }
    }
    
    /**
     * Update progress display
     */
    updateProgress() {
        if (this.progressText) {
            const text = `Satz ${this.currentCueIndex + 1} von ${this.vttCues.length}`;
            DOMHelpers.setContent(this.progressText, text);
        }
    }
    
    /**
     * Show final results
     */
    showResults() {
        const statsSection = DOMHelpers.getElementById('statsSection');
        
        if (statsSection) {
            // Calculate overall stats
            const accuracy = this.sessionScore.total > 0 
                ? Math.round((this.sessionScore.correct / this.sessionScore.total) * 100) 
                : 0;
            
            // Update display
            DOMHelpers.setContent(DOMHelpers.getElementById('correctCount'), this.sessionScore.correct);
            DOMHelpers.setContent(DOMHelpers.getElementById('wrongCount'), this.sessionScore.total - this.sessionScore.correct);
            DOMHelpers.setContent(DOMHelpers.getElementById('accuracyPercent'), `${accuracy}%`);
            
            // Show stats
            DOMHelpers.toggleDisplay(statsSection, true);
            
            // Hide quiz area
            const quizContainer = DOMHelpers.querySelector('.quiz-container');
            if (quizContainer) {
                DOMHelpers.toggleDisplay(quizContainer, false);
            }
            
            // Pause audio
            this.audioPlayer.pause();
            
            console.log('Session complete. Score:', this.sessionScore);
        }
    }
    
    /**
     * Restart lesson
     */
    restart() {
        this.currentCueIndex = 0;
        this.results = [];
        this.audioPlayer.reset();
        
        // Reset scores
        this.sessionScore = {
            correct: 0,
            total: 0,
            byMode: {}
        };
        
        // Hide stats and show quiz
        DOMHelpers.toggleDisplay(DOMHelpers.getElementById('statsSection'), false);
        const quizContainer = DOMHelpers.querySelector('.quiz-container');
        if (quizContainer) {
            DOMHelpers.toggleDisplay(quizContainer, true);
        }
        
        // Reload first question
        this.handleSentenceChange(0, this.vttCues[0]);
        this.updateProgress();
    }
    
    /**
     * Get lesson ID from URL
     */
    getLessonIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('lesson');
    }
    
    /**
     * Update loading text
     */
    updateLoadingText(text) {
        const loadingText = DOMHelpers.getElementById('loadingText');
        if (loadingText) {
            DOMHelpers.setContent(loadingText, text);
        }
    }
    
    /**
     * Hide loading overlay
     */
    hideLoadingOverlay() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.add('hidden');
        }
    }
    
    /**
     * Show error message
     */
    showError(message) {
        const errorMessage = DOMHelpers.getElementById('errorMessage');
        const loadingError = DOMHelpers.getElementById('loadingError');
        
        if (errorMessage) {
            DOMHelpers.setContent(errorMessage, message);
        }
        if (loadingError) {
            DOMHelpers.toggleDisplay(loadingError, true);
        }
    }
}

// Initialize app when DOM is ready
window.addEventListener('DOMContentLoaded', async () => {
    const app = new ListeningApp();
    await app.initialize();
    
    // Make app available for debugging
    window.listeningApp = app;
});