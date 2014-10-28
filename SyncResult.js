/**
 * Created by HeavenVolkoff on 24/10/14.
 */
'use strict';

function SyncResult(index, syncId, existing, nonExisting){
	Object.defineProperties(this, {
		'index': {
			value: index,
			writable: true
		},
		'syncId': {
			value: syncId,
			writable: true
		},
		'existing': {
			value: existing,
			writable: true
		},
		'nonExisting': {
			value: nonExisting,
			writable: true
		}
	});
}
