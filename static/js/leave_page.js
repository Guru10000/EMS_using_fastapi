document.addEventListener('DOMContentLoaded', function() {
    loadLeaves();
});

async function loadLeaves() {
    const loadingOverlay = document.getElementById('loading-overlay');
    const errorMessage = document.getElementById('error-message');
    const emptyState = document.getElementById('empty-state');
    const tableWrapper = document.querySelector('.table-wrapper');
    
    try {
        loadingOverlay.style.display = 'flex';
        errorMessage.style.display = 'none';
        emptyState.style.display = 'none';
        
        const response = await fetch('/employee/my-leaves', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const leaveData = await response.json();
        displayLeaves(leaveData);
        
    } catch (error) {
        console.error('Error loading leaves:', error);
        loadingOverlay.style.display = 'none';
        errorMessage.style.display = 'block';
        tableWrapper.style.display = 'none';
    } finally {
        loadingOverlay.style.display = 'none';
    }
}

function displayLeaves(data) {
    const employeeIdElement = document.getElementById('employee-id');
    const totalApplicationsElement = document.getElementById('total-applications');
    const tbody = document.getElementById('leaves-tbody');
    const emptyState = document.getElementById('empty-state');
    const tableWrapper = document.querySelector('.table-wrapper');
    
    // Update header information
    employeeIdElement.textContent = `Employee ID: ${data.employee_id}`;
    totalApplicationsElement.textContent = `Total Applications: ${data.total_applications}`;
    
    // Clear existing table data
    tbody.innerHTML = '';
    
    if (data.leaves && data.leaves.length > 0) {
        // Show table and hide empty state
        tableWrapper.style.display = 'block';
        emptyState.style.display = 'none';
        
        // Populate table with leave data
        data.leaves.forEach(leave => {
            const row = createLeaveRow(leave);
            tbody.appendChild(row);
        });
    } else {
        // Show empty state and hide table
        tableWrapper.style.display = 'none';
        emptyState.style.display = 'block';
    }
}

function createLeaveRow(leave) {
    const row = document.createElement('tr');
    
    row.innerHTML = `
        <td>${leave.id}</td>
        <td><span class="leave-type">${capitalizeFirst(leave.leave_type)}</span></td>
        <td>${formatDate(leave.start_date)}</td>
        <td>${formatDate(leave.end_date)}</td>
        <td>${leave.days} ${leave.days === 1 ? 'day' : 'days'}</td>
        <td><span class="status-badge status-${leave.status}">${capitalizeFirst(leave.status)}</span></td>
        <td>${leave.reason || 'No reason provided'}</td>
    `;
    
    return row;
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
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

function applyForLeave() {
    // Navigate to apply leave page
    window.location.href = '/employee/apply-leave-page';
}