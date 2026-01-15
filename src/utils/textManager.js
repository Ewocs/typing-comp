// Text Manager for Multi-Language Support
class TextManager {
  constructor() {
    // Language configurations
    this.languageConfig = {
      en: { name: 'English', rtl: false, fallback: null },
      es: { name: 'Spanish', rtl: false, fallback: 'en' },
      fr: { name: 'French', rtl: false, fallback: 'en' },
      de: { name: 'German', rtl: false, fallback: 'en' },
      it: { name: 'Italian', rtl: false, fallback: 'en' },
      pt: { name: 'Portuguese', rtl: false, fallback: 'en' },
      ru: { name: 'Russian', rtl: false, fallback: 'en' },
      ar: { name: 'Arabic', rtl: true, fallback: 'en' },
      hi: { name: 'Hindi', rtl: false, fallback: 'en' },
      zh: { name: 'Chinese', rtl: false, fallback: 'en' },
      ja: { name: 'Japanese', rtl: false, fallback: 'en' },
      ko: { name: 'Korean', rtl: false, fallback: 'en' }
    };

    // Sample texts for different languages (for testing)
    this.sampleTexts = {
      en: "The quick brown fox jumps over the lazy dog. This pangram contains every letter of the alphabet at least once.",
      es: "El rápido zorro marrón salta sobre el perro perezoso. Este pangrama contiene cada letra del alfabeto al menos una vez.",
      fr: "Le rapide renard brun saute par-dessus le chien paresseux. Ce pangramme contient chaque lettre de l'alphabet au moins une fois.",
      de: "Der schnelle braune Fuchs springt über den faulen Hund. Dieses Pangramm enthält jeden Buchstaben des Alphabets mindestens einmal.",
      it: "La veloce volpe marrone salta sopra il cane pigro. Questo pangramma contiene ogni lettera dell'alfabeto almeno una volta.",
      pt: "A rápida raposa marrom salta sobre o cachorro preguiçoso. Este pangrama contém cada letra do alfabeto pelo menos uma vez.",
      ru: "Быстрая коричневая лиса прыгает через ленивую собаку. Этот панграмм содержит каждую букву алфавита хотя бы один раз.",
      ar: "الثعلب البني السريع يقفز فوق الكلب الكسول. هذا البانغرام يحتوي على كل حرف من الحروف الأبجدية مرة واحدة على الأقل.",
      hi: "तेज भूरी लोमड़ी आलसी कुत्ते के ऊपर कूदती है। यह पैनग्राम वर्णमाला के प्रत्येक अक्षर को कम से कम एक बार शामिल करता है।",
      zh: "敏捷的棕色狐狸跳过了懒狗。这个全字母句至少包含字母表中的每个字母一次。",
      ja: "素早い茶色の狐が怠惰な犬を飛び越える。このパングラムはアルファベットの各文字を少なくとも一度含む。",
      ko: "빠른 갈색 여우가 게으른 개를 뛰어넘는다. 이 팬그램은 알파벳의 각 문자를 적어도 한 번 포함한다."
    };
  }

  // Get language configuration
  getLanguageConfig(language) {
    return this.languageConfig[language] || this.languageConfig.en;
  }

  // Check if language is RTL
  isRTL(language) {
    const config = this.getLanguageConfig(language);
    return config.rtl;
  }

  // Get fallback language
  getFallbackLanguage(language) {
    const config = this.getLanguageConfig(language);
    return config.fallback;
  }

  // Get sample text for language
  getSampleText(language) {
    return this.sampleTexts[language] || this.sampleTexts.en;
  }

  // Validate text for language (basic validation)
  validateText(text, language) {
    if (!text || text.trim().length < 10) {
      return { valid: false, error: 'Text must be at least 10 characters long' };
    }

    // Basic Unicode validation for specific languages
    const config = this.getLanguageConfig(language);
    if (config.name === 'Arabic' && !/[\u0600-\u06FF]/.test(text)) {
      console.warn(`Text may not be in Arabic for language: ${language}`);
    }

    return { valid: true };
  }

  // Get text direction CSS
  getTextDirection(language) {
    return this.isRTL(language) ? 'rtl' : 'ltr';
  }

  // Get appropriate font family for language
  getFontFamily(language) {
    const fontMap = {
      ar: 'Arial, sans-serif', // Could be 'Noto Sans Arabic' if available
      zh: 'Arial, sans-serif', // Could be 'Noto Sans CJK SC' if available
      ja: 'Arial, sans-serif', // Could be 'Noto Sans CJK JP' if available
      ko: 'Arial, sans-serif', // Could be 'Noto Sans CJK KR' if available
      hi: 'Arial, sans-serif', // Could be 'Noto Sans Devanagari' if available
      ru: 'Arial, sans-serif'  // Could be 'Noto Sans' if available
    };

    return fontMap[language] || 'Arial, sans-serif';
  }

  // Process text for display (handle special characters, etc.)
  processText(text, language) {
    if (!text) return '';

    // For RTL languages, ensure proper text direction
    if (this.isRTL(language)) {
      // Add RTL mark if needed
      return '\u200F' + text;
    }

    return text;
  }

  // Get language display name
  getLanguageName(language) {
    const config = this.getLanguageConfig(language);
    return config.name;
  }

  // Get all supported languages
  getSupportedLanguages() {
    return Object.keys(this.languageConfig);
  }

  // Check if language is supported
  isLanguageSupported(language) {
    return language in this.languageConfig;
  }
}

module.exports = new TextManager();
