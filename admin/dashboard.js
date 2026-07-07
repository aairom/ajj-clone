// Admin Dashboard JavaScript - Secure Backend Integration

const API_URL = '/api';

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
        
        // Load data when specific tabs are activated
        if (btn.dataset.tab === 'images') {
            loadImageGallery();
        }
        if (btn.dataset.tab === 'prices') {
            loadPricesTable();
        }
        if (btn.dataset.tab === 'newsletter') {
            loadSubscribersTable();
            loadCampaignsTable();
        }
        if (btn.dataset.tab === 'gallery') {
            loadAlbumsList();
        }
        if (btn.dataset.tab === 'push') {
            loadPushHistory();
        }
        if (btn.dataset.tab === 'blog') {
            loadBlogPostsTable();
            loadBlogCommentsTable();
            loadBlogCategories();
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

// ==================== IMAGE UPLOAD HELPERS ====================

/**
 * Upload a File to /api/images/upload-single and return the public path,
 * or return the URL string directly if no file was chosen.
 */
async function resolveImage(fileInput, urlInput) {
    const file = fileInput.files[0];
    if (file) {
        const fd = new FormData();
        fd.append('image', file);
        fd.append('category', 'general');
        const res = await fetch(`${API_URL}/images/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` },
            body: fd
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Upload échoué');
        return data.image.path;          // e.g. /uploads/uuid.jpg
    }
    return urlInput.value.trim() || '';
}

function showImagePreview(previewId, imgId, src) {
    const wrap = document.getElementById(previewId);
    const img  = document.getElementById(imgId);
    if (src) {
        img.src = src;
        wrap.style.display = 'flex';
    } else {
        wrap.style.display = 'none';
        img.src = '';
    }
}

// Wire file inputs → preview + populate URL field
document.getElementById('newsImageFile').addEventListener('change', function () {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        document.getElementById('newsImage').value = '';   // clear URL field
        showImagePreview('newsImagePreview', 'newsImagePreviewImg', e.target.result);
    };
    reader.readAsDataURL(file);
});

document.getElementById('newsImage').addEventListener('input', function () {
    document.getElementById('newsImageFile').value = '';   // clear file input
    showImagePreview('newsImagePreview', 'newsImagePreviewImg', this.value.trim());
});

document.getElementById('eventImageFile').addEventListener('change', function () {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        document.getElementById('eventImage').value = '';
        showImagePreview('eventImagePreview', 'eventImagePreviewImg', e.target.result);
    };
    reader.readAsDataURL(file);
});

document.getElementById('eventImage').addEventListener('input', function () {
    document.getElementById('eventImageFile').value = '';
    showImagePreview('eventImagePreview', 'eventImagePreviewImg', this.value.trim());
});

function clearNewsImage() {
    document.getElementById('newsImage').value = '';
    document.getElementById('newsImageFile').value = '';
    showImagePreview('newsImagePreview', 'newsImagePreviewImg', '');
}

