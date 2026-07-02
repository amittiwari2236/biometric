document.addEventListener('DOMContentLoaded', () => {
    // Mobile Sidebar Toggle
    const btnMobileMenu = document.getElementById('btn-mobile-menu');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const btnCloseSidebar = document.getElementById('btn-close-sidebar');

    function closeSidebar() {
        if(sidebar) sidebar.classList.remove('active');
        if(sidebarOverlay) sidebarOverlay.classList.remove('active');
    }

    if (btnMobileMenu && sidebar && sidebarOverlay) {
        btnMobileMenu.addEventListener('click', () => {
            sidebar.classList.add('active');
            sidebarOverlay.classList.add('active');
        });

        sidebarOverlay.addEventListener('click', closeSidebar);
        
        if (btnCloseSidebar) {
            btnCloseSidebar.addEventListener('click', closeSidebar);
        }
    }

    // Global Bottom Sheet Logic
    const bottomSheet = document.getElementById('bottom-sheet');
    const bottomSheetOverlay = document.getElementById('bottom-sheet-overlay');
    const bottomSheetContent = document.getElementById('bottom-sheet-content');
    const btnCloseSheet = document.getElementById('btn-close-sheet');

    function closeBottomSheet() {
        if(bottomSheet) bottomSheet.classList.remove('active');
        if(bottomSheetOverlay) bottomSheetOverlay.classList.remove('active');
        setTimeout(() => {
            if(bottomSheetContent) bottomSheetContent.innerHTML = '';
        }, 300); // Wait for animation
    }

    if (btnCloseSheet) btnCloseSheet.addEventListener('click', closeBottomSheet);
    if (bottomSheetOverlay) bottomSheetOverlay.addEventListener('click', closeBottomSheet);

    document.addEventListener('click', (e) => {
        const moreBtn = e.target.closest('.btn-more-actions');
        if (moreBtn) {
            e.preventDefault();
            e.stopPropagation();
            const targetsSelector = moreBtn.getAttribute('data-targets');
            if (targetsSelector && bottomSheetContent) {
                bottomSheetContent.innerHTML = ''; // Clear previous
                const targets = document.querySelectorAll(targetsSelector);
                
                targets.forEach(originalEl => {
                    const clone = originalEl.cloneNode(true);
                    // Remove mobile-hide so it's visible in the sheet
                    clone.classList.remove('mobile-hide');
                    clone.style.display = ''; 

                    // Proxy events
                    if (clone.tagName === 'SELECT') {
                        clone.value = originalEl.value; // Sync initial state
                        clone.addEventListener('change', (ev) => {
                            originalEl.value = ev.target.value;
                            originalEl.dispatchEvent(new Event('change', { bubbles: true }));
                            closeBottomSheet();
                        });
                    } else if (clone.tagName === 'BUTTON' || clone.classList.contains('btn') || clone.classList.contains('btn-action')) {
                        clone.addEventListener('click', (ev) => {
                            ev.preventDefault();
                            originalEl.click();
                            closeBottomSheet();
                        });
                    } else if (clone.querySelector('button, input, select')) {
                        // Complex elements like dropdowns or search boxes
                        const innerElements = clone.querySelectorAll('button, input, select');
                        innerElements.forEach((innerClone, idx) => {
                            const originalInner = originalEl.querySelectorAll('button, input, select')[idx];
                            if (innerClone.tagName === 'SELECT') {
                                innerClone.value = originalInner.value;
                                innerClone.addEventListener('change', (ev) => {
                                    originalInner.value = ev.target.value;
                                    originalInner.dispatchEvent(new Event('change', { bubbles: true }));
                                });
                            } else if (innerClone.tagName === 'INPUT') {
                                innerClone.value = originalInner.value;
                                innerClone.addEventListener('input', (ev) => {
                                    originalInner.value = ev.target.value;
                                    originalInner.dispatchEvent(new Event('input', { bubbles: true }));
                                });
                            } else if (innerClone.tagName === 'BUTTON') {
                                innerClone.addEventListener('click', (ev) => {
                                    ev.preventDefault();
                                    originalInner.click();
                                    if(!originalInner.classList.contains('dropdown-toggle')) {
                                        closeBottomSheet();
                                    }
                                });
                            }
                        });
                    } else {
                        // General click proxy if no specific inputs found
                        clone.addEventListener('click', (ev) => {
                            originalEl.click();
                            closeBottomSheet();
                        });
                    }

                    // For label wrapped inputs (like column dropdown)
                    const checkboxes = clone.querySelectorAll('input[type="checkbox"]');
                    checkboxes.forEach((cb, idx) => {
                        const origCb = originalEl.querySelectorAll('input[type="checkbox"]')[idx];
                        cb.checked = origCb.checked;
                        cb.addEventListener('change', (ev) => {
                            origCb.checked = ev.target.checked;
                            origCb.dispatchEvent(new Event('change', { bubbles: true }));
                        });
                    });
                    
                    bottomSheetContent.appendChild(clone);
                });
                
                bottomSheet.classList.add('active');
                bottomSheetOverlay.classList.add('active');
            }
        }
    });

    // Current Date auto-fill
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');

    // Dashboard Stats Toggle (Mobile)
    const btnToggleStats = document.getElementById('btn-toggle-stats');
    const statsGrid = document.getElementById('dashboard-stats-grid');
    const statsToggleIcon = document.getElementById('stats-toggle-icon');

    if (btnToggleStats && statsGrid && statsToggleIcon) {
        btnToggleStats.addEventListener('click', (e) => {
            e.preventDefault();
            statsGrid.classList.toggle('expanded');
            if (statsGrid.classList.contains('expanded')) {
                statsToggleIcon.classList.remove('fa-chevron-down');
                statsToggleIcon.classList.add('fa-chevron-up');
            } else {
                statsToggleIcon.classList.remove('fa-chevron-up');
                statsToggleIcon.classList.add('fa-chevron-down');
            }
        });
    }
    const today = new Date().toISOString().split('T')[0];
    if (startDateInput && endDateInput) {
        startDateInput.value = today;
        endDateInput.value = today;
    }

    // Modal Logic
    const modal = document.getElementById('student-modal');
    const btnView = document.getElementById('btn-view');
    const btnCloseModals = document.querySelectorAll('.btn-close-modal');

    function openModal() {
        modal.classList.remove('hidden');
    }

    function closeModal() {
        modal.classList.add('hidden');
    }

    btnCloseModals.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal();
        });
    });

    // Close modal when clicking outside
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    // Fetch Student logic
    const scholarInput = document.getElementById('scholar-id');
    const nameDisplay = document.getElementById('student-name-display');
    let currentStudent = null;

    if (scholarInput) {
        scholarInput.addEventListener('input', async (e) => {
            const id = e.target.value.trim();
            if (id.length > 5) { // Assuming length is enough to start searching
                try {
                    const response = await fetch(`/api/student/${id}/`);
                    const data = await response.json();
                    if (data.success) {
                        nameDisplay.textContent = data.student_name;
                        currentStudent = data;
                        
                        // Populate modal silently
                        document.getElementById('modal-name').textContent = data.student_name;
                        document.getElementById('modal-mobile').textContent = data.mobile_number;
                        document.getElementById('modal-course').textContent = data.course;
                        document.getElementById('modal-semester').textContent = data.semester;
                        document.getElementById('modal-hostel').textContent = data.hostel_name;
                        document.getElementById('modal-room').textContent = data.room_number;
                        const modPurp = document.getElementById('modal-purpose');
                        if(modPurp) modPurp.textContent = data.purpose || 'N/A';
                        const modDest = document.getElementById('modal-destination');
                        if(modDest) modDest.textContent = data.destination || 'N/A';

                        const purposeInput = document.getElementById('purpose');
                        const destInput = document.getElementById('destination');
                        if (purposeInput && data.purpose) purposeInput.value = data.purpose;
                        if (destInput && data.destination) destInput.value = data.destination;
                    } else {
                        nameDisplay.textContent = 'Student not found';
                        currentStudent = null;
                    }
                } catch (err) {
                    nameDisplay.textContent = 'Error fetching details';
                    currentStudent = null;
                }
            } else {
                nameDisplay.textContent = 'Enter ID to fetch';
                currentStudent = null;
            }
        });
    }

    if (btnView) {
        btnView.addEventListener('click', () => {
            if (currentStudent) {
                openModal();
            } else {
                alert('Please enter a valid Scholar ID first.');
            }
        });
    }

    // Form Submission
    const outpassForm = document.getElementById('outpass-form');
    if (outpassForm) {
        outpassForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSubmit = document.getElementById('btn-submit');
            const btnText = btnSubmit.querySelector('.btn-text');
            const spinner = btnSubmit.querySelector('.spinner');
            const msgDiv = document.getElementById('form-message');
            
            if (!currentStudent) {
                msgDiv.className = 'message error';
                msgDiv.textContent = 'Please enter a valid Scholar ID before submitting.';
                return;
            }

            const payload = {
                scholar_id: document.getElementById('scholar-id').value,
                purpose: document.getElementById('purpose').value,
                destination: document.getElementById('destination').value,
                start_date: document.getElementById('start-date').value,
                start_time: document.getElementById('start-time').value,
                end_date: document.getElementById('end-date').value,
                end_time: document.getElementById('end-time').value
            };

            // Loading state
            btnText.classList.add('hidden');
            spinner.classList.remove('hidden');
            btnSubmit.disabled = true;

            try {
                const response = await fetch('/api/request/create/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': window.CSRF_TOKEN
                    },
                    body: JSON.stringify(payload)
                });
                
                const data = await response.json();
                if (data.success) {
                    msgDiv.className = 'message success';
                    msgDiv.textContent = 'Request submitted successfully!';
                    outpassForm.reset();
                    nameDisplay.textContent = 'Enter ID to fetch';
                    currentStudent = null;
                    
                    // Add row to table (simplified version, ideally we refetch or use websockets)
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    msgDiv.className = 'message error';
                    msgDiv.textContent = data.message || 'Error submitting request.';
                }
            } catch (err) {
                msgDiv.className = 'message error';
                msgDiv.textContent = 'Network error occurred.';
            } finally {
                btnText.classList.remove('hidden');
                spinner.classList.add('hidden');
                btnSubmit.disabled = false;
            }
        });
    }

    // Table Filtering
    const searchInput = document.getElementById('table-search');
    const statusFilter = document.getElementById('status-filter');
    const tableBody = document.querySelector('#requests-table tbody');

    function filterTable() {
        if (!tableBody) return;
        const rows = tableBody.querySelectorAll('tr');
        const searchTerm = searchInput.value.toLowerCase();
        const statusTerm = statusFilter.value;

        rows.forEach(row => {
            if (row.children.length === 1) return; // Skip "No requests" row
            
            const scholarId = row.children[0].textContent.toLowerCase();
            const name = row.children[1].textContent.toLowerCase();
            const status = row.getAttribute('data-status');
            
            const matchesSearch = scholarId.includes(searchTerm) || name.includes(searchTerm);
            const matchesStatus = statusTerm === 'All' || status === statusTerm;
            
            if (matchesSearch && matchesStatus) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    if (searchInput) searchInput.addEventListener('input', filterTable);
    if (statusFilter) statusFilter.addEventListener('change', filterTable);

    // Approve/Reject Actions logic
    const actionReasonModal = document.getElementById('action-reason-modal');
    const actionReasonForm = document.getElementById('action-reason-form');
    const actionRequestIdInput = document.getElementById('action-request-id');
    const actionStatusInput = document.getElementById('action-status');
    const actionReasonText = document.getElementById('action-reason-text');
    const actionModalTitle = document.getElementById('action-modal-title');
    const actionFormMessage = document.getElementById('action-form-message');

    function openActionModal(id, status) {
        actionRequestIdInput.value = id;
        actionStatusInput.value = status;
        actionModalTitle.textContent = status === 'Approved' ? 'Reason for Approval' : 'Reason for Rejection';
        actionReasonText.value = '';
        actionFormMessage.textContent = '';
        actionFormMessage.className = '';
        actionReasonModal.classList.remove('hidden');
    }

    document.querySelectorAll('.btn-close-action-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            actionReasonModal.classList.add('hidden');
        });
    });

    document.querySelectorAll('.approve-btn').forEach(btn => {
        btn.addEventListener('click', () => openActionModal(btn.dataset.id, 'Approved'));
    });

    document.querySelectorAll('.reject-btn').forEach(btn => {
        btn.addEventListener('click', () => openActionModal(btn.dataset.id, 'Rejected'));
    });

    if (actionReasonForm) {
        actionReasonForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = actionRequestIdInput.value;
            const status = actionStatusInput.value;
            const reason = actionReasonText.value.trim();

            if (!reason) {
                actionFormMessage.textContent = 'Reason is required.';
                actionFormMessage.className = 'message error';
                return;
            }

            const btnSubmit = document.getElementById('btn-submit-action');
            btnSubmit.disabled = true;
            btnSubmit.textContent = 'Saving...';

            try {
                const response = await fetch('/api/request/update_status/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': window.CSRF_TOKEN
                    },
                    body: JSON.stringify({ id, status, reason })
                });
                const data = await response.json();
                if (data.success) {
                    window.location.reload();
                } else {
                    actionFormMessage.textContent = data.message || 'Error saving reason.';
                    actionFormMessage.className = 'message error';
                    btnSubmit.disabled = false;
                    btnSubmit.textContent = 'Submit';
                }
            } catch (err) {
                actionFormMessage.textContent = 'Network error occurred.';
                actionFormMessage.className = 'message error';
                btnSubmit.disabled = false;
                btnSubmit.textContent = 'Submit';
            }
        });
    }

    // Animated Counters
    const counters = document.querySelectorAll('.counter');
    const speed = 200; // lower is faster

    counters.forEach(counter => {
        const target = +counter.getAttribute('data-target');
        if (target === 0) return;
        
        const updateCount = () => {
            const current = +counter.innerText;
            const inc = target / speed;
            
            if (current < target) {
                counter.innerText = Math.ceil(current + inc);
                setTimeout(updateCount, 10);
            } else {
                counter.innerText = target;
            }
        };
        updateCount();
    });

    // ==========================================
    // STUDENT MANAGEMENT LOGIC
    // ==========================================
    const studentForm = document.getElementById('student-form');
    if (studentForm) {
        const formMode = document.getElementById('form-mode');
        const scholarInput = document.getElementById('reg-scholar-id');
        const btnCancelEdit = document.getElementById('btn-cancel-edit');
        const formTitle = document.getElementById('form-title');
        const msgDiv = document.getElementById('student-form-message');

        // Form Submit (Create / Update)
        studentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSubmit = document.getElementById('btn-save-student');
            const btnText = btnSubmit.querySelector('.btn-text');
            const spinner = btnSubmit.querySelector('.spinner');
            
            const payload = {
                scholar_id: scholarInput.value.trim(),
                student_name: document.getElementById('reg-name').value.trim(),
                mobile_number: document.getElementById('reg-mobile').value.trim(),
                course: document.getElementById('reg-course').value.trim(),
                semester: document.getElementById('reg-semester').value,
                hostel_name: document.getElementById('reg-hostel').value.trim(),
                room_number: document.getElementById('reg-room').value.trim(),
                purpose: document.getElementById('reg-purpose').value.trim(),
                destination: document.getElementById('reg-destination').value.trim()
            };

            const endpoint = formMode.value === 'create' ? '/api/student/create/' : '/api/student/update/';
            
            btnText.classList.add('hidden');
            spinner.classList.remove('hidden');
            btnSubmit.disabled = true;

            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': window.CSRF_TOKEN
                    },
                    body: JSON.stringify(payload)
                });
                
                const data = await response.json();
                if (data.success) {
                    msgDiv.className = 'message success';
                    msgDiv.textContent = data.message;
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    msgDiv.className = 'message error';
                    msgDiv.textContent = data.message;
                }
            } catch (err) {
                msgDiv.className = 'message error';
                msgDiv.textContent = 'Network error occurred.';
            } finally {
                btnText.classList.remove('hidden');
                spinner.classList.add('hidden');
                btnSubmit.disabled = false;
            }
        });

        // Edit Button Click
        document.querySelectorAll('.edit-student-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                scholarInput.value = btn.dataset.id;
                scholarInput.readOnly = true; // Cannot change PK
                document.getElementById('reg-name').value = btn.dataset.name;
                document.getElementById('reg-mobile').value = btn.dataset.mobile;
                document.getElementById('reg-course').value = btn.dataset.course;
                document.getElementById('reg-semester').value = btn.dataset.semester;
                document.getElementById('reg-hostel').value = btn.dataset.hostel;
                document.getElementById('reg-room').value = btn.dataset.room;
                document.getElementById('reg-purpose').value = btn.dataset.purpose || '';
                document.getElementById('reg-destination').value = btn.dataset.destination || '';
                
                formMode.value = 'update';
                formTitle.innerHTML = '<i class="fas fa-user-edit"></i> Edit Student';
                btnCancelEdit.classList.remove('hidden');
                document.getElementById('btn-save-student').querySelector('.btn-text').textContent = 'Update Student';
                
                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });

        // Cancel Edit
        btnCancelEdit.addEventListener('click', () => {
            studentForm.reset();
            scholarInput.readOnly = false;
            formMode.value = 'create';
            formTitle.innerHTML = '<i class="fas fa-user-plus"></i> Register New Student';
            btnCancelEdit.classList.add('hidden');
            document.getElementById('btn-save-student').querySelector('.btn-text').textContent = 'Save Student';
            msgDiv.className = '';
            msgDiv.textContent = '';
        });

        // Delete Button Click
        document.querySelectorAll('.delete-student-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                if (!confirm(`Are you sure you want to delete student ${id}? This will also delete all their outpass requests.`)) return;

                try {
                    const response = await fetch('/api/student/delete/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': window.CSRF_TOKEN
                        },
                        body: JSON.stringify({ scholar_id: id })
                    });
                    const data = await response.json();
                    if (data.success) {
                        window.location.reload();
                    } else {
                        alert(data.message);
                    }
                } catch (err) {
                    alert('Error deleting student.');
                }
            });
        });

        // Student Table Filtering
        const stuSearchInput = document.getElementById('student-search');
        const stuTableBody = document.querySelector('#students-table tbody');

        if (stuSearchInput && stuTableBody) {
            stuSearchInput.addEventListener('input', () => {
                const searchTerm = stuSearchInput.value.toLowerCase();
                const rows = stuTableBody.querySelectorAll('tr');

                rows.forEach(row => {
                    if (row.children.length === 1) return; // Skip empty message
                    
                    const scholarId = row.children[0].textContent.toLowerCase();
                    const name = row.children[1].textContent.toLowerCase();
                    const purpose = row.children[7] ? row.children[7].textContent.toLowerCase() : '';
                    const dest = row.children[8] ? row.children[8].textContent.toLowerCase() : '';
                    
                    if (scholarId.includes(searchTerm) || name.includes(searchTerm) || purpose.includes(searchTerm) || dest.includes(searchTerm)) {
                        row.style.display = '';
                    } else {
                        row.style.display = 'none';
                    }
                });
            });
        }
    }

    // Column selector logic
    const columnBtn = document.getElementById('columnDropdownBtn');
    const columnMenu = document.getElementById('columnDropdownMenu');
    const columnCheckboxes = columnMenu ? columnMenu.querySelectorAll('input[type="checkbox"]') : [];
    const reqTable = document.getElementById('requests-table');

    if (columnBtn && columnMenu) {
        columnBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            columnMenu.classList.toggle('hidden');
        });

        document.addEventListener('click', (e) => {
            if (!columnBtn.contains(e.target) && !columnMenu.contains(e.target)) {
                columnMenu.classList.add('hidden');
            }
        });

        const savedColumns = JSON.parse(localStorage.getItem('outpass_column_prefs') || '[]');
        
        function updateColumnVisibility() {
            if (!reqTable) return;
            const rows = reqTable.querySelectorAll('tr');
            const prefs = [];
            
            columnCheckboxes.forEach((checkbox) => {
                const colIndex = parseInt(checkbox.value);
                const isVisible = checkbox.checked;
                prefs.push(isVisible);
                
                rows.forEach(row => {
                    const cells = row.children;
                    if (cells[colIndex] && !cells[colIndex].hasAttribute('colspan')) {
                        cells[colIndex].style.display = isVisible ? '' : 'none';
                    }
                });
            });
            
            localStorage.setItem('outpass_column_prefs', JSON.stringify(prefs));
            
            const emptyRow = reqTable.querySelector('.text-center');
            if (emptyRow && emptyRow.hasAttribute('colspan')) {
                const visibleCount = prefs.filter(Boolean).length;
                emptyRow.setAttribute('colspan', visibleCount);
            }
        }

        columnCheckboxes.forEach((checkbox, index) => {
            if (savedColumns.length > 0 && savedColumns[index] !== undefined) {
                checkbox.checked = savedColumns[index];
            }
            checkbox.addEventListener('change', updateColumnVisibility);
        });

        updateColumnVisibility();
    }

    // History Modal Logic
    const historyModal = document.getElementById('history-modal');
    const closeHistoryBtns = document.querySelectorAll('.btn-close-history-modal');
    const historyTableBody = document.getElementById('history-table-body');
    const histTotal = document.getElementById('hist-total');
    const histApproved = document.getElementById('hist-approved');
    const histPending = document.getElementById('hist-pending');
    const histRejected = document.getElementById('hist-rejected');
    const histTitle = document.getElementById('history-modal-title');

    function closeHistoryModal() {
        historyModal.classList.add('hidden');
    }

    closeHistoryBtns.forEach(btn => {
        btn.addEventListener('click', closeHistoryModal);
    });

    document.querySelectorAll('.view-history-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const scholarId = e.currentTarget.getAttribute('data-scholar-id');
            histTitle.textContent = 'Loading...';
            historyModal.classList.remove('hidden');
            historyTableBody.innerHTML = '<tr><td colspan="6" class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';
            
            histTotal.textContent = '0';
            histApproved.textContent = '0';
            histPending.textContent = '0';
            histRejected.textContent = '0';

            try {
                const response = await fetch(`/api/student/${scholarId}/history/`);
                const data = await response.json();
                
                if (data.success) {
                    histTitle.textContent = `Outing History - ${data.student_name} (${scholarId})`;
                    histTotal.textContent = data.stats.total;
                    histApproved.textContent = data.stats.approved;
                    histPending.textContent = data.stats.pending;
                    histRejected.textContent = data.stats.rejected;

                    historyTableBody.innerHTML = '';
                    if (data.history.length === 0) {
                        historyTableBody.innerHTML = '<tr><td colspan="6" class="text-center">No history found.</td></tr>';
                    } else {
                        data.history.forEach(req => {
                            const row = document.createElement('tr');
                            row.innerHTML = `
                                <td>${req.start_date}</td>
                                <td>${req.start_date} <small>${req.start_time}</small></td>
                                <td>${req.end_date} <small>${req.end_time}</small></td>
                                <td>${req.purpose}</td>
                                <td>${req.destination}</td>
                                <td><span class="status-badge ${req.status.toLowerCase()}">${req.status}</span></td>
                                <td>${req.reason || '-'}</td>
                            `;
                            historyTableBody.appendChild(row);
                        });
                    }
                } else {
                    histTitle.textContent = 'Error';
                    historyTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">${data.message || 'Failed to fetch history'}</td></tr>`;
                }
            } catch (error) {
                histTitle.textContent = 'Error';
                historyTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Network error occurred</td></tr>';
            }
        });
    });
});
