// Show section function
function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    document.querySelectorAll('.sidebar-menu a').forEach(link => {
        link.classList.remove('active');
    });
    
    document.getElementById(sectionId).classList.add('active');
    event.target.classList.add('active');
}

// Load profile data
async function loadProfile() {
    try {
        const response = await fetch('/settings/profile', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const profile = await response.json();
            document.getElementById('employee-id').textContent = profile.employee_id || '-';
            document.getElementById('full-name').textContent = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || '-';
            document.getElementById('profile-email').textContent = profile.email || '-';
            document.getElementById('profile-phone').textContent = profile.phone || '-';
            document.getElementById('profile-address').textContent = profile.address || '-';
            document.getElementById('profile-role').textContent = profile.role || '-';
            document.getElementById('profile-salary').textContent = profile.salary ? `$${profile.salary}` : '-';
            document.getElementById('profile-status').textContent = profile.is_active ? 'Active' : 'Inactive';
            
            // Pre-fill forms
            document.getElementById('phone-number').value = profile.phone || '';
            
            // Parse and pre-fill address fields
            if (profile.address) {
                const addressParts = profile.address.split(', ');
                document.getElementById('street').value = addressParts[0] || '';
                document.getElementById('city').value = addressParts[1] || '';
                document.getElementById('state').value = addressParts[2] || '';
                document.getElementById('zip').value = addressParts[3] || '';
            }
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Handle password change
async function handlePasswordChange(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (newPassword !== confirmPassword) {
        alert('New passwords do not match');
        return;
    }
    
    try {
        const response = await fetch('/settings/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                old_password: currentPassword,
                new_password: newPassword,
                confirm_password: confirmPassword
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert('Password changed successfully!');
            event.target.reset();
        } else {
            alert(result.detail || 'Error changing password');
        }
    } catch (error) {
        alert('Error changing password');
    }
}

// Handle phone update
async function handlePhoneUpdate(event) {
    event.preventDefault();
    
    const phone = document.getElementById('phone-number').value.trim();
    
    try {
        const response = await fetch('/settings/update-phone', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ phone: phone })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert('Phone number updated successfully!');
            document.getElementById('profile-phone').textContent = phone;
        } else {
            alert(result.detail || 'Error updating phone number');
        }
    } catch (error) {
        alert('Error updating phone number');
    }
}

// Handle address update
async function handleAddressUpdate(event) {
    event.preventDefault();
    
    const street = document.getElementById('street').value.trim();
    const city = document.getElementById('city').value.trim();
    const state = document.getElementById('state').value.trim();
    const zip = document.getElementById('zip').value.trim();
    const country = document.getElementById('country').value.trim();
    
    // Combine address fields
    const address = `${street}, ${city}, ${state} ${zip}, ${country}`.replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '');
    
    try {
        const response = await fetch('/settings/update-address', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ address: address })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert('Address updated successfully!');
            document.getElementById('profile-address').textContent = address;
        } else {
            alert(result.detail || 'Error updating address');
        }
    } catch (error) {
        alert('Error updating address');
    }
}

// Load profile on page load
document.addEventListener('DOMContentLoaded', loadProfile);