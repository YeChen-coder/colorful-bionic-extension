// Initialize default settings when extension is installed
chrome.runtime.onInstalled.addListener(function () {
    chrome.storage.sync.set({
        bionicEnabled: true,
        boldRatio: 50,
        fontSize: 110,
        fontWeight: 700,
        colorMode: 'rainbow', // 'single', 'rainbow', 'custom'
        singleColor: '#3366ff',
        customColors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'],
        rainbowColors: ['#ff6b6b', '#ffa726', '#66bb6a', '#42a5f5', '#ab47bc', '#ef5350'],
        colorIntensity: 70 // 0-100, affects opacity/brightness
    }, function () {
        console.log('Default colorful bionic settings initialized');
    });
});

// Listen for tab updates to reapply bionic reading when navigating
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('edge://')) {
        chrome.storage.sync.get([
            'bionicEnabled', 
            'boldRatio', 
            'colorMode', 
            'singleColor', 
            'customColors', 
            'rainbowColors', 
            'colorIntensity'
        ], function (result) {
            const isEnabled = result.bionicEnabled !== undefined ? result.bionicEnabled : true;

            if (isEnabled) {
                // Wait a moment for the page to fully load before applying bionic reading
                setTimeout(() => {
                    chrome.tabs.sendMessage(tabId, { action: 'checkStatus' }, function (response) {
                        // If error or no response, the content script may not be injected yet
                        if (chrome.runtime.lastError || !response) {
                            console.log('Content script not loaded, injecting...');
                            try {
                                chrome.scripting.executeScript({
                                    target: { tabId: tabId },
                                    files: ['content.js']
                                }).then(() => {
                                    chrome.scripting.insertCSS({
                                        target: { tabId: tabId },
                                        files: ['bionic.css']
                                    }).then(() => {
                                        // After injection, send toggle message to apply colorful bionic reading
                                        const settings = {
                                            action: 'toggleBionic',
                                            enabled: isEnabled,
                                            boldRatio: result.boldRatio || 50,
                                            colorMode: result.colorMode || 'rainbow',
                                            singleColor: result.singleColor || '#3366ff',
                                            customColors: result.customColors || ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'],
                                            rainbowColors: result.rainbowColors || ['#ff6b6b', '#ffa726', '#66bb6a', '#42a5f5', '#ab47bc', '#ef5350'],
                                            colorIntensity: result.colorIntensity || 70
                                        };

                                        chrome.tabs.sendMessage(tabId, settings);
                                    });
                                });
                            } catch (error) {
                                console.error("Error injecting content script:", error);
                            }
                        } else if (response && !response.bionicApplied && isEnabled) {
                            // Content script loaded but bionic not applied, apply it
                            const settings = {
                                action: 'toggleBionic',
                                enabled: isEnabled,
                                boldRatio: result.boldRatio || 50,
                                colorMode: result.colorMode || 'rainbow',
                                singleColor: result.singleColor || '#3366ff',
                                customColors: result.customColors || ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'],
                                rainbowColors: result.rainbowColors || ['#ff6b6b', '#ffa726', '#66bb6a', '#42a5f5', '#ab47bc', '#ef5350'],
                                colorIntensity: result.colorIntensity || 70
                            };

                            chrome.tabs.sendMessage(tabId, settings);
                        }
                    });
                }, 500);
            }
        });
    }
});

// Throttling mechanism - avoid frequent updates
let updateTimeout = null;

// Listen for messages from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'updateSettings') {
        // Clear previous update timeout
        if (updateTimeout) {
            clearTimeout(updateTimeout);
        }
        
        // Throttled update to all active tabs
        updateTimeout = setTimeout(() => {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if (tabs[0] && 
                    tabs[0].url && 
                    !tabs[0].url.startsWith('chrome://') && 
                    !tabs[0].url.startsWith('edge://')) {
                    
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: 'updateColorSettings',
                        ...request.settings
                    }).catch(error => {
                        // Ignore message sending errors (page may not be ready)
                        console.log('Failed to send message to tab:', error);
                    });
                }
            });
        }, 100); // 100ms throttling
        
        sendResponse({success: true});
    }
});