/**
 * DOM Helper Utilities
 */
export class DOMHelpers {
    /**
     * Get element by ID with optional error handling
     */
    static getElementById(id, required = false) {
        const element = document.getElementById(id);
        if (required && !element) {
            console.error(`Required element with ID '${id}' not found`);
        }
        return element;
    }
    
    /**
     * Get element by selector
     */
    static querySelector(selector, required = false) {
        const element = document.querySelector(selector);
        if (required && !element) {
            console.error(`Required element with selector '${selector}' not found`);
        }
        return element;
    }
    
    /**
     * Get all elements by selector
     */
    static querySelectorAll(selector) {
        return document.querySelectorAll(selector);
    }
    
    /**
     * Add event listener
     */
    static addEventListener(element, event, handler) {
        if (element && typeof handler === 'function') {
            element.addEventListener(event, handler);
            return true;
        }
        return false;
    }
    
    /**
     * Set element content safely
     */
    static setContent(element, content, isHTML = false) {
        if (!element) return false;
        
        if (isHTML) {
            element.innerHTML = content;
        } else {
            element.textContent = content;
        }
        return true;
    }
    
    /**
     * Show/hide element
     */
    static toggleDisplay(element, show, displayType = 'block') {
        if (!element) return false;
        
        element.style.display = show ? displayType : 'none';
        return true;
    }
    
    /**
     * Add/remove CSS class
     */
    static toggleClass(element, className, add) {
        if (!element) return false;
        
        if (add) {
            element.classList.add(className);
        } else {
            element.classList.remove(className);
        }
        return true;
    }
    
    /**
     * Check if element has class
     */
    static hasClass(element, className) {
        return element ? element.classList.contains(className) : false;
    }
    
    /**
     * Create element with attributes
     */
    static createElement(tagName, attributes = {}, content = '') {
        const element = document.createElement(tagName);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key.startsWith('data-')) {
                element.setAttribute(key, value);
            } else {
                element[key] = value;
            }
        });
        
        if (content) {
            element.textContent = content;
        }
        
        return element;
    }
}