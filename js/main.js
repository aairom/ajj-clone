// Main JavaScript for Asnières Jujitsu Website

// Mobile Navigation Toggle
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
}

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
    });
});

// Registration Modal Handler
const registrationModal = document.getElementById('registrationModal');
const registrationLinks = document.querySelectorAll('a[href="#contact"].btn-primary');

// Open modal when clicking registration links
registrationLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        registrationModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    });
});

// Close modal when clicking the X button
const modalClose = document.querySelector('.modal-close');
if (modalClose) {
    modalClose.addEventListener('click', () => {
        registrationModal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    });
}

// Close modal when clicking outside the modal content
registrationModal.addEventListener('click', (e) => {
    if (e.target === registrationModal) {
        registrationModal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && registrationModal.classList.contains('active')) {
        registrationModal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }
});

// Smooth Scrolling (for non-registration links)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        // Skip if it's a registration link (already handled above)
        if (this.classList.contains('btn-primary') && this.getAttribute('href') === '#contact') {
            return;
        }
        
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offset = 80;
            const targetPosition = target.offsetTop - offset;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Active Navigation Link on Scroll
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');
        const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);

        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            if (navLink) {
                navLink.classList.add('active');
            }
        }
    });
});

// Initialise a horizontal scroll carousel (shared by News and Calendar)
function initCarousel(scrollId, gridSelector, dotsId, prevId, nextId, cardWidth, gap) {
    var scroll  = document.getElementById(scrollId);
    var prev    = document.getElementById(prevId);
    var next    = document.getElementById(nextId);
    var dotsEl  = document.getElementById(dotsId);
    var cards   = document.querySelectorAll(gridSelector);

    if (!scroll || !cards.length) return;

    dotsEl.innerHTML = '';
    cards.forEach(function (_, i) {
        var d = document.createElement('button');
        d.className = 'dot' + (i === 0 ? ' active' : '');
        d.setAttribute('aria-label', 'Élément ' + (i + 1));
        d.addEventListener('click', function () {
            scroll.scrollTo({ left: i * (cardWidth + gap), behavior: 'smooth' });
        });
        dotsEl.appendChild(d);
    });

    function sync() {
        var sl  = scroll.scrollLeft;
        var idx = Math.round(sl / (cardWidth + gap));
        Array.from(dotsEl.children).forEach(function (d, i) {
            d.classList.toggle('active', i === idx);
        });
        prev.disabled = sl <= 2;
        next.disabled = sl + scroll.offsetWidth >= scroll.scrollWidth - 2;
    }

    prev.addEventListener('click', function () {
        scroll.scrollBy({ left: -(cardWidth + gap), behavior: 'smooth' });
    });
    next.addEventListener('click', function () {
        scroll.scrollBy({ left:  (cardWidth + gap), behavior: 'smooth' });
    });

    scroll.addEventListener('scroll', sync, { passive: true });
    sync();
}

