// Show selected section
function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    // Remove active class from all sidebar links
    const links = document.querySelectorAll('.sidebar-menu a');
    links.forEach(link => {
        link.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
    }
    
    // Add active class to clicked link
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

// Logout function
function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    window.location.href = '/auth/login-page';
}

// Load employee dashboard stats on page load
document.addEventListener('DOMContentLoaded', function() {
    loadEmployeeStats();
});

async function loadEmployeeStats() {
    try {
        const response = await fetch('/employee/dashboard-stats', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const stats = await response.json();
            
            // Update the dashboard with employee data
            document.getElementById('employee-status').textContent = stats.employee_status || 'Unknown';
            document.getElementById('my-attendance').textContent = `${stats.monthly_attendance} days`;
            document.getElementById('leave-balance').textContent = `${stats.leave_balance} days`;
            document.getElementById('current-salary').textContent = stats.current_salary ? `$${formatCurrency(stats.current_salary)}` : 'N/A';
            
        } else {
            console.error('Failed to load employee stats');
            setFallbackValues();
        }
    } catch (error) {
        console.error('Error loading employee stats:', error);
        setFallbackValues();
    }
}

function setFallbackValues() {
    document.getElementById('employee-status').textContent = 'Unknown';
    document.getElementById('my-attendance').textContent = 'N/A';
    document.getElementById('leave-balance').textContent = 'N/A';
    document.getElementById('current-salary').textContent = 'N/A';
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}