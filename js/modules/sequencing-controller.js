/**
 * Sequencing Controller for drag-and-drop word order exercises
 */
import { DOMHelpers } from '../utils/dom-helpers.js';

export class SequencingController {
    constructor() {
        // State
        this.segments = [];
        this.correctOrder = [];
        this.userOrder = [];
        this.isAnswered = false;
        
        // DOM elements
        this.container = null;
        this.dragZone = null;
        this.dropZone = null;
        this.checkButton = null;
        
        // Drag state
        this.draggedElement = null;
        this.draggedIndex = null;
        this.touchOffset = { x: 0, y: 0 };
        
        // Callbacks
        this.onAnswer = null;
    }
    
    /**
     * Initialize the sequencing controller
     */
    initialize(container) {
        this.container = container;
        this.createLayout();
        this.setupEventListeners();
    }
    
    /**
     * Create the drag-and-drop layout
     */
    createLayout() {
        // Clear container
        this.container.innerHTML = '';
        
        // Create drag zone (source)
        this.dragZone = DOMHelpers.createElement('div', {
            className: 'sequencing-drag-zone',
            id: 'sequencingDragZone'
        });
        
        // Create drop zone (target)
        this.dropZone = DOMHelpers.createElement('div', {
            className: 'sequencing-drop-zone',
            id: 'sequencingDropZone'
        });
        
        // Create check button
        this.checkButton = DOMHelpers.createElement('button', {
            className: 'sequencing-check-btn',
            id: 'sequencingCheckBtn',
            textContent: 'Überprüfen'
        });
        
        // Add to container
        this.container.appendChild(this.dragZone);
        this.container.appendChild(this.dropZone);
        this.container.appendChild(this.checkButton);
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Check button
        DOMHelpers.addEventListener(this.checkButton, 'click', () => {
            this.checkAnswer();
        });
        
        // Prevent default drag behaviors
        document.addEventListener('dragover', (e) => e.preventDefault());
        document.addEventListener('drop', (e) => e.preventDefault());
    }
    
    /**
     * Load a sequencing question
     */
    loadQuestion(question) {
        this.reset();
        
        // Transform old format to new format if needed
        if (question.options && !question.segments) {
            this.segments = this.parseSegmentsFromOptions(question);
        } else {
            this.segments = question.segments || [];
        }
        
        this.correctOrder = question.correctOrder || this.segments.map(s => s.id);
        
        // Shuffle segments
        const shuffled = [...this.segments].sort(() => Math.random() - 0.5);
        
        // Create draggable elements
        this.createDraggableElements(shuffled);
        
        // Create drop slots
        this.createDropSlots();
        
        // Enable check button
        this.checkButton.disabled = false;
    }
    
    /**
     * Parse segments from old option format
     */
    parseSegmentsFromOptions(question) {
        // Take the correct answer and split it
        const correctOption = question.options[question.correct];
        const parts = correctOption.split(' - ');
        
        return parts.map((text, index) => ({
            id: index,
            text: text.trim(),
            group: `segment-${index}`
        }));
    }
    
    /**
     * Create draggable elements
     */
    createDraggableElements(segments) {
        this.dragZone.innerHTML = '';
        
        segments.forEach((segment, index) => {
            const element = DOMHelpers.createElement('div', {
                className: 'sequencing-segment',
                draggable: true,
                'data-segment-id': segment.id,
                'data-original-index': index
            });
            
            element.textContent = segment.text;
            
            // Desktop drag events
            element.addEventListener('dragstart', (e) => this.handleDragStart(e, segment, index));
            element.addEventListener('dragend', (e) => this.handleDragEnd(e));
            
            // Touch events
            element.addEventListener('touchstart', (e) => this.handleTouchStart(e, segment, index));
            element.addEventListener('touchmove', (e) => this.handleTouchMove(e));
            element.addEventListener('touchend', (e) => this.handleTouchEnd(e));
            
            // Double click/tap events
            element.addEventListener('dblclick', (e) => this.handleDoubleClick(e, segment));
            
            // Double tap detection
            let tapCount = 0;
            let tapTimer = null;
            element.addEventListener('touchstart', (e) => {
                tapCount++;
                if (tapCount === 1) {
                    tapTimer = setTimeout(() => {
                        tapCount = 0;
                    }, 300);
                } else if (tapCount === 2) {
                    clearTimeout(tapTimer);
                    tapCount = 0;
                    this.handleDoubleClick(e, segment);
                }
            });

            this.dragZone.appendChild(element);
        });
    }
    
    /**
     * Create drop slots
     */
    createDropSlots() {
        this.dropZone.innerHTML = '';
        
        for (let i = 0; i < this.segments.length; i++) {
            const slot = DOMHelpers.createElement('div', {
                className: 'sequencing-slot',
                'data-slot-index': i
            });
            
            // Drop events
            slot.addEventListener('dragover', (e) => this.handleDragOver(e));
            slot.addEventListener('drop', (e) => this.handleDrop(e, i));
            
            this.dropZone.appendChild(slot);
        }
    }
    
    /**
     * Handle drag start
     */
    handleDragStart(e, segment, index) {
        this.draggedElement = e.target;
        this.draggedIndex = index;
        e.target.classList.add('dragging');
        
        // Store segment data
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', JSON.stringify(segment));
    }
    
    /**
     * Handle drag end
     */
    handleDragEnd(e) {
        e.target.classList.remove('dragging');
    }
    
