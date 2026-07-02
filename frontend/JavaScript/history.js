document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.getElementById('history-tbody');
    const searchInput = document.getElementById('history-search');
    const statusFilter = document.getElementById('status-filter');
    const selectAllCheckbox = document.getElementById('select-all');
    const btnDownloadSelected = document.getElementById('btn-download-selected');
    const btnDownloadAll = document.getElementById('btn-download-all');

    let historyData = [];
    let filteredData = [];

    // Base64 string for logo will be loaded asynchronously
    let logoBase64 = null;

    // Helper to fetch image and convert to base64
    function getBase64ImageFromURL(url) {
        return new Promise((resolve, reject) => {
            var img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => {
                var canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                var ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);
                var dataURL = canvas.toDataURL("image/jpeg");
                resolve(dataURL);
            };
            img.onerror = error => reject(error);
            img.src = url;
        });
    }

    // Preload logo
    getBase64ImageFromURL('/static/images/dsvv_logo.jpg')
        .then(base64 => { logoBase64 = base64; })
        .catch(err => console.error('Failed to load logo for PDF:', err));

    // Fetch history data
    async function fetchHistory() {
        try {
            const response = await fetch('/api/history/', {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            const data = await response.json();
            if (data.success) {
                historyData = data.history;
                applyFilters();
            } else {
                tbody.innerHTML = '<tr><td colspan="9" class="text-center text-danger">Failed to load history</td></tr>';
            }
        } catch (error) {
            console.error('Error fetching history:', error);
            tbody.innerHTML = '<tr><td colspan="9" class="text-center text-danger">Network error</td></tr>';
        }
    }

    function renderTable() {
        tbody.innerHTML = '';
        if (filteredData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center">No records found</td></tr>';
            return;
        }

        filteredData.forEach(record => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="checkbox-cell">
                    <input type="checkbox" class="record-checkbox" data-id="${record.id}">
                </td>
                <td>${record.scholar_id}</td>
                <td>${record.student_name}</td>
                <td>${record.start_date} ${record.start_time}</td>
                <td>${record.end_date} ${record.end_time}</td>
                <td>${record.purpose}</td>
                <td>${record.destination}</td>
                <td><span class="status-badge status-${record.status}">${record.status}</span></td>
                <td>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-action view-student-history-btn" data-scholar-id="${record.scholar_id}" title="View History">
                            <i class="fas fa-eye" style="color: var(--info);"></i> <span class="mobile-hide">View</span>
                        </button>
                        <button class="btn-action download-single-btn mobile-hide row-action-${record.id}" data-id="${record.id}" title="Download PDF">
                            <i class="fas fa-file-pdf" style="color: var(--primary-color);"></i> Download
                        </button>
                        <button class="btn-action mobile-only btn-more-actions" data-targets=".row-action-${record.id}">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Add event listeners to single download buttons
        document.querySelectorAll('.download-single-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const record = historyData.find(r => r.id == id);
                if (record) generatePDF([record], `Outpass_${record.scholar_id}_${record.start_date.replace(/\\//g, '-')}`);
            });
        });

        // Add event listeners to view buttons
        document.querySelectorAll('.view-student-history-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const scholarId = e.currentTarget.getAttribute('data-scholar-id');
                openStudentHistoryModal(scholarId);
            });
        });

        // Update select all state
        updateSelectAllState();
    }

    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        const statusTerm = statusFilter.value;

        filteredData = historyData.filter(record => {
            const matchesSearch = 
                record.scholar_id.toLowerCase().includes(searchTerm) ||
                record.student_name.toLowerCase().includes(searchTerm) ||
                record.destination.toLowerCase().includes(searchTerm);
            
            const matchesStatus = statusTerm === 'All' || record.status === statusTerm;
            
            return matchesSearch && matchesStatus;
        });

        renderTable();
    }

    function updateSelectAllState() {
        const checkboxes = document.querySelectorAll('.record-checkbox');
        const checkedBoxes = document.querySelectorAll('.record-checkbox:checked');
        
        if (checkboxes.length === 0) {
            selectAllCheckbox.checked = false;
        } else {
            selectAllCheckbox.checked = checkboxes.length === checkedBoxes.length;
        }
    }

    // Event Listeners
    searchInput.addEventListener('input', applyFilters);
    statusFilter.addEventListener('change', applyFilters);

    selectAllCheckbox.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        document.querySelectorAll('.record-checkbox').forEach(cb => {
            cb.checked = isChecked;
        });
    });

    tbody.addEventListener('change', (e) => {
        if (e.target.classList.contains('record-checkbox')) {
            updateSelectAllState();
        }
    });

    btnDownloadSelected.addEventListener('click', () => {
        const selectedIds = Array.from(document.querySelectorAll('.record-checkbox:checked')).map(cb => parseInt(cb.getAttribute('data-id')));
        if (selectedIds.length === 0) {
            alert('Please select at least one record to download.');
            return;
        }
        const selectedRecords = historyData.filter(r => selectedIds.includes(r.id));
        generatePDF(selectedRecords, 'Selected_Outpass_History');
    });

    btnDownloadAll.addEventListener('click', () => {
        if (historyData.length === 0) {
            alert('No records to download.');
            return;
        }
        generatePDF(filteredData, 'All_Outpass_History');
    });

    // Modal logic
    const studentHistoryModal = document.getElementById('student-history-modal');
    
    document.getElementById('btn-close-history-modal').addEventListener('click', () => {
        studentHistoryModal.classList.add('hidden');
    });
    
    document.getElementById('btn-close-history-modal-footer').addEventListener('click', () => {
        studentHistoryModal.classList.add('hidden');
    });

    async function openStudentHistoryModal(scholarId) {
        studentHistoryModal.classList.remove('hidden');
        document.getElementById('modal-student-name').textContent = 'Loading...';
        document.getElementById('modal-history-tbody').innerHTML = '<tr><td colspan="6" class="text-center">Loading...</td></tr>';
        
        try {
            const response = await fetch(`/api/student/${scholarId}/history/`);
            const data = await response.json();
            
            if (data.success) {
                document.getElementById('modal-student-name').textContent = data.student_name;
                document.getElementById('modal-total-requests').textContent = data.stats.total;
                document.getElementById('modal-approved').textContent = data.stats.approved;
                document.getElementById('modal-pending').textContent = data.stats.pending;
                document.getElementById('modal-rejected').textContent = data.stats.rejected;
                
                const tbody = document.getElementById('modal-history-tbody');
                tbody.innerHTML = '';
                
                if (data.history.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="6" class="text-center">No history found.</td></tr>';
                } else {
                    data.history.forEach(item => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>${item.start_date} to ${item.end_date}</td>
                            <td>${item.start_time} to ${item.end_time}</td>
                            <td>${item.purpose}</td>
                            <td>${item.destination}</td>
                            <td><span class="status-badge status-${item.status}">${item.status}</span></td>
                            <td>${item.reason || '-'}</td>
                        `;
                        tbody.appendChild(tr);
                    });
                }
            } else {
                alert('Failed to load student history: ' + data.message);
                studentHistoryModal.classList.add('hidden');
            }
        } catch (err) {
            console.error('Error fetching student history:', err);
            alert('Network error while fetching student history.');
            studentHistoryModal.classList.add('hidden');
        }
    }

    // PDF Generation using jsPDF and jspdf-autotable
    function generatePDF(dataRecords, filename) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape'); // Landscape for better table fit

        // Theme colors
        const primaryBlue = [30, 58, 138]; // rgb(30, 58, 138)
        const lightBlue = [239, 246, 255];

        // Add Header
        if (logoBase64) {
            doc.addImage(logoBase64, 'JPEG', 14, 10, 20, 20);
        }
        
        // System Name & College Info
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
        doc.text("Dev Sanskriti Vishwavidyalaya", 40, 20);
        
        doc.setFontSize(14);
        doc.setTextColor(100, 100, 100);
        doc.text("Student Outpass Management System - Outing History", 40, 28);

        // Date generated
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const generatedDate = new Date().toLocaleString();
        doc.text(`Generated on: ${generatedDate}`, 14, 38);

        // Prepare table data
        const head = [['Scholar ID', 'Name', 'Course', 'Sem', 'Start', 'End', 'Purpose', 'Destination', 'Status']];
        const body = dataRecords.map(r => [
            r.scholar_id,
            r.student_name,
            r.course,
            r.semester,
            `${r.start_date} ${r.start_time}`,
            `${r.end_date} ${r.end_time}`,
            r.purpose,
            r.destination,
            r.status
        ]);

        // Draw Table
        doc.autoTable({
            startY: 45,
            head: head,
            body: body,
            theme: 'grid',
            headStyles: {
                fillColor: primaryBlue,
                textColor: 255,
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: lightBlue
            },
            styles: {
                font: 'helvetica',
                fontSize: 9,
                cellPadding: 4
            },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 25 },
                1: { cellWidth: 35 },
                8: { fontStyle: 'bold' }
            },
            didParseCell: function (data) {
                if (data.section === 'body' && data.column.index === 8) {
                    // Color code status column
                    const status = data.cell.raw;
                    if (status === 'Approved') data.cell.styles.textColor = [6, 95, 70];
                    if (status === 'Pending') data.cell.styles.textColor = [146, 64, 14];
                    if (status === 'Rejected') data.cell.styles.textColor = [153, 27, 27];
                }
            }
        });

        // Add Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10, { align: 'right' });
            doc.text('Authorized Signatory / Warden', 14, doc.internal.pageSize.height - 10);
        }

        doc.save(`${filename}.pdf`);
    }

    // Initial fetch
    fetchHistory();
});
