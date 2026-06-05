# Bench Sales Resume Checker (Localhost-Only)

Simple, localhost-only web application for a bench sales recruiter to upload consultant resumes, paste a Job Description (JD), and forward the data to a local n8n workflow.

Backend: **Node.js + Express**  
Frontend: **HTML + CSS + Vanilla JavaScript**

---

## Folder Structure

```text
bench sales AI/
  package.json        # Node.js project configuration (Express, Multer)
  server.js           # Express server (localhost-only)
  uploads/            # Created automatically at runtime to store resume files
  public/
    index.html        # Main UI – resume upload + JD textarea + submit
    styles.css        # Styling (no frameworks)
    app.js            # Frontend logic (Vanilla JS)
  README.md           # This file
```

> The `uploads` directory is created automatically by the server if it does not already exist.

---

## Prerequisites

- **Node.js 18 or later** (required for the built-in `fetch` API used by the backend)
- **npm** (Node package manager)
- A running **n8n** instance with a webhook configured at:
  - `http://localhost:5678/webhook/bench-sales`

---

## Install & Run (Backend + Frontend)

1. **Open a terminal** in the project folder:

   ```bash
   cd "p:\bench sales AI"
   ```

2. **Install dependencies** (Express and Multer):

   ```bash
   npm install
   ```

3. **Start the Express server** (localhost-only):

   ```bash
   npm start
   ```

   You should see a message similar to:

   ```text
   Bench sales tool server running at http://127.0.0.1:3000
   ```

4. **Open the web app** in your browser:

   - Navigate to `http://127.0.0.1:3000` (or `http://localhost:3000`)

---

## How It Works

### Frontend (Localhost-only UI)

- **Consultant / Resume Section**
  - Upload up to **3** resume files (PDF, DOC, or DOCX).
  - Uploaded resumes are listed with **radio buttons**, so **only one** resume can be selected at a time.
  - The tool **only sends the selected resume** to the backend.

- **Job Description Section**
  - One large `<textarea>` with placeholder:
    - `"Paste the Job Description copied from LinkedIn here..."`
  - JD text is validated to ensure it is **not empty**.

- **Submit Button**
  - Label: **"Check &amp; Send Resume"**.
  - On click:
    - Validates that:
      - At least one resume is uploaded.
      - One resume is selected via radio button.
      - JD textarea is not empty.
    - Sends a `multipart/form-data` POST request to `POST /submit`:
      - **Fields**:
        - `jdText` – Job Description text.
        - `resume` – The **selected** resume file only.
    - Shows status messages:
      - `"Processing..."` while waiting for the server.
      - `"Resume sent successfully"` on success.
      - `"Not a match – resume not sent"` when n8n indicates a non-match (see below).

### Backend (Node.js + Express + Multer)

- Runs on `http://127.0.0.1:3000` and serves:
  - Static frontend files from the `public/` folder.
  - A `POST /submit` endpoint to accept uploads.

- `POST /submit`:
  - Expects `multipart/form-data` with:
    - A single file named `resume`.
    - A text field named `jdText`.
  - Uses **Multer** to:
    - Store the uploaded resume under the `uploads/` directory.
    - Generate a unique filename while preserving the original extension.
  - Validates:
    - A resume file is present.
    - JD text is present and non-empty.
    - File type is PDF/DOC/DOCX (based on MIME type).

- Forwards data to **n8n** via HTTP POST:
  - URL: `http://localhost:5678/webhook/bench-sales`
  - Method: `POST`
  - Body: JSON
    - `jdText`: the job description text.
    - `resumePath`: full path to the stored resume file on disk.
    - `resumeFilename`: original filename of the uploaded resume.
  - The Express server:
    - Waits for n8n’s response.
    - Tries to parse it as JSON; if not JSON, wraps raw text into `{ raw: "<text>" }`.
    - Returns **n8n’s HTTP status code** and body back to the frontend.

> The backend **does not contain any AI or matching logic** – it only validates inputs, stores the file, and forwards data to n8n.

---

## n8n Response and Status Messages

On the frontend (`public/app.js`), the status message is determined by the JSON response from n8n.

By default:

- If the response is **not OK** (non-2xx), the app shows a generic error message.
- If the response is OK (2xx), it uses the following conventions:
  - If n8n returns JSON with **any** of:
    - `isMatch: false`
    - `resumeSent: false`
    - `status: "not_sent"`
    - `match: false`
    - then it shows: **"Not a match – resume not sent"**.
  - Otherwise, it shows: **"Resume sent successfully"**.

You can adjust your n8n workflow to return such fields if you want fine control over the frontend status.

---

## Localhost-Only Behavior

- The Express server explicitly binds to `127.0.0.1`:
  - It is **not** exposed on other network interfaces by default.
- All communication is:
  - Browser ⇄ Express server on `http://127.0.0.1:3000`
  - Express server ⇄ n8n webhook on `http://localhost:5678/webhook/bench-sales`

This is designed as a **personal internal tool**, not as a public web service.

---

## Notes

- If you change the n8n webhook URL, update `N8N_WEBHOOK_URL` in `server.js`.
- If you want to increase max upload size, adjust `fileSize` in the Multer configuration in `server.js`.
- There is intentionally **no authentication** or external framework on the frontend to keep the tool lightweight and internal-only.

