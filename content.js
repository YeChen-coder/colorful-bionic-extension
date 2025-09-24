// Content script for Colorful Bionic Reading - Performance Optimized
let bionicApplied = false;
let currentSettings = {
    boldRatio: 50,
    fontSize: 110,
    fontWeight: 700,
    colorMode: 'rainbow',
    singleColor: '#3366ff',
    customColors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'],
    rainbowColors: ['#ff6b6b', '#ffa726', '#66bb6a', '#42a5f5', '#ab47bc', '#ef5350'],
    colorIntensity: 70
};

// Store original text content for restoration
let originalContent = new Map();
let colorIndex = 0;
let processingTimeout = null;
let isProcessing = false;

// Performance optimization constants
const MAX_TEXT_NODES = 1000; // Limit the number of text nodes to process
const MIN_WORD_LENGTH = 3; // Only process words longer than 3 characters
const BATCH_SIZE = 50; // Batch size for processing nodes

function getNextColor() {
    let colors;
    switch (currentSettings.colorMode) {
        case 'single':
            return currentSettings.singleColor;
        case 'custom':
            colors = currentSettings.customColors;
            if (!colors || colors.length === 0) {
                // If custom colors are empty, fallback to rainbow mode
                colors = currentSettings.rainbowColors;
            }
            break;
        case 'rainbow':
        default:
            colors = currentSettings.rainbowColors;
            break;
    }
    
    const color = colors[colorIndex % colors.length];
    colorIndex++;
    return color;
}

function hexToRgba(hex, alpha = 1) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return `rgba(0,0,0,${alpha})`;
    
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function applyBionicToWord(word) {
    if (!word || word.length < MIN_WORD_LENGTH) return word;
    
    const boldLength = Math.ceil(word.length * (currentSettings.boldRatio / 100));
    const boldPart = word.substring(0, boldLength);
    const normalPart = word.substring(boldLength);
    
    const color = getNextColor();
    const alpha = currentSettings.colorIntensity / 100;
    const fontSize = (currentSettings.fontSize || 110) / 100;
    const fontWeight = currentSettings.fontWeight || 700;
    
    return `<span class="bionic-bold" style="color: ${hexToRgba(color, alpha)}; font-size: ${fontSize}em; font-weight: ${fontWeight};">${boldPart}</span><span class="bionic-normal">${normalPart}</span>`;
}

function processBionicText(text) {
    // Simplified text processing - only handle alphanumeric words
    return text.replace(/\b[a-zA-Z0-9]{3,}\b/g, function(word) {
        return applyBionicToWord(word);
    });
}

function isValidTextNode(node) {
    // Stricter filtering conditions for better performance
    const skipTags = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'META', 'HEAD', 'TITLE', 'CODE', 'PRE'];
    const parent = node.parentElement;
    
    if (!parent || skipTags.includes(parent.tagName)) {
        return false;
    }
    
    // Skip if already processed
    if (parent.closest('.bionic-processed')) {
        return false;
    }
    
    const text = node.textContent.trim();
    // Only process nodes containing sufficient text
    return text.length > 10 && /[a-zA-Z]{3,}/.test(text);
}

// Asynchronous batch processing of text nodes
async function processTextNodesBatch(textNodes, startIndex = 0) {
    const endIndex = Math.min(startIndex + BATCH_SIZE, textNodes.length);
    
    for (let i = startIndex; i < endIndex; i++) {
        const textNode = textNodes[i];
        const parent = textNode.parentElement;
        if (!parent) continue;
        
        try {
            // Store original content
            const nodeId = Math.random().toString(36).substring(2);
            originalContent.set(nodeId, {
                element: parent,
                originalHTML: parent.innerHTML
            });
            
            // Apply bionic reading
            const bionicHTML = processBionicText(textNode.textContent);
            const span = document.createElement('span');
            span.innerHTML = bionicHTML;
            span.className = 'bionic-processed';
            span.setAttribute('data-original-id', nodeId);
            
            // Replace text node with processed span
            parent.replaceChild(span, textNode);
        } catch (error) {
            console.warn('Error processing text node:', error);
        }
    }
    
    // If there are more nodes to process, continue with the next batch
    if (endIndex < textNodes.length) {
        // Give the browser time to handle other tasks
        await new Promise(resolve => setTimeout(resolve, 10));
        await processTextNodesBatch(textNodes, endIndex);
    }
}