// Load News from API
function loadNews() {
    const newsContainer = document.getElementById('newsContainer');
    if (!newsContainer) return;

    fetch('/api/news')
        .then(r => r.json())
        .then(data => {
            const news = data.success ? data.data : [];

            if (news.length === 0) {
                newsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-newspaper"></i>
                        <p>Aucune actualité pour le moment.</p>
                    </div>
                `;
                return;
            }

            newsContainer.innerHTML = news.map(item => `
                <div class="news-card">
                    <img src="${item.image || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22200%22%3E%3Crect fill=%22%23ddd%22 width=%22400%22 height=%22200%22/%3E%3Ctext fill=%22%23999%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22%3EImage%3C/text%3E%3C/svg%3E'}" alt="${item.title}">
                    <div class="news-content">
                        <div class="news-date">${formatDate(item.date)}</div>
                        <h3>${item.title}</h3>
                        <p>${item.content}</p>
                    </div>
                </div>
            `).join('');
            initCarousel('newsScroll', '#newsContainer .news-card', 'newsDots', 'newsPrev', 'newsNext', 300, 24);
        })
        .catch(() => {
            newsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-newspaper"></i>
                    <p>Impossible de charger les actualités.</p>
                </div>
            `;
        });
}

// Load Calendar Events from API
function loadCalendar() {
    const calendarContainer = document.getElementById('calendarContainer');
    if (!calendarContainer) return;

    fetch('/api/calendar')
        .then(r => r.json())
        .then(data => {
            const events = data.success ? data.data : [];

            // Filter future/today events — compare date strings only to avoid
            // UTC-midnight vs local-time mismatch dropping today's events
            const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local
            const futureEvents = events.filter(event => event.date >= todayStr);

            if (futureEvents.length === 0) {
                calendarContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-calendar"></i>
                        <p>Aucun événement à venir.</p>
                    </div>
                `;
                return;
            }

            calendarContainer.innerHTML = futureEvents.map(event => `
                <div class="calendar-event">
                    ${event.image ? `<img src="${event.image}" alt="${event.title}" class="event-image">` : ''}
                    <div class="event-date">${formatDate(event.date)}</div>
                    <div class="event-title">${event.title}</div>
                    <div class="event-description">${event.description}</div>
                </div>
            `).join('');
            initCarousel('calendarScroll', '#calendarContainer .calendar-event', 'calendarDots', 'calendarPrev', 'calendarNext', 280, 24);
        })
        .catch(() => {
            calendarContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar"></i>
                    <p>Impossible de charger le calendrier.</p>
                </div>
            `;
        });
}

// Format Date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
}

// Contact Form Handler
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitButton = contactForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        
        // Disable button and show loading state
        submitButton.disabled = true;
        submitButton.textContent = 'Envoi en cours...';
        
        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData);
        
        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('✅ Merci pour votre message ! Nous vous répondrons dans les plus brefs délais.');
                contactForm.reset();
            } else {
                alert('❌ ' + (result.message || 'Erreur lors de l\'envoi du message.'));
            }
        } catch (error) {
            console.error('Error sending contact form:', error);
            alert('❌ Erreur lors de l\'envoi du message. Veuillez réessayer plus tard.');
        } finally {
            // Re-enable button
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });
}

// ==================== GALLERY ====================

let lightboxImages = [];
let lightboxIndex = 0;

function loadGallery() {
    const container = document.getElementById('galerieContainer');
    if (!container) return;

    fetch('/api/gallery/albums')
        .then(r => r.json())
        .then(data => {
            const albums = data.success ? data.data : [];
            if (albums.length === 0) {
                container.innerHTML = '<div class="empty-state"><i class="fas fa-images"></i><p>Aucun album pour le moment.</p></div>';
                return;
            }
            container.innerHTML = albums.map(album => `
                <div class="galerie-album-card" onclick="openAlbum(${album.id})">
                    <div class="galerie-album-cover">
                        ${album.cover_image_path
                            ? `<img src="${album.cover_image_path}" alt="${album.title}" loading="lazy">`
                            : '<div class="galerie-album-placeholder"><i class="fas fa-images"></i></div>'}
                    </div>
                    <div class="galerie-album-info">
                        <h3>${album.title}</h3>
                        <span>${album.image_count} photo${album.image_count !== 1 ? 's' : ''}</span>
                    </div>
                </div>
            `).join('');
        })
        .catch(() => {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-images"></i><p>Impossible de charger la galerie.</p></div>';
        });
}

function openAlbum(albumId) {
    fetch(`/api/gallery/albums/${albumId}`)
        .then(r => r.json())
        .then(data => {
            if (!data.success) return;
            const album = data.data;
            lightboxImages = album.images || [];
            if (lightboxImages.length === 0) return;
            openLightbox(0);
        })
        .catch(() => {});
}

function openLightbox(index) {
    lightboxIndex = index;
    const lb = document.getElementById('galleryLightbox');
    if (!lb || lightboxImages.length === 0) return;
    lb.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    updateLightbox();
}

function updateLightbox() {
    const img = document.getElementById('lightboxImg');
    const cap = document.getElementById('lightboxCaption');
    const cur = lightboxImages[lightboxIndex];
    if (img) img.src = cur.path;
    if (cap) cap.textContent = cur.caption || '';
}

function closeLightbox() {
    const lb = document.getElementById('galleryLightbox');
    if (lb) lb.style.display = 'none';
    document.body.style.overflow = '';
}

function lightboxNav(dir, event) {
    if (event) event.stopPropagation();
    lightboxIndex = (lightboxIndex + dir + lightboxImages.length) % lightboxImages.length;
    updateLightbox();
}

