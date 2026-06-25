// DreamBook Author Analytics — unified schema, live + demo data sources
var ANALYTICS_STORAGE_KEY = 'dreambook_analytics';
var ANALYTICS_MODE_KEY = 'dreambook_analytics_mode';

var METRIC_SCHEMA = {
    reach: {
        label: 'Reach',
        headerIcon: 'travel_explore',
        metrics: [
            { key: 'sectionsExplored', icon: 'menu_book', label: 'Sections explored' },
            { key: 'readingSessions', icon: 'groups', label: 'Reader activity' },
            { key: 'chaptersInBook', icon: 'library_books', label: 'Chapters in book' }
        ]
    },
    engagement: {
        label: 'Engagement',
        headerIcon: 'touch_app',
        metrics: [
            { key: 'widgetCompletion', icon: 'check_circle', label: 'Widget completion' },
            { key: 'widgetsStarted', icon: 'science', label: 'Widgets started' },
            { key: 'avgMessagesPerWidget', icon: 'forum', label: 'Avg. messages / widget' }
        ]
    },
    impact: {
        label: 'Impact',
        headerIcon: 'insights',
        metrics: [
            { key: 'struggleHotspots', icon: 'warning', label: 'Struggle hotspots' },
            { key: 'highlights', icon: 'highlight', label: 'Highlights' },
            { key: 'studentNotes', icon: 'sticky_note_2', label: 'Student notes' }
        ]
    }
};

function getAnalyticsMode() {
    return localStorage.getItem(ANALYTICS_MODE_KEY) === 'live' ? 'live' : 'demo';
}

function setAnalyticsMode(mode) {
    localStorage.setItem(ANALYTICS_MODE_KEY, mode === 'live' ? 'live' : 'demo');
}

function listSavedBooks() {
    var books = [];
    for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (!key || key.indexOf('dreambook_data_') !== 0) continue;
        try {
            var bookData = JSON.parse(localStorage.getItem(key));
            bookData.id = bookData.id || key.replace('dreambook_data_', '');
            books.push(bookData);
        } catch (e) { /* skip */ }
    }
    books.sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
    return books;
}

function loadBookData(bookId) {
    try {
        return JSON.parse(localStorage.getItem('dreambook_data_' + bookId) || 'null');
    } catch (e) {
        return null;
    }
}

function loadAnalyticsRaw() {
    try {
        return JSON.parse(localStorage.getItem(ANALYTICS_STORAGE_KEY) || '{}');
    } catch (e) {
        return {};
    }
}

function loadStudentHighlightsForBook(bookId) {
    try {
        return JSON.parse(localStorage.getItem('dreambook-student-highlights_' + bookId) || '[]');
    } catch (e) {
        return [];
    }
}

function loadStudentNotesForBook(bookId) {
    try {
        return JSON.parse(localStorage.getItem('dreambook-student-notes_' + bookId) || '[]');
    } catch (e) {
        return [];
    }
}

function extractChapterSections(chapterId, chapter, chapterNum) {
    var sections = [];
    var content = (chapter && chapter.content) || '';
    if (content) {
        var div = document.createElement('div');
        div.innerHTML = content;
        var headings = div.querySelectorAll('h1');
        for (var i = 0; i < headings.length; i++) {
            var h = headings[i];
            var id = h.id || ('sec-' + chapterId + '-' + i);
            var label = (h.textContent || '').trim() || ('Section ' + chapterNum + '.' + (i + 1));
            sections.push({
                chapterId: chapterId,
                chapterNum: chapterNum,
                chapterTitle: (chapter && chapter.title) || ('Chapter ' + chapterNum),
                headingId: id,
                sectionLabel: label,
                sectionKey: label.toLowerCase().slice(0, 40)
            });
        }
    }
    if (!sections.length) {
        sections.push({
            chapterId: chapterId,
            chapterNum: chapterNum,
            chapterTitle: (chapter && chapter.title) || ('Chapter ' + chapterNum),
            headingId: 'sec-' + chapterId + '-0',
            sectionLabel: (chapter && chapter.title) || ('Chapter ' + chapterNum),
            sectionKey: ((chapter && chapter.title) || '').toLowerCase().slice(0, 40)
        });
    }
    return sections;
}

function normText(s) {
    return (s || '').toLowerCase().replace(/\s+/g, ' ');
}

function sectionHeadingMatchesText(item, sectionKey) {
    if (!item || !item.text || !sectionKey) return false;
    var key = normText(sectionKey);
    var text = normText(item.text);
    if (text.indexOf(key) !== -1) return true;
    var words = key.split(' ');
    for (var i = 0; i < words.length; i++) {
        if (words[i].length > 4 && text.indexOf(words[i]) !== -1) return true;
    }
    return false;
}

function computeSectionSignals(section, analyticsChapter, highlights, notes) {
    var hl = highlights.filter(function (h) {
        return h.chapterId === section.chapterId && sectionHeadingMatchesText(h, section.sectionKey);
    });
    var nt = notes.filter(function (n) {
        return n.chapterId === section.chapterId && sectionHeadingMatchesText(n, section.sectionKey);
    });
    var visited = !!(analyticsChapter && analyticsChapter.sectionsVisited && analyticsChapter.sectionsVisited[section.headingId]);
    var widgets = (analyticsChapter && analyticsChapter.widgets) || {};
    var widgetValues = Object.values(widgets);
    var skipCount = widgetValues.filter(function (w) { return w.status === 'skipped'; }).length;
    var completedCount = widgetValues.filter(function (w) { return w.status === 'completed'; }).length;
    var engagedCount = widgetValues.filter(function (w) {
        return w.status === 'engaged' || w.status === 'completed';
    }).length;
    var messageTotal = widgetValues.reduce(function (sum, w) { return sum + (w.messageCount || 0); }, 0);
    var reReadScore = hl.length * 2 + nt.length * 3;
    var intensity = 'low';
    if (reReadScore >= 6 || skipCount >= 2) intensity = 'high';
    else if (reReadScore >= 2 || !visited) intensity = 'medium';
    var struggleScore = Math.min(100, reReadScore * 12 + skipCount * 8 + (visited ? 0 : 15));
    return {
        visited: visited,
        highlightCount: hl.length,
        noteCount: nt.length,
        widgetSkips: skipCount,
        widgetCompleted: completedCount,
        widgetsEngaged: engagedCount,
        messageTotal: messageTotal,
        reReadScore: reReadScore,
        intensity: intensity,
        struggleScore: struggleScore
    };
}

function buildChapterOverview(sections) {
    var byChapter = {};
    sections.forEach(function (s) {
        var key = s.chapterNum;
        if (!byChapter[key]) {
            byChapter[key] = {
                chapterNum: s.chapterNum,
                title: s.chapterTitle,
                total: 0,
                visited: 0,
                struggleSum: 0
            };
        }
        byChapter[key].total++;
        if (s.signals.visited) byChapter[key].visited++;
        byChapter[key].struggleSum += s.signals.struggleScore || 0;
    });
    return Object.keys(byChapter).sort(function (a, b) { return Number(a) - Number(b); }).map(function (k) {
        var ch = byChapter[k];
        return {
            chapterNum: ch.chapterNum,
            title: ch.title,
            completionPct: ch.total ? Math.round((ch.visited / ch.total) * 100) : 0,
            struggleAvg: ch.total ? Math.round(ch.struggleSum / ch.total) : 0
        };
    });
}

