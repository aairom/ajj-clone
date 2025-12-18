// Admin Dashboard JavaScript

// Check authentication
if (!sessionStorage.getItem('adminLoggedIn')) {
    window.location.href = 'login.html';
}

// Logout handler
document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    sessionStorage.removeItem('adminLoggedIn');
    sessionStorage.removeItem('adminUsername');
    window.location.href = 'login.html';
});

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all tabs
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked tab
        btn.classList.add('active');
        const tabId = btn.dataset.tab + 'Tab';
        document.getElementById(tabId).classList.add('active');
    });
});

// Message functions
function showMessage(message, type = 'success') {
    const messageEl = document.getElementById(type === 'success' ? 'successMessage' : 'errorMessage');
    messageEl.textContent = message;
    messageEl.classList.add('show');
    
    setTimeout(() => {
        messageEl.classList.remove('show');
    }, 3000);
}

// Format date for display
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
}

// ==================== NEWS MANAGEMENT ====================

let editingNewsId = null;

// Load news into table
function loadNewsTable() {
    const news = JSON.parse(localStorage.getItem('news') || '[]');
    const tbody = document.getElementById('newsTableBody');
    
    if (news.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #999;">Aucune actualité</td></tr>';
        return;
    }
    
    // Sort by date (newest first)
    news.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    tbody.innerHTML = news.map(item => `
        <tr>
            <td>${formatDate(item.date)}</td>
            <td><strong>${item.title}</strong></td>
            <td>${item.content.substring(0, 100)}${item.content.length > 100 ? '...' : ''}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-small btn-edit" onclick="editNews(${item.id})">
                        <i class="fas fa-edit"></i> Modifier
                    </button>
                    <button class="btn btn-small btn-delete" onclick="deleteNews(${item.id})">
                        <i class="fas fa-trash"></i> Supprimer
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// News form submit
document.getElementById('newsForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const newsData = {
        id: editingNewsId || Date.now(),
        title: formData.get('title'),
        content: formData.get('content'),
        date: formData.get('date'),
        image: formData.get('image') || ''
    };
    
    let news = JSON.parse(localStorage.getItem('news') || '[]');
    
    if (editingNewsId) {
        // Update existing news
        news = news.map(item => item.id === editingNewsId ? newsData : item);
        showMessage('Actualité mise à jour avec succès');
    } else {
        // Add new news
        news.push(newsData);
        showMessage('Actualité publiée avec succès');
    }
    
    localStorage.setItem('news', JSON.stringify(news));
    
    // Reset form
    e.target.reset();
    editingNewsId = null;
    document.getElementById('newsSubmitText').textContent = 'Publier';
    document.getElementById('cancelNewsBtn').style.display = 'none';
    
    // Reload table
    loadNewsTable();
});

// Edit news
function editNews(id) {
    const news = JSON.parse(localStorage.getItem('news') || '[]');
    const item = news.find(n => n.id === id);
    
    if (item) {
        editingNewsId = id;
        document.getElementById('newsTitle').value = item.title;
        document.getElementById('newsContent').value = item.content;
        document.getElementById('newsDate').value = item.date;
        document.getElementById('newsImage').value = item.image || '';
        document.getElementById('newsSubmitText').textContent = 'Mettre à jour';
        document.getElementById('cancelNewsBtn').style.display = 'inline-block';
        
        // Scroll to form
        document.getElementById('newsForm').scrollIntoView({ behavior: 'smooth' });
    }
}

// Cancel news edit
document.getElementById('cancelNewsBtn').addEventListener('click', () => {
    editingNewsId = null;
    document.getElementById('newsForm').reset();
    document.getElementById('newsSubmitText').textContent = 'Publier';
    document.getElementById('cancelNewsBtn').style.display = 'none';
});

// Delete news
function deleteNews(id) {
    showDeleteModal(() => {
        let news = JSON.parse(localStorage.getItem('news') || '[]');
        news = news.filter(item => item.id !== id);
        localStorage.setItem('news', JSON.stringify(news));
        loadNewsTable();
        showMessage('Actualité supprimée avec succès');
    });
}

// ==================== CALENDAR MANAGEMENT ====================

let editingEventId = null;

// Load calendar events into table
function loadCalendarTable() {
    const events = JSON.parse(localStorage.getItem('calendar') || '[]');
    const tbody = document.getElementById('calendarTableBody');
    
    if (events.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #999;">Aucun événement</td></tr>';
        return;
    }
    
    // Sort by date (nearest first)
    events.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    tbody.innerHTML = events.map(event => `
        <tr>
            <td>${formatDate(event.date)}</td>
            <td><strong>${event.title}</strong></td>
            <td>${event.description.substring(0, 100)}${event.description.length > 100 ? '...' : ''}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-small btn-edit" onclick="editEvent(${event.id})">
                        <i class="fas fa-edit"></i> Modifier
                    </button>
                    <button class="btn btn-small btn-delete" onclick="deleteEvent(${event.id})">
                        <i class="fas fa-trash"></i> Supprimer
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Calendar form submit
document.getElementById('calendarForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const eventData = {
        id: editingEventId || Date.now(),
        title: formData.get('title'),
        description: formData.get('description'),
        date: formData.get('date')
    };
    
    let events = JSON.parse(localStorage.getItem('calendar') || '[]');
    
    if (editingEventId) {
        // Update existing event
        events = events.map(item => item.id === editingEventId ? eventData : item);
        showMessage('Événement mis à jour avec succès');
    } else {
        // Add new event
        events.push(eventData);
        showMessage('Événement ajouté avec succès');
    }
    
    localStorage.setItem('calendar', JSON.stringify(events));
    
    // Reset form
    e.target.reset();
    editingEventId = null;
    document.getElementById('eventSubmitText').textContent = 'Ajouter';
    document.getElementById('cancelEventBtn').style.display = 'none';
    
    // Reload table
    loadCalendarTable();
});

