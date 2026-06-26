from flask import Flask, render_template, request, jsonify
from supabase import create_client, Client
from dotenv import load_dotenv
import os
import uuid

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Supabase Credentials
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL or SUPABASE_KEY is missing in .env file")

# Create Supabase Client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

@app.route("/")
def home():
    return render_template("index.html")


@app.route("/contact")
def contact_page():
    return render_template("contactus.html")


@app.route("/notes")
def notes_page():
    return render_template("notes.html")

# -----------------------------
# Register User
# -----------------------------
@app.route("/api/register", methods=["POST"])
def register():
    try:
        data = request.get_json()

        first_name = data.get("first_name", "").strip()
        last_name = data.get("last_name", "").strip()
        email = data.get("email", "").strip().lower()

        if not first_name or not last_name or not email:
            return jsonify({
                "success": False,
                "message": "All fields are required"
            }), 400

        # Check whether email already exists
        existing = (
            supabase.table("users")
            .select("*")
            .eq("email", email)
            .execute()
        )

        if existing.data:
            return jsonify({
                "success": False,
                "message": "Email already registered"
            }), 400

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


# -----------------------------
# Login User
# -----------------------------
@app.route("/api/login", methods=["POST"])
def login():
    try:
        data = request.get_json()

        email = data.get("email", "").strip().lower()

        if not email:
            return jsonify({
                "success": False,
                "message": "Email is required"
            }), 400

        response = (
            supabase.table("users")
            .select("*")
            .eq("email", email)
            .execute()
        )

        if not response.data:
            return jsonify({
                "success": False,
                "message": "User not found"
            }), 404

        return jsonify({
            "success": True,
            "user": response.data[0]
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# -----------------------------
# Validate Token
# -----------------------------
@app.route("/api/validate-token", methods=["POST"])
def validate_token():
    try:
        data = request.get_json()

        token = data.get("token", "").strip()

        if not token:
            return jsonify({
                "success": False,
                "message": "Token is required"
            }), 400

        response = (
            supabase.table("users")
            .select("*")
            .eq("token", token)
            .execute()
        )

        if not response.data:
            return jsonify({
                "success": False,
                "message": "Invalid token"
            }), 404

        return jsonify({
            "success": True,
            "user": response.data[0]
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500
    
# -----------------------------
# Get All Notes (Admin)
# -----------------------------
@app.route("/api/notes", methods=["GET"])
def get_notes():
    try:
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
                (u for u in users.data if u["id"] == note["user_id"]),
                None
            )

            if user:
                final_notes.append({
                    "id": note["id"],
                    "user_id": note["user_id"],
                    "name": f'{user["first_name"]} {user["last_name"]}',
                    "message": note["message"]
                })

        return jsonify({
            "success": True,
            "notes": final_notes
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# -----------------------------
# Get Notes of One User
# -----------------------------
@app.route("/api/user-notes/<int:user_id>", methods=["GET"])
def get_user_notes(user_id):
    try:

        response = (
            supabase.table("history")
            .select("*")
            .eq("user_id", user_id)
            .order("id", desc=True)
            .execute()
        )

        return jsonify({
            "success": True,
            "notes": response.data
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# -----------------------------
# Add Note
# -----------------------------
@app.route("/api/add-note", methods=["POST"])
def add_note():
    try:

        data = request.get_json()

        user_id = data.get("user_id")
        message = data.get("message", "").strip()

        if not user_id or not message:
            return jsonify({
                "success": False,
                "message": "User ID and Note are required"
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
            "note": response.data[0]
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# -----------------------------
# Update Note
# -----------------------------
@app.route("/api/update-note/<int:note_id>", methods=["PUT"])
def update_note(note_id):
    try:

        data = request.get_json()

        message = data.get("message", "").strip()

        if not message:
            return jsonify({
                "success": False,
                "message": "Message cannot be empty"
            }), 400

        response = (
            supabase.table("history")
            .update({
                "message": message
            })
            .eq("id", note_id)
            .execute()
        )

        if not response.data:
            return jsonify({
                "success": False,
                "message": "Note not found"
            }), 404

        return jsonify({
            "success": True,
            "note": response.data[0]
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# -----------------------------
# Delete Note
# -----------------------------
@app.route("/api/delete-note/<int:note_id>", methods=["DELETE"])
def delete_note(note_id):
    try:

        response = (
            supabase.table("history")
            .delete()
            .eq("id", note_id)
            .execute()
        )

        return jsonify({
            "success": True,
            "message": "Note deleted successfully"
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500
    
# -----------------------------
# Chat Message
# -----------------------------
@app.route("/api/chat-message", methods=["POST"])
def chat_message():
    try:
        data = request.get_json()

        user_id = data.get("user_id")
        message = data.get("message", "").strip()

        if not user_id:
            return jsonify({
                "success": False,
                "message": "User ID is required"
            }), 400

        if not message:
            return jsonify({
                "success": False,
                "message": "Message cannot be empty"
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
            "message": "Message saved successfully",
            "data": response.data[0]
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500
    
if __name__ == "__main__":
    app.run(debug=True)