function buildMetricColumn(schemaKey, values) {
    var schema = METRIC_SCHEMA[schemaKey];
    return {
        label: schema.label,
        headerIcon: schema.headerIcon,
        metrics: schema.metrics.map(function (def) {
            return Object.assign({}, def, values[def.key] || { value: '—', hint: '', progress: null });
        })
    };
}

function buildUnifiedPayload(opts) {
    var sections = opts.sections || [];
    var chapterOverview = buildChapterOverview(sections);
    var completionPct = opts.completionPct || 0;
    var struggleHotspots = opts.struggleHotspots || 0;
    var visitedSections = opts.visitedSections || 0;
    var totalSections = opts.totalSections || sections.length;

    return {
        mode: opts.mode,
        bookId: opts.bookId,
        bookTitle: opts.bookTitle,
        gradeLevel: opts.gradeLevel,
        period: opts.period,
        hasData: opts.hasData,
        hero: {
            primaryLabel: 'Section completion',
            completionPct: completionPct,
            secondary: opts.heroSecondary || (visitedSections + ' of ' + totalSections + ' sections explored · ' + struggleHotspots + ' areas to review'),
            struggleHotspots: struggleHotspots,
            trend: opts.trend || null
        },
        reach: buildMetricColumn('reach', opts.reachValues),
        engagement: buildMetricColumn('engagement', opts.engagementValues),
        impact: buildMetricColumn('impact', opts.impactValues),
        chapterOverview: chapterOverview,
        widgetFunnel: opts.widgetFunnel || { completed: 0, skipped: 0, notStarted: 0 },
        sections: sections,
        actions: opts.actions || []
    };
}

function buildActionCards(sections, bookId, isDemo) {
    if (isDemo) {
        var editorHref = bookId ? ('editor.html?id=' + encodeURIComponent(bookId)) : 'editor.html';
        return [
            {
                severity: 'warning',
                title: '2.2 Friction on Surfaces',
                chapter: "Forces & Newton's Laws",
                body: '18 highlights · 12 notes · 34% simulation skip rate · top AI question: coefficient vs. surface type',
                ctaLabel: 'Open in editor',
                ctaHref: editorHref,
                miniBar: 34
            },
            {
                severity: 'warning',
                title: '2.3 Free-Body Diagrams',
                chapter: "Forces & Newton's Laws",
                body: 'Students re-read 2.1× more than class average · add a scaffolded checkpoint after diagram intro',
                ctaLabel: 'Run Misconception Check',
                ctaHref: editorHref,
                miniBar: 76
            },
            {
                severity: 'info',
                title: 'Sliding Friction simulation',
                chapter: 'Interactive widgets',
                body: 'Highest engagement when placed after 2.2 — consider mirroring pattern in Ch. 3',
                ctaLabel: 'View in editor',
                ctaHref: editorHref,
                miniBar: 18
            }
        ];
    }

    var sorted = sections.slice().sort(function (a, b) {
        return b.signals.struggleScore - a.signals.struggleScore;
    });
    var actions = [];
    for (var i = 0; i < Math.min(3, sorted.length); i++) {
        var s = sorted[i];
        if (s.signals.struggleScore < 10 && i > 0) continue;
        var parts = [];
        if (s.signals.highlightCount) parts.push(s.signals.highlightCount + ' highlights');
        if (s.signals.noteCount) parts.push(s.signals.noteCount + ' notes');
        if (s.signals.widgetSkips) parts.push(s.signals.widgetSkips + ' skipped widgets');
        if (!s.signals.visited) parts.push('low visit rate');
        actions.push({
            severity: s.signals.intensity === 'high' ? 'warning' : 'info',
            title: s.sectionLabel,
            chapter: s.chapterTitle,
            body: parts.length ? parts.join(' · ') : 'Students pause here more than nearby sections.',
            ctaLabel: 'Open in editor',
            ctaHref: 'editor.html?id=' + encodeURIComponent(bookId),
            miniBar: s.signals.struggleScore
        });
    }
    if (!actions.length) {
        actions.push({
            severity: 'success',
            title: 'No struggle hotspots yet',
            chapter: '',
            body: 'Preview as a student to populate live data — the same dashboard will fill in automatically.',
            ctaLabel: 'Preview book',
            ctaHref: 'editor.html?id=' + encodeURIComponent(bookId),
            miniBar: 0
        });
    }
    return actions;
}

