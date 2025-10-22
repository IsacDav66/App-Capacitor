// /js/modules/ui/themeManager.js

import { updateNativeUIColors, syncNativeTheme } from './nativeBridge.js';

const SUN_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M11 0.25C11.1989 0.25 11.3897 0.329018 11.5303 0.46967C11.671 0.610322 11.75 0.801088 11.75 1V2C11.75 2.19891 11.671 2.38968 11.5303 2.53033C11.3897 2.67098 11.1989 2.75 11 2.75C10.8011 2.75 10.6103 2.67098 10.4697 2.53033C10.329 2.38968 10.25 2.19891 10.25 2V1C10.25 0.801088 10.329 0.610322 10.4697 0.46967C10.6103 0.329018 10.8011 0.25 11 0.25ZM3.399 3.399C3.53963 3.25855 3.73025 3.17966 3.929 3.17966C4.12775 3.17966 4.31837 3.25855 4.459 3.399L4.852 3.791C4.98869 3.93239 5.06437 4.1218 5.06276 4.31845C5.06114 4.5151 4.98235 4.70325 4.84336 4.84237C4.70437 4.98149 4.5163 5.06046 4.31965 5.06226C4.123 5.06406 3.93352 4.98855 3.792 4.852L3.399 4.459C3.25855 4.31837 3.17966 4.12775 3.17966 3.929C3.17966 3.73025 3.25855 3.53963 3.399 3.399ZM18.601 3.399C18.7414 3.53963 18.8203 3.73025 18.8203 3.929C18.8203 4.12775 18.7414 4.31837 18.601 4.459L18.208 4.852C18.0658 4.98448 17.8778 5.0566 17.6835 5.05317C17.4892 5.04975 17.3038 4.97104 17.1664 4.83362C17.029 4.69621 16.9503 4.51082 16.9468 4.31652C16.9434 4.12222 17.0155 3.93417 17.148 3.792L17.541 3.399C17.6816 3.25855 17.8722 3.17966 18.071 3.17966C18.2698 3.17966 18.4604 3.25855 18.601 3.399ZM0.25 11C0.25 10.8011 0.329018 10.6103 0.46967 10.4697C0.610322 10.329 0.801088 10.25 1 10.25H2C2.19891 10.25 2.38968 10.329 2.53033 10.4697C2.67098 10.6103 2.75 10.8011 2.75 11C2.75 11.1989 2.67098 11.3897 2.53033 11.5303C2.38968 11.671 2.19891 11.75 2 11.75H1C0.801088 11.75 0.610322 11.671 0.46967 11.5303C0.329018 11.3897 0.25 11.1989 0.25 11ZM19.25 11C19.25 10.8011 19.329 10.6103 19.4697 10.4697C19.6103 10.329 19.8011 10.25 20 10.25H21C21.1989 10.25 21.3897 10.329 21.5303 10.4697C21.671 10.6103 21.75 10.8011 21.75 11C21.75 11.1989 21.671 11.3897 21.5303 11.5303C21.3897 11.671 21.1989 11.75 21 11.75H20C19.8011 11.75 19.6103 11.671 19.4697 11.5303C19.329 11.3897 19.25 11.1989 19.25 11ZM17.148 17.148C17.2886 17.0076 17.4792 16.9287 17.678 16.9287C17.8768 16.9287 18.0674 17.0076 18.208 17.148L18.601 17.541C18.6747 17.6097 18.7338 17.6925 18.7748 17.7845C18.8158 17.8765 18.8378 17.9758 18.8396 18.0765C18.8414 18.1772 18.8228 18.2772 18.7851 18.3706C18.7474 18.464 18.6913 18.5488 18.62 18.62C18.5488 18.6913 18.464 18.7474 18.3706 18.7851C18.2772 18.8228 18.1772 18.8414 18.0765 18.8396C17.9758 18.8378 17.8765 18.8158 17.7845 18.7748C17.6925 18.7338 17.6097 18.6747 17.541 18.601L17.148 18.208C17.0076 18.0674 16.9287 17.8768 16.9287 17.678C16.9287 17.4792 17.0076 17.2886 17.148 17.148ZM4.852 17.148C4.99245 17.2886 5.07134 17.4792 5.07134 17.678C5.07134 17.8768 4.99245 18.0674 4.852 18.208L4.459 18.601C4.39034 18.6747 4.30754 18.7338 4.21554 18.7748C4.12354 18.8158 4.02423 18.8378 3.92352 18.8396C3.82282 18.8414 3.72279 18.8228 3.6294 18.7851C3.53601 18.7474 3.45118 18.6913 3.37996 18.62C3.30874 18.5488 3.2526 18.464 3.21488 18.3706C3.17716 18.2772 3.15863 18.1772 3.16041 18.0765C3.16219 17.9758 3.18423 17.8765 3.22522 17.7845C3.26621 17.6925 3.32531 17.6097 3.399 17.541L3.791 17.148C3.86065 17.0783 3.94335 17.023 4.03438 16.9853C4.1254 16.9476 4.22297 16.9282 4.3215 16.9282C4.42003 16.9282 4.5176 16.9476 4.60862 16.9853C4.69965 17.023 4.78235 17.0783 4.852 17.148ZM11 19.25C11.1989 19.25 11.3897 19.329 11.5303 19.4697C11.671 19.6103 11.75 19.8011 11.75 20V21C11.75 21.1989 11.671 21.3897 11.5303 21.5303C11.3897 21.671 11.1989 21.75 11 21.75C10.8011 21.75 10.6103 21.671 10.4697 21.5303C10.329 21.3897 10.25 21.1989 10.25 21V20C10.25 19.8011 10.329 19.6103 10.4697 19.4697C10.6103 19.329 10.8011 19.25 11 19.25Z" fill="white"/></svg>`;
const MOON_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 19 19" fill="none"><path d="M5 2.99994C5 9.07994 9.92 13.9999 16 13.9999C16.53 13.9999 17.05 13.9599 17.56 13.8899C15.95 16.3599 13.17 17.9999 10 17.9999C5.03 17.9999 1 13.9699 1 8.99994C1 5.82994 2.64 3.04994 5.11 1.43994C5.04 1.94994 5 2.46994 5 2.99994Z" fill="var(--color-text)" stroke="var(--color-text)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const themes = {
    'purple': { image: 'linear-gradient(#000, #000), linear-gradient(#111, #111), linear-gradient(#222, #222), linear-gradient(#8A2BE2, #8A2BE2), linear-gradient(#FFF, #FFF)', size: '20% 100%, 20% 100%, 20% 100%, 20% 100%, 20% 100%', position: '0% 0, 20% 0, 40% 0, 60% 0, 80% 0' },
    'green': { image: 'linear-gradient(#011C13, #011C13), linear-gradient(#0A2E22, #0A2E22), linear-gradient(#133F31, #133F31), linear-gradient(#26DE9D, #26DE9D), linear-gradient(#FFF, #FFF)', size: '20% 100%, 20% 100%, 20% 100%, 20% 100%, 20% 100%', position: '0% 0, 20% 0, 40% 0, 60% 0, 80% 0' },
    'rose': { image: 'linear-gradient(#2B191D, #2B191D), linear-gradient(#40262C, #40262C), linear-gradient(#57333B, #57333B), linear-gradient(#F48A9C, #F48A9C), linear-gradient(#FFF, #FFF)', size: '20% 100%, 20% 100%, 20% 100%, 20% 100%, 20% 100%', position: '0% 0, 20% 0, 40% 0, 60% 0, 80% 0' },
    'blue': { image: 'linear-gradient(#291F37, #291F37), linear-gradient(#3C3552, #3C3552), linear-gradient(#5D5279, #5D5279), linear-gradient(#9384A9, #9384A9), linear-gradient(#DABFEE, #DABFEE)', size: '20% 100%, 20% 100%, 20% 100%, 20% 100%, 20% 100%', position: '0% 0, 20% 0, 40% 0, 60% 0, 80% 0' }
};

