/**
 * Created by HeavenVolkoff on 11/16/14.
 */

'use strict';

module.exports = Constants;

function Constants(){
    /**
     * Constant declarations.
     */
    Object.defineProperties(this, {
        CHALLENGE_DATA_FILE_NAME: {
            value: 'nextChallenge.dat'
        },
        CONNECTED_STATUS: {
            value: 'connected'
        },
        COUNTRIES:{
            value: 'countries.csv'
        },
        DISCONNECTED_STATUS: {
            value: 'disconnected'
        },
        IDENTITY_LENGTH:{
            value: 48
        },
        MEDIA_FOLDER: {
            value: 'media'
        },
        PICTURES_FOLDER: {
            value: 'pictures'
        },
        PORT: {
            value: 443
        },
        TIMEOUT_SEC: {
            value: 2
        },
        TIMEOUT_USEC: {
            value: 0
        },
        WHATSAPP_CHECK_HOST: {
            value: 'v.whatsapp.net/v2/exist'
        },
        WHATSAPP_GROUP_SERVER: {
            value: 'g.us'
        },
        WHATSAPP_HOST: {
            value: 'c.whatsapp.net'
        },
        WHATSAPP_REGISTER_HOST: {
            value: 'v.whatsapp.net/v2/register'
        },
        WHATSAPP_REQUEST_HOST: {
            value: 'v.whatsapp.net/v2/code'
        },
        WHATSAPP_SERVER: {
            value: 's.whatsapp.net'
        },
        WHATSAPP_UPLOAD_HOST: {
            value: 'https://mms.whatsapp.net/client/iphone/upload.php'
        },
        WHATSAPP_DEVICE: {
            value: 'Android'
        },
        WHATSAPP_VER: {
            value: '2.11.453'
        },
        WHATSAPP_USER_AGENT: {
            value: 'WhatsApp/2.11.453 Android/4.3 Device/GalaxyS3'
        },
        WHATSAPP_VER_CHECKER: {
            value: 'https://coderus.openrepos.net/whitesoft/whatsapp_version'
        }
    });
}