function aggregateBookAnalyticsLive(bookData, bookId) {
    var chapters = (bookData && bookData.appState && bookData.appState.chapters) || {};
    var chapterIds = Object.keys(chapters);
    var analyticsAll = loadAnalyticsRaw();
    var highlights = loadStudentHighlightsForBook(bookId);
    var notes = loadStudentNotesForBook(bookId);

    var allSections = [];
    var totalSections = 0;
    var visitedSections = 0;
    var widgetsTotal = 0;
    var widgetsCompleted = 0;
    var widgetsSkipped = 0;
    var widgetsStarted = 0;
    var messageTotal = 0;
    var struggleHotspots = 0;
    var previewSessions = 0;

    var widgetsEngagedForAvg = 0;

    chapterIds.forEach(function (chapterId, index) {
        var chapter = chapters[chapterId];
        var chapterNum = index + 1;
        var analyticsChapter = analyticsAll[chapterId] || {};
        var sections = extractChapterSections(chapterId, chapter, chapterNum);
        var chapterHasActivity = !!(analyticsChapter.sessionStart ||
            Object.keys(analyticsChapter.sectionsVisited || {}).length ||
            Object.keys(analyticsChapter.widgets || {}).length);
        if (chapterHasActivity) previewSessions++;

        sections.forEach(function (section) {
            var signals = computeSectionSignals(section, analyticsChapter, highlights, notes);
            if (signals.intensity === 'high' || signals.intensity === 'medium') struggleHotspots++;
            if (signals.visited) visitedSections++;
            totalSections++;
            allSections.push(Object.assign({}, section, { signals: signals }));
        });

        var widgets = analyticsChapter.widgets || {};
        Object.values(widgets).forEach(function (w) {
            widgetsTotal++;
            messageTotal += w.messageCount || 0;
            if (w.status === 'completed') widgetsCompleted++;
            else if (w.status === 'skipped') widgetsSkipped++;
            if (w.viewedAt || w.status === 'engaged' || w.status === 'completed' || w.status === 'skipped') {
                widgetsStarted++;
            }
            if ((w.messageCount || 0) > 0 || w.status === 'engaged' || w.status === 'completed') {
                widgetsEngagedForAvg++;
            }
        });
    });
    var widgetsNotStarted = Math.max(0, widgetsTotal - widgetsCompleted - widgetsSkipped);

    var completionPct = totalSections ? Math.round((visitedSections / totalSections) * 100) : 0;
    var widgetCompletionPct = widgetsTotal ? Math.round((widgetsCompleted / widgetsTotal) * 100) : 0;
    var avgMessages = widgetsEngagedForAvg ? (Math.round((messageTotal / widgetsEngagedForAvg) * 10) / 10) : 0;
    var hasData = visitedSections > 0 || widgetsTotal > 0 || highlights.length > 0;

    return buildUnifiedPayload({
        mode: 'live',
        bookId: bookId,
        bookTitle: bookData.title || 'Untitled Book',
        gradeLevel: bookData.gradeLevel || (bookData.appState && bookData.appState.gradeLevel) || 'Undergrad Intro',
        period: 'From saved reading data',
        hasData: hasData,
        completionPct: completionPct,
        visitedSections: visitedSections,
        totalSections: totalSections,
        struggleHotspots: struggleHotspots,
        heroSecondary: hasData
            ? (visitedSections + ' of ' + totalSections + ' sections explored · ' + struggleHotspots + ' areas to review')
            : 'Preview as a student to populate live data',
        trend: null,
        widgetFunnel: {
            completed: widgetsCompleted,
            skipped: widgetsSkipped,
            notStarted: widgetsNotStarted
        },
        reachValues: {
            sectionsExplored: {
                value: completionPct + '%',
                hint: visitedSections + ' of ' + totalSections + ' sections',
                displayType: 'percent',
                progress: completionPct
            },
            readingSessions: {
                value: previewSessions ? String(previewSessions) : '—',
                hint: previewSessions ? 'chapters opened in student preview' : 'preview as a student to start',
                displayType: 'count'
            },
            chaptersInBook: {
                value: String(chapterIds.length),
                hint: 'in this book',
                displayType: 'count'
            }
        },
        engagementValues: {
            widgetCompletion: {
                value: widgetCompletionPct + '%',
                hint: widgetsTotal ? (widgetsCompleted + ' of ' + widgetsTotal + ' completed') : 'no widgets yet',
                displayType: 'percent',
                progress: widgetCompletionPct
            },
            widgetsStarted: {
                value: widgetsStarted ? String(widgetsStarted) : '—',
                hint: widgetsTotal ? 'opened at least once' : 'add widgets in editor',
                displayType: 'count'
            },
            avgMessagesPerWidget: {
                value: avgMessages ? String(avgMessages) : '—',
                hint: avgMessages ? 'avg. chat messages per started widget' : 'no widget chat yet',
                displayType: 'ratio'
            }
        },
        impactValues: {
            struggleHotspots: {
                value: String(struggleHotspots),
                hint: 'sections with elevated friction',
                displayType: 'count'
            },
            highlights: {
                value: String(highlights.length),
                hint: 'passages marked by students',
                displayType: 'count'
            },
            studentNotes: {
                value: String(notes.length),
                hint: 'margin notes captured',
                displayType: 'count'
            }
        },
        sections: allSections,
        actions: buildActionCards(allSections, bookId, false)
    });
}

function getDemoBookAnalytics(bookId, bookData) {
    var title = (bookData && bookData.title) || 'Experiments in Physics';
    var sections = [
        { chapterNum: 1, chapterTitle: 'Kinematics', sectionLabel: '1.1 Position & Displacement', headingId: 'd-1-1', signals: { intensity: 'low', struggleScore: 12, visited: true, highlightCount: 4, noteCount: 1, widgetCompleted: 2, widgetSkips: 0 } },
        { chapterNum: 1, chapterTitle: 'Kinematics', sectionLabel: '1.2 Velocity & Acceleration', headingId: 'd-1-2', signals: { intensity: 'medium', struggleScore: 38, visited: true, highlightCount: 11, noteCount: 4, widgetCompleted: 1, widgetSkips: 1 } },
        { chapterNum: 2, chapterTitle: "Forces & Newton's Laws", sectionLabel: '2.1 Inertia & F = ma', headingId: 'd-2-1', signals: { intensity: 'medium', struggleScore: 45, visited: true, highlightCount: 9, noteCount: 6, widgetCompleted: 2, widgetSkips: 2 } },
        { chapterNum: 2, chapterTitle: "Forces & Newton's Laws", sectionLabel: '2.2 Friction on Surfaces', headingId: 'd-2-2', signals: { intensity: 'high', struggleScore: 82, visited: true, highlightCount: 18, noteCount: 12, widgetCompleted: 1, widgetSkips: 4 } },
        { chapterNum: 2, chapterTitle: "Forces & Newton's Laws", sectionLabel: '2.3 Free-Body Diagrams', headingId: 'd-2-3', signals: { intensity: 'high', struggleScore: 76, visited: true, highlightCount: 14, noteCount: 9, widgetCompleted: 0, widgetSkips: 3 } },
        { chapterNum: 3, chapterTitle: 'Energy & Work', sectionLabel: '3.1 Kinetic Energy', headingId: 'd-3-1', signals: { intensity: 'low', struggleScore: 8, visited: true, highlightCount: 3, noteCount: 0, widgetCompleted: 3, widgetSkips: 0 } },
        { chapterNum: 3, chapterTitle: 'Energy & Work', sectionLabel: '3.2 Conservation of Energy', headingId: 'd-3-2', signals: { intensity: 'medium', struggleScore: 35, visited: true, highlightCount: 7, noteCount: 3, widgetCompleted: 2, widgetSkips: 1 } },
        { chapterNum: 4, chapterTitle: 'Momentum', sectionLabel: '4.1 Collisions Lab', headingId: 'd-4-1', signals: { intensity: 'low', struggleScore: 15, visited: false, highlightCount: 0, noteCount: 0, widgetCompleted: 0, widgetSkips: 0 } }
    ].map(function (s) {
        return Object.assign({}, s, { chapterId: 'demo-ch-' + s.chapterNum });
    });

    return buildUnifiedPayload({
        mode: 'demo',
        bookId: bookId || 'demo-physics',
        bookTitle: title,
        gradeLevel: (bookData && bookData.gradeLevel) || 'Undergrad Intro',
        period: 'Last 30 days · Sample dataset',
        hasData: true,
        completionPct: 88,
        visitedSections: 7,
        totalSections: 8,
        struggleHotspots: 5,
        heroSecondary: '7 of 8 sections explored · 5 areas flagged for review',
        trend: {
            delta: 8,
            sparkline: [72, 74, 76, 79, 82, 85, 88]
        },
        widgetFunnel: {
            completed: 13,
            skipped: 11,
            notStarted: 6
        },
        reachValues: {
            sectionsExplored: { value: '88%', hint: '7 of 8 sections opened', displayType: 'percent', progress: 88 },
            readingSessions: { value: '1,248', hint: 'enrolled readers (sample dataset)', displayType: 'count' },
            chaptersInBook: { value: '4', hint: 'in this book', displayType: 'count' }
        },
        engagementValues: {
            widgetCompletion: { value: '43%', hint: '13 of 30 widgets completed', displayType: 'percent', progress: 43 },
            widgetsStarted: { value: '24', hint: '24 of 30 opened at least once', displayType: 'count' },
            avgMessagesPerWidget: { value: '4.2', hint: 'avg. chat messages per started widget', displayType: 'ratio' }
        },
        impactValues: {
            struggleHotspots: { value: '5', hint: 'sections with elevated friction', displayType: 'count' },
            highlights: { value: '66', hint: 'passages marked by students', displayType: 'count' },
            studentNotes: { value: '35', hint: 'margin notes captured', displayType: 'count' }
        },
        sections: sections,
        actions: buildActionCards(sections, bookId, true)
    });
}

