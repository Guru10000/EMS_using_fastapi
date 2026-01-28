document.addEventListener('DOMContentLoaded', function() {
    loadSalaries();
});

async function loadSalaries() {
    const loadingOverlay = document.getElementById('loading-overlay');
    const errorMessage = document.getElementById('error-message');
    const emptyState = document.getElementById('empty-state');
    const tableWrapper = document.querySelector('.table-wrapper');
    const summaryCard = document.querySelector('.summary-card');
    
    try {
        loadingOverlay.style.display = 'flex';
        errorMessage.style.display = 'none';
        emptyState.style.display = 'none';
        
        const response = await fetch('/employee/my-salaries', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const salaryData = await response.json();
        displaySalaries(salaryData);
        
    } catch (error) {
        console.error('Error loading salaries:', error);
        loadingOverlay.style.display = 'none';
        errorMessage.style.display = 'block';
        tableWrapper.style.display = 'none';
        summaryCard.style.display = 'none';
    } finally {
        loadingOverlay.style.display = 'none';
    }
}

function displaySalaries(data) {
    const employeeIdElement = document.getElementById('employee-id');
    const totalRecordsElement = document.getElementById('total-records');
    const tbody = document.getElementById('salary-tbody');
    const emptyState = document.getElementById('empty-state');
    const tableWrapper = document.querySelector('.table-wrapper');
    const summaryCard = document.querySelector('.summary-card');
    
    // Update header information
    employeeIdElement.textContent = `Employee ID: ${data.employee_id}`;
    totalRecordsElement.textContent = `Total Records: ${data.total_salaries}`;
    
    // Clear existing table data
    tbody.innerHTML = '';
    
    if (data.salaries && data.salaries.length > 0) {
        // Show table and summary, hide empty state
        tableWrapper.style.display = 'block';
        summaryCard.style.display = 'block';
        emptyState.style.display = 'none';
        
        let totalBasic = 0;
        let totalDeductions = 0;
        let totalNet = 0;
        
        // Populate table with salary data
        data.salaries.forEach((salary, index) => {
            const row = createSalaryRow(salary, index + 1);
            tbody.appendChild(row);
            
            // Calculate totals
            totalBasic += salary.basic_salary;
            totalDeductions += salary.deduction;
            totalNet += salary.net_salary;
        });
        
        // Update summary
        updateSummary(totalBasic, totalDeductions, totalNet);
        
    } else {
        // Show empty state and hide table/summary
        tableWrapper.style.display = 'none';
        summaryCard.style.display = 'none';
        emptyState.style.display = 'block';
    }
}

function createSalaryRow(salary, serialNo) {
    const row = document.createElement('tr');
    
    row.innerHTML = `
        <td>${serialNo}</td>
        <td><span class="month-badge">${formatMonth(salary.month)}</span></td>
        <td class="salary-amount">$${formatCurrency(salary.basic_salary)}</td>
        <td class="deduction-amount">$${formatCurrency(salary.deduction)}</td>
        <td class="net-salary">$${formatCurrency(salary.net_salary)}</td>
    `;
    
    return row;
}

function updateSummary(totalBasic, totalDeductions, totalNet) {
    document.getElementById('total-basic').textContent = `$${formatCurrency(totalBasic)}`;
    document.getElementById('total-deductions').textContent = `$${formatCurrency(totalDeductions)}`;
    document.getElementById('total-net').textContent = `$${formatCurrency(totalNet)}`;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

function formatMonth(monthString) {
    if (!monthString) return 'N/A';
    
    try {
        // Assuming format is YYYY-MM
        const [year, month] = monthString.split('-');
        const date = new Date(year, month - 1);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short'
        });
    } catch (error) {
        return monthString;
    }
}

function goBack() {
    // Navigate back to employee dashboard
    window.location.href = '/employee/employee-dashboard';
}