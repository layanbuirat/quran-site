document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initApp();
    
    // Set up navigation between pages
    setupNavigation();
    
    // Set up forms for adding data
    setupForms();
    
    // Load all data when the app starts
    loadData();
    
    // Initialize tooltips
    initTooltips();
});

// Initialize the application
function initApp() {
    // Set the current date in Arabic
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    const arabicDate = now.toLocaleDateString('ar-EG', options);
    document.getElementById('current-date').textContent = arabicDate;
    
    // Set today's meeting (next Friday)
    const nextFriday = getNextFriday(now);
    const nextFridayStr = nextFriday.toLocaleDateString('ar-EG', options);
    document.getElementById('today-meeting').textContent = `القاء القادم: ${nextFridayStr}`;
    
    // Set today's date in date fields
    const todayStr = now.toISOString().split('T')[0];
    document.getElementById('student-date').value = todayStr;
    document.getElementById('attendance-date').value = todayStr;
    document.getElementById('event-date').value = todayStr;
    document.getElementById('competition-date').value = todayStr;
    
    // Set current year in footer
    document.getElementById('current-year').textContent = now.getFullYear();
}

// Set up navigation between pages
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Hide all pages
            document.querySelectorAll('.page-content').forEach(page => {
                page.classList.add('d-none');
            });
            
            // Remove active class from all links
            navLinks.forEach(navLink => {
                navLink.classList.remove('active');
            });
            
            // Show the selected page
            const pageId = this.getAttribute('data-page');
            document.getElementById(pageId).classList.remove('d-none');
            
            // Add active class to current link
            this.classList.add('active');
            
            // Load page-specific data if needed
            if (pageId === 'students') {
                loadStudents();
            } else if (pageId === 'attendance') {
                loadAttendance();
            } else if (pageId === 'events') {
                loadEvents();
            } else if (pageId === 'competitions') {
                loadCompetitions();
            }
        });
    });
}

// Set up forms for adding data
function setupForms() {
    // Add student form
    document.getElementById('save-student').addEventListener('click', function() {
        const name = document.getElementById('student-name').value.trim();
        const pages = document.getElementById('pages-count').value.trim();
        const fromSurah = document.getElementById('from-surah').value.trim();
        const toSurah = document.getElementById('to-surah').value.trim();
        const date = document.getElementById('student-date').value;
        
        if (name && pages && fromSurah && toSurah && date) {
            addStudent(name, pages, fromSurah, toSurah, date);
            // Reset form
            document.getElementById('add-student-form').reset();
            // Set today's date
            document.getElementById('student-date').value = new Date().toISOString().split('T')[0];
            // Hide modal
            bootstrap.Modal.getInstance(document.getElementById('addStudentModal')).hide();
        } else {
            alert('الرجاء ملء جميع الحقول');
        }
    });
    
    // Add absence form
    document.getElementById('add-absent').addEventListener('click', function() {
        const studentId = document.getElementById('select-student').value;
        const date = document.getElementById('attendance-date').value;
        
        if (studentId && date) {
            addAbsence(studentId, date);
            // Reset date to today
            document.getElementById('attendance-date').value = new Date().toISOString().split('T')[0];
        } else {
            alert('الرجاء اختيار طالبة وتاريخ');
        }
    });
    
    // Add event form
    document.getElementById('save-event').addEventListener('click', function() {
        const name = document.getElementById('event-name').value.trim();
        const date = document.getElementById('event-date').value;
        const description = document.getElementById('event-description').value.trim();
        
        if (name && date) {
            addEvent(name, date, description);
            // Reset form
            document.getElementById('add-event-form').reset();
            // Set today's date
            document.getElementById('event-date').value = new Date().toISOString().split('T')[0];
            // Hide modal
            bootstrap.Modal.getInstance(document.getElementById('addEventModal')).hide();
        } else {
            alert('الرجاء ملء الحقول المطلوبة');
        }
    });
    
    // Add competition form
    document.getElementById('save-competition').addEventListener('click', function() {
        const name = document.getElementById('competition-name').value.trim();
        const date = document.getElementById('competition-date').value;
        const type = document.getElementById('competition-type').value;
        const prize = document.getElementById('competition-prize').value.trim();
        
        if (name && date && type) {
            addCompetition(name, date, type, prize);
            // Reset form
            document.getElementById('add-competition-form').reset();
            // Set today's date
            document.getElementById('competition-date').value = new Date().toISOString().split('T')[0];
            // Hide modal
            bootstrap.Modal.getInstance(document.getElementById('addCompetitionModal')).hide();
        } else {
            alert('الرجاء ملء الحقول المطلوبة');
        }
    });
    
    // Confirm delete
    document.getElementById('confirm-delete').addEventListener('click', function() {
        const id = document.getElementById('delete-item-id').value;
        const type = document.getElementById('delete-item-type').value;
        
        if (id && type) {
            deleteItem(id, type);
            bootstrap.Modal.getInstance(document.getElementById('confirmDeleteModal')).hide();
        }
    });
}