function getBookAnalytics(bookId, bookData) {
    var mode = getAnalyticsMode();
    if (mode === 'live' && bookData) {
        return aggregateBookAnalyticsLive(bookData, bookId);
    }
    return getDemoBookAnalytics(bookId, bookData);
}

var DEMO_READERSHIP_TREND = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    values: [820, 945, 1020, 1088, 1162, 1248],
    delta: 12
};

/** Foundation Biology — steady engagement decline (author's published book) */
var FOUNDATION_BIOLOGY_BOOK_ID = 'book_1782200201548';

var ENGAGEMENT_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

var DEMO_BIOLOGY_ENGAGEMENT = {
    bookId: 'demo-biology-101',
    title: 'Biology 101',
    shortTitle: 'Biology 101',
    color: '#D97706',
    labels: ENGAGEMENT_LABELS,
    values: [76, 71, 66, 61, 56, 51],
    delta: -12,
    trend: 'down',
    metricLabel: 'engagement score',
    note: 'Steady decline since January — Ch. 2 friction still uncorrected',
    currentReaders: 51
};

function shortBookTitle(title) {
    if (!title) return 'Untitled';
    return title.length > 24 ? title.slice(0, 22) + '\u2026' : title;
}

function getFoundationBiologyEngagement(book) {
    var title = (book && book.title) ? book.title : 'Foundation Biology';
    return {
        bookId: FOUNDATION_BIOLOGY_BOOK_ID,
        title: title,
        shortTitle: shortBookTitle(title),
        color: '#D97706',
        labels: ENGAGEMENT_LABELS,
        values: [76, 71, 66, 61, 56, 51],
        delta: -12,
        trend: 'down',
        metricLabel: 'engagement score',
        note: 'Steady decline since January — Review flagged Ch. 2 friction',
        currentReaders: 51
    };
}

function getSecondBookEngagement(book) {
    var title = (book && book.title) ? book.title : 'Experiments in Physics';
    var isDraft = book && book.status !== 'published';
    return {
        bookId: book ? book.id : 'demo-physics-draft',
        title: title,
        shortTitle: shortBookTitle(title),
        color: '#2E4CB9',
        labels: ENGAGEMENT_LABELS,
        values: [34, 36, 38, 40, 55, 72],
        delta: 18,
        trend: 'up',
        metricLabel: 'engagement score',
        note: isDraft
            ? 'Draft climbing as you add simulations — turnaround in progress'
            : 'Turnaround after simulations + section revisions from Analytics',
        currentReaders: 72
    };
}

function buildDashboardBookReadership(savedBooks, demoVisible, demoBookId) {
    var series = [];
    var seen = {};

    (savedBooks || []).forEach(function (book) {
        if (!book || !book.id || seen[book.id]) return;
        seen[book.id] = true;
        if (book.id === FOUNDATION_BIOLOGY_BOOK_ID) {
            series.push(getFoundationBiologyEngagement(book));
        } else {
            series.push(getSecondBookEngagement(book));
        }
    });

    if (demoVisible && !seen[demoBookId]) {
        series.unshift(Object.assign({}, DEMO_BIOLOGY_ENGAGEMENT, { bookId: demoBookId }));
    }

    series.sort(function (a, b) {
        if (a.trend === 'down' && b.trend !== 'down') return -1;
        if (b.trend === 'down' && a.trend !== 'down') return 1;
        return 0;
    });

    return series;
}

function sumBookSeriesReaders(series) {
    var total = 0;
    (series || []).forEach(function (book) {
        if (book.currentReaders) total += book.currentReaders;
        else if (book.values && book.values.length) {
            total += book.values[book.values.length - 1];
        }
    });
    return total;
}

var DEMO_COUNTRY_REACH = [
    { code: 'US', name: 'United States', flag: '\uD83C\uDDFA\uD83C\uDDF8', readers: 412, pct: 33 },
    { code: 'IN', name: 'India', flag: '\uD83C\uDDEE\uD83C\uDDF3', readers: 286, pct: 23 },
    { code: 'GB', name: 'United Kingdom', flag: '\uD83C\uDDEC\uD83C\uDDE7', readers: 198, pct: 16 },
    { code: 'CA', name: 'Canada', flag: '\uD83C\uDDE8\uD83C\uDDE6', readers: 124, pct: 10 },
    { code: 'AU', name: 'Australia', flag: '\uD83C\uDDE6\uD83C\uDDFA', readers: 89, pct: 7 },
    { code: 'OTHER', name: 'Other regions', flag: '\uD83C\uDF0D', readers: 139, pct: 11 }
];

function parseAnalyticsMetricCount(value) {
    if (!value || value === '\u2014') return 0;
    return parseInt(String(value).replace(/,/g, ''), 10) || 0;
}

function getAnalyticsMetric(analytics, columnKey, metricKey) {
    var column = analytics && analytics[columnKey];
    if (!column || !column.metrics) return null;
    for (var i = 0; i < column.metrics.length; i++) {
        if (column.metrics[i].key === metricKey) return column.metrics[i];
    }
    return null;
}

function getBookImpactForDashboard(bookId, book, demoBookId) {
    if (bookId === demoBookId) {
        return getDemoBookAnalytics(bookId, {
            title: 'Biology 101: Fundamentals of Life',
            gradeLevel: 'Undergraduate Level'
        });
    }
    return aggregateBookAnalyticsLive(book, bookId);
}

