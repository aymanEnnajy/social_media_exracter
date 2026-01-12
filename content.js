// Content script to extract data from the page - Universal version
function extractData() {
    const emails = [];
    const phones = [];
    const socials = {
        facebook: [],
        instagram: [],
        youtube: [],
        linkedin: [],
        twitter: [],
        tiktok: [],
        github: [],
        pinterest: []
    };

    const currentUrl = window.location.hostname;
    const isAmsoftSite = currentUrl.includes('amsoft.ma');

    // ============ EMAIL EXTRACTION ============
    if (isAmsoftSite) {
        // Specific selector for amsoft.ma
        const emailElement = document.querySelector('.ekit-header-info li:nth-child(2) a');
        if (emailElement) {
            const emailText = emailElement.textContent.trim() || emailElement.href.replace('mailto:', '');
            if (emailText) {
                emails.push(emailText);
            }
        }
    }

    // Generic email extraction (works on all sites)
    if (emails.length === 0) {
        const bodyText = document.body.innerText;
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const foundEmails = [...new Set(bodyText.match(emailRegex) || [])];

        foundEmails.forEach(email => {
            // Filter out false positives
            const invalidPatterns = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.css', '.js'];
            if (!invalidPatterns.some(pattern => email.toLowerCase().includes(pattern))) {
                emails.push(email);
            }
        });
    }

    // ============ PHONE EXTRACTION ============
    if (isAmsoftSite) {
        // Specific selector for amsoft.ma
        const phoneElement = document.querySelector('.ekit-header-info li:nth-child(3) a');
        if (phoneElement) {
            const phoneText = phoneElement.textContent.trim() || phoneElement.href.replace('tel:', '');
            if (phoneText) {
                phones.push(phoneText);
            }
        }
    }

    // Generic phone extraction (works on all sites)
    if (phones.length === 0) {
        const bodyText = document.body.innerText;
        const phoneRegex = /(\+?\d{1,4}[\s.-]?)?(\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}/g;
        const foundPhones = [...new Set(bodyText.match(phoneRegex) || [])];

        foundPhones.forEach(phone => {
            const cleaned = phone.replace(/[\s.-]/g, '');
            if (cleaned.length >= 8 && cleaned.length <= 15) {
                phones.push(phone);
            }
        });
    }

    // ============ SOCIAL MEDIA EXTRACTION ============
    if (isAmsoftSite) {
        // Specific selectors for amsoft.ma
        const socialSelectors = [
            'div[class="elementor-social-icons-wrapper elementor-grid"] span:nth-child(1) a span',
            'div[class="elementor-social-icons-wrapper elementor-grid"] span:nth-child(2) a span',
            'div[class="elementor-social-icons-wrapper elementor-grid"] span:nth-child(3) a span'
        ];

        socialSelectors.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                const socialText = element.textContent.trim();

                if (socialText) {
                    const anchorElement = element.closest('a');

                    if (anchorElement) {
                        const ariaLabel = (anchorElement.getAttribute('aria-label') || '').toLowerCase();
                        const className = (anchorElement.className || '').toLowerCase();

                        // Detect platform from aria-label or class name
                        if (ariaLabel.includes('facebook') || className.includes('facebook')) {
                            socials.facebook.push(socialText);
                        } else if (ariaLabel.includes('instagram') || className.includes('instagram')) {
                            socials.instagram.push(socialText);
                        } else if (ariaLabel.includes('youtube') || className.includes('youtube')) {
                            socials.youtube.push(socialText);
                        } else if (ariaLabel.includes('linkedin') || className.includes('linkedin')) {
                            socials.linkedin.push(socialText);
                        } else if (ariaLabel.includes('twitter') || ariaLabel.includes('x-twitter') || className.includes('twitter')) {
                            socials.twitter.push(socialText);
                        } else if (ariaLabel.includes('tiktok') || className.includes('tiktok')) {
                            socials.tiktok.push(socialText);
                        } else if (ariaLabel.includes('github') || className.includes('github')) {
                            socials.github.push(socialText);
                        } else if (ariaLabel.includes('pinterest') || className.includes('pinterest')) {
                            socials.pinterest.push(socialText);
                        } else {
                            // Fallback: assign based on selector position
                            const selectorIndex = socialSelectors.indexOf(selector);
                            if (selectorIndex === 0) socials.facebook.push(socialText);
                            else if (selectorIndex === 1) socials.instagram.push(socialText);
                            else if (selectorIndex === 2) socials.youtube.push(socialText);
                        }
                    }
                }
            }
        });
    }

    // Generic social media extraction (works on all sites)
    const htmlContent = document.documentElement.innerHTML;

    const socialPatterns = {
        linkedin: /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|company)\/[a-zA-Z0-9_-]+/gi,
        twitter: /(?:https?:\/\/)?(?:www\.)?(?:twitter|x)\.com\/[a-zA-Z0-9_]+/gi,
        facebook: /(?:https?:\/\/)?(?:www\.)?facebook\.com\/[a-zA-Z0-9.]+/gi,
        instagram: /(?:https?:\/\/)?(?:www\.)?instagram\.com\/[a-zA-Z0-9_.]+/gi,
        tiktok: /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[a-zA-Z0-9_.]+/gi,
        youtube: /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:c\/|channel\/|user\/|@)[a-zA-Z0-9_-]+/gi,
        github: /(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/gi,
        pinterest: /(?:https?:\/\/)?(?:www\.)?pinterest\.com\/[a-zA-Z0-9_]+/gi
    };

    for (const [platform, regex] of Object.entries(socialPatterns)) {
        const matches = htmlContent.match(regex) || [];
        const uniqueLinks = [...new Set(matches.map(m => {
            m = m.toLowerCase();
            return m.startsWith('http') ? m : 'https://' + m;
        }))];

        // Add to platform array if not already present
        uniqueLinks.forEach(link => {
            if (!socials[platform].includes(link)) {
                socials[platform].push(link);
            }
        });
    }

    return { emails, phones, socials };
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extract") {
        sendResponse(extractData());
    }
});
