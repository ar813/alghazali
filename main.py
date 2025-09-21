import streamlit as st
from PIL import Image
from streamlit_cropper import st_cropper
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, white
from reportlab.graphics.barcode import qr
from reportlab.graphics.shapes import Drawing
import json
import os
import pandas as pd
from datetime import date, datetime
import zipfile
from io import BytesIO
import shutil
from pathlib import Path
# Note: avoiding direct openpyxl imports to keep compatibility in minimal environments


# Constants
DATA_FILE = "student_data.json"
PHOTO_DIR = "photos"
PDF_DIR = "pdfs"
CARD_WIDTH, CARD_HEIGHT = 189, 321

# Ensure required folders exist
Path(PHOTO_DIR).mkdir(parents=True, exist_ok=True)
Path(PDF_DIR).mkdir(parents=True, exist_ok=True)
Path("assets").mkdir(parents=True, exist_ok=True)  # if you write to assets folder at any point

# ------------------ CONFIG ------------------
st.set_page_config(page_title="Al-Ghazali High School", page_icon="assets/logo.png", layout="wide")

# ------------------ USERS ------------------
USERS = {
    "school": "school@321",
    # "admin": "admin123",
    # "teacher": "teacher2024",
    # "staff": "staff@123"
}

# ------------------ SESSION INIT ------------------
if 'authenticated' not in st.session_state:
    st.session_state.authenticated = False
if 'username' not in st.session_state:
    st.session_state.username = ""
if 'current_page' not in st.session_state:
    st.session_state.current_page = "add_student"
if 'selected_students' not in st.session_state:
    st.session_state.selected_students = []
if 'edit_mode' not in st.session_state:
    st.session_state.edit_mode = False
if 'edit_student_id' not in st.session_state:
    st.session_state.edit_student_id = None

# ------------------ PERSIST LOGIN FROM URL ------------------
params = st.query_params
if params.get("logged_in", "false") == "true":
    st.session_state.authenticated = True

# ------------------ AUTH FUNCTIONS ------------------
def authenticate_user(username, password):
    return USERS.get(username) == password

def logout():
    st.session_state.authenticated = False
    st.session_state.username = ""
    st.query_params.clear()
    st.rerun()

def login_form():
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        st.markdown("""
        <div style='text-align: center; padding: 2rem; background-color: #f0f2f6; border-radius: 10px; margin: 2rem 0;'>
            <h2>🎓 AL GHAZALI HIGH SCHOOL</h2>
            <p>Welcome to Student ID Manager</p>
        </div>
        """, unsafe_allow_html=True)

        with st.form("login_form"):
            st.subheader("Login")
            username = st.text_input("Username", placeholder="Enter username")
            password = st.text_input("Password", type="password", placeholder="Enter password")

            colA, colB, colC = st.columns([1, 1, 1])
            with colB:
                login_button = st.form_submit_button("🚀 Login", use_container_width=True)

            if login_button:
                if authenticate_user(username, password):
                    st.session_state.authenticated = True
                    st.session_state.username = username
                    st.query_params["logged_in"] = "true"
                    st.success(f"Welcome, {username}! 🎉")
                    st.rerun()
                else:
                    st.error("❌ Invalid username or password!")

        with st.expander("⚠️ Warning"):
            st.markdown("""
            <div style="background-color:#fff3cd; padding:15px; border-left:5px solid #ffa500; border-radius:5px">
                <strong>🔒 Never share your email or password with anyone.</strong><br>
                🛡️ Protect your credentials to keep your account secure.<br>
                🚫 Avoid entering your login details on untrusted sites.
            </div>
            """, unsafe_allow_html=True)



# NOTE: authentication removed for local use - app opens directly


# ------------------ LOGGED IN AREA ------------------
st.title("🎓 AL GHAZALI HIGH SCHOOL")

# Check if logo exists
logo_path = "assets/logo.png"
if os.path.exists(logo_path):
    logo = Image.open(logo_path)
    st.sidebar.image(logo, width=100, caption="AL GHAZALI HIGH SCHOOL")

st.sidebar.title("Navigation")

# Add tooltips to navigation
nav_tooltips = {
    "Add Student": "Add new student records and generate ID cards",
    "Manage Students": "View, edit, or delete existing student records",
    "Bulk Operations": "Work with multiple student records at once",
    "Import/Export": "Import or export student data using Excel/CSV"
}

# Navigation
page = st.sidebar.selectbox(
    "Choose Page",
    ["Add Student", "Manage Students", "Import/Export"],
    key="navigation"
)

if st.sidebar.button("🔒 Logout"):
    logout()