function getDashboardStudentImpact(opts) {
    opts = opts || {};
    var savedBooks = opts.savedBooks || [];
    var demoVisible = !!opts.demoVisible;
    var demoBookId = opts.demoBookId || 'demo-biology-101';
    var analyticsMode = getAnalyticsMode();
    var useSamplePresentation = analyticsMode === 'demo';

    var publishedBooks = savedBooks.filter(function (book) { return book.status === 'published'; });
    var publishedCount = publishedBooks.length + (demoVisible ? 1 : 0);
    var hasAnyPublished = publishedCount > 0;

    var totalReaders = 0;
    var totalHotspots = 0;
    var completionSum = 0;
    var completionCount = 0;
    var hasLiveData = false;
    var usesDemoSample = false;

    publishedBooks.forEach(function (book) {
        var analytics = getBookImpactForDashboard(book.id, book, demoBookId);
        if (analytics.hasData) hasLiveData = true;
        var sessions = getAnalyticsMetric(analytics, 'reach', 'readingSessions');
        totalReaders += parseAnalyticsMetricCount(sessions && sessions.value);
        totalHotspots += (analytics.hero && analytics.hero.struggleHotspots) || 0;
        if (analytics.hero && analytics.hero.completionPct != null) {
            completionSum += analytics.hero.completionPct;
            completionCount += 1;
        }
    });

    if (demoVisible) {
        var demoAnalytics = getBookImpactForDashboard(demoBookId, null, demoBookId);
        if (demoAnalytics.mode === 'demo') usesDemoSample = true;
        if (!useSamplePresentation) {
            var demoSessions = getAnalyticsMetric(demoAnalytics, 'reach', 'readingSessions');
            totalReaders += parseAnalyticsMetricCount(demoSessions && demoSessions.value);
        }
        totalHotspots += (demoAnalytics.hero && demoAnalytics.hero.struggleHotspots) || 0;
        if (demoAnalytics.hero && demoAnalytics.hero.completionPct != null) {
            completionSum += demoAnalytics.hero.completionPct;
            completionCount += 1;
        }
    }

    var avgCompletion = completionCount ? Math.round(completionSum / completionCount) : 0;

    var readershipTrend = null;
    var countryReach = [];
    var countryCount = 0;
    var bookReadership = [];

    if (savedBooks.length > 0 || demoVisible || useSamplePresentation) {
        bookReadership = buildDashboardBookReadership(savedBooks, demoVisible, demoBookId);
    }

    if (useSamplePresentation) {
        usesDemoSample = true;
        if (bookReadership.length) {
            totalReaders = sumBookSeriesReaders(bookReadership);
        }
        if (!totalReaders) totalReaders = 1248;
        readershipTrend = {
            labels: DEMO_READERSHIP_TREND.labels,
            values: DEMO_READERSHIP_TREND.values,
            delta: 8
        };
        countryReach = DEMO_COUNTRY_REACH.slice();
        countryCount = countryReach.filter(function (c) { return c.code !== 'OTHER'; }).length;
        if (bookReadership.length) {
            avgCompletion = Math.round(
                bookReadership.reduce(function (sum, b) {
                    return sum + (b.values[b.values.length - 1] || 0);
                }, 0) / bookReadership.length
            );
        } else if (!avgCompletion) {
            var sampleAnalytics = getDemoBookAnalytics('demo-physics', null);
            avgCompletion = sampleAnalytics.hero ? sampleAnalytics.hero.completionPct : 0;
        }
        if (!hasAnyPublished) {
            publishedCount = Math.max(publishedCount, bookReadership.length);
            hasAnyPublished = publishedCount > 0;
        }
    } else {
        if (bookReadership.length) {
            usesDemoSample = true;
            if (!totalReaders) totalReaders = sumBookSeriesReaders(bookReadership);
            if (!avgCompletion) {
                avgCompletion = Math.round(
                    bookReadership.reduce(function (sum, b) {
                        return sum + (b.values[b.values.length - 1] || 0);
                    }, 0) / bookReadership.length
                );
            }
        }
        if (demoVisible) {
            readershipTrend = DEMO_READERSHIP_TREND;
            countryReach = DEMO_COUNTRY_REACH.slice();
            countryCount = countryReach.filter(function (c) { return c.code !== 'OTHER'; }).length;
            usesDemoSample = true;
        }
    }

    return {
        hasAnyPublished: hasAnyPublished,
        publishedCount: publishedCount,
        totalReaders: totalReaders,
        totalHotspots: totalHotspots,
        avgCompletion: avgCompletion,
        hasLiveData: hasLiveData,
        usesDemoSample: usesDemoSample,
        readershipTrend: readershipTrend,
        bookReadership: bookReadership,
        countryReach: countryReach,
        countryCount: countryCount,
        analyticsMode: analyticsMode
    };
}

function struggleScoreToColor(score) {
    if (score >= 60) return '#FBBF24';
    if (score >= 35) return '#38BDF8';
    return '#34D399';
}

function intensityColor(intensity) {
    if (intensity === 'high') return 'bg-amber-400';
    if (intensity === 'medium') return 'bg-sky-400';
    return 'bg-emerald-400';
}

function intensityLabel(intensity) {
    if (intensity === 'high') return 'High friction';
    if (intensity === 'medium') return 'Moderate';
    return 'Smooth';
}

function intensityTileClass(intensity) {
    if (intensity === 'high') return 'bg-amber-400 border-amber-500/40 hover:bg-amber-500';
    if (intensity === 'medium') return 'bg-sky-400 border-sky-500/40 hover:bg-sky-500';
    return 'bg-emerald-400 border-emerald-500/40 hover:bg-emerald-500';
}

function groupSectionsByChapter(sections) {
    var groups = {};
    sections.forEach(function (s) {
        var key = s.chapterNum;
        if (!groups[key]) {
            groups[key] = { chapterNum: s.chapterNum, chapterTitle: s.chapterTitle, sections: [] };
        }
        groups[key].sections.push(s);
    });
    return Object.keys(groups).sort(function (a, b) { return Number(a) - Number(b); }).map(function (k) {
        return groups[k];
    });
}

// ── Decision Intelligence (AI decision traces, not SoR outcomes) ─────────────

function buildDecisionIntelligencePayload(opts) {
    return {
        mode: opts.mode,
        bookId: opts.bookId,
        bookTitle: opts.bookTitle,
        gradeLevel: opts.gradeLevel,
        period: opts.period,
        hasData: opts.hasData !== false,
        hero: opts.hero,
        chapters: opts.chapters || [],
        student: opts.student || { funnel: [], signals: [], topicClusters: [] },
        author: opts.author || { signals: [], topicClusters: [] }
    };
}

