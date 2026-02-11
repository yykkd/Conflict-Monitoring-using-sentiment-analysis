import firebase_admin
from flask import Flask, request, jsonify
from firebase_admin import credentials
from firebase_admin import firestore
from flask_cors import CORS


cred = credentials.Certificate('key.json')
default_app = firebase_admin.initialize_app(cred)
db = firestore.client()

app = Flask(__name__)
# CORS(app)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True, allow_headers=[
    "Content-Type", "Authorization", "X-Requested-With"], methods=["GET", "POST", "PUT", "DELETE"])


users = db.collection("users")

'''
Registering a new user
'''
@app.route("/register_user", methods=['POST'])
def register_user():  
    user_id = request.json['user_id']
    user_ref = users.document(user_id)
    user = user_ref.get()

    # check if student exists
    if user.exists:
        return jsonify({"message": "exists"}),400

    # add user to database  
    users.document(user_id).set(request.json)
    return jsonify({"message": "created"}), 201


'''
Validating an existing user for login
'''
@app.route("/validate_user", methods=['POST'])
def validate_user():  
    user_id = request.json['user_id']
    user_ref = users.document(user_id)
    user = user_ref.get()

    # check if student exists
    if not user.exists:
        return jsonify({"message": "not exist"}),400
    if user.to_dict()['password'] != request.json['password']:
        return jsonify({"message": "wrong password"}),400   

    return jsonify({"message": "exists"}),200


if __name__ == '__main__':
    app.run(port=8080)