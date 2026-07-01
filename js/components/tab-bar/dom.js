export const tabBarDom = {}

export function initTabBarDomElements() {
    Object.assign(tabBarDom, {
        tabBar: document.getElementById('tab-bar'),
        tabView: document.getElementById('tab-view'),
        tabEdit: document.getElementById('tab-edit'),
    })
}