# Helper Functions
def load_data():
    try:
        if os.path.exists(DATA_FILE):
            with open(DATA_FILE, "r") as f:
                data = json.load(f)
                # Validate data structure
                if not isinstance(data, list):
                    raise ValueError("Invalid data format")
                return data
        return []
    except json.JSONDecodeError:
        st.error("❌ Error reading data file! Loading backup...")
        # Try loading backup
        backup_file = f"{DATA_FILE}.backup"
        if os.path.exists(backup_file):
            with open(backup_file, "r") as f:
                return json.load(f)
        return []
    except Exception as e:
        st.error(f"❌ Error: {str(e)}")
        return []

def save_data(data):
    try:
        # Create backup before saving
        if os.path.exists(DATA_FILE):
            backup_file = f"{DATA_FILE}.backup"
            shutil.copy2(DATA_FILE, backup_file)
        
        # Save new data
        with open(DATA_FILE, "w") as f:
            json.dump(data, f, indent=4, default=str)
        return True, "Data saved successfully!"
    except Exception as e:
        return False, f"Error saving data: {str(e)}"

def int_to_roman(num):
    if not num or not str(num).isdigit():
        return str(num)
    num = int(num)
    val = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]
    syms = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"]
    roman = ""
    i = 0
    while num > 0:
        for _ in range(num // val[i]):
            roman += syms[i]
            num -= val[i]
        i += 1
    return roman

def validate_student_data(info):
    required_fields = ['name', 'father_name', 'roll_no', 'class', 'gr_number', 'phone']
    missing_fields = [field for field in required_fields if not info.get(field)]
    if missing_fields:
        return False, f"Missing required fields: {', '.join(missing_fields)}"
    
    # Validate phone number
    if not info['phone'].replace('-', '').isdigit():
        return False, "Invalid phone number format"
    
    return True, "Data validated successfully"


def parse_date_flexible(value):
    """Parse several common date formats into a datetime.date.
    Returns None if parsing fails or value is falsy/NaT.
    Accepts: ISO strings, '11/2/2018', '11-2-2018', '2018-11-02', pandas NaT, datetime/date objects.
    """
    if value is None:
        return None
    # If already a date or datetime
    try:
        if isinstance(value, datetime):
            return value.date()
        if isinstance(value, date):
            return value
    except Exception:
        pass

    s = str(value).strip()
    if s in ("", "nan", "NaT", "None", "NoneType"):
        return None

    # Try ISO first
    try:
        return datetime.fromisoformat(s).date()
    except Exception:
        pass

    # Try common separators
    for sep in ['/', '-']:
        parts = s.split(sep)
        if len(parts) == 3:
            # try d/m/Y or m/d/Y: we'll attempt day-first then month-first
            a, b, c = parts
            try:
                day = int(a)
                month = int(b)
                year = int(c)
                # year normalization
                if year < 100:
                    year += 2000
                return date(year, month, day)
            except Exception:
                try:
                    # try swapped
                    day = int(b)
                    month = int(a)
                    year = int(c)
                    if year < 100:
                        year += 2000
                    return date(year, month, day)
                except Exception:
                    continue

    # last resort: try pandas
    try:
        import pandas as _pd
        dt = _pd.to_datetime(s, errors='coerce')
        if not _pd.isna(dt):
            return dt.date()
    except Exception:
        pass

    return None

def generate_pdf(info, img_path):
    try:
        # Validate data first
        is_valid, message = validate_student_data(info)
        if not is_valid:
            raise ValueError(message)
            
        pdf_filename = f"{info['roll_no'].replace(' ', '_')}_card.pdf"
        pdf_path = os.path.join(PDF_DIR, pdf_filename)
        c = canvas.Canvas(pdf_path, pagesize=(CARD_WIDTH, CARD_HEIGHT))
    except Exception as e:
        st.error(f"❌ Error generating PDF: {str(e)}")
        return None

    # FRONT SIDE
    front_bg_path = "assets/1.jpeg"
    if os.path.exists(front_bg_path):
        c.drawImage(front_bg_path, 0, 0, 189, 321)

    c.setFillColor(HexColor("#231f55"))
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(94.5, 140, info['name'].upper())
    c.drawCentredString(94.5, 113, info['father_name'].upper())

    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 9)
    roman_class = int_to_roman(info['class'])
    c.drawCentredString(90.5, 95, "Level" + "-" + roman_class)

    c.setFillColor(HexColor("#231f55"))
    c.setFont("Helvetica", 9)
    c.drawString(65, 67, info['roll_no'])
    c.drawString(65, 52, info['gr_number'])
    dob_dt = parse_date_flexible(info.get("date_of_birth"))
    c.drawString(65, 37, dob_dt.strftime("%d %B, %Y") if dob_dt else "")

    # Draw photo if exists
    if img_path and os.path.exists(img_path):
        img_x = CARD_WIDTH - 149
        img_y = CARD_HEIGHT - 161.5
        img_size = 103

        # Draw circular clipping path
        c.saveState()
        p = c.beginPath()
        center_x = img_x + img_size / 2
        center_y = img_y + img_size / 2
        radius = img_size / 2

        p.circle(center_x, center_y, radius)
        c.clipPath(p, stroke=0, fill=0)

        # Draw the image inside the circle
        c.drawImage(img_path, img_x, img_y, width=img_size, height=img_size, mask='auto')
        c.restoreState()

    c.showPage()

    # BACK SIDE
    back_bg_path = "assets/2.jpeg"
    if os.path.exists(back_bg_path):
        c.drawImage(back_bg_path, 0, 0, 189, 321)

    # Generate QR Code
    dob_str = parse_date_flexible(info.get("date_of_birth"))
    issue_str = parse_date_flexible(info.get("date_of_issue"))
    expiry_str = parse_date_flexible(info.get("date_of_expiry"))
    qr_data = f"""Name: {info['name']}
Father Name: {info['father_name']}
Roll No: {info['roll_no']}
GR NO: {info['gr_number']}
DOB: {dob_str.strftime('%d %B, %Y') if dob_str else ''}
Issue: {issue_str.strftime('%d %B, %Y') if issue_str else ''}
Expiry: {expiry_str.strftime('%d %B, %Y') if expiry_str else ''}
Phone: {info['phone']}"""

    qr_code = qr.QrCodeWidget(qr_data)
    bounds = qr_code.getBounds()
    width_qr = bounds[2] - bounds[0]
    height_qr = bounds[3] - bounds[1]

    qr_size = 80
    scale_x = qr_size / width_qr 
    scale_y = qr_size / height_qr

    d = Drawing(qr_size, qr_size, transform=[scale_x, 0, 0, scale_y, 0, 0])
    d.add(qr_code)
    d.drawOn(c, 50, 125)

    c.setFillColor(HexColor("#231f55"))
    c.setFont("Helvetica-Bold", 8)
    c.drawString(95, 104, issue_str.strftime("%d %B, %Y") if issue_str else "")
    c.drawString(95, 93, expiry_str.strftime("%d %B, %Y") if expiry_str else "")

    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(85.5, 62.5, info['phone'])

    c.save()
    return pdf_path

