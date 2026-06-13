// Frontend logic for the bench sales resume checker
// Responsibilities:
// - Handle admin login authentication with hardcoded credentials
// - Toggle password input visibility on eye-icon button click
// - Handle layout transition state between Login and Dashboard
// - Handle up to 3 resume file uploads (client side)
// - Display uploaded resumes with radio buttons (only one selectable)
// - Validate that one resume is selected and JD is non-empty
// - Send selected resume + JD text to backend via fetch() as multipart/form-data
// - Show simple status messages based on the response
// - Log all submissions to localStorage (with automated 3-day expiration)

(function () {
  // Authentication selectors
  const loginContainer = document.getElementById('loginContainer');
  const appContainer = document.getElementById('appContainer');
  const loginForm = document.getElementById('loginForm');
  const loginEmail = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');
  const loginStatus = document.getElementById('loginStatus');
  const logoutBtn = document.getElementById('logoutBtn');
  const togglePasswordBtn = document.getElementById('togglePasswordBtn');

  // Hardcoded Admin credentials (custom user credentials preserved)
  const ADMIN_EMAIL = 'anupojubhavani9849@gmail.com';
  const ADMIN_PASSWORD = 'PRASANTH@04';

  // Resume Form selectors
  const fileInput = document.getElementById('resumeInput');
  const uploadArea = document.querySelector('.upload-area');
  const resumeListEl = document.getElementById('resumeList');
  const jdTextEl = document.getElementById('jdText');
  const formEl = document.getElementById('resumeForm');
  const submitBtn = document.getElementById('submitBtn');
  const statusEl = document.getElementById('statusMessage');

  // Internal list of File objects corresponding to the current selection
  let uploadedFiles = [];

  // Check auth state and initialize correct view
  function checkAuth() {
    if (sessionStorage.getItem('benchSalesAuth') === 'true') {
      loginContainer.style.display = 'none';
      appContainer.style.display = 'flex';
    } else {
      loginContainer.style.display = 'flex';
      appContainer.style.display = 'none';
    }
  }

  // Handle password visibility toggle
  if (togglePasswordBtn && loginPassword) {
    const eyeIconOpen = togglePasswordBtn.querySelector('.eye-icon-open');
    const eyeIconClosed = togglePasswordBtn.querySelector('.eye-icon-closed');

    togglePasswordBtn.addEventListener('click', function () {
      if (loginPassword.type === 'password') {
        loginPassword.type = 'text';
        if (eyeIconOpen) eyeIconOpen.style.display = 'none';
        if (eyeIconClosed) eyeIconClosed.style.display = 'block';
      } else {
        loginPassword.type = 'password';
        if (eyeIconOpen) eyeIconOpen.style.display = 'block';
        if (eyeIconClosed) eyeIconClosed.style.display = 'none';
      }
    });
  }

  // Admin Sign-in event handler
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const email = (loginEmail.value || '').trim();
      const password = loginPassword.value;

      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        sessionStorage.setItem('benchSalesAuth', 'true');
        loginStatus.textContent = '';
        loginStatus.className = 'status-message';

        // Clear values
        loginEmail.value = '';
        loginPassword.value = '';

        // Reset password toggle view
        if (loginPassword.type === 'text') {
          togglePasswordBtn.click();
        }

        // Transition animation to app dashboard
        loginContainer.style.opacity = '0';
        loginContainer.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
          loginContainer.style.display = 'none';
          loginContainer.style.opacity = ''; // Reset
          appContainer.style.display = 'flex';
          appContainer.style.opacity = '0';
          appContainer.style.transition = 'opacity 0.3s ease';
          // Force layout recalculation for transition to fire
          appContainer.offsetHeight;
          appContainer.style.opacity = '1';
        }, 300);
      } else {
        loginStatus.textContent = 'Invalid email or password.';
        loginStatus.className = 'status-message error';
      }
    });
  }

  // Logout action event handler
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      sessionStorage.removeItem('benchSalesAuth');

      // Transition animation to login card
      appContainer.style.opacity = '0';
      appContainer.style.transition = 'opacity 0.3s ease';
      setTimeout(() => {
        appContainer.style.display = 'none';
        appContainer.style.opacity = ''; // Reset
        loginContainer.style.display = 'flex';
        loginContainer.style.opacity = '0';
        loginContainer.style.transition = 'opacity 0.3s ease';
        // Force layout recalculation
        loginContainer.offsetHeight;
        loginContainer.style.opacity = '1';
      }, 300);
    });
  }

  // Set response status helper
  function setStatus(message, type) {
    // type: 'info' | 'success' | 'error'
    statusEl.textContent = message || '';
    statusEl.className = 'status'; // reset

    if (type === 'info') {
      statusEl.classList.add('status-info');
    } else if (type === 'success') {
      statusEl.classList.add('status-success');
    } else if (type === 'error') {
      statusEl.classList.add('status-error');
    }
  }

  // Render list of uploaded files
  function renderResumeList() {
    // Clear current list
    resumeListEl.innerHTML = '';

    if (!uploadedFiles.length) {
      const p = document.createElement('p');
      p.className = 'empty-state';
      p.textContent = 'No resumes uploaded yet.';
      resumeListEl.appendChild(p);
      return;
    }

    uploadedFiles.forEach((file, index) => {
      const item = document.createElement('label');
      item.className = 'resume-item';

      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'selectedResume';
      radio.value = String(index);
      if (index === 0) {
        radio.checked = true;
      }

      const nameSpan = document.createElement('span');
      nameSpan.className = 'resume-name';
      nameSpan.textContent = file.name;

      item.appendChild(radio);
      item.appendChild(nameSpan);
      resumeListEl.appendChild(item);
    });
  }

  // Drag-and-drop hover animations for file-upload area
  if (fileInput && uploadArea) {
    fileInput.addEventListener('dragenter', function () {
      uploadArea.style.borderColor = 'var(--border-focus)';
      uploadArea.style.backgroundColor = 'var(--bg-input-focus)';
    });

    fileInput.addEventListener('dragleave', function () {
      uploadArea.style.borderColor = '';
      uploadArea.style.backgroundColor = '';
    });

    fileInput.addEventListener('drop', function () {
      uploadArea.style.borderColor = '';
      uploadArea.style.backgroundColor = '';
    });
  }

  // Handle file selection
  if (fileInput) {
    fileInput.addEventListener('change', function () {
      const files = Array.from(fileInput.files || []);

      if (files.length > 3) {
        uploadedFiles = [];
        fileInput.value = '';
        renderResumeList();
        setStatus('You can upload a maximum of 3 resume files.', 'error');
        return;
      }

      uploadedFiles = files;
      renderResumeList();
      setStatus('', null);
    });
  }

  // Save submission history to localStorage
  function saveSubmissionLog(resumeName, jdText, status) {
    try {
      const existingLogs = localStorage.getItem('benchSalesHistory');
      let logs = [];
      if (existingLogs) {
        logs = JSON.parse(existingLogs);
      }

      // Create new record
      const newRecord = {
        id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        timestamp: Date.now(),
        resumeName: resumeName,
        jdText: jdText,
        status: status
      };

      logs.unshift(newRecord); // Place at the start

      // Limit history to 3 days (3 * 24 * 60 * 60 * 1000)
      const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      logs = logs.filter(item => now - item.timestamp < threeDaysInMs);

      localStorage.setItem('benchSalesHistory', JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to log submission history:', e);
    }
  }

  // Handle form submission
  if (formEl) {
    formEl.addEventListener('submit', function (event) {
      event.preventDefault();

      // Basic client-side validation
      if (!uploadedFiles.length) {
        setStatus('Please upload at least one resume file.', 'error');
        return;
      }

      const selectedRadio = document.querySelector('input[name="selectedResume"]:checked');
      if (!selectedRadio) {
        setStatus('Please select one resume to send.', 'error');
        return;
      }

      const selectedIndex = parseInt(selectedRadio.value, 10);
      const selectedFile = uploadedFiles[selectedIndex];
      if (!selectedFile) {
        setStatus('Selected resume is not available. Please re-upload.', 'error');
        return;
      }

      const jdText = (jdTextEl.value || '').trim();
      if (!jdText) {
        setStatus('Job Description cannot be empty.', 'error');
        jdTextEl.focus();
        return;
      }

      // All validations passed – prepare FormData
      const formData = new FormData();
      formData.append('jdText', jdText);
      formData.append('resume', selectedFile);

      // Update UI to show processing state
      submitBtn.disabled = true;
      setStatus('Processing...', 'info'); // Required message

      // Send form data directly to n8n webhook
      fetch('https://primary-production-d40bc.up.railway.app/webhook/bench-sales', {
        method: 'POST',
        body: formData
      })
        .then(async (response) => {
          const contentType = response.headers.get('Content-Type') || '';
          let data = null;

          if (contentType.includes('application/json')) {
            data = await response.json();
          } else {
            const text = await response.text();
            data = { raw: text };
          }

          if (!response.ok) {
            const errorMessage = (data && (data.error || data.message)) || 'Failed to send resume.';
            throw new Error(errorMessage);
          }

          // Determine status message based on n8n response structure
          let isNotMatch =
            data &&
            (data.isMatch === false ||
              data.resumeSent === false ||
              data.status === 'not_sent' ||
              data.match === false);

          let outcomeMessage = '';
          let outcomeType = '';
          if (isNotMatch) {
            outcomeMessage = 'Not a match – resume not sent';
            outcomeType = 'error';
          } else {
            outcomeMessage = 'Resume sent successfully';
            outcomeType = 'success';
          }

          setStatus(outcomeMessage, outcomeType);
          saveSubmissionLog(selectedFile.name, jdText, outcomeMessage);
        })
        .catch((error) => {
          console.error('Error submitting form:', error);
          const errorMessage = error.message || 'Unexpected error while sending resume.';
          setStatus(errorMessage, 'error');
          saveSubmissionLog(selectedFile.name, jdText, `Failed: ${errorMessage}`);
        })
        .finally(() => {
          submitBtn.disabled = false;
        });
    });
  }

  // Check initial authentication state
  checkAuth();
})();
