const flowchartZoomStates = new WeakMap();

/** Renders a Mermaid definition and provides the preview's pan/zoom behavior. */
export async function renderMermaid(
  targetElement,
  graphDefinition,
  isCurrentRequest = () => true,
) {
  if (!isCurrentRequest()) return { ok: false, stale: true };
  
  targetElement.classList.remove('empty');
  targetElement.innerHTML = '<div class="mermaid"></div>';

  try {
    const { svg } = await window.mermaid.render(
      `tree-${Date.now()}`,
      graphDefinition,
    );

    if (!isCurrentRequest()) return { ok: false, stale: true };

    targetElement.querySelector('.mermaid').innerHTML = svg;

    enableFlowchartPinchZoom(targetElement);
    resetFlowchartZoom(targetElement);
    centerFlowchartViewport(targetElement);

    return { ok: true };
  } catch (error) {
    if (!isCurrentRequest()) return { ok: false, stale: true };
    console.error(error);
    targetElement.innerHTML = renderMermaidError(graphDefinition);
    return { ok: false, error };
  }
}

function renderMermaidError(graphDefinition) {
  const escapedGraph = escapeGraph(graphDefinition);
  const message =
    'Mermaid could not render this chart. The raw Mermaid definition is shown above.';

  return `<pre>${escapedGraph}</pre><p class="status error">${message}</p>`;
}

function enableFlowchartPinchZoom(targetElement) {
  if (flowchartZoomStates.has(targetElement)) return;

  const state = {
    pointers: new Map(),
    scale: 1,
    baseWidth: 0,
    baseHeight: 0,
    pinchDistance: 0,
    pinchScale: 1,
    gestureScale: 1,
    panStart: null,
  };
  flowchartZoomStates.set(targetElement, state);

  const resizeObserver = new ResizeObserver(() => {
    enforceMinimumFlowchartZoom(targetElement, state);
  });
  resizeObserver.observe(targetElement);

  targetElement.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'touch') return;

    targetElement.setPointerCapture(event.pointerId);
    state.pointers.set(event.pointerId, event);

    if (state.pointers.size === 1) {
      state.panStart = {
        x: event.clientX,
        y: event.clientY,
        scrollLeft: targetElement.scrollLeft,
        scrollTop: targetElement.scrollTop,
      };
      return;
    }

    if (state.pointers.size === 2) {
      const [first, second] = [...state.pointers.values()];
      state.pinchDistance = getPointerDistance(first, second);
      state.pinchScale = state.scale;
      state.panStart = null;
    }
  });

  targetElement.addEventListener('pointermove', (event) => {
    if (!state.pointers.has(event.pointerId)) return;

    state.pointers.set(event.pointerId, event);

    if (state.pointers.size === 1 && state.panStart) {
      event.preventDefault();
      targetElement.scrollLeft =
        state.panStart.scrollLeft - (event.clientX - state.panStart.x);
      targetElement.scrollTop =
        state.panStart.scrollTop - (event.clientY - state.panStart.y);
      return;
    }

    if (state.pointers.size !== 2 || !state.pinchDistance) return;

    event.preventDefault();
    const [first, second] = [...state.pointers.values()];
    const scale = clamp(
      state.pinchScale *
        (getPointerDistance(first, second) / state.pinchDistance),
      getMinimumFlowchartZoom(targetElement, state),
      getMaximumFlowchartZoom(targetElement, state),
    );
    const center = getPointerCenter(first, second);
    zoomFlowchartAt(targetElement, state, scale, center);
  });

  targetElement.addEventListener(
    'wheel',
    (event) => {
      if (!event.ctrlKey) return;

      event.preventDefault();
      const scale = clamp(
        state.scale * Math.exp(-event.deltaY * 0.01),
        getMinimumFlowchartZoom(targetElement, state),
        getMaximumFlowchartZoom(targetElement, state),
      );
      zoomFlowchartAt(targetElement, state, scale, event);
    },
    { passive: false },
  );

  targetElement.addEventListener('touchstart', preventNativePinch, {
    passive: false,
  });
  targetElement.addEventListener('touchmove', preventNativePinch, {
    passive: false,
  });

  targetElement.addEventListener(
    'gesturestart',
    (event) => {
      event.preventDefault();
      state.gestureScale = state.scale;
    },
    { passive: false },
  );
  targetElement.addEventListener(
    'gesturechange',
    (event) => {
      event.preventDefault();
      const scale = clamp(
        state.gestureScale * event.scale,
        getMinimumFlowchartZoom(targetElement, state),
        getMaximumFlowchartZoom(targetElement, state),
      );
      zoomFlowchartAt(
        targetElement,
        state,
        scale,
        getEventCenter(event, targetElement),
      );
    },
    { passive: false },
  );

  ['pointerup', 'pointercancel'].forEach((eventName) => {
    targetElement.addEventListener(eventName, (event) => {
      state.pointers.delete(event.pointerId);
      state.pinchDistance = 0;

      if (state.pointers.size === 1) {
        const [pointer] = state.pointers.values();
        state.panStart = {
          x: pointer.clientX,
          y: pointer.clientY,
          scrollLeft: targetElement.scrollLeft,
          scrollTop: targetElement.scrollTop,
        };
      } else {
        state.panStart = null;
      }
    });
  });
}

