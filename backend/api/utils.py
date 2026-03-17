import os
import base64
from django.core.files.base import ContentFile
import uuid

def save_base64_image(image_data):
    """Save base64 image to temporary file"""
    format, imgstr = image_data.split(';base64,')
    ext = format.split('/')[-1]
    
    data = ContentFile(base64.b64decode(imgstr))
    filename = f"temp_{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join('/tmp', filename)
    
    with open(filepath, 'wb') as f:
        f.write(data.read())
    
    return filepath

def validate_image_file(file):
    """Validate image file"""
    allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif']
    ext = os.path.splitext(file.name)[1].lower()
    return ext in allowed_extensions

def get_file_size(file):
    """Get file size in MB"""
    return file.size / (1024 * 1024)