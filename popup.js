// Popup script for Colorful Bionic Reading Extension - Performance Optimized
document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const bionicEnabledToggle = document.getElementById('bionicEnabled');
    const settingsPanel = document.getElementById('settingsPanel');
    const boldRatioSlider = document.getElementById('boldRatio');
    const boldRatioValue = document.getElementById('boldRatioValue');
    const fontSizeSlider = document.getElementById('fontSize');
    const fontSizeValue = document.getElementById('fontSizeValue');
    const fontWeightSlider = document.getElementById('fontWeight');
    const fontWeightValue = document.getElementById('fontWeightValue');
    const colorIntensitySlider = document.getElementById('colorIntensity');
    const colorIntensityValue = document.getElementById('colorIntensityValue');
    const modeTabs = document.querySelectorAll('.mode-tab');
    const singleColorSetting = document.getElementById('singleColorSetting');
    const customColorSetting = document.getElementById('customColorSetting');
    const singleColorInput = document.getElementById('singleColor');
    const singleColorPreview = document.getElementById('singleColorPreview');
    const customColorPalette = document.getElementById('customColorPalette');
    const addColorBtn = document.getElementById('addColorBtn');
    const previewText = document.getElementById('previewText');
    const resetBtn = document.getElementById('resetBtn');

    // Performance optimization variables
    let updateTimeout = null;
    let previewTimeout = null;

    // Default settings
    const defaultSettings = {
        bionicEnabled: true,
        boldRatio: 50,
        fontSize: 110,
        fontWeight: 700,
        colorMode: 'rainbow',
        singleColor: '#3366ff',
        customColors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'],
        rainbowColors: ['#ff6b6b', '#ffa726', '#66bb6a', '#42a5f5', '#ab47bc', '#ef5350'],
        colorIntensity: 70
    };

    let currentSettings = { ...defaultSettings };

    // Load settings and initialize UI
    loadSettings();

    // Event listeners
    bionicEnabledToggle.addEventListener('change', handleToggleChange);
    boldRatioSlider.addEventListener('input', handleBoldRatioChange);
    fontSizeSlider.addEventListener('input', handleFontSizeChange);
    fontWeightSlider.addEventListener('input', handleFontWeightChange);
    colorIntensitySlider.addEventListener('input', handleColorIntensityChange);
    singleColorInput.addEventListener('change', handleSingleColorChange);
    addColorBtn.addEventListener('click', addCustomColor);
    resetBtn.addEventListener('click', resetToDefaults);

    // Mode tab listeners
    modeTabs.forEach(tab => {
        tab.addEventListener('click', () => handleModeChange(tab.dataset.mode));
    });

    function loadSettings() {
        chrome.storage.sync.get(Object.keys(defaultSettings), function(result) {
            currentSettings = { ...defaultSettings, ...result };
            updateUI();
            updatePreview();
        });
    }

    function saveSettings(callback) {
        chrome.storage.sync.set(currentSettings, function() {
            console.log('Settings saved');
            if (callback) callback();
        });
    }

    function updateUI() {
        // Update toggle
        bionicEnabledToggle.checked = currentSettings.bionicEnabled;
        
        // Update settings panel visibility
        if (currentSettings.bionicEnabled) {
            settingsPanel.classList.remove('disabled');
        } else {
            settingsPanel.classList.add('disabled');
        }

        // Update sliders
        boldRatioSlider.value = currentSettings.boldRatio;
        boldRatioValue.textContent = currentSettings.boldRatio + '%';
        
        fontSizeSlider.value = currentSettings.fontSize;
        fontSizeValue.textContent = currentSettings.fontSize + '%';
        
        fontWeightSlider.value = currentSettings.fontWeight;
        fontWeightValue.textContent = getFontWeightLabel(currentSettings.fontWeight);
        
        colorIntensitySlider.value = currentSettings.colorIntensity;
        colorIntensityValue.textContent = currentSettings.colorIntensity + '%';

        // Update mode tabs
        modeTabs.forEach(tab => {
            if (tab.dataset.mode === currentSettings.colorMode) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Update color settings visibility
        singleColorSetting.style.display = currentSettings.colorMode === 'single' ? 'block' : 'none';
        customColorSetting.style.display = currentSettings.colorMode === 'custom' ? 'block' : 'none';

        // Update single color
        singleColorInput.value = currentSettings.singleColor;
        singleColorPreview.style.backgroundColor = currentSettings.singleColor;

        // Update custom color palette
        updateCustomColorPalette();
    }
    
    function getFontWeightLabel(weight) {
        const labels = {
            400: 'Normal',
            500: 'Medium',
            600: 'Semi-bold',
            700: 'Bold',
            800: 'Extra-bold',
            900: 'Ultra-bold'
        };
        return labels[weight] || 'Bold';
    }

    function updateCustomColorPalette() {
        customColorPalette.innerHTML = '';
        currentSettings.customColors.forEach((color, index) => {
            const colorItem = createColorItem(color, index);
            customColorPalette.appendChild(colorItem);
        });
    }

    function createColorItem(color, index) {
        const colorItem = document.createElement('div');
        colorItem.className = 'color-item';
        
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = color;
        
        // Fixed: Properly bind color change event
        colorInput.addEventListener('change', (e) => {
            console.log(`Color ${index} changed to ${e.target.value}`);
            currentSettings.customColors[index] = e.target.value;
            saveAndUpdate();
        });

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-color';
        removeBtn.innerHTML = '×';
        removeBtn.title = 'Remove this color';
        
        // Fixed: Properly bind remove event
        removeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log(`Removing color at index ${index}`);
            
            if (currentSettings.customColors.length > 1) {
                // Create new array instead of modifying the original
                currentSettings.customColors = currentSettings.customColors.filter((_, i) => i !== index);
                console.log('New colors:', currentSettings.customColors);
                saveAndUpdate();
            } else {
                alert('At least one color must be kept!');
            }
        });

        colorItem.appendChild(colorInput);
        colorItem.appendChild(removeBtn);
        
        return colorItem;
    }

    function addCustomColor() {
        if (currentSettings.customColors.length < 8) {
            // Generate a random color
            const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
            console.log('Adding new color:', randomColor);
            
            // Create new array
            currentSettings.customColors = [...currentSettings.customColors, randomColor];
            console.log('Updated colors:', currentSettings.customColors);
            
            saveAndUpdate();
        } else {
            alert('You can add a maximum of 8 colors!');
        }
    }

    function handleToggleChange() {
        currentSettings.bionicEnabled = bionicEnabledToggle.checked;
        console.log('Toggle changed:', currentSettings.bionicEnabled);
        saveAndUpdate();
        
        // Send message to background script
        chrome.runtime.sendMessage({
            action: 'updateSettings',
            settings: currentSettings
        }).catch(error => {
            console.log('Background script not ready:', error);
        });
    }

    function handleBoldRatioChange() {
        currentSettings.boldRatio = parseInt(boldRatioSlider.value);
        boldRatioValue.textContent = currentSettings.boldRatio + '%';
        saveAndUpdate();
    }
    
    function handleFontSizeChange() {
        currentSettings.fontSize = parseInt(fontSizeSlider.value);
        fontSizeValue.textContent = currentSettings.fontSize + '%';
        saveAndUpdate();
    }
    
    function handleFontWeightChange() {
        currentSettings.fontWeight = parseInt(fontWeightSlider.value);
        fontWeightValue.textContent = getFontWeightLabel(currentSettings.fontWeight);
        saveAndUpdate();
    }

    function handleColorIntensityChange() {
        currentSettings.colorIntensity = parseInt(colorIntensitySlider.value);
        colorIntensityValue.textContent = currentSettings.colorIntensity + '%';
        saveAndUpdate();
    }

    function handleSingleColorChange() {
        currentSettings.singleColor = singleColorInput.value;
        singleColorPreview.style.backgroundColor = currentSettings.singleColor;
        saveAndUpdate();
    }

    function handleModeChange(mode) {
        currentSettings.colorMode = mode;
        
        // Update tab appearance
        modeTabs.forEach(tab => {
            if (tab.dataset.mode === mode) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Show/hide relevant settings
        singleColorSetting.style.display = mode === 'single' ? 'block' : 'none';
        customColorSetting.style.display = mode === 'custom' ? 'block' : 'none';

        saveAndUpdate();
    }

    function saveAndUpdate() {
        // Clear previous update timeout
        if (updateTimeout) {
            clearTimeout(updateTimeout);
        }
        
        // Throttled save and update
        updateTimeout = setTimeout(() => {
            saveSettings(() => {
                updatePreview();
                // Send update to content script (with error handling)
                chrome.runtime.sendMessage({
                    action: 'updateSettings',
                    settings: currentSettings
                }).catch(error => {
                    console.log('Background script not ready:', error);
                });
            });
        }, 150); // 150ms throttling delay
    }

    function resetToDefaults() {
        if (confirm('Are you sure you want to reset to default settings?')) {
            currentSettings = { ...defaultSettings };
            saveSettings(() => {
                updateUI();
                updatePreview();
                chrome.runtime.sendMessage({
                    action: 'updateSettings',
                    settings: currentSettings
                });
            });
        }
    }

    function updatePreview() {
        // Throttled preview update
        if (previewTimeout) {
            clearTimeout(previewTimeout);
        }
        
        previewTimeout = setTimeout(() => {
            if (!currentSettings.bionicEnabled) {
                previewText.innerHTML = previewText.textContent;
                return;
            }

            const words = previewText.textContent.split(/(\s+)/);
            let colorIndex = 0;
            
            const processedWords = words.map(word => {
                if (/[a-zA-Z]{3,}/.test(word)) { // Only process words with 3 or more letters
                    const color = getPreviewColor(colorIndex++);
                    const alpha = currentSettings.colorIntensity / 100;
                    const boldLength = Math.ceil(word.length * (currentSettings.boldRatio / 100));
                    const boldPart = word.substring(0, boldLength);
                    const normalPart = word.substring(boldLength);
                    
                    const fontSize = currentSettings.fontSize / 100;
                    const fontWeight = currentSettings.fontWeight;
                    
                    return `<span class="preview-bionic-bold" style="color: ${hexToRgba(color, alpha)}; font-size: ${fontSize}em; font-weight: ${fontWeight};">${boldPart}</span><span class="preview-bionic-normal">${normalPart}</span>`;
                }
                return word;
            });

            previewText.innerHTML = processedWords.join('');
        }, 100); // 100ms delay
    }

    function getPreviewColor(index) {
        switch (currentSettings.colorMode) {
            case 'single':
                return currentSettings.singleColor;
            case 'custom':
                return currentSettings.customColors[index % currentSettings.customColors.length];
            case 'rainbow':
            default:
                return currentSettings.rainbowColors[index % currentSettings.rainbowColors.length];
        }
    }

    function hexToRgba(hex, alpha = 1) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return `rgba(0,0,0,${alpha})`;
        
        const r = parseInt(result[1], 16);
        const g = parseInt(result[2], 16);
        const b = parseInt(result[3], 16);
        
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // Update preview when popup opens (with delay for better performance)
    setTimeout(() => {
        updatePreview();
    }, 200);
});