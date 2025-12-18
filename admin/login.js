// Admin Login Handler

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    
    // Simple authentication (in production, use proper backend authentication)
    const validCredentials = {
        username: 'admin',
        password: 'admin123'
    };
    
    if (username === validCredentials.username && password === validCredentials.password) {
        // Set session
        sessionStorage.setItem('adminLoggedIn', 'true');
        sessionStorage.setItem('adminUsername', username);
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    } else {
        errorMessage.textContent = 'Nom d\'utilisateur ou mot de passe incorrect';
        errorMessage.classList.add('show');
        
        // Clear error after 3 seconds
        setTimeout(() => {
            errorMessage.classList.remove('show');
        }, 3000);
    }
});

// Made with Bob
