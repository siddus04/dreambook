// Persist large inline images in IndexedDB so book JSON stays under localStorage quota.
(function (global) {
    const DB_NAME = 'dreambook_images';
    const DB_VERSION = 1;
    const STORE = 'blobs';
    const REF_ATTR = 'data-dreambook-img';

    function openDb() {
        return new Promise((resolve, reject) => {
            if (!global.indexedDB) {
                reject(new Error('IndexedDB unavailable'));
                return;
            }
            const req = global.indexedDB.open(DB_NAME, DB_VERSION);
            req.onerror = () => reject(req.error || new Error('IndexedDB open failed'));
            req.onupgradeneeded = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains(STORE)) {
                    db.createObjectStore(STORE);
                }
            };
            req.onsuccess = () => resolve(req.result);
        });
    }

    function dataUrlToBlob(dataUrl) {
        const parts = String(dataUrl).match(/^data:([^;]+);base64,(.+)$/);
        if (!parts) return null;
        const binary = atob(parts[2]);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return new Blob([bytes], { type: parts[1] });
    }

    async function putBlob(storageKey, blob) {
        const db = await openDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE, 'readwrite');
            tx.objectStore(STORE).put(blob, storageKey);
            tx.oncomplete = () => resolve(storageKey);
            tx.onerror = () => reject(tx.error || new Error('IndexedDB write failed'));
        });
    }

    async function getBlob(storageKey) {
        const db = await openDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE, 'readonly');
            const req = tx.objectStore(STORE).get(storageKey);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => reject(req.error || new Error('IndexedDB read failed'));
        });
    }

    function makeStorageKey(bookId, imageKey) {
        return `${bookId}::${imageKey}`;
    }

    function makeRef(bookId, imageKey) {
        return makeStorageKey(bookId, imageKey);
    }

    async function externalizeHtmlImages(bookId, html) {
        if (!html || !html.includes('data:image') || typeof document === 'undefined') return html;
        const host = document.createElement('div');
        host.innerHTML = html;
        const imgs = host.querySelectorAll('img[src^="data:image"]');
        for (const img of imgs) {
            const src = img.getAttribute('src');
            if (!src) continue;
            const blob = dataUrlToBlob(src);
            if (!blob) continue;
            const imageKey = `img-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
            const ref = makeRef(bookId, imageKey);
            try {
                await putBlob(ref, blob);
                img.removeAttribute('src');
                img.setAttribute(REF_ATTR, ref);
            } catch (e) {
                console.warn('DreamBookImageBlobStore: failed to persist image', e);
            }
        }
        return host.innerHTML;
    }

    async function hydrateHtml(html) {
        if (!html || !html.includes(REF_ATTR) || typeof document === 'undefined') return html;
        const host = document.createElement('div');
        host.innerHTML = html;
        const imgs = host.querySelectorAll(`img[${REF_ATTR}]`);
        for (const img of imgs) {
            const ref = img.getAttribute(REF_ATTR);
            if (!ref) continue;
            try {
                const blob = await getBlob(ref);
                if (blob) img.src = URL.createObjectURL(blob);
            } catch (e) {
                console.warn('DreamBookImageBlobStore: failed to hydrate image', ref, e);
            }
        }
        return host.innerHTML;
    }

    function sanitizeHtmlImagesForStorage(html) {
        if (!html || typeof document === 'undefined') return html;
        const host = document.createElement('div');
        host.innerHTML = html;
        host.querySelectorAll('img').forEach((img) => {
            const src = img.getAttribute('src') || '';
            const ref = img.getAttribute(REF_ATTR);
            if (ref && (src.startsWith('blob:') || src.startsWith('data:image'))) {
                img.removeAttribute('src');
            } else if (src.startsWith('blob:')) {
                img.removeAttribute('src');
            }
        });
        return host.innerHTML;
    }

    async function prepareChapterHtmlForStorage(bookId, html) {
        if (!html) return html;
        let out = sanitizeHtmlImagesForStorage(html);
        if (out.includes('data:image')) {
            out = await externalizeHtmlImages(bookId, out);
        }
        return out;
    }

    async function prepareBookForStorage(bookId, data) {
        const clone = typeof structuredClone === 'function'
            ? structuredClone(data)
            : JSON.parse(JSON.stringify(data));
        const chapters = clone.appState?.chapters || {};
        for (const chapterId of Object.keys(chapters)) {
            const content = chapters[chapterId]?.content;
            if (content) {
                chapters[chapterId].content = await prepareChapterHtmlForStorage(bookId, content);
            }
        }
        if (clone.publishedState?.appState?.chapters) {
            for (const chapterId of Object.keys(clone.publishedState.appState.chapters)) {
                const content = clone.publishedState.appState.chapters[chapterId]?.content;
                if (content) {
                    clone.publishedState.appState.chapters[chapterId].content =
                        await prepareChapterHtmlForStorage(bookId, content);
                }
            }
        }
        return clone;
    }

    async function hydrateImagesInContainer(container) {
        if (!container || typeof document === 'undefined') return;
        const imgs = container.querySelectorAll(`img[${REF_ATTR}]`);
        for (const img of imgs) {
            const ref = img.getAttribute(REF_ATTR);
            if (!ref) continue;
            const src = img.getAttribute('src') || '';
            if (src && !src.startsWith('blob:')) continue;
            try {
                const blob = await getBlob(ref);
                if (blob) {
                    if (src.startsWith('blob:')) URL.revokeObjectURL(src);
                    img.src = URL.createObjectURL(blob);
                }
            } catch (e) {
                console.warn('DreamBookImageBlobStore: failed to hydrate image', ref, e);
            }
        }
        container.querySelectorAll('img[src^="blob:"]').forEach((img) => {
            if (!img.getAttribute(REF_ATTR)) img.removeAttribute('src');
        });
    }

    function stripInlineDataImagesFromBookData(data) {
        const clone = JSON.parse(JSON.stringify(data));
        const stripHtml = (html) => String(html || '').replace(/<img[^>]+src=["']data:image[^"']*["'][^>]*>/gi, '');
        const chapters = clone.appState?.chapters || {};
        Object.keys(chapters).forEach((id) => {
            if (chapters[id]?.content) chapters[id].content = stripHtml(chapters[id].content);
        });
        return clone;
    }

    global.DreamBookImageBlobStore = {
        REF_ATTR,
        externalizeHtmlImages,
        hydrateHtml,
        hydrateImagesInContainer,
        sanitizeHtmlImagesForStorage,
        prepareChapterHtmlForStorage,
        prepareBookForStorage,
        stripInlineDataImagesFromBookData
    };
})(typeof window !== 'undefined' ? window : globalThis);