def delete_student(student_id):
    data = load_data()
    student_to_delete = None
    
    for i, student in enumerate(data):
        if student.get('id') == student_id:
            student_to_delete = student
            data.pop(i)
            break
    
    if student_to_delete:
        # # Delete associated files
        # if student_to_delete.get('photo_path') and os.path.exists(student_to_delete['photo_path']):
        #     os.remove(student_to_delete['photo_path'])
        
        pdf_filename = f"{student_to_delete['roll_no'].replace(' ', '_')}_card.pdf"
        pdf_path = os.path.join(PDF_DIR, pdf_filename)
        if os.path.exists(pdf_path):
            os.remove(pdf_path)
        
        save_data(data)
        return True
    return False

# PAGE: Add Student
if page == "Add Student":
    

    # Form in a clean container
    with st.container():
        st.markdown("### Student Information")
        # Form Inputs
        col1, col2 = st.columns(2)
        with col1:
            name = st.text_input("Student Name *", help="Enter full name as per documents")
        with col2:
            father_name = st.text_input("Father Name *", help="Enter father's full name")

    col1, col2 = st.columns(2)
    with col1:
        roll_no = st.text_input("Roll Number *", help="Enter unique roll number")
        if roll_no:
            # Check for duplicate roll number
            data = load_data()
            if any(student['roll_no'] == roll_no for student in data):
                st.warning("⚠️ This roll number already exists!")
    with col2:
        student_class = st.text_input("Class *", help="Enter class (e.g., 1, 2, 3...)")

    col1, col2 = st.columns(2)
    with col1:
        phone = st.text_input("Phone Number *", help="Parent's contact number")
    with col2:
        gr_number = st.text_input("GR Number *", help="Enter unique GR number")

    col1, col2, col3 = st.columns(3)
    with col1:
        date_of_birth = st.date_input("Date of Birth", min_value=date(1990, 1, 1), max_value=date.today())
    with col2:
        date_of_issue = st.date_input("Date of Issue", min_value=date(2010, 1, 1), max_value=date(2035, 12, 31))
    with col3:
        date_of_expiry = st.date_input("Date of Expiry", min_value=date_of_issue, max_value=date(2040, 12, 31))

    # Image upload
    st.markdown("---")
    st.subheader("📸 Upload & Crop Student Photo")
    profile_photo = st.file_uploader("Upload a Profile Photo", type=["jpg", "jpeg", "png"], label_visibility="collapsed")

    cropped_img = None
    if profile_photo:
        img = Image.open(profile_photo)
        st.image(img, caption="Original Uploaded Image", width=200)

        cropped_img = st_cropper(
            img,
            aspect_ratio=(1, 1),
            box_color="#00ADB5",
            return_type="image",
            key="cropper"
        )

        st.image(cropped_img, caption="✅ Cropped Profile Photo", width=150)


    # Generate button
    st.markdown("---")
    if st.button("🎫 Add Student & Generate ID Card"):
        if not name or not roll_no:
            st.error("Please enter at least Student Name and Roll Number.")
        else:
            # Check for duplicate roll number
            data = load_data()
            if any(student['roll_no'] == roll_no for student in data):
                st.error("A student with this roll number already exists!")
            else:
                img_path = None
                if cropped_img:
                    img_filename = f"{roll_no.replace(' ', '_')}.png"
                    img_path = os.path.join(PHOTO_DIR, img_filename)
                    Path(img_path).parent.mkdir(parents=True, exist_ok=True)
                    cropped_img.save(img_path)

                student_info = {
                    "id": len(data) + 1,
                    "name": name,
                    "father_name": father_name,
                    "roll_no": roll_no,
                    "class": student_class,
                    "phone": phone,
                    "gr_number": gr_number,
                    "date_of_birth": date_of_birth.isoformat(),
                    "date_of_issue": date_of_issue.isoformat(),
                    "date_of_expiry": date_of_expiry.isoformat(),
                    "photo_path": img_path,
                    "created_at": datetime.now().isoformat()
                }

                data.append(student_info)
                save_data(data)

                pdf_file_path = generate_pdf(student_info, img_path)
                st.success("✅ Student Added & ID Card Generated Successfully!")
                
                with open(pdf_file_path, "rb") as pdf_file:
                    st.download_button(
                        "📥 Download ID Card PDF", 
                        data=pdf_file, 
                        file_name=os.path.basename(pdf_file_path),
                        mime="application/pdf"
                    )

