let currentData = null;

document.getElementById('extractBtn').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const status = document.getElementById('status');
    const extractBtn = document.getElementById('extractBtn');

    status.textContent = "⏳ Extracting data...";
    extractBtn.disabled = true;
    extractBtn.style.opacity = '0.6';

    chrome.tabs.sendMessage(tab.id, { action: "extract" }, (response) => {
        if (chrome.runtime.lastError) {
            status.textContent = "❌ Error: Please refresh the page and try again.";
            extractBtn.disabled = false;
            extractBtn.style.opacity = '1';
            return;
        }

        currentData = response;
        displayResults(response);
        status.textContent = "✅ Extraction completed successfully!";
        extractBtn.disabled = false;
        extractBtn.style.opacity = '1';
    });
});

// Export CSV
document.getElementById('exportCsv').addEventListener('click', () => {
    if (!currentData) return;

    let csv = 'Type,Value,Platform\n';

    currentData.emails.forEach(email => {
        csv += `Email,"${email}",\n`;
    });

    currentData.phones.forEach(phone => {
        csv += `Phone,"${phone}",\n`;
    });

    for (const [platform, links] of Object.entries(currentData.socials)) {
        links.forEach(link => {
            csv += `Social,"${link}",${platform}\n`;
        });
    }

    downloadFile(csv, 'extracted-data.csv', 'text/csv');
});

// Export JSON
document.getElementById('exportJson').addEventListener('click', () => {
    if (!currentData) return;

    const json = JSON.stringify(currentData, null, 2);
    downloadFile(json, 'extracted-data.json', 'application/json');
});

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function displayResults(data) {
    const { emails, phones, socials } = data;

    document.getElementById('welcome').classList.add('hidden');

    // Calculate totals
    const totalSocials = Object.values(socials).reduce((sum, arr) => sum + arr.length, 0);

    // Update statistics
    document.getElementById('emailCount').textContent = emails.length;
    document.getElementById('phoneCount').textContent = phones.length;
    document.getElementById('socialCount').textContent = totalSocials;

    // Show stats and export if we have data
    if (emails.length > 0 || phones.length > 0 || totalSocials > 0) {
        document.getElementById('statsContainer').classList.remove('hidden');
        document.getElementById('exportContainer').classList.remove('hidden');
    }

    // Display Emails
    const emailList = document.getElementById('emailList');
    const emailsContainer = document.getElementById('emailsContainer');
    emailList.innerHTML = '';
    if (emails.length > 0) {
        emailsContainer.classList.remove('hidden');
        emails.forEach(email => {
            emailList.appendChild(createItem(email, 'EMAIL'));
        });
    } else {
        emailsContainer.classList.add('hidden');
    }

    // Display Phones
    const phoneList = document.getElementById('phoneList');
    const phonesContainer = document.getElementById('phonesContainer');
    phoneList.innerHTML = '';
    if (phones.length > 0) {
        phonesContainer.classList.remove('hidden');
        phones.forEach(phone => {
            phoneList.appendChild(createItem(phone, 'PHONE'));
        });
    } else {
        phonesContainer.classList.add('hidden');
    }

    // Display Socials
    const socialList = document.getElementById('socialList');
    const socialsContainer = document.getElementById('socialsContainer');
    socialList.innerHTML = '';
    let hasSocials = false;
    for (const [platform, links] of Object.entries(socials)) {
        if (links.length > 0) {
            hasSocials = true;
            links.forEach(link => {
                socialList.appendChild(createItem(link, platform.toUpperCase()));
            });
        }
    }
    if (hasSocials) {
        socialsContainer.classList.remove('hidden');
    } else {
        socialsContainer.classList.add('hidden');
    }
}

function createItem(text, badge = '') {
    const div = document.createElement('div');
    div.className = 'data-item';

    const content = document.createElement('div');
    content.className = 'data-content';

    const mainText = document.createElement('div');
    mainText.className = 'data-text';
    mainText.textContent = text;

    content.appendChild(mainText);

    if (badge) {
        const badgeEl = document.createElement('div');
        badgeEl.className = 'data-badge';
        badgeEl.textContent = badge;
        content.appendChild(badgeEl);
    }

    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
    `;

    copyBtn.onclick = () => {
        navigator.clipboard.writeText(text);
        copyBtn.classList.add('copied');
        copyBtn.innerHTML = '<span style="font-size: 11px; font-weight: 700;">✓</span>';
        setTimeout(() => {
            copyBtn.classList.remove('copied');
            copyBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
            `;
        }, 1500);
    };

    div.appendChild(content);
    div.appendChild(copyBtn);

    return div;
}
