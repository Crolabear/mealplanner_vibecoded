// Meal plan data storage
let mealPlan = {};

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    loadMealPlan();
    setupDragAndDrop();
    setupCategoryManagement();
    highlightToday();
    setupDayCardClicks();
    checkFruitVeggieStatus();
    setupExport();
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
}

function handleDragEnd(e) {
    const foodItem = e.target.closest('.food-item');
    if (foodItem) {
        foodItem.classList.remove('dragging');
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const foodName = e.dataTransfer.getData('text/plain');
    const category = e.dataTransfer.getData('category');
    const dropZone = e.currentTarget;
    const mealSection = dropZone.closest('.meal-section');
    const dayCard = dropZone.closest('.day-card');
    const day = dayCard.dataset.day;
    const meal = mealSection.dataset.meal;
    
    addFoodToMeal(day, meal, foodName, category, dropZone);
    saveMealPlan();
    checkFruitVeggieStatus();
}

function addFoodToMeal(day, meal, foodName, category, dropZone) {
    const foodElement = document.createElement('div');
    foodElement.className = 'dropped-food';
    foodElement.dataset.category = category;
    foodElement.innerHTML = `
        <span>${foodName}</span>
        <button class="remove-btn">×</button>
    `;
    
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
    
    const categoryElement = document.createElement('div');
    categoryElement.className = 'category';
    categoryElement.dataset.category = categoryId;
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

// Setup day card clicks to navigate to daily page
function setupDayCardClicks() {
    const dayCards = document.querySelectorAll('.day-card');
    
    dayCards.forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('remove-btn')) {
                const day = card.dataset.day;
                window.location.href = `daily.html?day=${day}`;
            }
        });
    });
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