document.addEventListener('keydown', (e) => {
    const lb = document.getElementById('galleryLightbox');
    if (!lb || lb.style.display === 'none') return;
    if (e.key === 'ArrowRight') lightboxNav(1, null);
    if (e.key === 'ArrowLeft')  lightboxNav(-1, null);
    if (e.key === 'Escape')     closeLightbox();
});

// ==================== BLOG PREVIEW ====================

function loadBlogPreview() {
    const container = document.getElementById('blogPreviewContainer');
    if (!container) return;

    fetch('/api/blog/posts?limit=3')
        .then(r => r.json())
        .then(data => {
            const posts = data.success ? data.data : [];
            if (posts.length === 0) {
                container.innerHTML = '<div class="empty-state"><i class="fas fa-blog"></i><p>Aucun article pour le moment.</p></div>';
                return;
            }
            container.innerHTML = posts.map(post => `
                <div class="blog-preview-card" onclick="location.href='Pages/blog-post.html?slug=${post.slug}'">
                    ${post.featured_image ? `<img src="${post.featured_image}" alt="${post.title}" class="blog-preview-img" loading="lazy">` : ''}
                    <div class="blog-preview-body">
                        <div class="blog-preview-date">${post.published_at ? formatDate(post.published_at) : ''}</div>
                        <h3>${post.title}</h3>
                        <p>${post.excerpt || ''}</p>
                        <a href="Pages/blog-post.html?slug=${post.slug}" class="blog-read-more">Lire la suite →</a>
                    </div>
                </div>
            `).join('');
        })
        .catch(() => {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-blog"></i><p>Impossible de charger le blog.</p></div>';
        });
}

// ==================== NEWSLETTER SUBSCRIBE ====================

const newsletterForm = document.getElementById('newsletterForm');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = newsletterForm.querySelector('button[type="submit"]');
        const msg = document.getElementById('newsletterMsg');
        btn.disabled = true;
        btn.textContent = 'Inscription...';
        try {
            const response = await fetch('/api/newsletter/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: document.getElementById('nlEmail').value,
                    name: document.getElementById('nlName').value
                })
            });
            const data = await response.json();
            msg.style.display = 'block';
            if (data.success) {
                msg.className = 'newsletter-msg success';
                msg.textContent = '✅ ' + data.message;
                newsletterForm.reset();
            } else {
                msg.className = 'newsletter-msg error';
                msg.textContent = '❌ ' + (data.error || 'Erreur lors de l\'inscription.');
            }
        } catch (err) {
            msg.style.display = 'block';
            msg.className = 'newsletter-msg error';
            msg.textContent = '❌ Erreur de connexion au serveur.';
        } finally {
            btn.disabled = false;
            btn.textContent = 'S\'inscrire';
        }
    });
}

// ==================== PUSH NOTIFICATIONS ====================

async function initPushNotifications() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    try {
        const swReg = await navigator.serviceWorker.register('/sw.js');
        const keyResp = await fetch('/api/push/vapid-public-key');
        if (!keyResp.ok) return;
        const { publicKey } = await keyResp.json();
        if (!publicKey) return;

        const btn = document.getElementById('pushNotifBtn');
        if (!btn) return;

        const permission = await Notification.permission;

        if (permission === 'granted') {
            // Already subscribed — hide button
            btn.style.display = 'none';
        } else if (permission !== 'denied') {
            btn.style.display = 'block';
            btn.addEventListener('click', async () => {
                const perm = await Notification.requestPermission();
                if (perm !== 'granted') return;
                const subscription = await swReg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(publicKey)
                });
                await fetch('/api/push/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(subscription.toJSON())
                });
                btn.style.display = 'none';
            });
        }
    } catch (e) {
        // Push not available — silent fail
    }
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

// ==================== LOAD CONTENT ON PAGE LOAD ====================

// Load content on page load
document.addEventListener('DOMContentLoaded', () => {
    loadNews();
    loadCalendar();
    loadGallery();
    loadBlogPreview();
    initPushNotifications();
});

// Refresh data when returning to the page (in case admin made changes)
window.addEventListener('focus', () => {
    loadNews();
    loadCalendar();
});

// Made with Bob
