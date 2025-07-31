/**
 * Configuration constants for the German Listening Comprehension Tool
 */
export const CONFIG = {
    // External URLs
    lessonsUrl: 'https://raw.githubusercontent.com/smarterGerman/listening-tool/main/lessons/lessons.json',
    
    // Timing constants
    autoResizeDelay: 50,
    hintAutoHideDelay: 8000,
    heightReportThrottle: 100,
    backupPollingInterval: 5000,
    
    // Exercise modes
    exerciseModes: {
        ALL: 'all',
        COMPREHENSION: 'comprehension',
        VERB_RECOGNITION: 'verb',
        GRAMMAR_FOCUS: 'grammar',
        PHONETIC: 'phonetic',
        INFERENCE: 'inference',
        CONTEXT: 'context',
        SEQUENCING: 'sequencing',
        GAP_FILL: 'gapfill'
    },
    
    // Mode display names
    modeNames: {
        all: 'Alle Fragen',
        comprehension: 'Inhaltsverständnis',
        verb: 'Verb-Erkennung',
        grammar: 'Grammatik-Fokus',
        phonetic: 'Phonetik',
        inference: 'Inferenz & Implikatur',
        context: 'Kontext erschließen',
        sequencing: 'Sequenzierung',
        gapfill: 'Lückentext-Hören'
    },
    
    // Mode abbreviations for button display
    modeAbbreviations: {
        all: 'A',
        comprehension: 'I',
        verb: 'V',
        grammar: 'G',
        phonetic: 'P',
        inference: 'F',  // F for Folgerung (Inference)
        context: 'K',
        sequencing: 'S',
        gapfill: 'L'
    },
    
    // UI constants
    defaultMode: 'comprehension',
    defaultLesson: 'A1L01',
    
    // Speed settings
    speeds: [1.0, 0.75, 0.5],
    speedLabels: ['100', '75', '50'],
    speedClasses: ['speed-100', 'speed-75', 'speed-50'],
    
    // Answer feedback
    feedbackDelay: 1500, // Time to show feedback before moving on
    
    // Keyboard shortcuts
    shortcuts: {
        playPause: ['shift+ctrl+enter', 'shift+meta+enter'],
        previousSentence: ['shift+ctrl+arrowleft', 'shift+meta+arrowleft'],
        nextSentence: ['shift+ctrl+arrowright', 'shift+meta+arrowright'],
        repeatSentence: ['shift+ctrl+arrowup', 'shift+meta+arrowup'],
        toggleSpeed: ['shift+ctrl+arrowdown', 'shift+meta+arrowdown'],
        showHint: ['shift+ctrl+/', 'shift+meta+/', 'shift+ctrl+ß', 'shift+meta+ß'],
        answer1: ['1', 'a'],
        answer2: ['2', 'b'],
        answer3: ['3', 'c'],
        answer4: ['4', 'd'],
        submitAnswer: ['enter']
    },
    
    // Messages
    messages: {
        selectAnswer: 'Hören Sie den Satz und wählen Sie dann eine Antwort.',
        correct: 'Richtig!',
        incorrect: 'Leider falsch.',
        tryAgain: 'Versuchen Sie es noch einmal.',
        loading: 'Lade Lektion...',
        error: 'Ein Fehler ist aufgetreten.',
        noQuestions: 'Keine Fragen für diesen Satz vorhanden.'
    }
};