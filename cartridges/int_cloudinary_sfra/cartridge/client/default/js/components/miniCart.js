'use strict';

module.exports = function () {
    // Custom Start: Make cart product images responsive //
    const targetNode = document.querySelector('.minicart');
    if (targetNode) {
        const config = { childList: true, subtree: true };
        const callback = function () {
            if (targetNode.innerHTML.length > 0 && typeof window.makeCloudinaryImagesResponsive !== 'undefined') {
                window.makeCloudinaryImagesResponsive();
            }
        };
        const observer = new MutationObserver(callback);
        observer.observe(targetNode, config);
    }
    // Custom End: Make cart product images responsive //
};
