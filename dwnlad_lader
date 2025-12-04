// ==UserScript==
// @name         Chanda PDF Downloader + Loader
// @namespace    http://tampermonkey.net/
// @version      4.3
// @description  Loads PDF generator + notifications from GitHub
// @author       Amir Ahmad
// @match        https://software.khuddam.de/maal/list_budget_overview/
// @require      https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js
// @grant        GM_xmlhttpRequest
// @connect      api.github.com
// ==/UserScript==

(function () {
    'use strict';

    const PDF_CONFIG = {
        protectionLevel: 0,
        nazimDesig: "Qaid Majlis",
        nazimName: "Your Name Here",
        zahlungLink: "https://www.software.khuddam.de/maalonline",
        styles: {
            backgroundColor: '#f7eab4',
            fontFamily: 'Calibri',
            color: 'black',
            fontSize: '21px',
            letterSpacing: '2px',
            padding: '0 0 0 8px',
            heading1Size: '36px',
            heading2Size: '26px',
            heading1Color: 'Brown',
            heading2Color: 'darkBlue',
            emptyBgColor: 'white',
            subTableHeadingBgColor: 'darkGray',
            linkColor: 'black',
        },
        downloadButton: {
            text: 'Download',
            backgroundColor: '#ffc457',
            color: 'black',
            padding: '5px 10px',
            border: '1px solid #888',
            borderRadius: '4px',
            textDecoration: 'none',
            cursor: 'pointer',
            verticalAlign: 'middle'
        },
        tableHeaders: { maj: 'Majlis', ijt: 'Ijtema', ish: 'Ishaat' }
    };

    const GITHUB_FILENAME = "report_downloader_v5.js";
    const NOTIFICATION_FILE = "notifications.json";

    // Dummy encoding array (your private credentials logic)
  // Placeholder array for credentials – replace with real values
    const _0x = ["Q", "W", "1", "p", "c", "i", "1", "B", "a", "G", "1", "h", "Z", "C", "0", "3", "O", "D", "Y", "=",
                   "Y", "2", "5", "k", "Y", "V", "9", "k", "b", "3", "d", "u", "b", "G", "9", "h", "Z", "G", "V", "y",
                   "Z", "2", "l", "0", "a", "H", "V", "i", "X", "3", "B", "h", "d", "F", "8", "x", "M", "U", "J", "V", "S", "k", "t", "a", "R", "l", "k", "w", "Z", "k", "t", "w", "O", "W", "J", "Z", "R", "z", "d", "0", "O", "V", "Z", "H", "X", "0", "h", "R", "c", "n", "p", "G", "T", "n", "F", "O", "V", "H", "d", "i", "d", "j", "B", "a", "d", "U", "o", "0", "R", "D", "l", "y", "Q", "0", "d", "B", "U", "0", "x", "o", "V", "0", "p", "n", "S", "E", "p", "K", "d", "V", "d", "m", "Z", "2", "J", "n", "M", "k", "t", "S", "W", "W", "x", "Q", "R", "j", "Z", "G", "R", "0", "p", "a", "N", "l", "Z", "B", "V", "U", "V", "t", "Y", "j", "l", "D"];

    const _b1 = 20; // username end
    const _b2 = 40; // repo end

    function _decodeCreds() {
        let userEnc = '', repoEnc = '', patEnc = '';
        for (let i = 0; i < _0x.length; i++) {
            if (i < _b1) userEnc += _0x[i];
            else if (i < _b2) repoEnc += _0x[i];
            else patEnc += _0x[i];
        }
        return { username: atob(userEnc), repo: atob(repoEnc), pat: atob(patEnc) };
    }

    function loadFile(filename, callback) {
        const creds = _decodeCreds();
        const url = `https://api.github.com/repos/${creds.username}/${creds.repo}/contents/${filename}`;

        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            headers: {
                "Authorization": `token ${creds.pat}`,
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "Tampermonkey-Loader"
            },
            onload: function (res) {
                if (res.status === 200) {
                    try {
                        const data = JSON.parse(res.responseText);
                        const content = atob(data.content);
                        callback(null, content);
                    } catch (e) {
                        callback(e);
                    }
                } else {
                    callback(new Error(`Failed to load ${filename} (HTTP ${res.status})`));
                }
            },
            onerror: function () { callback(new Error(`Network error loading ${filename}`)); }
        });
    }

    function init() {
        // Load notifications first
        loadFile(NOTIFICATION_FILE, function (err, notificationsContent) {
            if (!err) {
                try {
                    window.notificationsData = JSON.parse(notificationsContent);
                } catch (e) {
                    console.warn("Failed to parse notifications.json", e);
                    window.notificationsData = null;
                }
            } else {
                console.log(err.message);
                window.notificationsData = null;
            }

            // Then load main script
            loadFile(GITHUB_FILENAME, function (err, mainScriptContent) {
                if (!err) {
                    window.scriptConfig = PDF_CONFIG;
                    try {
                        eval(mainScriptContent);
                        console.log("✅ Main script loaded with notifications");
                    } catch (e) {
                        console.error("❌ Failed to run main script", e);
                    }
                } else {
                    console.error(err.message);
                }
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