function applyBionicReading() {
    if (bionicApplied || isProcessing) return;
    
    // Prevent duplicate processing
    if (processingTimeout) {
        clearTimeout(processingTimeout);
    }
    
    processingTimeout = setTimeout(async () => {
        isProcessing = true;
        console.log('Starting optimized bionic reading application...');
        
        try {
            // Quick check of page size, skip if too large
            const pageText = document.body.textContent;
            if (pageText.length > 500000) { // Skip pages with more than 500k characters
                console.log('Page too large, skipping bionic reading');
                isProcessing = false;
                return;
            }
            
            // More efficient text node collection
            const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: function(node) {
                        return isValidTextNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
                    }
                }
            );
            
            const textNodes = [];
            let node;
            let nodeCount = 0;
            
            while ((node = walker.nextNode()) && nodeCount < MAX_TEXT_NODES) {
                textNodes.push(node);
                nodeCount++;
            }
            
            console.log(`Processing ${textNodes.length} text nodes...`);
            
            // Reset color index
            colorIndex = 0;
            
            // Asynchronous batch processing
            await processTextNodesBatch(textNodes);
            
            bionicApplied = true;
            console.log('Colorful Bionic Reading applied successfully');
        } catch (error) {
            console.error('Error applying bionic reading:', error);
        } finally {
            isProcessing = false;
        }
    }, 100); // 100ms delay to avoid frequent triggers
}

function removeBionicReading() {
    if (!bionicApplied) return;
    
    console.log('Removing bionic reading...');
    
    // Clear processing timeout
    if (processingTimeout) {
        clearTimeout(processingTimeout);
        processingTimeout = null;
    }
    
    try {
        // Batch restore original content
        const fragment = document.createDocumentFragment();
        originalContent.forEach((data, nodeId) => {
            const element = data.element;
            if (element && element.parentNode) {
                element.innerHTML = data.originalHTML;
            }
        });
        
        originalContent.clear();
        bionicApplied = false;
        isProcessing = false;
        colorIndex = 0;
        console.log('Colorful Bionic Reading removed');
    } catch (error) {
        console.error('Error removing bionic reading:', error);
        // Force clear state
        originalContent.clear();
        bionicApplied = false;
        isProcessing = false;
    }
}

function updateColorSettings(settings) {
    currentSettings = { ...currentSettings, ...settings };
    
    // Throttled update - avoid frequent re-application
    if (processingTimeout) {
        clearTimeout(processingTimeout);
    }
    
    if (bionicApplied) {
        processingTimeout = setTimeout(() => {
            removeBionicReading();
            applyBionicReading();
        }, 200); // 200ms delay
    }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    try {
        switch(request.action) {
            case 'checkStatus':
                sendResponse({ 
                    bionicApplied: bionicApplied,
                    isProcessing: isProcessing,
                    nodeCount: originalContent.size
                });
                break;
                
            case 'toggleBionic':
                // Update settings
                currentSettings = {
                    boldRatio: request.boldRatio || 50,
                    fontSize: request.fontSize || 110,
                    fontWeight: request.fontWeight || 700,
                    colorMode: request.colorMode || 'rainbow',
                    singleColor: request.singleColor || '#3366ff',
                    customColors: request.customColors || currentSettings.customColors,
                    rainbowColors: request.rainbowColors || currentSettings.rainbowColors,
                    colorIntensity: request.colorIntensity || 70
                };
                
                console.log('Updated settings:', currentSettings);
                
                // Debounce handling
                if (processingTimeout) {
                    clearTimeout(processingTimeout);
                }
                
                processingTimeout = setTimeout(() => {
                    if (request.enabled && !isProcessing) {
                        applyBionicReading();
                    } else if (!request.enabled) {
                        removeBionicReading();
                    }
                    
                    sendResponse({ 
                        success: true, 
                        bionicApplied: bionicApplied,
                        isProcessing: isProcessing 
                    });
                }, 150);
                
                return true; // Indicates asynchronous response
                
            case 'updateColorSettings':
                updateColorSettings(request);
                sendResponse({ success: true });
                break;
                
            default:
                sendResponse({ error: 'Unknown action' });
        }
    } catch (error) {
        console.error('Error handling message:', error);
        sendResponse({ error: error.message });
    }
});

// Optimized auto-apply logic
function initializeBionicReading() {
    // Avoid running on special pages
    if (location.href.startsWith('chrome://') || 
        location.href.startsWith('edge://') || 
        location.href.startsWith('about:') ||
        document.body.textContent.length > 1000000) { // Skip pages with more than 1M characters
        return;
    }
    
    chrome.storage.sync.get(['bionicEnabled'], function(result) {
        if (result.bionicEnabled && !isProcessing) {
            // Delayed application, let page load completely
            setTimeout(applyBionicReading, 500);
        }
    });
}

// Initialize after page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeBionicReading);
} else {
    // Page has already loaded
    setTimeout(initializeBionicReading, 100);
}