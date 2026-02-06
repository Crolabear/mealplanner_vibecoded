// Meal plan data storage
let mealPlan = {};

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    loadMealPlan();
    setupDragAndDrop();
    setupCustomFood();
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
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', e.target.textContent);
    e.dataTransfer.setData('category', e.target.dataset.category);
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
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

// Custom food functionality
function setupCustomFood() {
    const addBtn = document.getElementById('addCustomFood');
    const input = document.getElementById('customFood');
    
    addBtn.addEventListener('click', () => {
        const foodName = input.value.trim();
        if (foodName) {
            addCustomFoodItem(foodName);
            input.value = '';
        }
    });
    
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addBtn.click();
        }
    });
}

function addCustomFoodItem(foodName) {
    const container = document.getElementById('customFoodItems');
    const foodItem = document.createElement('div');
    foodItem.className = 'food-item';
    foodItem.draggable = true;
    foodItem.dataset.category = 'other';
    foodItem.textContent = foodName;
    
    foodItem.addEventListener('dragstart', handleDragStart);
    foodItem.addEventListener('dragend', handleDragEnd);
    
    container.appendChild(foodItem);
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
