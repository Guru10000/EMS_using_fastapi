// Load employees on page load
document.addEventListener('DOMContentLoaded', function() {
    loadEmployees();
});

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
    const tbody = document.getElementById('employeeTableBody');
    tbody.innerHTML = '';

    if (employees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No employees found</td></tr>';
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
            <td>${employee.salary ? '$' + employee.salary : 'N/A'}</td>
            <td>
                <button class="salary-btn" onclick="viewSalary(${employee.id})">View Salary</button>
            </td>
        `;
        tbody.appendChild(row);
    });
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

function viewSalary(employeeId) {
    window.location.href = `/admin/employee-salary?id=${employeeId}`;
}

// Filter table based on search input
function filterTable() {
    const input = document.getElementById('searchInput');
    const filter = input.value.toLowerCase();
    const table = document.querySelector('.employee-table');
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