function clearEventImage() {
    document.getElementById('eventImage').value = '';
    document.getElementById('eventImageFile').value = '';
    showImagePreview('eventImagePreview', 'eventImagePreviewImg', '');
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

// Initialize Quill editor for event description
const eventQuill = new Quill('#eventEditor', {
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
    placeholder: 'Décrivez votre événement ici...'
});

// Sync event Quill content with hidden input
eventQuill.on('text-change', function() {
    const html = eventQuill.root.innerHTML;
    document.getElementById('eventDescription').value = html;
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

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    try {
        const image = await resolveImage(
            document.getElementById('newsImageFile'),
            document.getElementById('newsImage')
        );

        const newsData = {
            title: document.getElementById('newsTitle').value,
            content: quill.root.innerHTML,
            date: document.getElementById('newsDate').value,
            image
        };

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
            quill.setContents([]);
            editingNewsId = null;
            clearNewsImage();
            document.getElementById('newsSubmitText').textContent = 'Publier';
            document.getElementById('cancelNewsBtn').style.display = 'none';
            loadNewsTable();
        } else {
            showMessage(data.error || 'Erreur lors de l\'enregistrement', 'error');
        }
    } catch (error) {
        console.error('Save news error:', error);
        showMessage(error.message || 'Erreur de connexion au serveur', 'error');
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
            quill.root.innerHTML = item.content;
            document.getElementById('newsContent').value = item.content;
            document.getElementById('newsDate').value = item.date;
            document.getElementById('newsImage').value = item.image || '';
            document.getElementById('newsImageFile').value = '';
            showImagePreview('newsImagePreview', 'newsImagePreviewImg', item.image || '');
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
    quill.setContents([]);
    clearNewsImage();
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

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    try {
        const image = await resolveImage(
            document.getElementById('eventImageFile'),
            document.getElementById('eventImage')
        );

        const eventData = {
            title: document.getElementById('eventTitle').value,
            description: eventQuill.root.innerHTML,
            date: document.getElementById('eventDate').value,
            image
        };

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
            eventQuill.setContents([]);
            editingEventId = null;
            clearEventImage();
            document.getElementById('eventSubmitText').textContent = 'Ajouter';
            document.getElementById('cancelEventBtn').style.display = 'none';
            loadCalendarTable();
        } else {
            showMessage(data.error || 'Erreur lors de l\'enregistrement', 'error');
        }
    } catch (error) {
        console.error('Save event error:', error);
        showMessage(error.message || 'Erreur de connexion au serveur', 'error');
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
            eventQuill.root.innerHTML = event.description;
            document.getElementById('eventDescription').value = event.description;
            document.getElementById('eventDate').value = event.date;
            document.getElementById('eventImage').value = event.image || '';
            document.getElementById('eventImageFile').value = '';
            showImagePreview('eventImagePreview', 'eventImagePreviewImg', event.image || '');
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
    eventQuill.setContents([]);
    clearEventImage();
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

// ==================== PRICES MANAGEMENT ====================

async function loadPricesTable() {
    const tbody = document.getElementById('pricesTableBody');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Chargement...</td></tr>';

    try {
        const response = await fetch(`${API_URL}/prices`);
        const data = await response.json();

        if (!data.success || data.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #999;">Aucun tarif trouvé</td></tr>';
            return;
        }

        tbody.innerHTML = data.data.map(item => `
            <tr id="price-row-${item.id}">
                <td><strong>${item.type}</strong></td>
                <td><span id="price-display-${item.id}">${item.price}</span></td>
                <td>
                    <input
                        type="text"
                        id="price-input-${item.id}"
                        value="${item.price}"
                        placeholder="ex: 350€"
                        style="padding: 0.4rem 0.7rem; border: 2px solid #e0e0e0; border-radius: 5px; font-size: 0.95rem; width: 120px;"
                    >
                </td>
                <td>
                    <button class="btn btn-small btn-edit" onclick="savePrice(${item.id})">
                        <i class="fas fa-save"></i> Enregistrer
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Load prices error:', error);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #f44336;">Erreur de chargement</td></tr>';
    }
}

async function savePrice(id) {
    const input = document.getElementById(`price-input-${id}`);
    const newPrice = input.value.trim();

    if (!newPrice) {
        showMessage('Le prix ne peut pas être vide', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/prices/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ price: newPrice })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Update displayed value in-place
            document.getElementById(`price-display-${id}`).textContent = newPrice;
            showMessage(`Tarif mis à jour : ${data.data.type} → ${newPrice}`);
        } else {
            showMessage(data.error || 'Erreur lors de la mise à jour', 'error');
        }
    } catch (error) {
        console.error('Save price error:', error);
        showMessage('Erreur de connexion au serveur', 'error');
    }
}

// ==================== NEWSLETTER MANAGEMENT ====================

async function loadSubscribersTable() {
    const tbody = document.getElementById('subscribersTableBody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;"><i class="fas fa-spinner fa-spin"></i></td></tr>';
    try {
        const response = await fetch(`${API_URL}/newsletter/subscribers`, { headers: getAuthHeaders() });
        const data = await response.json();
        if (!data.success || data.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:#999;">Aucun abonné</td></tr>';
            return;
        }
        tbody.innerHTML = data.data.map(s => `
            <tr>
                <td>${s.email}</td>
                <td>${s.name || '-'}</td>
                <td><span class="status-badge status-${s.status}">${s.status}</span></td>
                <td>${formatDate(s.subscribed_at)}</td>
                <td>
                    <button class="btn btn-small btn-delete" onclick="deleteSubscriber(${s.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Load subscribers error:', error);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:#f44336;">Erreur de chargement</td></tr>';
    }
}

function deleteSubscriber(id) {
    showDeleteModal(async () => {
        try {
            const response = await fetch(`${API_URL}/newsletter/subscribers/${id}`, {
                method: 'DELETE', headers: getAuthHeaders()
            });
            const data = await response.json();
            if (response.ok && data.success) {
                showMessage(data.message);
                loadSubscribersTable();
            } else {
                showMessage(data.error || 'Erreur', 'error');
            }
        } catch (e) {
            showMessage('Erreur de connexion', 'error');
        }
    });
}

// Campaign Quill editor
const campaignQuill = new Quill('#campaignEditor', {
    theme: 'snow',
    modules: { toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['link'], ['clean']
    ]},
    placeholder: 'Rédigez votre newsletter...'
});
campaignQuill.on('text-change', () => {
    document.getElementById('campaignContent').value = campaignQuill.root.innerHTML;
});

document.getElementById('campaignForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    try {
        const response = await fetch(`${API_URL}/newsletter/campaigns`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                subject: document.getElementById('campaignSubject').value,
                html_content: campaignQuill.root.innerHTML
            })
        });
        const data = await response.json();
        if (response.ok && data.success) {
            showMessage('Campagne créée');
            e.target.reset();
            campaignQuill.setContents([]);
            loadCampaignsTable();
        } else {
            showMessage(data.error || 'Erreur', 'error');
        }
    } catch (err) {
        showMessage('Erreur de connexion', 'error');
    } finally {
        submitBtn.disabled = false;
    }
});