    /**
     * Handle drag over
     */
    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    }
    
    /**
     * Handle drop
     */
    handleDrop(e, slotIndex) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        
        const segment = JSON.parse(e.dataTransfer.getData('text/plain'));
        this.placeSegmentInSlot(segment, slotIndex);
    }
    
    /**
     * Handle double click/tap
     */
    handleDoubleClick(e, segment) {
        e.preventDefault();
        
        // Find first empty slot
        const slots = Array.from(this.dropZone.children);
        const emptySlotIndex = slots.findIndex(slot => !slot.querySelector('.sequencing-segment'));
        
        if (emptySlotIndex !== -1) {
            this.placeSegmentInSlot(segment, emptySlotIndex);
        }
    }

    /**
     * Handle touch start
     */
    handleTouchStart(e, segment, index) {
        const touch = e.touches[0];
        const element = e.currentTarget;
        
        this.draggedElement = element;
        this.draggedIndex = index;
        
        // Calculate offset
        const rect = element.getBoundingClientRect();
        this.touchOffset = {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        };
        
        element.classList.add('dragging');
        element.style.position = 'fixed';
        element.style.zIndex = '1000';
    }
    
    /**
     * Handle touch move
     */
    handleTouchMove(e) {
        if (!this.draggedElement) return;
        
        e.preventDefault();
        const touch = e.touches[0];
        
        this.draggedElement.style.left = `${touch.clientX - this.touchOffset.x}px`;
        this.draggedElement.style.top = `${touch.clientY - this.touchOffset.y}px`;
        
        // Find element under touch point
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        if (elementBelow && elementBelow.classList.contains('sequencing-slot')) {
            // Highlight slot
            document.querySelectorAll('.sequencing-slot').forEach(s => s.classList.remove('drag-over'));
            elementBelow.classList.add('drag-over');
        }
    }
    
    /**
     * Handle touch end
     */
    handleTouchEnd(e) {
        if (!this.draggedElement) return;
        
        const touch = e.changedTouches[0];
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        
        if (elementBelow && elementBelow.classList.contains('sequencing-slot')) {
            const slotIndex = parseInt(elementBelow.dataset.slotIndex);
            const segmentId = parseInt(this.draggedElement.dataset.segmentId);
            const segment = this.segments.find(s => s.id === segmentId);
            
            if (segment) {
                this.placeSegmentInSlot(segment, slotIndex);
            }
        }
        
        // Reset dragged element
        this.draggedElement.classList.remove('dragging');
        this.draggedElement.style.position = '';
        this.draggedElement.style.zIndex = '';
        this.draggedElement.style.left = '';
        this.draggedElement.style.top = '';
        this.draggedElement = null;
        
        // Clear highlights
        document.querySelectorAll('.sequencing-slot').forEach(s => s.classList.remove('drag-over'));
    }
    
    /**
     * Place segment in slot
     */
    placeSegmentInSlot(segment, slotIndex) {
        const slot = this.dropZone.children[slotIndex];
        
        // Create placed segment
        const placedSegment = DOMHelpers.createElement('div', {
            className: 'sequencing-segment placed',
            'data-segment-id': segment.id
        });
        
        placedSegment.textContent = segment.text;
        
        // Add remove capability
        placedSegment.addEventListener('click', () => {
            this.removeSegmentFromSlot(slotIndex);
        });
        
        // Clear slot and add segment
        slot.innerHTML = '';
        slot.appendChild(placedSegment);
        
        // Update user order
        this.updateUserOrder();
        
        // Hide original if all slots filled
        if (this.draggedElement) {
            this.draggedElement.classList.add('used');
        }
    }
    
    /**
     * Remove segment from slot
     */
    removeSegmentFromSlot(slotIndex) {
        const slot = this.dropZone.children[slotIndex];
        const segment = slot.querySelector('.sequencing-segment');
        
        if (segment) {
            const segmentId = parseInt(segment.dataset.segmentId);
            
            // Clear slot
            slot.innerHTML = '';
            
            // Show original element again
            const original = this.dragZone.querySelector(`[data-segment-id="${segmentId}"]`);
            if (original) {
                original.classList.remove('used');
            }
            
            this.updateUserOrder();
        }
    }
    
    /**
     * Update user order based on placed segments
     */
    updateUserOrder() {
        this.userOrder = [];
        
        Array.from(this.dropZone.children).forEach(slot => {
            const segment = slot.querySelector('.sequencing-segment');
            if (segment) {
                this.userOrder.push(parseInt(segment.dataset.segmentId));
            } else {
                this.userOrder.push(null);
            }
        });
    }
    
    /**
     * Check answer
     */
    checkAnswer() {
        if (this.isAnswered) return;
        
        // Check if all slots are filled
        if (this.userOrder.includes(null)) {
            alert('Bitte alle Satzteile platzieren!');
            return;
        }
        
        this.isAnswered = true;
        const correct = JSON.stringify(this.userOrder) === JSON.stringify(this.correctOrder);
        
        // Visual feedback
        this.userOrder.forEach((id, index) => {
            const slot = this.dropZone.children[index];
            if (id === this.correctOrder[index]) {
                slot.classList.add('correct');
            } else {
                slot.classList.add('incorrect');
            }
        });
        
        // Disable further interaction
        this.checkButton.disabled = true;
        this.dragZone.classList.add('disabled');
        
        // Notify callback
        if (this.onAnswer) {
            this.onAnswer({
                question: { correctOrder: this.correctOrder },
                userOrder: this.userOrder,
                correct: correct
            });
        }
    }
    
    /**
     * Reset the controller
     */
    reset() {
        this.segments = [];
        this.correctOrder = [];
        this.userOrder = [];
        this.isAnswered = false;
        this.draggedElement = null;
        
        if (this.dragZone) this.dragZone.innerHTML = '';
        if (this.dropZone) this.dropZone.innerHTML = '';
        if (this.checkButton) this.checkButton.disabled = false;
    }
}