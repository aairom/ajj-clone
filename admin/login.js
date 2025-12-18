// Admin Login Handler - Secure Backend Authentication

const API_URL = 'http://localhost:3000/api';

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    const submitBtn = this.querySelector('button[type="submit"]');
    
    // Disable submit button during request
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Store token and user info
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('adminUser', JSON.stringify(data.user));
            
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
        } else {
            // Show error message
            errorMessage.textContent = data.error || 'Nom d\'utilisateur ou mot de passe incorrect';
            errorMessage.classList.add('show');
            
            // Clear error after 3 seconds
            setTimeout(() => {
                errorMessage.classList.remove('show');
            }, 3000);
        }
    } catch (error) {
        console.error('Login error:', error);
        errorMessage.textContent = 'Erreur de connexion au serveur. Assurez-vous que le serveur est démarré.';
        errorMessage.classList.add('show');
        
        setTimeout(() => {
            errorMessage.classList.remove('show');
        }, 5000);
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter';
    }
});

// Made with Bob
