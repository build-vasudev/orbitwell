// ========================================
// OrbitWell - Main Application JavaScript
// ========================================

class OrbitWellApp {
    constructor() {
        this.speechRecognition = null;
        this.isListening = false;
        this.currentPage = window.location.pathname;
        this.meditationTimer = null;
        this.breathingInterval = null;
        this.meditationInterval = null;
        this.countdownInterval = null;
        // Generate or retrieve session ID for conversation context
        this.sessionId = localStorage.getItem('orbitwell_session_id') || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('orbitwell_session_id', this.sessionId);
        this.musicPlayer = {
            audio: null,
            currentTrack: 0,
            isPlaying: false,
            tracks: [
                { name: 'Deep Space Relaxation', file: 'song1.mp3' },
                { name: 'Cosmic Meditation', file: 'song2.mp3' },
                { name: 'Stellar Serenity', file: 'song3.mp3' },
                { name: 'Nebula Dreams', file: 'song4.mp3' },
                { name: 'Galactic Harmony', file: 'song5.mp3' }
            ],

            // Bound event handlers to avoid duplicates
            onAudioEnded: null,
            onAudioTimeUpdate: null,
            onAudioLoadedMetadata: null,

            loadSong(trackIndex) {
                if (trackIndex >= 0 && trackIndex < this.tracks.length) {
                    this.currentTrack = trackIndex;
                    const track = this.tracks[this.currentTrack];

                    // Clean up existing audio
                    if (this.audio) {
                        this.audio.pause();
                        if (this.onAudioEnded) this.audio.removeEventListener('ended', this.onAudioEnded);
                        if (this.onAudioTimeUpdate) this.audio.removeEventListener('timeupdate', this.onAudioTimeUpdate);
                        if (this.onAudioLoadedMetadata) this.audio.removeEventListener('loadedmetadata', this.onAudioLoadedMetadata);
                    }

                    // Create new audio object
                    this.audio = new Audio(`/static/sounds/${track.file}`);

                    // Create bound event handlers
                    this.onAudioEnded = () => this.next();
                    this.onAudioTimeUpdate = () => this.updateTimeline();
                    this.onAudioLoadedMetadata = () => this.updateDuration();

                    // Add event listeners
                    this.audio.addEventListener('ended', this.onAudioEnded);
                    this.audio.addEventListener('timeupdate', this.onAudioTimeUpdate);
                    this.audio.addEventListener('loadedmetadata', this.onAudioLoadedMetadata);

                    // Update display
                    this.updateTrackDisplay();
                }
            },

            play() {
                if (!this.audio) {
                    // If no audio loaded, load the current track first
                    this.loadSong(this.currentTrack);
                    // Play after a short delay to ensure loading
                    setTimeout(() => {
                        if (this.audio) {
                            this.audio.play().catch(e => console.error('Audio play error:', e));
                            this.isPlaying = true;
                            this.updatePlayButton();
                        }
                    }, 100);
                } else if (!this.isPlaying) {
                    this.audio.play().catch(e => console.error('Audio play error:', e));
                    this.isPlaying = true;
                    this.updatePlayButton();
                }
            },

            pause() {
                if (this.audio && this.isPlaying) {
                    this.audio.pause();
                    this.isPlaying = false;
                    this.updatePlayButton();
                }
            },

            toggle() {
                if (this.isPlaying) {
                    this.pause();
                } else {
                    this.play();
                }
            },

            next() {
                const nextIndex = (this.currentTrack + 1) % this.tracks.length;
                this.loadSong(nextIndex);
                if (this.isPlaying) {
                    this.play();
                }
            },

            prev() {
                const prevIndex = this.currentTrack > 0 ? this.currentTrack - 1 : this.tracks.length - 1;
                this.loadSong(prevIndex);
                if (this.isPlaying) {
                    this.play();
                }
            },

            updateTimeline() {
                if (!this.audio) return;

                const progressFill = document.getElementById('progress-fill');
                const currentTimeEl = document.getElementById('current-time');

                if (progressFill) {
                    const progress = (this.audio.currentTime / this.audio.duration) * 100;
                    progressFill.style.width = `${progress}%`;
                }

                if (currentTimeEl) {
                    currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
                }
            },

            updateDuration() {
                const totalTimeEl = document.getElementById('total-time');
                if (totalTimeEl && this.audio) {
                    totalTimeEl.textContent = this.formatTime(this.audio.duration);
                }
            },

            seek(position) {
                if (this.audio && typeof position === 'number') {
                    this.audio.currentTime = Math.max(0, Math.min(position, this.audio.duration));
                }
            },

            updateTrackDisplay() {
                const titleEl = document.getElementById('music-title');
                if (titleEl) {
                    titleEl.textContent = this.tracks[this.currentTrack].name;
                }
                // Update playlist active state
                document.querySelectorAll('.playlist-item').forEach((item, index) => {
                    item.classList.toggle('active', index === this.currentTrack);
                });
            },

            updatePlayButton() {
                const playPauseBtn = document.getElementById('play-pause-btn');
                const mainPlayBtn = document.getElementById('main-play-btn');
                const icon = this.isPlaying ? 'fas fa-pause' : 'fas fa-play';

                if (playPauseBtn) playPauseBtn.querySelector('i').className = icon;
                if (mainPlayBtn) mainPlayBtn.querySelector('i').className = icon;
            },

            formatTime(seconds) {
                const mins = Math.floor(seconds / 60);
                const secs = Math.floor(seconds % 60);
                return `${mins}:${secs.toString().padStart(2, '0')}`;
            }
        };
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeApp();
            this.setupEventListeners();
            this.initializeVoiceRecognition();
        });
    }

    initializeApp() {
        // Set up navigation highlighting
        this.highlightCurrentPage();
        // Initialize animations
        this.initializeAnimations();
        // Initialize page-specific functionality
        this.initializePageSpecificFeatures();
    }

    highlightCurrentPage() {
        const navLinks = document.querySelectorAll('.nav-menu a');
        navLinks.forEach(link => {
            if (link.getAttribute('href') === this.currentPage) {
                link.classList.add('active');
            }
        });
    }

    initializeAnimations() {
        // Add fade-in animation to main content
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.style.opacity = '0';
            mainContent.style.transform = 'translateY(20px)';
            mainContent.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            setTimeout(() => {
                mainContent.style.opacity = '1';
                mainContent.style.transform = 'translateY(0)';
            }, 100);
        }

        // Add hover animations to cards
        const cards = document.querySelectorAll('.feature-card, .entertainment-card, .planet-card, .game-card');
        cards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-8px) scale(1.02)';
            });
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
            });
        });
    }

    initializePageSpecificFeatures() {
        // Assistant page features
        if (this.currentPage === '/assistant') {
            this.initializeAssistantFeatures();
        }

        // Load reminders on reminder pages
        if (document.getElementById('active-reminders') || document.getElementById('completed-today') || document.getElementById('reminders-container')) {
            this.loadRemindersUI();
        }

        // Initialize music player
        if (document.getElementById('music-player')) {
            this.initializeMusicPlayer();
        }

        // Initialize journal
        if (document.getElementById('journal-entry')) {
            this.initializeJournal();
        }

        // Initialize affirmations and gratitude
        if (document.getElementById('new-affirmation-btn')) {
            this.initializeAffirmations();
        }
        if (document.getElementById('save-gratitude-btn')) {
            this.initializeGratitude();
        }

        // Initialize space facts button
        if (document.getElementById('random-fact-btn')) {
            const randomFactBtn = document.getElementById('random-fact-btn');
            randomFactBtn.addEventListener('click', () => this.showRandomSpaceFact());
        }

        // Initialize breathing exercise button
        if (document.getElementById('breathing-start-btn')) {
            const breathingBtn = document.getElementById('breathing-start-btn');
            breathingBtn.addEventListener('click', () => this.startBreathingExercise());
        }
    }

    initializeVoiceRecognition() {
        // Initialize Speech Recognition API
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.speechRecognition = new SpeechRecognition();
            this.speechRecognition.continuous = false;
            this.speechRecognition.interimResults = false;
            this.speechRecognition.lang = 'en-US';
        }
    }

    setupEventListeners() {
        // Global event listeners can be added here
        // Page-specific listeners are handled in their respective methods
    }

    // ========================================
    // CHAT FUNCTIONALITY
    // ========================================

    initializeAssistantFeatures() {
        const chatInput = document.getElementById('chat-input');
        const sendBtn = document.getElementById('send-btn');
        const micBtn = document.getElementById('mic-btn');
        const chatMessages = document.getElementById('chat-messages');
        const reminderForm = document.getElementById('reminder-form');
        const oxygenLevel = document.getElementById('oxygen-level');
        const simulateOxygenBtn = document.getElementById('simulate-oxygen');

        if (!chatInput || !sendBtn) return;

        // Chat event listeners
        sendBtn.addEventListener('click', () => this.sendChatMessage());
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
            }
        });

        // Voice recognition
        if (micBtn) {
            micBtn.addEventListener('click', () => this.toggleVoiceRecognition());
        }

        // Reminder form
        if (reminderForm) {
            reminderForm.addEventListener('submit', (e) => this.handleReminderSubmit(e));
        }

        // Oxygen simulation
        if (simulateOxygenBtn && oxygenLevel) {
            simulateOxygenBtn.addEventListener('click', () => this.simulateOxygen());
            oxygenLevel.addEventListener('input', () => this.simulateOxygen());
        }
    }

    async sendChatMessage(message = null) {
        const chatInput = document.getElementById('chat-input');
        const messageText = message || chatInput?.value?.trim();
        if (!messageText) return;

        try {
            // Add user message to chat
            this.addChatMessage('user', messageText);
            // Clear input
            if (chatInput) chatInput.value = '';
            // Show typing indicator
            this.showTypingIndicator();

            // Send to API with session ID for context
            const response = await fetch('/api/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    message: messageText,
                    session_id: this.sessionId
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Hide typing indicator
            this.hideTypingIndicator();

            // Process response
            this.handleChatResponse(data);

        } catch (error) {
            console.error('Chat error:', error);
            this.hideTypingIndicator();
            this.addChatMessage('assistant', 'Sorry, I encountered an error. Please try again.', 'error');
        }
    }

    handleChatResponse(data) {
        let responseText = data.response;

        // Add emergency styling if needed
        if (data.type === 'emergency') {
            responseText = `🚨 ${responseText}`;
        }

        this.addChatMessage('assistant', responseText, data.type);

        // Handle emergency protocols
        if (data.protocol) {
            setTimeout(() => {
                this.addChatMessage('assistant', `📋 Recommended actions:\n${data.protocol.join('\n• ')}`, 'protocol');
            }, 1000);
        }
    }

    addChatMessage(sender, content, type = 'normal') {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message ${type === 'protocol' ? 'protocol-message' : ''}`;

        const avatar = sender === 'assistant' ? '🤖' : '👤';
        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <p class="message-text">${content.replace(/\n/g, '<br>')}</p>
                <div class="typing-cursor" style="display: none;">|</div>
            </div>
        `;

        chatMessages.appendChild(messageDiv);

        // Add typing effect for assistant messages
        if (sender === 'assistant' && type !== 'protocol') {
            this.animateTyping(messageDiv, content);
        } else {
            // Auto-scroll to bottom for instant messages
            this.scrollChatToBottom();
        }
    }

    animateTyping(messageDiv, fullText) {
        const textElement = messageDiv.querySelector('.message-text');
        const cursorElement = messageDiv.querySelector('.typing-cursor');

        if (!textElement || !cursorElement) {
            this.scrollChatToBottom();
            return;
        }

        // Show cursor initially
        cursorElement.style.display = 'inline';
        textElement.textContent = '';

        let charIndex = 0;
        const typingSpeed = 30; // milliseconds per character

        const typeChar = () => {
            if (charIndex < fullText.length) {
                // Handle line breaks
                if (fullText.charAt(charIndex) === '\n') {
                    textElement.innerHTML += '<br>';
                } else {
                    textElement.innerHTML += fullText.charAt(charIndex);
                }
                charIndex++;
                this.scrollChatToBottom();

                // Continue typing
                setTimeout(typeChar, typingSpeed);
            } else {
                // Typing complete - hide cursor
                cursorElement.style.display = 'none';

                // Add completion animation
                messageDiv.style.animation = 'message-complete 0.5s ease-out';
                setTimeout(() => {
                    messageDiv.style.animation = '';
                }, 500);
            }
        };

        // Start typing after a brief delay
        setTimeout(typeChar, 200);
    }

    showTypingIndicator() {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;

        const typingDiv = document.createElement('div');
        typingDiv.className = 'message assistant-message typing-indicator';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;

        chatMessages.appendChild(typingDiv);
        this.scrollChatToBottom();
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    scrollChatToBottom() {
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            setTimeout(() => {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }, 100);
        }
    }

    // ========================================
    // VOICE RECOGNITION
    // ========================================

    toggleVoiceRecognition() {
        if (!this.speechRecognition) {
            this.showNotification('Speech recognition is not supported in your browser.', 'error');
            return;
        }

        if (this.isListening) {
            this.stopVoiceRecognition();
            return;
        }

        this.startVoiceRecognition();
    }

    startVoiceRecognition() {
        const micBtn = document.getElementById('mic-btn');
        if (!micBtn) return;

        this.speechRecognition.start();
        this.isListening = true;
        micBtn.classList.add('listening');
        micBtn.innerHTML = '🎙️';
        this.showNotification('Listening... Speak now!', 'info');

        this.speechRecognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            const chatInput = document.getElementById('chat-input');
            if (chatInput) {
                chatInput.value = transcript;
                this.sendChatMessage(transcript);
            }
        };

        this.speechRecognition.onend = () => {
            this.stopVoiceRecognition();
        };

        this.speechRecognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.showNotification('Speech recognition error. Please try again.', 'error');
            this.stopVoiceRecognition();
        };
    }

    stopVoiceRecognition() {
        if (this.speechRecognition) {
            this.speechRecognition.stop();
        }
        this.isListening = false;
        const micBtn = document.getElementById('mic-btn');
        if (micBtn) {
            micBtn.classList.remove('listening');
            micBtn.innerHTML = '🎤';
        }
    }

    // ========================================
    // REMINDERS FUNCTIONALITY
    // ========================================
    // ORBITWELL REMINDER SYSTEM (FULLY FUNCTIONAL)

    // Load reminders from storage
    getReminders() {
        const data = localStorage.getItem("orbitwell_reminders");
        return data ? JSON.parse(data) : [];
    }

    // Save reminders to storage
    saveReminders(reminders) {
        localStorage.setItem("orbitwell_reminders", JSON.stringify(reminders));
    }

    // Helper – get today's date
    today() {
        return new Date().toISOString().slice(0, 10);
    }

    // Initialize streak tracking
    getStreakData() {
        const data = localStorage.getItem("orbitwell_streak");
        return data ? JSON.parse(data) : { streak: 0, lastDate: null };
    }

    saveStreakData(data) {
        localStorage.setItem("orbitwell_streak", JSON.stringify(data));
    }

    // ===============================
    // ADD REMINDER
    // ===============================
    addReminder(title, description, datetime) {
        const reminders = this.getReminders();
        reminders.push({
            id: Date.now(),
            title,
            description,
            datetime,
            completed: false,
            completedDate: null
        });
        this.saveReminders(reminders);
        this.loadRemindersUI();
    }

    // ===============================
    // MARK COMPLETED
    // ===============================
    completeReminder(id) {
        const reminders = this.getReminders();
        reminders.forEach(r => {
            if (r.id === id) {
                r.completed = true;
                r.completedDate = this.today();
            }
        });
        this.saveReminders(reminders);
        this.updateStreak();  
        this.loadRemindersUI();
    }

    // Delete reminder
    deleteReminder(id) {
        const reminders = this.getReminders().filter(r => r.id !== id);
        this.saveReminders(reminders);
        this.loadRemindersUI();
    }

    // ===============================
    // STREAK CALCULATION
    // ===============================
    updateStreak() {
        const streakData = this.getStreakData();
        const reminders = this.getReminders();
        const todayDate = this.today();

        // Did user complete something today?
        const completedToday = reminders.some(r => r.completedDate === todayDate);
        if (!completedToday) return; // nothing to update

        if (streakData.lastDate === todayDate) {
            return; // streak already recorded today
        }

        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        if (streakData.lastDate === yesterday) {
            streakData.streak++; // continue streak
        } else {
            streakData.streak = 1; // reset & start new
        }

        streakData.lastDate = todayDate;
        this.saveStreakData(streakData);
    }

    // ===============================
    // BUILD UI
    // ===============================
    loadRemindersUI() {
        const reminders = this.getReminders();
        const todayDate = this.today();

        const activeList = document.getElementById("active-reminders");
        const completedTodayList = document.getElementById("completed-today");
        const progressPercent = document.getElementById("progress-percent");
        const streakElement = document.getElementById("current-streak");

        if (!activeList || !completedTodayList) return; // page not loaded

        activeList.innerHTML = "";
        completedTodayList.innerHTML = "";

        let total = reminders.length;
        let completedTotal = reminders.filter(r => r.completed).length;

        // ====================
        // ACTIVE REMINDERS
        // ====================
        const activeReminders = reminders.filter(r => !r.completed);
        if (activeReminders.length === 0) {
            activeList.innerHTML = '<p class="no-reminders">No active reminders</p>';
        } else {
            activeReminders.forEach(r => {
                const date = new Date(r.datetime);
                const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                activeList.innerHTML += `
                    <div class="reminder-item">
                        <div class="reminder-content">
                            <h4>${this.escapeHtml(r.title)}</h4>
                            <p>${formattedDate}</p>
                            ${r.description ? `<p class="reminder-desc">${this.escapeHtml(r.description)}</p>` : ''}
                        </div>
                        <div class="reminder-actions">
                            <button onclick="completeReminder(${r.id})" class="btn btn-sm btn-success">Mark Complete</button>
                            <button onclick="deleteReminder(${r.id})" class="btn btn-sm btn-danger">Delete</button>
                        </div>
                    </div>
                `;
            });
        }

        // ====================
        // COMPLETED TODAY
        // ====================
        const completedToday = reminders.filter(r => r.completedDate === todayDate);
        if (completedToday.length === 0) {
            completedTodayList.innerHTML = '<p class="no-reminders">No reminders completed today</p>';
        } else {
            completedToday.forEach(r => {
                const date = new Date(r.datetime);
                const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                completedTodayList.innerHTML += `
                    <div class="reminder-item completed">
                        <div class="reminder-content">
                            <h4>${this.escapeHtml(r.title)}</h4>
                            <p>${formattedDate}</p>
                            ${r.description ? `<p class="reminder-desc">${this.escapeHtml(r.description)}</p>` : ''}
                            <small style="color: #4CAF50;">Completed Today</small>
                        </div>
                    </div>
                `;
            });
        }

        // ====================
        // PROGRESS BAR
        // ====================
        if (progressPercent) {
            const percent = total === 0 ? 0 : Math.round((completedTotal / total) * 100);
            progressPercent.textContent = percent + "%";
        }

        // ====================
        // STREAK
        // ====================
        const streakData = this.getStreakData();
        if (streakElement) {
            streakElement.textContent = streakData.streak;
        }

        // Update other stats
        const totalEl = document.getElementById("total-reminders");
        const activeCountEl = document.getElementById("active-reminders-count");
        const completedTodayCountEl = document.getElementById("completed-today-count");
        
        if (totalEl) totalEl.textContent = total;
        if (activeCountEl) activeCountEl.textContent = activeReminders.length;
        if (completedTodayCountEl) completedTodayCountEl.textContent = completedToday.length;
    }

    // Legacy compatibility methods
    loadReminders() {
        this.loadRemindersUI();
    }

    handleReminderSubmit(event) {
        event.preventDefault();
        const titleInput = document.getElementById('reminder-title');
        const datetimeInput = document.getElementById('reminder-datetime');
        const descriptionInput = document.getElementById('reminder-description');

        if (!titleInput || !datetimeInput) return;

        const title = titleInput.value.trim();
        const datetime = datetimeInput.value;
        const description = descriptionInput ? descriptionInput.value.trim() : '';

        if (!title || !datetime) {
            this.showNotification('Please fill in all required fields.', 'warning');
            return;
        }

        this.addReminder(title, description, datetime);
        event.target.reset();
        if (this.showNotification) {
            this.showNotification('Reminder added successfully!', 'success');
        }
    }

    markReminderComplete(id) {
        this.completeReminder(id);
    }

    toggleReminder(id, completed) {
        if (completed) {
            this.completeReminder(id);
        }
    }

    // ========================================
    // OXYGEN SIMULATION
    // ========================================

    simulateOxygen() {
        const oxygenLevel = document.getElementById('oxygen-level');
        const oxygenIndicator = document.getElementById('oxygen-indicator');

        if (!oxygenLevel || !oxygenIndicator) return;

        const level = parseInt(oxygenLevel.value);
        const statusElement = oxygenIndicator.querySelector('.status-text');

        if (!statusElement) return;

        // Remove existing classes to apply new state
        oxygenIndicator.classList.remove('oxygen-normal', 'oxygen-low', 'oxygen-danger');

        if (level >= 80) {
            oxygenIndicator.classList.add('oxygen-normal');
            statusElement.textContent = 'Normal';
        } else if (level >= 50) {
            oxygenIndicator.classList.add('oxygen-low');
            statusElement.textContent = 'Low';
        } else {
            oxygenIndicator.classList.add('oxygen-danger');
            statusElement.textContent = 'Danger';

            // Auto-send emergency message if on assistant page
            if (this.currentPage === '/assistant') {
                this.sendChatMessage(`EMERGENCY: Oxygen level is at ${level}%. This is critical!`);
            }

            // Start alarm sound
            this.startOxygenAlarm();
        }
    }

    startOxygenAlarm() {
        const alarm = document.getElementById('oxygen-alarm');
        if (!alarm) return;

        try {
            alarm.currentTime = 0;
            alarm.play().catch(() => {});
        } catch (e) {
            console.error('Oxygen alarm error:', e);
        }
    }

    stopOxygenAlarm() {
        const alarm = document.getElementById('oxygen-alarm');
        if (!alarm) return;

        try {
            alarm.pause();
            alarm.currentTime = 0;
        } catch (e) {
            console.error('Oxygen alarm stop error:', e);
        }
    }

    // ========================================
    // QUICK ACTIONS
    // ========================================

    quickAction(action) {
        const prompts = {
            breathing: "Let's do a quick breathing exercise. Inhale for 4 counts, hold for 4, exhale for 4. Ready to begin?",
            gratitude: "What's one thing you're grateful for today? Taking a moment to notice the positive can help shift our perspective.",
            mindfulness: "Take a moment to notice your surroundings. What do you see, hear, and feel right now?",
            journal: "Journal prompt: What emotions am I experiencing right now, and what might be triggering them?"
        };

        const chatInput = document.getElementById('chat-input');
        if (chatInput && prompts[action]) {
            chatInput.value = prompts[action];
            this.sendChatMessage(prompts[action]);
        }
    }

    // ========================================
    // SPACE FACTS
    // ========================================

    async showRandomSpaceFact() {
        try {
            // Fetch knowledge base data
            const response = await fetch('/api/knowledge-base');
            if (!response.ok) {
                throw new Error('Failed to load knowledge base');
            }

            const data = await response.json();
            const facts = this.extractSpaceFacts(data);

            if (facts.length === 0) {
                throw new Error('No space facts found');
            }

            // Select random fact
            const randomFact = facts[Math.floor(Math.random() * facts.length)];

            // Display in floating card
            this.displayFactCard(randomFact);

        } catch (error) {
            console.error('Error loading space facts:', error);
            this.displayFactCard({
                text: "Unable to load space facts right now. Please try again later!",
                icon: "❌",
                category: "Error"
            });
        }
    }

    extractSpaceFacts(data) {
        const facts = [];

        // Extract from space_knowledge section
        if (data.space_knowledge) {
            Object.entries(data.space_knowledge).forEach(([key, content]) => {
                if (typeof content === 'string' && content.length > 50) {
                    // Create a shorter fact from the longer description
                    const shortFact = content.substring(0, 150) + (content.length > 150 ? '...' : '');
                    facts.push({
                        text: shortFact,
                        icon: this.getCategoryIcon(key),
                        category: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                        fullContent: content
                    });
                }
            });
        }

        // Extract from wellness topics (space-related ones)
        if (data.wellness_topics) {
            Object.entries(data.wellness_topics).forEach(([key, topic]) => {
                if (topic.content && topic.content.toLowerCase().includes('space')) {
                    facts.push({
                        text: topic.content,
                        icon: "🧠",
                        category: "Wellness",
                        fullContent: topic.content
                    });
                }
            });
        }

        return facts;
    }

    getCategoryIcon(key) {
        const iconMap = {
            planet_mercury: "☿", planet_venus: "♀", planet_earth: "🌍", planet_mars: "♂",
            planet_jupiter: "♃", planet_saturn: "♄", planet_uranus: "⛢", planet_neptune: "♆",
            black_hole: "⚫", event_horizon: "⭕", singularity: "∞", types_of_black_holes: "🌌",
            nebula: "🌠", milky_way: "🌌", star_life_cycle: "⭐", universe_expansion: "🌌",
            spacesuits: "👨‍🚀", iss: "🛰️", eva_procedures: "🚶‍♂️", oxygen_systems: "💨",
            microgravity: "🌀", co2_scrubbing: "🌿", exercise_routines: "💪", space_food: "🍽️",
            communication_delay: "📡", psychological_challenges: "🧠", radiation_protection: "☢️",
            sleep_in_space: "😴", waste_management: "♻️", water_recycling: "💧",
            navigation_systems: "🧭", life_support_systems: "🏥", emergency_procedures: "🚨",
            space_weather: "🌪️", orbital_mechanics: "🔄", mission_planning: "📋", thermal_control: "🌡️"
        };

        // Try exact match first
        if (iconMap[key]) {
            return iconMap[key];
        }

        // Try partial match
        for (const [pattern, icon] of Object.entries(iconMap)) {
            if (key.includes(pattern.split('_')[0])) {
                return icon;
            }
        }

        return "🚀"; // Default space icon
    }

    displayFactCard(fact) {
        const card = document.getElementById('floating-fact-card');
        const textElement = document.getElementById('fact-text');
        const iconElement = card.querySelector('.fact-icon');

        if (!card || !textElement || !iconElement) return;

        // Update content
        textElement.textContent = fact.text;
        iconElement.textContent = fact.icon;

        // Add category as a data attribute for styling
        card.setAttribute('data-category', fact.category.toLowerCase().replace(/\s+/g, '-'));

        // Show card with animation
        card.style.display = 'block';
        card.style.animation = 'fact-card-slide-down 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards';

        // Auto-hide after 10 seconds
        clearTimeout(this.factTimeout);
        this.factTimeout = setTimeout(() => {
            this.closeFactCard();
        }, 10000);
    }

    closeFactCard() {
        const card = document.getElementById('floating-fact-card');
        if (!card) return;

        card.style.animation = 'fact-card-slide-up 0.3s ease-out forwards';
        setTimeout(() => {
            card.style.display = 'none';
        }, 300);
        clearTimeout(this.factTimeout);
    }

    // ========================================
    // ENTERTAINMENT PAGE FUNCTIONS
    // ========================================

    initializeMusicPlayer() {
        // Check if new simplified music player exists (has song-selector)
        const songSelector = document.getElementById('song-selector');
        if (songSelector) {
            // New simplified player is present, skip old initialization
            return;
        }

        // Old player initialization (for backward compatibility if needed)
        const playPauseBtn = document.getElementById('play-pause-btn');
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const mainPlayBtn = document.getElementById('main-play-btn');

        if (playPauseBtn) playPauseBtn.addEventListener('click', () => this.musicPlayer.toggle());
        if (prevBtn) prevBtn.addEventListener('click', () => this.musicPlayer.prev());
        if (nextBtn) nextBtn.addEventListener('click', () => this.musicPlayer.next());
        if (mainPlayBtn) mainPlayBtn.addEventListener('click', () => this.musicPlayer.toggle());

        // Playlist selection
        document.querySelectorAll('.playlist-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                this.musicPlayer.loadSong(index);
                // Small delay to ensure audio is loaded before playing
                setTimeout(() => this.musicPlayer.play(), 100);
            });
        });

        // Progress bar seeking (click and drag)
        const progressBar = document.getElementById('music-timeline');
        if (progressBar) {
            let isDragging = false;

            const seekToPosition = (e) => {
                const rect = progressBar.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const percentage = Math.max(0, Math.min(1, clickX / rect.width));
                const seekTime = percentage * this.musicPlayer.audio.duration;
                this.musicPlayer.seek(seekTime);
            };

            // Click to seek
            progressBar.addEventListener('click', seekToPosition);

            // Drag to seek
            progressBar.addEventListener('mousedown', (e) => {
                isDragging = true;
                seekToPosition(e);
            });

            document.addEventListener('mousemove', (e) => {
                if (isDragging) {
                    seekToPosition(e);
                }
            });

            document.addEventListener('mouseup', () => {
                isDragging = false;
            });

            // Prevent text selection during drag
            progressBar.addEventListener('selectstart', (e) => {
                if (isDragging) {
                    e.preventDefault();
                }
            });
        }

        // Initialize first track
        this.musicPlayer.loadSong(0);
    }

    // ========================================
    // GUIDED MEDITATION SYSTEM (CLEAN VERSION)
    // ========================================

    resetMeditation() {
        // Clear meditation intervals
        if (this.meditationInterval) {
            clearInterval(this.meditationInterval);
            this.meditationInterval = null;
        }
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
        // Also clear meditation timer for compatibility
        if (this.meditationTimer) {
            clearInterval(this.meditationTimer);
            this.meditationTimer = null;
        }

        // Stop any breathing exercise that might be running
        this.stopBreathingExercise();

        // Reset display elements
        const statusEl = document.getElementById('meditation-status');
        const timerEl = document.getElementById('meditation-timer');
        const instructionEl = document.getElementById('instruction-box');
        const circle = document.getElementById('breathing-circle');

        if (statusEl) statusEl.innerText = '🧘 Ready to Begin';
        if (timerEl) timerEl.innerText = '00:00';
        if (instructionEl) instructionEl.innerText = 'Ready to begin your meditation journey';
        
        // Reset breathing circle if it exists
        if (circle) {
            circle.style.transition = 'transform 0.3s ease-in-out';
            circle.style.transform = 'scale(1)';
        }

        // Clear breathing instruction text
        const breathingInstruction = document.getElementById('breathing-instruction');
        if (breathingInstruction) {
            breathingInstruction.textContent = 'Breathe';
            breathingInstruction.style.opacity = '1';
        }
    }

    startMeditation(type) {
        // Map old types to new types
        const typeMap = {
            'stress': 'relax',
            'sleep': 'calm',
            'relax': 'relax',
            'calm': 'calm',
            'focus': 'focus'
        };
        const mappedType = typeMap[type] || 'relax';

        // Meditation configurations
        const meditationConfig = {
            relax: {
                duration: 10,
                instruction: "Release tension… Let your body soften…"
            },
            calm: {
                duration: 15,
                instruction: "Allow thoughts to pass… Stay present…"
            },
            focus: {
                duration: 5,
                instruction: "Bring attention to your breath…"
            }
        };

        const config = meditationConfig[mappedType] || meditationConfig.relax;

        // Reset everything first
        this.resetMeditation();

        const statusEl = document.getElementById('meditation-status');
        if (!statusEl) return;

        // Show meditation in progress
        statusEl.innerText = '🧘 Meditation in progress…';

        // Start countdown timer
        let remainingSec = config.duration * 60;
        this.countdownInterval = setInterval(() => {
            if (remainingSec <= 0) {
                clearInterval(this.countdownInterval);
                this.countdownInterval = null;
                this.meditationComplete();
                return;
            }

            this.updateTimer(remainingSec);
            remainingSec--;
        }, 1000);

        // Provide text guidance every 5 seconds
        this.meditationInterval = setInterval(() => {
            if (mappedType === 'relax') {
                this.setInstruction("Release tension… Let your body soften…");
            } else if (mappedType === 'focus') {
                this.setInstruction("Bring attention to your breath…");
            } else if (mappedType === 'calm') {
                this.setInstruction("Allow thoughts to pass… Stay present…");
            }
        }, 5000);

        // Set initial instruction
        this.setInstruction(config.instruction);
    }

    setInstruction(text) {
        const instructionEl = document.getElementById('instruction-box');
        if (instructionEl) {
            instructionEl.innerText = text;
        }
    }

    updateTimer(sec) {
        const m = String(Math.floor(sec / 60)).padStart(2, '0');
        const s = String(sec % 60).padStart(2, '0');
        const timerEl = document.getElementById('meditation-timer');
        if (timerEl) {
            timerEl.innerText = `${m}:${s}`;
        }
    }

    meditationComplete() {
        this.resetMeditation();
        const statusEl = document.getElementById('meditation-status');
        if (statusEl) {
            statusEl.innerText = '✔ Session Complete';
        }
    }

    stopMeditation() {
        this.resetMeditation();
        const statusEl = document.getElementById('meditation-status');
        if (statusEl) {
            statusEl.innerText = 'Meditation stopped.';
        }
    }

    selectColor(color) {
        const effects = {
            blue: "Take deep breaths and let the calming blue energy wash over you, bringing peace and tranquility.",
            green: "Feel the peaceful green energy grounding and centering you, connecting you with nature's balance.",
            peach: "Allow the warm peach to soothe and comfort your spirit, wrapping you in gentle warmth.",
            purple: "Embrace the creative purple to inspire and uplift your mind, awakening your inner wisdom."
        };

        const colorEffect = document.getElementById('color-effect');
        if (colorEffect) {
            colorEffect.textContent = effects[color] || "Experience the healing power of color therapy.";
            colorEffect.style.color = color === 'peach' ? '#FF6B35' : color;
        }

        // Add visual feedback to selected color
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('selected');
        });
        document.querySelector(`[data-color="${color}"]`)?.classList.add('selected');
    }

    // ========================================
    // BREATHING EXERCISE
    // ========================================

    startBreathingExercise(breathingConfig = { inhale: 4, hold: 4, exhale: 6 }) {
        const circle = document.getElementById('breathing-circle');
        const instruction = document.getElementById('breathing-instruction');
        const timer = document.getElementById('breathing-timer');
        const startBtn = document.getElementById('breathing-start-btn');

        if (!circle || !instruction) return;

        // Stop any existing breathing exercise first
        this.stopBreathingExercise();

        // Update button
        if (startBtn) {
            startBtn.textContent = 'Stop Breathing';
            startBtn.onclick = () => this.stopBreathingExercise();
        }

        // Initialize breathing state with all timeouts tracked
        this.breathingState = {
            phase: 'inhale',
            inhaleDuration: breathingConfig.inhale * 1000,
            holdDuration: breathingConfig.hold * 1000,
            exhaleDuration: breathingConfig.exhale * 1000,
            isRunning: true,
            timeouts: [],
            currentPhaseTime: 0,
            phaseTimer: null
        };

        // Start the breathing cycle
        this.runBreathingCycle();
    }

    runBreathingCycle() {
        if (!this.breathingState || !this.breathingState.isRunning) return;

        const circle = document.getElementById('breathing-circle');
        const instruction = document.getElementById('breathing-instruction');
        const timer = document.getElementById('breathing-timer');
        const state = this.breathingState;

        // Clear any existing phase timer
        if (state.phaseTimer) {
            clearInterval(state.phaseTimer);
            state.phaseTimer = null;
        }

        // Clear all pending timeouts
        state.timeouts.forEach(timeout => clearTimeout(timeout));
        state.timeouts = [];

        switch (state.phase) {
            case 'inhale':
                // Update instruction with fade
                instruction.style.opacity = '0';
                const inhaleTimeout1 = setTimeout(() => {
                    instruction.textContent = 'Inhale';
                    instruction.style.opacity = '1';
                }, 200);
                state.timeouts.push(inhaleTimeout1);

                // Start phase timer
                state.currentPhaseTime = state.inhaleDuration / 1000;
                if (timer) {
                    timer.textContent = Math.ceil(state.currentPhaseTime).toString();
                }
                state.phaseTimer = setInterval(() => {
                    if (!state.isRunning) {
                        clearInterval(state.phaseTimer);
                        return;
                    }
                    state.currentPhaseTime -= 0.1;
                    if (timer) {
                        const displayTime = Math.max(0, Math.ceil(state.currentPhaseTime));
                        timer.textContent = displayTime.toString();
                    }
                    if (state.currentPhaseTime <= 0) {
                        clearInterval(state.phaseTimer);
                    }
                }, 100);

                // Scale up circle smoothly
                circle.style.transition = `transform ${state.inhaleDuration}ms ease-in-out`;
                circle.style.transform = 'scale(1.5)';

                // Move to hold phase
                const inhaleTimeout2 = setTimeout(() => {
                    if (state.isRunning) {
                        state.phase = 'hold';
                        this.runBreathingCycle();
                    }
                }, state.inhaleDuration);
                state.timeouts.push(inhaleTimeout2);
                break;

            case 'hold':
                // Update instruction with fade
                instruction.style.opacity = '0';
                const holdTimeout1 = setTimeout(() => {
                    instruction.textContent = 'Hold';
                    instruction.style.opacity = '1';
                }, 200);
                state.timeouts.push(holdTimeout1);

                // Start phase timer
                state.currentPhaseTime = state.holdDuration / 1000;
                state.phaseTimer = setInterval(() => {
                    if (!state.isRunning) {
                        clearInterval(state.phaseTimer);
                        return;
                    }
                    state.currentPhaseTime--;
                    if (timer) {
                        timer.textContent = Math.ceil(state.currentPhaseTime).toString();
                    }
                    if (state.currentPhaseTime <= 0) {
                        clearInterval(state.phaseTimer);
                    }
                }, 100);

                // Keep circle at scale 1.5
                // Move to exhale phase
                const holdTimeout2 = setTimeout(() => {
                    if (state.isRunning) {
                        state.phase = 'exhale';
                        this.runBreathingCycle();
                    }
                }, state.holdDuration);
                state.timeouts.push(holdTimeout2);
                break;

            case 'exhale':
                // Update instruction with fade
                instruction.style.opacity = '0';
                const exhaleTimeout1 = setTimeout(() => {
                    instruction.textContent = 'Exhale';
                    instruction.style.opacity = '1';
                }, 200);
                state.timeouts.push(exhaleTimeout1);

                // Start phase timer
                state.currentPhaseTime = state.exhaleDuration / 1000;
                state.phaseTimer = setInterval(() => {
                    if (!state.isRunning) {
                        clearInterval(state.phaseTimer);
                        return;
                    }
                    state.currentPhaseTime--;
                    if (timer) {
                        timer.textContent = Math.ceil(state.currentPhaseTime).toString();
                    }
                    if (state.currentPhaseTime <= 0) {
                        clearInterval(state.phaseTimer);
                    }
                }, 100);

                // Scale down circle smoothly
                circle.style.transition = `transform ${state.exhaleDuration}ms ease-in-out`;
                circle.style.transform = 'scale(1)';

                // Move back to inhale phase
                const exhaleTimeout2 = setTimeout(() => {
                    if (state.isRunning) {
                        state.phase = 'inhale';
                        this.runBreathingCycle();
                    }
                }, state.exhaleDuration);
                state.timeouts.push(exhaleTimeout2);
                break;
        }
    }

    stopBreathingExercise() {
        const circle = document.getElementById('breathing-circle');
        const instruction = document.getElementById('breathing-instruction');
        const timer = document.getElementById('breathing-timer');
        const startBtn = document.getElementById('breathing-start-btn');

        // Stop all breathing state immediately
        if (this.breathingState) {
            this.breathingState.isRunning = false;
            
            // Clear all timeouts
            this.breathingState.timeouts.forEach(timeout => clearTimeout(timeout));
            this.breathingState.timeouts = [];
            
            // Clear phase timer
            if (this.breathingState.phaseTimer) {
                clearInterval(this.breathingState.phaseTimer);
                this.breathingState.phaseTimer = null;
            }
            
            this.breathingState = null;
        }

        // Instantly reset circle
        if (circle) {
            circle.style.transition = 'transform 0.3s ease-in-out';
            circle.style.transform = 'scale(1)';
        }

        // Reset instruction
        if (instruction) {
            instruction.style.opacity = '0';
            setTimeout(() => {
                instruction.textContent = 'Breathe';
                instruction.style.opacity = '1';
            }, 200);
        }

        // Reset timer
        if (timer) {
            timer.textContent = '0:00';
        }

        // Reset button
        if (startBtn) {
            startBtn.textContent = 'Start Breathing';
            startBtn.onclick = () => this.startBreathingExercise();
        }
    }

    // ========================================
    // JOURNAL FUNCTIONALITY
    // ========================================

    initializeJournal() {
        const saveBtn = document.getElementById('save-journal-btn');
        const clearBtn = document.getElementById('clear-journal-btn');

        if (saveBtn) saveBtn.addEventListener('click', () => this.saveJournalEntry());
        if (clearBtn) clearBtn.addEventListener('click', () => this.clearJournalEntry());

        this.loadJournalEntries();
    }

    async saveJournalEntry() {
        const entryInput = document.getElementById('journal-entry');
        if (!entryInput || !entryInput.value.trim()) return;

        const content = entryInput.value.trim();

        try {
            const response = await fetch('/api/journal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content: content })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.status === 'success') {
                entryInput.value = '';
                this.loadJournalEntries();
                this.showNotification('Journal entry saved!', 'success');
            } else {
                throw new Error('Failed to save journal entry');
            }
        } catch (error) {
            console.error('Error saving journal entry:', error);
            this.showNotification('Failed to save journal entry. Please try again.', 'error');
        }
    }

    clearJournalEntry() {
        const entryInput = document.getElementById('journal-entry');
        if (entryInput) entryInput.value = '';
    }

    async loadJournalEntries() {
        try {
            const response = await fetch('/api/journal');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const entries = await response.json();
            this.displayJournalEntries(entries);
        } catch (error) {
            console.error('Error loading journal entries:', error);
            this.displayJournalEntries([]);
            this.showNotification('Failed to load journal entries.', 'error');
        }
    }

    displayJournalEntries(entries) {
        const list = document.getElementById('journal-list');
        if (!list) return;

        if (!entries || entries.length === 0) {
            list.innerHTML = '<div class="no-entries">No journal entries yet. Start writing!</div>';
            return;
        }

        list.innerHTML = '';
        entries.slice(0, 10).forEach(entry => {
            const entryDiv = document.createElement('div');
            entryDiv.className = 'journal-entry-item';
            entryDiv.id = `journal-entry-${entry.id}`;
            const date = new Date(entry.created_at).toLocaleDateString();

            entryDiv.innerHTML = `
                <div class="journal-entry-date">${date}</div>
                <div class="journal-entry-content">${this.escapeHtml(entry.content)}</div>
                <div class="journal-entry-actions">
                    <button onclick="app.deleteJournalEntry(${entry.id})" class="btn-delete">Delete</button>
                </div>
            `;

            list.appendChild(entryDiv);
        });
    }

    async deleteJournalEntry(id) {
        if (!confirm('Are you sure you want to delete this journal entry?')) {
            return;
        }

        try {
            const response = await fetch(`/api/journal/delete/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.status === 'success') {
                // Remove the entry from the DOM
                const entryDiv = document.getElementById(`journal-entry-${id}`);
                if (entryDiv) {
                    entryDiv.remove();
                }
                this.loadJournalEntries(); // Refresh the list
                this.showNotification('Journal entry deleted!', 'success');
            } else {
                throw new Error('Failed to delete journal entry');
            }
        } catch (error) {
            console.error('Error deleting journal entry:', error);
            this.showNotification('Failed to delete journal entry. Please try again.', 'error');
        }
    }

    // ========================================
    // AFFIRMATIONS & GRATITUDE
    // ========================================

    initializeAffirmations() {
        const newBtn = document.getElementById('new-affirmation-btn');
        if (newBtn) newBtn.addEventListener('click', () => this.showNewAffirmation());
    }

    showNewAffirmation() {
        const affirmations = [
            "I am worthy of peace and happiness in my life.",
            "I am strong and capable of overcoming challenges.",
            "I deserve to be treated with kindness and respect.",
            "I am grateful for my body and all it does for me.",
            "I choose to focus on what brings me joy.",
            "I am enough, just as I am right now.",
            "I trust myself to make the right decisions.",
            "I am surrounded by love and support.",
            "I choose to let go of what I cannot control.",
            "I am proud of my progress and growth."
        ];

        const randomAffirmation = affirmations[Math.floor(Math.random() * affirmations.length)];
        document.getElementById('current-affirmation').textContent = randomAffirmation;
    }

    initializeGratitude() {
        const saveBtn = document.getElementById('save-gratitude-btn');
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveGratitude());
    }

    saveGratitude() {
        const entryInput = document.getElementById('gratitude-entry');
        if (!entryInput || !entryInput.value.trim()) return;

        const entry = {
            content: entryInput.value.trim(),
            date: new Date().toISOString()
        };

        const entries = JSON.parse(localStorage.getItem('orbitwell_gratitude') || '[]');
        entries.unshift(entry);
        localStorage.setItem('orbitwell_gratitude', JSON.stringify(entries));

        entryInput.value = '';
        this.showNotification('Gratitude saved! Keep focusing on the positive.', 'success');
    }

    // ========================================
    // MINI GAMES
    // ========================================

    startGame(gameType) {
        const modal = document.getElementById('game-modal');
        const content = document.getElementById('game-content');

        if (!modal || !content) return;

        modal.style.display = 'flex';
        document.getElementById('game-title').textContent = this.getGameTitle(gameType);
        this.initializeGame(gameType, content);
    }

    closeGame() {
        const modal = document.getElementById('game-modal');
        if (modal) modal.style.display = 'none';
    }

    getGameTitle(gameType) {
        const titles = {
            memory: '🧠 Memory Match',
            rps: '✂️ Rock Paper Scissors',
            reaction: '⚡ Reaction Speed Test',
            number: '🔢 Number Guessing Game',
            trivia: '🌌 Space Trivia Quiz'
        };
        return titles[gameType] || 'Game';
    }

    initializeGame(gameType, content) {
        switch (gameType) {
            case 'memory':
                this.initMemoryGame(content);
                break;
            case 'rps':
                this.initRPSGame(content);
                break;
            case 'reaction':
                this.initReactionGame(content);
                break;
            case 'number':
                this.initNumberGame(content);
                break;
            case 'trivia':
                this.initTriviaGame(content);
                break;
        }
    }

    initMemoryGame(content) {
        // Create game state object
        const gameState = {
            emojis: ['🌟', '🚀', '🪐', '🌙', '⭐', '☄️', '🛰️', '👨‍🚀'],
            cards: [],
            flippedCards: [],
            matchedPairs: 0,
            canFlip: true,
            moves: 0,
            startTime: null,
            timerInterval: null,
            elapsedTime: 0
        };

        // Initialize cards
        gameState.cards = [...gameState.emojis, ...gameState.emojis];

        // Shuffle cards
        for (let i = gameState.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [gameState.cards[i], gameState.cards[j]] = [gameState.cards[j], gameState.cards[i]];
        }

        // Store game state on content element
        content.gameState = gameState;

        content.innerHTML = `
            <div class="memory-stats">
                <div class="stat-item">
                    <span class="stat-label">Moves:</span>
                    <span class="stat-value" id="memory-moves">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Time:</span>
                    <span class="stat-value" id="memory-timer">0:00</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Pairs:</span>
                    <span class="stat-value" id="memory-pairs">0/8</span>
                </div>
            </div>
            <div class="memory-grid" id="memory-grid"></div>
            <div class="memory-status" id="memory-status">Click cards to flip them and find matching pairs!</div>
            <div id="memory-win-screen" class="memory-win-screen" style="display: none;">
                <div class="win-content">
                    <h2>🎉 Congratulations!</h2>
                    <p>You found all pairs!</p>
                    <div class="win-stats">
                        <div class="win-stat">
                            <span class="win-stat-label">Time:</span>
                            <span class="win-stat-value" id="win-time">0:00</span>
                        </div>
                        <div class="win-stat">
                            <span class="win-stat-label">Moves:</span>
                            <span class="win-stat-value" id="win-moves">0</span>
                        </div>
                    </div>
                    <button class="cosmic-btn" onclick="app.restartMemoryGame()">Play Again</button>
                </div>
            </div>
        `;

        const grid = document.getElementById('memory-grid');
        gameState.cards.forEach((emoji, index) => {
            const card = document.createElement('div');
            card.className = 'memory-card';
            card.dataset.emoji = emoji;
            card.dataset.index = index;
            
            // Create card inner structure for 3D flip
            const cardInner = document.createElement('div');
            cardInner.className = 'memory-card-inner';
            
            const cardFront = document.createElement('div');
            cardFront.className = 'memory-card-front';
            cardFront.innerHTML = '<span class="card-icon">?</span>';
            
            const cardBack = document.createElement('div');
            cardBack.className = 'memory-card-back';
            cardBack.textContent = emoji;
            
            cardInner.appendChild(cardFront);
            cardInner.appendChild(cardBack);
            card.appendChild(cardInner);
            
            card.addEventListener('click', () => this.flipMemoryCard(card, index));
            grid.appendChild(card);
        });

        // Start timer
        gameState.startTime = Date.now();
        this.startMemoryTimer(content);
    }

    startMemoryTimer(content) {
        const gameState = content.gameState;
        gameState.timerInterval = setInterval(() => {
            gameState.elapsedTime = Math.floor((Date.now() - gameState.startTime) / 1000);
            const minutes = Math.floor(gameState.elapsedTime / 60);
            const seconds = gameState.elapsedTime % 60;
            document.getElementById('memory-timer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }, 100);
    }

    stopMemoryTimer(content) {
        const gameState = content.gameState;
        if (gameState.timerInterval) {
            clearInterval(gameState.timerInterval);
            gameState.timerInterval = null;
        }
    }

    flipMemoryCard(card, index) {
        const content = document.getElementById('game-content');
        const gameState = content.gameState;

        if (!gameState.canFlip || card.classList.contains('flipped') || card.classList.contains('matched')) {
            return;
        }

        // Flip the card
        card.classList.add('flipped');
        gameState.flippedCards.push({ card, index });
        gameState.moves++;
        document.getElementById('memory-moves').textContent = gameState.moves;

        if (gameState.flippedCards.length === 2) {
            gameState.canFlip = false;
            setTimeout(() => this.checkMemoryMatch(content), 1000);
        }
    }

    checkMemoryMatch(content) {
        const gameState = content.gameState;
        const [card1, card2] = gameState.flippedCards;

        if (card1.card.dataset.emoji === card2.card.dataset.emoji) {
            // Match found
            card1.card.classList.add('matched');
            card2.card.classList.add('matched');
            gameState.matchedPairs++;
            document.getElementById('memory-pairs').textContent = `${gameState.matchedPairs}/8`;

            if (gameState.matchedPairs === 8) {
                // Game won
                this.stopMemoryTimer(content);
                this.showMemoryWinScreen(content);
            } else {
                document.getElementById('memory-status').textContent = 'Great match! Keep going!';
            }
        } else {
            // No match - flip back
            card1.card.classList.remove('flipped');
            card2.card.classList.remove('flipped');
            document.getElementById('memory-status').textContent = 'Not a match. Try again!';
        }

        gameState.flippedCards.length = 0;
        gameState.canFlip = true;
    }

    showMemoryWinScreen(content) {
        const gameState = content.gameState;
        const minutes = Math.floor(gameState.elapsedTime / 60);
        const seconds = gameState.elapsedTime % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        document.getElementById('win-time').textContent = timeString;
        document.getElementById('win-moves').textContent = gameState.moves;
        document.getElementById('memory-win-screen').style.display = 'flex';
        document.getElementById('memory-status').textContent = '🎉 You won!';
    }

    restartMemoryGame() {
        const content = document.getElementById('game-content');
        if (content && content.gameState) {
            this.stopMemoryTimer(content);
        }
        this.initMemoryGame(content);
    }

    initRPSGame(content) {
        // Create game state object
        const gameState = {
            playerScore: 0,
            computerScore: 0
        };

        content.innerHTML = `
            <div class="rps-choices">
                <div class="rps-choice" data-choice="rock">🪨</div>
                <div class="rps-choice" data-choice="paper">📄</div>
                <div class="rps-choice" data-choice="scissors">✂️</div>
            </div>
            <div class="rps-result">
                <h4>Make your choice!</h4>
                <p id="game-result"></p>
            </div>
            <div class="rps-score">
                <div class="score-item">
                    <div class="score-number" id="player-score">0</div>
                    <div>You</div>
                </div>
                <div class="score-item">
                    <div class="score-number" id="computer-score">0</div>
                    <div>Computer</div>
                </div>
            </div>
        `;

        const choices = document.querySelectorAll('.rps-choice');
        const resultEl = document.getElementById('game-result');

        choices.forEach(choice => {
            choice.addEventListener('click', () => this.makeRPSChoice(choice.dataset.choice, resultEl, gameState));
        });
    }

    makeRPSChoice(playerChoice, resultEl, gameState) {
        const choices = ['rock', 'paper', 'scissors'];
        const computerChoice = choices[Math.floor(Math.random() * 3)];

        // Remove previous selection
        document.querySelectorAll('.rps-choice').forEach(c => c.classList.remove('selected'));
        document.querySelector(`[data-choice="${playerChoice}"]`).classList.add('selected');

        const result = this.getWinner(playerChoice, computerChoice);
        this.updateRPSScore(result, gameState);

        const emojis = { rock: '🪨', paper: '📄', scissors: '✂️' };
        resultEl.innerHTML = `You chose ${emojis[playerChoice]} • Computer chose ${emojis[computerChoice]}<br><strong>${result.message}</strong>`;
    }

    getWinner(player, computer) {
        if (player === computer) {
            return { winner: 'tie', message: "It's a tie!" };
        }
        const winConditions = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
        if (winConditions[player] === computer) {
            return { winner: 'player', message: 'You win!' };
        } else {
            return { winner: 'computer', message: 'Computer wins!' };
        }
    }

    updateRPSScore(result, gameState) {
        if (result.winner === 'player') {
            gameState.playerScore++;
            document.getElementById('player-score').textContent = gameState.playerScore;
        } else if (result.winner === 'computer') {
            gameState.computerScore++;
            document.getElementById('computer-score').textContent = gameState.computerScore;
        }
    }

    initReactionGame(content) {
        // Create game state object
        const gameState = {
            startTime: null,
            timeout: null,
            reactionTimes: [],
            currentState: 'waiting'
        };

        content.innerHTML = `
            <div class="reaction-area" id="reaction-area">
                <div id="reaction-text">Click to start the test!</div>
            </div>
            <div class="reaction-stats">
                <div class="reaction-stat">
                    <div class="stat-label">Average</div>
                    <div class="stat-value" id="avg-reaction">0ms</div>
                </div>
                <div class="reaction-stat">
                    <div class="stat-label">Best</div>
                    <div class="stat-value" id="best-reaction">0ms</div>
                </div>
                <div class="reaction-stat">
                    <div class="stat-label">Attempts</div>
                    <div class="stat-value" id="attempts">0</div>
                </div>
            </div>
        `;

        const area = document.getElementById('reaction-area');
        const text = document.getElementById('reaction-text');

        area.addEventListener('click', () => this.handleReactionClick(area, text, gameState));
    }

    handleReactionClick(area, text, gameState) {
        if (gameState.currentState === 'waiting') {
            this.startReactionWaitingPhase(area, text, gameState);
        } else if (gameState.currentState === 'ready') {
            this.reactionTooEarly(area, text, gameState);
        } else if (gameState.currentState === 'go') {
            this.recordReaction(area, text, gameState);
        }
    }

    startReactionWaitingPhase(area, text, gameState) {
        gameState.currentState = 'ready';
        area.className = 'reaction-area ready';
        text.textContent = 'Wait for green...';
        const delay = 2000 + Math.random() * 3000; // 2-5 seconds
        gameState.timeout = setTimeout(() => this.startReactionGoPhase(area, text, gameState), delay);
    }

    startReactionGoPhase(area, text, gameState) {
        gameState.currentState = 'go';
        gameState.startTime = Date.now();
        area.className = 'reaction-area go';
        text.textContent = 'CLICK NOW!';
    }

    reactionTooEarly(area, text, gameState) {
        clearTimeout(gameState.timeout);
        gameState.currentState = 'waiting';
        area.className = 'reaction-area clicked';
        text.textContent = 'Too early! Click to try again.';
        setTimeout(() => {
            area.className = 'reaction-area';
            text.textContent = 'Click to start the test!';
        }, 1500);
    }

    recordReaction(area, text, gameState) {
        const reactionTime = Date.now() - gameState.startTime;
        gameState.reactionTimes.push(reactionTime);
        gameState.currentState = 'waiting';
        area.className = 'reaction-area';
        text.textContent = `${reactionTime}ms - Click to try again!`;
        this.updateReactionStats(gameState.reactionTimes);
    }

    updateReactionStats(reactionTimes) {
        const avg = reactionTimes.length > 0 ? Math.round(reactionTimes.reduce((a, b) => a + b) / reactionTimes.length) : 0;
        const best = reactionTimes.length > 0 ? Math.min(...reactionTimes) : 0;
        document.getElementById('avg-reaction').textContent = `${avg}ms`;
        document.getElementById('best-reaction').textContent = `${best}ms`;
        document.getElementById('attempts').textContent = reactionTimes.length;
    }

    initNumberGame(content) {
        // Create game state object
        const gameState = {
            secretNumber: Math.floor(Math.random() * 100) + 1,
            attempts: 0,
            gameWon: false
        };

        content.innerHTML = `
            <div style="text-align: center;">
                <h4>I'm thinking of a number between 1 and 100...</h4>
                <p>Can you guess what it is?</p>
                <div class="guess-input">
                    <input type="number" id="guess-input" min="1" max="100" placeholder="Enter guess">
                    <button onclick="app.makeNumberGuess()">Guess</button>
                </div>
                <div class="guess-feedback" id="guess-feedback"></div>
                <div class="guess-attempts" id="guess-attempts">Attempts: 0</div>
            </div>
        `;

        // Allow Enter key to submit
        document.getElementById('guess-input').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                app.makeNumberGuess();
            }
        });

        // Store game state for the guess function
        content.gameState = gameState;
    }

    makeNumberGuess() {
        const content = document.getElementById('game-content');
        if (!content || !content.gameState) return;

        const gameState = content.gameState;
        if (gameState.gameWon) return;

        const input = document.getElementById('guess-input');
        const guess = parseInt(input.value);
        const feedback = document.getElementById('guess-feedback');

        if (isNaN(guess) || guess < 1 || guess > 100) {
            feedback.textContent = 'Please enter a number between 1 and 100!';
            feedback.style.color = '#F44336';
            return;
        }

        gameState.attempts++;
        document.getElementById('guess-attempts').textContent = `Attempts: ${gameState.attempts}`;

        if (guess === gameState.secretNumber) {
            gameState.gameWon = true;
            feedback.textContent = `🎉 Congratulations! You guessed ${gameState.secretNumber} in ${gameState.attempts} attempts!`;
            feedback.style.color = '#4CAF50';
            setTimeout(() => {
                if (confirm('Play again?')) {
                    this.initNumberGame(document.getElementById('game-content'));
                }
            }, 2000);
        } else if (guess < gameState.secretNumber) {
            feedback.textContent = 'Too low! Try a higher number.';
            feedback.style.color = '#FFC107';
        } else {
            feedback.textContent = 'Too high! Try a lower number.';
            feedback.style.color = '#FFC107';
        }

        input.value = '';
        input.focus();
    }

    initTriviaGame(content) {
        // Create game state object
        const gameState = {
            questions: [
                { question: "Which planet in our solar system has the most moons?", options: ["Jupiter", "Saturn", "Uranus", "Neptune"], correct: 1, fact: "Saturn has 82 known moons, more than any other planet in our solar system!" },
                { question: "What is the closest star to our solar system?", options: ["Sirius", "Vega", "Proxima Centauri", "Betelgeuse"], correct: 2, fact: "Proxima Centauri is only 4.24 light-years away from Earth!" },
                { question: "Which planet is known as the 'Red Planet'?", options: ["Venus", "Mars", "Jupiter", "Mercury"], correct: 1, fact: "Mars appears red due to iron oxide (rust) on its surface." },
                { question: "What is the largest planet in our solar system?", options: ["Saturn", "Neptune", "Jupiter", "Uranus"], correct: 2, fact: "Jupiter is so large that all other planets could fit inside it!" },
                { question: "Which galaxy is Earth located in?", options: ["Andromeda", "Milky Way", "Triangulum", "Sombrero"], correct: 1, fact: "The Milky Way contains 100-400 billion stars and is 100,000 light-years across!" },
                { question: "What causes a solar eclipse?", options: ["Earth blocking the Sun", "Moon blocking the Sun", "Venus blocking the Sun", "Mars blocking the Sun"], correct: 1, fact: "A solar eclipse occurs when the Moon passes between Earth and the Sun." },
                { question: "Which planet rotates on its side?", options: ["Venus", "Mars", "Uranus", "Pluto"], correct: 2, fact: "Uranus has a 98-degree axial tilt, making it appear to roll around the Sun!" },
                { question: "What is the hottest planet in our solar system?", options: ["Mercury", "Venus", "Mars", "Earth"], correct: 1, fact: "Venus has surface temperatures of 900°F (475°C) due to its thick atmosphere!" },
                { question: "Which planet has a day longer than its year?", options: ["Mercury", "Venus", "Mars", "Jupiter"], correct: 1, fact: "Venus takes 243 Earth days to rotate once, but only 225 days to orbit the Sun!" },
                { question: "What is the name of the first artificial satellite?", options: ["Hubble", "Voyager", "Sputnik", "Apollo"], correct: 2, fact: "Sputnik 1 was launched by the Soviet Union on October 4, 1957, starting the Space Age!" }
            ],
            currentQuestion: 0,
            score: 0
        };

        // Shuffle questions
        for (let i = gameState.questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [gameState.questions[i], gameState.questions[j]] = [gameState.questions[j], gameState.questions[i]];
        }

        // Store game state for other methods
        content.gameState = gameState;

        this.showTriviaQuestion(content);
    }

    showTriviaQuestion(content) {
        const gameState = content.gameState;
        if (gameState.currentQuestion >= gameState.questions.length) {
            this.showTriviaFinalScore(content);
            return;
        }

        const question = gameState.questions[gameState.currentQuestion];
        content.innerHTML = `
            <div class="quiz-progress">Question ${gameState.currentQuestion + 1} of ${gameState.questions.length}</div>
            <div class="trivia-question">
                <h4>${question.question}</h4>
                <div class="trivia-options" id="trivia-options"></div>
            </div>
            <div class="trivia-score">
                <h4>Score: ${gameState.score}/${gameState.currentQuestion}</h4>
            </div>
        `;

        const optionsContainer = document.getElementById('trivia-options');
        question.options.forEach((option, index) => {
            const optionEl = document.createElement('div');
            optionEl.className = 'trivia-option';
            optionEl.textContent = option;
            optionEl.addEventListener('click', () => this.selectTriviaAnswer(optionEl, index, content));
            optionsContainer.appendChild(optionEl);
        });
    }

    selectTriviaAnswer(optionEl, selectedIndex, content) {
        const gameState = content.gameState;
        const question = gameState.questions[gameState.currentQuestion];
        const options = document.querySelectorAll('.trivia-option');

        // Disable all options
        options.forEach(option => option.style.pointerEvents = 'none');

        // Show correct/incorrect
        if (selectedIndex === question.correct) {
            optionEl.classList.add('correct');
            gameState.score++;
        } else {
            optionEl.classList.add('incorrect');
            options[question.correct].classList.add('correct');
        }

        // Show fact after a delay
        setTimeout(() => {
            this.showTriviaFact(content);
        }, 1500);
    }

    showTriviaFact(content) {
        const gameState = content.gameState;
        const question = gameState.questions[gameState.currentQuestion];

        content.innerHTML = `
            <div class="trivia-question">
                <h4>Did you know?</h4>
                <p style="color: var(--text-secondary); margin: 1rem 0; line-height: 1.5;">${question.fact}</p>
                <button class="btn btn-primary" onclick="app.nextTriviaQuestion()">Next Question</button>
            </div>
        `;
    }

    nextTriviaQuestion() {
        const content = document.getElementById('game-content');
        const gameState = content.gameState;
        gameState.currentQuestion++;
        this.showTriviaQuestion(content);
    }

    showTriviaFinalScore(content) {
        const gameState = content.gameState;
        const percentage = Math.round((gameState.score / gameState.questions.length) * 100);
        let message = '';

        if (percentage >= 90) {
            message = '🌟 Outstanding! You\'re a space expert!';
        } else if (percentage >= 70) {
            message = '🚀 Great job! You know your cosmos!';
        } else if (percentage >= 50) {
            message = '⭐ Not bad! Keep learning about space!';
        } else {
            message = '🌙 Keep exploring! Space knowledge takes time!';
        }

        content.innerHTML = `
            <div class="trivia-question">
                <h4>Quiz Complete!</h4>
                <div class="trivia-score" style="margin: 2rem 0;">
                    <h3 style="color: var(--primary-glow); margin-bottom: 0.5rem;">${gameState.score}/${gameState.questions.length}</h3>
                    <p style="color: var(--text-secondary); font-size: 1.1rem;">${percentage}% Correct</p>
                    <p style="color: var(--text-primary); margin-top: 1rem;">${message}</p>
                </div>
                <button class="btn btn-primary" onclick="app.initTriviaGame(document.getElementById('game-content'))" style="margin-right: 1rem;">Play Again</button>
                <button class="btn btn-secondary" onclick="app.closeGame()">Close Quiz</button>
            </div>
        `;
    }


    // ========================================
    // UTILITY FUNCTIONS
    // ========================================

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${this.escapeHtml(message)}</span>
            </div>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 10);

        // Auto-remove after 4 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// ========================================
// NOTIFICATION STYLES
// ========================================

const notificationStyles = `
.notification {
    position: fixed;
    top: 100px;
    right: 20px;
    z-index: 10000;
    min-width: 300px;
    max-width: 500px;
    padding: 0;
    background: var(--glass-bg-primary);
    backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border-primary);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-xl), var(--glow-primary);
    transform: translateX(100%);
    opacity: 0;
    transition: all 0.3s ease;
}

.notification.show {
    transform: translateX(0);
    opacity: 1;
}

.notification-content {
    padding: var(--space-lg);
    display: flex;
    align-items: center;
    gap: var(--space-md);
}

.notification-message {
    flex: 1;
    color: var(--text-secondary);
    font-size: var(--font-size-base);
    line-height: 1.4;
}

.notification-success {
    border-color: var(--glass-border-primary);
    box-shadow: var(--shadow-xl), var(--glow-success);
}

.notification-error {
    border-color: var(--glass-border-primary);
    box-shadow: var(--shadow-xl), var(--glow-accent);
}

.notification-warning {
    border-color: var(--glass-border-primary);
    box-shadow: var(--shadow-xl), var(--glow-warning);
}

.notification-info {
    border-color: var(--glass-border-primary);
    box-shadow: var(--shadow-xl), var(--glow-primary);
}

.typing-dots {
    display: flex;
    gap: 4px;
    align-items: center;
    padding: 8px 0;
}

.typing-dots span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--primary-glow);
    animation: typing 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(2) {
    animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
    animation-delay: 0.4s;
}

