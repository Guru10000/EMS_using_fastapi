console.log('Leave list JavaScript loaded!');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, calling loadLeaves()');
    loadLeaves();
});

async function loadLeaves() {
    console.log('loadLeaves() called');
    try {
        const response = await fetch('/admin/leaves', {
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

        const leaves = await response.json();
        console.log('Leaves received:', leaves);
        
        const employeeResponse = await fetch('/admin/all_employees', {
            method: 'GET',
            credentials: 'include'
        });
        
        const employees = employeeResponse.ok ? await employeeResponse.json() : [];
        console.log('Employees received:', employees);
        
        displayLeaves(leaves, employees);
        
    } catch (error) {
        console.error('Error loading leaves:', error);
        showError('Failed to load leave applications');
    }
}

function displayLeaves(leaves, employees) {
    console.log('displayLeaves called with:', leaves, employees);
    const tbody = document.getElementById('leaveTableBody');
    tbody.innerHTML = '';
    
    const pendingCount = leaves.filter(leave => leave.status === 'pending').length;
    document.getElementById('leaveSummary').textContent = 
        `Total Applications: ${leaves.length} | Pending: ${pendingCount}`;

    if (leaves.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty-state">No leave applications found</td></tr>';
        return;
    }

    leaves.forEach((leave, index) => {
        console.log('Processing leave:', leave);
        
        const employee = employees.find(emp => emp.employee_id === leave.employee_id) || {};
        console.log('Found employee:', employee);
        
        const employeeName = employee.first_name && employee.last_name 
            ? `${employee.first_name} ${employee.last_name}` 
            : 'Unknown';
        const employeeId = employee.employee_id || 'N/A';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${employeeId}</td>
            <td>${employeeName}</td>
            <td>${leave.leave_type || 'N/A'}</td>
            <td>${formatDate(leave.start_date)}</td>
            <td>${formatDate(leave.end_date)}</td>
            <td class="reason-cell">${leave.reason || 'No reason provided'}</td>
            <td><span class="status-${leave.status}">${leave.status.toUpperCase()}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn approve-btn" 
                            onclick="approveLeave(${leave.id})" 
                            ${leave.status !== 'pending' ? 'disabled' : ''}>
                        Approve
                    </button>
                    <button class="action-btn reject-btn" 
                            onclick="rejectLeave(${leave.id})" 
                            ${leave.status !== 'pending' ? 'disabled' : ''}>
                        Reject
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function approveLeave(leaveId) {
    if (!confirm('Are you sure you want to approve this leave application?')) {
        return;
    }
    
    try {
        const response = await fetch(`/admin/leaves/${leaveId}/approve`, {
            method: 'PUT',
            credentials: 'include'
        });

        const result = await response.json();

        if (response.ok) {
            showSuccess('Leave approved successfully!');
            updateLeaveStatus(leaveId, 'approved');
        } else {
            showError(result.detail || 'Failed to approve leave');
        }
        
    } catch (error) {
        console.error('Error approving leave:', error);
        showError('Failed to approve leave');
    }
}

async function rejectLeave(leaveId) {
    if (!confirm('Are you sure you want to reject this leave application?')) {
        return;
    }
    
    try {
        const response = await fetch(`/admin/leaves/${leaveId}/reject`, {
            method: 'PUT',
            credentials: 'include'
        });

        const result = await response.json();

        if (response.ok) {
            showSuccess('Leave rejected successfully!');
            updateLeaveStatus(leaveId, 'rejected');
        } else {
            showError(result.detail || 'Failed to reject leave');
        }
        
    } catch (error) {
        console.error('Error rejecting leave:', error);
        showError('Failed to reject leave');
    }
}

function updateLeaveStatus(leaveId, newStatus) {
    const rows = document.querySelectorAll('#leaveTableBody tr');
    rows.forEach(row => {
        const buttons = row.querySelectorAll('button');
        if (buttons.length >= 2) {
            const approveBtn = buttons[0];
            const rejectBtn = buttons[1];
            
            if (approveBtn.onclick && approveBtn.onclick.toString().includes(leaveId)) {
                // Update status cell
                const statusCell = row.cells[7];
                statusCell.innerHTML = `<span class="status-${newStatus}">${newStatus.toUpperCase()}</span>`;
                
                // Disable both buttons
                approveBtn.disabled = true;
                rejectBtn.disabled = true;
                
                // Update button appearance
                if (newStatus === 'approved') {
                    approveBtn.textContent = 'Approved';
                    approveBtn.style.backgroundColor = '#059669';
                } else if (newStatus === 'rejected') {
                    rejectBtn.textContent = 'Rejected';
                    rejectBtn.style.backgroundColor = '#dc2626';
                }
            }
        }
    });
}

function filterByStatus() {
    const filter = document.getElementById('statusFilter').value;
    const rows = document.querySelectorAll('#leaveTableBody tr');
    
    rows.forEach(row => {
        if (row.cells.length > 1) {
            const statusCell = row.cells[7];
            const status = statusCell.textContent.toLowerCase().trim();
            
            if (filter === 'all' || status === filter) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        }
    });
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showSuccess(message) {
    alert(message);
}

function showError(message) {
    alert(message);
    document.getElementById('leaveSummary').textContent = 'Error loading leave applications';
    document.getElementById('leaveTableBody').innerHTML = 
        `<tr><td colspan="9" class="empty-state">${message}</td></tr>`;
}

function goBack() {
    window.location.href = '/admin/admin-dashboard';
}

function logout() {
    window.location.href = '/auth/login-page';
}