// Load all data
function loadData() {
    loadStudents();
    loadAttendance();
    loadEvents();
    loadCompetitions();
    updateStats();
    loadLatestAnnouncements();
    loadUpcomingEvents();
}

// Students management
let students = JSON.parse(localStorage.getItem('students')) || [];

function loadStudents() {
    const tableBody = document.getElementById('students-table');
    tableBody.innerHTML = '';
    
    if (students.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">لا توجد طالبات مسجلة</td></tr>';
        return;
    }
    
    // Sort students by date (newest first)
    const sortedStudents = [...students].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedStudents.forEach((student) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.name}</td>
            <td>${student.pages}</td>
            <td>${student.fromSurah}</td>
            <td>${student.toSurah}</td>
            <td>${formatDate(new Date(student.date))}</td>
            <td>
                <button class="btn btn-sm btn-danger delete-btn" data-id="${student.id}" data-type="student" title="حذف">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Update students dropdown for attendance
    updateStudentsDropdown();
    
    // Add event listeners to delete buttons
    setupDeleteButtons();
}

function addStudent(name, pages, fromSurah, toSurah, date) {
    const newStudent = {
        id: Date.now(),
        name,
        pages,
        fromSurah,
        toSurah,
        date
    };
    
    students.push(newStudent);
    localStorage.setItem('students', JSON.stringify(students));
    loadStudents();
    updateStats();
    
    // Send notification (simulated)
    sendNotification(name, `تم تسجيلك لحفظ ${pages} صفحة من سورة ${fromSurah} إلى ${toSurah}`);
}

// Attendance management
let absences = JSON.parse(localStorage.getItem('absences')) || [];

function loadAttendance() {
    const tableBody = document.getElementById('attendance-table');
    tableBody.innerHTML = '';
    
    if (absences.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" class="text-center">لا توجد سجلات غياب</td></tr>';
        return;
    }
    
    // Sort absences by date (newest first)
    const sortedAbsences = [...absences].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedAbsences.forEach((absence) => {
        const student = students.find(s => s.id == absence.studentId);
        if (student) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.name}</td>
                <td>${formatDate(new Date(absence.date))}</td>
                <td>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${absence.id}" data-type="absence" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        }
    });
    
    // Add event listeners to delete buttons
    setupDeleteButtons();
}

function addAbsence(studentId, date) {
    // Check if absence already exists for this student and date
    const exists = absences.some(a => a.studentId == studentId && a.date === date);
    if (exists) {
        alert('هذه الطالبة مسجلة غياب بالفعل في هذا التاريخ');
        return;
    }
    
    const newAbsence = {
        id: Date.now(),
        studentId: parseInt(studentId),
        date
    };
    
    absences.push(newAbsence);
    localStorage.setItem('absences', JSON.stringify(absences));
    loadAttendance();
    updateStats();
    
    // Send notification (simulated)
    const student = students.find(s => s.id == studentId);
    if (student) {
        sendNotification(student.name, `تم تسجيل غيابك بتاريخ ${formatDate(new Date(date))}`);
    }
}

// Events management
let events = JSON.parse(localStorage.getItem('events')) || [];

