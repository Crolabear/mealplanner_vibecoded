// Meal plan data storage
let mealPlan = {};

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    loadMealPlan();
    setupDragAndDrop();
    setupCategoryManagement();
    highlightToday();
    setupDayCardButtons();
    checkFruitVeggieStatus();
    setupExport();
    setupClearAll();
});

// Highlight today's day
function highlightToday() {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];
    const todayCard = document.querySelector(`[data-day="${today}"]`);
    if (todayCard) {
        todayCard.classList.add('today');
    }
}

// Setup drag and drop
function setupDragAndDrop() {
    const foodItems = document.querySelectorAll('.food-item');
    const dropZones = document.querySelectorAll('.drop-zone');

    foodItems.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
    });

    dropZones.forEach(zone => {
        zone.addEventListener('dragover', handleDragOver);
        zone.addEventListener('drop', handleDrop);
        zone.addEventListener('dragleave', handleDragLeave);
    });
}

function handleDragStart(e) {
    const foodItem = e.target.closest('.food-item');
    if (!foodItem) return;
    
    foodItem.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'copy';
    const foodName = foodItem.querySelector('span').textContent;
    e.dataTransfer.setData('text/plain', foodName);
    e.dataTransfer.setData('category', foodItem.dataset.category);
    e.dataTransfer.setData('isFromDropped', 'false');
}

function handleDragEnd(e) {
    const foodItem = e.target.closest('.food-item');
    if (foodItem) {
        foodItem.classList.remove('dragging');
    }
    
    const droppedFood = e.target.closest('.dropped-food');
    if (droppedFood) {
        droppedFood.classList.remove('dragging');
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if it's from a dropped item or category
    const isFromDropped = e.dataTransfer.effectAllowed === 'move';
    e.dataTransfer.dropEffect = isFromDropped ? 'move' : 'copy';
    
    e.currentTarget.classList.add('drag-over');
    return false;
}

function handleDragLeave(e) {
    if (e.currentTarget.contains(e.relatedTarget)) {
        return;
    }
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');
    
    const foodName = e.dataTransfer.getData('text/plain');
    const category = e.dataTransfer.getData('category');
    const isFromDropped = e.dataTransfer.getData('isFromDropped');
    
    if (!foodName || !category) {
        console.error('Missing food data');
        return;
    }
    
    const dropZone = e.currentTarget;
    const mealSection = dropZone.closest('.meal-section');
    const dayCard = dropZone.closest('.day-card');
    
    if (!dayCard || !mealSection) {
        console.error('Could not find day card or meal section');
        return;
    }
    
    const day = dayCard.dataset.day;
    const meal = mealSection.dataset.meal;
    
    // If dragging from a dropped food item, remove the original
    if (isFromDropped === 'true') {
        const draggedElement = document.querySelector('.dropped-food.dragging');
        if (draggedElement) {
            draggedElement.remove();
        }
    }
    
    addFoodToMeal(day, meal, foodName, category, dropZone);
    saveMealPlan();
    checkFruitVeggieStatus();
    
    return false;
}

function addFoodToMeal(day, meal, foodName, category, dropZone) {
    const foodElement = document.createElement('div');
    foodElement.className = 'dropped-food';
    foodElement.dataset.category = category;
    foodElement.draggable = true;
    
    // Get custom category color if it exists
    const categoryElement = document.querySelector(`.category[data-category="${category}"]`);
    if (categoryElement && categoryElement.style.getPropertyValue('--category-color')) {
        const color = categoryElement.style.getPropertyValue('--category-color');
        foodElement.style.setProperty('--custom-category-color', color);
        foodElement.style.background = color;
    }
    
    foodElement.innerHTML = `
        <span>${foodName}</span>
        <button class="remove-btn">×</button>
    `;
    
    // Add drag event listeners for moving between meals/days
    foodElement.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('remove-btn')) {
            e.preventDefault();
            return;
        }
        e.stopPropagation();
        foodElement.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', foodName);
        e.dataTransfer.setData('category', category);
        e.dataTransfer.setData('isFromDropped', 'true');
    });
    
    foodElement.addEventListener('dragend', (e) => {
        foodElement.classList.remove('dragging');
    });
    
    foodElement.querySelector('.remove-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        foodElement.remove();
        saveMealPlan();
        checkFruitVeggieStatus();
    });
    
    dropZone.appendChild(foodElement);
}

// Category management functionality
function setupCategoryManagement() {
    // Setup add food buttons for each category
    document.querySelectorAll('.add-food-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const category = e.target.closest('.category');
            const input = category.querySelector('.add-food-input');
            const foodName = input.value.trim();
            
            if (foodName) {
                const categoryType = category.dataset.category;
                addFoodItemToCategory(categoryType, foodName, category);
                input.value = '';
            }
        });
    });
    
    // Setup enter key for add food inputs
    document.querySelectorAll('.add-food-input').forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.target.nextElementSibling.click();
            }
        });
    });
    
    // Setup remove food buttons
    document.querySelectorAll('.remove-food-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.target.closest('.food-item').remove();
        });
    });
    
    // Setup delete category buttons
    document.querySelectorAll('.delete-category-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (confirm('Delete this category and all its items?')) {
                e.target.closest('.category').remove();
            }
        });
    });
    
    // Setup add new category
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    const categoryInput = document.getElementById('newCategoryName');
    
    addCategoryBtn.addEventListener('click', () => {
        const categoryName = categoryInput.value.trim();
        if (categoryName) {
            addNewCategory(categoryName);
            categoryInput.value = '';
        }
    });
    
    categoryInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addCategoryBtn.click();
        }
    });
}