async function loadCampaignsTable() {
    const tbody = document.getElementById('campaignsTableBody');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:2rem;"><i class="fas fa-spinner fa-spin"></i></td></tr>';
    try {
        const response = await fetch(`${API_URL}/newsletter/campaigns`, { headers: getAuthHeaders() });
        const data = await response.json();
        if (!data.success || data.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:2rem;color:#999;">Aucune campagne</td></tr>';
            return;
        }
        tbody.innerHTML = data.data.map(c => `
            <tr>
                <td><strong>${c.subject}</strong></td>
                <td><span class="status-badge status-${c.status}">${c.status}</span></td>
                <td>${formatDate(c.created_at)}</td>
                <td>
                    ${c.status !== 'sent' ? `<button class="btn btn-small btn-edit" onclick="sendCampaign(${c.id})">
                        <i class="fas fa-paper-plane"></i> Envoyer
                    </button>` : '<span style="color:#999;font-size:0.85rem;">Envoyée</span>'}
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Load campaigns error:', error);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:2rem;color:#f44336;">Erreur de chargement</td></tr>';
    }
}

async function sendCampaign(id) {
    if (!confirm('Envoyer cette campagne à tous les abonnés actifs ?')) return;
    try {
        const response = await fetch(`${API_URL}/newsletter/campaigns/${id}/send`, {
            method: 'POST', headers: getAuthHeaders()
        });
        const data = await response.json();
        if (response.ok && data.success) {
            showMessage(data.message);
            loadCampaignsTable();
        } else {
            showMessage(data.error || 'Erreur lors de l\'envoi', 'error');
        }
    } catch (e) {
        showMessage('Erreur de connexion', 'error');
    }
}

// ==================== GALLERY MANAGEMENT ====================

let editingAlbumId = null;
let imagePickerAlbumId = null;
let selectedImageIds = new Set();

async function loadAlbumsList() {
    const container = document.getElementById('albumsList');
    container.innerHTML = '<div style="text-align:center;padding:2rem;"><i class="fas fa-spinner fa-spin"></i></div>';
    try {
        const response = await fetch(`${API_URL}/gallery/albums-admin`, { headers: getAuthHeaders() });
        const data = await response.json();
        if (!data.success || data.data.length === 0) {
            container.innerHTML = '<p style="color:#999;text-align:center;padding:2rem;">Aucun album</p>';
            return;
        }
        container.innerHTML = data.data.map(album => `
            <div class="album-admin-item">
                <div class="album-admin-info">
                    ${album.cover_thumbnail ? `<img src="${album.cover_thumbnail}" class="album-admin-thumb" alt="">` : '<div class="album-admin-thumb-placeholder"><i class="fas fa-images"></i></div>'}
                    <div>
                        <strong>${album.title}</strong>
                        <div style="font-size:0.85rem;color:#666;">${album.image_count} image(s) · ${album.is_public ? 'Public' : 'Privé'}</div>
                        ${album.description ? `<div style="font-size:0.85rem;color:#888;">${album.description}</div>` : ''}
                    </div>
                </div>
                <div class="action-buttons">
                    <button class="btn btn-small" onclick="openImagePicker(${album.id}, '${album.title.replace(/'/g, "\\'")}')">
                        <i class="fas fa-plus"></i> Images
                    </button>
                    <button class="btn btn-small btn-edit" onclick="editAlbum(${album.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-small btn-delete" onclick="deleteAlbum(${album.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Load albums error:', error);
        container.innerHTML = '<p style="color:#f44336;text-align:center;padding:2rem;">Erreur de chargement</p>';
    }
}

