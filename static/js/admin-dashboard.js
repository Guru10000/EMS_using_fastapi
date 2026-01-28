// Show selected section
function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');
}

// Logout function
function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    window.location.href = '/auth/login-page';
}

// Load dashboard stats on page load
document.addEventListener('DOMContentLoaded', function() {
    loadDashboardStats();
});

async function loadDashboardStats() {
    try {
        const response = await fetch('/admin/dashboard-stats', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const stats = await response.json();
            
            // Update the dashboard with real data
            document.getElementById('total-employees').textContent = stats.total_employees;
            document.getElementById('total-departments').textContent = stats.total_departments;
            document.getElementById('today-attendance').textContent = stats.today_attendance;
            document.getElementById('pending-leaves').textContent = stats.pending_leaves;
            
            // Calculate attendance percentage
            if (stats.total_employees > 0) {
                const percentage = Math.round((stats.today_attendance / stats.total_employees) * 100);
                document.getElementById('attendance-percentage').textContent = `${percentage}% present`;
            }
        } else {
            console.error('Failed to load dashboard stats');
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}