function addFoodItemToCategory(categoryType, foodName, categoryElement) {
    const container = categoryElement.querySelector('.food-items');
    const foodItem = document.createElement('div');
    foodItem.className = 'food-item';
    foodItem.draggable = true;
    foodItem.dataset.category = categoryType;
    foodItem.innerHTML = `
        <span>${foodName}</span>
        <button class="remove-food-btn">×</button>
    `;
    
    foodItem.addEventListener('dragstart', handleDragStart);
    foodItem.addEventListener('dragend', handleDragEnd);
    
    foodItem.querySelector('.remove-food-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        foodItem.remove();
    });
    
    container.appendChild(foodItem);
}

function addNewCategory(categoryName) {
    const categoriesContainer = document.getElementById('foodCategories');
    const categoryId = categoryName.toLowerCase().replace(/\s+/g, '-');
    
    // Generate a unique color for this category
    const color = generateCategoryColor(categoryId);
    
    const categoryElement = document.createElement('div');
    categoryElement.className = 'category';
    categoryElement.dataset.category = categoryId;
    categoryElement.style.setProperty('--category-color', color);
    categoryElement.innerHTML = `
        <div class="category-header">
            <h3>${categoryName}</h3>
            <button class="delete-category-btn" title="Delete Category">×</button>
        </div>
        <div class="add-food-section">
            <input type="text" class="add-food-input" placeholder="Add food item">
            <button class="add-food-btn">+</button>
        </div>
        <div class="food-items"></div>
    `;
    
    categoriesContainer.appendChild(categoryElement);
    
    // Setup event listeners for new category
    const addBtn = categoryElement.querySelector('.add-food-btn');
    const input = categoryElement.querySelector('.add-food-input');
    const deleteBtn = categoryElement.querySelector('.delete-category-btn');
    
    addBtn.addEventListener('click', () => {
        const foodName = input.value.trim();
        if (foodName) {
            addFoodItemToCategory(categoryId, foodName, categoryElement);
            input.value = '';
        }
    });
    
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addBtn.click();
        }
    });
    
    deleteBtn.addEventListener('click', () => {
        if (confirm('Delete this category and all its items?')) {
            categoryElement.remove();
        }
    });
}

// Generate a unique color based on category name
function generateCategoryColor(categoryId) {
    // Hash the category ID to get a consistent color
    let hash = 0;
    for (let i = 0; i < categoryId.length; i++) {
        hash = categoryId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Generate HSL color with good saturation and lightness
    const hue = Math.abs(hash % 360);
    const saturation = 45 + (Math.abs(hash) % 20); // 45-65%
    const lightness = 55 + (Math.abs(hash >> 8) % 15); // 55-70%
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// Check if each day has fruit/veggie
function checkFruitVeggieStatus() {
    const dayCards = document.querySelectorAll('.day-card');
    
    dayCards.forEach(card => {
        const droppedFoods = card.querySelectorAll('.dropped-food');
        let hasFruitOrVeggie = false;
        
        droppedFoods.forEach(food => {
            const category = food.dataset.category;
            if (category === 'fruit' || category === 'veggie') {
                hasFruitOrVeggie = true;
            }
        });
        
        // Remove existing alert if present
        const existingAlert = card.querySelector('.fruit-veggie-alert');
        if (existingAlert) {
            existingAlert.remove();
        }
        
        if (!hasFruitOrVeggie && droppedFoods.length > 0) {
            card.classList.add('needs-fruit-veggie');
            
            // Add alert message
            const alert = document.createElement('div');
            alert.className = 'fruit-veggie-alert';
            alert.textContent = '⚠️ Add fruit or veggie!';
            card.appendChild(alert);
        } else {
            card.classList.remove('needs-fruit-veggie');
        }
    });
}

// Setup day card buttons
function setupDayCardButtons() {
    // Setup "Bring to Top" buttons
    const bringToTopBtns = document.querySelectorAll('.bring-to-top-btn');
    bringToTopBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const dayCard = btn.closest('.day-card');
            const calendar = document.querySelector('.weekly-calendar');
            calendar.insertBefore(dayCard, calendar.firstChild);
            dayCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
    
    // Setup "View Details" buttons
    const viewDetailBtns = document.querySelectorAll('.view-detail-btn');
    viewDetailBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const day = btn.dataset.day;
            window.location.href = `daily.html?day=${day}`;
        });
    });
}

