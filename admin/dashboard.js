// Admin Dashboard JavaScript - Secure Backend Integration

const API_URL = 'http://localhost:3000/api';

// Check authentication
const authToken = localStorage.getItem('authToken');
if (!authToken) {
    window.location.href = 'login.html';
}

// Get auth headers
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
    };
}

// Verify token on page load
async function verifyAuth() {
    try {
        const response = await fetch(`${API_URL}/auth/verify`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Invalid token');
        }
    } catch (error) {
        console.error('Auth verification failed:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('adminUser');
        window.location.href = 'login.html';
    }
}

verifyAuth();

// Logout handler
document.getElementById('logoutBtn').addEventListener('click', async (e) => {
    e.preventDefault();
    
    try {
        await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        localStorage.removeItem('authToken');
        localStorage.removeItem('adminUser');
        window.location.href = 'login.html';
    }
});

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        const tabId = btn.dataset.tab + 'Tab';
        document.getElementById(tabId).classList.add('active');
        
        // Load images when Images tab is activated
        if (btn.dataset.tab === 'images') {
            loadImageGallery();
        }
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

// Initialize Quill editor for news content
const quill = new Quill('#newsEditor', {
    theme: 'snow',
    modules: {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'align': [] }],
            ['link', 'image'],
            ['clean']
        ]
    },
    placeholder: 'Rédigez votre actualité ici...'
});

// Sync Quill content with hidden input
quill.on('text-change', function() {
    const html = quill.root.innerHTML;
    document.getElementById('newsContent').value = html;
});

// Load news into table
async function loadNewsTable() {
    const tbody = document.getElementById('newsTableBody');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Chargement...</td></tr>';
    
    try {
        const response = await fetch(`${API_URL}/news`);
        const data = await response.json();
        
        if (!data.success || data.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #999;">Aucune actualité</td></tr>';
            return;
        }
        
        const news = data.data;
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
    } catch (error) {
        console.error('Load news error:', error);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #f44336;">Erreur de chargement</td></tr>';
    }
}

// News form submit
document.getElementById('newsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get content from Quill editor
    const content = quill.root.innerHTML;
    
    const formData = new FormData(e.target);
    const newsData = {
        title: formData.get('title'),
        content: content,
        date: formData.get('date'),
        image: formData.get('image') || ''
    };
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    
    try {
        const url = editingNewsId ? `${API_URL}/news/${editingNewsId}` : `${API_URL}/news`;
        const method = editingNewsId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: getAuthHeaders(),
            body: JSON.stringify(newsData)
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showMessage(data.message);
            e.target.reset();
            quill.setContents([]); // Clear Quill editor
            editingNewsId = null;
            document.getElementById('newsSubmitText').textContent = 'Publier';
            document.getElementById('cancelNewsBtn').style.display = 'none';
            loadNewsTable();
        } else {
            showMessage(data.error || 'Erreur lors de l\'enregistrement', 'error');
        }
    } catch (error) {
        console.error('Save news error:', error);
        showMessage('Erreur de connexion au serveur', 'error');
    } finally {
        submitBtn.disabled = false;
    }
});

