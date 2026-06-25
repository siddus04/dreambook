/**
 * RealtimeVoice - Reusable OpenAI Realtime transcription module.
 * Uses /v1/realtime/client_secrets for ephemeral auth and streams PCM16 audio over WebSocket.
 */
const RealtimeVoice = (function() {
    'use strict';

    let ws = null;
    let audioContext = null;
    let mediaStream = null;
    let sourceNode = null;
    let processorNode = null;
    let isActive = false;
    let transcriptBuffer = '';
    let partialTranscript = '';
    let callbacks = {};
    let apiKey = '';
    let cleanupPrompt = '';
    const targetSampleRate = 24000;

    const DEFAULT_CLEANUP_PROMPT =
        'Clean up this spoken transcription: remove filler words (um, uh, like, you know), fix grammar, and make it read naturally. Do NOT expand or add new content. Keep the author\'s voice and intent. Return only the cleaned text.';

    function resetTranscript() {
        transcriptBuffer = '';
        partialTranscript = '';
    }

    async function getEphemeralToken(key) {
        const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                session: {
                    type: 'transcription',
                    audio: {
                        input: {
                            format: {
                                type: 'audio/pcm',
                                rate: 24000
                            },
                            transcription: {
                                model: 'gpt-realtime-whisper',
                                delay: 'low'
                            }
                        }
                    }
                }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Failed to get ephemeral token: ${response.status} ${errText}`);
        }

        const data = await response.json();
        return data.client_secret?.value || data.value;
    }

    function emitTranscript() {
        const combined = (transcriptBuffer + partialTranscript).trim();
        if (callbacks.onTranscribing) callbacks.onTranscribing(combined);
    }

    function handleServerEvent(msg) {
        const type = msg.type;

        if (type === 'conversation.item.input_audio_transcription.delta') {
            partialTranscript += msg.delta || '';
            emitTranscript();
            return;
        }

        if (type === 'conversation.item.input_audio_transcription.completed') {
            const text = (msg.transcript || '').trim();
            if (text) {
                transcriptBuffer = transcriptBuffer ? `${transcriptBuffer} ${text}` : text;
            }
            partialTranscript = '';
            emitTranscript();
            return;
        }

        if (type === 'transcription.text.delta') {
            partialTranscript += msg.delta || '';
            emitTranscript();
            return;
        }

        if (type === 'transcription.text.done') {
            const text = (msg.text || partialTranscript || '').trim();
            if (text) transcriptBuffer = text;
            partialTranscript = '';
            emitTranscript();
            return;
        }

        if (type === 'error') {
            const errMsg = msg.error?.message || 'Realtime transcription error';
            teardown();
            closeWebSocket();
            if (callbacks.onError) callbacks.onError(new Error(errMsg));
        }
    }

    function connectWebSocket(token) {
        return new Promise((resolve, reject) => {
            // Transcription sessions: model is set in session config, not the URL query string.
            ws = new WebSocket('wss://api.openai.com/v1/realtime', [
                'realtime',
                `openai-insecure-api-key.${token}`
            ]);

            const timeout = setTimeout(() => reject(new Error('WebSocket connection timeout')), 10000);

            ws.onopen = () => {
                clearTimeout(timeout);
                ws.send(JSON.stringify({
                    type: 'session.update',
                    session: {
                        type: 'transcription',
                        audio: {
                            input: {
                                format: {
                                    type: 'audio/pcm',
                                    rate: 24000
                                },
                                transcription: {
                                    model: 'gpt-realtime-whisper',
                                    delay: 'low'
                                }
                            }
                        }
                    }
                }));
                resolve();
            };

            ws.onerror = () => {
                clearTimeout(timeout);
                reject(new Error('WebSocket connection failed'));
            };

            ws.onmessage = (event) => {
                try {
                    handleServerEvent(JSON.parse(event.data));
                } catch (e) {
                    console.warn('RealtimeVoice: failed to parse message', e);
                }
            };
        });
    }

    function commitAudioBuffer() {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
        }
    }

    function floatTo16BitPCM(float32Array) {
        const buffer = new ArrayBuffer(float32Array.length * 2);
        const view = new DataView(buffer);
        for (let i = 0; i < float32Array.length; i++) {
            const s = Math.max(-1, Math.min(1, float32Array[i]));
            view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
        return buffer;
    }

    function arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        const chunkSize = 0x8000;
        for (let i = 0; i < bytes.length; i += chunkSize) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
        }
        return btoa(binary);
    }

    function resampleBuffer(input, inputRate, outputRate) {
        if (inputRate === outputRate) return input;
        const ratio = inputRate / outputRate;
        const newLength = Math.round(input.length / ratio);
        const result = new Float32Array(newLength);
        for (let i = 0; i < newLength; i++) {
            const idx = i * ratio;
            const idxFloor = Math.floor(idx);
            const idxCeil = Math.min(idxFloor + 1, input.length - 1);
            const frac = idx - idxFloor;
            result[i] = input[idxFloor] * (1 - frac) + input[idxCeil] * frac;
        }
        return result;
    }

    async function startAudioCapture() {
        mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true
            }
        });

        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        const inputRate = audioContext.sampleRate;
        sourceNode = audioContext.createMediaStreamSource(mediaStream);

        const bufferSize = 4096;
        processorNode = audioContext.createScriptProcessor(bufferSize, 1, 1);
        processorNode.onaudioprocess = (e) => {
            if (!isActive || !ws || ws.readyState !== WebSocket.OPEN) return;

            const inputData = e.inputBuffer.getChannelData(0);
            const resampled = resampleBuffer(inputData, inputRate, targetSampleRate);
            const pcm = floatTo16BitPCM(resampled);
            ws.send(JSON.stringify({
                type: 'input_audio_buffer.append',
                audio: arrayBufferToBase64(pcm)
            }));
        };

        sourceNode.connect(processorNode);
        processorNode.connect(audioContext.destination);
    }

    function stopAudioCapture() {
        if (processorNode) {
            processorNode.disconnect();
            processorNode.onaudioprocess = null;
            processorNode = null;
        }
        if (sourceNode) {
            sourceNode.disconnect();
            sourceNode = null;
        }
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            mediaStream = null;
        }
        if (audioContext) {
            audioContext.close().catch(() => {});
            audioContext = null;
        }
    }

    function closeWebSocket() {
        return new Promise((resolve) => {
            if (!ws) {
                resolve();
                return;
            }
            const socket = ws;
            ws = null;
            if (socket.readyState === WebSocket.OPEN) {
                socket.onclose = () => resolve();
                socket.close();
            } else {
                resolve();
            }
        });
    }

    async function cleanupText(text, key, prompt) {
        if (!text.trim()) return text;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: prompt || DEFAULT_CLEANUP_PROMPT },
                    { role: 'user', content: text }
                ]
            })
        });

        if (!response.ok) throw new Error('Cleanup request failed');
        const data = await response.json();
        return data.choices[0].message.content.trim();
    }

    function teardown() {
        stopAudioCapture();
        isActive = false;
    }

    return {
        start: async function(options = {}) {
            if (isActive) await this.stop();

            callbacks = {
                onTranscribing: options.onTranscribing || null,
                onComplete: options.onComplete || null,
                onError: options.onError || null
            };
            apiKey = options.apiKey || '';
            cleanupPrompt = options.cleanupPrompt || DEFAULT_CLEANUP_PROMPT;
            resetTranscript();

            if (!apiKey) {
                const err = new Error('OpenAI API key is required');
                if (callbacks.onError) callbacks.onError(err);
                throw err;
            }

            if (!navigator.mediaDevices?.getUserMedia) {
                const err = new Error('Voice recording is not supported in your browser');
                if (callbacks.onError) callbacks.onError(err);
                throw err;
            }

            try {
                // Acquire mic first while the click user-gesture is still active.
                await startAudioCapture();
                const token = await getEphemeralToken(apiKey);
                await connectWebSocket(token);
                isActive = true;
            } catch (e) {
                teardown();
                await closeWebSocket();
                if (callbacks.onError) callbacks.onError(e);
                throw e;
            }
        },

        stop: async function() {
            if (!isActive && !ws) return '';

            isActive = false;
            commitAudioBuffer();
            stopAudioCapture();

            await new Promise(resolve => setTimeout(resolve, 500));

            const rawText = (transcriptBuffer + partialTranscript).trim();
            await closeWebSocket();

            try {
                const cleaned = rawText
                    ? await cleanupText(rawText, apiKey, cleanupPrompt)
                    : '';
                if (callbacks.onComplete) callbacks.onComplete(cleaned);
                return cleaned;
            } catch (e) {
                if (callbacks.onError) callbacks.onError(e);
                if (callbacks.onComplete) callbacks.onComplete(rawText);
                return rawText;
            } finally {
                callbacks = {};
            }
        },

        isRecording: function() {
            return isActive;
        },

        abort: async function() {
            isActive = false;
            stopAudioCapture();
            await closeWebSocket();
            resetTranscript();
            callbacks = {};
        }
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = RealtimeVoice;
}

/**
 * RealtimeVoiceAgent - Bidirectional voice agent for conversational interviews.
 * Uses GA Realtime API with gpt-realtime-2 voice-agent sessions.
 */
const RealtimeVoiceAgent = (function() {
    'use strict';

    let ws = null;
    let audioContext = null;
    let mediaStream = null;
    let sourceNode = null;
    let processorNode = null;
    let playbackContext = null;
    let playbackTime = 0;
    let isActive = false;
    let callbacks = {};
    let apiKey = '';
    let instructions = '';
    let transcriptLines = [];
    let currentAssistantText = '';
    let currentUserText = '';
    let initialGreetingSent = false;
    let responseInProgress = false;
    let inputEnabled = false;
    let requireUserTranscriptBeforeResponse = false;
    let inputCooldownTimer = null;
    const targetSampleRate = 24000;
    const INPUT_COOLDOWN_MS = 500;

    function resetTranscript() {
        transcriptLines = [];
        currentAssistantText = '';
        currentUserText = '';
    }

    function getFullTranscript() {
        return transcriptLines.join('\n');
    }

    function appendTranscriptLine(role, text) {
        const trimmed = (text || '').trim();
        if (!trimmed) return;
        transcriptLines.push(`${role === 'assistant' ? 'AI' : 'You'}: ${trimmed}`);
        if (callbacks.onTranscriptUpdate) callbacks.onTranscriptUpdate(getFullTranscript());
    }

    function buildTurnDetectionConfig() {
        return {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 1500,
            create_response: !requireUserTranscriptBeforeResponse
        };
    }

    function buildAgentSessionConfig(systemInstructions) {
        return {
            type: 'realtime',
            model: 'gpt-realtime-2',
            instructions: systemInstructions,
            output_modalities: ['audio'],
            audio: {
                input: {
                    format: { type: 'audio/pcm', rate: 24000 },
                    transcription: { model: 'gpt-4o-mini-transcribe' },
                    turn_detection: buildTurnDetectionConfig()
                },
                output: {
                    format: { type: 'audio/pcm', rate: 24000 },
                    voice: 'marin'
                }
            }
        };
    }

    function clearInputCooldownTimer() {
        if (inputCooldownTimer) {
            clearTimeout(inputCooldownTimer);
            inputCooldownTimer = null;
        }
    }

    function scheduleInputEnabled() {
        clearInputCooldownTimer();
        const delay = requireUserTranscriptBeforeResponse ? INPUT_COOLDOWN_MS : 0;
        inputCooldownTimer = setTimeout(() => {
            inputCooldownTimer = null;
            if (!isActive) return;
            inputEnabled = true;
            if (callbacks.onInputEnabled) callbacks.onInputEnabled();
        }, delay);
    }

    function requestFollowUpResponse() {
        if (!ws || ws.readyState !== WebSocket.OPEN || responseInProgress || !isActive) return;
        ws.send(JSON.stringify({ type: 'response.create' }));
    }

    function handleUserTranscriptionCompleted(text) {
        const trimmed = (text || '').trim();
        if (!trimmed) {
            if (callbacks.onRejectedUserTurn) callbacks.onRejectedUserTurn(trimmed);
            return;
        }

        if (requireUserTranscriptBeforeResponse && callbacks.validateUserTurn) {
            const verdict = callbacks.validateUserTurn(trimmed);
            if (verdict === 'stop') {
                appendTranscriptLine('user', trimmed);
                if (callbacks.onStopRequested) callbacks.onStopRequested(trimmed);
                return;
            }
            if (verdict === 'reject') {
                if (callbacks.onRejectedUserTurn) callbacks.onRejectedUserTurn(trimmed);
                return;
            }
        }

        appendTranscriptLine('user', trimmed);
        if (requireUserTranscriptBeforeResponse) {
            requestFollowUpResponse();
        }
    }

    async function getEphemeralToken(key, systemInstructions) {
        const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                session: buildAgentSessionConfig(systemInstructions)
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Failed to get ephemeral token: ${response.status} ${errText}`);
        }

        const data = await response.json();
        return data.client_secret?.value || data.value;
    }

    function floatTo16BitPCM(float32Array) {
        const buffer = new ArrayBuffer(float32Array.length * 2);
        const view = new DataView(buffer);
        for (let i = 0; i < float32Array.length; i++) {
            const s = Math.max(-1, Math.min(1, float32Array[i]));
            view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
        return buffer;
    }

    function pcm16ToFloat32(arrayBuffer) {
        const view = new DataView(arrayBuffer);
        const floats = new Float32Array(arrayBuffer.byteLength / 2);
        for (let i = 0; i < floats.length; i++) {
            floats[i] = view.getInt16(i * 2, true) / 0x8000;
        }
        return floats;
    }

    function arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        const chunkSize = 0x8000;
        for (let i = 0; i < bytes.length; i += chunkSize) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
        }
        return btoa(binary);
    }

    function base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return bytes.buffer;
    }

    function resampleBuffer(input, inputRate, outputRate) {
        if (inputRate === outputRate) return input;
        const ratio = inputRate / outputRate;
        const newLength = Math.round(input.length / ratio);
        const result = new Float32Array(newLength);
        for (let i = 0; i < newLength; i++) {
            const idx = i * ratio;
            const idxFloor = Math.floor(idx);
            const idxCeil = Math.min(idxFloor + 1, input.length - 1);
            const frac = idx - idxFloor;
            result[i] = input[idxFloor] * (1 - frac) + input[idxCeil] * frac;
        }
        return result;
    }

    function ensurePlaybackContext() {
        if (!playbackContext) {
            playbackContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: targetSampleRate });
        }
        if (playbackContext.state === 'suspended') {
            playbackContext.resume().catch(() => {});
        }
        return playbackContext;
    }

    function playAudioChunk(base64Audio) {
        if (!base64Audio) return;
        const ctx = ensurePlaybackContext();
        const pcm = base64ToArrayBuffer(base64Audio);
        const floats = pcm16ToFloat32(pcm);
        const buffer = ctx.createBuffer(1, floats.length, targetSampleRate);
        buffer.copyToChannel(floats, 0);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        const startAt = Math.max(ctx.currentTime, playbackTime);
        source.start(startAt);
        playbackTime = startAt + buffer.duration;
        if (callbacks.onAgentSpeaking) callbacks.onAgentSpeaking(true);
        source.onended = () => {
            if (ctx.currentTime >= playbackTime - 0.05 && callbacks.onAgentSpeaking) {
                callbacks.onAgentSpeaking(false);
            }
        };
    }

    function sendInitialGreeting() {
        if (!ws || ws.readyState !== WebSocket.OPEN || initialGreetingSent || responseInProgress) return;
        initialGreetingSent = true;
        ws.send(JSON.stringify({ type: 'response.create' }));
    }

    function handleServerEvent(msg) {
        const type = msg.type;

        if (type === 'session.updated') {
            sendInitialGreeting();
            return;
        }

        if (type === 'response.created') {
            responseInProgress = true;
            if (requireUserTranscriptBeforeResponse) {
                inputEnabled = false;
            }
            return;
        }

        if (type === 'response.done') {
            responseInProgress = false;
            if (requireUserTranscriptBeforeResponse) {
                inputEnabled = false;
                scheduleInputEnabled();
            } else if (!inputEnabled) {
                inputEnabled = true;
                if (callbacks.onInputEnabled) callbacks.onInputEnabled();
            }
            return;
        }

        if (type === 'response.output_audio.delta' || type === 'response.audio.delta') {
            playAudioChunk(msg.delta || msg.audio);
            return;
        }

        if (type === 'response.output_audio_transcript.delta' || type === 'response.audio_transcript.delta') {
            currentAssistantText += msg.delta || '';
            if (callbacks.onAssistantPartial) callbacks.onAssistantPartial(currentAssistantText);
            return;
        }

        if (type === 'response.output_audio_transcript.done' || type === 'response.audio_transcript.done') {
            const text = (msg.transcript || currentAssistantText || '').trim();
            currentAssistantText = '';
            appendTranscriptLine('assistant', text);
            return;
        }

        if (type === 'response.output_text.delta') {
            currentAssistantText += msg.delta || '';
            if (callbacks.onAssistantPartial) callbacks.onAssistantPartial(currentAssistantText);
            return;
        }

        if (type === 'response.output_text.done') {
            const text = (msg.text || currentAssistantText || '').trim();
            currentAssistantText = '';
            appendTranscriptLine('assistant', text);
            return;
        }

        if (type === 'conversation.item.input_audio_transcription.delta') {
            currentUserText += msg.delta || '';
            if (callbacks.onUserPartial) callbacks.onUserPartial(currentUserText);
            return;
        }

        if (type === 'conversation.item.input_audio_transcription.completed') {
            const text = (msg.transcript || currentUserText || '').trim();
            currentUserText = '';
            handleUserTranscriptionCompleted(text);
            return;
        }

        if (type === 'input_audio_buffer.speech_started') {
            if (callbacks.onUserSpeaking) callbacks.onUserSpeaking(true);
            return;
        }

        if (type === 'input_audio_buffer.speech_stopped') {
            if (callbacks.onUserSpeaking) callbacks.onUserSpeaking(false);
            return;
        }

        if (type === 'error') {
            const errMsg = msg.error?.message || 'Realtime voice agent error';
            const errCode = msg.error?.code || '';
            if (errCode === 'conversation_already_has_active_response' ||
                errMsg.includes('active response in progress')) {
                console.warn('RealtimeVoiceAgent:', errMsg);
                return;
            }
            teardown();
            closeWebSocket();
            if (callbacks.onError) callbacks.onError(new Error(errMsg));
        }
    }

    function connectWebSocket(token) {
        return new Promise((resolve, reject) => {
            ws = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-realtime-2', [
                'realtime',
                `openai-insecure-api-key.${token}`
            ]);

            const timeout = setTimeout(() => reject(new Error('WebSocket connection timeout')), 15000);

            ws.onopen = () => {
                clearTimeout(timeout);
                ws.send(JSON.stringify({
                    type: 'session.update',
                    session: {
                        type: 'realtime',
                        instructions,
                        output_modalities: ['audio'],
                        audio: {
                            input: {
                                format: { type: 'audio/pcm', rate: 24000 },
                                transcription: { model: 'gpt-4o-mini-transcribe' },
                                turn_detection: buildTurnDetectionConfig()
                            },
                            output: {
                                format: { type: 'audio/pcm', rate: 24000 },
                                voice: 'marin'
                            }
                        }
                    }
                }));
                resolve();
            };

            ws.onerror = () => {
                clearTimeout(timeout);
                reject(new Error('WebSocket connection failed'));
            };

            ws.onmessage = (event) => {
                try {
                    handleServerEvent(JSON.parse(event.data));
                } catch (e) {
                    console.warn('RealtimeVoiceAgent: failed to parse message', e);
                }
            };
        });
    }

    async function startAudioCapture() {
        mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true }
        });

        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        if (audioContext.state === 'suspended') await audioContext.resume();

        const inputRate = audioContext.sampleRate;
        sourceNode = audioContext.createMediaStreamSource(mediaStream);
        const bufferSize = 4096;
        processorNode = audioContext.createScriptProcessor(bufferSize, 1, 1);
        processorNode.onaudioprocess = (e) => {
            if (!isActive || !inputEnabled || !ws || ws.readyState !== WebSocket.OPEN) return;
            const inputData = e.inputBuffer.getChannelData(0);
            const resampled = resampleBuffer(inputData, inputRate, targetSampleRate);
            const pcm = floatTo16BitPCM(resampled);
            ws.send(JSON.stringify({
                type: 'input_audio_buffer.append',
                audio: arrayBufferToBase64(pcm)
            }));
        };

        sourceNode.connect(processorNode);
        processorNode.connect(audioContext.destination);
    }

    function stopAudioCapture() {
        if (processorNode) {
            processorNode.disconnect();
            processorNode.onaudioprocess = null;
            processorNode = null;
        }
        if (sourceNode) {
            sourceNode.disconnect();
            sourceNode = null;
        }
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            mediaStream = null;
        }
        if (audioContext) {
            audioContext.close().catch(() => {});
            audioContext = null;
        }
    }

    function closeWebSocket() {
        return new Promise((resolve) => {
            if (!ws) {
                resolve();
                return;
            }
            const socket = ws;
            ws = null;
            if (socket.readyState === WebSocket.OPEN) {
                socket.onclose = () => resolve();
                socket.close();
            } else {
                resolve();
            }
        });
    }

    function teardown() {
        clearInputCooldownTimer();
        stopAudioCapture();
        isActive = false;
        playbackTime = 0;
        if (playbackContext) {
            playbackContext.close().catch(() => {});
            playbackContext = null;
        }
    }

    return {
        start: async function(options = {}) {
            if (isActive) await this.stop();

            callbacks = {
                onTranscriptUpdate: options.onTranscriptUpdate || null,
                onAssistantPartial: options.onAssistantPartial || null,
                onUserPartial: options.onUserPartial || null,
                onAgentSpeaking: options.onAgentSpeaking || null,
                onUserSpeaking: options.onUserSpeaking || null,
                onInputEnabled: options.onInputEnabled || null,
                onError: options.onError || null,
                onReady: options.onReady || null,
                validateUserTurn: options.validateUserTurn || null,
                onStopRequested: options.onStopRequested || null,
                onRejectedUserTurn: options.onRejectedUserTurn || null
            };
            apiKey = options.apiKey || '';
            instructions = options.instructions || '';
            requireUserTranscriptBeforeResponse = !!options.requireUserTranscriptBeforeResponse;
            resetTranscript();
            playbackTime = 0;
            initialGreetingSent = false;
            responseInProgress = false;
            inputEnabled = false;
            clearInputCooldownTimer();

            if (!apiKey) throw new Error('OpenAI API key is required');
            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error('Voice recording is not supported in your browser');
            }

            try {
                await startAudioCapture();
                const token = await getEphemeralToken(apiKey, instructions);
                await connectWebSocket(token);
                isActive = true;
                if (callbacks.onReady) callbacks.onReady();
            } catch (e) {
                teardown();
                await closeWebSocket();
                if (callbacks.onError) callbacks.onError(e);
                throw e;
            }
        },

        stop: async function() {
            if (!isActive && !ws) return getFullTranscript();

            isActive = false;
            stopAudioCapture();
            await new Promise(resolve => setTimeout(resolve, 300));
            const transcript = getFullTranscript();
            await closeWebSocket();
            teardown();
            callbacks = {};
            return transcript;
        },

        abort: async function() {
            isActive = false;
            stopAudioCapture();
            await closeWebSocket();
            resetTranscript();
            teardown();
            callbacks = {};
        },

        isActive: function() {
            return isActive;
        },

        getTranscript: function() {
            return getFullTranscript();
        }
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports.RealtimeVoiceAgent = RealtimeVoiceAgent;
}
