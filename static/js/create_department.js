// Handle form submission
document.getElementById('departmentForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const departmentData = {
        department_name: formData.get('department_name'),
        description: formData.get('description') || null
    };

    try {
        const response = await fetch('/admin/departments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(departmentData)
        });

        if (response.status === 401) {
            window.location.href = '/auth/login-page';
            return;
        }

        const result = await response.json();

        if (response.ok) {
            showSuccess('Department created successfully!');
            setTimeout(() => {
                window.location.href = '/admin/department-list';
            }, 2000);
        } else {
            showError(result.detail || 'Failed to create department');
        }
        
    } catch (error) {
        console.error('Error creating department:', error);
        showError('Failed to create department');
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

// Go back to department list
function goBack() {
    window.location.href = '/admin/department-list';
}