function loadEvents() {
    const tableBody = document.getElementById('events-table');
    tableBody.innerHTML = '';
    
    if (events.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center">لا توجد مناسبات مسجلة</td></tr>';
        return;
    }
    
    // Sort events by date (newest first)
    const sortedEvents = [...events].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedEvents.forEach((event) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${event.name}</td>
            <td>${formatDate(new Date(event.date))}</td>
            <td>${event.description || '-'}</td>
            <td>
                <button class="btn btn-sm btn-danger delete-btn" data-id="${event.id}" data-type="event" title="حذف">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Add event listeners to delete buttons
    setupDeleteButtons();
}

function addEvent(name, date, description) {
    const newEvent = {
        id: Date.now(),
        name,
        date,
        description
    };
    
    events.push(newEvent);
    localStorage.setItem('events', JSON.stringify(events));
    loadEvents();
    loadUpcomingEvents();
    
    // Send notifications to all students (simulated)
    students.forEach(student => {
        sendNotification(student.name, `تم إعلان مناسبة جديدة: ${name} بتاريخ ${formatDate(new Date(date))}`);
    });
}

// Competitions management
let competitions = JSON.parse(localStorage.getItem('competitions')) || [];

function loadCompetitions() {
    const tableBody = document.getElementById('competitions-table');
    tableBody.innerHTML = '';
    
    if (competitions.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center">لا توجد مسابقات مسجلة</td></tr>';
        return;
    }
    
    // Sort competitions by date (newest first)
    const sortedCompetitions = [...competitions].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedCompetitions.forEach((competition) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${competition.name}</td>
            <td>${formatDate(new Date(competition.date))}</td>
            <td>${competition.type}</td>
            <td>${competition.prize || '-'}</td>
            <td>
                <button class="btn btn-sm btn-danger delete-btn" data-id="${competition.id}" data-type="competition" title="حذف">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Add event listeners to delete buttons
    setupDeleteButtons();
}

function addCompetition(name, date, type, prize) {
    const newCompetition = {
        id: Date.now(),
        name,
        date,
        type,
        prize
    };
    
    competitions.push(newCompetition);
    localStorage.setItem('competitions', JSON.stringify(competitions));
    loadCompetitions();
    loadLatestAnnouncements();
    
    // Send notifications to all students (simulated)
    students.forEach(student => {
        sendNotification(student.name, `تم إعلان مسابقة جديدة: ${name} (${type}) بتاريخ ${formatDate(new Date(date))}`);
    });
}

// Update statistics
function updateStats() {
    // Total students
    document.getElementById('total-students').textContent = students.length;
    
    // Today's pages
    const today = new Date().toISOString().split('T')[0];
    const todayPages = students
        .filter(s => s.date === today)
        .reduce((sum, s) => sum + parseInt(s.pages), 0);
    document.getElementById('total-pages').textContent = todayPages;
    
    // Today's absences
    const todayAbsences = absences.filter(a => a.date === today).length;
    document.getElementById('absent-today').textContent = todayAbsences;
    
    // Update today's warda text
    const wardaText = todayPages > 0 ? 
        `وردة اليوم كانت: ${todayPages} صفحة` : 
        "لم يتم تسجيل وردة اليوم بعد";
    document.getElementById('warda-today').textContent = wardaText;
}

// Load latest announcements
function loadLatestAnnouncements() {
    const container = document.getElementById('latest-announcements');
    container.innerHTML = '';
    
    // Combine competitions and events
    const allAnnouncements = [
        ...competitions.map(c => ({
            type: 'مسابقة',
            title: c.name,
            date: c.date,
            details: `نوع: ${c.type}${c.prize ? ` - الجائزة: ${c.prize}` : ''}`
        })),
        ...events.map(e => ({
            type: 'مناسبة',
            title: e.name,
            date: e.date,
            details: e.description || 'لا يوجد وصف'
        }))
    ];
    
    // Sort by date (newest first)
    allAnnouncements.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (allAnnouncements.length === 0) {
        container.innerHTML = '<p class="text-center">لا توجد إعلانات حالياً</p>';
        return;
    }
    
    // Show only the latest 3 announcements
    const latest = allAnnouncements.slice(0, 3);
    
    latest.forEach(announcement => {
        const div = document.createElement('div');
        div.className = 'mb-3 p-2 border-bottom';
        div.innerHTML = `
            <h6 class="mb-1">${announcement.type}: ${announcement.title}</h6>
            <p class="small text-muted mb-1">${formatDate(new Date(announcement.date))}</p>
            <p class="small mb-0">${announcement.details}</p>
        `;
        container.appendChild(div);
    });
}

// Load upcoming events
function loadUpcomingEvents() {
    const container = document.getElementById('upcoming-events');
    container.innerHTML = '';
    
    // Combine events and competitions
    const allEvents = [
        ...events.map(e => ({
            type: 'مناسبة',
            title: e.name,
            date: e.date,
            description: e.description
        })),
        ...competitions.map(c => ({
            type: 'مسابقة',
            title: c.name,
            date: c.date,
            description: `نوع: ${c.type}${c.prize ? ` - الجائزة: ${c.prize}` : ''}`
        }))
    ];
    
    // Filter only upcoming events (today or later)
    const today = new Date().toISOString().split('T')[0];
    const upcoming = allEvents.filter(e => e.date >= today);
    
    if (upcoming.length === 0) {
        container.innerHTML = '<p class="text-center">لا توجد مناسبات قادمة</p>';
        return;
    }
    
    // Sort by date (earliest first)
    upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Show only the next 3 events
    const nextEvents = upcoming.slice(0, 3);
    
    nextEvents.forEach(event => {
        const div = document.createElement('div');
        div.className = 'mb-3 p-2 border-bottom';
        div.innerHTML = `
            <h6 class="mb-1">${event.type}: ${event.title}</h6>
            <p class="small text-muted mb-1">${formatDate(new Date(event.date))}</p>
            <p class="small mb-0">${event.description || 'لا يوجد وصف'}</p>
        `;
        container.appendChild(div);
    });
}

// Update students dropdown for attendance
function updateStudentsDropdown() {
    const select = document.getElementById('select-student');
    select.innerHTML = '<option value="">اختر طالبة</option>';

    students.forEach(student => {
        const option = document.createElement('option');
        option.value = student.id;
        option.textContent = student.name;
        select.appendChild(option);
    });
}

// Setup delete buttons event listeners
function setupDeleteButtons() {
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const type = this.getAttribute('data-type');
            showDeleteConfirm(id, type);
        });
    });
}