// Setup clear all functionality
function setupClearAll() {
    const clearBtn = document.getElementById('clearAllBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all meal plans? This cannot be undone.')) {
                // Clear all drop zones
                document.querySelectorAll('.drop-zone').forEach(zone => {
                    zone.innerHTML = '';
                });
                
                // Clear storage
                mealPlan = {};
                localStorage.removeItem('mealPlan');
                localStorage.removeItem('foodDetails');
                
                // Update UI
                checkFruitVeggieStatus();
                
                alert('All meal plans have been cleared.');
            }
        });
    }
}

// Save meal plan to localStorage
function saveMealPlan() {
    const dayCards = document.querySelectorAll('.day-card');
    mealPlan = {};
    
    dayCards.forEach(card => {
        const day = card.dataset.day;
        mealPlan[day] = {};
        
        const mealSections = card.querySelectorAll('.meal-section');
        mealSections.forEach(section => {
            const meal = section.dataset.meal;
            const foods = [];
            
            section.querySelectorAll('.dropped-food').forEach(food => {
                foods.push({
                    name: food.querySelector('span').textContent,
                    category: food.dataset.category
                });
            });
            
            mealPlan[day][meal] = foods;
        });
    });
    
    localStorage.setItem('mealPlan', JSON.stringify(mealPlan));
}

// Load meal plan from localStorage
function loadMealPlan() {
    const saved = localStorage.getItem('mealPlan');
    if (saved) {
        mealPlan = JSON.parse(saved);
        
        Object.keys(mealPlan).forEach(day => {
            const dayCard = document.querySelector(`[data-day="${day}"]`);
            if (!dayCard) return;
            
            Object.keys(mealPlan[day]).forEach(meal => {
                const mealSection = dayCard.querySelector(`[data-meal="${meal}"]`);
                if (!mealSection) return;
                
                const dropZone = mealSection.querySelector('.drop-zone');
                mealPlan[day][meal].forEach(food => {
                    addFoodToMeal(day, meal, food.name, food.category, dropZone);
                });
            });
        });
        
        checkFruitVeggieStatus();
    }
}

// Setup CSV export
function setupExport() {
    const exportBtn = document.getElementById('exportBtn');
    exportBtn.addEventListener('click', exportToCSV);
}

function exportToCSV() {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const meals = ['breakfast', 'lunch', 'dinner', 'snacks'];
    
    // Load food details
    const savedDetails = localStorage.getItem('foodDetails');
    const foodDetails = savedDetails ? JSON.parse(savedDetails) : {};
    
    // CSV header
    let csv = 'Day,Meal,Food,Category,Link,Notes\n';
    
    // Build CSV rows
    days.forEach(day => {
        if (mealPlan[day]) {
            meals.forEach(meal => {
                if (mealPlan[day][meal] && mealPlan[day][meal].length > 0) {
                    mealPlan[day][meal].forEach((food, index) => {
                        const detailKey = `${day}-${meal}-${index}`;
                        const details = foodDetails[detailKey] || { link: '', notes: '' };
                        
                        // Escape quotes and commas in CSV
                        const escapedNotes = details.notes.replace(/"/g, '""');
                        const escapedLink = details.link.replace(/"/g, '""');
                        
                        csv += `${day},${meal},${food.name},${food.category},"${escapedLink}","${escapedNotes}"\n`;
                    });
                }
            });
        }
    });
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'meal-plan.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Mobile touch support for drag and drop
let touchedElement = null;
let touchStartX = 0;
let touchStartY = 0;

function setupTouchSupport() {
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
}

function handleTouchStart(e) {
    const foodItem = e.target.closest('.food-item');
    if (!foodItem || e.target.classList.contains('remove-food-btn')) return;
    
    touchedElement = foodItem;
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    
    foodItem.classList.add('dragging');
    e.preventDefault();
}

function handleTouchMove(e) {
    if (!touchedElement) return;
    
    const touch = e.touches[0];
    const currentX = touch.clientX;
    const currentY = touch.clientY;
    
    // Check if we're over a drop zone
    const dropZone = document.elementFromPoint(currentX, currentY)?.closest('.drop-zone');
    
    // Remove drag-over from all drop zones
    document.querySelectorAll('.drop-zone').forEach(zone => {
        zone.classList.remove('drag-over');
    });
    
    // Add drag-over to current drop zone
    if (dropZone) {
        dropZone.classList.add('drag-over');
    }
    
    e.preventDefault();
}

function handleTouchEnd(e) {
    if (!touchedElement) return;
    
    const touch = e.changedTouches[0];
    const dropZone = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('.drop-zone');
    
    if (dropZone) {
        const foodName = touchedElement.querySelector('span').textContent;
        const category = touchedElement.dataset.category;
        const mealSection = dropZone.closest('.meal-section');
        const dayCard = dropZone.closest('.day-card');
        
        if (dayCard && mealSection) {
            const day = dayCard.dataset.day;
            const meal = mealSection.dataset.meal;
            addFoodToMeal(day, meal, foodName, category, dropZone);
            saveMealPlan();
            checkFruitVeggieStatus();
        }
    }
    
    touchedElement.classList.remove('dragging');
    document.querySelectorAll('.drop-zone').forEach(zone => {
        zone.classList.remove('drag-over');
    });
    
    touchedElement = null;
    e.preventDefault();
}

// Initialize touch support
setupTouchSupport();
