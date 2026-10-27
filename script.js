
const studentForm = document.getElementById("studentForm");
const studentTable = document.getElementById("studentTable");
const searchInput = document.getElementById("search");
const studentCount = document.getElementById("studentCount");
const emptyMessage = document.getElementById("emptyMessage");
const message = document.getElementById("message");

const nameInput = document.getElementById("name");
const rollInput = document.getElementById("roll");
const emailInput = document.getElementById("email");
const courseInput = document.getElementById("course");
const semesterInput = document.getElementById("semester");
const editIdInput = document.getElementById("editId");

const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const cancelBtn = document.getElementById("cancelBtn");

const STORAGE_KEY = "studentManagementRecords";

// Load saved student records
let students = [];

try {
    const savedStudents = localStorage.getItem(STORAGE_KEY);
    const parsedStudents = savedStudents
        ? JSON.parse(savedStudents)
        : [];

    if (Array.isArray(parsedStudents)) {
        students = parsedStudents;
    }
} catch (error) {
    console.error("Could not load saved student records.", error);
}

// Save records in the browser
function saveStudents() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(students)
        );
        return true;
    } catch (error) {
        console.error("Could not save student records.", error);
        showMessage(
            "Could not save data. Browser storage may be full.",
            true
        );
        return false;
    }
}

// Show a message to the user
function showMessage(text, isError = false) {
    message.textContent = text;
    message.style.color = isError ? "#dc2626" : "#15803d";
}

// Escape text before placing it inside HTML
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[char];
    });
}

// Display student records in the table
function displayStudents(list = students) {
    studentTable.innerHTML = "";

    studentCount.textContent =
        `${students.length} student${students.length === 1 ? "" : "s"}`;

    emptyMessage.style.display =
        list.length === 0 ? "block" : "none";

    list.forEach(function (student, index) {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${escapeHTML(student.name)}</td>
            <td>${escapeHTML(student.roll)}</td>
            <td>${escapeHTML(student.email)}</td>
            <td>${escapeHTML(student.course)}</td>
            <td>${escapeHTML(student.semester)}</td>
            <td>
                <button type="button"
                    class="edit-btn"
                    data-action="edit"
                    data-id="${escapeHTML(student.id)}">
                    Edit
                </button>
                <button type="button"
                    class="delete-btn"
                    data-action="delete"
                    data-id="${escapeHTML(student.id)}">
                    Delete
                </button>
            </td>
        `;

        studentTable.appendChild(row);
    });
}

// Add a new student or update an existing one
studentForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const student = {
        name: nameInput.value.trim(),
        roll: rollInput.value.trim(),
        email: emailInput.value.trim(),
        course: courseInput.value.trim(),
        semester: semesterInput.value
    };

    // Basic validation
    if (
        !student.name ||
        !student.roll ||
        !student.email ||
        !student.course ||
        !student.semester
    ) {
        showMessage("Please fill in all fields.", true);
        return;
    }

    const editingId = editIdInput.value;

    // Prevent duplicate roll numbers
    const duplicateRoll = students.some(function (item) {
        return (
            item.roll.toLowerCase() === student.roll.toLowerCase() &&
            item.id !== editingId
        );
    });

    if (duplicateRoll) {
        showMessage("This roll number already exists.", true);
        return;
    }

    let updatedStudents;

    if (editingId) {
        // Update existing student
        updatedStudents = students.map(function (item) {
            if (item.id === editingId) {
                return { ...item, ...student };
            }

            return item;
        });
    } else {
        // Create a new student record
        const newStudent = {
            id: crypto.randomUUID(),
            ...student
        };

        updatedStudents = [...students, newStudent];
    }

    const previousStudents = students;
    students = updatedStudents;

    if (!saveStudents()) {
        students = previousStudents;
        return;
    }

    displayStudents();
    resetForm();

    showMessage(
        editingId
            ? "Student updated successfully!"
            : "Student added successfully!"
    );
});

// Handle Edit and Delete buttons
studentTable.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-action]");

    if (!button) {
        return;
    }

    const studentId = button.dataset.id;
    const action = button.dataset.action;

    if (action === "edit") {
        editStudent(studentId);
    }

    if (action === "delete") {
        deleteStudent(studentId);
    }
});

// Fill the form with the selected student's details
function editStudent(id) {
    const student = students.find(function (item) {
        return item.id === id;
    });

    if (!student) {
        showMessage("Student record not found.", true);
        return;
    }

    editIdInput.value = student.id;
    nameInput.value = student.name;
    rollInput.value = student.roll;
    emailInput.value = student.email;
    courseInput.value = student.course;
    semesterInput.value = student.semester;

    formTitle.textContent = "Edit Student";
    submitBtn.textContent = "Update Student";
    cancelBtn.classList.remove("hidden");

    showMessage("Editing student record.");
    studentForm.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

// Delete a student record
function deleteStudent(id) {
    const student = students.find(function (item) {
        return item.id === id;
    });

    if (!student) {
        showMessage("Student record not found.", true);
        return;
    }

    const confirmed = confirm(
        `Are you sure you want to delete ${student.name}?`
    );

    if (!confirmed) {
        return;
    }

    const previousStudents = students;
    students = students.filter(function (item) {
        return item.id !== id;
    });

    if (!saveStudents()) {
        students = previousStudents;
        return;
    }

    displayStudents();
    showMessage("Student deleted successfully.");

    if (editIdInput.value === id) {
        resetForm();
    }
}

// Search by name, roll number, email, or course
searchInput.addEventListener("input", function () {
    const query = searchInput.value.trim().toLowerCase();

    const filteredStudents = students.filter(function (student) {
        return [
            student.name,
            student.roll,
            student.email,
            student.course
        ].some(function (value) {
            return value.toLowerCase().includes(query);
        });
    });

    displayStudents(filteredStudents);
});

// Reset the form after saving or cancelling an edit
function resetForm() {
    studentForm.reset();
    editIdInput.value = "";

    formTitle.textContent = "Add New Student";
    submitBtn.textContent = "Add Student";
    cancelBtn.classList.add("hidden");
}

// Cancel edit mode
cancelBtn.addEventListener("click", function () {
    resetForm();
    showMessage("Edit cancelled.");
});

// Display saved records when the page opens
displayStudents();
