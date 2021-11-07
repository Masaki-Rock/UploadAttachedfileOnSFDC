/*Draft Request Script for DSP Branch API Call
* Tested: Upserts Case Record and Uploads File
* Issue: File uploaded is blank (PDF) and/or not viewable (Image)
*/

var boundary = "--" + "SNOWToSFDCBoundary";
var starter = "--" + boundary + "\r\n";
var footer = "\r\n--" + boundary + "--";

var incidentId = 'e8caedcbc0a80164017df472f39eaed1'; //INC0000003 - PDF FILE
//var incidentId = '8d6246c7c0a80164012fb063cecd4ace'; //INC0000006 - IMAGE
var extId = "1234";

var reqStr = makeApplicationBody(incidentId) + makeAttachedFileBody(incidentId) + footer;

sender(reqStr, boundary);

/*HTTP Request Sender*/
function sender(body) {
	
	gs.info("--sender-Start--");
	var Url = 'https://smpl-sfdc-submit-app.us-e2.cloudhub.io/api/submit/${sys_id}';
	var httpreq = new sn_ws.RESTMessageV2();
	httpreq.setHttpMethod('POST');
	httpreq.setEndpoint(Url);
	httpreq.setStringParameter('sys_id', extId);	
	// httpreq.setRequestHeader("jwt", makeJWT());
	httpreq.setRequestHeader("X-Correlation-ID", createUUID());
	httpreq.setRequestHeader("Accept", '*/*');
	httpreq.setRequestHeader("Content-Type", 'multipart/form-data; charset=utf-8; boundary=' + boundary);
	httpreq.setRequestBody(body);
	var response = httpreq.execute();
	
	gs.info("Mule Test Status " + response.getStatusCode());
	gs.info("Mule Test Body " + response.getBody());
}

function makeApplicationBody(id) {
	
	//gs.info("--makeApplicationBody-Start--");
	var body = "";
	var ir = new GlideRecord('incident');
	ir.addQuery("sys_id", id);
	ir.query();
	while (ir.next()) {
		var obj = new Object();
		obj.subject = "" + ir.number;
        obj.status = "" + ir.state;
        obj.origin = "Phone";
		obj.type = "Electronic";
		obj.reason = "SNOWtoSFDC";
		obj.description = "" + ir.description;
		
		var apppart = starter;
		apppart += "Content-Disposition: form-data; name=\"application\"\r\n";
		apppart += "Content-Type: application/json\r\n";
		apppart += "\r\n";
		apppart += JSON.stringify(obj);
		apppart += '\r\n';
		body = apppart;
	}
	gs.info(body);
	return body;
}

function makeAttachedFileBody(id) {
	
	//gs.info("--makeAttachedFileBody-Start--");
	//var StringUtil = Packages.com.glide.util.StringUtil;
	var StringUtil = new GlideStringUtil();
	var body = "";
	var ar = new GlideRecord('sys_attachment');
	ar.addQuery("table_sys_id", id);
	ar.query();
	//gs.info("--makeAttachedFileBody-1--");
	while (ar.next()) {
		gs.info("--makeAttachedFileBody-2--");
		var sar = new GlideSysAttachment();
        var content =  sar.getContentBase64(ar);
		
		var fdata = starter;
		gs.info("--makeAttachedFileBody-3--");
		fdata += "Content-Disposition: form-data; name=\"attachedfiles\"; filename=\"" + encodeURI(ar.file_name) + "\"\r\n";
		fdata += "Content-Type: " + ar.content_type + "\r\n";
		fdata += "\r\n";
		fdata += content;
		body = fdata;
		gs.info("--makeAttachedFileBody-4--");
	}
	gs.info(body);
	return body;
}

function makeJWT() {
    /*JWT Generator*/
	var jwtAPI = new sn_auth.GlideJWTAPI();
	var headerJSON = {"alg": "RS256","typ": "JWT"};
	var header = JSON.stringify(headerJSON);
	var jwtProviderSysId = "c8684abf2f437010c27e2ca62799b6ad";
	var jwt = jwtAPI.generateJWT(jwtProviderSysId, header, null);
    gs.info("JWT Token is " + "\r\n" + jwt);
    return jwt;
}

function createUUID() {
    /*SessionId Generator*/
	var guid = gs.generateGUID();
	var uuid = guid.substring(0, 8) + "-" +
		guid.substring(8, 12) + "-" +
		guid.substring(12, 16) + "-" +
		guid.substring(16, 20) + "-" +
		guid.substring(20, 32);
    return uuid;
}