# PAGE: Manage Students
elif page == "Manage Students":
    st.header("👥 Manage Students")
    
    data = load_data()

    # Delete All (with confirmation)
    with st.expander("⚠️ Danger Zone - Delete All Records", expanded=False):
        st.warning("This will permanently delete all student records, photos and generated PDFs.")
        confirm_text = st.text_input("Type DELETE to confirm", key="confirm_delete_all")
        if st.button("🗑️ Delete All Records"):
            if confirm_text == "DELETE":
                try:
                    # remove pdfs
                    if os.path.exists(PDF_DIR):
                        shutil.rmtree(PDF_DIR)
                    os.makedirs(PDF_DIR, exist_ok=True)

                    # remove photos
                    if os.path.exists(PHOTO_DIR):
                        shutil.rmtree(PHOTO_DIR)
                    os.makedirs(PHOTO_DIR, exist_ok=True)

                    # clear data file
                    save_data([])
                    st.success("All records, photos and PDFs deleted.")
                    st.experimental_rerun()
                except Exception as e:
                    st.error(f"Error deleting records: {e}")
            else:
                st.info("Type DELETE in the box to confirm deletion.")
    
    if not data:
        st.info("No students found. Add some students first!")
    else:
        # Filters
        st.subheader("🔍 Filters")
        col1, col2, col3 = st.columns(3)
        
        with col1:
            name_filter = st.text_input("Filter by Name", placeholder="Enter student name...")
        with col2:
            class_filter = st.selectbox("Filter by Class", ["All"] + list(set([s['class'] for s in data if s['class']])))
        with col3:
            roll_filter = st.text_input("Filter by Roll Number", placeholder="Enter roll number...")
        
        # Apply filters
        filtered_data = data
        if name_filter:
            filtered_data = [s for s in filtered_data if name_filter.lower() in s['name'].lower()]
        if class_filter != "All":
            filtered_data = [s for s in filtered_data if s['class'] == class_filter]
        if roll_filter:
            filtered_data = [s for s in filtered_data if roll_filter in s['roll_no']]
        
        st.markdown("---")
        st.subheader(f"📋 Students List ({len(filtered_data)} students)")
        
        # Display students
        for i, student in enumerate(filtered_data):
            with st.expander(f"🎓 {student['name']} - Roll: {student['roll_no']} - Class: {student['class']}"):
                col1, col2, col3 = st.columns([2, 2, 1])
                
                with col1:
                    st.write(f"**Name:** {student['name']}")
                    st.write(f"**Father's Name:** {student['father_name']}")
                    st.write(f"**Roll Number:** {student['roll_no']}")
                    st.write(f"**Class:** {student['class']}")
                
                with col2:
                    st.write(f"**Phone:** {student['phone']}")
                    st.write(f"**GR Number:** {student['gr_number']}")
                    dob_disp = parse_date_flexible(student.get('date_of_birth'))
                    expiry_disp = parse_date_flexible(student.get('date_of_expiry'))
                    st.write(f"**Date of Birth:** {dob_disp.strftime('%d %B, %Y') if dob_disp else ''}")
                    st.write(f"**Card Expiry:** {expiry_disp.strftime('%d %B, %Y') if expiry_disp else ''}")
                
                with col3:
                    if student.get('photo_path') and os.path.exists(student['photo_path']):
                        st.image(student['photo_path'], width=100)
                
                # Action buttons
                col1, col2, col3, col4 = st.columns(4)
                
                with col1:
                    pdf_filename = f"{student['roll_no'].replace(' ', '_')}_card.pdf"
                    pdf_path = os.path.join(PDF_DIR, pdf_filename)
                    if os.path.exists(pdf_path):
                        with open(pdf_path, "rb") as pdf_file:
                            st.download_button(
                                "📥 Download PDF",
                                data=pdf_file,
                                file_name=pdf_filename,
                                mime="application/pdf",
                                key=f"download_{student['id']}"
                            )
                    else:
                        if st.button("🔄 Regenerate PDF", key=f"regen_{student['id']}"):
                            pdf_path = generate_pdf(student, student.get('photo_path'))
                            st.success("PDF regenerated successfully!")
                            st.rerun()
                
                with col2:
                    if st.button("✏️ Edit", key=f"edit_{student['id']}"):
                        st.session_state.edit_mode = True
                        st.session_state.edit_student_id = student['id']
                        st.rerun()
                
                with col3:
                    if st.button("🗑️ Delete", key=f"delete_{student['id']}", type="secondary"):
                        if delete_student(student['id']):
                            st.success("Student deleted successfully!")
                            st.rerun()
                        else:
                            st.error("Failed to delete student!")
                
                # selection removed: per-student bulk selection not available

    # Edit Mode
        if st.session_state.edit_mode and st.session_state.edit_student_id:
            st.markdown("---")
            st.subheader("✏️ Edit Student")
            
            # Find student to edit
            student_to_edit = next((s for s in data if s['id'] == st.session_state.edit_student_id), None)
            
            if student_to_edit:
                # Photo crop/upload UI - moved outside the form to avoid using st.button inside a form
                # Session keys for cropping state per-student
                crop_existing_key = f"crop_existing_{student_to_edit['id']}"
                cropped_session_key = f"edit_cropped_img_{student_to_edit['id']}"
                if crop_existing_key not in st.session_state:
                    st.session_state[crop_existing_key] = False
                if cropped_session_key not in st.session_state:
                    st.session_state[cropped_session_key] = None

                st.markdown("#### 📸 Student Photo")
                pic_col, crop_col = st.columns([1, 2])

                with pic_col:
                    if student_to_edit.get('photo_path') and os.path.exists(student_to_edit['photo_path']):
                        st.image(student_to_edit['photo_path'], caption="Current Photo", width=150)
                        # Button is allowed here because this is outside the form
                        if st.button("✂️ Crop Current Photo", key=f"btn_crop_current_{student_to_edit['id']}"):
                            st.session_state[crop_existing_key] = True
                    else:
                        st.info("No photo available")

                with crop_col:
                    # Upload new photo option (user can still upload and crop a new photo)
                    new_photo = st.file_uploader("Upload New Photo", type=["jpg", "jpeg", "png"], key=f"edit_photo_{student_to_edit['id']}")
                    if new_photo:
                        img = Image.open(new_photo)
                        uploaded_cropped = st_cropper(
                            img,
                            aspect_ratio=(1, 1),
                            box_color="#00ADB5",
                            return_type="image",
                            key=f"edit_cropper_{student_to_edit['id']}"
                        )
                        st.image(uploaded_cropped, caption="Preview (uploaded)", width=150)
                        # store temporarily in session until Save Changes is pressed
                        st.session_state[cropped_session_key] = uploaded_cropped

                    # If user requested cropping of the existing photo, show cropper
                    if st.session_state.get(crop_existing_key):
                        try:
                            existing_path = student_to_edit.get('photo_path')
                            if existing_path and os.path.exists(existing_path):
                                img = Image.open(existing_path)
                                existing_cropped = st_cropper(
                                    img,
                                    aspect_ratio=(1, 1),
                                    box_color="#00ADB5",
                                    return_type="image",
                                    key=f"existing_cropper_{student_to_edit['id']}"
                                )
                                st.image(existing_cropped, caption="Preview (current photo cropped)", width=150)
                                # Save cropped current photo action (outside form)
                                if st.button("💾 Save Cropped Current Photo", key=f"save_cropped_{student_to_edit['id']}"):
                                    st.session_state[cropped_session_key] = existing_cropped
                                    st.session_state[crop_existing_key] = False
                                    st.success("Cropped photo saved to edit session. Click Save Changes to persist.")
                            else:
                                st.error("Current photo not found to crop.")
                                st.session_state[crop_existing_key] = False
                        except Exception as e:
                            st.error(f"Error loading photo for cropping: {e}")
                            st.session_state[crop_existing_key] = False

                # Edit form: use a single form block and handle submit/cancel
                with st.form("edit_student_form"):
                    col1, col2 = st.columns(2)
                    with col1:
                        st.markdown("#### 📝 Basic Information")
                        edit_name = st.text_input("Student Name *", value=student_to_edit['name'])
                        edit_roll_no = st.text_input("Roll Number *", value=student_to_edit['roll_no'])
                        edit_phone = st.text_input("Phone Number *", value=student_to_edit['phone'])
                    with col2:
                        edit_father_name = st.text_input("Father Name *", value=student_to_edit['father_name'])
                        edit_class = st.text_input("Class *", value=student_to_edit['class'])
                        edit_gr_number = st.text_input("GR Number *", value=student_to_edit['gr_number'])

                    col_dob, col_issue, col_expiry = st.columns(3)
                    with col_dob:
                        # safe default for date_input
                        dob_val = parse_date_flexible(student_to_edit.get('date_of_birth'))
                        edit_dob = st.date_input("Date of Birth", value=dob_val if dob_val else date(2000,1,1))
                    with col_issue:
                        issue_val = parse_date_flexible(student_to_edit.get('date_of_issue'))
                        edit_issue = st.date_input("Date of Issue", value=issue_val if issue_val else date.today())
                    with col_expiry:
                        expiry_val = parse_date_flexible(student_to_edit.get('date_of_expiry'))
                        edit_expiry = st.date_input("Date of Expiry", value=expiry_val if expiry_val else date.today())

                    col_save, col_cancel = st.columns(2)
                    with col_save:
                        submitted = st.form_submit_button("💾 Save Changes")
                    with col_cancel:
                        canceled = st.form_submit_button("❌ Cancel")

                    if submitted:
                        # Apply updates
                        for i, student in enumerate(data):
                            if student['id'] == st.session_state.edit_student_id:
                                # Save new photo if uploaded
                                # prefer session-stored cropped image (from upload or crop current)
                                session_cropped = st.session_state.get(cropped_session_key)
                                if session_cropped:
                                    img_filename = f"{edit_roll_no.replace(' ', '_')}.png"
                                    img_path = os.path.join(PHOTO_DIR, img_filename)
                                    try:
                                        # ensure photo dir exists
                                        Path(img_path).parent.mkdir(parents=True, exist_ok=True)
                                        session_cropped.save(img_path)
                                        photo_path = img_path
                                        # clear temporary session crop
                                        st.session_state[cropped_session_key] = None
                                    except Exception as e:
                                        st.error(f"Error saving photo: {str(e)}")
                                        photo_path = student.get('photo_path')
                                else:
                                    photo_path = student.get('photo_path')

                                data[i].update({
                                    'name': edit_name,
                                    'father_name': edit_father_name,
                                    'roll_no': edit_roll_no,
                                    'class': edit_class,
                                    'phone': edit_phone,
                                    'gr_number': edit_gr_number,
                                    'date_of_birth': edit_dob.isoformat(),
                                    'date_of_issue': edit_issue.isoformat(),
                                    'date_of_expiry': edit_expiry.isoformat(),
                                    'photo_path': photo_path,
                                    'updated_at': datetime.now().isoformat()
                                })

                                ok, msg = save_data(data)
                                if not ok:
                                    st.error(msg)
                                else:
                                    # Regenerate PDF
                                    generate_pdf(data[i], data[i].get('photo_path'))
                                    st.session_state.edit_mode = False
                                    st.session_state.edit_student_id = None
                                    st.success("Student updated successfully!")
                                    st.rerun()
                                break

                    if canceled:
                        st.session_state.edit_mode = False
                        st.session_state.edit_student_id = None
                        st.rerun()

        # Generate All PDFs moved here from Bulk Operations
        st.markdown("---")
        st.subheader("📦 Bulk Actions")
        st.info("Per-student selection has been removed. Use the buttons on each student card to act on individual records.")

        if st.button("🎫 Generate All ID Cards for Filtered Students"):
            # Use filtered_data so the user can generate for a subset after filtering
            if filtered_data:
                progress_bar = st.progress(0)
                success_count = 0

                zip_buffer = BytesIO()
                with zipfile.ZipFile(zip_buffer, "w") as zipf:
                    for i, student in enumerate(filtered_data):
                        try:
                            pdf_path = generate_pdf(student, student.get('photo_path'))
                            if pdf_path and os.path.exists(pdf_path):
                                zipf.write(pdf_path, arcname=os.path.basename(pdf_path))
                                success_count += 1
                        except Exception as e:
                            st.error(f"❌ Failed to generate PDF for {student.get('name','Unknown')}: {str(e)}")

                        progress_bar.progress((i + 1) / len(filtered_data))

                st.success(f"✅ Generated {success_count} out of {len(filtered_data)} ID cards successfully!")

                zip_buffer.seek(0)
                st.download_button(
                    label="⬇️ Download Generated PDFs as ZIP",
                    data=zip_buffer.getvalue(),
                    file_name="Generated_ID_Cards.zip",
                    mime="application/zip"
                )
            else:
                st.info("ℹ️ No students found to generate PDFs for (check your filters).")