function getDemoDecisionIntelligence(bookId, bookData) {
    var title = (bookData && bookData.title) || 'Experiments in Physics';
    var grade = (bookData && bookData.gradeLevel) || 'Class 11-12';

    var chapters = [
        { chapterNum: 1, title: 'Kinematics', studentSessions: 412, authorSessions: 18, unresolvedPct: 22 },
        { chapterNum: 2, title: "Forces & Newton's Laws", studentSessions: 538, authorSessions: 24, unresolvedPct: 34 },
        { chapterNum: 3, title: 'Energy & Work', studentSessions: 301, authorSessions: 11, unresolvedPct: 18 },
        { chapterNum: 4, title: 'Momentum', studentSessions: 189, authorSessions: 9, unresolvedPct: 15 }
    ];

    var studentFunnel = [
        { step: 'Read section', pct: 100 },
        { step: 'Opened AI surface', pct: 68 },
        { step: 'Sent a message', pct: 41 },
        { step: 'Completed / resolved', pct: 29 },
        { step: 'Returned to re-read', pct: 12 }
    ];

    var studentSignals = [
        { label: 'Skipped after ≤1 AI turn', section: '2.2 Friction on Surfaces', chapterNum: 2, rate: 41, count: 127, severity: 'high' },
        { label: 'Asked for direct formula', section: '2.2 Friction on Surfaces', chapterNum: 2, rate: 38, count: 89, severity: 'high' },
        { label: 'Re-read prior section first', section: '2.3 Free-Body Diagrams', chapterNum: 2, rate: 33, count: 64, severity: 'medium' },
        { label: 'Abandoned simulation mid-run', section: '2.12 Membrane Transport', chapterNum: 2, rate: 22, count: 41, severity: 'medium' },
        { label: 'Used textbook-only source mode', section: 'Book-wide', chapterNum: 0, rate: 52, count: 312, severity: 'info' }
    ];

    var studentTopicClusters = [
        { topic: 'Coefficient vs. surface type', count: 127, sharePct: 18, trend: 'up', chapters: [2], sections: ['2.2 Friction on Surfaces'] },
        { topic: 'Free-body diagram setup', count: 96, sharePct: 14, trend: 'stable', chapters: [2], sections: ['2.3 Free-Body Diagrams'] },
        { topic: 'Explain in simpler words', count: 89, sharePct: 13, trend: 'up', chapters: [2, 3], sections: ['2.1 Inertia & F = ma', '3.1 Kinetic Energy'] },
        { topic: 'When to use which energy formula', count: 54, sharePct: 8, trend: 'stable', chapters: [3], sections: ['3.2 Conservation of Energy'] },
        { topic: 'Sign convention for forces', count: 47, sharePct: 7, trend: 'down', chapters: [2], sections: ['2.3 Free-Body Diagrams'] }
    ];

    var authorSignals = [
        { label: 'Peer Review finding accepted', section: 'Ch. 2 — Cell Biology analog', chapterNum: 2, rate: null, count: 6, severity: 'success' },
        { label: 'Reading level check opened', section: 'Ch. 2 full chapter', chapterNum: 2, rate: null, count: 3, severity: 'info' },
        { label: 'Review finding dismissed', section: 'Ch. 3 — Real-world widget', chapterNum: 3, rate: null, count: 2, severity: 'medium' },
        { label: 'Glossary definitions applied', section: 'Ch. 2 glossary pass', chapterNum: 2, rate: null, count: 14, severity: 'success' }
    ];

    var authorTopicClusters = [
        { topic: 'Simplify reading level', count: 3, sharePct: 32, trend: 'stable', chapters: [2], sections: ['Whole chapter'] },
        { topic: 'Add interactive checkpoint', count: 5, sharePct: 28, trend: 'up', chapters: [2, 3], sections: ['2.2', '3.1'] },
        { topic: 'Define technical terms', count: 4, sharePct: 22, trend: 'stable', chapters: [2], sections: ['Multiple sections'] },
        { topic: 'Add illustration / figure', count: 2, sharePct: 11, trend: 'up', chapters: [2], sections: ['2.4', '2.5'] }
    ];

    return buildDecisionIntelligencePayload({
        mode: 'demo',
        bookId: bookId || 'demo-physics',
        bookTitle: title,
        gradeLevel: grade,
        period: 'Last 30 days · Sample decision traces',
        hero: {
            primaryLabel: 'Unresolved AI sessions',
            value: '34%',
            secondary: 'Of student AI sessions ended without completing the checkpoint or resolving the question · highest in Ch. 2',
            studentSessions: 1440,
            authorSessions: 62
        },
        chapters: chapters,
        student: {
            funnel: studentFunnel,
            signals: studentSignals,
            topicClusters: studentTopicClusters
        },
        author: {
            signals: authorSignals,
            topicClusters: authorTopicClusters
        }
    });
}

function aggregateDecisionIntelligenceLive(bookData, bookId) {
    var title = (bookData && bookData.title) || 'Untitled Book';
    var grade = (bookData && bookData.gradeLevel) || 'Undergrad Intro';
    var chapters = (bookData && bookData.appState && bookData.appState.chapters) || {};
    var chapterIds = Object.keys(chapters);
    var analyticsAll = loadAnalyticsRaw();
    var highlights = loadStudentHighlightsForBook(bookId);
    var notes = loadStudentNotesForBook(bookId);

    var chapterList = [];
    var totalWidgetMessages = 0;
    var totalSkips = 0;
    var totalEngaged = 0;
    var totalWidgets = 0;

    chapterIds.forEach(function (cid, index) {
        var ch = chapters[cid];
        var chAnalytics = analyticsAll[cid] || {};
        var widgets = chAnalytics.widgets || {};
        var widgetIds = Object.keys(widgets);
        var skips = 0;
        var engaged = 0;
        var messages = 0;
        widgetIds.forEach(function (wid) {
            var w = widgets[wid];
            totalWidgets++;
            if (w.status === 'skipped') { skips++; totalSkips++; }
            if (w.status === 'engaged' || w.status === 'completed') { engaged++; totalEngaged++; }
            messages += w.messageCount || 0;
            totalWidgetMessages += w.messageCount || 0;
        });
        var sessions = engaged + skips;
        var unresolvedPct = sessions ? Math.round((skips / sessions) * 100) : 0;
        chapterList.push({
            chapterNum: index + 1,
            title: ch.title || ('Chapter ' + (index + 1)),
            studentSessions: sessions,
            authorSessions: 0,
            unresolvedPct: unresolvedPct
        });
    });

    var studentSessions = totalEngaged + totalSkips;
    var unresolvedRate = studentSessions ? Math.round((totalSkips / studentSessions) * 100) : 0;
    var hasData = studentSessions > 0 || highlights.length > 0 || notes.length > 0;

    var studentTopicClusters = [];
    if (totalSkips > 0) {
        studentTopicClusters.push({
            topic: 'Widget skipped before resolution',
            count: totalSkips,
            sharePct: 100,
            trend: 'stable',
            chapters: chapterList.filter(function (c) { return c.unresolvedPct > 20; }).map(function (c) { return c.chapterNum; }),
            sections: ['Interactive checkpoints']
        });
    }
    if (totalWidgetMessages > 0) {
        studentTopicClusters.push({
            topic: 'Checkpoint conversation activity',
            count: totalWidgetMessages,
            sharePct: null,
            trend: 'stable',
            chapters: chapterList.map(function (c) { return c.chapterNum; }),
            sections: ['Learning Assistant / widgets']
        });
    }

    return buildDecisionIntelligencePayload({
        mode: 'live',
        bookId: bookId,
        bookTitle: title,
        gradeLevel: grade,
        period: 'From local preview sessions',
        hasData: hasData,
        hero: {
            primaryLabel: 'Unresolved AI sessions',
            value: hasData ? (unresolvedRate + '%') : '—',
            secondary: hasData
                ? (totalSkips + ' skips · ' + totalWidgetMessages + ' widget messages · preview as student to grow traces')
                : 'Preview as a student and use widgets or the Learning Assistant to populate decision traces.',
            studentSessions: studentSessions,
            authorSessions: 0
        },
        chapters: chapterList,
        student: {
            funnel: hasData ? [
                { step: 'Widget viewed', pct: 100 },
                { step: 'Engagement started', pct: studentSessions ? Math.round((totalEngaged / Math.max(totalWidgets, 1)) * 100) : 0 },
                { step: 'Message sent', pct: totalEngaged ? Math.min(100, Math.round((totalWidgetMessages / totalEngaged) * 25)) : 0 },
                { step: 'Completed', pct: studentSessions ? Math.round(((totalEngaged - totalSkips) / studentSessions) * 100) : 0 }
            ] : [],
            signals: hasData ? [{
                label: 'Skipped interactive checkpoint',
                section: 'Book-wide',
                chapterNum: 0,
                rate: unresolvedRate,
                count: totalSkips,
                severity: unresolvedRate > 30 ? 'high' : 'medium'
            }] : [],
            topicClusters: studentTopicClusters
        },
        author: {
            signals: [],
            topicClusters: []
        }
    });
}

