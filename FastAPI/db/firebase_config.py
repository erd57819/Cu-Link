import os
import firebase_admin
from firebase_admin import credentials, firestore
from db.settings import firebase_key
from services.object_storage import get_article_bucket, storage_provider

# Firestore keyword search still uses the existing Firebase project.
if not firebase_admin._apps:
    cred = credentials.Certificate(firebase_key)
    options = {}
    if storage_provider() == "firebase":
        options["storageBucket"] = os.getenv(
            "FIREBASE_STORAGE_BUCKET", "news-data01.appspot.com"
        )
    firebase_admin.initialize_app(cred, options)

bucket = get_article_bucket()
fire_db = firestore.client()