document.getElementById('albumForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    try {
        const payload = {
            title: document.getElementById('albumTitle').value,
            description: document.getElementById('albumDescription').value,
            is_public: document.getElementById('albumPublic').checked
        };
        const url = editingAlbumId ? `${API_URL}/gallery/albums/${editingAlbumId}` : `${API_URL}/gallery/albums`;
        const method = editingAlbumId ? 'PUT' : 'POST';
        const response = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(payload) });
        const data = await response.json();
        if (response.ok && data.success) {
            showMessage(editingAlbumId ? 'Album mis à jour' : 'Album créé');
            e.target.reset();
            editingAlbumId = null;
            document.getElementById('albumSubmitText').textContent = 'Créer l\'album';
            document.getElementById('cancelAlbumBtn').style.display = 'none';
            loadAlbumsList();
        } else {
            showMessage(data.error || 'Erreur', 'error');
        }
    } catch (err) {
        showMessage('Erreur de connexion', 'error');
    } finally {
        submitBtn.disabled = false;
    }
});

async function editAlbum(id) {
    try {
        const response = await fetch(`${API_URL}/gallery/albums-admin`, { headers: getAuthHeaders() });
        const data = await response.json();
        const album = data.data.find(a => a.id === id);
        if (!album) return;
        editingAlbumId = id;
        document.getElementById('albumId').value = id;
        document.getElementById('albumTitle').value = album.title;
        document.getElementById('albumDescription').value = album.description || '';
        document.getElementById('albumPublic').checked = album.is_public === 1;
        document.getElementById('albumSubmitText').textContent = 'Mettre à jour';
        document.getElementById('cancelAlbumBtn').style.display = 'inline-block';
        document.getElementById('albumForm').scrollIntoView({ behavior: 'smooth' });
    } catch (e) {
        showMessage('Erreur de chargement', 'error');
    }
}

document.getElementById('cancelAlbumBtn').addEventListener('click', () => {
    editingAlbumId = null;
    document.getElementById('albumForm').reset();
    document.getElementById('albumSubmitText').textContent = 'Créer l\'album';
    document.getElementById('cancelAlbumBtn').style.display = 'none';
});

