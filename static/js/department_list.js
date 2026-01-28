// Load departments on page load
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
        displayDepartments(departments);
        
    } catch (error) {
        console.error('Error loading departments:', error);
        showError('Failed to load departments');
    }
}

// Display departments in table
function displayDepartments(departments) {
    const tbody = document.getElementById('departmentTableBody');
    tbody.innerHTML = '';

    if (departments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No departments found</td></tr>';
        return;
    }

    departments.forEach((department, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${department.id}</td>
            <td>${department.department_name}</td>
            <td>
                <button class="view-btn" onclick="viewDepartment('${department.department_name}')">View</button>
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

function viewDepartment(departmentName) {
    window.location.href = `/admin/dep_team?department=${encodeURIComponent(departmentName)}`;
}

function createNewDepartment() {
    window.location.href = '/admin/create-department';
}

// Filter table based on search input
function filterTable() {
    const input = document.getElementById('searchInput');
    const filter = input.value.toLowerCase();
    const table = document.querySelector('.department-table');
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