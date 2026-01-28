document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('errorMessage');
    
    console.log('Form submitted with:', { email, password }); // Debug log
    
    try {
        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);
        
        console.log('Sending request to /auth/login'); // Debug log
        
        const response = await fetch('/auth/login', {
            method: 'POST',
            body: formData,
            redirect: 'manual' // Changed from 'follow' to 'manual'
        });

        console.log('Response status:', response.status); // Debug log
        console.log('Response headers:', response.headers.get('location')); // Debug log

        if (response.status === 302) {
            // Handle redirect manually
            const redirectUrl = response.headers.get('location');
            console.log('Redirecting to:', redirectUrl);
            window.location.href = redirectUrl;
        } else if (response.status === 401) {
            errorEl.textContent = 'Invalid email or password';
            errorEl.style.display = 'block';
        } else {
            errorEl.textContent = 'Login failed. Please try again.';
            errorEl.style.display = 'block';
        }
        
    } catch (error) {
        console.error('Login error:', error);
        errorEl.textContent = 'Network error. Please try again.';
        errorEl.style.display = 'block';
    }
});
