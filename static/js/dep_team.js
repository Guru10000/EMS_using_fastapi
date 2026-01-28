// Load department employees on page load
document.addEventListener('DOMContentLoaded', function() {
    loadDepartmentEmployees();
});

// Extract department name from URL
function getDepartmentNameFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('department');
}

// Load employees from specific department
async function loadDepartmentEmployees() {
    const departmentName = getDepartmentNameFromUrl();
    
    if (!departmentName) {
        showError('Department name not found');
        return;
    }

    // Update page title
    document.getElementById('departmentTitle').textContent = `${departmentName} Department`;
    document.getElementById('departmentSubtitle').textContent = `Team members in ${departmentName} department`;
    
    try {
        const response = await fetch(`/admin/department/${encodeURIComponent(departmentName)}/employees`, {
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
        displayEmployees(employees, departmentName);
        
    } catch (error) {
        console.error('Error loading department employees:', error);
        showError('Failed to load department employees');
    }
}

// Display employees in table
function displayEmployees(employees, departmentName) {
    const tbody = document.getElementById('employeeTableBody');
    tbody.innerHTML = '';

    if (employees.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center;">No employees found in ${departmentName} department</td></tr>`;
        return;
    }

    employees.forEach((employee, index) => {
        const row = document.createElement('tr');
        const statusClass = employee.is_active ? 'status-active' : 'status-inactive';
        const statusText = employee.is_active ? 'Active' : 'Inactive';
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${employee.employee_id || 'N/A'}</td>
            <td>${employee.first_name} ${employee.last_name}</td>
            <td>${employee.role || 'N/A'}</td>
            <td>${employee.phone || 'N/A'}</td>
            <td>${employee.email || 'N/A'}</td>
            <td><span class="${statusClass}">${statusText}</span></td>
            <td>
                <button class="view-btn" onclick="viewEmployee(${employee.id})">View</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function showError(message) {
    alert(message);
}

function goBack() {
    window.location.href = '/admin/department-list';
}

function logout() {
    window.location.href = '/auth/login-page';
}

function viewEmployee(employeeId) {
    window.location.href = `/admin/view_employee?id=${employeeId}`;
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