// Edit news
async function editNews(id) {
    try {
        const response = await fetch(`${API_URL}/news/${id}`);
        const data = await response.json();
        
        if (data.success && data.data) {
            const item = data.data;
            editingNewsId = id;
            document.getElementById('newsTitle').value = item.title;
            
            // Set Quill editor content
            quill.root.innerHTML = item.content;
            document.getElementById('newsContent').value = item.content;
            
            document.getElementById('newsDate').value = item.date;
            document.getElementById('newsImage').value = item.image || '';
            document.getElementById('newsSubmitText').textContent = 'Mettre à jour';
            document.getElementById('cancelNewsBtn').style.display = 'inline-block';
            document.getElementById('newsForm').scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        console.error('Edit news error:', error);
        showMessage('Erreur lors du chargement', 'error');
    }
}

// Cancel news edit
document.getElementById('cancelNewsBtn').addEventListener('click', () => {
    editingNewsId = null;
    document.getElementById('newsForm').reset();
    quill.setContents([]); // Clear Quill editor
    document.getElementById('newsSubmitText').textContent = 'Publier';
    document.getElementById('cancelNewsBtn').style.display = 'none';
});

// Delete news
function deleteNews(id) {
    showDeleteModal(async () => {
        try {
            const response = await fetch(`${API_URL}/news/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                showMessage(data.message);
                loadNewsTable();
            } else {
                showMessage(data.error || 'Erreur lors de la suppression', 'error');
            }
        } catch (error) {
            console.error('Delete news error:', error);
            showMessage('Erreur de connexion au serveur', 'error');
        }
    });
}

// ==================== CALENDAR MANAGEMENT ====================

let editingEventId = null;

// Load calendar events into table
async function loadCalendarTable() {
    const tbody = document.getElementById('calendarTableBody');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Chargement...</td></tr>';
    
    try {
        const response = await fetch(`${API_URL}/calendar`);
        const data = await response.json();
        
        if (!data.success || data.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #999;">Aucun événement</td></tr>';
            return;
        }
        
        const events = data.data;
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
    } catch (error) {
        console.error('Load calendar error:', error);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #f44336;">Erreur de chargement</td></tr>';
    }
}

// Calendar form submit
document.getElementById('calendarForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const eventData = {
        title: formData.get('title'),
        description: formData.get('description'),
        date: formData.get('date')
    };
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    
    try {
        const url = editingEventId ? `${API_URL}/calendar/${editingEventId}` : `${API_URL}/calendar`;
        const method = editingEventId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: getAuthHeaders(),
            body: JSON.stringify(eventData)
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showMessage(data.message);
            e.target.reset();
            editingEventId = null;
            document.getElementById('eventSubmitText').textContent = 'Ajouter';
            document.getElementById('cancelEventBtn').style.display = 'none';
            loadCalendarTable();
        } else {
            showMessage(data.error || 'Erreur lors de l\'enregistrement', 'error');
        }
    } catch (error) {
        console.error('Save event error:', error);
        showMessage('Erreur de connexion au serveur', 'error');
    } finally {
        submitBtn.disabled = false;
    }
});

// Edit event
async function editEvent(id) {
    try {
        const response = await fetch(`${API_URL}/calendar/${id}`);
        const data = await response.json();
        
        if (data.success && data.data) {
            const event = data.data;
            editingEventId = id;
            document.getElementById('eventTitle').value = event.title;
            document.getElementById('eventDescription').value = event.description;
            document.getElementById('eventDate').value = event.date;
            document.getElementById('eventSubmitText').textContent = 'Mettre à jour';
            document.getElementById('cancelEventBtn').style.display = 'inline-block';
            document.getElementById('calendarForm').scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        console.error('Edit event error:', error);
        showMessage('Erreur lors du chargement', 'error');
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
    showDeleteModal(async () => {
        try {
            const response = await fetch(`${API_URL}/calendar/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                showMessage(data.message);
                loadCalendarTable();
            } else {
                showMessage(data.error || 'Erreur lors de la suppression', 'error');
            }
        } catch (error) {
            console.error('Delete event error:', error);
            showMessage('Erreur de connexion au serveur', 'error');
        }
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

document.getElementById('deleteModal').addEventListener('click', (e) => {
    if (e.target.id === 'deleteModal') {
        closeDeleteModal();
    }
});

// ==================== IMAGE MANAGEMENT ====================

// Load images into gallery
async function loadImageGallery(category = '') {
    const gallery = document.getElementById('imageGallery');
    gallery.innerHTML = '<div style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Chargement...</div>';
    
    try {
        const url = category ? `${API_URL}/images?category=${category}` : `${API_URL}/images`;
        const response = await fetch(url, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        if (!data.success || data.images.length === 0) {
            gallery.innerHTML = '<div style="text-align: center; padding: 2rem; color: #999;">Aucune image</div>';
            return;
        }
        
        gallery.innerHTML = data.images.map(img => `
            <div class="image-card" data-id="${img.id}">
                <div class="image-thumbnail">
                    <img src="${img.thumbnail_path}" alt="${img.alt_text || img.original_name}" loading="lazy">
                </div>
                <div class="image-info">
                    <div class="image-name" title="${img.original_name}">${img.original_name}</div>
                    <div class="image-meta">
                        <span class="image-category">${img.category}</span>
                        <span class="image-size">${formatFileSize(img.size)}</span>
                    </div>
                    <div class="image-actions">
                        <button class="btn btn-small" onclick="copyImageUrl('${img.path}')" title="Copier l'URL">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="btn btn-small" onclick="viewImage('${img.path}')" title="Voir">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-small btn-delete" onclick="deleteImage(${img.id})" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Load images error:', error);
        gallery.innerHTML = '<div style="text-align: center; padding: 2rem; color: #f44336;">Erreur de chargement</div>';
    }
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Image upload form submit
document.getElementById('imageUploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    const files = document.getElementById('imageFiles').files;
    const category = document.getElementById('imageCategory').value;
    
    if (files.length === 0) {
        showMessage('Veuillez sélectionner au moins une image', 'error');
        return;
    }
    
    // Add files to FormData
    for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i]);
    }
    formData.append('category', category);
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const progressContainer = document.getElementById('uploadProgress');
    const progressBar = document.getElementById('progressBar');
    
    submitBtn.disabled = true;
    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
    progressBar.textContent = '0%';
    
    try {
        const xhr = new XMLHttpRequest();
        
        // Progress tracking
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percentComplete = Math.round((e.loaded / e.total) * 100);
                progressBar.style.width = percentComplete + '%';
                progressBar.textContent = percentComplete + '%';
            }
        });
        
        // Response handling
        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                const data = JSON.parse(xhr.responseText);
                if (data.success) {
                    showMessage(data.message);
                    e.target.reset();
                    loadImageGallery(document.getElementById('categoryFilter').value);
                } else {
                    showMessage(data.message || 'Erreur lors du téléchargement', 'error');
                }
            } else {
                showMessage('Erreur lors du téléchargement', 'error');
            }
            submitBtn.disabled = false;
            setTimeout(() => {
                progressContainer.style.display = 'none';
            }, 1000);
        });
        
        xhr.addEventListener('error', () => {
            showMessage('Erreur de connexion au serveur', 'error');
            submitBtn.disabled = false;
            progressContainer.style.display = 'none';
        });
        
        xhr.open('POST', `${API_URL}/images/upload-multiple`);
        xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
        xhr.send(formData);
        
    } catch (error) {
        console.error('Upload error:', error);
        showMessage('Erreur lors du téléchargement', 'error');
        submitBtn.disabled = false;
        progressContainer.style.display = 'none';
    }
});

// Category filter
document.getElementById('categoryFilter').addEventListener('change', (e) => {
    loadImageGallery(e.target.value);
});

// Copy image URL to clipboard
function copyImageUrl(path) {
    const fullUrl = window.location.origin + path;
    navigator.clipboard.writeText(fullUrl).then(() => {
        showMessage('URL copiée dans le presse-papier');
    }).catch(() => {
        showMessage('Erreur lors de la copie', 'error');
    });
}

// View image in new tab
function viewImage(path) {
    window.open(path, '_blank');
}

// Delete image
function deleteImage(id) {
    showDeleteModal(async () => {
        try {
            const response = await fetch(`${API_URL}/images/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                showMessage(data.message);
                loadImageGallery(document.getElementById('categoryFilter').value);
            } else {
                showMessage(data.message || 'Erreur lors de la suppression', 'error');
            }
        } catch (error) {
            console.error('Delete image error:', error);
            showMessage('Erreur de connexion au serveur', 'error');
        }
    });
}


// ==================== INITIALIZATION ====================

const today = new Date().toISOString().split('T')[0];
document.getElementById('newsDate').value = today;
document.getElementById('eventDate').value = today;

loadNewsTable();
loadCalendarTable();

// Made with Bob