export function initThemesPage() {
    const themeSelector = document.getElementById('theme-selector-container');
    const modeToggleButton = document.getElementById('theme-mode-toggle');
    if (!themeSelector) return;

    let currentTheme = localStorage.getItem('app-theme') || 'purple';
    let currentMode = localStorage.getItem('app-mode') || 'dark';

    function renderThemeCircles() {
        themeSelector.innerHTML = '';
        for (const themeName in themes) {
            const circleWrapper = document.createElement('div');
            circleWrapper.className = 'theme-circle';
            const colorBands = document.createElement('div');
            colorBands.className = 'theme-color-bands';
            colorBands.style.backgroundImage = themes[themeName].image;
            colorBands.style.backgroundSize = themes[themeName].size;
            colorBands.style.backgroundPosition = themes[themeName].position;
            colorBands.style.backgroundRepeat = 'no-repeat';
            circleWrapper.appendChild(colorBands);

            if (themeName === currentTheme) {
                circleWrapper.classList.add('active');
            }
            circleWrapper.dataset.theme = themeName;
            circleWrapper.addEventListener('click', () => {
                currentTheme = themeName;
                localStorage.setItem('app-theme', currentTheme);
                document.documentElement.setAttribute('data-theme', currentTheme);
                renderThemeCircles();
                updateNativeUIColors();
                syncNativeTheme();
            });
            themeSelector.appendChild(circleWrapper);
        }
    }
    
    function applyMode(mode) {
        document.documentElement.setAttribute('data-mode', mode);
        modeToggleButton.innerHTML = mode === 'dark' ? SUN_ICON : MOON_ICON;
    }
    
    modeToggleButton.addEventListener('click', () => {
        currentMode = currentMode === 'dark' ? 'light' : 'dark';
        localStorage.setItem('app-mode', currentMode);
        applyMode(currentMode);
        updateNativeUIColors();
        syncNativeTheme();
    });

    renderThemeCircles();
    applyMode(currentMode);
    updateNativeUIColors();
    syncNativeTheme();
}