import { tabBarDom, initTabBarDomElements } from "./dom.js";
import { renderStep, appState } from "../../state.js";

export function initTabBar() {
    initTabBarDomElements();

    tabBarDom.tabBar.addEventListener(
        'click',
        (e) => {
            const flow = e.target.getAttribute('data-flow');
            if (flow) {
                appState.flow = flow;
                renderStep();
                console.log("clicked on button: " + flow);
            }
        }
    )
}