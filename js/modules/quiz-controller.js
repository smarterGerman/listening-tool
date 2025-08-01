/**
 * Quiz Controller for handling questions and answers
 */
import { CONFIG } from '../config.js';
import { DOMHelpers } from '../utils/dom-helpers.js';

export class QuizController {
    constructor() {
        // State
        this.currentQuestion = null;
        this.selectedAnswer = null;
        this.isAnswered = false;
        
        // DOM elements
        this.questionText = null;
        this.answerButtons = [];
        this.feedbackArea = null;
        this.feedbackContent = null;
        
        // Callbacks
        this.onAnswer = null;
        this.onNext = null;
        this.onPrevQuestion = null;
        this.onNextQuestion = null;
        
        // Translation system
        this.translationTooltip = null;
        this.longPressTimer = null;
        this.currentTranslations = {};
    }
    
    /**
     * Initialize the quiz controller
     */
    initialize() {
        this.questionText = DOMHelpers.getElementById('questionText');
        this.feedbackArea = DOMHelpers.getElementById('feedbackArea');
        this.feedbackContent = DOMHelpers.getElementById('feedbackContent');
        
        // Get answer buttons
        for (let i = 1; i <= 4; i++) {
            const btn = DOMHelpers.getElementById(`option${i}`);
            if (btn) {
                this.answerButtons.push(btn);
                DOMHelpers.addEventListener(btn, 'click', () => {
                    this.selectAnswer(i - 1);
                });
            }
        }
        
        // Initialize quiz navigation buttons
        const prevQuizBtn = DOMHelpers.getElementById('prevQuizBtn');
        const nextQuizBtn = DOMHelpers.getElementById('nextQuizBtn');
        
        if (prevQuizBtn) {
            DOMHelpers.addEventListener(prevQuizBtn, 'click', () => {
                if (this.onPrevQuestion) {
                    this.onPrevQuestion();
                }
            });
        }
        
        if (nextQuizBtn) {
            DOMHelpers.addEventListener(nextQuizBtn, 'click', () => {
                if (this.onNextQuestion) {
                    this.onNextQuestion();
                }
            });
        }
        
        // Initialize translation system
        this.initializeTranslationSystem();
    }

    /**
     * Initialize translation system
     */
    initializeTranslationSystem() {
        // Create tooltip element
        this.translationTooltip = DOMHelpers.createElement('div', {
            className: 'translation-tooltip',
            id: 'translationTooltip'
        });
        document.body.appendChild(this.translationTooltip);
        
        // Right-click handler
        document.addEventListener('contextmenu', (e) => {
            const target = e.target.closest('.translatable');
            if (target) {
                e.preventDefault();
                this.showTranslation(target);
            }
        });
        
        // Touch handlers for mobile
        document.addEventListener('touchstart', (e) => {
            const target = e.target.closest('.translatable');
            if (target) {
                this.longPressTimer = setTimeout(() => {
                    this.showTranslation(target);
                }, 800);
            }
        });
        
        document.addEventListener('touchend', () => {
            clearTimeout(this.longPressTimer);
        });
        
        document.addEventListener('touchmove', () => {
            clearTimeout(this.longPressTimer);
        });
        
        // Hide tooltip on any click
        document.addEventListener('click', () => {
            this.hideTranslation();
        });    
     }
    
    /**
     * Show translation tooltip
     */
    showTranslation(element) {
        const translation = element.dataset.translation;
        if (translation && this.translationTooltip) {
            this.translationTooltip.textContent = translation;
            
            // Position tooltip above the element
            const rect = element.getBoundingClientRect();
            const tooltipX = rect.left + (rect.width / 2);
            const tooltipY = rect.top - 10;
            
            this.translationTooltip.style.left = tooltipX + 'px';
            this.translationTooltip.style.top = tooltipY + 'px';
            
            this.translationTooltip.classList.add('show');
            
            // Auto-hide after 2 seconds
            setTimeout(() => {
                this.hideTranslation();
            }, 2000);
        }
    }
    
    /**
     * Hide translation tooltip
     */
    hideTranslation() {
        if (this.translationTooltip) {
            this.translationTooltip.classList.remove('show');
        }
    }
    
    /**
     * Load a new question
     */
    loadQuestion(question) {
        this.currentQuestion = question;
        this.selectedAnswer = null;
        this.isAnswered = false;
        
        // Reset UI
        this.resetUI();
        
        // Display question with translations
        if (this.questionText) {
            if (question.questionTranslations) {
                // Create question with translatable words
                const questionHTML = this.createTranslatableText(question.question, question.questionTranslations);
                DOMHelpers.setContent(this.questionText, questionHTML, true);
            } else {
                DOMHelpers.setContent(this.questionText, question.question);
            }
        }
        
        // Display options
        question.options.forEach((option, index) => {
            if (this.answerButtons[index]) {
                const btn = this.answerButtons[index];
                const optionText = btn.querySelector('.option-text');
                
                if (optionText) {
                    if (question.optionTranslations) {
                        // Create option with translatable words
                        const optionHTML = this.createTranslatableText(option, question.optionTranslations);
                        DOMHelpers.setContent(optionText, optionHTML, true);
                    } else {
                        DOMHelpers.setContent(optionText, option);
                    }
                }
                
                // Initially disable until audio plays
                btn.disabled = true;
                DOMHelpers.toggleClass(btn, 'hidden', false);
            }
        });
        
        // Hide unused buttons
        for (let i = question.options.length; i < 4; i++) {
            if (this.answerButtons[i]) {
                DOMHelpers.toggleClass(this.answerButtons[i], 'hidden', true);
            }
        }
        
        // Hide feedback
        DOMHelpers.toggleDisplay(this.feedbackArea, false);
    }
    
