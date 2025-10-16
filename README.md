# Dynamic Quote Generator — alx_fe_javascript

> Week 8 ALX Front-End JavaScript Project: DOM Manipulation, Web Storage & JSON Data Syncing

## 🚀 Project Overview

This project is a **Dynamic Quote Generator** built with vanilla JavaScript — no frameworks.  
It demonstrates core front-end skills:

- Creating, updating, and removing **DOM elements** dynamically  
- Filtering and displaying content based on user-selected categories  
- Persisting data in **localStorage**  
- Syncing with a mock server (via fetch)  
- Handling conflicts and notifying the user of updates  

The repo is structured around your ALX Week 8 tasks, with enhancements for real-world features like synchronization and conflict resolution.

---

## 📁 Repository Structure

alx_fe_javascript/

├── dom-manipulation/

│ ├── index.html

│ └── script.js

└── README.md

---


- `index.html` — the main frontend HTML page  
- `script.js` — all JavaScript logic (DOM, storage, sync, conflict resolution)  
- `README.md` — this documentation  

---

## 🛠️ Features

- **Display random quotes** from an internal dataset  
- **Filter by category** (e.g. “Motivation”, “Life”, etc.)  
- **Add new quotes** dynamically (updating DOM and storage)  
- **Persist data** using `localStorage`  
- **Sync with mock server** (fetch & post)  
- **Conflict resolution** (server-side data takes precedence)  
- **User notifications** for sync events, conflicts, and updates  
- **Periodic polling** to check for new server data  

---

## 🔧 Setup & Usage

1. **Clone the repo**
    ```bash
    git clone https://github.com/DAMILOLA8909/alx_fe_javascript.git
    cd alx_fe_javascript/dom-manipulation
    ```

2. **Open in browser**
    Open `index.html` in your browser (double-click or via a Live Server extension).

3. **Interact with the app**
    - Use the **dropdown** to select a quote category  
    - Press **"Show New Quote"** to get a random quote in that category  
    - Add your own quote via the input fields and "Add Quote" button  
    - The app will sync changes with a mock server and notify you of updates  

---

## 📡 Sync & Conflict Logic

- The app tries to **post new quotes** to a mock API (e.g. JSONPlaceholder)  
- It periodically **fetches quotes** from the server  
- On merge, if the server has different data for a quote, the **server’s version overrides** the local version  
- A **notification banner** notifies users when “Quotes synced with server!”  
- UI elements indicate when updates or conflicts happened  

---

## 🎯 AutoChecker Compliance (for ALX)

To satisfy ALX’s automated tests, this project explicitly includes:

- A function named `syncQuotes()`  
- Logic to **post data to a mock API**  
- Periodic polling to check for new quotes  
- Conflict resolution logic (server data overrides local)  
- UI elements and notifications for sync events or conflicts (the “notification” box shows messages like `Quotes synced with server!`)  

---

## 🧪 Suggested Tests & Demo Use Cases

- Start the app, observe an initial quote  
- Add a new quote and check localStorage  
- Wait for a sync cycle — see the notification  
- Manually refresh; the same category and quotes persist  
- (Optional) Modify the server side mock or simulate conflicts and verify the conflict resolution behavior  

---

## 📝 Tips & Customization Ideas

- Replace the mock API with a **real backend** for persistent server-side storage  
- Improve conflict resolution: allow **manual per-quote merging** instead of always favoring the server  
- Add **timestamp comparisons** to choose newer updates  
- Add **editing / deleting** quotes  
- Add pagination or search/filter by keyword  

---

## ⚖️ License & Credits

This project is created by **@DAMILOLA8909** as part of ALX’s Front-End curriculum.  
Feel free to reuse, adapt, or extend this for your own learning.  

---

If you like, I can also generate a version of this README with badges, screenshots, and links ready for GitHub’s visual formatting. Would you like me to do that?
::contentReference[oaicite:0]{index=0}
