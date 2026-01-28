document.addEventListener('DOMContentLoaded', function() {
    loadProfile();
});

async function loadProfile() {
    const loadingOverlay = document.getElementById('loading-overlay');
    const errorMessage = document.getElementById('error-message');
    
    try {
        loadingOverlay.style.display = 'flex';
        errorMessage.style.display = 'none';
        
        const response = await fetch('/employee/profile', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const profileData = await response.json();
        displayProfile(profileData);
        
    } catch (error) {
        console.error('Error loading profile:', error);
        loadingOverlay.style.display = 'none';
        errorMessage.style.display = 'block';
    } finally {
        loadingOverlay.style.display = 'none';
    }
}

function displayProfile(data) {
    // Generate initials for avatar
    const initials = generateInitials(data.first_name, data.last_name);
    document.getElementById('avatar-initials').textContent = initials;
    
    // Display name and basic info
    document.getElementById('full-name').textContent = `${data.first_name} ${data.last_name}`;
    document.getElementById('employee-role').textContent = capitalizeFirst(data.role);
    
    // Status badge
    const statusBadge = document.getElementById('status-badge');
    if (data.is_active) {
        statusBadge.textContent = 'Active';
        statusBadge.classList.remove('inactive');
    } else {
        statusBadge.textContent = 'Inactive';
        statusBadge.classList.add('inactive');
    }
    
    // Personal information
    document.getElementById('employee-id').textContent = data.employee_id || 'Not provided';
    document.getElementById('email').textContent = data.email || 'Not provided';
    document.getElementById('phone').textContent = data.phone || 'Not provided';
    document.getElementById('address').textContent = data.address || 'Not provided';
    
    // Employment details
    document.getElementById('role').textContent = capitalizeFirst(data.role) || 'Not specified';
    document.getElementById('salary').textContent = data.salary ? `$${formatNumber(data.salary)}` : 'Not disclosed';
    document.getElementById('created-at').textContent = formatDate(data.created_at) || 'Not available';
    document.getElementById('updated-at').textContent = formatDate(data.updated_at) || 'Not available';
}

function generateInitials(firstName, lastName) {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last || 'NA';
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function formatNumber(num) {
    return new Intl.NumberFormat('en-US').format(num);
}

function formatDate(dateString) {
    if (!dateString) return 'Not available';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        return 'Invalid date';
    }
}

function goBack() {
    // Navigate back to employee dashboard
    window.location.href = '/employee/employee-dashboard';
}