// Show delete confirmation modal
function showDeleteConfirm(id, type) {
    document.getElementById('delete-item-id').value = id;
    document.getElementById('delete-item-type').value = type;
    
    // Get the item name to show in confirmation message
    let itemName = '';
    if (type === 'student') {
        const student = students.find(s => s.id == id);
        itemName = student ? student.name : 'هذه الطالبة';
    } else if (type === 'absence') {
        const absence = absences.find(a => a.id == id);
        if (absence) {
            const student = students.find(s => s.id == absence.studentId);
            itemName = student ? student.name : 'هذا الغياب';
        }
    } else if (type === 'event') {
        const event = events.find(e => e.id == id);
        itemName = event ? event.name : 'هذه المناسبة';
    } else if (type === 'competition') {
        const competition = competitions.find(c => c.id == id);
        itemName = competition ? competition.name : 'هذه المسابقة';
    }
    
    // Update modal message
    document.querySelector('#confirmDeleteModal .modal-body p').textContent = 
        `هل أنت متأكد أنك تريد حذف ${itemName || 'هذا العنصر'}؟`;
    
    // Show modal
    new bootstrap.Modal(document.getElementById('confirmDeleteModal')).show();
}

// Delete item
function deleteItem(id, type) {
    if (type === 'student') {
        students = students.filter(s => s.id != id);
        localStorage.setItem('students', JSON.stringify(students));
        loadStudents();
        
        // Remove related absences
        absences = absences.filter(a => !students.some(s => s.id == a.studentId));
        localStorage.setItem('absences', JSON.stringify(absences));
    } 
    else if (type === 'absence') {
        absences = absences.filter(a => a.id != id);
        localStorage.setItem('absences', JSON.stringify(absences));
        loadAttendance();
    } 
    else if (type === 'event') {
        events = events.filter(e => e.id != id);
        localStorage.setItem('events', JSON.stringify(events));
        loadEvents();
        loadUpcomingEvents();
    } 
    else if (type === 'competition') {
        competitions = competitions.filter(c => c.id != id);
        localStorage.setItem('competitions', JSON.stringify(competitions));
        loadCompetitions();
        loadLatestAnnouncements();
    }
    
    updateStats();
}

// Send notification (simulated - in a real app, use a notification service)
function sendNotification(studentName, message) {
    console.log(`إشعار لـ ${studentName}: ${message}`);
    // In a real app, you could send an email or push notification here
}

// Helper functions
function formatDate(date) {
    if (!date) return '';
    
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        timeZone: 'UTC'
    };
    return date.toLocaleDateString('ar-EG', options);
}

function getNextFriday(fromDate) {
    const date = new Date(fromDate);
    date.setDate(date.getDate() + (5 - date.getDay() + 7) % 7);
    return date;
}

// Initialize Bootstrap tooltips
function initTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}