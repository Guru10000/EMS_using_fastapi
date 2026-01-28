// Load employees on page load
document.addEventListener('DOMContentLoaded', function() {
    loadEmployees();
    updateCurrentDate();
});

// Update current date display
function updateCurrentDate() {
    const today = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    document.getElementById('currentDate').textContent = today.toLocaleDateString('en-US', options);
}

// Load employees from backend
async function loadEmployees() {
    try {
        const response = await fetch('/admin/all_employees', {
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
        displayEmployees(employees);
        
    } catch (error) {
        console.error('Error loading employees:', error);
        showError('Failed to load employees');
    }
}

// Display employees in table
function displayEmployees(employees) {
    const tbody = document.getElementById('attendanceTableBody');
    tbody.innerHTML = '';

    if (employees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No employees found</td></tr>';
        return;
    }

    employees.forEach((employee, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${employee.employee_id || 'N/A'}</td>
            <td>${employee.first_name} ${employee.last_name}</td>
            <td>${employee.department_id || 'N/A'}</td>
            <td>${employee.role || 'N/A'}</td>
            <td>
                <div class="attendance-buttons">
                    <button class="attendance-btn present-btn" onclick="markAttendance('${employee.employee_id}', 'present')">Present</button>
                    <button class="attendance-btn absent-btn" onclick="markAttendance('${employee.employee_id}', 'absent')">Absent</button>
                    <button class="attendance-btn late-btn" onclick="markAttendance('${employee.employee_id}', 'late')">Late</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Mark attendance for employee
async function markAttendance(employeeId, status) {
    try {
        const formData = new FormData();
        formData.append('employee_id', employeeId);
        formData.append('status', status);

        const response = await fetch('/admin/update_attendance', {
            method: 'POST',
            credentials: 'include',
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            showSuccess(`Attendance marked as ${status.toUpperCase()} successfully!`);
            // Update the button states for this employee
            updateButtonStates(employeeId, status);
        } else {
            showError(result.detail || 'Failed to mark attendance');
        }
        
    } catch (error) {
        console.error('Error marking attendance:', error);
        showError('Failed to mark attendance');
    }
}

// Update button states after marking attendance
function updateButtonStates(employeeId, status) {
    const rows = document.querySelectorAll('#attendanceTableBody tr');
    rows.forEach(row => {
        const cells = row.getElementsByTagName('td');
        if (cells.length > 1 && cells[1].textContent === employeeId) {
            const buttons = row.querySelectorAll('.attendance-btn');
            buttons.forEach(btn => {
                btn.disabled = false;
                btn.style.opacity = '1';
            });
            
            // Highlight the selected status
            const selectedBtn = row.querySelector(`.${status}-btn`);
            if (selectedBtn) {
                selectedBtn.style.opacity = '0.7';
                selectedBtn.disabled = true;
            }
        }
    });
}

function showSuccess(message) {
    alert(message);
}

function showError(message) {
    alert(message);
}

function goBack() {
    window.location.href = '/admin/admin-dashboard';
}

function logout() {
    window.location.href = '/auth/login-page';
}

// Filter table based on search input
function filterTable() {
    const input = document.getElementById('searchInput');
    const filter = input.value.toLowerCase();
    const table = document.querySelector('.attendance-table');
    const rows = table.getElementsByTagName('tr');

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const cells = row.getElementsByTagName('td');
        let found = false;

        for (let j = 0; j < cells.length - 1; j++) {
            const cellText = cells[j].textContent || cells[j].innerText;
            if (cellText.toLowerCase().indexOf(filter) > -1) {
                found = true;
                break;
            }
        }

        row.style.display = found ? '' : 'none';
    }
}