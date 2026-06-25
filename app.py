from flask import Flask, render_template, request, jsonify
from supabase import create_client, Client
from dotenv import load_dotenv
import os
import uuid
import re

load_dotenv()

app = Flask(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL or SUPABASE_KEY is missing in .env file")


supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
@app.route("/")
def home():
    return render_template("index.html")


@app.route("/contact")
def contact_page():
    return render_template("contactus.html")

@app.route("/api/register", methods=["POST"])
def register():

    try:
        data = request.get_json()

        first_name = data.get("first_name")
        last_name = data.get("last_name")
        email = data.get("email")

        if not first_name or not last_name or not email:
            return jsonify({
                "success": False,
                "message": "All fields are required"
            }), 400

        existing = (
            supabase.table("users")
            .select("*")
            .eq("email", email)
            .execute()
        )

        if existing.data:

            token = existing.data[0]["token"]

            return jsonify({
                "success": True,
                "user": existing.data[0],
                "token": token
            })

        token = str(uuid.uuid4())

        response = (
            supabase.table("users")
            .insert({
                "first_name": first_name,
                "last_name": last_name,
                "email": email,
                "token": token
            })
            .execute()
        )

        return jsonify({
            "success": True,
            "user": response.data[0],
            "token": token
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

@app.route("/api/validate-token", methods=["POST"])
def validate_token():

    try:
        data = request.get_json()
        token = data.get("token")

        response = (
            supabase.table("users")
            .select("*")
            .eq("token", token)
            .execute()
        )

        if response.data:
            return jsonify({
                "success": True,
                "user": response.data[0]
            })

        return jsonify({
            "success": False,
            "message": "Invalid token"
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500  
      
   
@app.route("/api/chat-message", methods=["POST"])
def chat_message():

    try:

        data = request.get_json()

        user_id = data.get("user_id")
        message = data.get("message")
        if not user_id or not message:
            return jsonify({
                "success": False,
                "message": "User ID and message are required"
            }), 400
        response = (
            supabase.table("history")
            .insert({
                "user_id": user_id,
                "message": message
            })
            .execute()
        )

        return jsonify({
            "success": True,
            "data": response.data[0]
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500
    



@app.route("/api/records", methods=["GET"])
def get_records():
    try:
        response = (
            supabase.table("contact_records")
            .select("*")
            .order("id", desc=True)
            .execute()
        )

        return jsonify({
            "success": True,
            "records": response.data
        })

    except Exception as error:
        return jsonify({
            "success": False,
            "message": str(error)
        }), 500


@app.route("/api/records", methods=["POST"])
def add_record():
    try:
        data = request.get_json()

        record = {
            "first_name": data.get("first_name"),
            "last_name": data.get("last_name"),
            "age": int(data.get("age")),
            "gender": data.get("gender"),
            "mobile_number": data.get("mobile_number"),
            "email": data.get("email"),
            "address": data.get("address"),
            "description": data.get("description", "")
        }

        response = (
            supabase.table("contact_records")
            .insert(record)
            .execute()
        )

        return jsonify({
            "success": True,
            "message": "Record saved successfully",
            "record": response.data[0]
        })

    except Exception as error:
        return jsonify({
            "success": False,
            "message": str(error)
        }), 500


@app.route("/api/records/<int:record_id>", methods=["PUT"])
def update_record(record_id):
    try:
        data = request.get_json()

        record = {
            "first_name": data.get("first_name"),
            "last_name": data.get("last_name"),
            "age": int(data.get("age")),
            "gender": data.get("gender"),
            "mobile_number": data.get("mobile_number"),
            "email": data.get("email"),
            "address": data.get("address"),
            "description": data.get("description", "")
        }

        response = (
            supabase.table("contact_records")
            .update(record)
            .eq("id", record_id)
            .execute()
        )

        return jsonify({
            "success": True,
            "message": "Record updated successfully",
            "record": response.data[0]
        })

    except Exception as error:
        return jsonify({
            "success": False,
            "message": str(error)
        }), 500


@app.route("/api/records/<int:record_id>", methods=["DELETE"])
def delete_record(record_id):
    try:
        supabase.table("contact_records").delete().eq("id", record_id).execute()

        return jsonify({
            "success": True,
            "message": "Record deleted successfully"
        })

    except Exception as error:
        return jsonify({
            "success": False,
            "message": str(error)
        }), 500


@app.route("/notes")
def notes_page():

    return render_template(
        "notes.html"
    )


@app.route("/api/notes")
def get_notes():

    users = (
        supabase.table("users")
        .select("*")
        .execute()
    )

    notes = (
        supabase.table("history")
        .select("*")
        .order("id", desc=True)
        .execute()
    )

    final_notes = []

    for note in notes.data:

        user = next(
            (
                u for u in users.data
                if u["id"] == note["user_id"]
            ),
            None
        )

        if user:

            final_notes.append({

                "name":
                user["first_name"] +
                " " +
                user["last_name"],

                "note":
                note["message"]

            })

    return jsonify({

        "success": True,
        "notes": final_notes
    })


@app.route("/api/login", methods=["POST"])
def login():

    try:

        data = request.get_json()

        email = data.get("email")

        response = (
            supabase.table("users")
            .select("*")
            .eq("email", email)
            .execute()
        )

        if response.data:

            return jsonify({
                "success": True,
                "user": response.data[0]
            })

        return jsonify({
            "success": False,
            "message": "User not found"
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500




if __name__ == "__main__":
    app.run(debug=True)