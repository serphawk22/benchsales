// Frontend log viewer logic for Bench Sales Progression Tool
// Responsibilities:
// - Verify session authentication or redirect to login
// - Load, render, and filter records older than 3 days
// - Handle modal interactions to view job descriptions
// - Implement clear all logs option

(function () {
  // Check auth state immediately. If not logged in, redirect to index.html
  function verifyAuth() {
    if (sessionStorage.getItem('benchSalesAuth') !== 'true') {
      window.location.replace('index.html');
    }
  }

  // Run auth check
  verifyAuth();

  // Page selectors
  const recordsBody = document.getElementById('recordsBody');
  const emptyState = document.getElementById('emptyState');
  const clearLogBtn = document.getElementById('clearLogBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  // Modal selectors
  const jdModal = document.getElementById('jdModal');
  const modalJdText = document.getElementById('modalJdText');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const closeModalBtnSecondary = document.getElementById('closeModalBtnSecondary');
  const copyJdBtn = document.getElementById('copyJdBtn');

  let activeLogs = [];

  // Format date helper
  function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Load and clean logs older than 3 days
  function loadAndCleanLogs() {
    try {
      const storedLogs = localStorage.getItem('benchSalesHistory');
      let logs = storedLogs ? JSON.parse(storedLogs) : [];

      // Prune records older than 3 days
      const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      const initialLength = logs.length;

      logs = logs.filter(item => now - item.timestamp < threeDaysInMs);

      // Save pruned array back if items were deleted
      if (logs.length !== initialLength) {
        localStorage.setItem('benchSalesHistory', JSON.stringify(logs));
      }

      activeLogs = logs;
    } catch (e) {
      console.error('Failed to load history logs:', e);
      activeLogs = [];
    }
  }

  // Render log rows into table
  function renderLogs() {
    if (!recordsBody) return;

    recordsBody.innerHTML = '';

    if (activeLogs.length === 0) {
      emptyState.style.display = 'flex';
      return;
    }

    emptyState.style.display = 'none';

    activeLogs.forEach(record => {
      const tr = document.createElement('tr');

      // Date field
      const tdDate = document.createElement('td');
      tdDate.className = 'date-cell';
      tdDate.textContent = formatDateTime(record.timestamp);
      tr.appendChild(tdDate);

      // File field
      const tdFile = document.createElement('td');
      tdFile.className = 'file-cell';
      tdFile.textContent = record.resumeName || 'Unknown file';
      tr.appendChild(tdFile);

      // Status field
      const tdStatus = document.createElement('td');
      const statusSpan = document.createElement('span');
      statusSpan.className = 'status-tag';
      statusSpan.textContent = record.status;

      // Status tag color assignments
      if (record.status.toLowerCase().includes('success')) {
        statusSpan.classList.add('tag-success');
      } else if (record.status.toLowerCase().includes('not a match')) {
        statusSpan.classList.add('tag-match-fail');
      } else {
        statusSpan.classList.add('tag-error');
      }
      tdStatus.appendChild(statusSpan);
      tr.appendChild(tdStatus);

      // Actions cell
      const tdActions = document.createElement('td');
      tdActions.className = 'actions-cell text-right';

      const viewBtn = document.createElement('button');
      viewBtn.className = 'action-btn-view';
      viewBtn.textContent = 'View JD';
      viewBtn.addEventListener('click', () => openJdModal(record.jdText));

      tdActions.appendChild(viewBtn);
      tr.appendChild(tdActions);

      recordsBody.appendChild(tr);
    });
  }

  // Modal actions
  function openJdModal(jdText) {
    if (!jdModal || !modalJdText) return;
    modalJdText.textContent = jdText || 'No Job Description text captured.';
    jdModal.style.display = 'flex';
    // Force transition
    jdModal.offsetHeight;
    jdModal.classList.add('active');
  }

  function closeJdModal() {
    if (!jdModal) return;
    jdModal.classList.remove('active');
    setTimeout(() => {
      jdModal.style.display = 'none';
    }, 200);
  }

  // Copy JD text to clipboard
  if (copyJdBtn) {
    copyJdBtn.addEventListener('click', function () {
      if (!modalJdText) return;
      const textToCopy = modalJdText.textContent;
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          const originalText = copyJdBtn.textContent;
          copyJdBtn.textContent = 'Copied!';
          copyJdBtn.style.background = 'var(--color-success)';
          setTimeout(() => {
            copyJdBtn.textContent = originalText;
            copyJdBtn.style.background = '';
          }, 1500);
        })
        .catch(err => {
          console.error('Failed to copy text: ', err);
        });
    });
  }

  // Close buttons listeners
  [closeModalBtn, closeModalBtnSecondary].forEach(btn => {
    if (btn) btn.addEventListener('click', closeJdModal);
  });

  // Close modal when clicking backdrop area
  if (jdModal) {
    jdModal.addEventListener('click', function (e) {
      if (e.target === jdModal) {
        closeJdModal();
      }
    });
  }

  // Clear records log
  if (clearLogBtn) {
    clearLogBtn.addEventListener('click', function () {
      if (confirm('Are you sure you want to permanently clear all submission logs?')) {
        localStorage.removeItem('benchSalesHistory');
        activeLogs = [];
        renderLogs();
      }
    });
  }

  // Logout button action
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      sessionStorage.removeItem('benchSalesAuth');
      window.location.replace('index.html');
    });
  }

  // Initialize page
  loadAndCleanLogs();
  renderLogs();
})();