function deleteAlbum(id) {
    showDeleteModal(async () => {
        try {
            const response = await fetch(`${API_URL}/gallery/albums/${id}`, {
                method: 'DELETE', headers: getAuthHeaders()
            });
            const data = await response.json();
            if (response.ok && data.success) {
                showMessage(data.message);
                loadAlbumsList();
            } else {
                showMessage(data.error || 'Erreur', 'error');
            }
        } catch (e) {
            showMessage('Erreur de connexion', 'error');
        }
    });
}

async function openImagePicker(albumId, albumTitle) {
    imagePickerAlbumId = albumId;
    selectedImageIds.clear();
    document.getElementById('imagePickerAlbumTitle').textContent = albumTitle;
    document.getElementById('imagePickerCard').style.display = 'block';
    document.getElementById('imagePickerCard').scrollIntoView({ behavior: 'smooth' });

    const grid = document.getElementById('imagePickerGrid');
    grid.innerHTML = '<div style="text-align:center;padding:2rem;"><i class="fas fa-spinner fa-spin"></i></div>';
    try {
        const response = await fetch(`${API_URL}/images?limit=100`, { headers: getAuthHeaders() });
        const data = await response.json();
        if (!data.success || data.images.length === 0) {
            grid.innerHTML = '<p style="color:#999;text-align:center;padding:2rem;">Aucune image disponible. Téléversez d\'abord des images dans l\'onglet Images.</p>';
            return;
        }
        grid.innerHTML = data.images.map(img => `
            <div class="image-card picker-item" data-id="${img.id}" onclick="toggleImageSelection(this, ${img.id})">
                <div class="image-thumbnail">
                    <img src="${img.thumbnail_path}" alt="${img.alt_text || img.original_name}" loading="lazy">
                    <div class="picker-check"><i class="fas fa-check"></i></div>
                </div>
                <div class="image-info">
                    <div class="image-name" title="${img.original_name}">${img.original_name}</div>
                </div>
            </div>
        `).join('');
    } catch (e) {
        grid.innerHTML = '<p style="color:#f44336;text-align:center;">Erreur de chargement</p>';
    }
}

function toggleImageSelection(el, id) {
    if (selectedImageIds.has(id)) {
        selectedImageIds.delete(id);
        el.classList.remove('picker-selected');
    } else {
        selectedImageIds.add(id);
        el.classList.add('picker-selected');
    }
}

function closeImagePicker() {
    document.getElementById('imagePickerCard').style.display = 'none';
    selectedImageIds.clear();
    imagePickerAlbumId = null;
}

async function addSelectedImages() {
    if (!imagePickerAlbumId || selectedImageIds.size === 0) {
        showMessage('Sélectionnez au moins une image', 'error');
        return;
    }
    try {
        const response = await fetch(`${API_URL}/gallery/albums/${imagePickerAlbumId}/images`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ image_ids: Array.from(selectedImageIds) })
        });
        const data = await response.json();
        if (response.ok && data.success) {
            showMessage(data.message);
            closeImagePicker();
            loadAlbumsList();
        } else {
            showMessage(data.error || 'Erreur', 'error');
        }
    } catch (e) {
        showMessage('Erreur de connexion', 'error');
    }
}

// ==================== PUSH NOTIFICATIONS MANAGEMENT ====================

document.getElementById('pushForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    try {
        const response = await fetch(`${API_URL}/push/send`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                title: document.getElementById('pushTitle').value,
                body: document.getElementById('pushBody').value,
                url: document.getElementById('pushUrl').value || '/'
            })
        });
        const data = await response.json();
        if (response.ok && data.success) {
            showMessage(data.message);
            e.target.reset();
            document.getElementById('pushUrl').value = '/';
            loadPushHistory();
        } else {
            showMessage(data.error || 'Erreur lors de l\'envoi', 'error');
        }
    } catch (err) {
        showMessage('Erreur de connexion', 'error');
    } finally {
        submitBtn.disabled = false;
    }
});

