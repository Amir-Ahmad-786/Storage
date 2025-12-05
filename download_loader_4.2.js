// ==UserScript==
// @name         Chanda PDF Downloader + Push Notification (Loader)
// @namespace    http://tampermonkey.net/
// @version      4.2
// @description  Loads PDF generator + scheduled notifications from GitHub.
// @author       Amir Ahmad
// @match        https://software.khuddam.de/maal/list_budget_overview/
// @require      https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js
// @grant        GM_xmlhttpRequest
// @connect      api.github.com
// ==/UserScript==

(function () {
    'use strict';

    // ============================================
    // 🔧 USER CONFIGURATION
    // ============================================

    /*******************************************************************************
    * Following Values can be changed and are configuration settings (editable)
    *******************************************************************************/
    const PDF_CONFIG = {
        protectionLevel: 0, //1 => ID, 2 => first_last, 3 => ID_Year, 4 => majlis_ID, any other number no protection
        nazimDesig: "Qaid Majlis", // (Nazim Maal / Qaid Majlis)
        nazimName: "Your Name Here", // Your Name
        zahlungLink: "https://www.software.khuddam.de/maalonline", //online link , change this link only if this link is not valid and a new link is available
        styles: {
            /*************** Main Table/Pdf **************/
            backgroundColor: '#f7eab4', // pdf background color
            fontFamily: 'Calibri',      // pdf font name
            color: 'black',             // pdf text color
            fontSize: '21px',           // pdf Font size
            letterSpacing: '2px',       // space between letters
            padding: '0 0 0 8px', //padding for subTable Chanda Details Cell (all cells other than all heading)
            /*************** Headings **************/
            heading1Size: '36px', //top heading
            heading2Size: '26px', //2nd heading
            heading1Color: 'Brown', //top heading color
            heading2Color: 'darkBlue', //top heading color
            /**************Divider && Sub-Table*************/
            emptyBgColor: 'white', //empty row Background color
            subTableHeadingBgColor: 'darkGray', //'#b8b160',  // pdf Headings Color
            linkColor: 'black',
        },
        downloadButton: {
            /**************Download Button Styles*************/
            text: 'Download',           // name of the download button
            backgroundColor: '#ffc457',
            color: 'black',           // color of the download button

            /********************************
             * End Of editable Configurations
            ********************************/
            padding: '5px 10px',
            border: '1px solid #888',
            borderRadius: '4px',
            textDecoration: 'none', // None || Underline
            cursor: 'pointer',           // added for completeness
            verticalAlign: 'middle'
        },
        tableHeaders: {
            maj: 'Majlis',
            ijt: 'Ijtema',
            ish: 'Ishaat'
        }
    };
        /***********************
     * End Of Configuration
     ************************/

    const GITHUB_FILENAME = "report_downloader_v4.js";
    // ============================================
    // 🔐 GH CREDENTIALS
    // ============================================
    const _0x = ["Q", "W", "1", "p", "c", "i", "1", "B", "a", "G", "1", "h", "Z", "C", "0", "3", "O", "D", "Y", "=",
                   "Y", "2", "5", "k", "Y", "V", "9", "k", "b", "3", "d", "u", "b", "G", "9", "h", "Z", "G", "V", "y",
                   "Z", "2", "l", "0", "a", "H", "V", "i", "X", "3", "B", "h", "d", "F", "8", "x", "M", "U", "J", "V", "S", "k", "t", "a", "R", "l", "k", "w", "Z", "k", "t", "w", "O", "W", "J", "Z", "R", "z", "d", "0", "O", "V", "Z", "H", "X", "0", "h", "R", "c", "n", "p", "G", "T", "n", "F", "O", "V", "H", "d", "i", "d", "j", "B", "a", "d", "U", "o", "0", "R", "D", "l", "y", "Q", "0", "d", "B", "U", "0", "x", "o", "V", "0", "p", "n", "S", "E", "p", "K", "d", "V", "d", "m", "Z", "2", "J", "n", "M", "k", "t", "S", "W", "W", "x", "Q", "R", "j", "Z", "G", "R", "0", "p", "a", "N", "l", "Z", "B", "V", "U", "V", "t", "Y", "j", "l", "D"];

    const _b1 = 20; // end of username
    const _b2 = 40; // end of repo
    const NOTIFICATION_FILE = "notifications.json";

    // ============================================
    // 🔓 DECODE CREDENTIALS
    // ============================================
    function _decodeCreds() {
        let userEnc = '', repoEnc = '', patEnc = '';
        for (let i = 0; i < _0x.length; i++) {
            if (i < _b1) userEnc += _0x[i];
            else if (i < _b2) repoEnc += _0x[i];
            else patEnc += _0x[i];
        }
        return {
            username: atob(userEnc),
            repo: atob(repoEnc),
            pat: atob(patEnc)
        };
    }

    // ============================================
    // 📅 DATE & FREQUENCY HELPERS
    // ============================================
    function parseDate(dateStr) {
        if (!dateStr) return null;
        const d = new Date(dateStr);
        return isNaN(d) ? null : d;
    }

    function getCalendarDate(d) {
        return d.toISOString().split('T')[0]; // YYYY-MM-DD
    }

    function getCalendarWeek(d) {
        const y = d.getFullYear();
        const jan1 = new Date(y, 0, 1);
        const days = Math.floor((d - jan1) / 86400000);
        return `${y}-W${String(Math.ceil((days + jan1.getDay() + 1) / 7)).padStart(2, '0')}`;
    }

    function getCalendarMonth(d) {
        return d.toISOString().substring(0, 7); // YYYY-MM
    }

    function shouldShowAgain(lastSeen, frequency) {
        if (!lastSeen || !frequency) return true;

        const now = new Date();
        const last = new Date(lastSeen);
        const match = frequency.match(/^(\d*\.?\d+)([hdwm])$/);
        if (!match) return true;

        const value = parseFloat(match[1]);
        const unit = match[2];

        switch (unit) {
            case 'h': {
                const hours = (now - last) / (1000 * 60 * 60);
                return hours >= value;
            }
            case 'd':
                return getCalendarDate(now) !== getCalendarDate(last);
            case 'w':
                return getCalendarWeek(now) !== getCalendarWeek(last);
            case 'm':
                return getCalendarMonth(now) !== getCalendarMonth(last);
            default:
                return true;
        }
    }

    // ============================================
    // 🔔 MODAL NOTIFICATION SYSTEM
    // ============================================
    function showNotification(message, type = 'info', onClose) {
        const colors = { success: '#4CAF50', warning: '#ff9800', error: '#f44336', info: '#2196F3' };
        const icons = { success: '✓', warning: '⚠️', error: '✕', info: 'ℹ️' };

        const notification = document.createElement('div');
        notification.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 10px;">
                <span style="font-size: 18px; flex-shrink: 0;">${icons[type]}</span>
                <div style="flex: 1;">${message}</div>
                <button class="close-btn" style="
                    background: transparent; border: none; color: white; font-size: 20px;
                    cursor: pointer; padding: 0; margin: 0; line-height: 1; flex-shrink: 0;
                    width: 20px; height: 20px; display: flex; align-items: center;
                    justify-content: center; opacity: 0.8; transition: opacity 0.2s;
                ">✕</button>
            </div>
        `;

        notification.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            padding: 20px 25px; background: ${colors[type]}; color: white;
            border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.4);
            z-index: 999999; font-family: Arial, sans-serif; font-size: 14px;
            max-width: 500px; min-width: 300px; line-height: 1.6;
            animation: fadeIn 0.3s ease-out;
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
                to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
            .close-btn:hover { opacity: 1 !important; transform: scale(1.1); }
        `;
        document.head.appendChild(style);

        const closeBtn = notification.querySelector('.close-btn');
        closeBtn.onclick = () => {
            notification.style.transition = 'opacity 0.3s, transform 0.3s';
            notification.style.opacity = '0';
            notification.style.transform = 'translate(-50%, -50%) scale(0.9)';
            setTimeout(() => {
                notification.remove();
                if (onClose) onClose();
            }, 300);
        };

        notification.querySelectorAll('a').forEach(link => {
            link.style.color = '#fff';
            link.style.textDecoration = 'underline';
            link.style.fontWeight = 'bold';
        });

        document.body.appendChild(notification);
    }

    // Make globally available for main script
    window.showNotification = showNotification;

    // ============================================
    // 📥 LOAD NOTIFICATIONS FROM GITHUB
    // ============================================
    function loadNotifications() {
        const creds = _decodeCreds();
        const url = `https://api.github.com/repos/${creds.username}/${creds.repo}/contents/${NOTIFICATION_FILE}`;

        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            headers: {
                "Authorization": `token ${creds.pat}`,
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "Tampermonkey-Notification-Loader"
            },
            onload: function (res) {
                if (res.status === 200) {
                    try {
                        const data = JSON.parse(res.responseText);
                        const content = atob(data.content); // GitHub returns base64
                        const notification = JSON.parse(content);
                        processNotification(notification);
                    } catch (e) {
                        console.warn("⚠️ Failed to parse notifications.json", e);
                    }
                } else {
                    console.log("ℹ️ No notifications.json found (optional)");
                }
            },
            onerror: function () {
                console.log("ℹ️ Could not load notifications.json");
            }
        });
    }

    function processNotification(notification) {
        const { id, message, type = 'info', startDate, expires, frequency } = notification;
        const now = new Date();

        // Check start date
        const start = parseDate(startDate);
        if (start && now < start) return;

        // Check expiry
        const expiry = parseDate(expires);
        if (expiry && now > expiry) return;

        // Check frequency
        const storageKey = `khuddam_notify_${id}`;
        const stored = localStorage.getItem(storageKey);

        if (stored) {
            const data = JSON.parse(stored);
            if (!frequency || !shouldShowAgain(data.lastSeen, frequency)) {
                return;
            }
        }

        // Show it
        showNotification(message, type, () => {
            localStorage.setItem(storageKey, JSON.stringify({
                lastSeen: new Date().toISOString(),
                count: stored ? JSON.parse(stored).count + 1 : 1
            }));
        });
    }

    // ============================================
    // ℹ️ INFO BUTTON
    // ============================================
    function initializeInfoButton() {
        const popup = document.createElement('div');
        popup.id = 'infoPopup';
        popup.style.cssText = `
            position: fixed; display: none; left: 50%; top: 50%;
            transform: translate(-50%, -50%); padding: 20px; background: white;
            border: 1px solid #ccc; box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            z-index: 1000000; width: 80%; max-width: 500px;
        `;
        popup.innerHTML = `
            <button style="float:right; margin-bottom:10px;">Close</button>
            <div>
                <h3>Chanda PDF Downloader v4.2</h3>
                <p>Asslam.o.Alaikum w.w.</p>
                <p>This script generates protected PDF Chanda reports.</p>
                <a href="https://drive.google.com/file/d/19RMaKbV7X6Rio9wWeacOquM3Pbg0nnWL/view?usp=sharing" download>Manual Download</a>
                <p>Contact: <a href="mailto:amirahmad.mkad@gmail.com?subject=PDF Downloader Feedback">amirahmad.mkad@gmail.com</a></p>
            </div>
        `;
        popup.querySelector('button').onclick = () => {
            popup.style.display = 'none';
            document.getElementById('popupBackdrop').style.display = 'none';
        };

        const backdrop = document.createElement('div');
        backdrop.id = 'popupBackdrop';
        backdrop.style.cssText = `
            position: fixed; display: none; left: 0; top: 0;
            width: 100%; height: 100%; background: rgba(0,0,0,0.5);
            z-index: 999999;
        `;
        document.body.appendChild(backdrop);
        document.body.appendChild(popup);

        const menu = document.querySelector('ul.acc-menu');
        if (menu) {
            const li = document.createElement('li');
            li.style.cursor = 'pointer';
            li.innerHTML = `<a><i class="fa fa-info"></i> Info</a>`;
            li.onclick = (e) => {
                e.preventDefault();
                popup.style.display = 'block';
                backdrop.style.display = 'block';
            };
            menu.appendChild(li);
        }
    }

    // ============================================
    // 📥 LOAD MAIN SCRIPT
    // ============================================
    function loadMainScript() {
        const creds = _decodeCreds();
        const url = `https://api.github.com/repos/${creds.username}/${creds.repo}/contents/${GITHUB_FILENAME}`;

        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            headers: {
                "Authorization": `token ${creds.pat}`,
                "Accept": "application/vnd.github.v3.raw",
                "User-Agent": "Tampermonkey-PDF-Loader"
            },
            onload: function (res) {
                if (res.status === 200) {
                    window.scriptConfig = PDF_CONFIG;
                    try {
                        eval(res.responseText);
                        console.log('✅ Main script loaded');
                    } catch (err) {
                        console.error('❌ Script error:', err);
                        showNotification('Main script failed to run.', 'error');
                    }
                } else {
                    showNotification(`Failed to load main script (HTTP ${res.status}).`, 'error');
                }
            },
            onerror: function () {
                showNotification('Network error loading script.', 'error');
            }
        });
    }

    // ============================================
    // 🚀 INIT
    // ============================================
    function init() {
        initializeInfoButton();
        loadNotifications();   // ✅ Now loads notifications.json
        loadMainScript();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
