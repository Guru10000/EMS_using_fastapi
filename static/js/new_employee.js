// Load departments and handle form submission
document.addEventListener('DOMContentLoaded', function() {
    loadDepartments();
});

// Load departments from backend
async function loadDepartments() {
    try {
        const response = await fetch('/admin/all_departments', {
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

        const departments = await response.json();
        populateDepartments(departments);
        
    } catch (error) {
        console.error('Error loading departments:', error);
        showError('Failed to load departments');
    }
}

// Populate department dropdown
function populateDepartments(departments) {
    const departmentSelect = document.getElementById('department_name');
    
    departments.forEach(department => {
        const option = document.createElement('option');
        option.value = department.department_name;
        option.textContent = department.department_name;
        departmentSelect.appendChild(option);
    });
}

// Handle form submission
document.getElementById('employeeForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const employeeData = {
        employee_id: formData.get('employee_id'),
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        department_name: formData.get('department_name'),
        salary: formData.get('salary') ? parseFloat(formData.get('salary')) : null,
        is_active: formData.get('is_active') === 'true',
        address: formData.get('address'),
        date_of_birth: formData.get('date_of_birth'),
        role: formData.get('role'),
        password: formData.get('password')
    };

    try {
        const response = await fetch('/admin/employees', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(employeeData)
        });

        if (response.status === 401) {
            window.location.href = '/auth/login-page';
            return;
        }

        const result = await response.json();

        if (response.ok) {
            showSuccess('Employee created successfully!');
            setTimeout(() => {
                window.location.href = '/admin/employee-list';
            }, 2000);
        } else {
            showError(result.detail || 'Failed to create employee');
        }
        
    } catch (error) {
        console.error('Error creating employee:', error);
        showError('Failed to create employee');
    }
});

// Show success message
function showSuccess(message) {
    alert(message);
}

// Show error message
function showError(message) {
    alert(message);
}

// Go back to employee list
function goBack() {
    window.location.href = '/admin/employee-list';
}