(function (global) {
    const GRADE_LEVEL = 'Class 10-12';
    const DESCRIPTION = 'The Pearson Foundation Series - Biology, commonly known as the Pearson IIT/NEET Foundation Series, is an exceptional study resource tailored for middle and high school students in Classes 10 to 12.';

    function isFoundationBiologyBook(book) {
        const title = String(book?.title || '').toLowerCase();
        if (title.includes('foundation') && title.includes('biology')) return true;
        const chapters = book?.appState?.chapters || {};
        return Object.values(chapters).some((ch) => {
            const chapterTitle = String(ch?.title || '').toLowerCase();
            return chapterTitle.includes('cell biology') || chapterTitle.includes('cell structure');
        });
    }

    function applyCatalogMetadata(book) {
        if (!book || !isFoundationBiologyBook(book)) return false;
        book.gradeLevel = GRADE_LEVEL;
        book.description = DESCRIPTION;
        if (book.appState) {
            book.appState.gradeLevel = GRADE_LEVEL;
            book.appState.description = DESCRIPTION;
        }
        return true;
    }

    function syncCatalogToStorage(book) {
        if (!book?.id || !applyCatalogMetadata(book)) return false;
        try {
            localStorage.setItem('dreambook_data_' + book.id, JSON.stringify(book));
        } catch (e) {
            console.warn('Could not sync Foundation Biology catalog metadata', e);
            return false;
        }
        return true;
    }

    global.FoundationBiologyCatalog = {
        GRADE_LEVEL,
        DESCRIPTION,
        isFoundationBiologyBook,
        applyCatalogMetadata,
        syncCatalogToStorage
    };
})(typeof window !== 'undefined' ? window : globalThis);
