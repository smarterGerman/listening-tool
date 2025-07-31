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
                // TODO: Implement previous question navigation
                console.log('Previous question clicked');
            });
        }
        
        if (nextQuizBtn) {
            DOMHelpers.addEventListener(nextQuizBtn, 'click', () => {
                // TODO: Implement next question navigation
                console.log('Next question clicked');
            });
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
        
        // Display question
        if (this.questionText) {
            DOMHelpers.setContent(this.questionText, question.question);
        }
        
        // Display options
        question.options.forEach((option, index) => {
            if (this.answerButtons[index]) {
                const btn = this.answerButtons[index];
                const optionText = btn.querySelector('.option-text');
                
                if (optionText) {
                    DOMHelpers.setContent(optionText, option);
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
        if (this.isAnswered || !this.currentQuestion) return;
        
        // Remove previous selection
        this.answerButtons.forEach(btn => {
            DOMHelpers.toggleClass(btn, 'selected', false);
        });
        
        // Mark selected
        if (this.answerButtons[index]) {
            DOMHelpers.toggleClass(this.answerButtons[index], 'selected', true);
            this.selectedAnswer = index;
        }
    }
    
    /**
     * Submit the selected answer
     */
    submitAnswer() {
        if (this.isAnswered || this.selectedAnswer === null || !this.currentQuestion) {
            return;
        }
        
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