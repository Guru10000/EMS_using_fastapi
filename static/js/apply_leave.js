document.addEventListener('DOMContentLoaded', function() {
    const startDateInput = document.getElementById('start_date');
    const endDateInput = document.getElementById('end_date');
    const leaveForm = document.getElementById('leaveForm');
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    startDateInput.min = today;
    endDateInput.min = today;
    
    // Add event listeners for date changes
    startDateInput.addEventListener('change', updateLeaveSummary);
    endDateInput.addEventListener('change', updateLeaveSummary);
    
    // Handle form submission
    leaveForm.addEventListener('submit', handleFormSubmit);
});

function updateLeaveSummary() {
    const startDate = document.getElementById('start_date').value;
    const endDate = document.getElementById('end_date').value;
    const summaryDiv = document.getElementById('leave-summary');
    
    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (end >= start) {
            const timeDiff = end.getTime() - start.getTime();
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
            
            document.getElementById('leave-duration').textContent = `${daysDiff} ${daysDiff === 1 ? 'day' : 'days'}`;
            document.getElementById('summary-start').textContent = formatDate(startDate);
            document.getElementById('summary-end').textContent = formatDate(endDate);
            
            summaryDiv.style.display = 'block';
        } else {
            summaryDiv.style.display = 'none';
        }
    } else {
        summaryDiv.style.display = 'none';
    }
    
    // Update end date minimum
    if (startDate) {
        document.getElementById('end_date').min = startDate;
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    
    // Hide previous messages
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
    
    // Validate dates
    const startDate = new Date(formData.get('start_date'));
    const endDate = new Date(formData.get('end_date'));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (startDate < today) {
        showError('Start date cannot be in the past.');
        return;
    }
    
    if (endDate < startDate) {
        showError('End date cannot be before start date.');
        return;
    }
    
    try {
        const response = await fetch('/employee/apply-leave', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const result = await response.json();
            showSuccess(result);
        } else {
            const errorData = await response.json();
            showError(errorData.detail || 'Failed to submit leave application.');
        }
        
    } catch (error) {
        console.error('Error submitting leave application:', error);
        showError('Network error. Please try again.');
    }
}

function showSuccess(result) {
    const successMessage = document.getElementById('success-message');
    const successDetails = document.getElementById('success-details');
    
    successDetails.innerHTML = `
        <strong>Leave ID:</strong> ${result.leave_id}<br>
        <strong>Type:</strong> ${capitalizeFirst(result.leave_type)}<br>
        <strong>Duration:</strong> ${result.number_of_days} ${result.number_of_days === 1 ? 'day' : 'days'}<br>
        <strong>Status:</strong> ${capitalizeFirst(result.status)}
    `;
    
    successMessage.style.display = 'flex';
}

function showError(message) {
    const errorMessage = document.getElementById('error-message');
    const errorDetails = document.getElementById('error-details');
    
    errorDetails.textContent = message;
    errorMessage.style.display = 'flex';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function goBack() {
    window.location.href = '/employee/leave-page';
}

function viewMyLeaves() {
    window.location.href = '/employee/leave-page';
}