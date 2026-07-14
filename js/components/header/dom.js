export const headerDom = {};

export function initHeaderDomElements() {
  Object.assign(headerDom, {
    steppers: initHeaderDomElements(),
  })
}

function initStepperDomElements() {
  return document.querySelectorAll('.stepper__item');
}

// to increment the stepper in the header
export function setActiveStep(stepNumber) {
  headerDom.steppers.forEach((item, index) => {
    const n = index + 1;
    item.classList.remove('active', 'completed');
    if (n < stepNumber) item.classList.add('completed');
    if (n === stepNumber) item.classList.add('active');
  });
}