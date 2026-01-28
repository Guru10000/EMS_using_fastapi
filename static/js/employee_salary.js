// Load employee salary details on page load
document.addEventListener('DOMContentLoaded', function () {
    loadEmployeeSalaryDetails();
});

// Extract employee ID from URL
function getEmployeeIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Load employee salary details
async function loadEmployeeSalaryDetails() {
    const employeeId = getEmployeeIdFromUrl();

    if (!employeeId) {
        showError('Employee ID not found');
        return;
    }

    try {
        // First get employee details
        const employeeResponse = await fetch('/admin/all_employees', {
            method: 'GET',
            credentials: 'include'
        });

        if (employeeResponse.status === 401) {
            window.location.href = '/auth/login-page';
            return;
        }

        if (!employeeResponse.ok) {
            throw new Error(`HTTP error! status: ${employeeResponse.status}`);
        }

        const employees = await employeeResponse.json();
        const employee = employees.find(emp => emp.id == employeeId);

        if (!employee) {
            showError('Employee not found');
            return;
        }

        // Update page title with employee info
        document.getElementById('employeeTitle').textContent = `${employee.first_name} ${employee.last_name} - Salary Details`;
        document.getElementById('employeeSubtitle').textContent = `Employee ID: ${employee.employee_id}`;

        console.log('Employee found:', employee);
        console.log('Employee ID for salary query:', employee.employee_id);

        // Load salary details
        const salaryResponse = await fetch(`/admin/employee_fulsalary?employee_id=${employee.employee_id}`, {
            method: 'GET',
            credentials: 'include'
        });

        console.log('Salary API URL:', `/admin/employee_fulsalary?employee_id=${employee.employee_id}`);
        console.log('Salary response status:', salaryResponse.status);

        if (salaryResponse.status === 401) {
            window.location.href = '/auth/login-page';
            return;
        }

        if (!salaryResponse.ok) {
            const errorText = await salaryResponse.text();
            console.error('Salary API Error:', errorText);
            throw new Error(`HTTP error! status: ${salaryResponse.status}`);
        }

        const contentType = salaryResponse.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const responseText = await salaryResponse.text();
            console.error('Non-JSON response:', responseText);
            throw new Error('Server returned non-JSON response');
        }

        const salaries = await salaryResponse.json();
        displaySalaries(salaries);

    } catch (error) {
        console.error('Error loading employee salary details:', error);
        showError('Failed to load salary details');
    }
}

// Display salaries in table
function displaySalaries(salaries) {
    const tbody = document.getElementById('salaryTableBody');
    tbody.innerHTML = '';

    if (salaries.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No salary records found</td></tr>';
        return;
    }

    salaries.forEach((salary, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${salary.month}</td>
            <td class="salary-amount">$${salary.basic_salary}</td>
            <td class="deduction-amount">$${salary.deduction}</td>
            <td class="salary-amount">$${salary.net_salary}</td>
        `;
        tbody.appendChild(row);
    });
}

function showError(message) {
    alert(message);
}

function goBack() {
    window.location.href = '/admin/salary-list';
}



function logout() {
    window.location.href = '/auth/login-page';
}

function addSalary() {
    const employeeId = getEmployeeIdFromUrl();
    if (employeeId) {
        window.location.href = `/admin/add-new-salary?employee_id=${employeeId}`;
    } else {
        alert('Employee ID not found');
    }
}

// Filter table based on search input
function filterTable() {
    const input = document.getElementById('searchInput');
    const filter = input.value.toLowerCase();
    const table = document.querySelector('.salary-table');
    const rows = table.getElementsByTagName('tr');

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const cells = row.getElementsByTagName('td');
        let found = false;

        for (let j = 0; j < cells.length; j++) {
            const cellText = cells[j].textContent || cells[j].innerText;
            if (cellText.toLowerCase().indexOf(filter) > -1) {
                found = true;
                break;
            }
        }

        row.style.display = found ? '' : 'none';
    }
}