    /**
     * Create HTML with translatable words
     */
    createTranslatableText(text, translations) {
        if (!translations || Object.keys(translations).length === 0) {
            return text;
        }
        
        // Create a regex pattern for all translatable words
        const words = Object.keys(translations);
        const pattern = new RegExp(`\\b(${words.join('|')})\\b`, 'g');
        
        // Replace each word with a translatable span
        return text.replace(pattern, (match) => {
            const translation = translations[match];
            if (translation) {
                return `<span class="translatable" data-translation="${translation}">${match}</span>`;
            }
            return match;
        });
    }
    
    /**
     * Enable answer selection
     */
    enableAnswers() {
        if (!this.isAnswered) {
            this.answerButtons.forEach(btn => {
                if (!DOMHelpers.hasClass(btn, 'hidden')) {
                    btn.disabled = false;
                }
            });
        }
    }
    
    /**
     * Select an answer
     */
    selectAnswer(index) {
        console.log('selectAnswer called with index:', index, 'isAnswered:', this.isAnswered, 'currentQuestion:', this.currentQuestion);
        
        if (this.isAnswered || !this.currentQuestion) return;
        
        // Remove previous selection
        this.answerButtons.forEach(btn => {
            DOMHelpers.toggleClass(btn, 'selected', false);
        });
        
        // Mark selected
        if (this.answerButtons[index]) {
            DOMHelpers.toggleClass(this.answerButtons[index], 'selected', true);
            this.selectedAnswer = index;
            
            console.log('Answer selected, auto-submitting in 300ms');
            
            // Auto-submit the answer
            setTimeout(() => {
                this.submitAnswer();
            }, 300); // Small delay for visual feedback
        }
    }
    
    /**
     * Submit the selected answer
     */
    submitAnswer() {
        if (this.isAnswered || this.selectedAnswer === null || !this.currentQuestion) {
            console.log('Submit blocked - isAnswered:', this.isAnswered, 'selectedAnswer:', this.selectedAnswer, 'currentQuestion:', this.currentQuestion);
            return;
        }
        
        console.log('Submitting answer:', this.selectedAnswer);
        this.isAnswered = true;
        const correct = this.selectedAnswer === this.currentQuestion.correct;
        
        // Show feedback
        this.showFeedback(correct);
        
        // Mark correct/incorrect
        this.answerButtons.forEach((btn, index) => {
            btn.disabled = true;
            
            if (index === this.currentQuestion.correct) {
                DOMHelpers.toggleClass(btn, 'correct', true);
            } else if (index === this.selectedAnswer && !correct) {
                DOMHelpers.toggleClass(btn, 'incorrect', true);
            }
        });
        
        // Notify callback
        if (this.onAnswer) {
            console.log('Calling onAnswer callback');
            this.onAnswer({
                question: this.currentQuestion,
                selected: this.selectedAnswer,
                correct: correct
            });
        }
    }
    
    /**
     * Show feedback for the answer
     */
    showFeedback(correct) {
        if (!this.feedbackArea || !this.feedbackContent) return;
        
        let message = correct ? CONFIG.messages.correct : CONFIG.messages.incorrect;
        
        // Add explanation if available
        if (this.currentQuestion.explanation) {
            message += ' ' + this.currentQuestion.explanation;
        }
        
        DOMHelpers.setContent(this.feedbackContent, message);
        DOMHelpers.toggleClass(this.feedbackContent, 'correct', correct);
        DOMHelpers.toggleClass(this.feedbackContent, 'incorrect', !correct);
        DOMHelpers.toggleDisplay(this.feedbackArea, true);
    }
    
    /**
     * Show a message instead of a question
     */
    showMessage(message) {
        if (this.questionText) {
            DOMHelpers.setContent(this.questionText, message);
        }
        
        // Hide all answer buttons
        this.answerButtons.forEach(btn => {
            DOMHelpers.toggleClass(btn, 'hidden', true);
        });
        
        DOMHelpers.toggleDisplay(this.feedbackArea, false);
    }
    
    /**
     * Reset UI state
     */
    resetUI() {
        this.answerButtons.forEach(btn => {
            DOMHelpers.toggleClass(btn, 'selected', false);
            DOMHelpers.toggleClass(btn, 'correct', false);
            DOMHelpers.toggleClass(btn, 'incorrect', false);
            DOMHelpers.toggleClass(btn, 'hidden', false);
            btn.disabled = false;
        });
    }
    
    /**
     * Set callbacks
     */
    setCallbacks(callbacks) {
        Object.assign(this, callbacks);
    }
}