# Security Spec: EM-ERALD INTERIORS

## Data Invariants
1. A **User** document's `role` cannot be self-modified, and a user's own `approved` state can only be modified by an already verified `owner`.
2. A **Message** document must be writeable by anonymous/unauthenticated users (so contact forms work), but only readable and updateable by approved users (`owner` or approved `employee`).
3. **Service**, **GalleryItem**, and **SiteConfig** are publicly readable, but writeable ONLY by authenticated, approved employees or owners.
4. Self-registration is allowed upon first sign-in (with zero overall system users), automatically elevating the first registrant as the `owner`. Subsequent sign-ins default to unapproved `employee`.

---

## The "Dirty Dozen" Attack Payloads

### 1. Self-Approved Owner Exploit
*   **Attack**: An unauthenticated or newly signed-in user tries to create or update their own profile with `role: "owner"` and `approved: true` to bypass approval limits.
*   **Target**: `/users/{userId}`
*   **Payload**: `{ "uid": "attacker_id", "email": "attacker@gmail.com", "role": "owner", "approved": true, "createdAt": "SERVER_TIMESTAMP" }`
*   **Expected**: `PERMISSION_DENIED`

### 2. Employee Stealth-Approve Exploit
*   **Attack**: An unapproved employee tries to update their own `approved` field to `true`.
*   **Target**: `/users/employee_id`
*   **Payload**: `{ "approved": true }`
*   **Expected**: `PERMISSION_DENIED`

### 3. Read Private Messages Without Auth
*   **Attack**: An unauthenticated guest tries to list or fetch messages submitted through the website.
*   **Target**: `/messages/{messageId}` (read)
*   **Payload**: `GET /messages`
*   **Expected**: `PERMISSION_DENIED`

### 4. Employee Reading Admin Config Settings
*   **Attack**: A non-approved employee tries to read private system logs or message entries.
*   **Target**: `/messages/{messageId}` (read with status unapproved)
*   **Payload**: `GET /messages`
*   **Expected**: `PERMISSION_DENIED`

### 5. Malicious Configuration Poisoning
*   **Attack**: An anonymous user attempts to overwrite the contact phone or WhatsApp routing link with theirs.
*   **Target**: `/config/general` (write)
*   **Payload**: `{ "contactPhone": "0700-SCAM-ME", "whatsappNumber": "254700000000" }`
*   **Expected**: `PERMISSION_DENIED`

### 6. Gallery Denial-of-Wallet Payload
*   **Attack**: A malicious guest tries to upload/insert a massive string in a gallery item text field to bloat storage or manipulate database structure.
*   **Target**: `/gallery/{galleryId}` (write)
*   **Payload**: `{ "id": "gal_new", "url": "MALICIOUS_DATA_STREET_XYZ_SUPER_LONG_STRING...", "tag": "WORK", "title": "Injected String", "span": "col" }`
*   **Expected**: `PERMISSION_DENIED`

### 7. Spoof Message Created Time
*   **Attack**: An anonymous sender tries to set `createdAt` timestamp in the message payload to a historic date (e.g. 5 years ago) instead of the server time.
*   **Target**: `/messages/{messageId}` (write)
*   **Payload**: `{ "name": "Hack", "phone": "123", "email": "a@b.com", "service": "Sourcing", "message": "hello", "status": "unread", "createdAt": "2015-05-18T00:00:00Z" }`
*   **Expected**: `PERMISSION_DENIED`

### 8. Message Modification Attack
*   **Attack**: An anonymous user tries to delete or modify a message they previously sent through the page.
*   **Target**: `/messages/{messageId}` (update/delete)
*   **Payload**: `{ "status": "contacted" }` (or any edit)
*   **Expected**: `PERMISSION_DENIED`

### 9. ID Injection Exploit
*   **Attack**: Attacker attempts to inject malicious characters or special symbols as the document key inside `/services` to corrupt UI or query patterns.
*   **Target**: `/services/service$!#&^%scam`
*   **Payload**: `{ "id": "service$!#&^%scam", "title": "Injected", "desc": "Sleek description", "icon": "Hammer", "order": 1 }`
*   **Expected**: `PERMISSION_DENIED`

### 10. Service Modification as Guest
*   **Attack**: A non-logged-in guest attempts to delete a service from the site.
*   **Target**: `/services/consulting` (delete)
*   **Payload**: `DELETE /services/consulting`
*   **Expected**: `PERMISSION_DENIED`

### 11. Self-Assigned Role Escalation
*   **Attack**: An approved employee attempts to update their own role from `"employee"` to `"owner"`.
*   **Target**: `/users/{employeeId}` (update)
*   **Payload**: `{ "role": "owner" }`
*   **Expected**: `PERMISSION_DENIED`

### 12. Deleting the Owner Profile
*   **Attack**: An approved employee tries to delete the main owner's profile doc in Firestore to gain absolute ownership.
*   **Target**: `/users/{ownerId}` (delete)
*   **Payload**: `DELETE /users/owner_user_id`
*   **Expected**: `PERMISSION_DENIED`
