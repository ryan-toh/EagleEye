export const userGuideDom = {};

export function initUserGuideDom() {
    Object.assign(userGuideDom, {
        userGuideMain: document.getElementById("user-guide-main")
    })
}

export function renderUserGuideText(html) {
    userGuideDom.userGuideMain.innerHTML = html
}