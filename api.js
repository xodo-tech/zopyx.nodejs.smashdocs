var jwt = require('json-web-token');
var uuidV4 = require('uuid/v4');
var request = require('request');
var fs = require('fs');


class SMASHDOCs {

    constructor(partner_url, client_id, client_key, group_id, verbose=false) {
        this.partner_url = partner_url;
        this.client_id = client_id;
        this.client_key = client_key;
        this.group_id = group_id
        this.verbose = verbose;
    }

    get_token() {
        var iat = Math.round(new Date().getTime()/1000);
        var payload = {
            'iat': iat,
            'iss': uuidV4(),
            'jti': uuidV4(),
        }
        var token = jwt.encode(client_key, payload);
        return token.value;
    }

    headers() {
        return {
            'x-client-id': client_id,
            'content-type': 'application/json',
            'authorization': 'Bearer ' + this.get_token()
        }
    }

    new_document(title='', description='', role='editor', status='draft', user_data=null) {

        var data = {
            'user': user_data,
            'title': title,
            'description': description,
            'groupId': this.group_id,
            'userRole': role,
            'status': status,
            'sectionHistory': true
        }

        var url = partner_url + '/partner/documents/create';
        var options = {
          url: url,
          json: data,
          headers: this.headers(),
        };

        var result;
        request.post(options, function (error, response, body) {
            if (response.statusCode == 200) {
                result = body;
            } else {
                throw new Error(error);
            }
        });
        while(result === undefined) {
            require('deasync').runLoopOnce();
        }
        console.log(result);
        return result;
    }

    archive_document(document_id) {

        var url = partner_url + `/partner/documents/${document_id}/archive`;
        var options = {
          url: url,
          headers: this.headers(),
        };

        var result;
        request.post(options, function (error, response, body) {
            if (response.statusCode == 200) {
                result = body;
            } else {
                throw new Error(error);
            }
        });
        while(result === undefined) {
            require('deasync').runLoopOnce();
        }
        return result;
    }

    unarchive_document(document_id) {

        var url = partner_url + `/partner/documents/${document_id}/unarchive`;
        var options = {
          url: url,
          headers: this.headers(),
        };

        var result;
        request.post(options, function (error, response, body) {
            if (response.statusCode == 200) {
                result = body;
            } else {
                throw new Error(error);
            }
        });
        while(result === undefined) {
            require('deasync').runLoopOnce();
        }
        return result;
    }


    delete_document(document_id) {

        var url = partner_url + `/partner/documents/${document_id}`;
        var options = {
          url: url,
          headers: this.headers(),
        };

        var result;
        request.delete(options, function (error, response, body) {
            if (response.statusCode == 200) {
                result = body;
            } else {
                throw new Error(error);
            }
        });
        while(result === undefined) {
            require('deasync').runLoopOnce();
        }
        return result;
    }

    export_document(document_id, user_id='', format='docx') {

        if (format == 'docx') {
            var url = partner_url + `/partner/documents/${document_id}/export/word`;

        } else if (format == 'sdxml'){
            var url = partner_url + `/partner/documents/${document_id}/export/sdxml`;
        } else {
            var url = partner_url + `/partner/documents/${document_id}/export/html`;
        }

        var data = { userId: user_id};

        var options = {
          url: url,
          json: data,
          headers: this.headers(),
        };

        var suffix = format;
        if (['sdxml', 'html'].indexOf(format) != -1) {
            suffix = 'zip';
        }
        var fn_out = `${format}_out.${suffix}`;
        request.post(options, function (error, response, body) {
            if (response.statusCode == 200) {
                result = body;
            } else {
                throw new Error(error);
            }
        }).pipe(fs.createWriteStream(fn_out));
        while(result === undefined) {
            require('deasync').runLoopOnce();
        }
        return fn_out;
    }
}

var user_data = {
    'firstname': 'Andreas',
    'lastname': 'Jung',
    'email': 'foo@bar.org',
    'company': 'The Foo Company',
    'userId': 'ajung'
}

var client_id = process.env.SMASHDOCS_CLIENT_ID;
var client_key = process.env.SMASHDOCS_CLIENT_KEY;
var partner_url = process.env.SMASHDOCS_PARTNER_URL;


SD = new SMASHDOCs(partner_url, client_id, client_key, 'sample-grp');
var result = SD.new_document('doc title', 'doc description', 'editor', 'draft', user_data);
var document_id = result['documentId'];
console.log(result['documentAccessLink']);
console.log(result['documentId']);
console.log(SD.export_document(document_id, 'ajung', 'sdxml'));
console.log(SD.export_document(document_id, 'ajung', 'html'));
SD.archive_document(document_id);
SD.unarchive_document(document_id);
SD.delete_document(document_id);
