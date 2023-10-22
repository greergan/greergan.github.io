const addEventListener = async (id, event, callable) => {
    //console.log('Utilities.addEventListener::beginning', id, event);
    (id && event && typeof callable === 'function')
        ? document.getElementById(id).addEventListener(event, callable, true)
        : console.error("Utilities.addEventListener failed", id, event, typeof callable);
}
const removeEventListener = async (id, event, callable) => {
    //console.log('Utilities.removeEventListener::beginning', id, event);
    (id && event && typeof callable === 'function')
        ? document.getElementById(id).removeEventListener(event, callable, true)
        : console.error("Utilities.removeEventListener failed", id, event);
}
const stopPropagation = (event) => {
    try {
        event.stopPropagation();
    }
    catch(e) {
        console.trace(e);
    }
}
export const utilities = {
    addEventListener:addEventListener,
    removeEventListener:removeEventListener,
    stopPropagation:stopPropagation
}