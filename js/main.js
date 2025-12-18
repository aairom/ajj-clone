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

// Load News from localStorage
function loadNews() {
    const newsContainer = document.getElementById('newsContainer');
    if (!newsContainer) return;

    const news = JSON.parse(localStorage.getItem('news') || '[]');

    if (news.length === 0) {
        newsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-newspaper"></i>
                <p>Aucune actualité pour le moment.</p>
            </div>
        `;
        return;
    }

    // Sort by date (newest first)
    news.sort((a, b) => new Date(b.date) - new Date(a.date));

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
}

// Load Calendar Events from localStorage
function loadCalendar() {
    const calendarContainer = document.getElementById('calendarContainer');
    if (!calendarContainer) return;

    const events = JSON.parse(localStorage.getItem('calendar') || '[]');

    if (events.length === 0) {
        calendarContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar"></i>
                <p>Aucun événement prévu pour le moment.</p>
            </div>
        `;
        return;
    }

    // Sort by date (nearest first)
    events.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Filter future events
    const now = new Date();
    const futureEvents = events.filter(event => new Date(event.date) >= now);

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
}

// Format Date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
}

// Contact Form Handler
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData);
        
        // In a real application, this would send data to a server
        console.log('Contact form submitted:', data);
        
        alert('Merci pour votre message ! Nous vous répondrons dans les plus brefs délais.');
        contactForm.reset();
    });
}

// Initialize default data if none exists
function initializeDefaultData() {
    // Initialize news if empty
    if (!localStorage.getItem('news')) {
        const defaultNews = [
            {
                id: 1,
                title: 'Bienvenue sur notre nouveau site',
                content: 'Découvrez notre nouveau site web avec toutes les informations sur le club.',
                date: new Date().toISOString().split('T')[0],
                image: ''
            },
            {
                id: 2,
                title: 'Reprise des cours',
                content: 'Les cours reprennent selon les horaires habituels. Venez nombreux !',
                date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
                image: ''
            }
        ];
        localStorage.setItem('news', JSON.stringify(defaultNews));
    }

    // Initialize calendar if empty
    if (!localStorage.getItem('calendar')) {
        const defaultEvents = [
            {
                id: 1,
                title: 'Stage de perfectionnement',
                description: 'Stage ouvert à tous les niveaux avec un instructeur invité.',
                date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
            },
            {
                id: 2,
                title: 'Compétition régionale',
                description: 'Compétition ouverte aux ceintures bleues et plus.',
                date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
            }
        ];
        localStorage.setItem('calendar', JSON.stringify(defaultEvents));
    }
}

// Load content on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeDefaultData();
    loadNews();
    loadCalendar();
});

// Refresh data when returning to the page (in case admin made changes)
window.addEventListener('focus', () => {
    loadNews();
    loadCalendar();
});

// Made with Bob
