// Load employee info on page load
document.addEventListener('DOMContentLoaded', function() {
    loadEmployeeInfo();
    setupCalculations();
});

// Get employee ID from URL parameter
function getEmployeeIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('employee_id');
}

// Load employee information
async function loadEmployeeInfo() {
    const employeeId = getEmployeeIdFromUrl();
    
    if (!employeeId) {
        document.getElementById('employeeInfo').textContent = 'No employee ID provided';
        return;
    }

    document.getElementById('employee_id').value = employeeId;

    try {
        const response = await fetch('/admin/all_employees', {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const employees = await response.json();
            const employee = employees.find(emp => emp.id == employeeId);
            
            if (employee) {
                document.getElementById('employeeInfo').textContent = 
                    `Adding salary for: ${employee.first_name} ${employee.last_name} (${employee.employee_id})`;
                document.getElementById('employee_id').value = employee.employee_id;
            } else {
                document.getElementById('employeeInfo').textContent = 'Employee not found';
            }
        }
    } catch (error) {
        console.error('Error loading employee info:', error);
        document.getElementById('employeeInfo').textContent = `Employee ID: ${employeeId}`;
    }
}

// Setup automatic net salary calculation
function setupCalculations() {
    const basicSalaryInput = document.getElementById('basic_salary');
    const deductionInput = document.getElementById('deduction');
    const netSalaryInput = document.getElementById('net_salary');

    function calculateNetSalary() {
        const basicSalary = parseFloat(basicSalaryInput.value) || 0;
        const deduction = parseFloat(deductionInput.value) || 0;
        const netSalary = basicSalary - deduction;
        netSalaryInput.value = netSalary.toFixed(2);
    }

    basicSalaryInput.addEventListener('input', calculateNetSalary);
    deductionInput.addEventListener('input', calculateNetSalary);
}

// Handle form submission
document.getElementById('salaryForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    
    try {
        const response = await fetch('/admin/add_salary', {
            method: 'POST',
            credentials: 'include',
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            alert('Salary added successfully!');
            goBack();
        } else {
            alert(result.detail || 'Failed to add salary');
        }
        
    } catch (error) {
        console.error('Error adding salary:', error);
        alert('Failed to add salary');
    }
});

// Go back to employee salary page
function goBack() {
    const employeeId = getEmployeeIdFromUrl();
    if (employeeId) {
        window.location.href = `/admin/employee-salary?id=${employeeId}`;
    } else {
        window.location.href = '/admin/salary-list';
    }
}