.typing-cursor {
    display: inline-block;
    color: var(--primary-glow);
    font-weight: bold;
    animation: blink 1s infinite;
    margin-left: 2px;
}

@keyframes typing {
    0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
    40% { transform: scale(1); opacity: 1; }
}

@keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
}

@keyframes message-complete {
    0% { transform: scale(1); }
    50% { transform: scale(1.02); }
    100% { transform: scale(1); }
}
`;

// Add notification styles to head
const styleElement = document.createElement('style');
styleElement.textContent = notificationStyles;
document.head.appendChild(styleElement);

// ========================================
// GLOBAL APP INSTANCE
// ========================================

const app = new OrbitWellApp();

// Export functions for global access (for inline onclick handlers)
window.app = app;

window.loadReminders = () => app.loadReminders();
window.addReminder = (title, description, datetime) => app.addReminder(title, description, datetime);
window.toggleReminder = (id, completed) => app.toggleReminder(id, completed);
window.deleteReminder = (id) => app.deleteReminder(id);
window.markReminderComplete = (id) => app.markReminderComplete(id);
window.completeReminder = (id) => app.completeReminder(id);
window.loadRemindersUI = () => app.loadRemindersUI();

window.simulateOxygen = () => app.simulateOxygen();
window.closeFactCard = () => app.closeFactCard();
window.showNotification = (message, type) => app.showNotification(message, type);

window.startGame = (gameType) => app.startGame(gameType);
window.closeGame = () => app.closeGame();
window.startMeditation = (type) => app.startMeditation(type);
window.stopMeditation = () => app.stopMeditation();