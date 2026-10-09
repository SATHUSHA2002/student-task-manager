
const form = document.getElementById("task-form");
const input = document.getElementById("task-input");
const taskList = document.getElementById("task-list");

const totalCount = document.getElementById("total-count");
const pendingCount = document.getElementById("pending-count");
const completedCount = document.getElementById("completed-count");
const taskCountBadge = document.getElementById("task-count-badge");

const filterButtons = document.querySelectorAll(".filter-button");

const STORAGE_KEY = "studyflow-tasks";

let currentFilter = "all";
let tasks = loadTasks();

// Load saved tasks from the browser
function loadTasks() {
    try {
        const savedTasks = localStorage.getItem(STORAGE_KEY);

        if (savedTasks === null) {
            return [];
        }

        const parsedTasks = JSON.parse(savedTasks);

        if (!Array.isArray(parsedTasks)) {
            return [];
        }

        return parsedTasks.filter(task =>
            task &&
            typeof task.id === "string" &&
            typeof task.text === "string" &&
            typeof task.completed === "boolean"
        );
    } catch (error) {
        console.error("Could not load saved tasks:", error);
        return [];
    }
}

// Save tasks in the browser
function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
        console.error("Could not save tasks:", error);
        alert("Tasks could not be saved. Check your browser storage settings.");
    }
}

// Add a new task
form.addEventListener("submit", function (event) {
    event.preventDefault();

    const taskText = input.value.trim();

    if (taskText === "") {
        return;
    }

    const newTask = {
        id: createTaskId(),
        text: taskText,
        completed: false
    };

    tasks.unshift(newTask);

    saveTasks();

    // Show the newly added task even if another filter was active
    currentFilter = "all";
    updateActiveFilter();
    renderTasks();

    form.reset();
    input.focus();
});

// Create a unique ID for each task
function createTaskId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }

    return Date.now().toString(36) +
        Math.random().toString(36).slice(2);
}

// Display tasks based on the selected filter
function renderTasks() {
    taskList.replaceChildren();

    const filteredTasks = tasks.filter(task => {
        if (currentFilter === "pending") {
            return !task.completed;
        }

        if (currentFilter === "completed") {
            return task.completed;
        }

        return true;
    });

    if (filteredTasks.length === 0) {
        showEmptyState();
    } else {
        filteredTasks.forEach(task => {
            taskList.appendChild(createTaskElement(task));
        });
    }

    updateStatistics();
}

// Create one task row
function createTaskElement(task) {
    const li = document.createElement("li");
    li.className = "task-item";

    if (task.completed) {
        li.classList.add("completed");
    }

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute(
        "aria-label",
        `Mark ${task.text} as ${task.completed ? "pending" : "completed"}`
    );

    checkbox.addEventListener("change", function () {
        toggleTask(task.id);
    });

    const text = document.createElement("span");
    text.className = "task-text";
    text.textContent = task.text;

    const status = document.createElement("span");
    status.className = task.completed
        ? "task-status completed-status"
        : "task-status pending-status";

    status.textContent = task.completed ? "Completed" : "Pending";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.textContent = "×";
    deleteButton.setAttribute("aria-label", `Delete ${task.text}`);
    deleteButton.title = "Delete task";

    deleteButton.addEventListener("click", function () {
        deleteTask(task.id);
    });

    li.append(checkbox, text, status, deleteButton);

    return li;
}

// Show a message when the selected list is empty
function showEmptyState() {
    const emptyState = document.createElement("li");
    emptyState.className = "empty-state";

    const icon = document.createElement("div");
    icon.className = "empty-icon";
    icon.textContent = currentFilter === "completed" ? "🎉" : "📝";

    const heading = document.createElement("h3");
    const message = document.createElement("p");

    if (currentFilter === "pending") {
        heading.textContent = "You're all caught up!";
        message.textContent = "There are no pending tasks right now.";
    } else if (currentFilter === "completed") {
        heading.textContent = "No completed tasks yet";
        message.textContent = "Complete a task and it will appear here.";
    } else {
        heading.textContent = "Your task list is empty";
        message.textContent = "Add your first task above to get started.";
    }

    emptyState.append(icon, heading, message);
    taskList.appendChild(emptyState);
}

// Mark a task as completed or pending
function toggleTask(taskId) {
    tasks = tasks.map(task => {
        if (task.id === taskId) {
            return {
                ...task,
                completed: !task.completed
            };
        }

        return task;
    });

    saveTasks();
    renderTasks();
}

// Delete a task
function deleteTask(taskId) {
    tasks = tasks.filter(task => task.id !== taskId);

    saveTasks();
    renderTasks();
}

// Switch between All, Pending, and Completed
filterButtons.forEach(button => {
    button.addEventListener("click", function () {
        currentFilter = button.dataset.filter;

        updateActiveFilter();
        renderTasks();
    });
});

// Update the active filter button
function updateActiveFilter() {
    filterButtons.forEach(button => {
        const isActive = button.dataset.filter === currentFilter;

        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
    });
}

// Update the dashboard statistics
function updateStatistics() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;

    totalCount.textContent = total;
    pendingCount.textContent = pending;
    completedCount.textContent = completed;

    taskCountBadge.textContent =
        `${total} ${total === 1 ? "task" : "tasks"}`;
}

// Show saved tasks when the page opens
updateActiveFilter();
renderTasks();