async function loadPushHistory() {
    const tbody = document.getElementById('pushHistoryTableBody');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:2rem;"><i class="fas fa-spinner fa-spin"></i></td></tr>';
    try {
        const response = await fetch(`${API_URL}/push/notifications`, { headers: getAuthHeaders() });
        const data = await response.json();
        if (!data.success || data.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:2rem;color:#999;">Aucune notification envoyée</td></tr>';
            return;
        }
        tbody.innerHTML = data.data.map(n => `
            <tr>
                <td><strong>${n.title}</strong></td>
                <td>${n.body}</td>
                <td>${n.recipient_count}</td>
                <td>${formatDate(n.sent_at)}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Load push history error:', error);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:2rem;color:#f44336;">Erreur de chargement</td></tr>';
    }
}

// ==================== BLOG MANAGEMENT ====================

let editingBlogPostId = null;
let blogCategories = [];

// Blog Quill editor
const blogQuill = new Quill('#blogEditor', {
    theme: 'snow',
    modules: { toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }],
        ['link', 'image'],
        ['clean']
    ]},
    placeholder: 'Rédigez votre article...'
});
blogQuill.on('text-change', () => {
    document.getElementById('blogContent').value = blogQuill.root.innerHTML;
});

// Blog featured image helpers
document.getElementById('blogFeaturedImageFile').addEventListener('change', function () {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        document.getElementById('blogFeaturedImage').value = '';
        showImagePreview('blogImagePreview', 'blogImagePreviewImg', e.target.result);
    };
    reader.readAsDataURL(file);
});
document.getElementById('blogFeaturedImage').addEventListener('input', function () {
    document.getElementById('blogFeaturedImageFile').value = '';
    showImagePreview('blogImagePreview', 'blogImagePreviewImg', this.value.trim());
});
function clearBlogImage() {
    document.getElementById('blogFeaturedImage').value = '';
    document.getElementById('blogFeaturedImageFile').value = '';
    showImagePreview('blogImagePreview', 'blogImagePreviewImg', '');
}

async function loadBlogCategories() {
    try {
        const response = await fetch(`${API_URL}/blog/categories`);
        const data = await response.json();
        blogCategories = data.success ? data.data : [];

        // Render checkboxes
        const container = document.getElementById('blogCategoryCheckboxes');
        container.innerHTML = blogCategories.map(cat => `
            <label class="cat-checkbox-label">
                <input type="checkbox" class="blog-cat-cb" value="${cat.id}"> ${cat.name}
            </label>
        `).join('');

        // Render categories list in management section
        const list = document.getElementById('blogCategoriesList');
        if (blogCategories.length === 0) {
            list.innerHTML = '<p style="color:#999;">Aucune catégorie</p>';
        } else {
            list.innerHTML = '<div style="display:flex;flex-wrap:wrap;gap:0.5rem;">' +
                blogCategories.map(cat => `
                    <span class="cat-tag">
                        ${cat.name}
                        <button onclick="deleteBlogCategory(${cat.id})" title="Supprimer" style="background:none;border:none;cursor:pointer;color:inherit;padding:0 0 0 6px;">
                            <i class="fas fa-times"></i>
                        </button>
                    </span>
                `).join('') + '</div>';
        }
    } catch (e) {
        console.error('Load categories error:', e);
    }
}

async function createBlogCategory() {
    const name = document.getElementById('newCategoryName').value.trim();
    if (!name) { showMessage('Nom de catégorie requis', 'error'); return; }
    try {
        const response = await fetch(`${API_URL}/blog/categories`, {
            method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ name })
        });
        const data = await response.json();
        if (response.ok && data.success) {
            showMessage('Catégorie créée');
            document.getElementById('newCategoryName').value = '';
            loadBlogCategories();
        } else {
            showMessage(data.error || 'Erreur', 'error');
        }
    } catch (e) {
        showMessage('Erreur de connexion', 'error');
    }
}

async function deleteBlogCategory(id) {
    if (!confirm('Supprimer cette catégorie ?')) return;
    try {
        const response = await fetch(`${API_URL}/blog/categories/${id}`, {
            method: 'DELETE', headers: getAuthHeaders()
        });
        const data = await response.json();
        if (response.ok && data.success) {
            showMessage(data.message);
            loadBlogCategories();
        } else {
            showMessage(data.error || 'Erreur', 'error');
        }
    } catch (e) {
        showMessage('Erreur de connexion', 'error');
    }
}

document.getElementById('blogPostForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    try {
        const featured_image = await resolveImage(
            document.getElementById('blogFeaturedImageFile'),
            document.getElementById('blogFeaturedImage')
        );

        const checkedCats = Array.from(document.querySelectorAll('.blog-cat-cb:checked')).map(cb => parseInt(cb.value));

        const payload = {
            title: document.getElementById('blogTitle').value,
            excerpt: document.getElementById('blogExcerpt').value,
            content: blogQuill.root.innerHTML,
            featured_image,
            status: document.getElementById('blogStatus').value,
            category_ids: checkedCats
        };

        const url = editingBlogPostId ? `${API_URL}/blog/posts/${editingBlogPostId}` : `${API_URL}/blog/posts`;
        const method = editingBlogPostId ? 'PUT' : 'POST';

        const response = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(payload) });
        const data = await response.json();

        if (response.ok && data.success) {
            showMessage(editingBlogPostId ? 'Article mis à jour' : 'Article créé');
            e.target.reset();
            blogQuill.setContents([]);
            clearBlogImage();
            editingBlogPostId = null;
            document.getElementById('blogFormTitle').textContent = 'Nouvel article';
            document.getElementById('blogSubmitText').textContent = 'Publier';
            document.getElementById('cancelBlogBtn').style.display = 'none';
            loadBlogPostsTable();
            loadBlogCommentsTable();
        } else {
            showMessage(data.error || 'Erreur', 'error');
        }
    } catch (err) {
        console.error('Save blog post error:', err);
        showMessage(err.message || 'Erreur de connexion', 'error');
    } finally {
        submitBtn.disabled = false;
    }
});

document.getElementById('cancelBlogBtn').addEventListener('click', () => {
    editingBlogPostId = null;
    document.getElementById('blogPostForm').reset();
    blogQuill.setContents([]);
    clearBlogImage();
    document.getElementById('blogFormTitle').textContent = 'Nouvel article';
    document.getElementById('blogSubmitText').textContent = 'Publier';
    document.getElementById('cancelBlogBtn').style.display = 'none';
});

async function loadBlogPostsTable() {
    const tbody = document.getElementById('blogPostsTableBody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;"><i class="fas fa-spinner fa-spin"></i></td></tr>';
    try {
        const response = await fetch(`${API_URL}/blog/posts?limit=100`, { headers: getAuthHeaders() });
        // also load drafts via a separate admin approach — since public API only returns published,
        // we use the same endpoint but note drafts need a dedicated admin endpoint
        // For now, show published posts only
        const data = await response.json();
        if (!data.success || data.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:#999;">Aucun article</td></tr>';
            return;
        }
        tbody.innerHTML = data.data.map(p => `
            <tr>
                <td><strong>${p.title}</strong></td>
                <td><span class="status-badge status-${p.status}">${p.status}</span></td>
                <td>${p.views}</td>
                <td>${p.published_at ? formatDate(p.published_at) : '-'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-small btn-edit" onclick="editBlogPost(${p.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-small btn-delete" onclick="deleteBlogPost(${p.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Load blog posts error:', error);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:#f44336;">Erreur de chargement</td></tr>';
    }
}

async function editBlogPost(id) {
    try {
        // Fetch all published posts to find this one
        const response = await fetch(`${API_URL}/blog/posts?limit=200`);
        const data = await response.json();
        const posts = data.success ? data.data : [];
        const post = posts.find(p => p.id === id);
        if (!post) { showMessage('Article introuvable', 'error'); return; }

        editingBlogPostId = id;
        document.getElementById('blogTitle').value = post.title;
        document.getElementById('blogExcerpt').value = post.excerpt || '';
        blogQuill.root.innerHTML = post.content || '';
        document.getElementById('blogContent').value = post.content || '';
        document.getElementById('blogFeaturedImage').value = post.featured_image || '';
        showImagePreview('blogImagePreview', 'blogImagePreviewImg', post.featured_image || '');
        document.getElementById('blogStatus').value = post.status;
        document.getElementById('blogFormTitle').textContent = 'Modifier l\'article';
        document.getElementById('blogSubmitText').textContent = 'Mettre à jour';
        document.getElementById('cancelBlogBtn').style.display = 'inline-block';
        document.getElementById('blogPostForm').scrollIntoView({ behavior: 'smooth' });
    } catch (e) {
        showMessage('Erreur de chargement', 'error');
    }
}

function deleteBlogPost(id) {
    showDeleteModal(async () => {
        try {
            const response = await fetch(`${API_URL}/blog/posts/${id}`, {
                method: 'DELETE', headers: getAuthHeaders()
            });
            const data = await response.json();
            if (response.ok && data.success) {
                showMessage(data.message);
                loadBlogPostsTable();
            } else {
                showMessage(data.error || 'Erreur', 'error');
            }
        } catch (e) {
            showMessage('Erreur de connexion', 'error');
        }
    });
}

async function loadBlogCommentsTable() {
    const tbody = document.getElementById('blogCommentsTableBody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;"><i class="fas fa-spinner fa-spin"></i></td></tr>';
    try {
        const response = await fetch(`${API_URL}/blog/comments`, { headers: getAuthHeaders() });
        const data = await response.json();
        if (!data.success || data.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:#999;">Aucun commentaire</td></tr>';
            return;
        }
        tbody.innerHTML = data.data.map(c => `
            <tr>
                <td><a href="/Pages/blog-post.html?slug=${c.post_slug}" target="_blank" style="color:var(--accent-color)">${c.post_title}</a></td>
                <td>${c.author_name}</td>
                <td>${c.content.substring(0, 80)}${c.content.length > 80 ? '...' : ''}</td>
                <td>${formatDate(c.created_at)}</td>
                <td>
                    <div class="action-buttons">
                        ${c.status === 'pending' ? `<button class="btn btn-small btn-edit" onclick="approveBlogComment(${c.id})">
                            <i class="fas fa-check"></i> Approuver
                        </button>` : '<span style="color:#4caf50;font-size:0.85rem;"><i class="fas fa-check-circle"></i> Approuvé</span>'}
                        <button class="btn btn-small btn-delete" onclick="deleteBlogComment(${c.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Load comments error:', error);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:#f44336;">Erreur de chargement</td></tr>';
    }
}

async function approveBlogComment(id) {
    try {
        const response = await fetch(`${API_URL}/blog/comments/${id}/approve`, {
            method: 'PUT', headers: getAuthHeaders()
        });
        const data = await response.json();
        if (response.ok && data.success) {
            showMessage(data.message);
            loadBlogCommentsTable();
        } else {
            showMessage(data.error || 'Erreur', 'error');
        }
    } catch (e) {
        showMessage('Erreur de connexion', 'error');
    }
}

function deleteBlogComment(id) {
    showDeleteModal(async () => {
        try {
            const response = await fetch(`${API_URL}/blog/comments/${id}`, {
                method: 'DELETE', headers: getAuthHeaders()
            });
            const data = await response.json();
            if (response.ok && data.success) {
                showMessage(data.message);
                loadBlogCommentsTable();
            } else {
                showMessage(data.error || 'Erreur', 'error');
            }
        } catch (e) {
            showMessage('Erreur de connexion', 'error');
        }
    });
}

// Made with Bob