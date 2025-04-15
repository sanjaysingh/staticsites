document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const fileInput = document.getElementById('file-input');
    const dropzone = document.getElementById('dropzone');
    const imagePreview = document.getElementById('image-preview');
    const displayArea = document.getElementById('display-area');
    const statsBar = document.getElementById('stats-bar');
    const dimensionsInfo = document.getElementById('dimensions-info');
    const sizeInfo = document.getElementById('size-info');
    const imageState = document.getElementById('image-state');
    const settingsPanel = document.getElementById('settings-panel');
    const settingsOverlay = document.getElementById('settings-overlay');
    const settingsBtn = document.getElementById('settings-btn');
    const resetBtn = document.getElementById('reset-btn');
    const optimizeBtn = document.getElementById('optimize-btn');
    const downloadBtn = document.getElementById('download-btn');
    const qualitySlider = document.getElementById('quality-slider');
    const qualityValue = document.getElementById('quality-value');
    const maxWidthInput = document.getElementById('max-width');
    const maxHeightInput = document.getElementById('max-height');
    const formatSelect = document.getElementById('format-select');
    const applySettingsBtn = document.getElementById('apply-settings-btn');
    
    // State variables
    let originalImage = null;
    let originalImageBlob = null;
    let optimizedImageUrl = null;
    let optimizedImageBlob = null;
    let currentState = 'upload'; // 'upload', 'original', 'optimized'

    // Settings toggle
    settingsBtn.addEventListener('click', () => {
        const isVisible = settingsPanel.style.display === 'block';
        settingsPanel.style.display = isVisible ? 'none' : 'block';
        settingsBtn.classList.toggle('active', !isVisible);
    });
    
    // Close settings
    function closeSettings() {
        settingsPanel.style.display = 'none';
        settingsBtn.classList.remove('active');
    }
    
    // Apply settings button
    applySettingsBtn.addEventListener('click', () => {
        closeSettings();
        if (currentState === 'original' || currentState === 'optimized') {
            optimizeImage();
        }
    });

    // Reset button
    resetBtn.addEventListener('click', handleReset);
    
    function handleReset() {
        if (currentState === 'optimized') {
            // Reset to original state
            resetToOriginal();
        } else {
            // Reset to initial upload state
            resetToInitialState();
        }
    }
    
    function resetToOriginal() {
        // Update UI state
        currentState = 'original';
        imageState.textContent = 'Original';
        
        // Update image display back to original
        imagePreview.src = originalImage.src;
        
        // Update stats back to original
        dimensionsInfo.textContent = `${originalImage.width} × ${originalImage.height}`;
        sizeInfo.textContent = formatFileSize(originalImageBlob.size);
        
        // Disable download button, enable optimize button
        downloadBtn.disabled = true;
        optimizeBtn.disabled = false;
        
        // Reset optimized data
        optimizedImageUrl = null;
        optimizedImageBlob = null;
    }
    
    function resetToInitialState() {
        // Reset UI
        dropzone.style.display = 'flex';
        imagePreview.style.display = 'none';
        statsBar.style.display = 'none';
        imageState.style.display = 'none';
        
        // Reset buttons
        optimizeBtn.disabled = true;
        downloadBtn.disabled = true;
        
        // Reset state
        currentState = 'upload';
        originalImage = null;
        originalImageBlob = null;
        optimizedImageUrl = null;
        optimizedImageBlob = null;
        
        // Clear inputs
        fileInput.value = '';
        maxWidthInput.value = '';
        maxHeightInput.value = '';
        
        // Reset placeholder
        maxWidthInput.placeholder = 'Width';
        maxHeightInput.placeholder = 'Height';
    }

    // Event listeners for file input
    dropzone.addEventListener('click', () => fileInput.click());
    
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = '#0d6efd';
    });
    
    dropzone.addEventListener('dragleave', () => {
        dropzone.style.borderColor = '#ced4da';
    });
    
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = '#ced4da';
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFile(e.target.files[0]);
        }
    });

    // Format selection change handler
    formatSelect.addEventListener('change', updateFormatSpecificUI);
    
    // Update UI based on format
    function updateFormatSpecificUI() {
        const format = formatSelect.value;
        const formatNote = document.getElementById('format-note');
        const qualityControl = document.getElementById('quality-control');
        
        if (format === 'png') {
            formatNote.textContent = 'PNG: Lossless. Size reduction only from resizing.';
            qualityControl.style.display = 'none';
        } else if (format === 'jpeg') {
            formatNote.textContent = 'JPEG: Best for photos with good compression.';
            qualityControl.style.display = 'block';
        } else if (format === 'webp') {
            formatNote.textContent = 'WebP: Good compression with high quality.';
            qualityControl.style.display = 'block';
        }
    }
    
    // Initialize format UI
    updateFormatSpecificUI();

    // Handle file selection
    function handleFile(file) {
        if (!file.type.match(/image.*/)) {
            alert('Please select an image file.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            originalImageBlob = file;
            originalImage = new Image();
            originalImage.onload = () => {
                // Switch to original image view
                showOriginalImage(e.target.result, file);
                
                // Add aspect ratio preservation handlers
                setupAspectRatioHandlers();
            };
            originalImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    function setupAspectRatioHandlers() {
        const aspectRatio = originalImage.width / originalImage.height;
        
        maxWidthInput.addEventListener('input', () => {
            if (maxWidthInput.value) {
                maxHeightInput.value = Math.round(parseInt(maxWidthInput.value) / aspectRatio);
            }
        });
        
        maxHeightInput.addEventListener('input', () => {
            if (maxHeightInput.value) {
                maxWidthInput.value = Math.round(parseInt(maxHeightInput.value) * aspectRatio);
            }
        });
    }
    
    function showOriginalImage(imageUrl, file) {
        // Update UI state
        currentState = 'original';
        imageState.textContent = 'Original';
        imageState.style.display = 'block';
        
        // Update image display
        dropzone.style.display = 'none';
        imagePreview.src = imageUrl;
        imagePreview.style.display = 'block';
        statsBar.style.display = 'block';
        
        // Update stats
        dimensionsInfo.textContent = `${originalImage.width} × ${originalImage.height}`;
        sizeInfo.textContent = formatFileSize(file.size);
        
        // Set default max dimensions
        maxWidthInput.value = originalImage.width;
        maxHeightInput.value = originalImage.height;
        maxWidthInput.placeholder = "Width";
        maxHeightInput.placeholder = "Height";
        
        // Enable optimize button
        optimizeBtn.disabled = false;
        
        // Add optimize click handler
        optimizeBtn.onclick = optimizeImage;
    }
    
    function showOptimizedImage(imageUrl, dimensions, size) {
        // Update UI state
        currentState = 'optimized';
        imageState.textContent = 'Optimized';
        
        // Update image display
        imagePreview.src = imageUrl;
        
        // Update stats
        dimensionsInfo.textContent = dimensions;
        sizeInfo.textContent = size;
        
        // Enable download button
        downloadBtn.disabled = false;
        
        // Set download handler
        downloadBtn.onclick = downloadOptimizedImage;
    }

    // Quality slider event
    qualitySlider.addEventListener('input', () => {
        qualityValue.textContent = `${qualitySlider.value}%`;
    });

    // Optimize image function
    function optimizeImage() {
        if (!originalImage) return;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Determine dimensions
        let targetWidth = parseInt(maxWidthInput.value) || originalImage.width;
        let targetHeight = parseInt(maxHeightInput.value) || originalImage.height;
        
        // Calculate proportional dimensions if only one dimension is specified
        if (maxWidthInput.value && !maxHeightInput.value) {
            const ratio = originalImage.height / originalImage.width;
            targetHeight = Math.round(targetWidth * ratio);
        } else if (!maxWidthInput.value && maxHeightInput.value) {
            const ratio = originalImage.width / originalImage.height;
            targetWidth = Math.round(targetHeight * ratio);
        }
        
        // Apply size limits
        targetWidth = Math.min(targetWidth, originalImage.width);
        targetHeight = Math.min(targetHeight, originalImage.height);
        
        // Set canvas dimensions
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        // Draw image to canvas with specified dimensions
        ctx.drawImage(originalImage, 0, 0, targetWidth, targetHeight);
        
        // Convert to selected format
        const format = formatSelect.value;
        const quality = parseInt(qualitySlider.value) / 100;
        const mimeType = format === 'jpeg' ? 'image/jpeg' : 
                        format === 'png' ? 'image/png' : 'image/webp';
        
        // Get optimized image as data URL
        // Only apply quality parameter for JPEG and WebP
        const optimizedDataUrl = format === 'png' ? 
            canvas.toDataURL(mimeType) : 
            canvas.toDataURL(mimeType, quality);
        
        optimizedImageUrl = optimizedDataUrl;
        
        // Calculate optimized size from data URL
        fetch(optimizedDataUrl)
            .then(res => res.blob())
            .then(blob => {
                optimizedImageBlob = blob;
                
                // Calculate stats
                const optimizedSize = formatFileSize(blob.size);
                const dimensionsText = `${targetWidth} × ${targetHeight}`;
                
                // Display optimized image
                showOptimizedImage(optimizedDataUrl, dimensionsText, optimizedSize);
            });
    }
    
    function downloadOptimizedImage() {
        if (!optimizedImageUrl) return;
        
        const format = formatSelect.value;
        const fileExtension = format === 'jpeg' ? 'jpg' : format;
        
        const link = document.createElement('a');
        link.href = optimizedImageUrl;
        link.download = `optimized-image.${fileExtension}`;
        link.click();
    }

    // Helper function to format file size
    function formatFileSize(bytes) {
        if (bytes < 1024) {
            return bytes + ' B';
        } else if (bytes < 1024 * 1024) {
            return (bytes / 1024).toFixed(1) + ' KB';
        } else {
            return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        }
    }
}); 