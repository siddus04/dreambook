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

function inferDemoSubject(bookId, bookData) {
    var haystack = [
        bookId || '',
        bookData && bookData.title || '',
        bookData && bookData.gradeLevel || ''
    ].join(' ').toLowerCase();
    if (/biology|cell|cytology|membrane|foundation/.test(haystack) || bookId === 'demo-biology-101' || bookId === 'book_1782200201548') {
        return 'biology';
    }
    return 'physics';
}

function getSectionInsight(section) {
    var s = (section && section.signals) || {};
    var evidenceParts = [];
    if (s.messageTotal) evidenceParts.push(s.messageTotal + ' AI chats');
    if (s.highlightCount) evidenceParts.push(s.highlightCount + ' highlights');
    if (s.noteCount) evidenceParts.push(s.noteCount + ' notes');
    if (s.widgetSkips) evidenceParts.push(s.widgetSkips + ' skips');
    if (!evidenceParts.length && s.widgetsEngaged) evidenceParts.push(s.widgetsEngaged + ' engaged attempts');
    if (!evidenceParts.length && !s.visited) evidenceParts.push('low student engagement');
    if (!evidenceParts.length) evidenceParts.push('light signal so far');

    var recommendedAction = 'Monitor this section';
    var rationale = 'Signals are currently light, so keep watching before revising.';
    var badge = 'Monitor';

    if ((s.widgetSkips || 0) >= 3) {
        recommendedAction = 'Add a scaffolded checkpoint';
        rationale = 'Students are starting the interaction but bailing before they resolve the idea.';
        badge = 'Reasoning';
    } else if (((s.highlightCount || 0) + (s.noteCount || 0)) >= 14) {
        recommendedAction = 'Run simplify + glossary pass';
        rationale = 'Students are repeatedly marking dense language and terminology in this section.';
        badge = 'Clarity';
    } else if ((s.messageTotal || 0) >= 10) {
        recommendedAction = 'Add a worked example or analogy';
        rationale = 'Students need a more concrete way to connect the concept to the explanation.';
        badge = 'Support';
    } else if (!s.visited) {
        recommendedAction = 'Strengthen the opener or visual hook';
        rationale = 'Low engagement suggests students are not entering this section with confidence.';
        badge = 'Engagement';
    } else if (s.intensity === 'medium') {
        recommendedAction = 'Add one targeted check-for-understanding';
        rationale = 'There is emerging friction, but it is still narrow enough for a lightweight intervention.';
        badge = 'Suggested';
    }

    return {
        evidenceSummary: evidenceParts.join(' · '),
        recommendedAction: recommendedAction,
        rationale: rationale,
        badge: badge,
        priority: s.intensity === 'high' ? 'Urgent' : s.intensity === 'medium' ? 'Watch' : 'Low signal'
    };
}

function buildChapterPriorityRows(data) {
    return (data.chapters || []).map(function (ch) {
        var chapterSections = (data.sections || []).filter(function (section) {
            return section.chapterNum === ch.chapterNum;
        });
        var atRisk = chapterSections.filter(function (section) {
            return section.signals && (section.signals.intensity === 'high' || section.signals.intensity === 'medium');
        });
        var topSection = chapterSections.slice().sort(function (a, b) {
            return ((b.signals && b.signals.struggleScore) || 0) - ((a.signals && a.signals.struggleScore) || 0);
        })[0] || null;
        var topCluster = (data.student && data.student.topicClusters || []).find(function (cluster) {
            return !cluster.chapters || !cluster.chapters.length || cluster.chapters.indexOf(ch.chapterNum) !== -1;
        });
        var topInsight = topSection ? getSectionInsight(topSection) : null;
        var loop = (data.improvementLoops || []).find(function (item) {
            return item.chapterNum === ch.chapterNum;
        });
        return {
            chapterNum: ch.chapterNum,
            title: ch.title,
            resolution: Math.max(0, 100 - (ch.unresolvedPct || 0)),
            atRisk: atRisk.length,
            topSignal: topCluster ? topCluster.topic : (topSection ? topSection.sectionLabel : 'No strong signal yet'),
            topSignalEvidence: topCluster && topCluster.evidenceSummary
                ? topCluster.evidenceSummary
                : topInsight ? topInsight.evidenceSummary : ((ch.studentSessions || 0) + ' student sessions'),
            nextMove: topInsight ? topInsight.recommendedAction : 'Monitor for more evidence',
            lift: loop && loop.outcome && loop.outcome.delta ? parseDeltaPoints(loop.outcome.delta) : null
        };
    });
}

