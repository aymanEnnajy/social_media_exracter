// Content script to extract data from the page using CSS selectors
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

    // Extract Email using CSS selector
    const emailElement = document.querySelector('.ekit-header-info li:nth-child(2) a');
    if (emailElement) {
        const emailText = emailElement.textContent.trim() || emailElement.href.replace('mailto:', '');
        if (emailText) {
            emails.push(emailText);
        }
    }

    // Extract Phone using CSS selector
    const phoneElement = document.querySelector('.ekit-header-info li:nth-child(3) a');
    if (phoneElement) {
        const phoneText = phoneElement.textContent.trim() || phoneElement.href.replace('tel:', '');
        if (phoneText) {
            phones.push(phoneText);
        }
    }

    // Extract Social Media links using specific span selectors
    const socialSelectors = [
        'div[class="elementor-social-icons-wrapper elementor-grid"] span:nth-child(1) a span',
        'div[class="elementor-social-icons-wrapper elementor-grid"] span:nth-child(2) a span',
        'div[class="elementor-social-icons-wrapper elementor-grid"] span:nth-child(3) a span'
    ];

    socialSelectors.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            // Get the text content from the span
            const socialText = element.textContent.trim();

            if (socialText) {
                // Get the parent anchor to check aria-label and class for platform detection
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

    return { emails, phones, socials };
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extract") {
        sendResponse(extractData());
    }
});