# PAGE: Import/Export
elif page == "Import/Export":
    st.header("📊 Import/Export Data")
    
    # Export Section
    st.subheader("📤 Export Data")
    data = load_data()
    
    if data:
        # Prepare data for export
        export_data = []
        for student in data:
            dob_val = parse_date_flexible(student.get('date_of_birth'))
            issue_val = parse_date_flexible(student.get('date_of_issue'))
            expiry_val = parse_date_flexible(student.get('date_of_expiry'))
            export_record = {
                'Name': student['name'],
                'Father Name': student['father_name'],
                'Roll Number': student['roll_no'],
                'Class': student['class'],
                'GR Number': student['gr_number'],
                'Phone': student['phone'],
                'Date of Birth': dob_val.strftime('%d-%m-%Y') if dob_val else '',
                'Date of Issue': issue_val.strftime('%d-%m-%Y') if issue_val else '',
                'Date of Expiry': expiry_val.strftime('%d-%m-%Y') if expiry_val else '',
                'Photo Path': student.get('photo_path', '')
            }
            export_data.append(export_record)
        
        df = pd.DataFrame(export_data)
        
        col1, col2 = st.columns(2)
        
        with col1:
            # Simple Excel export (works in all environments)
            excel_buffer = BytesIO()
            with pd.ExcelWriter(excel_buffer, engine='openpyxl') as writer:
                df.to_excel(writer, sheet_name='Students', index=False)

            excel_buffer.seek(0)

            st.download_button(
                "📥 Export to Excel",
                data=excel_buffer.getvalue(),
                file_name=f"student_records_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx",
                mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                help="Download Excel file with all student records"
            )
        
        with col2:
            # Export to CSV
            csv_buffer = df.to_csv(index=False)
            st.download_button(
                "📥 Export to CSV",
                data=csv_buffer,
                file_name=f"students_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
                mime="text/csv"
            )
    else:
        st.info("No data to export.")
    
    # Import Section
    st.markdown("---")
    st.subheader("📤 Import Data")
    
    uploaded_file = st.file_uploader(
        "Upload Excel or CSV file",
        type=['xlsx', 'xls', 'csv'],
        help="Upload a file with student data. Required columns: name, father_name, roll_no, class, phone, gr_number, date_of_birth, date_of_issue, date_of_expiry"
    )
    
    if uploaded_file:
        try:
            # Read the file
            if uploaded_file.name.endswith('.csv'):
                import_df = pd.read_csv(uploaded_file)
            else:
                import_df = pd.read_excel(uploaded_file)
            
            st.write("Preview of imported data:")
            st.dataframe(import_df.head())
            
            # Validate required columns
            required_columns = ['name', 'father_name', 'roll_no', 'class', 'phone', 'gr_number', 'date_of_birth', 'date_of_issue', 'date_of_expiry', 'photo_path']
            missing_columns = [col for col in required_columns if col not in import_df.columns]
            
            if missing_columns:
                st.error(f"Missing required columns: {', '.join(missing_columns)}")
            else:
                col1, col2 = st.columns(2)
                
                with col1:
                    import_mode = st.radio(
                        "Import Mode",
                        ["Add new students only", "Replace all data", "Update existing + add new"]
                    )
                
                with col2:
                    if st.button("🔄 Import Data", type="primary"):
                        try:
                            current_data = load_data()
                            
                            if import_mode == "Replace all data":
                                # Clear existing data and files
                                if os.path.exists(PHOTO_DIR):
                                    shutil.rmtree(PHOTO_DIR)
                                if os.path.exists(PDF_DIR):
                                    shutil.rmtree(PDF_DIR)
                                os.makedirs(PHOTO_DIR, exist_ok=True)
                                os.makedirs(PDF_DIR, exist_ok=True)
                                new_data = []
                            else:
                                new_data = current_data.copy()
                            
                            imported_count = 0
                            updated_count = 0
                            
                            def _parse_import_date(val):
                                # Try pandas with dayfirst=True to respect D/M/Y common formats
                                try:
                                    dt = pd.to_datetime(val, dayfirst=True, errors='coerce')
                                    if pd.notna(dt):
                                        return dt.date().isoformat()
                                except Exception:
                                    pass

                                # Fallback to existing robust parser which handles strings like 'NaT'
                                parsed = parse_date_flexible(val)
                                return parsed.isoformat() if parsed else None

                            for _, row in import_df.iterrows():
                                student_data = {
                                    'id': len(new_data) + 1,
                                    'name': str(row['name']),
                                    'father_name': str(row['father_name']),
                                    'roll_no': str(row['roll_no']),
                                    'class': str(row['class']),
                                    'phone': str(row['phone']),
                                    'gr_number': str(row['gr_number']),
                                    'date_of_birth': _parse_import_date(row.get('date_of_birth')),
                                    'date_of_issue': _parse_import_date(row.get('date_of_issue')),
                                    'date_of_expiry': _parse_import_date(row.get('date_of_expiry')),
                                    'photo_path': str(row['photo_path']) if 'photo_path' in row and pd.notna(row['photo_path']) else None,
                                    'created_at': datetime.now().isoformat()
                                }
                                
                                if import_mode == "Update existing + add new":
                                    # Check if student exists (by roll number)
                                    existing_idx = next((i for i, s in enumerate(new_data) if s['roll_no'] == student_data['roll_no']), None)
                                    if existing_idx is not None:
                                        # Update existing student
                                        student_data['id'] = new_data[existing_idx]['id']
                                        student_data['photo_path'] = new_data[existing_idx].get('photo_path')
                                        student_data['updated_at'] = datetime.now().isoformat()
                                        new_data[existing_idx] = student_data
                                        updated_count += 1
                                    else:
                                        # Add new student
                                        new_data.append(student_data)
                                        imported_count += 1
                                else:
                                    # Add new students only
                                    if not any(s['roll_no'] == student_data['roll_no'] for s in new_data):
                                        new_data.append(student_data)
                                        imported_count += 1
                            
                            save_data(new_data)
                            
                            # Show results
                            if import_mode == "Replace all data":
                                st.success(f"Data replaced successfully! Imported {len(import_df)} students.")
                            elif import_mode == "Update existing + add new":
                                st.success(f"Import completed! Added {imported_count} new students, updated {updated_count} existing students.")
                            else:
                                st.success(f"Import completed! Added {imported_count} new students (skipped {len(import_df) - imported_count} duplicates).")
                            
                            st.rerun()
                            
                        except Exception as e:
                            st.error(f"Error importing data: {str(e)}")
        
        except Exception as e:
            st.error(f"Error reading file: {str(e)}")
    