function getBookDecisionIntelligence(bookId, bookData) {
    var mode = getAnalyticsMode();
    if (mode === 'live' && bookData) {
        return aggregateDecisionIntelligenceLive(bookData, bookId);
    }
    return getDemoDecisionIntelligence(bookId, bookData);
}

function filterDecisionDataByChapter(data, chapterNum) {
    if (!chapterNum || chapterNum === 'all') return data;
    var num = Number(chapterNum);
    var ch = (data.chapters || []).find(function (c) { return c.chapterNum === num; });
    var resolutionPct = ch ? Math.max(0, 100 - (ch.unresolvedPct || 0)) : null;
    var filtered = Object.assign({}, data, {
        hero: Object.assign({}, data.hero, {
            secondary: ch
                ? ('Chapter ' + num + ' · ' + ch.title + ' · ' + (resolutionPct != null ? resolutionPct + '% learning resolution' : ''))
                : data.hero.secondary,
            value: resolutionPct != null ? (resolutionPct + '%') : data.hero.value,
            primaryLabel: ch ? 'Chapter learning resolution' : data.hero.primaryLabel
        }),
        student: {
            funnel: data.student.funnel,
            signals: (data.student.signals || []).filter(function (s) {
                return s.chapterNum === 0 || s.chapterNum === num;
            }),
            topicClusters: (data.student.topicClusters || []).filter(function (t) {
                return !t.chapters || !t.chapters.length || t.chapters.indexOf(num) !== -1;
            })
        },
        author: {
            signals: (data.author.signals || []).filter(function (s) {
                return s.chapterNum === 0 || s.chapterNum === num;
            }),
            topicClusters: (data.author.topicClusters || []).filter(function (t) {
                return !t.chapters || !t.chapters.length || t.chapters.indexOf(num) !== -1;
            })
        },
        improvementLoops: (data.improvementLoops || []).filter(function (loop) {
            return !loop.chapterNum || loop.chapterNum === num;
        })
    });
    return filtered;
}

// ── Content Quality Dashboard (decision flywheel + outcomes + moat) ─────────

function parsePctValue(str) {
    if (!str) return null;
    var n = parseInt(String(str).replace(/[^0-9]/g, ''), 10);
    return isNaN(n) ? null : n;
}

function buildQualityHeroFromDecision(decision) {
    var unresolved = parsePctValue(decision.hero && decision.hero.value);
    var resolution = unresolved != null ? Math.max(0, 100 - unresolved) : null;
    return {
        primaryLabel: 'Learning resolution rate',
        value: resolution != null ? (resolution + '%') : (decision.hero && decision.hero.value) || '—',
        unresolvedPct: unresolved,
        resolutionPct: resolution,
        secondary: decision.hero && decision.hero.secondary,
        studentSessions: decision.hero && decision.hero.studentSessions,
        authorSessions: decision.hero && decision.hero.authorSessions,
        trend: decision.mode === 'demo' ? { delta: 12, direction: 'up', label: 'vs prior publish cycle' } : null
    };
}

function getDemoQualityEnrichment(decision, engagement, bookId) {
    var chapters = (decision.chapters || []).map(function (ch) {
        var before = ch.unresolvedPct + 12;
        if (ch.chapterNum === 2) before = 46;
        if (ch.chapterNum === 3) before = 24;
        return Object.assign({}, ch, {
            unresolvedBefore: Math.min(95, before),
            resolutionAfter: Math.max(0, 100 - ch.unresolvedPct),
            resolutionBefore: Math.max(0, 100 - Math.min(95, before)),
            qualityDelta: Math.min(95, before) - ch.unresolvedPct
        });
    });

    return {
        strategicStory: {
            intro: 'This book generates decision traces every time a student asks, skips, or resolves a checkpoint, and every time an author accepts or dismisses a Peer Review finding. Those traces calibrate two systems: Peer Review (what to fix in the manuscript) and the AI interviewer (how to guide students through checkpoints).',
            dataInventory: [
                { label: 'Student AI sessions', value: '1,440', feeds: 'Both' },
                { label: 'Question clusters', value: '5', feeds: 'Both' },
                { label: 'Author accept/dismiss', value: '62', feeds: 'Peer Review' },
                { label: 'Skip & resolve paths', value: '890', feeds: 'Interviewer' }
            ],
            peerReviewer: {
                icon: 'radar',
                title: 'Peer Reviewer',
                summary: 'Findings are ordered by student friction — not a generic critique checklist. When authors accept or dismiss a finding, the model learns what this cohort actually needs.',
                dataFeeds: [
                    { signal: 'Cluster ↑ "coefficient vs. surface type" (127 sessions, §2.2)', effect: 'Surfaced Misconception + Socratic checkpoint at friction definition' },
                    { signal: '41% skip after ≤1 AI turn at §2.2', effect: 'Deprioritized simulation-first finding; prose scaffold ranked higher' },
                    { signal: '6 findings accepted · 2 dismissed (Ch. 2–3)', effect: 'Raised weight on jargon_flag and pedagogy_widget for science chapters' },
                    { signal: 'Author opened reading level 3× without publish', effect: 'Flagged editorial backlog in review queue' }
                ],
                metrics: [
                    { label: 'Findings accepted', value: '6 of 7', hint: 'Ch. 2 review cycle' },
                    { label: 'Top signal match', value: '§2.2', hint: 'Highest cluster overlap with findings' }
                ],
                outcome: { label: 'Ch. 2 unresolved sessions', before: '46%', after: '34%' }
            },
            interviewer: {
                icon: 'record_voice_over',
                title: 'AI Interviewer',
                summary: 'Checkpoint conversations adapt from resolved vs abandoned session patterns. When students bail after one turn, the interviewer adds a scaffold step before asking for formulas.',
                dataFeeds: [
                    { signal: '127 sessions asking for direct formulas at §2.2', effect: 'Interviewer asks about surface type before introducing μ' },
                    { signal: 'Resolved sessions avg 3.1 turns vs 1.0 for skips', effect: 'Added intermediate "explain in your words" step' },
                    { signal: 'Cluster "explain in simpler words" (↑89 sessions)', effect: 'Plain-language rephrase offered before hint escalation' },
                    { signal: '52% textbook-only source mode', effect: 'Grounded responses prioritized; off-book answers shortened' }
                ],
                metrics: [
                    { label: '1-turn bailouts §2.2', value: '41% → 28%', hint: 'After checkpoint path update' },
                    { label: 'Turns to resolve', value: '3.1 → 2.4', hint: 'Ch. 2 checkpoints' }
                ],
                outcome: { label: 'Checkpoint completion', before: '43%', after: '58%' }
            }
        },
        improvementLoops: [
            {
                chapterNum: 2,
                status: 'improved',
                signal: { topic: 'Coefficient vs. surface type', section: '§2.2 Friction', severity: 'high' },
                action: { tool: 'Peer Review → Socratic checkpoint', status: 'Published', detail: 'Finding accepted · live v1.3' },
                outcome: { metric: 'Unresolved sessions', before: '46%', after: '34%', delta: '−12 pts' }
            },
            {
                chapterNum: 2,
                status: 'active',
                signal: { topic: 'Explain in simpler words', section: '§2.1 · §3.1', severity: 'medium' },
                action: { tool: 'Reading level simplify', status: 'In review', detail: '3 opens · proposals pending' },
                outcome: { metric: 'Cluster share', before: '19%', after: '—', delta: 'Pending publish' }
            },
            {
                chapterNum: 2,
                status: 'improved',
                signal: { topic: 'Sign convention for forces', section: '§2.3 Free-Body Diagrams', severity: 'medium' },
                action: { tool: 'Glossary pass (Peer Review)', status: 'Published', detail: '14 terms defined' },
                outcome: { metric: 'Question cluster', before: '13%', after: '7%', delta: '−6 pts' }
            }
        ],
        chapters: chapters,
        chapterQualityOverview: chapters.map(function (ch) {
            return {
                chapterNum: ch.chapterNum,
                title: ch.title,
                resolutionBefore: ch.resolutionBefore,
                resolutionAfter: ch.resolutionAfter,
                frictionAvg: ch.chapterNum === 2 ? 68 : ch.chapterNum === 1 ? 28 : 22
            };
        })
    };
}