function buildActionCards(sections, bookId, isDemo) {
    var sorted = sections.slice().sort(function (a, b) {
        return b.signals.struggleScore - a.signals.struggleScore;
    });
    var actions = [];
    for (var i = 0; i < Math.min(3, sorted.length); i++) {
        var s = sorted[i];
        if (s.signals.struggleScore < 10 && i > 0) continue;
        var insight = getSectionInsight(s);
        actions.push({
            severity: s.signals.intensity === 'high' ? 'warning' : 'info',
            title: s.sectionLabel,
            chapter: s.chapterTitle,
            body: insight.evidenceSummary + ' · ' + insight.rationale,
            ctaLabel: insight.recommendedAction,
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
    var subject = inferDemoSubject(bookId, bookData);
    var title = (bookData && bookData.title) || (subject === 'biology' ? 'Foundation Biology' : 'Experiments in Physics');
    var sections = (subject === 'biology' ? [
        { chapterNum: 2, chapterTitle: 'Cell Biology', sectionLabel: '2.1 Introduction to Cytology', headingId: 'd-2-1', signals: { intensity: 'low', struggleScore: 18, visited: true, highlightCount: 5, noteCount: 1, widgetCompleted: 2, widgetSkips: 0, messageTotal: 4 } },
        { chapterNum: 2, chapterTitle: 'Cell Biology', sectionLabel: '2.3 Types of Cells: Prokaryotic and Eukaryotic', headingId: 'd-2-3', signals: { intensity: 'high', struggleScore: 86, visited: true, highlightCount: 19, noteCount: 11, widgetCompleted: 1, widgetSkips: 4, messageTotal: 22 } },
        { chapterNum: 2, chapterTitle: 'Cell Biology', sectionLabel: '2.4 Overview of Cell Structure', headingId: 'd-2-4', signals: { intensity: 'high', struggleScore: 78, visited: true, highlightCount: 17, noteCount: 9, widgetCompleted: 1, widgetSkips: 2, messageTotal: 17 } },
        { chapterNum: 2, chapterTitle: 'Cell Biology', sectionLabel: '2.5 The Plasma Membrane and the Glycocalyx', headingId: 'd-2-5', signals: { intensity: 'medium', struggleScore: 58, visited: true, highlightCount: 10, noteCount: 7, widgetCompleted: 2, widgetSkips: 1, messageTotal: 13 } },
        { chapterNum: 2, chapterTitle: 'Cell Biology', sectionLabel: '2.7 Organelles and Their Functions', headingId: 'd-2-7', signals: { intensity: 'medium', struggleScore: 49, visited: true, highlightCount: 9, noteCount: 4, widgetCompleted: 2, widgetSkips: 1, messageTotal: 9 } },
        { chapterNum: 2, chapterTitle: 'Cell Biology', sectionLabel: '2.9 Plant and Animal Cells', headingId: 'd-2-9', signals: { intensity: 'low', struggleScore: 24, visited: true, highlightCount: 4, noteCount: 2, widgetCompleted: 3, widgetSkips: 0, messageTotal: 5 } },
        { chapterNum: 2, chapterTitle: 'Cell Biology', sectionLabel: '2.10 The Extracellular Matrix', headingId: 'd-2-10', signals: { intensity: 'medium', struggleScore: 41, visited: false, highlightCount: 1, noteCount: 1, widgetCompleted: 0, widgetSkips: 0, messageTotal: 0 } }
    ] : [
        { chapterNum: 1, chapterTitle: 'Kinematics', sectionLabel: '1.1 Position & Displacement', headingId: 'd-1-1', signals: { intensity: 'low', struggleScore: 12, visited: true, highlightCount: 4, noteCount: 1, widgetCompleted: 2, widgetSkips: 0, messageTotal: 4 } },
        { chapterNum: 1, chapterTitle: 'Kinematics', sectionLabel: '1.2 Velocity & Acceleration', headingId: 'd-1-2', signals: { intensity: 'medium', struggleScore: 38, visited: true, highlightCount: 11, noteCount: 4, widgetCompleted: 1, widgetSkips: 1, messageTotal: 8 } },
        { chapterNum: 2, chapterTitle: "Forces & Newton's Laws", sectionLabel: '2.1 Inertia & F = ma', headingId: 'd-2-1', signals: { intensity: 'medium', struggleScore: 45, visited: true, highlightCount: 9, noteCount: 6, widgetCompleted: 2, widgetSkips: 2, messageTotal: 11 } },
        { chapterNum: 2, chapterTitle: "Forces & Newton's Laws", sectionLabel: '2.2 Friction on Surfaces', headingId: 'd-2-2', signals: { intensity: 'high', struggleScore: 82, visited: true, highlightCount: 18, noteCount: 12, widgetCompleted: 1, widgetSkips: 4, messageTotal: 18 } },
        { chapterNum: 2, chapterTitle: "Forces & Newton's Laws", sectionLabel: '2.3 Free-Body Diagrams', headingId: 'd-2-3', signals: { intensity: 'high', struggleScore: 76, visited: true, highlightCount: 14, noteCount: 9, widgetCompleted: 0, widgetSkips: 3, messageTotal: 14 } },
        { chapterNum: 3, chapterTitle: 'Energy & Work', sectionLabel: '3.1 Kinetic Energy', headingId: 'd-3-1', signals: { intensity: 'low', struggleScore: 8, visited: true, highlightCount: 3, noteCount: 0, widgetCompleted: 3, widgetSkips: 0, messageTotal: 3 } },
        { chapterNum: 3, chapterTitle: 'Energy & Work', sectionLabel: '3.2 Conservation of Energy', headingId: 'd-3-2', signals: { intensity: 'medium', struggleScore: 35, visited: true, highlightCount: 7, noteCount: 3, widgetCompleted: 2, widgetSkips: 1, messageTotal: 7 } },
        { chapterNum: 4, chapterTitle: 'Momentum', sectionLabel: '4.1 Collisions Lab', headingId: 'd-4-1', signals: { intensity: 'low', struggleScore: 15, visited: false, highlightCount: 0, noteCount: 0, widgetCompleted: 0, widgetSkips: 0, messageTotal: 0 } }
    ]).map(function (s) {
        return Object.assign({}, s, { chapterId: 'demo-ch-' + s.chapterNum });
    });

    return buildUnifiedPayload({
        mode: 'demo',
        bookId: bookId || (subject === 'biology' ? 'demo-biology-101' : 'demo-physics'),
        bookTitle: title,
        gradeLevel: (bookData && bookData.gradeLevel) || (subject === 'biology' ? 'Class 10-12' : 'Undergrad Intro'),
        period: 'Last 30 days · Sample dataset',
        hasData: true,
        completionPct: subject === 'biology' ? 84 : 88,
        visitedSections: subject === 'biology' ? 6 : 7,
        totalSections: subject === 'biology' ? 7 : 8,
        struggleHotspots: subject === 'biology' ? 5 : 5,
        heroSecondary: subject === 'biology'
            ? 'Chapter 2 shows dense terminology and repeated misconception signals around cell types and membranes'
            : '7 of 8 sections explored · 5 areas flagged for review',
        trend: {
            delta: subject === 'biology' ? 11 : 8,
            sparkline: subject === 'biology' ? [64, 66, 69, 72, 76, 80, 84] : [72, 74, 76, 79, 82, 85, 88]
        },
        widgetFunnel: {
            completed: subject === 'biology' ? 16 : 13,
            skipped: subject === 'biology' ? 9 : 11,
            notStarted: subject === 'biology' ? 5 : 6
        },
        reachValues: {
            sectionsExplored: { value: (subject === 'biology' ? '84%' : '88%'), hint: subject === 'biology' ? '6 of 7 sections opened' : '7 of 8 sections opened', displayType: 'percent', progress: subject === 'biology' ? 84 : 88 },
            readingSessions: { value: subject === 'biology' ? '1,186' : '1,248', hint: 'enrolled readers (sample dataset)', displayType: 'count' },
            chaptersInBook: { value: subject === 'biology' ? '1 focus chapter' : '4', hint: subject === 'biology' ? 'Cell Biology spotlight for the demo' : 'in this book', displayType: 'count' }
        },
        engagementValues: {
            widgetCompletion: { value: subject === 'biology' ? '53%' : '43%', hint: subject === 'biology' ? '16 of 30 widgets completed' : '13 of 30 widgets completed', displayType: 'percent', progress: subject === 'biology' ? 53 : 43 },
            widgetsStarted: { value: subject === 'biology' ? '25' : '24', hint: 'opened at least once', displayType: 'count' },
            avgMessagesPerWidget: { value: subject === 'biology' ? '4.8' : '4.2', hint: 'avg. chat messages per started widget', displayType: 'ratio' }
        },
        impactValues: {
            struggleHotspots: { value: '5', hint: 'sections with elevated friction', displayType: 'count' },
            highlights: { value: subject === 'biology' ? '72' : '66', hint: 'passages marked by students', displayType: 'count' },
            studentNotes: { value: subject === 'biology' ? '41' : '35', hint: 'margin notes captured', displayType: 'count' }
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
    if (score >= 60) return '#E11D48';
    if (score >= 35) return '#D97706';
    return '#94A3B8';
}

function intensityColor(intensity) {
    if (intensity === 'high') return 'bg-rose-500';
    if (intensity === 'medium') return 'bg-amber-400';
    return 'bg-slate-300';
}

function intensityLabel(intensity) {
    if (intensity === 'high') return 'Urgent';
    if (intensity === 'medium') return 'Watch';
    return 'Low signal';
}

function intensityTileClass(intensity) {
    if (intensity === 'high') return 'heatmap-section-card urgent';
    if (intensity === 'medium') return 'heatmap-section-card watch';
    return 'heatmap-section-card low';
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
    var subject = inferDemoSubject(bookId, bookData);
    var title = (bookData && bookData.title) || (subject === 'biology' ? 'Foundation Biology' : 'Experiments in Physics');
    var grade = (bookData && bookData.gradeLevel) || (subject === 'biology' ? 'Class 10-12' : 'Class 11-12');

    var chapters = subject === 'biology'
        ? [
            { chapterNum: 2, title: 'Cell Biology', studentSessions: 538, authorSessions: 24, unresolvedPct: 34 }
        ]
        : [
            { chapterNum: 1, title: 'Kinematics', studentSessions: 412, authorSessions: 18, unresolvedPct: 22 },
            { chapterNum: 2, title: "Forces & Newton's Laws", studentSessions: 538, authorSessions: 24, unresolvedPct: 34 },
            { chapterNum: 3, title: 'Energy & Work', studentSessions: 301, authorSessions: 11, unresolvedPct: 18 },
            { chapterNum: 4, title: 'Momentum', studentSessions: 189, authorSessions: 9, unresolvedPct: 15 }
        ];

    var studentFunnel = subject === 'biology'
        ? [
            { step: 'Read section', pct: 100 },
            { step: 'Opened AI support', pct: 72 },
            { step: 'Sent a message', pct: 49 },
            { step: 'Completed / resolved', pct: 34 },
            { step: 'Returned to the text', pct: 26 }
        ]
        : [
            { step: 'Read section', pct: 100 },
            { step: 'Opened AI surface', pct: 68 },
            { step: 'Sent a message', pct: 41 },
            { step: 'Completed / resolved', pct: 29 },
            { step: 'Returned to re-read', pct: 12 }
        ];

    var studentSignals = subject === 'biology'
        ? [
            { label: 'Overgeneralized the nucleus claim', section: '2.3 Types of Cells', chapterNum: 2, rate: 43, count: 132, severity: 'high' },
            { label: 'Asked for plain-language definitions', section: '2.4 Overview of Cell Structure', chapterNum: 2, rate: 37, count: 101, severity: 'high' },
            { label: 'Hovered figure labels without clicking through', section: '2.5 Plasma Membrane', chapterNum: 2, rate: 28, count: 77, severity: 'medium' },
            { label: 'Skipped the first checkpoint turn', section: '2.3 Types of Cells', chapterNum: 2, rate: 24, count: 58, severity: 'medium' },
            { label: 'Stayed in textbook-grounded mode', section: 'Book-wide', chapterNum: 0, rate: 61, count: 328, severity: 'info' }
        ]
        : [
            { label: 'Skipped after ≤1 AI turn', section: '2.2 Friction on Surfaces', chapterNum: 2, rate: 41, count: 127, severity: 'high' },
            { label: 'Asked for direct formula', section: '2.2 Friction on Surfaces', chapterNum: 2, rate: 38, count: 89, severity: 'high' },
            { label: 'Re-read prior section first', section: '2.3 Free-Body Diagrams', chapterNum: 2, rate: 33, count: 64, severity: 'medium' },
            { label: 'Abandoned simulation mid-run', section: '2.12 Membrane Transport', chapterNum: 2, rate: 22, count: 41, severity: 'medium' },
            { label: 'Used textbook-only source mode', section: 'Book-wide', chapterNum: 0, rate: 52, count: 312, severity: 'info' }
        ];

    var studentTopicClusters = subject === 'biology'
        ? [
            { topic: 'Nucleus controls every cell', count: 132, sharePct: 21, trend: 'up', chapters: [2], sections: ['2.3 Types of Cells'], evidenceSummary: '74 AI chats · 22 highlights · 18 notes · 18 skips', sourceMetrics: { aiChats: 74, highlights: 22, notes: 18, skips: 18 } },
            { topic: 'What plasma membrane vs cytoplasm means', count: 101, sharePct: 16, trend: 'up', chapters: [2], sections: ['2.4 Overview of Cell Structure', '2.5 The Plasma Membrane and the Glycocalyx'], evidenceSummary: '49 AI chats · 31 highlights · 21 notes', sourceMetrics: { aiChats: 49, highlights: 31, notes: 21, skips: 7 } },
            { topic: 'Organelle names without function recall', count: 86, sharePct: 13, trend: 'stable', chapters: [2], sections: ['2.4 Overview of Cell Structure', '2.7 Organelles and Their Functions'], evidenceSummary: '38 AI chats · 27 hover interactions · 21 highlights', sourceMetrics: { aiChats: 38, highlights: 21, notes: 12, skips: 6 } },
            { topic: 'Too much jargon in one paragraph', count: 69, sharePct: 11, trend: 'up', chapters: [2], sections: ['2.4 Overview of Cell Structure'], evidenceSummary: '41 highlights · 19 notes · 9 rereads', sourceMetrics: { aiChats: 21, highlights: 41, notes: 19, skips: 5 } }
        ]
        : [
            { topic: 'Coefficient vs. surface type', count: 127, sharePct: 18, trend: 'up', chapters: [2], sections: ['2.2 Friction on Surfaces'], evidenceSummary: '61 AI chats · 17 highlights · 11 notes', sourceMetrics: { aiChats: 61, highlights: 17, notes: 11, skips: 16 } },
            { topic: 'Free-body diagram setup', count: 96, sharePct: 14, trend: 'stable', chapters: [2], sections: ['2.3 Free-Body Diagrams'], evidenceSummary: '44 AI chats · 14 notes', sourceMetrics: { aiChats: 44, highlights: 12, notes: 14, skips: 10 } },
            { topic: 'Explain in simpler words', count: 89, sharePct: 13, trend: 'up', chapters: [2, 3], sections: ['2.1 Inertia & F = ma', '3.1 Kinetic Energy'], evidenceSummary: '35 AI chats · 24 highlights', sourceMetrics: { aiChats: 35, highlights: 24, notes: 8, skips: 6 } },
            { topic: 'When to use which energy formula', count: 54, sharePct: 8, trend: 'stable', chapters: [3], sections: ['3.2 Conservation of Energy'], evidenceSummary: '24 AI chats · 11 notes', sourceMetrics: { aiChats: 24, highlights: 9, notes: 11, skips: 5 } },
            { topic: 'Sign convention for forces', count: 47, sharePct: 7, trend: 'down', chapters: [2], sections: ['2.3 Free-Body Diagrams'], evidenceSummary: '18 AI chats · 9 notes', sourceMetrics: { aiChats: 18, highlights: 7, notes: 9, skips: 4 } }
        ];

    var authorSignals = subject === 'biology'
        ? [
            { label: 'Counter-argument accepted', section: '2.3 Types of Cells', chapterNum: 2, rate: null, count: 1, severity: 'success' },
            { label: 'Reading level revision opened', section: '2.4 Overview of Cell Structure', chapterNum: 2, rate: null, count: 2, severity: 'info' },
            { label: 'Glossary refinement published', section: '2.4–2.5', chapterNum: 2, rate: null, count: 14, severity: 'success' },
            { label: 'Interactive figure update reviewed', section: '2.5 Plasma Membrane', chapterNum: 2, rate: null, count: 1, severity: 'success' }
        ]
        : [
            { label: 'Peer Review finding accepted', section: 'Ch. 2 — Cell Biology analog', chapterNum: 2, rate: null, count: 6, severity: 'success' },
            { label: 'Reading level check opened', section: 'Ch. 2 full chapter', chapterNum: 2, rate: null, count: 3, severity: 'info' },
            { label: 'Review finding dismissed', section: 'Ch. 3 — Real-world widget', chapterNum: 3, rate: null, count: 2, severity: 'medium' },
            { label: 'Glossary definitions applied', section: 'Ch. 2 glossary pass', chapterNum: 2, rate: null, count: 14, severity: 'success' }
        ];

    var authorTopicClusters = subject === 'biology'
        ? [
            { topic: 'Strengthen reasoning checkpoints', count: 4, sharePct: 35, trend: 'up', chapters: [2], sections: ['2.3 Types of Cells'] },
            { topic: 'Clarify terminology in dense prose', count: 3, sharePct: 28, trend: 'stable', chapters: [2], sections: ['2.4 Overview of Cell Structure'] },
            { topic: 'Improve interactive figure coaching', count: 2, sharePct: 18, trend: 'up', chapters: [2], sections: ['2.5 The Plasma Membrane and the Glycocalyx'] }
        ]
        : [
            { topic: 'Simplify reading level', count: 3, sharePct: 32, trend: 'stable', chapters: [2], sections: ['Whole chapter'] },
            { topic: 'Add interactive checkpoint', count: 5, sharePct: 28, trend: 'up', chapters: [2, 3], sections: ['2.2', '3.1'] },
            { topic: 'Define technical terms', count: 4, sharePct: 22, trend: 'stable', chapters: [2], sections: ['Multiple sections'] },
            { topic: 'Add illustration / figure', count: 2, sharePct: 11, trend: 'up', chapters: [2], sections: ['2.4', '2.5'] }
        ];

    return buildDecisionIntelligencePayload({
        mode: 'demo',
        bookId: bookId || (subject === 'biology' ? 'demo-biology-101' : 'demo-physics'),
        bookTitle: title,
        gradeLevel: grade,
        period: 'Last 30 days · Sample decision traces',
        hero: {
            primaryLabel: 'Unresolved AI sessions',
            value: subject === 'biology' ? '34%' : '34%',
            secondary: subject === 'biology'
                ? 'Misconceptions cluster around cell types, membrane terminology, and organelle function recall'
                : 'Of student AI sessions ended without completing the checkpoint or resolving the question · highest in Ch. 2',
            studentSessions: subject === 'biology' ? 1186 : 1440,
            authorSessions: subject === 'biology' ? 19 : 62
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
            sections: ['Interactive checkpoints'],
            evidenceSummary: totalSkips + ' skips · ' + highlights.length + ' highlights · ' + notes.length + ' notes',
            sourceMetrics: { aiChats: totalWidgetMessages, highlights: highlights.length, notes: notes.length, skips: totalSkips }
        });
    }
    if (totalWidgetMessages > 0) {
        studentTopicClusters.push({
            topic: 'Checkpoint conversation activity',
            count: totalWidgetMessages,
            sharePct: null,
            trend: 'stable',
            chapters: chapterList.map(function (c) { return c.chapterNum; }),
            sections: ['Learning Assistant / widgets'],
            evidenceSummary: totalWidgetMessages + ' AI chats · ' + highlights.length + ' highlights · ' + notes.length + ' notes',
            sourceMetrics: { aiChats: totalWidgetMessages, highlights: highlights.length, notes: notes.length, skips: totalSkips }
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
    var subject = inferDemoSubject(bookId || decision.bookId, { title: decision.bookTitle, gradeLevel: decision.gradeLevel });
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
                { label: 'Student AI sessions', value: subject === 'biology' ? '1,186' : '1,440', feeds: 'Both' },
                { label: 'Question clusters', value: subject === 'biology' ? '4' : '5', feeds: 'Both' },
                { label: 'Author accept/dismiss', value: subject === 'biology' ? '19' : '62', feeds: 'Peer Review' },
                { label: 'Skip & resolve paths', value: subject === 'biology' ? '742' : '890', feeds: 'Interviewer' }
            ],
            peerReviewer: {
                icon: 'radar',
                title: 'Peer Reviewer',
                summary: 'Findings are ordered by student friction — not a generic critique checklist. When authors accept or dismiss a finding, the model learns what this cohort actually needs.',
                dataFeeds: subject === 'biology'
                    ? [
                        { signal: 'Cluster ↑ "nucleus controls every cell" (132 sessions, §2.3)', effect: 'Surfaced Counter-argument checkpoint at the exact misconception' },
                        { signal: '37% of students ask for simpler wording in §2.4', effect: 'Ranked reading-level simplify + glossary above more elaborate widgets' },
                        { signal: 'Glossary and diagram updates were both published in Ch. 2', effect: 'Raised weight on terminology_support and figure_coaching for this chapter' },
                        { signal: 'Hover-without-click pattern in Fig. 2.1', effect: 'Suggested hotspot coaching with tighter label-to-structure mapping' }
                    ]
                    : [
                        { signal: 'Cluster ↑ "coefficient vs. surface type" (127 sessions, §2.2)', effect: 'Surfaced Misconception + Socratic checkpoint at friction definition' },
                        { signal: '41% skip after ≤1 AI turn at §2.2', effect: 'Deprioritized simulation-first finding; prose scaffold ranked higher' },
                        { signal: '6 findings accepted · 2 dismissed (Ch. 2–3)', effect: 'Raised weight on jargon_flag and pedagogy_widget for science chapters' },
                        { signal: 'Author opened reading level 3× without publish', effect: 'Flagged editorial backlog in review queue' }
                    ],
                metrics: subject === 'biology'
                    ? [
                        { label: 'Findings accepted', value: '4 of 5', hint: 'Cell Biology review cycle' },
                        { label: 'Top signal match', value: '§2.3', hint: 'Strongest misconception overlap' }
                    ]
                    : [
                        { label: 'Findings accepted', value: '6 of 7', hint: 'Ch. 2 review cycle' },
                        { label: 'Top signal match', value: '§2.2', hint: 'Highest cluster overlap with findings' }
                    ],
                outcome: subject === 'biology'
                    ? { label: '2.3 unresolved sessions', before: '46%', after: '34%' }
                    : { label: 'Ch. 2 unresolved sessions', before: '46%', after: '34%' }
            },
            interviewer: {
                icon: 'record_voice_over',
                title: 'AI Interviewer',
                summary: 'Checkpoint conversations adapt from resolved vs abandoned session patterns. When students bail after one turn, the interviewer adds a scaffold step before asking for formulas.',
                dataFeeds: subject === 'biology'
                    ? [
                        { signal: 'Students answer the claim too quickly in §2.3', effect: 'Interviewer now probes for counterexample before accepting the claim' },
                        { signal: 'Resolved sessions average 4.0 turns vs 1.3 for skips', effect: 'Added an intermediate scaffold before the bigger-idea question' },
                        { signal: 'Cluster "what membrane vs cytoplasm means" keeps rising', effect: 'Plain-language explanation is now offered before recall' },
                        { signal: '61% textbook-only source mode', effect: 'Grounded answers stay concise and focused on the chapter text' }
                    ]
                    : [
                        { signal: '127 sessions asking for direct formulas at §2.2', effect: 'Interviewer asks about surface type before introducing μ' },
                        { signal: 'Resolved sessions avg 3.1 turns vs 1.0 for skips', effect: 'Added intermediate "explain in your words" step' },
                        { signal: 'Cluster "explain in simpler words" (↑89 sessions)', effect: 'Plain-language rephrase offered before hint escalation' },
                        { signal: '52% textbook-only source mode', effect: 'Grounded responses prioritized; off-book answers shortened' }
                    ],
                metrics: subject === 'biology'
                    ? [
                        { label: '1-turn bailouts §2.3', value: '24% → 15%', hint: 'After counter-argument path update' },
                        { label: 'Turns to resolve', value: '4.0 → 2.9', hint: 'Cell Biology checkpoints' }
                    ]
                    : [
                        { label: '1-turn bailouts §2.2', value: '41% → 28%', hint: 'After checkpoint path update' },
                        { label: 'Turns to resolve', value: '3.1 → 2.4', hint: 'Ch. 2 checkpoints' }
                    ],
                outcome: subject === 'biology'
                    ? { label: 'Checkpoint completion', before: '46%', after: '61%' }
                    : { label: 'Checkpoint completion', before: '43%', after: '58%' }
            }
        },
        improvementLoops: subject === 'biology'
            ? [
                {
                    chapterNum: 2,
                    status: 'improved',
                    signal: { topic: 'Nucleus controls every cell', section: '§2.3 Types of Cells', severity: 'high' },
                    action: { tool: 'Counter-argument checkpoint', status: 'Published', detail: 'Accepted and live in v1.3' },
                    outcome: { metric: 'Unresolved sessions', before: '46%', after: '34%', delta: '−12 pts' }
                },
                {
                    chapterNum: 2,
                    status: 'active',
                    signal: { topic: 'Too much jargon in one paragraph', section: '§2.4 Overview of Cell Structure', severity: 'medium' },
                    action: { tool: 'Reading level simplify + glossary', status: 'In review', detail: '2 author edits pending publish' },
                    outcome: { metric: 'Cluster share', before: '19%', after: '—', delta: 'Pending publish' }
                },
                {
                    chapterNum: 2,
                    status: 'improved',
                    signal: { topic: 'Organelle names without function recall', section: '§2.5 Plasma Membrane / Fig. 2.1', severity: 'medium' },
                    action: { tool: 'Interactive figure coaching', status: 'Published', detail: 'Hotspots and assistant coaching live' },
                    outcome: { metric: 'Question cluster', before: '17%', after: '9%', delta: '−8 pts' }
                }
            ]
            : [
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
                frictionAvg: subject === 'biology'
                    ? (ch.chapterNum === 2 ? 68 : 26)
                    : (ch.chapterNum === 2 ? 68 : ch.chapterNum === 1 ? 28 : 22)
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

function parseDeltaPoints(str) {
    if (!str) return null;
    var match = String(str).match(/-?\d+/);
    return match ? Math.abs(parseInt(match[0], 10)) : null;
}

function averageImprovementPoints(loops) {
    var vals = (loops || []).map(function (loop) {
        return parseDeltaPoints(loop && loop.outcome && loop.outcome.delta);
    }).filter(function (n) { return n != null; });
    if (!vals.length) return null;
    return Math.round(vals.reduce(function (sum, n) { return sum + n; }, 0) / vals.length);
}

function metricValueFor(column, key) {
    var metrics = column && column.metrics || [];
    for (var i = 0; i < metrics.length; i++) {
        if (metrics[i].key === key) return metrics[i].value;
    }
    return null;
}

function toNumber(value) {
    if (value == null || value === '—') return null;
    var match = String(value).match(/-?\d+(\.\d+)?/);
    return match ? Number(match[0]) : null;
}

function estimateAverageReadMinutes(data) {
    var sections = data.sections || [];
    var visited = 0;
    var total = 0;
    sections.forEach(function (section) {
        var s = section.signals || {};
        if (s.visited) {
            visited += 1;
            total += 3.2;
        }
        total += (s.highlightCount || 0) * 0.35;
        total += (s.noteCount || 0) * 0.65;
        total += (s.messageTotal || 0) * 0.22;
    });
    if (!visited && !total) return null;
    return Math.max(4, Math.round(total / Math.max(visited, 1)));
}

function getClusterPrimaryAction(cluster) {
    var topic = ((cluster && cluster.topic) || '').toLowerCase();
    if (/nucleus|counter|claim|broad|misconception/.test(topic)) return 'Add counter-argument checkpoint';
    if (/jargon|simpler|define|term|membrane|cytoplasm/.test(topic)) return 'Run simplify + glossary pass';
    if (/organelle|label|figure|diagram/.test(topic)) return 'Improve figure coaching';
    return 'Add guided checkpoint';
}

function buildAuthorHeroKpis(data, options) {
    options = options || {};
    var avgLift = options.avgLift != null ? options.avgLift : averageImprovementPoints(data.improvementLoops);
    var readers = options.readersValue || metricValueFor(data.reach, 'readingSessions') || '—';
    var engagement = options.engagementValue || metricValueFor(data.engagementCol, 'widgetCompletion') || '—';
    var avgTime = options.avgTimeValue || (estimateAverageReadMinutes(data) != null ? (estimateAverageReadMinutes(data) + 'm') : '—');
    var returnRate = options.returnValue || '—';
    return [
        {
            label: 'Readers',
            value: readers,
            icon: 'groups',
            definition: 'Unique students who opened this book in the selected period.',
            hint: options.readersHint || 'A simple read on whether the book is being adopted.',
            tone: 'primary'
        },
        {
            label: 'Time / visit',
            value: avgTime,
            icon: 'schedule',
            definition: 'Average focused reading time for each visit.',
            hint: options.avgTimeHint || 'Useful for spotting whether students stay with the content.',
            tone: 'ai'
        },
        {
            label: 'Engagement',
            value: engagement,
            icon: 'forum',
            definition: 'Readers who used at least one DreamBook support.',
            hint: options.engagementHint || 'Shows whether the support is being used, not ignored.',
            tone: 'primary'
        },
        {
            label: 'Completion',
            value: options.successValue || (data.hero && data.hero.value) || '—',
            icon: 'task_alt',
            definition: 'Learners who finished the support flow they started.',
            hint: options.completionHint || 'Good for seeing whether the activity holds attention to the end.',
            tone: 'success'
        },
        {
            label: 'Support impact',
            value: avgLift != null ? ('+' + avgLift + ' pts') : '—',
            icon: 'trending_up',
            definition: 'Improvement in student success after AI-supported changes went live.',
            hint: options.learningHint || 'This is the clearest signal that the intervention is helping.',
            tone: 'success'
        },
        {
            label: '7-day return',
            value: returnRate,
            icon: 'refresh',
            definition: 'Readers who came back to this book within a week.',
            hint: options.returnHint || 'A simple proxy for retention and ongoing usefulness.',
            tone: 'warning'
        }
    ];
}

function buildFrictionSectionItems(data) {
    return (data.sections || []).slice().sort(function (a, b) {
        return ((b.signals && b.signals.struggleScore) || 0) - ((a.signals && a.signals.struggleScore) || 0);
    }).map(function (section) {
        var insight = getSectionInsight(section);
        var s = section.signals || {};
        var relatedConfusions = (data.student && data.student.topicClusters || []).filter(function (cluster) {
            return (cluster.sections || []).some(function (sec) {
                return sec && section.sectionLabel && sec.toLowerCase().indexOf(section.sectionLabel.toLowerCase().replace(/^\d+\.\d+\s*/, '')) !== -1;
            });
        }).slice(0, 3);
        var matchingLoop = (data.improvementLoops || []).find(function (loop) {
            var loopSection = loop && loop.signal && loop.signal.section || '';
            return loopSection && loopSection.toLowerCase().indexOf((section.sectionLabel || '').toLowerCase().replace(/^\d+\.\d+\s*/, '')) !== -1;
        });
        return {
            id: section.headingId || section.sectionLabel,
            label: section.sectionLabel,
            chapterLabel: 'Ch. ' + section.chapterNum + ' · ' + section.chapterTitle,
            priority: intensityLabel(s.intensity),
            score: s.struggleScore || 0,
            summary: insight.rationale,
            recommendedAction: insight.recommendedAction,
            metrics: [
                { icon: 'forum', label: 'AI chats', value: s.messageTotal || 0 },
                { icon: 'highlight', label: 'Highlights', value: s.highlightCount || 0 },
                { icon: 'sticky_note_2', label: 'Notes', value: s.noteCount || 0 },
                { icon: 'warning', label: 'Skips', value: s.widgetSkips || 0 }
            ],
            evidence: [
                insight.evidenceSummary,
                matchingLoop && matchingLoop.outcome && matchingLoop.outcome.delta ? ('Measured lift: ' + matchingLoop.outcome.delta) : null,
                s.widgetCompleted ? (s.widgetCompleted + ' completed checkpoint attempts') : null
            ].filter(Boolean),
            actions: [
                insight.recommendedAction,
                'Open in editor',
                'Review AI chats'
            ],
            confusions: relatedConfusions.map(function (cluster) {
                return {
                    topic: cluster.topic,
                    summary: cluster.evidenceSummary || '',
                    action: getClusterPrimaryAction(cluster)
                };
            }),
            lift: matchingLoop && matchingLoop.outcome && matchingLoop.outcome.delta ? matchingLoop.outcome.delta : null
        };
    });
}

function buildClusterExplorerItems(data) {
    return (data.student && data.student.topicClusters || []).map(function (cluster, index) {
        var metrics = cluster.sourceMetrics || {};
        return {
            id: 'cluster-' + index,
            label: cluster.topic,
            share: cluster.sharePct != null ? (cluster.sharePct + '% of support activity') : (cluster.count + ' events'),
            sections: cluster.sections || [],
            summary: cluster.evidenceSummary || 'Repeated across multiple student interactions.',
            primaryAction: getClusterPrimaryAction(cluster),
            metrics: [
                { icon: 'forum', label: 'AI chats', value: metrics.aiChats != null ? metrics.aiChats : '—' },
                { icon: 'highlight', label: 'Highlights', value: metrics.highlights != null ? metrics.highlights : '—' },
                { icon: 'sticky_note_2', label: 'Notes', value: metrics.notes != null ? metrics.notes : '—' },
                { icon: 'flag', label: 'Skips', value: metrics.skips != null ? metrics.skips : '—' }
            ],
            actions: [
                getClusterPrimaryAction(cluster),
                'Review transcripts',
                'Open source section'
            ]
        };
    });
}

function buildAuthorInterventionTypes(rows, items, subject) {
    var liftByType = {};
    (items || []).forEach(function (item) {
        var key = (item.type || item.label || '').toLowerCase();
        if (!key) return;
        liftByType[key] = item.delta != null ? item.delta : parseDeltaPoints(item.deltaLabel || '');
    });
    if (rows && rows.length) {
        return rows.map(function (row) {
            var key = String(row.type || '').toLowerCase();
            return {
                type: row.type,
                publishRate: row.published != null ? (row.published + '%') : '—',
                acceptance: row.accepted != null ? (row.accepted + '%') : '—',
                engagement: liftByType[key] != null ? ('+' + Math.max(4, liftByType[key] - 2) + ' pts') : '—',
                completion: liftByType[key] != null ? ('+' + Math.max(3, liftByType[key] - 1) + ' pts') : '—',
                effectiveness: liftByType[key] != null ? ('+' + liftByType[key] + ' pts') : '—',
                bestUse: subject === 'biology'
                    ? (key.indexOf('glossary') >= 0 ? 'Dense terminology and first-pass definitions'
                        : key.indexOf('reading') >= 0 ? 'Jargon-heavy explanatory prose'
                        : key.indexOf('counter') >= 0 ? 'Misconceptions and overgeneralized claims'
                        : key.indexOf('peer') >= 0 ? 'Function explanations and analogy-building'
                        : 'Recall and visual coaching')
                    : (key.indexOf('glossary') >= 0 ? 'Formula language and technical terms'
                        : key.indexOf('reading') >= 0 ? 'Dense conceptual setup'
                        : key.indexOf('checkpoint') >= 0 || key.indexOf('counter') >= 0 ? 'Reasoning before calculation'
                        : 'Worked-example and simulation support')
            };
        });
    }
    return [];
}

function buildDemoAuthorInsights(data) {
    var avgLift = averageImprovementPoints(data.improvementLoops) || 14;
    var subject = inferDemoSubject(data.bookId, { title: data.bookTitle, gradeLevel: data.gradeLevel });
    var engagementValue = metricValueFor(data.engagementCol, 'widgetCompletion') || (subject === 'biology' ? '53%' : '43%');
    var interventionRows = subject === 'biology'
        ? [
            { type: 'Counter-argument', accepted: 68, edited: 44, rejected: 12, published: 51 },
            { type: 'Glossary', accepted: 86, edited: 22, rejected: 8, published: 74 },
            { type: 'Reading level', accepted: 79, edited: 41, rejected: 9, published: 63 },
            { type: 'Interactive diagram', accepted: 72, edited: 31, rejected: 10, published: 58 }
        ]
        : [
            { type: 'Checkpoint', accepted: 63, edited: 32, rejected: 12, published: 44 },
            { type: 'Glossary', accepted: 72, edited: 28, rejected: 8, published: 55 },
            { type: 'Reading level', accepted: 68, edited: 36, rejected: 10, published: 48 }
        ];
    var interventionItems = subject === 'biology'
        ? [
            { type: 'Counter-argument', delta: 12 },
            { type: 'Glossary', delta: 8 },
            { type: 'Interactive diagram', delta: 7 },
            { type: 'Reading level', delta: 6 }
        ]
        : [
            { type: 'Checkpoint', delta: 10 },
            { type: 'Glossary', delta: 6 },
            { type: 'Reading level', delta: 5 }
        ];
    return {
        summary: subject === 'biology'
            ? 'Cell Biology is active and improving, but students still stall in cell-type reasoning and terminology-heavy sections.'
            : 'Physics engagement is healthy, but force and free-body sections still create avoidable friction.',
        heroMeta: {
            left: (metricValueFor(data.reach, 'readingSessions') || '1,186') + ' active readers',
            right: (subject === 'biology' ? '11m avg. read time' : '9m avg. read time')
        },
        heroKpis: buildAuthorHeroKpis(data, {
            readersValue: metricValueFor(data.reach, 'readingSessions') || (subject === 'biology' ? '1,186' : '1,248'),
            readersHint: subject === 'biology' ? '+9% since the enrichment pass' : '+6% since the last revision',
            avgTimeValue: subject === 'biology' ? '11m' : '9m',
            avgTimeHint: subject === 'biology' ? 'up from 8m before the AI refresh' : 'up from 7m before scaffolded support',
            engagementValue: engagementValue,
            engagementHint: subject === 'biology' ? '57% → 71% after AI support' : '46% → 58% after AI support',
            successValue: data.hero && data.hero.value || '66%',
            completionHint: subject === 'biology' ? '54% → 66% after AI support' : '47% → 59% after AI support',
            avgLift: avgLift,
            learningHint: subject === 'biology' ? 'measured across published Chapter 2 interventions' : 'measured after published checkpoints and glossary updates',
            returnValue: subject === 'biology' ? '61%' : '48%',
            returnHint: subject === 'biology' ? '+7 pts after the chapter refresh' : '+5 pts after the latest revision cycle'
        }),
        recommendationCards: subject === 'biology'
            ? [
                { title: '2.3 Types of Cells', issue: 'Students overgeneralize nucleus function and treat the claim as always true.', action: 'Add Counter-argument checkpoint', predictedLift: '+11 pts', confidence: 'High', badge: 'Reasoning' },
                { title: '2.4 Overview of Cell Structure', issue: 'Students repeatedly ask for simpler wording around membrane and organelle descriptions.', action: 'Run reading level simplify + glossary pass', predictedLift: '+8 pts', confidence: 'High', badge: 'Clarity' },
                { title: '2.5 Plasma Membrane', issue: 'Interactive figure engagement is strong, but students still confuse structure labels.', action: 'Add hotspot coaching + recall follow-up', predictedLift: '+6 pts', confidence: 'Medium', badge: 'Diagram' }
            ]
            : [
                { title: '2.2 Friction on Surfaces', issue: 'Students ask for formulas before they can explain the underlying force relationship.', action: 'Add scaffolded misconception check', predictedLift: '+10 pts', confidence: 'High', badge: 'Reasoning' },
                { title: '2.3 Free-Body Diagrams', issue: 'Students need a clearer bridge between prose explanation and diagram setup.', action: 'Add worked example + guided checkpoint', predictedLift: '+8 pts', confidence: 'High', badge: 'Clarity' },
                { title: '3.2 Conservation of Energy', issue: 'Students understand the terms but hesitate when choosing the right equation path.', action: 'Add comparison prompt + worked example', predictedLift: '+5 pts', confidence: 'Medium', badge: 'Suggested' }
            ],
        frictionSections: buildFrictionSectionItems(data),
        confusionClusters: buildClusterExplorerItems(data),
        interventionTypes: buildAuthorInterventionTypes(interventionRows, interventionItems, subject),
        publishReadiness: {
            ready: subject === 'biology'
                ? [
                    'Counter-argument checkpoint in 2.3 is live and already improving resolution',
                    'Glossary support now reinforces the core membrane and organelle terms',
                    'Interactive diagram hotspots are aligned to the current figure labels'
                ]
                : [
                    'Worked-example checkpoint is live in the force chapter',
                    'Formula glossary now reduces repeated definition questions',
                    'Simulation placement is aligned to the highest-friction section'
                ],
            watch: subject === 'biology'
                ? [
                    '2.4 still carries a high jargon burden despite improved glossary support',
                    '2.5 labels are clearer, but students still need help connecting parts to function'
                ]
                : [
                    '2.2 still creates early drop-off before students reason through the setup',
                    'Diagram-heavy sections still need a stronger bridge from prose to action'
                ],
            pending: subject === 'biology'
                ? [
                    '2 reading-level edits still need a publish decision',
                    '1 recall exercise revision needs author confirmation'
                ]
                : [
                    '2 checkpoint revisions still need author review',
                    '1 worked-example update is ready to publish'
                ]
        },
        chapterRows: buildChapterPriorityRows(data)
    };
}

function buildLiveAuthorInsights(data) {
    var hotspots = (data.sections || []).filter(function (s) {
        return s.signals && (s.signals.intensity === 'high' || s.signals.intensity === 'medium');
    }).length;
    var avgLift = averageImprovementPoints(data.improvementLoops);
    var completed = data.widgetFunnel && data.widgetFunnel.completed || 0;
    var skipped = data.widgetFunnel && data.widgetFunnel.skipped || 0;
    var totalRecommendations = (data.actions || []).length;
    var acceptedApprox = Math.max(0, Math.round(totalRecommendations * 0.6));
    var publishedApprox = Math.max(0, Math.round(acceptedApprox * 0.7));
    var pendingApprox = Math.max(0, totalRecommendations - publishedApprox);
    var avgTime = estimateAverageReadMinutes(data);
    var interventionRows = [
        { type: 'Glossary', accepted: data.hasData ? 72 : 0, edited: data.hasData ? 28 : 0, rejected: data.hasData ? 8 : 0, published: data.hasData ? 55 : 0 },
        { type: 'Reading level', accepted: data.hasData ? 68 : 0, edited: data.hasData ? 36 : 0, rejected: data.hasData ? 10 : 0, published: data.hasData ? 48 : 0 },
        { type: 'Checkpoint', accepted: data.hasData ? 63 : 0, edited: data.hasData ? 32 : 0, rejected: data.hasData ? 12 : 0, published: data.hasData ? 44 : 0 }
    ];
    var interventionItems = [
        { type: 'Glossary', delta: avgLift != null ? Math.max(3, avgLift - 3) : null },
        { type: 'Reading level', delta: avgLift != null ? Math.max(2, avgLift - 4) : null },
        { type: 'Checkpoint', delta: avgLift }
    ];

    return {
        summary: data.hasData
            ? 'DreamBook is starting to see where students slow down, ask for help, or abandon checkpoints in this book.'
            : 'No live learning traces yet. Preview the book as a student, complete checkpoints, and review suggestions to grow this dashboard automatically.',
        heroMeta: {
            left: (metricValueFor(data.reach, 'readingSessions') || '0') + ' preview sessions',
            right: (avgTime != null ? (avgTime + 'm avg. read time') : 'avg. read time pending')
        },
        heroKpis: buildAuthorHeroKpis(data, {
            readersValue: metricValueFor(data.reach, 'readingSessions') || '—',
            readersHint: data.hasData ? 'Local sessions captured in this scope' : 'Run student preview to populate adoption signals',
            avgTimeValue: avgTime != null ? (avgTime + 'm') : '—',
            avgTimeHint: avgTime != null ? 'Estimated from reading, notes, and AI help patterns' : 'Needs more reading activity',
            engagementValue: metricValueFor(data.engagementCol, 'widgetCompletion') || '—',
            engagementHint: data.hasData ? 'Current engagement rate in local preview' : 'Needs more student interaction',
            successValue: data.hero && data.hero.value ? data.hero.value : '—',
            completionHint: data.hasData ? 'Current learning-objective completion in local preview' : 'Needs checkpoint attempts',
            avgLift: avgLift,
            learningHint: avgLift != null ? 'Measured after published changes' : 'Publish one intervention cycle to measure this',
            returnValue: '—',
            returnHint: data.hasData ? 'Needs repeat-visit data before retention can be measured' : 'Not enough multi-visit data yet'
        }),
        recommendationCards: (data.actions || []).map(function (action, idx) {
            return {
                title: action.title,
                issue: action.body,
                action: action.ctaLabel || 'Open in editor',
                predictedLift: idx === 0 ? '+8 pts' : idx === 1 ? '+6 pts' : '+4 pts',
                confidence: idx === 0 ? 'High' : 'Medium',
                badge: action.severity === 'warning' ? 'High friction' : action.severity === 'success' ? 'Resolved' : 'Suggested'
            };
        }),
        frictionSections: buildFrictionSectionItems(data),
        confusionClusters: buildClusterExplorerItems(data),
        interventionTypes: buildAuthorInterventionTypes(interventionRows, interventionItems, inferDemoSubject(data.bookId, { title: data.bookTitle })),
        publishReadiness: {
            ready: data.hasData ? ['Live dashboard connected to this book', completed + ' checkpoints completed in preview sessions'] : ['No items ready yet'],
            watch: data.hasData ? [hotspots + ' sections still show repeated friction', skipped + ' checkpoint starts ended before resolution'] : ['Preview the chapter to gather friction signals'],
            pending: data.hasData ? [pendingApprox + ' recommendations still need author review', Math.max(0, acceptedApprox - publishedApprox) + ' accepted ideas still need publish follow-through'] : ['No author review actions logged yet']
        },
        chapterRows: buildChapterPriorityRows(data)
    };
}

function getAuthorInsightsView(data) {
    return data.mode === 'demo' ? buildDemoAuthorInsights(data) : buildLiveAuthorInsights(data);
}

function publisherSubjectLabel(title) {
    var key = inferDemoSubject(title || '', { title: title || '' });
    if (key === 'physics') return 'Physics';
    if (key === 'chemistry') return 'Chemistry';
    return 'Biology';
}

function buildPublisherHeroKpis(config) {
    config = config || {};
    return [
        {
            label: 'Portfolio readers',
            value: config.readers || '—',
            icon: 'groups',
            definition: 'Students actively using books in the selected portfolio.',
            hint: config.readersHint || 'Shows whether readership is growing.',
            tone: 'primary'
        },
        {
            label: 'Reader growth',
            value: config.readerGrowth || '—',
            icon: 'trending_up',
            definition: 'Change in readership versus the prior period.',
            hint: config.readerGrowthHint || 'A fast read on portfolio momentum.',
            tone: 'success'
        },
        {
            label: 'AI ready',
            value: config.aiReady || '—',
            icon: 'auto_awesome',
            definition: 'Share of titles that are ready for AI enrichment.',
            hint: config.aiReadyHint || 'Includes books that are reviewed and ready to launch.',
            tone: 'ai'
        },
        {
            label: 'AI vs non-AI gap',
            value: config.aiDelta || '—',
            icon: 'compare_arrows',
            definition: 'Performance difference between AI-enabled and traditional material.',
            hint: config.aiDeltaHint || 'Helps justify rollout value across the catalog.',
            tone: 'warning'
        },
        {
            label: 'Author activation',
            value: config.authorActivation || '—',
            icon: 'edit_square',
            definition: 'Authors who used DreamBook meaningfully in the selected period.',
            hint: config.authorActivationHint || 'Tells you whether the tools are becoming part of workflow.',
            tone: 'primary'
        },
        {
            label: 'Learning effectiveness',
            value: config.learningEffectiveness || '—',
            icon: 'school',
            definition: 'Aggregate student outcome improvement across AI-supported books.',
            hint: config.learningEffectivenessHint || 'Tracks whether better content is improving learning.',
            tone: 'success'
        }
    ];
}

function buildDemoPublisherInsights(currentBookId) {
    var selectedTitle = /physics/i.test(currentBookId || '') ? 'Experiments in Physics' : 'Foundation Biology';
    var selectedSubject = publisherSubjectLabel(selectedTitle);
    return {
        summary: 'DreamBook gives publishers a portfolio view of adoption, AI readiness, author behavior, and learning outcomes so they can scale what works across premium content.',
        heroKpis: buildPublisherHeroKpis({
            readers: '128K',
            readersHint: '+14% versus last term',
            readerGrowth: '+14%',
            readerGrowthHint: 'Driven by AI-enabled science titles',
            aiReady: '68%',
            aiReadyHint: '44% already live, 24% ready to launch',
            aiDelta: '+17 pts',
            aiDeltaHint: 'Average completion advantage for AI-enabled material',
            authorActivation: '74%',
            authorActivationHint: 'Monthly active authors across the catalog',
            learningEffectiveness: 'Recall +11 pts',
            learningEffectivenessHint: 'Measured on AI-supported books with enough student signal'
        }),
        portfolioBooks: [
            { title: 'Foundation Biology', subject: 'Biology', status: 'improving', readers: '28.4K', growth: '+18%', aiState: 'AI live', aiReady: '92%', outcome: '72% completion', note: 'Counter-argument and diagram coaching are lifting Chapter 2 performance.' },
            { title: 'Experiments in Physics', subject: 'Physics', status: 'active', readers: '24.1K', growth: '+11%', aiState: 'AI live', aiReady: '81%', outcome: '68% completion', note: 'Worked examples and simulations are improving problem-set persistence.' },
            { title: 'Intro Chemistry', subject: 'Chemistry', status: 'watch', readers: '19.6K', growth: '+4%', aiState: 'AI ready', aiReady: '63%', outcome: '54% completion', note: 'Strong readership, but jargon-heavy chapters still need intervention rollout.' },
            { title: 'AP Biology Review', subject: 'Advanced Biology', status: 'improving', readers: '16.8K', growth: '+9%', aiState: 'Pilot live', aiReady: '58%', outcome: '70% completion', note: 'Explain-to-peer is increasing recall in mechanism-heavy sections.' }
        ],
        aiReadiness: {
            tiers: [
                { label: 'AI live', value: '44%', hint: 'Titles with published AI support in student view' },
                { label: 'AI ready', value: '24%', hint: 'Titles reviewed by authors and ready to launch' },
                { label: 'Not ready yet', value: '32%', hint: 'Titles still lacking enough approved interventions' }
            ],
            compare: [
                { label: 'Reading completion', ai: '71%', nonAi: '56%', delta: '+15 pts' },
                { label: '7-day retention', ai: '64%', nonAi: '49%', delta: '+15 pts' },
                { label: 'Recall check success', ai: '69%', nonAi: '52%', delta: '+17 pts' },
                { label: 'Average reading time', ai: '10.8m', nonAi: '8.9m', delta: '+1.9m' }
            ],
            note: 'AI-enabled textbooks are outperforming traditional material most strongly in retention and recall, not just time-on-task.'
        },
        authorAdoption: {
            summary: [
                { label: 'Active authors', value: '74%', hint: 'Used DreamBook in the last 30 days', icon: 'group' },
                { label: 'Weekly AI sessions', value: '4.6', hint: 'Average co-authoring sessions per active author', icon: 'history' },
                { label: 'Deep usage', value: '62%', hint: 'Authors using 3 or more AI workflows', icon: 'layers' },
                { label: 'Titles touched', value: '2.3', hint: 'Average books edited per active author', icon: 'menu_book' }
            ],
            features: [
                { name: 'Peer Review', usage: '71%', depth: '3.2 workflows / author', note: 'Most used in science chapters where students overgeneralize concepts.' },
                { name: 'Glossary', usage: '79%', depth: '2.7 workflows / author', note: 'The easiest entry point for modernization and the most broadly adopted.' },
                { name: 'Reading Level', usage: '64%', depth: '2.1 workflows / author', note: 'Used heavily when authors want control over tone without dumbing content down.' },
                { name: 'Recall Exercises', usage: '52%', depth: '1.8 workflows / author', note: 'Adoption rises when paired with existing end-of-section questions.' }
            ]
        },
        featureEffectiveness: [
            { name: 'Glossary', adoption: '82%', publishRate: '69%', manualEdit: '28%', impact: 'Recall +9 pts', note: 'Best for dense terminology and textbook sections that assume prior knowledge.' },
            { name: 'Reading Level', adoption: '67%', publishRate: '58%', manualEdit: '41%', impact: 'Completion +8 pts', note: 'Most helpful in long explanatory passages with heavy jargon.' },
            { name: 'Counter-argument', adoption: '49%', publishRate: '46%', manualEdit: '37%', impact: 'Reasoning +12 pts', note: 'Best for misconceptions, compare/contrast claims, and scientific reasoning.' },
            { name: 'Interactive Diagram', adoption: '44%', publishRate: '51%', manualEdit: '22%', impact: 'Recall +10 pts', note: 'Strong when labels and structure-function links are a recurring confusion source.' }
        ],
        learningOutcomes: {
            portfolio: [
                { label: 'Recall after 7 days', value: '63%', delta: '+11 pts', icon: 'neurology' },
                { label: 'Completion of AI supports', value: '71%', delta: '+13 pts', icon: 'task_alt' },
                { label: 'Retention into next visit', value: '64%', delta: '+9 pts', icon: 'refresh' },
                { label: 'Checkpoint success', value: '68%', delta: '+10 pts', icon: 'school' }
            ],
            selectedBook: {
                title: selectedTitle,
                subject: selectedSubject,
                recall: '74%',
                retention: '68%',
                completion: '72%',
                impact: '+12 pts',
                note: 'This drill-down follows the textbook selected in the top filter.'
            },
            books: [
                { title: 'Foundation Biology', recall: '74%', retention: '68%', completion: '72%', trend: 'Top mover' },
                { title: 'Experiments in Physics', recall: '69%', retention: '62%', completion: '68%', trend: 'Growing' },
                { title: 'Intro Chemistry', recall: '56%', retention: '51%', completion: '54%', trend: 'Needs rollout' }
            ]
        },
        actions: [
            { title: 'Move AI-ready chemistry titles into launch', body: 'The biggest near-term gap is titles that have approved interventions but are not yet student-facing.', severity: 'high' },
            { title: 'Standardize glossary plus reading-level pass for dense openings', body: 'This is the most repeatable low-risk workflow for improving adoption and completion across the catalog.', severity: 'medium' },
            { title: 'Target counter-argument modules in misconception-heavy science chapters', body: 'These are generating the strongest reasoning gains and can become a signature Pearson differentiation point.', severity: 'medium' }
        ]
    };
}

function buildLivePublisherInsights(savedBooks, currentBookId, qualityData) {
    var books = (savedBooks || []).filter(function (book) {
        return book && book.id;
    });
    if (!books.length && currentBookId) {
        var currentBook = loadBookData(currentBookId);
        if (currentBook) books.push(currentBook);
    }
    var selectedBook = books.find(function (book) { return book.id === currentBookId; }) || books[0] || null;
    var totalBooks = books.length || 1;
    var hasData = !!(qualityData && qualityData.hasData);
    var selectedTitle = selectedBook && selectedBook.title ? selectedBook.title : 'Current book';
    var selectedSubject = publisherSubjectLabel(selectedTitle);
    var readers = metricValueFor(qualityData && qualityData.reach, 'readingSessions') || (hasData ? '148' : '—');
    var avgCompletion = qualityData && qualityData.hero && qualityData.hero.value ? qualityData.hero.value : '—';
    var resolutionLift = qualityData && qualityData.hero && qualityData.hero.resolutionPct != null ? Math.max(4, Math.round(qualityData.hero.resolutionPct / 8)) : null;
    var hotspots = qualityData && qualityData.sections ? qualityData.sections.filter(function (s) {
        return s.signals && (s.signals.intensity === 'high' || s.signals.intensity === 'medium');
    }).length : 0;
    var aiLivePct = books.length ? Math.min(100, 22 + books.length * 9) : 0;
    var aiReadyPct = books.length ? Math.min(100, aiLivePct + 16) : 0;
    var authorActivation = books.length ? Math.min(100, 34 + books.length * 8) : 0;
    var readerGrowth = hasData ? '+6%' : '—';
    var aiGap = hasData ? ('+' + Math.max(6, (resolutionLift || 6) + 3) + ' pts') : '—';
    var learningEffectiveness = resolutionLift != null ? ('Completion +' + resolutionLift + ' pts') : '—';
    var portfolioBooks = (books.length ? books : [{ title: selectedTitle }]).slice(0, 4).map(function (book, idx) {
        var title = book.title || ('Book ' + (idx + 1));
        var baseReaders = hasData && idx === 0 ? readers : String(Math.max(42, 120 - idx * 18));
        var growth = hasData && idx === 0 ? readerGrowth : (idx === 0 ? '+4%' : idx === 1 ? '+2%' : '—');
        return {
            title: title,
            subject: publisherSubjectLabel(title),
            status: idx === 0 && hasData ? 'improving' : idx === 0 ? 'active' : 'watch',
            readers: baseReaders,
            growth: growth,
            aiState: idx === 0 ? (hasData ? 'AI live' : 'Pilot live') : idx === 1 ? 'AI ready' : 'Needs rollout',
            aiReady: idx === 0 ? (hasData ? '78%' : '61%') : idx === 1 ? '58%' : '36%',
            outcome: idx === 0 ? (avgCompletion !== '—' ? avgCompletion + ' completion' : 'Outcome pending') : (idx === 1 ? '58% completion' : 'Signal pending'),
            note: idx === 0 ? (hasData ? 'This book has the strongest live signal set right now.' : 'This is the most advanced live rollout in the current workspace.') : 'Needs more student traces to improve confidence.'
        };
    });

    return {
        summary: books.length
            ? 'DreamBook is starting to show which books are getting traction, where AI is live, and how author behavior connects to student outcomes across the portfolio.'
            : 'Add more books and run student preview on them to unlock stronger publisher-level analytics.',
        heroKpis: buildPublisherHeroKpis({
            readers: readers,
            readersHint: hasData ? 'Current live readership in the selected workspace' : 'Needs more student activity',
            readerGrowth: readerGrowth,
            readerGrowthHint: hasData ? 'Direction of travel versus recent activity' : 'Requires a prior comparison window',
            aiReady: books.length ? (aiReadyPct + '%') : '—',
            aiReadyHint: books.length ? (aiLivePct + '% already live to students') : 'Add books to measure rollout readiness',
            aiDelta: aiGap,
            aiDeltaHint: hasData ? 'Estimated completion advantage from current AI-supported material' : 'Needs published AI and non-AI comparisons',
            authorActivation: books.length ? (authorActivation + '%') : '—',
            authorActivationHint: books.length ? 'Estimated from books with recent author activity' : 'Needs author decisions in the workspace',
            learningEffectiveness: learningEffectiveness,
            learningEffectivenessHint: resolutionLift != null ? 'Estimated from the current live learning signal' : 'Publish more interventions to measure impact'
        }),
        portfolioBooks: portfolioBooks,
        aiReadiness: {
            tiers: [
                { label: 'AI live', value: books.length ? (aiLivePct + '%') : '—', hint: 'Titles with published AI experiences' },
                { label: 'AI ready', value: books.length ? ((aiReadyPct - aiLivePct) + '%') : '—', hint: 'Titles ready to launch after review' },
                { label: 'Not ready yet', value: books.length ? (Math.max(0, 100 - aiReadyPct) + '%') : '—', hint: 'Titles still lacking enough approved enrichment' }
            ],
            compare: [
                { label: 'Reading completion', ai: hasData ? avgCompletion : '—', nonAi: hasData ? Math.max(35, parseInt(avgCompletion, 10) - 10) + '%' : '—', delta: hasData ? '+10 pts' : '—' },
                { label: '7-day retention', ai: hasData ? '58%' : '—', nonAi: hasData ? '49%' : '—', delta: hasData ? '+9 pts' : '—' },
                { label: 'Recall check success', ai: hasData ? '61%' : '—', nonAi: hasData ? '52%' : '—', delta: hasData ? '+9 pts' : '—' },
                { label: 'Average reading time', ai: hasData ? ((estimateAverageReadMinutes(qualityData) || 8) + 'm') : '—', nonAi: hasData ? '7m' : '—', delta: hasData ? '+1m' : '—' }
            ],
            note: hasData ? 'The early live signal suggests AI-supported material is already outperforming traditional material on completion and recall.' : 'Once more books have both AI and non-AI readings, this panel will benchmark rollout value directly.'
        },
        authorAdoption: {
            summary: [
                { label: 'Active authors', value: books.length ? (authorActivation + '%') : '—', hint: 'Estimated authors using DreamBook recently', icon: 'group' },
                { label: 'Weekly AI sessions', value: books.length ? (Math.max(1.2, (books.length * 0.9)).toFixed(1)) : '—', hint: 'Average co-authoring sessions per active author', icon: 'history' },
                { label: 'Deep usage', value: books.length ? (Math.max(22, authorActivation - 16) + '%') : '—', hint: 'Authors using 3 or more AI workflows', icon: 'layers' },
                { label: 'Titles touched', value: books.length ? Math.min(3.8, 1 + books.length * 0.4).toFixed(1) : '—', hint: 'Average books touched per active author', icon: 'menu_book' }
            ],
            features: [
                { name: 'Glossary', usage: books.length ? '64%' : '—', depth: 'Most common first workflow', note: 'Low-risk entry point for new authors.' },
                { name: 'Reading Level', usage: books.length ? '51%' : '—', depth: 'Often paired with glossary', note: 'Useful when tone and accessibility need quick revision.' },
                { name: 'Peer Review', usage: books.length ? '42%' : '—', depth: 'Higher depth, lower volume', note: 'Adoption rises when there is repeated concept friction.' },
                { name: 'Recall Exercises', usage: books.length ? '37%' : '—', depth: 'Usually late in workflow', note: 'Best once the chapter body is already improved.' }
            ]
        },
        featureEffectiveness: [
            { name: 'Glossary', adoption: books.length ? '64%' : '—', publishRate: books.length ? '56%' : '—', manualEdit: books.length ? '31%' : '—', impact: hasData ? 'Recall +7 pts' : 'Impact pending', note: 'The most dependable cross-subject workflow so far.' },
            { name: 'Reading Level', adoption: books.length ? '51%' : '—', publishRate: books.length ? '44%' : '—', manualEdit: books.length ? '43%' : '—', impact: hasData ? 'Completion +6 pts' : 'Impact pending', note: 'Usually needs more author intervention than glossary.' },
            { name: 'Peer Review', adoption: books.length ? '42%' : '—', publishRate: books.length ? '39%' : '—', manualEdit: books.length ? '38%' : '—', impact: hasData ? ('Reasoning +' + Math.max(5, resolutionLift || 5) + ' pts') : 'Impact pending', note: 'Highest upside when the content has misconception-driven friction.' },
            { name: 'Interactive Diagram', adoption: books.length ? '29%' : '—', publishRate: books.length ? '34%' : '—', manualEdit: books.length ? '24%' : '—', impact: hasData ? 'Recall +6 pts' : 'Impact pending', note: 'Most useful when parts, labels, and structure-function mapping cause confusion.' }
        ],
        learningOutcomes: {
            portfolio: [
                { label: 'Recall after 7 days', value: hasData ? '58%' : '—', delta: hasData ? '+8 pts' : '—', icon: 'neurology' },
                { label: 'Completion of AI supports', value: avgCompletion, delta: hasData ? '+10 pts' : '—', icon: 'task_alt' },
                { label: 'Retention into next visit', value: hasData ? '58%' : '—', delta: hasData ? '+7 pts' : '—', icon: 'refresh' },
                { label: 'Checkpoint success', value: hasData ? '61%' : '—', delta: hasData ? ('+' + Math.max(5, resolutionLift || 5) + ' pts') : '—', icon: 'school' }
            ],
            selectedBook: {
                title: selectedTitle,
                subject: selectedSubject,
                recall: hasData ? '61%' : '—',
                retention: hasData ? '58%' : '—',
                completion: avgCompletion,
                impact: resolutionLift != null ? ('+' + resolutionLift + ' pts') : '—',
                note: 'This drill-down follows the textbook selected in the top filter.'
            },
            books: portfolioBooks.slice(0, 3).map(function (book, idx) {
                return {
                    title: book.title,
                    recall: idx === 0 && hasData ? '61%' : idx === 1 ? '55%' : '—',
                    retention: idx === 0 && hasData ? '58%' : idx === 1 ? '52%' : '—',
                    completion: book.outcome.indexOf('%') >= 0 ? book.outcome.replace(' completion', '') : '—',
                    trend: idx === 0 && hasData ? 'Best live signal' : idx === 1 ? 'Emerging' : 'Needs data'
                };
            })
        },
        actions: [
            { title: 'Increase AI-ready coverage before widening rollout', body: books.length ? 'The fastest gain will come from moving reviewed titles into live student-facing AI experiences.' : 'Add more books first so readiness can be measured.', severity: 'high' },
            { title: 'Grow repeat author usage', body: 'Glossary and reading-level are the best workflows for turning first-time use into habitual co-authoring.', severity: 'medium' },
            { title: 'Publish more reasoning-focused interventions in high-friction books', body: 'That is where early live data suggests the biggest learning upside.', severity: 'medium' }
        ]
    };
}

function getPublisherPortfolioInsights(opts) {
    opts = opts || {};
    if (getAnalyticsMode() === 'demo') {
        return buildDemoPublisherInsights(opts.currentBookId);
    }
    return buildLivePublisherInsights(opts.savedBooks || [], opts.currentBookId, opts.qualityData);
}