# Sidebar Statistics
st.sidebar.markdown("---")
st.sidebar.subheader("📊 Statistics")
data = load_data()
st.sidebar.metric("Total Students", len(data))

if data:
    # Class distribution
    class_counts = {}
    for student in data:
        class_name = student.get('class', 'Unknown')
        class_counts[class_name] = class_counts.get(class_name, 0) + 1
    
    st.sidebar.write("**Students by Class:**")
    for class_name, count in sorted(class_counts.items()):
        st.sidebar.write(f"• Class {class_name}: {count}")
    
    # Recent additions
    recent_students = sorted(
        [s for s in data if s.get('created_at')], 
        key=lambda x: x['created_at'], 
        reverse=True
    )[:3]
    
    if recent_students:
        st.sidebar.write("**Recent Additions:**")
        for student in recent_students:
            created_dt = parse_date_flexible(student.get('created_at'))
            created_date = created_dt.strftime('%m/%d') if created_dt else ''
            st.sidebar.write(f"• {student['name']} ({created_date})")

# Clear selections button
if st.session_state.selected_students:
    st.sidebar.markdown("---")
    if st.sidebar.button("🗑️ Clear Selections"):
        st.session_state.selected_students = []
        st.rerun()

# Footer
st.markdown("---")
st.markdown(
    """
    <div style='text-align: center; color: #666;'>
        <p>🎓 Enhanced Student ID Card Manager v1.0</p>
        <p>Features: Multi-student management • Bulk operations • Excel import/export • Advanced filtering</p>
    </div>
    """, 
    unsafe_allow_html=True
)