function buildLiveQualityEnrichment(decision, engagement) {
    var unresolved = parsePctValue(decision.hero && decision.hero.value);
    var resolution = unresolved != null ? Math.max(0, 100 - unresolved) : null;
    var clusters = (decision.student.topicClusters || []).length;
    var sessions = decision.hero.studentSessions || 0;

    return {
        strategicStory: {
            intro: sessions
                ? ('This book has ' + sessions + ' student decision traces so far. As clusters and author accept/dismiss actions accumulate, Peer Review findings and checkpoint interviewer paths calibrate to this cohort.')
                : ('Preview as a student and use checkpoints or the Learning Assistant. Decision traces are required before Peer Review and the interviewer can calibrate to this book.'),
            dataInventory: [
                { label: 'Student sessions', value: String(sessions), feeds: 'Both' },
                { label: 'Clusters', value: String(clusters), feeds: 'Both' },
                { label: 'Author decisions', value: String(decision.hero.authorSessions || 0), feeds: 'Peer Review' },
                { label: 'Widgets completed', value: String((engagement.widgetFunnel && engagement.widgetFunnel.completed) || 0), feeds: 'Interviewer' }
            ],
            peerReviewer: {
                icon: 'radar',
                title: 'Peer Reviewer',
                summary: 'Accept and dismiss findings in Review to teach the model which suggestions match your cohort. Friction signals from the Tactical tab rank future findings.',
                dataFeeds: decision.hasData ? [{
                    signal: 'Skipped checkpoints: ' + (engagement.widgetFunnel && engagement.widgetFunnel.skipped || 0),
                    effect: 'Misconception Check uses skip rate to suggest checkpoint placement'
                }] : [],
                metrics: [
                    { label: 'Author decisions', value: String(decision.hero.authorSessions || 0), hint: 'Accept/dismiss in Review' },
                    { label: 'Struggle hotspots', value: String(engagement.hero && engagement.hero.struggleHotspots || 0), hint: 'Sections feeding review rank' }
                ],
                outcome: { label: 'Resolution', before: '—', after: resolution != null ? (resolution + '%') : '—' }
            },
            interviewer: {
                icon: 'record_voice_over',
                title: 'AI Interviewer',
                summary: 'Each completed or skipped checkpoint conversation shapes follow-up question depth and hint timing for this book.',
                dataFeeds: decision.hasData ? [{
                    signal: 'Widget messages logged locally',
                    effect: 'Interviewer paths update when resolve vs skip patterns diverge'
                }] : [],
                metrics: [
                    { label: 'Completed', value: String((engagement.widgetFunnel && engagement.widgetFunnel.completed) || 0), hint: 'Resolved sessions' },
                    { label: 'Skipped', value: String((engagement.widgetFunnel && engagement.widgetFunnel.skipped) || 0), hint: 'Abandoned sessions' }
                ],
                outcome: { label: 'Unresolved', before: '—', after: unresolved != null ? (unresolved + '%') : '—' }
            }
        },
        improvementLoops: decision.hasData ? [{
            chapterNum: 0,
            status: 'active',
            signal: { topic: 'Local preview traces', section: 'Book-wide', severity: 'info' },
            action: { tool: 'Peer Review + student preview', status: 'In progress', detail: 'Grow traces for calibration' },
            outcome: { metric: 'Calibration', before: '—', after: '—', delta: 'Needs more data' }
        }] : [],
        chapters: (decision.chapters || []).map(function (ch) {
            return Object.assign({}, ch, {
                unresolvedBefore: null,
                resolutionAfter: Math.max(0, 100 - ch.unresolvedPct),
                resolutionBefore: null,
                qualityDelta: null
            });
        }),
        chapterQualityOverview: (decision.chapters || []).map(function (ch) {
            return {
                chapterNum: ch.chapterNum,
                title: ch.title,
                resolutionBefore: null,
                resolutionAfter: Math.max(0, 100 - ch.unresolvedPct),
                frictionAvg: ch.unresolvedPct
            };
        })
    };
}

function buildQualityDashboardPayload(decision, engagement, enrichment, bookId) {
    var hero = buildQualityHeroFromDecision(decision);
    return Object.assign({}, decision, enrichment, {
        bookId: bookId || decision.bookId,
        bookTitle: decision.bookTitle,
        gradeLevel: decision.gradeLevel,
        period: decision.period,
        mode: decision.mode,
        hasData: decision.hasData,
        hero: hero,
        tacticalHero: engagement.hero || {},
        reach: engagement.reach,
        engagementCol: engagement.engagement,
        impact: engagement.impact,
        chapterOverview: engagement.chapterOverview || [],
        widgetFunnel: engagement.widgetFunnel || {},
        sections: engagement.sections || [],
        actions: engagement.actions || [],
        engagement: {
            sections: engagement.sections || [],
            widgetFunnel: engagement.widgetFunnel || {}
        }
    });
}

function getBookQualityDashboard(bookId, bookData) {
    var decision = getBookDecisionIntelligence(bookId, bookData);
    var engagement = getBookAnalytics(bookId, bookData);
    var enrichment = decision.mode === 'demo'
        ? getDemoQualityEnrichment(decision, engagement, bookId)
        : buildLiveQualityEnrichment(decision, engagement);
    return buildQualityDashboardPayload(decision, engagement, enrichment, bookId);
}

function filterQualityDashboardByChapter(data, chapterNum) {
    return filterDecisionDataByChapter(data, chapterNum);
}
