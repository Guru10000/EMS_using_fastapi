// Load report on page load
document.addEventListener('DOMContentLoaded', function() {
    setDefaultDates();
    generateReport();
});

// Set default dates (last 30 days)
function setDefaultDates() {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    document.getElementById('endDate').value = today.toISOString().split('T')[0];
    document.getElementById('startDate').value = thirtyDaysAgo.toISOString().split('T')[0];
}

// Generate attendance report
async function generateReport() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!startDate || !endDate) {
        alert('Please select both start and end dates');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        alert('Start date cannot be after end date');
        return;
    }
    
    try {
        // Show loading state
        document.getElementById('reportSummary').textContent = 'Loading report...';
        document.getElementById('reportTableBody').innerHTML = '<tr><td colspan="6" class="loading">Loading attendance data...</td></tr>';
        
        const response = await fetch(`/admin/attendance_report?start_date=${startDate}&end_date=${endDate}`, {
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

        const reportData = await response.json();
        displayReport(reportData);
        
    } catch (error) {
        console.error('Error generating report:', error);
        showError('Failed to generate attendance report');
    }
}

// Display report data
function displayReport(reportData) {
    const tbody = document.getElementById('reportTableBody');
    tbody.innerHTML = '';
    
    // Update summary
    document.getElementById('reportSummary').textContent = 
        `Report from ${formatDate(reportData.start_date)} to ${formatDate(reportData.end_date)} - Total Records: ${reportData.total_records}`;
    
    if (reportData.attendance_data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No attendance records found for the selected date range</td></tr>';
        return;
    }

    reportData.attendance_data.forEach((record, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${record.employee_id}</td>
            <td>${record.employee_name}</td>
            <td>${record.department_id || 'N/A'}</td>
            <td>${formatDate(record.date)}</td>
            <td><span class="status-${record.status}">${record.status.toUpperCase()}</span></td>
        `;
        tbody.appendChild(row);
    });
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Export report (basic implementation)
function exportReport() {
    const table = document.querySelector('.report-table');
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Attendance Report (${startDate} to ${endDate})\\n\\n`;
    csvContent += "S.No,Employee ID,Employee Name,Department,Date,Status\\n";
    
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 1) { // Skip loading/empty state rows
            const rowData = Array.from(cells).map(cell => {
                // Clean up status cell content
                const text = cell.textContent.trim();
                return text.includes(',') ? `"${text}"` : text;
            }).join(',');
            csvContent += rowData + "\\n";
        }
    });
    
    // Download CSV
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function showError(message) {
    alert(message);
    document.getElementById('reportSummary').textContent = 'Error loading report';
    document.getElementById('reportTableBody').innerHTML = 
        `<tr><td colspan="6" class="empty-state">${message}</td></tr>`;
}

function goBack() {
    window.location.href = '/admin/admin-dashboard';
}

function logout() {
    window.location.href = '/auth/login-page';
}