// Edit event
function editEvent(id) {
    const events = JSON.parse(localStorage.getItem('calendar') || '[]');
    const event = events.find(e => e.id === id);
    
    if (event) {
        editingEventId = id;
        document.getElementById('eventTitle').value = event.title;
        document.getElementById('eventDescription').value = event.description;
        document.getElementById('eventDate').value = event.date;
        document.getElementById('eventSubmitText').textContent = 'Mettre à jour';
        document.getElementById('cancelEventBtn').style.display = 'inline-block';
        
        // Scroll to form
        document.getElementById('calendarForm').scrollIntoView({ behavior: 'smooth' });
    }
}

// Cancel event edit
document.getElementById('cancelEventBtn').addEventListener('click', () => {
    editingEventId = null;
    document.getElementById('calendarForm').reset();
    document.getElementById('eventSubmitText').textContent = 'Ajouter';
    document.getElementById('cancelEventBtn').style.display = 'none';
});

// Delete event
function deleteEvent(id) {
    showDeleteModal(() => {
        let events = JSON.parse(localStorage.getItem('calendar') || '[]');
        events = events.filter(item => item.id !== id);
        localStorage.setItem('calendar', JSON.stringify(events));
        loadCalendarTable();
        showMessage('Événement supprimé avec succès');
    });
}

// ==================== DELETE MODAL ====================

let deleteCallback = null;

function showDeleteModal(callback) {
    deleteCallback = callback;
    document.getElementById('deleteModal').classList.add('show');
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('show');
    deleteCallback = null;
}

document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
    if (deleteCallback) {
        deleteCallback();
    }
    closeDeleteModal();
});

// Close modal on outside click
document.getElementById('deleteModal').addEventListener('click', (e) => {
    if (e.target.id === 'deleteModal') {
        closeDeleteModal();
    }
});

// ==================== INITIALIZATION ====================

// Set today's date as default for forms
const today = new Date().toISOString().split('T')[0];
document.getElementById('newsDate').value = today;
document.getElementById('eventDate').value = today;

// Load initial data
loadNewsTable();
loadCalendarTable();

// Made with Bob
