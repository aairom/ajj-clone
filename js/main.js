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

// Load content on page load
document.addEventListener('DOMContentLoaded', () => {
    loadNews();
    loadCalendar();
});

// Refresh data when returning to the page (in case admin made changes)
window.addEventListener('focus', () => {
    loadNews();
    loadCalendar();
});

// Made with Bob
