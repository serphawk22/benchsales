// Frontend logic for the bench sales resume checker
// Responsibilities:
// - Handle up to 3 resume file uploads (client side)
// - Display uploaded resumes with radio buttons (only one selectable)
// - Validate that one resume is selected and JD is non-empty
// - Send selected resume + JD text to backend via fetch() as multipart/form-data
// - Show simple status messages based on the response

(function () {
  const fileInput = document.getElementById('resumeInput');
  const resumeListEl = document.getElementById('resumeList');
  const jdTextEl = document.getElementById('jdText');
  const formEl = document.getElementById('resumeForm');
  const submitBtn = document.getElementById('submitBtn');
  const statusEl = document.getElementById('statusMessage');

  // Internal list of File objects corresponding to the current selection
  let uploadedFiles = [];

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

  // Handle file selection
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

  // Handle form submission
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

        // Determine status message based on n8n response structure.
        // You can customize this logic to match your specific n8n workflow output.
        // Example conventions:
        // - data.isMatch === false  => "Not a match – resume not sent"
        // - data.resumeSent === false or data.status === 'not_sent' => "Not a match – resume not sent"
        // - otherwise: "Resume sent successfully"

        let isNotMatch =
          data &&
          (data.isMatch === false ||
            data.resumeSent === false ||
            data.status === 'not_sent' ||
            data.match === false);

        if (isNotMatch) {
          setStatus('Not a match – resume not sent', 'error'); // Required message
        } else {
          setStatus('Resume sent successfully', 'success'); // Required message
        }
      })
      .catch((error) => {
        console.error('Error submitting form:', error);
        setStatus(error.message || 'Unexpected error while sending resume.', 'error');
      })
      .finally(() => {
        submitBtn.disabled = false;
      });
  });
})();

