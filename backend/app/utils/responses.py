from flask import jsonify


def success(data=None, message="Success", status_code=200, **extra):
    body = {"success": True, "message": message, "data": data if data is not None else {}}
    body.update(extra)
    return jsonify(body), status_code


def error(message="Something went wrong", errors=None, status_code=400):
    body = {"success": False, "message": message, "errors": errors or {}}
    return jsonify(body), status_code
