const ArabicReshaper = require('arabic-reshaper');
const bidiFactory = require('bidi-js');

const bidi = bidiFactory();

function fixArabic(text) {
    if (!text) return '';

    // Step 1: Reshape Arabic characters
    // This converts characters to their positional forms (initial, medial, final, isolated)
    const reshaped = ArabicReshaper.convertArabic(text);

    // Step 2: Apply Bidi reordering
    // Get embedding levels
    const embeddingLevels = bidi.getEmbeddingLevels(reshaped);
    
    // Get reorder segments
    const flips = bidi.getReorderSegments(reshaped, embeddingLevels);
    
    // Perform flips to get visual order
    let chars = reshaped.split('');
    flips.forEach(([start, end]) => {
        const segment = chars.slice(start, end + 1).reverse();
        chars.splice(start, segment.length, ...segment);
    });

    return chars.join('');
}

module.exports = { fixArabic };
