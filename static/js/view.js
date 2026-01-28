// Load employee details on page load
document.addEventListener('DOMContentLoaded', function() {
    loadEmployeeDetails();
});

// Extract employee ID from URL
function getEmployeeIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Load employee details from backend
async function loadEmployeeDetails() {
    const employeeId = getEmployeeIdFromUrl();
    
    if (!employeeId) {
        showError('Employee ID not found');
        return;
    }
    
    try {
        const response = await fetch(`/admin/all_employees`, {
            method: 'GET',
            credentials: 'include'
        });

        if (response.status === 401) {
            window.location.href = '/auth/login-page';
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const employees = await response.json();
        const employee = employees.find(emp => emp.id == employeeId);
        
        if (!employee) {
            showError('Employee not found');
            return;
        }
        
        displayEmployeeDetails(employee);
        
    } catch (error) {
        console.error('Error loading employee details:', error);
        showError('Failed to load employee details');
    }
}

// Display employee details in the card
function displayEmployeeDetails(employee) {
    // Generate initials from name
    const fullName = `${employee.first_name} ${employee.last_name}`;
    const initials = generateInitials(fullName);
    
    // Update profile section
    document.getElementById('profileImage').textContent = initials;
    document.getElementById('employeeName').textContent = fullName;
    document.getElementById('employeeId').textContent = employee.employee_id || 'N/A';
    
    // Update details section
    document.getElementById('department').textContent = employee.department_id || 'N/A';
    document.getElementById('role').textContent = employee.role || 'N/A';
    document.getElementById('contactNumber').textContent = employee.phone || 'N/A';
    document.getElementById('email').textContent = employee.email || 'N/A';
    document.getElementById('address').textContent = employee.address || 'N/A';
    document.getElementById('dateOfBirth').textContent = formatDate(employee.date_of_birth) || 'N/A';
    document.getElementById('salary').textContent = employee.salary ? `$${employee.salary}` : 'N/A';
    document.getElementById('status').textContent = employee.is_active ? 'Active' : 'Inactive';
    document.getElementById('createdAt').textContent = formatDateTime(employee.created_at) || 'N/A';
}

// Generate initials from full name
function generateInitials(name) {
    return name.split(' ').map(word => word[0]).join('').toUpperCase();
}

// Format date to readable format
function formatDate(dateString) {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

// Format datetime to readable format
function formatDateTime(dateTimeString) {
    if (!dateTimeString) return null;
    const date = new Date(dateTimeString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

// Show error message
function showError(message) {
    alert(message);
}

// Go back to employee list
function goBack() {
    window.location.href = '/admin/employee-list';
}