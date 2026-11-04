# Ceylon Dutch Trails Corp Pvt Ltd
## Employee Personal Files Digitalization System - User Manual

This manual provides instructions on how to use the Employee Personal Files Digitalization system. The system enables the digital management of employee records, document checklists, digital ID card issuance, and service letter generation.

---

## 1. System Roles & Access Control

The system supports two primary user roles:

1. **System Administrator (Admin)**
   - Manages invite links and QR codes.
   - Creates new employee accounts directly.
   - Fills out and edits all employee details (including "Office Used Only" fields).
   - Manages the document checklist and signs/approves employee files.
   - Generates and downloads digital ID cards and service letters.

2. **Employee**
   - Accesses their own portal to fill out their personal file.
   - Uploads required proof documents (NIC Copy, Certificates, Bank Passbook, GS Certificate).
   - Submits their file for admin approval and tracks live processing time.
   - Views their approved digital ID card and details.

---

## 2. Authentication & Account Setup

### 2.1 Sign Up (Invite-Free & Invite-Based)
Registration via QR invite tokens is **optional**.
- **With Invite**: If an employee has received an invite link or scanned the invite QR code, the token will be automatically filled, registering them to their respective invite record.
- **Without Invite**: Employees can register directly on the **Sign up** tab in `/auth` without providing an invite token by entering their Name, Email, and Password.

### 2.2 Login
- Users log in from the **Login** tab in `/auth`.
- If logged in as an Admin, you are automatically redirected to the **Admin Dashboard** (`/admin`).
- If logged in as an Employee, you are redirected to **My Personal File** page (`/portal`).

---

## 3. Administrator Guide

### 3.1 Creating a New Employee Account
Admins can bypass invitations and register employee user accounts directly from the dashboard:
1. Log in to the Admin Dashboard.
2. Click the **"Add Employee"** button next to "Generate Invite QR".
3. In the dialog, enter the employee's **Full Name**, **Email**, and an **Initial Password** (e.g., `Employee@123`).
4. Click **"Create Employee"**.
5. The account is created immediately. You can now communicate the email and password to the employee so they can log in. The record will appear in the **Other** tab of the dashboard as a `Draft`.

### 3.2 Entering and Editing Employee Details
Admins have full access to fill in and update any employee's details:
1. Click the **"Eye" (View)** icon next to any employee row on the dashboard.
2. Click the **"Edit Details"** button at the top right.
3. Fill out or modify the fields in the following sections:
   - **Basic Information**: Full Name, NIC, DOB (Age is automatically calculated), Gender, Mobile, Home Telephone, Email, Religion, Marital Status, Spouse Name, Permanent Address, and Emergency Contacts.
   - **Children Details**: Click **"Add Child"** to add rows for child names and birthdates.
   - **Employment Details**: Designation, Department, Branch, Section, Join Date, Employment Conditions (e.g., Contract, Permanent), Salary, Training Period (From - To), Permanent Date, and Retirement/End of Contract Date.
   - **Bank & EPF/ETF**: Bank Name, Branch, Account Number, Account Holder Name, and EPF/ETF numbers.
   - **Document Checklist**: Check the boxes for documents that have been physically verified (CV, NIC Copy, Birth Certificate, GS Copy, A/L, O/L, Degree, Post Graduate, NVQ, VTA/NAITA, Other).
   - **Previous Employment Details**: Click **"Add Employment Row"** to add previous jobs, experience years, positions, dates, and check if the service certificate was verified.
   - **Uploaded Proof Documents**: Upload files or images for the Profile Photo, NIC Copy, Certificates, Bank Passbook, and GS Certificate.
4. Click **"Save Details"** to update the database.

### 3.3 Sign and Approve Files
- **E-Signature**: To sign a file, click the **"Sign"** button at the top of the employee details page, draw the signature in the canvas modal, and click **"Save Signature"**.
- **Approve**: When an employee submits their file, it appears under the **Pending** tab. Click **"Approve"** on the dashboard or employee page to issue their unique Employee Code (e.g., `DT-XXXXXX`) and stop the processing timer.
- **Reject**: Click **"Reject"** if details are incorrect or missing. The file status will return to `Rejected`, allowing the employee to edit and resubmit.

---

## 4. Employee Portal Guide

Employees can manage their own personal files:
1. **Basic Details & NIC Autofill**: Enter your NIC number and press Tab or click outside the input. The system will decode the NIC to autofill your Date of Birth, Gender, and verify it.
2. **Dynamic Entry Fields**: Fill in your personal details, bank information, emergency contacts, children list, and previous employment records.
3. **Upload Files**: Drag-and-drop or upload your profile photo, NIC copy, bank passbook, and certificates.
4. **Drafts**: Click **"Save Draft"** at any time to save progress without submitting.
5. **Submit for Approval**: Once all required fields are complete, click **"Submit for Approval"**. Your status updates to `Pending Approval` and a live processing timer starts. You cannot edit details while your file is pending approval.
6. **Digital ID**: Once the admin approves your file, a digital badge and ID card with a verification QR code will be generated. Click **"View Digital ID"** to access it.