function resetFlowchartZoom(targetElement) {
  const state = flowchartZoomStates.get(targetElement);
  const svg = targetElement.querySelector('.mermaid svg');
  if (!state || !svg) return;

  const viewBox = svg.viewBox.baseVal;
  state.baseWidth = viewBox.width || svg.getBoundingClientRect().width;
  state.baseHeight = viewBox.height || svg.getBoundingClientRect().height;
  state.scale = getMinimumFlowchartZoom(targetElement, state);
  setFlowchartScale(svg, state, state.scale);
}

function zoomFlowchartAt(targetElement, state, scale, center) {
  const svg = targetElement.querySelector('.mermaid svg');
  if (!svg || !state.baseWidth || !state.baseHeight) return;

  const bounds = targetElement.getBoundingClientRect();
  const offsetX = center.x - bounds.left;
  const offsetY = center.y - bounds.top;
  const pointX = (targetElement.scrollLeft + offsetX) / state.scale;
  const pointY = (targetElement.scrollTop + offsetY) / state.scale;

  state.scale = scale;
  setFlowchartScale(svg, state, scale);
  targetElement.scrollLeft = pointX * scale - offsetX;
  targetElement.scrollTop = pointY * scale - offsetY;
}

function enforceMinimumFlowchartZoom(targetElement, state) {
  const minimumScale = getMinimumFlowchartZoom(targetElement, state);
  if (!state.baseWidth || !state.baseHeight || state.scale >= minimumScale)
    return;

  const bounds = targetElement.getBoundingClientRect();
  zoomFlowchartAt(targetElement, state, minimumScale, {
    x: bounds.left + bounds.width / 2,
    y: bounds.top + bounds.height / 2,
  });
}

function getMinimumFlowchartZoom(targetElement, state) {
  if (!state.baseWidth || !state.baseHeight) return 0.5;

  return Math.max(
    Math.min(
      targetElement.clientWidth / state.baseWidth,
      targetElement.clientHeight / state.baseHeight,
    ),
    0.1,
  );
}

function getMaximumFlowchartZoom(targetElement, state) {
  const minimumScale = getMinimumFlowchartZoom(targetElement, state);
  return Math.max(3, minimumScale * 3);
}

function setFlowchartScale(svg, state, scale) {
  svg.style.width = `${state.baseWidth * scale}px`;
  svg.style.height = `${state.baseHeight * scale}px`;
}

function getPointerDistance(first, second) {
  return Math.hypot(
    first.clientX - second.clientX,
    first.clientY - second.clientY,
  );
}

function getPointerCenter(first, second) {
  return {
    x: (first.clientX + second.clientX) / 2,
    y: (first.clientY + second.clientY) / 2,
  };
}

function preventNativePinch(event) {
  if (event.touches.length > 1) event.preventDefault();
}

function getEventCenter(event, targetElement) {
  if (Number.isFinite(event.clientX) && Number.isFinite(event.clientY)) {
    return { x: event.clientX, y: event.clientY };
  }

  const bounds = targetElement.getBoundingClientRect();
  return {
    x: bounds.left + bounds.width / 2,
    y: bounds.top + bounds.height / 2,
  };
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function centerFlowchartViewport(targetElement) {
  requestAnimationFrame(() => {
    targetElement.scrollTop = 0;
    targetElement.scrollLeft = Math.max(
      0,
      (targetElement.scrollWidth - targetElement.clientWidth) / 2,
    );
  });
}

function escapeGraph(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}
