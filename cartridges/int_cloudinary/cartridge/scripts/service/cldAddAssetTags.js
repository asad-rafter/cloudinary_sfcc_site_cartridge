'use strict';

/**
 * This method creates the request object.
 *
 * @param {Object} args - The arguments
 *
 * @returns {string} result - The API service response (JSON)
 */
function buildPayload(args) {
    var Calendar = require('dw/util/Calendar');
    var logger = require('dw/system/Logger').getLogger('Cloudinary', 'UPLOAD');

    var cloudinaryUtils = require('~/cartridge/scripts/util/cloudinaryUtils');

    var prefs = args.servicePrefs;
    var publicID = args.assetPublicID;
    var requestObj = {};
    // If the API key is missing throw an error
    if (empty(prefs.CLD_APIKEY)) {
        logger.error(prefs.CLD_MISSING_KEY);
        return false;
    }
    if (empty(prefs.CLD_APISECRET)) {
        logger.error(prefs.CLD_MISSING_PARAM);
        return false;
    }
    // Required params for signed upload are cloud_name, resource_type, file, api_key, timestamp, signature
    requestObj.public_ids = (publicID.indexOf(prefs.FORWARD_SLASH) === 0) ? publicID.substring(1) : publicID;
    requestObj.tag = args.tags;
    requestObj.command = 'add';
    requestObj.timestamp = (new Calendar().getTime().getTime() / 1000).toFixed();
    // Add SHA-1 hash signature for valid fields
    requestObj.signature = cloudinaryUtils.buildSignature(requestObj, prefs.CLD_APISECRET);
    // These MUST come after buildSignature() so they aren't included in hash [API key, cloud name, file, resource_type]
    requestObj.api_key = prefs.CLD_APIKEY;
    requestObj.cloud_name = prefs.CLD_CLOUDNAME;
    requestObj.resource_type = args.resource_type;

    return requestObj;
}

/**
 * This method uses the service to get order history from cld.
 * @param {string} args - any arguments passed
 *
 * @returns {string} result - The API service response (JSON)
 */
function addAssetTags(args) {
    var logger = require('dw/system/Logger').getLogger('Cloudinary', 'UPLOAD');
    var cloudinaryUtils = require('~/cartridge/scripts/util/cloudinaryUtils');

    var prefs = args.servicePrefs;
    var result = [];
    var cldResponse = { ok: true, message: '' };
    // if either of the params are empty, return error
    if (empty(args)) {
        logger.error(prefs.CLD_MISSING_PARAM);
        result.status = 500;
        result.errorMessage = prefs.CLD_MISSING_PARAM;

        return result;
    }

    var configArgs = args;
    configArgs.method = configArgs.servicePrefs.POST_METHOD;

    var service = args.cldUploadSvc;

    try {
        configArgs.resource_type = cloudinaryUtils.getAssetType(configArgs.file, configArgs.servicePrefs);
    } catch (e) {
        configArgs.resource_type = configArgs.servicePrefs.CONTENT_TYPE_IMAGE;
    }

    if (empty(configArgs.resource_type)) {
        configArgs.resource_type = configArgs.servicePrefs.CONTENT_TYPE_IMAGE;
    }

    configArgs.endPoint = prefs.CLD_CLOUDNAME + configArgs.servicePrefs.FORWARD_SLASH + configArgs.resource_type + configArgs.servicePrefs.TAGS_ENDPOINT;
    // Build the request package
    var assetReqObj = buildPayload(configArgs);

    // Now call the API
    try {
        result = service.call(assetReqObj);
        if (result.ok && result.error === 0) {
            cldResponse.ok = true;
            cldResponse.message = 'Upload successful. Public ID: ' + result.object.public_id + ' access: ' + result.object.access_mode + ' format: ' + result.object.format;
            cldResponse.resultObj = result.object;
        } else {
            cldResponse.ok = false;
            cldResponse.message = result.errorMessage;
            cldResponse.errorCode = result.error;
        }
    } catch (e) {
        dw.system.Logger.error(prefs.CLD_GENERAL_ERROR + e.message);
        cldResponse.ok = false;
        cldResponse.message = e.message;
    }
    return cldResponse;
}

/*
* Module exposed methods
*/
module.exports = {
    addAssetTags: addAssetTags
};
